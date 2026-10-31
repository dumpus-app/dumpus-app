package processor

import (
	"bytes"
	"encoding/json"
	"errors"
	"strconv"
)

// The package files are walked with this small scanner rather than decoded into
// structs: `encoding/json` matches object keys case-insensitively, while the
// reference only sees exact keys, and most of each object is never needed.
// Callers validate a document with `json.Valid` before walking it.

var errSyntax = errors.New("malformed JSON")

type jsonKind uint8

const (
	kindInvalid jsonKind = iota
	kindNull
	kindBool
	kindNumber
	kindString
	kindArray
	kindObject
)

func kindOf(v []byte) jsonKind {
	if len(v) == 0 {
		return kindInvalid
	}
	switch v[0] {
	case 'n':
		return kindNull
	case 't', 'f':
		return kindBool
	case '"':
		return kindString
	case '[':
		return kindArray
	case '{':
		return kindObject
	case '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9':
		return kindNumber
	}
	return kindInvalid
}

func isSpace(c byte) bool {
	return c == ' ' || c == '\t' || c == '\n' || c == '\r'
}

func skipSpace(b []byte, i int) int {
	for i < len(b) && isSpace(b[i]) {
		i++
	}
	return i
}

func skipString(b []byte, i int) (int, error) {
	i++
	for i < len(b) {
		j := bytes.IndexAny(b[i:], `"\`)
		if j < 0 {
			return 0, errSyntax
		}
		i += j
		if b[i] == '"' {
			return i + 1, nil
		}
		i += 2
	}
	return 0, errSyntax
}

func skipValue(b []byte, i int) (int, error) {
	if i >= len(b) {
		return 0, errSyntax
	}
	switch b[i] {
	case '"':
		return skipString(b, i)
	case '{', '[':
		depth := 0
		for i < len(b) {
			switch b[i] {
			case '"':
				end, err := skipString(b, i)
				if err != nil {
					return 0, err
				}
				i = end
				continue
			case '{', '[':
				depth++
			case '}', ']':
				depth--
				if depth == 0 {
					return i + 1, nil
				}
			}
			i++
		}
		return 0, errSyntax
	default:
		j := i
		for j < len(b) {
			c := b[j]
			if c == ',' || c == '}' || c == ']' || isSpace(c) {
				break
			}
			j++
		}
		if j == i {
			return 0, errSyntax
		}
		return j, nil
	}
}

// eachMember calls fn with the raw key (without quotes, still escaped) and the raw
// value of every member of the object in b, in document order. It stops early when
// fn returns false.
func eachMember(b []byte, fn func(key, value []byte) bool) error {
	i := skipSpace(b, 0)
	if i >= len(b) || b[i] != '{' {
		return errSyntax
	}
	i = skipSpace(b, i+1)
	if i < len(b) && b[i] == '}' {
		return nil
	}
	for {
		if i >= len(b) || b[i] != '"' {
			return errSyntax
		}
		kend, err := skipString(b, i)
		if err != nil {
			return err
		}
		key := b[i+1 : kend-1]
		i = skipSpace(b, kend)
		if i >= len(b) || b[i] != ':' {
			return errSyntax
		}
		i = skipSpace(b, i+1)
		vend, err := skipValue(b, i)
		if err != nil {
			return err
		}
		if !fn(key, b[i:vend]) {
			return nil
		}
		i = skipSpace(b, vend)
		if i >= len(b) {
			return errSyntax
		}
		if b[i] == '}' {
			return nil
		}
		if b[i] != ',' {
			return errSyntax
		}
		i = skipSpace(b, i+1)
	}
}

func eachElement(b []byte, fn func(value []byte) bool) error {
	i := skipSpace(b, 0)
	if i >= len(b) || b[i] != '[' {
		return errSyntax
	}
	i = skipSpace(b, i+1)
	if i < len(b) && b[i] == ']' {
		return nil
	}
	for {
		vend, err := skipValue(b, i)
		if err != nil {
			return err
		}
		if !fn(b[i:vend]) {
			return nil
		}
		i = skipSpace(b, vend)
		if i >= len(b) {
			return errSyntax
		}
		if b[i] == ']' {
			return nil
		}
		if b[i] != ',' {
			return errSyntax
		}
		i = skipSpace(b, i+1)
	}
}

func keyString(raw []byte) string {
	if bytes.IndexByte(raw, '\\') < 0 {
		return string(raw)
	}
	var s string
	quoted := make([]byte, 0, len(raw)+2)
	quoted = append(append(append(quoted, '"'), raw...), '"')
	if json.Unmarshal(quoted, &s) != nil {
		return string(raw)
	}
	return s
}

// members collects the members of an object into a map, the last duplicate
// winning as it does for Python's dict, plus the keys in first-seen order.
type members struct {
	keys   []string
	values map[string][]byte
}

func objectMembers(b []byte) (members, error) {
	m := members{values: map[string][]byte{}}
	err := eachMember(b, func(key, value []byte) bool {
		k := keyString(key)
		if _, seen := m.values[k]; !seen {
			m.keys = append(m.keys, k)
		}
		m.values[k] = value
		return true
	})
	return m, err
}

func (m members) get(key string) ([]byte, bool) {
	v, ok := m.values[key]
	return v, ok
}

var errNotObject = errors.New("not a JSON object")

func parseObject(data []byte) (members, error) {
	if !json.Valid(data) {
		return members{}, errSyntax
	}
	if kindOf(data[skipSpace(data, 0):]) != kindObject {
		return members{}, errNotObject
	}
	return objectMembers(data)
}

func problemOf(err error) string {
	if errors.Is(err, errNotObject) {
		return ProblemWrongType
	}
	return ProblemMalformed
}

func decodeString(v []byte) (string, bool) {
	if len(v) < 2 || v[0] != '"' {
		return "", false
	}
	inner := v[1 : len(v)-1]
	if bytes.IndexByte(inner, '\\') < 0 {
		return string(inner), true
	}
	var s string
	if json.Unmarshal(v, &s) != nil {
		return "", false
	}
	return s, true
}

// number is a JSON number as Python's json loader would type it: an int when the
// literal has no fraction or exponent, else a float.
type number struct {
	isInt bool
	i     int64
	f     float64
}

func decodeNumber(v []byte) (number, bool) {
	if bytes.ContainsAny(v, ".eE") {
		f, err := strconv.ParseFloat(string(v), 64)
		return number{f: f}, err == nil
	}
	i, err := strconv.ParseInt(string(v), 10, 64)
	if err != nil {
		// orjson reads integers past 64 bits as floats.
		f, ferr := strconv.ParseFloat(string(v), 64)
		return number{f: f}, ferr == nil
	}
	return number{isInt: true, i: i}, true
}
