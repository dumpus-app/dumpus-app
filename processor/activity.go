package processor

import (
	"archive/zip"
	"bytes"
	"context"
	"hash/crc32"
	"io"
	"sync"
	"sync/atomic"
)

const (
	chunkSize   = 4 << 20
	readBufSize = 1 << 20
)

// chunk is a run of whole lines of the activity stream. seq orders chunks as
// they appear in the stream; the buffer goes back to the pool once both the
// line workers and the checksum have seen it.
type chunk struct {
	buf  []byte
	data []byte // the whole lines, a prefix of buf
	seq  uint32
	refs atomic.Int32
}

// readActivity streams the activity entry: this goroutine inflates it and cuts
// it into chunks of whole lines, the workers decode and aggregate the lines,
// and one more goroutine checksums the chunks in order, off the inflating core.
func readActivity(ctx context.Context, f *zip.File, workers int) (*activityAgg, error) {
	r, err := openEntry(f, false)
	if err != nil {
		return nil, err
	}
	defer r.Close()

	nbuf := 2*workers + 2
	free := make(chan *chunk, nbuf)
	for range nbuf {
		free <- &chunk{buf: make([]byte, chunkSize)}
	}
	release := func(c *chunk) {
		if c.refs.Add(-1) == 0 {
			free <- c
		}
	}
	work := make(chan *chunk, nbuf)
	sums := make(chan *chunk, nbuf)

	var usable atomic.Bool
	path := maskPath(f.Name)
	aggs := make([]*activityAgg, workers)
	var wg sync.WaitGroup
	for i := range workers {
		aggs[i] = newActivityAgg()
		lr := &lineReader{agg: aggs[i], path: path, usable: &usable}
		wg.Go(func() {
			for c := range work {
				lr.readChunk(c)
				release(c)
			}
		})
	}
	crc := crc32.NewIEEE()
	wg.Go(func() {
		for c := range sums {
			crc.Write(c.data)
			release(c)
		}
	})

	err = splitLines(ctx, r, free, work, sums)
	close(work)
	close(sums)
	wg.Wait()
	if err != nil {
		return nil, err
	}
	if f.CRC32 != 0 && crc.Sum32() != f.CRC32 {
		return nil, zip.ErrChecksum
	}
	total := aggs[0]
	for _, a := range aggs[1:] {
		total.merge(a)
	}
	total.usable = usable.Load()
	return total, nil
}

// A line longer than a chunk gets a larger buffer.
func splitLines(ctx context.Context, r io.Reader, free chan *chunk, work, sums chan<- *chunk) error {
	var carry []byte
	var seq uint32
	for {
		var c *chunk
		select {
		case c = <-free:
		case <-ctx.Done():
			return ctx.Err()
		}
		if len(c.buf) < 2*len(carry) {
			c.buf = make([]byte, 2*len(carry))
		}
		n := copy(c.buf, carry)
		carry = carry[:0]
		eof := false
		for n < len(c.buf) && !eof {
			m, err := r.Read(c.buf[n:])
			n += m
			if err == io.EOF {
				eof = true
			} else if err != nil {
				return err
			}
		}
		data := c.buf[:n]
		if !eof {
			cut := bytes.LastIndexByte(data, '\n')
			if cut < 0 {
				carry = append(carry, data...)
				free <- c
				continue
			}
			carry = append(carry, data[cut+1:]...)
			data = data[:cut+1]
		}
		if len(data) == 0 {
			free <- c
		} else {
			c.data, c.seq = data, seq
			seq++
			c.refs.Store(2)
			work <- c
			sums <- c
		}
		if eof {
			return nil
		}
	}
}

func (r *lineReader) readChunk(c *chunk) {
	data := c.data
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
		line = bytes.TrimSuffix(line, []byte{'\r'})
		r.line(line, base|n)
	}
}
