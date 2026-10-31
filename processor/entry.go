package processor

import (
	"archive/zip"
	"bufio"
	"bytes"
	"fmt"
	"hash"
	"hash/crc32"
	"io"

	"github.com/klauspost/compress/flate"
)

const maxReadBuf = 1 << 20

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

func openEntry(f *zip.File, checksum bool) (*entryReader, error) {
	raw, err := f.OpenRaw()
	if err != nil {
		return nil, err
	}
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

// readAll reads and checks a whole entry. Errors name the entry by its masked
// path.
func readAll(f *zip.File) ([]byte, error) {
	data, err := readEntry(f)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", maskPath(f.Name), err)
	}
	return data, nil
}

func readEntry(f *zip.File) ([]byte, error) {
	e, err := openEntry(f, true)
	if err != nil {
		return nil, err
	}
	defer e.Close()
	buf := bytes.NewBuffer(make([]byte, 0, min(f.UncompressedSize64, 64<<20)))
	if _, err := buf.ReadFrom(e); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
