package processor

import (
	"bytes"
	"encoding/json"
	"errors"
	"math/rand/v2"
	"strings"
	"testing"
	"testing/iotest"
)

func streamValid(doc []byte) bool {
	s := newJSONStream(bytes.NewReader(doc))
	s.value(s.nonSpace(), 1)
	s.end()
	return s.err == nil
}

var jsonCorpus = []string{
	`[]`, `{}`, ` [ ] `, `[1,]`, `{"a":1,}`, `[,1]`, `[1 2]`, `{"a" 1}`, `{1:2}`, `{"a":}`,
	`0`, `-0`, `01`, `-`, `-a`, `1.`, `1.5`, `.5`, `1e`, `1e+`, `1E-7`, `1e5x`, `2.5e+10`,
	`true`, `tru`, `false`, `fals`, `null`, `nul`, `nullx`,
	`"a"`, `"a`, `"\u00e9"`, `"\u00g9"`, `"\u12"`, `"\x"`, `"\/\b\f\n\r\t\"\\"`, "\"a\nb\"", "\"tab\there\"",
	`[{"Timestamp": "2021-04-06 12:00:00", "Contents": "x"}]`, `[{"a": [1, {"b": null}]}, 2, "3"]`,
	`1 2`, `[] x`, ``, `   `, "[1]\n", "\xef\xbb\xbf[1]",
}

func TestJSONStreamMatchesValid(t *testing.T) {
	for _, doc := range jsonCorpus {
		if got, want := streamValid([]byte(doc)), json.Valid([]byte(doc)); got != want {
			t.Errorf("%q: stream says %v, json.Valid %v", doc, got, want)
		}
	}
	deep := func(n int) []byte { return []byte(strings.Repeat("[", n) + strings.Repeat("]", n)) }
	if !streamValid(deep(maxJSONDepth)) || streamValid(deep(maxJSONDepth+1)) {
		t.Errorf("the depth limit differs from encoding/json's")
	}
	// Mutations of valid documents, compared with json.Valid.
	rng := rand.New(rand.NewPCG(20261030, 5))
	alphabet := []byte(`[]{}",:\ 0123456789.-+eEtrufalsn` + "\n\t")
	for i := range 50000 {
		doc := []byte(jsonCorpus[rng.IntN(len(jsonCorpus))])
		for range 1 + rng.IntN(3) {
			pos := rng.IntN(len(doc) + 1)
			switch rng.IntN(3) {
			case 0:
				doc = append(doc[:pos], append([]byte{alphabet[rng.IntN(len(alphabet))]}, doc[pos:]...)...)
			case 1:
				if pos < len(doc) {
					doc = append(doc[:pos], doc[pos+1:]...)
				}
			default:
				if pos < len(doc) {
					doc[pos] = alphabet[rng.IntN(len(alphabet))]
				}
			}
		}
		if got, want := streamValid(doc), json.Valid(doc); got != want {
			t.Fatalf("mutation %d %q: stream says %v, json.Valid %v", i, doc, got, want)
		}
	}
}

func TestJSONStreamReadError(t *testing.T) {
	boom := errors.New("boom")
	s := newJSONStream(iotest.ErrReader(boom))
	s.value(s.nonSpace(), 1)
	if !errors.Is(s.err, boom) {
		t.Errorf("err = %v, want the read error", s.err)
	}
}

func TestReadMessages(t *testing.T) {
	long := strings.Repeat("x", 3<<20)
	tests := []struct {
		name    string
		doc     string
		dm      bool
		want    messageCounts
		problem string
	}{
		{
			name: "messages of any size, keys escaped or repeated",
			doc: `[{"ID": 1, "Timestamp": "2021-04-06 12:00:00", "Contents": "` + long + `"},
				{"\u0054\u0069\u006d\u0065\u0073\u0074\u0061\u006d\u0070": "2021-04-06 13:00:00", "Contents": ""},
				{"Timestamp": "2021-04-06 13:00:00", "Timestamp": "2021-04-06 14:00:00", "Contents": {"nested": [1, 2]}}]`,
			dm: true,
			want: messageCounts{total: 3, hours: map[int64]int64{
				hourOf("2021-04-06T12:00:00Z"): 1, hourOf("2021-04-06T13:00:00Z"): 1, hourOf("2021-04-06T14:00:00Z"): 1,
			}},
		},
		{
			name: "what pandas drops, fails on or never sees",
			doc: `[{"Timestamp": null}, {"Timestamp": ""}, {"Timestamp": 12}, {"Contents": "x"},
				{"Timestamp": "` + strings.Repeat("9", 80) + `"}, "not an object", {"Timestamp": "2021-04-06 12:00:00.5"},
				{"Timestamp": "2021-04-06 12:00:00"}]`,
			dm: true,
			want: messageCounts{total: 8, hours: map[int64]int64{hourOf("2021-04-06T12:00:00Z"): 2},
				mixed: true, notObjects: 1, missingTS: 1, wrongTS: 1, unparseable: 1, missingContents: 6},
		},
		{name: "an object", doc: `{"a": 1}`, problem: ProblemWrongType},
		{name: "malformed", doc: `[{"Timestamp": "2021-04-06 12:00:00"},]`, problem: ProblemMalformed},
		{name: "trailing data", doc: `[] []`, problem: ProblemMalformed},
		{name: "empty", doc: ` [ ] `, want: messageCounts{hours: map[int64]int64{}}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, problem, err := readMessages(strings.NewReader(tt.doc), tt.dm)
			if err != nil {
				t.Fatal(err)
			}
			if problem != tt.problem {
				t.Fatalf("problem = %q, want %q", problem, tt.problem)
			}
			if problem != "" {
				return
			}
			if got.total != tt.want.total || got.mixed != tt.want.mixed || got.notObjects != tt.want.notObjects ||
				got.missingTS != tt.want.missingTS || got.wrongTS != tt.want.wrongTS ||
				got.unparseable != tt.want.unparseable || got.missingContents != tt.want.missingContents ||
				len(got.hours) != len(tt.want.hours) {
				t.Errorf("got %+v, want %+v", got, tt.want)
			}
			for h, n := range tt.want.hours {
				if got.hours[h] != n {
					t.Errorf("hour %d: %d messages, want %d", h, got.hours[h], n)
				}
			}
		})
	}
}

func hourOf(rfc3339 string) int64 { return floorDiv(unix(rfc3339), secondsPerHour) }
