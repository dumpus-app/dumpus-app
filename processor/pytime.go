package processor

import (
	"strconv"
	"time"
	"unicode/utf8"
)

const (
	secondsPerHour = 3600
	secondsPerDay  = 86400
)

// pyIntASCII parses s the way Python's int() parses a str of ASCII characters:
// surrounding whitespace, an optional sign and single underscores between digits.
func pyIntASCII[S ~string | ~[]byte](s S) (int, bool) {
	isPySpace := func(c byte) bool {
		return c == ' ' || (c >= '\t' && c <= '\r') || (c >= 0x1c && c <= 0x1f)
	}
	for len(s) > 0 && isPySpace(s[0]) {
		s = s[1:]
	}
	for len(s) > 0 && isPySpace(s[len(s)-1]) {
		s = s[:len(s)-1]
	}
	neg := false
	if len(s) > 0 && (s[0] == '+' || s[0] == '-') {
		neg = s[0] == '-'
		s = s[1:]
	}
	if len(s) == 0 {
		return 0, false
	}
	n := 0
	prevDigit := false
	for i := 0; i < len(s); i++ {
		c := s[i]
		switch {
		case c >= '0' && c <= '9':
			n = n*10 + int(c-'0')
			if n > 1e9 {
				return 0, false
			}
			prevDigit = true
		case c == '_' && prevDigit && i+1 < len(s) && s[i+1] >= '0' && s[i+1] <= '9':
			prevDigit = false
		default:
			return 0, false
		}
	}
	if neg {
		n = -n
	}
	return n, true
}

// pySlice returns s[start:end] with Python's clamping, counting code points.
func pySlice[S ~string | ~[]byte](s S, start, end int) S {
	if isASCII(s) {
		start, end = min(start, len(s)), min(end, len(s))
		return s[start:end]
	}
	r := []rune(string(s))
	start, end = min(start, len(r)), min(end, len(r))
	return S(string(r[start:end]))
}

func isASCII[S ~string | ~[]byte](s S) bool {
	for i := 0; i < len(s); i++ {
		if s[i] >= utf8.RuneSelf {
			return false
		}
	}
	return true
}

func daysIn(year, month int) int {
	return time.Date(year, time.Month(month)+1, 0, 0, 0, 0, 0, time.UTC).Day()
}

// pyTimestamp cuts the year, month, day, hour and minute at fixed positions
// after offset, ignores everything past the minute and never checks the
// separators, then reads the result as UTC, the worker's clock. It reports false
// where the reference raises.
func pyTimestamp[S ~string | ~[]byte](s S, offset int) (int64, bool) {
	field := func(from, to int) (int, bool) {
		return pyIntASCII(pySlice(s, offset+from, offset+to))
	}
	year, ok1 := field(0, 4)
	month, ok2 := field(5, 7)
	day, ok3 := field(8, 10)
	hour, ok4 := field(11, 13)
	minute, ok5 := field(14, 16)
	if !(ok1 && ok2 && ok3 && ok4 && ok5) {
		return 0, false
	}
	if year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > daysIn(year, month) ||
		hour < 0 || hour > 23 || minute < 0 || minute > 59 {
		return 0, false
	}
	return time.Date(year, time.Month(month), day, hour, minute, 0, 0, time.UTC).Unix(), true
}

func floorDiv(a, b int64) int64 {
	q := a / b
	if (a%b != 0) && ((a < 0) != (b < 0)) {
		q--
	}
	return q
}

func dayString(epochDay int64) string {
	return time.Unix(epochDay*secondsPerDay, 0).UTC().Format("2006-01-02")
}

// messageStamp is a message timestamp bucketed to its hour as written in the
// string, which is what pandas gives after flooring: naive strings stay naive and
// an offset is kept as the bucket's zone, so neither is converted to UTC.
type messageStamp struct {
	hour   int64 // hours since 1970-01-01T00 of the wall-clock hour
	format uint8 // the shape pandas infers a format from
	offset int   // minutes east of UTC, when the format has one
}

const (
	fmtHasTime uint8 = 1 << iota
	fmtHasMinute
	fmtHasSecond
	fmtHasFraction
	fmtHasOffset
	fmtTSeparator
)

// natString reports the strings pandas turns into NaT instead of failing on.
func natString(s string) bool {
	switch s {
	case "", "NaT", "nat", "NAT", "nan", "NaN", "NAN":
		return true
	}
	return false
}

// parseMessageTimestamp reads the ISO 8601 forms Discord writes in `messages.json`:
// a date, optionally a time to the hour, minute, second or a fraction, then
// optionally Z or a numeric offset.
func parseMessageTimestamp(s string) (messageStamp, bool) {
	var st messageStamp
	pos := 0
	num := func(width int) (int, bool) {
		if pos+width > len(s) {
			return 0, false
		}
		n := 0
		for i := pos; i < pos+width; i++ {
			c := s[i]
			if c < '0' || c > '9' {
				return 0, false
			}
			n = n*10 + int(c-'0')
		}
		pos += width
		return n, true
	}
	lit := func(c byte) bool {
		if pos < len(s) && s[pos] == c {
			pos++
			return true
		}
		return false
	}
	year, ok := num(4)
	if !ok || !lit('-') {
		return st, false
	}
	month, ok := num(2)
	if !ok || !lit('-') {
		return st, false
	}
	day, ok := num(2)
	if !ok {
		return st, false
	}
	hour, minute, second := 0, 0, 0
	if pos < len(s) && (s[pos] == ' ' || s[pos] == 'T') {
		if s[pos] == 'T' {
			st.format |= fmtTSeparator
		}
		pos++
		st.format |= fmtHasTime
		if hour, ok = num(2); !ok {
			return st, false
		}
		if lit(':') {
			st.format |= fmtHasMinute
			if minute, ok = num(2); !ok {
				return st, false
			}
			if lit(':') {
				st.format |= fmtHasSecond
				if second, ok = num(2); !ok {
					return st, false
				}
				if lit('.') {
					st.format |= fmtHasFraction
					start := pos
					for pos < len(s) && s[pos] >= '0' && s[pos] <= '9' {
						pos++
					}
					if pos == start {
						return st, false
					}
				}
			}
		}
	}
	if pos < len(s) {
		switch s[pos] {
		case 'Z':
			pos++
			st.format |= fmtHasOffset
		case '+', '-':
			sign := 1
			if s[pos] == '-' {
				sign = -1
			}
			pos++
			oh, ok := num(2)
			if !ok {
				return st, false
			}
			lit(':')
			om, ok := num(2)
			if !ok || oh > 23 || om > 59 {
				return st, false
			}
			st.format |= fmtHasOffset
			st.offset = sign * (oh*60 + om)
		}
	}
	if pos != len(s) {
		return st, false
	}
	if year < 1 || month < 1 || month > 12 || day < 1 || day > daysIn(year, month) ||
		hour > 23 || minute > 59 || second > 59 {
		return st, false
	}
	st.hour = floorDiv(time.Date(year, time.Month(month), day, hour, 0, 0, 0, time.UTC).Unix(), secondsPerHour)
	return st, true
}

func hourParts(hour int64) (string, int64) {
	day := floorDiv(hour, 24)
	return dayString(day), hour - day*24
}

func itoa(n int64) string { return strconv.FormatInt(n, 10) }
