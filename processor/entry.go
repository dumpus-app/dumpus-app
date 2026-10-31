package processor

import (
	"archive/zip"
	"bufio"
	"bytes"
	"cmp"
	"errors"
	"fmt"
	"hash"
	"hash/crc32"
	"io"
	"slices"
	"sync"
	"sync/atomic"

	"github.com/klauspost/compress/flate"
)

const maxReadBuf = 1 << 20

var errSharedData = errors.New("zip: entries share compressed data")

type pkg struct {
	*entries
	lim     limits
	iss     *issues
	allowed map[*zip.File]bool // the entries within the inflate budget
	skipped atomic.Bool        // an entry, folder or line was left out: the package is partial

	mu      sync.Mutex
	opened  []dataRange
	claimed map[*zip.File]bool
}

type dataRange struct{ start, end int64 }

func newPkg(zr *zip.Reader, lim limits, iss *issues) *pkg {
	return &pkg{entries: indexEntries(zr), lim: lim, iss: iss, allowed: map[*zip.File]bool{}, claimed: map[*zip.File]bool{}}
}

// budget allows each entry, in a fixed order, whose declared size still fits in
// what is left of total, so that what gets skipped doesn't depend on timing.
// The declared size holds since an entry fails as soon as it inflates past it.
func (p *pkg) budget(order []*zip.File, total uint64) {
	var used uint64
	for _, f := range order {
		if p.allowed[f] {
			continue
		}
		if f.UncompressedSize64 > total-used {
			p.skip(f, ProblemOverBudget)
			continue
		}
		used += f.UncompressedSize64
		p.allowed[f] = true
	}
}

// skip reports an entry the processor leaves out, a duplicate or past a limit,
// which makes the package partial.
func (p *pkg) skip(f *zip.File, problem string) {
	p.iss.add(f.Name, "", "", problem, 1)
	p.skipped.Store(true)
}

// readWhole reads and checks a whole entry. ok is false when a limit skipped
// it, which is reported; errors name the entry by its masked path.
func (p *pkg) readWhole(f *zip.File) (data []byte, ok bool, err error) {
	switch {
	case !p.allowed[f]:
		return nil, false, nil
	case f.UncompressedSize64 > p.lim.entryBytes:
		p.skip(f, ProblemTooLarge)
		return nil, false, nil
	}
	e, err := p.open(f, true)
	if err != nil {
		return nil, false, fmt.Errorf("%s: %w", maskPath(f.Name), err)
	}
	defer e.Close()
	buf := bytes.NewBuffer(make([]byte, 0, f.UncompressedSize64+bytes.MinRead))
	if _, err := buf.ReadFrom(e); err != nil {
		return nil, false, fmt.Errorf("%s: %w", maskPath(f.Name), err)
	}
	return buf.Bytes(), true, nil
}

// open inflates an entry and records where its compressed data lies, for
// checkShared.
func (p *pkg) open(f *zip.File, checksum bool) (*entryReader, error) {
	raw, err := f.OpenRaw()
	if err != nil {
		return nil, err
	}
	var start int64
	if sr, ok := raw.(*io.SectionReader); ok {
		_, start, _ = sr.Outer()
	} else if start, err = f.DataOffset(); err != nil {
		return nil, err
	}
	if end := start + int64(f.CompressedSize64); end > start {
		p.mu.Lock()
		if !p.claimed[f] {
			p.claimed[f] = true
			p.opened = append(p.opened, dataRange{start: start, end: end})
		}
		p.mu.Unlock()
	}
	return newEntryReader(f, raw, checksum)
}

// checkShared fails a package two of whose entries read share compressed data,
// as Python's `zipfile` refuses overlapped entries. The inflate budget already
// bounds what such entries cost, so the check runs once, after the reads.
func (p *pkg) checkShared() error {
	slices.SortFunc(p.opened, func(a, b dataRange) int { return cmp.Compare(a.start, b.start) })
	for i := 1; i < len(p.opened); i++ {
		if p.opened[i].start < p.opened[i-1].end {
			return errSharedData
		}
	}
	return nil
}

// entryReader inflates a zip entry, reading its compressed data through a
// buffer sized to it: a small entry costs one `ReadAt` for its header and one
// for its data, a large one a `ReadAt` per MiB. `zip.File.Open` makes one per
// 4 KiB, a request each when the package is read over HTTP. It fails as soon as
// the entry yields more than its declared size.
type entryReader struct {
	r     io.Reader
	close func() error
	f     *zip.File
	n     uint64
	crc   hash.Hash32 // nil when the caller checksums the data itself
}

func newEntryReader(f *zip.File, raw io.Reader, checksum bool) (*entryReader, error) {
	br := bufio.NewReaderSize(raw, int(min(max(f.CompressedSize64, 16), maxReadBuf)))
	e := &entryReader{f: f, close: func() error { return nil }}
	switch f.Method {
	case zip.Store:
		e.r = br
	case zip.Deflate:
		fr := flate.NewReader(br)
		e.r, e.close = fr, fr.Close
	default:
		return nil, fmt.Errorf("%w: compression method %d", zip.ErrAlgorithm, f.Method)
	}
	if checksum {
		e.crc = crc32.NewIEEE()
	}
	return e, nil
}

func (e *entryReader) Read(p []byte) (int, error) {
	n, err := e.r.Read(p)
	e.n += uint64(n)
	if e.n > e.f.UncompressedSize64 {
		return 0, fmt.Errorf("%w: more data than the declared size", zip.ErrFormat)
	}
	if e.crc != nil {
		e.crc.Write(p[:n])
	}
	if err == io.EOF {
		if e.n != e.f.UncompressedSize64 {
			return n, io.ErrUnexpectedEOF
		}
		if e.crc != nil && e.f.CRC32 != 0 && e.crc.Sum32() != e.f.CRC32 {
			return n, zip.ErrChecksum
		}
	}
	return n, err
}

func (e *entryReader) Close() error { return e.close() }
