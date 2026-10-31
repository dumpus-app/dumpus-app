package processor

import (
	"regexp"
	"sort"
	"sync"
)

// Report lists what a package lacked compared to what the parser expects, as
// entry paths and counts. It never holds a value read from the package: paths
// have their digit runs masked, and event types and fields come from the
// parser's own vocabulary.
type Report struct {
	// Error is the code when the package could not be processed, one of
	// [CodeMissingUserData] and [CodeUnknownError].
	Error string `json:"error,omitempty"`
	// Inputs maps each role to the entry that was read for it.
	Inputs map[string]string `json:"inputs"`
	// MissingFiles lists the roles of expected entries that were not found.
	MissingFiles []MissingFile `json:"missing_files"`
	// Issues counts missing or unusable fields per entry.
	Issues    []Issue          `json:"issues"`
	Counts    Counts           `json:"counts"`
	TimingsMS map[string]int64 `json:"timings_ms,omitempty"`
}

func newReport() *Report {
	return &Report{Inputs: map[string]string{}, MissingFiles: []MissingFile{}, Issues: []Issue{}, TimingsMS: map[string]int64{}}
}

// MissingFile is an expected entry that the package does not have.
type MissingFile struct {
	Role string `json:"role"`
	Path string `json:"path"`
}

// Issue counts the occurrences of one problem with one field.
type Issue struct {
	Path      string `json:"path"`
	EventType string `json:"event_type,omitempty"`
	Field     string `json:"field,omitempty"`
	Problem   string `json:"problem"`
	Count     int    `json:"count"`
}

// Counts are sizes of what was read and produced.
type Counts struct {
	ActivityLines  int64 `json:"activity_lines"`
	ActivityEvents int64 `json:"activity_events"`
	ChannelFiles   int   `json:"channel_files"`
	DMChannels     int   `json:"dm_channels"`
	GuildChannels  int   `json:"guild_channels"`
	Messages       int64 `json:"messages"`
	Guilds         int   `json:"guilds"`
	Payments       int   `json:"payments"`
	Sessions       int   `json:"sessions"`
	VoiceSessions  int   `json:"voice_sessions"`
	ActivityRows   int   `json:"activity_rows"`
	Relationships  int   `json:"relationships"`
}

// Problems an Issue can report.
const (
	ProblemMissing      = "missing"       // the key is absent
	ProblemNull         = "null"          // the key holds null where a value is required
	ProblemWrongType    = "wrong_type"    // the value has an unexpected JSON type
	ProblemUnparseable  = "unparseable"   // a timestamp the reference can't read
	ProblemMalformed    = "malformed"     // the entry or line is not valid JSON
	ProblemMixedFormats = "mixed_formats" // a channel mixes timestamp formats or offsets
	ProblemSelfDM       = "self_dm"       // a DM whose recipients are all the owner
)

var digitRuns = regexp.MustCompile(`[0-9]{3,}`)

// maskPath hides the ids and dates in an entry path.
func maskPath(p string) string { return digitRuns.ReplaceAllString(p, "*") }

type issueKey struct {
	path, eventType, field, problem string
}

// issues is a concurrency-safe Issue counter.
type issues struct {
	mu sync.Mutex
	m  map[issueKey]int
}

func (s *issues) add(path, eventType, field, problem string, n int) {
	if n == 0 {
		return
	}
	s.mu.Lock()
	if s.m == nil {
		s.m = map[issueKey]int{}
	}
	s.m[issueKey{maskPath(path), eventType, field, problem}] += n
	s.mu.Unlock()
}

func (s *issues) merge(local map[issueKey]int) {
	s.mu.Lock()
	if s.m == nil {
		s.m = map[issueKey]int{}
	}
	for k, n := range local {
		s.m[k] += n
	}
	s.mu.Unlock()
}

func (s *issues) list() []Issue {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Issue, 0, len(s.m))
	for k, n := range s.m {
		out = append(out, Issue{Path: k.path, EventType: k.eventType, Field: k.field, Problem: k.problem, Count: n})
	}
	sort.Slice(out, func(i, j int) bool {
		a, b := out[i], out[j]
		if a.Path != b.Path {
			return a.Path < b.Path
		}
		if a.EventType != b.EventType {
			return a.EventType < b.EventType
		}
		if a.Field != b.Field {
			return a.Field < b.Field
		}
		return a.Problem < b.Problem
	})
	return out
}
