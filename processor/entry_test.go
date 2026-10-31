package processor

import (
	"archive/zip"
	"bytes"
	"compress/flate"
	"context"
	"errors"
	"hash/crc32"
	"io"
	"math/rand/v2"
	"sync/atomic"
	"testing"
)

type countingReaderAt struct {
	r     io.ReaderAt
	calls atomic.Int64
}

func (c *countingReaderAt) ReadAt(p []byte, off int64) (int, error) {
	c.calls.Add(1)
	return c.r.ReadAt(p, off)
}

// TestEntryReadCalls pins how many reads an entry costs, each of which is a
// request when the package is read over HTTP.
func TestEntryReadCalls(t *testing.T) {
	rng := rand.New(rand.NewPCG(20261030, 4))
	noise := make([]byte, 3<<20)
	for i := range noise {
		noise[i] = byte(rng.IntN(256))
	}
	r, size := zipOf(t, []entry{
		{"Messages/index.json", `{"400000000000000001": "general"}`},
		{"Messages/c400000000000000001/messages.json", string(noise)},
	})
	cr := &countingReaderAt{r: r}
	zr, err := zip.NewReader(cr, size)
	if err != nil {
		t.Fatal(err)
	}
	p := newPkg(zr, cr, defaultLimits, &issues{})
	p.budget(zr.File, defaultLimits.inflateBudget(size))
	// One read for each local header, then one per MiB of compressed data.
	before := cr.calls.Load()
	if err := p.locate(context.Background(), 2); err != nil {
		t.Fatal(err)
	}
	if got := cr.calls.Load() - before; got != int64(len(zr.File)) {
		t.Errorf("%d reads to locate %d entries", got, len(zr.File))
	}
	for _, f := range zr.File {
		before := cr.calls.Load()
		if _, ok, err := p.readWhole(f); err != nil || !ok {
			t.Fatal(ok, err)
		}
		want := (int64(f.CompressedSize64) + maxReadBuf - 1) / maxReadBuf
		if got := cr.calls.Load() - before; got > want {
			t.Errorf("%s: %d reads for %d compressed bytes, want at most %d", f.Name, got, f.CompressedSize64, want)
		}
	}
}

// TestEntryLargerThanDeclared stops inflating as soon as an entry passes the
// size its header declares.
func TestEntryLargerThanDeclared(t *testing.T) {
	data := bytes.Repeat([]byte("x"), 8<<20)
	var deflated bytes.Buffer
	fw, err := flate.NewWriter(&deflated, flate.BestCompression)
	if err != nil {
		t.Fatal(err)
	}
	fw.Write(data)
	fw.Close()

	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	w, err := zw.CreateRaw(&zip.FileHeader{
		Name: "Messages/index.json", Method: zip.Deflate, CRC32: crc32.ChecksumIEEE(data),
		CompressedSize64: uint64(deflated.Len()), UncompressedSize64: 100,
	})
	if err != nil {
		t.Fatal(err)
	}
	w.Write(deflated.Bytes())
	zw.Close()

	r := bytes.NewReader(buf.Bytes())
	zr, err := zip.NewReader(r, int64(buf.Len()))
	if err != nil {
		t.Fatal(err)
	}
	p := newPkg(zr, r, defaultLimits, &issues{})
	p.budget(zr.File, defaultLimits.inflateBudget(int64(buf.Len())))
	if err := p.locate(context.Background(), 1); err != nil {
		t.Fatal(err)
	}
	e, err := p.open(zr.File[0], true)
	if err != nil {
		t.Fatal(err)
	}
	n, err := io.Copy(io.Discard, e)
	if !errors.Is(err, zip.ErrFormat) {
		t.Errorf("err = %v, want zip.ErrFormat", err)
	}
	if n > 1<<20 {
		t.Errorf("%d bytes read before failing", n)
	}
}
