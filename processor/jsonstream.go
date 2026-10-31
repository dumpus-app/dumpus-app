package processor

import (
	"bufio"
	"errors"
	"io"
)

// encoding/json fails deeper documents too.
const maxJSONDepth = 10000

// jsonStream walks a JSON document as it is read, validating it like
// `json.Valid` while keeping only the few bytes asked for, so that a file of
// any size is read in constant memory.
type jsonStream struct {
	r   *bufio.Reader
	err error // errSyntax for a malformed document, else the read error
	buf []byte
}

func newJSONStream(r io.Reader) *jsonStream {
	return &jsonStream{r: bufio.NewReaderSize(r, 64<<10)}
}

func (s *jsonStream) fail() {
	if s.err == nil {
		s.err = errSyntax
	}
}

// byte reads one byte; at the end of the input, which a caller asking for a
// byte doesn't expect, the document is malformed.
func (s *jsonStream) byte() byte {
	if s.err != nil {
		return 0
	}
	c, err := s.r.ReadByte()
	if errors.Is(err, io.EOF) {
		s.fail()
	} else if err != nil {
		s.err = err
	}
	return c
}

func (s *jsonStream) nonSpace() byte {
	for {
		c := s.byte()
		if s.err != nil || !isSpace(c) {
			return c
		}
	}
}

// end checks that only whitespace follows the document.
func (s *jsonStream) end() {
	for s.err == nil {
		c, err := s.r.ReadByte()
		if errors.Is(err, io.EOF) {
			return
		}
		if err != nil {
			s.err = err
			return
		}
		if !isSpace(c) {
			s.fail()
		}
	}
}

// str reads the rest of a string after its opening quote and returns up to
// keep of its raw bytes, escapes undecoded, and whether that is all of it.
func (s *jsonStream) str(keep int) (raw []byte, whole bool) {
	s.buf = s.buf[:0]
	whole = true
	add := func(c byte) {
		if len(s.buf) < keep {
			s.buf = append(s.buf, c)
		} else {
			whole = false
		}
	}
	for {
		c := s.byte()
		switch {
		case s.err != nil:
			return nil, false
		case c == '"':
			return s.buf, whole
		case c < 0x20:
			s.fail()
			return nil, false
		case c == '\\':
			add(c)
			e := s.byte()
			add(e)
			switch e {
			case '"', '\\', '/', 'b', 'f', 'n', 'r', 't':
			case 'u':
				for range 4 {
					h := s.byte()
					if !isHex(h) {
						s.fail()
						return nil, false
					}
					add(h)
				}
			default:
				s.fail()
				return nil, false
			}
		default:
			add(c)
		}
	}
}

func isHex(c byte) bool {
	return '0' <= c && c <= '9' || 'a' <= c && c <= 'f' || 'A' <= c && c <= 'F'
}

func isDigit(c byte) bool { return '0' <= c && c <= '9' }

// value skips the value starting with the byte c, already read.
func (s *jsonStream) value(c byte, depth int) {
	if depth > maxJSONDepth {
		s.fail()
		return
	}
	switch {
	case s.err != nil:
	case c == '"':
		s.str(0)
	case c == '{':
		c = s.nonSpace()
		if c == '}' {
			return
		}
		for s.err == nil {
			if c != '"' {
				s.fail()
				return
			}
			s.str(0)
			if s.nonSpace() != ':' {
				s.fail()
				return
			}
			s.value(s.nonSpace(), depth+1)
			var done bool
			if c, done = s.close('}'); done {
				return
			}
		}
	case c == '[':
		c = s.nonSpace()
		if c == ']' {
			return
		}
		for s.err == nil {
			s.value(c, depth+1)
			var done bool
			if c, done = s.close(']'); done {
				return
			}
		}
	case c == 't':
		s.literal("rue")
	case c == 'f':
		s.literal("alse")
	case c == 'n':
		s.literal("ull")
	case c == '-' || isDigit(c):
		s.number(c)
	default:
		s.fail()
	}
}

// close reads what follows a member or an element: the closing byte, which
// ends the container, or a comma, after which it returns the next non-space
// byte.
func (s *jsonStream) close(closing byte) (next byte, done bool) {
	switch c := s.nonSpace(); {
	case s.err != nil:
		return 0, true
	case c == closing:
		return c, true
	case c == ',':
		return s.nonSpace(), false
	}
	s.fail()
	return 0, true
}

func (s *jsonStream) literal(rest string) {
	for i := range len(rest) {
		if s.byte() != rest[i] {
			s.fail()
			return
		}
	}
}

// number reads a number whose first byte c was already read, leaving the byte
// that ends it unread.
func (s *jsonStream) number(c byte) {
	digits := func() int {
		n := 0
		for {
			b, err := s.r.ReadByte()
			if err != nil {
				if !errors.Is(err, io.EOF) {
					s.err = err
				}
				return n
			}
			if !isDigit(b) {
				s.r.UnreadByte()
				return n
			}
			n++
		}
	}
	peek := func() byte {
		b, err := s.r.ReadByte()
		if err != nil {
			if !errors.Is(err, io.EOF) {
				s.err = err
			}
			return 0
		}
		s.r.UnreadByte()
		return b
	}
	if c == '-' {
		c = s.byte()
		if !isDigit(c) {
			s.fail()
			return
		}
	}
	if c != '0' {
		digits()
	}
	if peek() == '.' {
		s.byte()
		if digits() == 0 {
			s.fail()
			return
		}
	}
	if b := peek(); b == 'e' || b == 'E' {
		s.byte()
		if b = peek(); b == '+' || b == '-' {
			s.byte()
		}
		if digits() == 0 {
			s.fail()
		}
	}
}
