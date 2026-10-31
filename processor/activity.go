package processor

import (
	"archive/zip"
	"bytes"
	"context"
	"hash/crc32"
	"io"
	"slices"
	"sync"
	"sync/atomic"
)

const defaultChunkBytes = 4 << 20

type activityConfig struct {
	workers, chunkBytes, lineBytes int
	events                         int64 // relevant events kept, see limits
}

// chunk is a run of the activity stream. seq numbers the chunks with lines in
// stream order; the buffer goes back to the pool once both the line workers
// and the checksum have seen it.
type chunk struct {
	buf   []byte
	fresh []byte // the bytes read into this chunk, after those carried over
	lines []byte // the whole lines to decode
	seq   uint32
	refs  atomic.Int32
}

type stream struct {
	path      string // masked, for the report
	lineBytes int
	names     *names
	// Once a line with a top-level `event_type` was seen, lines of unused
	// types need no decoding at all.
	usable atomic.Bool
	// Once the event limit cut the stream, the lines after the cut are only
	// counted.
	setAside atomic.Bool
}

type chunkResult struct {
	seq uint32
	agg *activityAgg
}

// readActivity streams the activity entry: this goroutine inflates it and cuts
// it into chunks of whole lines, the workers decode and aggregate the lines,
// and one more goroutine checksums the chunks in order, off the inflating core.
func readActivity(ctx context.Context, p *pkg, f *zip.File, cfg activityConfig) (*activityAgg, error) {
	var r io.Reader
	if p.shared[f] != nil {
		data, ok, err := p.readWhole(f)
		if err != nil {
			return nil, err
		}
		if ok {
			r = bytes.NewReader(data)
		}
	}
	if r == nil {
		e, err := p.open(f, false)
		if err != nil {
			return nil, err
		}
		defer e.Close()
		r = e
	}

	nbuf := cfg.workers + 2
	free := make(chan *chunk, nbuf)
	for range nbuf {
		free <- &chunk{buf: make([]byte, cfg.chunkBytes)}
	}
	release := func(c *chunk) {
		if c.refs.Add(-1) == 0 {
			free <- c
		}
	}
	work := make(chan *chunk, nbuf)
	sums := make(chan *chunk, nbuf)

	s := &stream{path: maskPath(f.Name), lineBytes: cfg.lineBytes, names: newNames()}
	results := make(chan chunkResult, nbuf)
	var workers sync.WaitGroup
	for range cfg.workers {
		lr := &lineReader{s: s}
		workers.Go(func() {
			// Events are appended to buffers kept across chunks, then copied
			// at their final size: growing a slice per chunk would allocate
			// several times what it holds.
			var sessions []sessionEvent
			var voice []voiceEvent
			for c := range work {
				seq := c.seq
				a := newActivityAgg()
				a.sessions, a.voice = sessions[:0], voice[:0]
				lr.agg = a
				lr.readChunk(c)
				release(c)
				sessions, voice = a.sessions, a.voice
				a.sessions, a.voice = slices.Clone(a.sessions), slices.Clone(a.voice)
				results <- chunkResult{seq, a}
			}
		})
	}
	var others sync.WaitGroup
	crc := crc32.NewIEEE()
	others.Go(func() {
		for c := range sums {
			crc.Write(c.fresh)
			release(c)
		}
	})
	// Chunks are merged in stream order, so that the event limit cuts the
	// stream at the same chunk whatever the timing.
	total := newActivityAgg()
	others.Go(func() {
		pending := map[uint32]*activityAgg{}
		var next uint32
		for res := range results {
			pending[res.seq] = res.agg
			for a := pending[next]; a != nil; a = pending[next] {
				delete(pending, next)
				next++
				if !s.setAside.Load() && total.events+a.events > cfg.events {
					s.setAside.Store(true)
				}
				if s.setAside.Load() {
					total.lines += a.lines
					total.tooLong += a.tooLong
				} else {
					total.merge(a)
				}
			}
		}
	})

	dropped, err := splitLines(ctx, r, cfg, free, work, sums)
	close(work)
	close(sums)
	workers.Wait()
	close(results)
	others.Wait()
	for len(free) > 0 {
		<-free
	}
	if err != nil {
		return nil, err
	}
	if f.CRC32 != 0 && crc.Sum32() != f.CRC32 {
		return nil, zip.ErrChecksum
	}
	total.usable = s.usable.Load()
	total.names = s.names
	total.sessions, total.sessionParts = join(total.sessionParts), nil
	total.voice, total.voiceParts = join(total.voiceParts), nil
	if n := total.tooLong + dropped; n > 0 {
		// A skipped line can be an event the reference keeps.
		total.issues[issueKey{s.path, "", "", ProblemTooLong}] += n
		p.skipped.Store(true)
	}
	switch {
	case s.setAside.Load():
		total.setAside()
		total.events = cfg.events
		total.issues[issueKey{s.path, "", "", ProblemTooManyEvents}]++
	case total.failed > 0 && total.read == 0:
		// A format change that breaks every event the reference takes would
		// otherwise give a package with no activity that claims to be
		// complete, whatever events it skips without a problem.
		total.usable = false
		total.issues[issueKey{s.path, "", "", ProblemNoEventRead}] += int(total.failed)
	}
	return total, nil
}

// splitLines cuts the stream into chunks of whole lines. Every chunk goes to the
// checksum, which sees each byte once, and its lines to a worker. A line longer
// than cfg.lineBytes is dropped as it is read, so a buffer only grows to twice
// that.
func splitLines(ctx context.Context, r io.Reader, cfg activityConfig, free chan *chunk, work, sums chan<- *chunk) (dropped int, err error) {
	var (
		carry    []byte // the start of a line the previous chunk cut
		skipping bool   // inside a line too long to keep
		seq      uint32
	)
	for {
		var c *chunk
		select {
		case c = <-free:
		case <-ctx.Done():
			return dropped, ctx.Err()
		}
		size := max(cfg.chunkBytes, 2*len(carry))
		if cap(c.buf) != size {
			c.buf = make([]byte, size)
		}
		buf := c.buf[:cap(c.buf)]
		start := copy(buf, carry)
		carry = carry[:0]
		n, eof, err := fill(r, buf, start)
		if err != nil {
			return dropped, err
		}
		c.fresh = buf[start:n]
		lines := buf[:n]
		if skipping {
			if i := bytes.IndexByte(lines, '\n'); i >= 0 {
				lines, skipping = lines[i+1:], false
			} else {
				lines = nil
			}
		}
		if !skipping && !eof {
			rest := lines
			if cut := bytes.LastIndexByte(lines, '\n'); cut >= 0 {
				lines, rest = lines[:cut+1], lines[cut+1:]
			} else {
				lines = nil
			}
			if len(rest) > cfg.lineBytes {
				skipping = true
				dropped++
			} else {
				carry = append(carry, rest...)
			}
		}
		c.lines = lines
		if len(lines) > 0 {
			c.seq = seq
			seq++
			c.refs.Store(2)
			work <- c
		} else {
			c.refs.Store(1)
		}
		sums <- c
		if eof {
			return dropped, nil
		}
	}
}

// join concatenates parts at their final size, letting each part go once
// copied.
func join[E any](parts [][]E) []E {
	n := 0
	for _, p := range parts {
		n += len(p)
	}
	if n == 0 {
		return nil
	}
	out := make([]E, 0, n)
	for i, p := range parts {
		out = append(out, p...)
		parts[i] = nil
	}
	return out
}

func fill(r io.Reader, buf []byte, n int) (int, bool, error) {
	for n < len(buf) {
		m, err := r.Read(buf[n:])
		n += m
		if err == io.EOF {
			return n, true, nil
		}
		if err != nil {
			return n, false, err
		}
	}
	return n, false, nil
}

func (r *lineReader) readChunk(c *chunk) {
	data := c.lines
	// A line's position is its chunk in the high 32 bits and its line within
	// the chunk in the low 32: chunks of a few MiB keep both far from overflow.
	base := uint64(c.seq) << 32
	for n := uint64(0); len(data) > 0; n++ {
		var line []byte
		if i := bytes.IndexByte(data, '\n'); i >= 0 {
			line, data = data[:i], data[i+1:]
		} else {
			line, data = data, nil
		}
		switch {
		case len(line) > r.s.lineBytes:
			r.agg.tooLong++
		case r.s.setAside.Load():
			r.agg.lines++
		default:
			r.line(bytes.TrimSuffix(line, []byte{'\r'}), base|n)
		}
	}
}
