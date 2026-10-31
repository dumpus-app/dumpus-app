package processor

import (
	"testing"
	"time"
)

func unix(s string) int64 {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		panic(err)
	}
	return t.Unix()
}

func TestPyTimestamp(t *testing.T) {
	tests := []struct {
		in     string
		offset int
		want   int64
		ok     bool
	}{
		// Analytics values keep a leading quote; everything past the minute is
		// dropped, seconds and fractions included.
		{`"2021-04-06T12:34:56.789Z"`, 1, unix("2021-04-06T12:34:00Z"), true},
		{`"2021-04-06T12:34:59.999999Z"`, 1, unix("2021-04-06T12:34:00Z"), true},
		{`"2021-04-06T00:00:00.000Z"`, 1, unix("2021-04-06T00:00:00Z"), true},
		{`"2021-04-05T23:59:59.999Z"`, 1, unix("2021-04-05T23:59:00Z"), true},
		// An offset is ignored, as the reference cuts the string at fixed places.
		{`"2021-04-06T12:34:56+02:00"`, 1, unix("2021-04-06T12:34:00Z"), true},
		{`"2021-04-06 12:34"`, 1, unix("2021-04-06T12:34:00Z"), true},
		// Separators aren't checked.
		{`"2021/04/06x12h34`, 1, unix("2021-04-06T12:34:00Z"), true},
		// Python's int() takes surrounding spaces, a sign and underscores.
		{`" 021-+4-06T12:3 "`, 1, unix("0021-04-06T12:03:00Z"), true},
		{`"2_21-04-06T12:34"`, 1, unix("0221-04-06T12:34:00Z"), true},
		// A 16-character value still has a one-digit minute.
		{`"2021-04-06T12:3`, 1, unix("2021-04-06T12:03:00Z"), true},
		{"2022-03-04T05:06:07.000000+00:00", 0, unix("2022-03-04T05:06:00Z"), true},
		{`"2021-04-06T12:`, 1, 0, false},
		{`2021-04-06T12:34:56Z`, 1, 0, false},
		{`"2021-02-29T12:34:56Z"`, 1, 0, false},
		{`"2021-04-06T24:00:00Z"`, 1, 0, false},
		{`"0000-04-06T12:34:56Z"`, 1, 0, false},
		{`"2_21_-04-06T12:34"`, 1, 0, false},
		{`"2021-04-06T1_:34"`, 1, 0, false},
		{"", 1, 0, false},
	}
	for _, tt := range tests {
		got, ok := pyTimestamp(tt.in, tt.offset)
		if ok != tt.ok || got != tt.want {
			t.Errorf("pyTimestamp(%q, %d) = %d, %v; want %d, %v", tt.in, tt.offset, got, ok, tt.want, tt.ok)
		}
	}
}

func TestPySliceCountsCharacters(t *testing.T) {
	if got := pySlice("é2021-04", 1, 5); got != "2021" {
		t.Errorf("got %q", got)
	}
	if got := pySlice("abc", 5, 9); got != "" {
		t.Errorf("got %q", got)
	}
}

func TestParseMessageTimestamp(t *testing.T) {
	tests := []struct {
		in       string
		wantHour string // the bucket, as %Y-%m-%d %H
		format   uint8
		offset   int
		ok       bool
	}{
		{"2021-04-06 12:34:56", "2021-04-06 12", fmtHasTime | fmtHasMinute | fmtHasSecond, 0, true},
		{"2021-04-06 00:00:00", "2021-04-06 00", fmtHasTime | fmtHasMinute | fmtHasSecond, 0, true},
		{"2021-04-06 23:59:59.999", "2021-04-06 23", fmtHasTime | fmtHasMinute | fmtHasSecond | fmtHasFraction, 0, true},
		{"2021-04-06T12:34:56.5Z", "2021-04-06 12", fmtTSeparator | fmtHasTime | fmtHasMinute | fmtHasSecond | fmtHasFraction | fmtHasOffset, 0, true},
		// pandas keeps a parsed offset as the bucket's zone: the hour stays
		// the one written.
		{"2021-04-06 23:30:00+02:00", "2021-04-06 23", fmtHasTime | fmtHasMinute | fmtHasSecond | fmtHasOffset, 120, true},
		{"2021-04-06 00:30:00-0530", "2021-04-06 00", fmtHasTime | fmtHasMinute | fmtHasSecond | fmtHasOffset, -330, true},
		{"2021-04-06", "2021-04-06 00", 0, 0, true},
		{"2021-04-06 12:34", "2021-04-06 12", fmtHasTime | fmtHasMinute, 0, true},
		{"2021-04-06 12:34:56 ", "", 0, 0, false},
		{"2021-04-31 12:34:56", "", 0, 0, false},
		{"06/04/2021 12:34", "", 0, 0, false},
		{"2021-04-06 12:34:56.", "", 0, 0, false},
	}
	for _, tt := range tests {
		st, ok := parseMessageTimestamp(tt.in)
		if ok != tt.ok {
			t.Errorf("parseMessageTimestamp(%q) ok = %v, want %v", tt.in, ok, tt.ok)
			continue
		}
		if !ok {
			continue
		}
		day, hour := hourParts(st.hour)
		got := day + " " + time.Unix(hour*3600, 0).UTC().Format("15")
		if got != tt.wantHour || st.format != tt.format || st.offset != tt.offset {
			t.Errorf("parseMessageTimestamp(%q) = %s, format %b, offset %d; want %s, %b, %d",
				tt.in, got, st.format, st.offset, tt.wantHour, tt.format, tt.offset)
		}
	}
}

func TestFloorDivAndDays(t *testing.T) {
	if got := floorDiv(-1, 86400); got != -1 {
		t.Errorf("floorDiv(-1, 86400) = %d", got)
	}
	if got := floorDiv(86399, 86400); got != 0 {
		t.Errorf("floorDiv(86399, 86400) = %d", got)
	}
	if got := dayString(floorDiv(unix("2021-04-06T23:59:00Z"), secondsPerDay)); got != "2021-04-06" {
		t.Errorf("dayString = %s", got)
	}
	if got := dayString(floorDiv(unix("1969-12-31T23:59:00Z"), secondsPerDay)); got != "1969-12-31" {
		t.Errorf("dayString before the epoch = %s", got)
	}
}
