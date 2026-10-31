package processor

import (
	"math/rand/v2"
	"reflect"
	"slices"
	"testing"
)

// quadraticSessions is the session loop in its quadratic form: every pending
// start is checked against every session accepted so far.
// testNames holds the strings of the events the tests build.
var testNames = newNames()

func nameID(s string) uint32 { return testNames.id([]byte(s)) }

func quadraticSessions(events []sessionEvent) []Session {
	events = slices.Clone(events)
	sortByTime(events, func(e sessionEvent) (int64, uint64) { return e.ts, e.order })
	var pending []sessionEvent
	var out []Session
	for _, ev := range events {
		if ev.start {
			pending = append(pending, ev)
			continue
		}
		for len(pending) > 0 {
			start := pending[0]
			pending = pending[1:]
			duration := ev.ts - start.ts
			if duration > 24*60*60 {
				continue
			}
			if duration < 0 {
				pending = append([]sessionEvent{start}, pending...)
				break
			}
			included := false
			for _, s := range out {
				if float64(start.ts) >= s.StartedDate && float64(start.ts) <= s.EndedDate {
					included = true
				}
			}
			if !included {
				out = append(out, Session{
					DurationMins: floorDiv(duration, 60),
					StartedDate:  float64(start.ts),
					EndedDate:    float64(ev.ts),
					DeviceOS:     testNames.ptr(start.os),
				})
			}
		}
	}
	return out
}

func randomSessionEvents(rng *rand.Rand) []sessionEvent {
	spans := []int64{3 * 3600, 2 * 86400, 10 * 86400}
	span := spans[rng.IntN(len(spans))]
	oses := []uint32{nameID("ios"), nameID("android"), nameID("windows"), 0}
	n := rng.IntN(80)
	events := make([]sessionEvent, n)
	for i := range events {
		events[i] = sessionEvent{
			// Minute precision, like the timestamps the parser keeps.
			ts:    rng.Int64N(span/60) * 60,
			order: uint64(i),
			start: rng.IntN(3) < 2,
			os:    oses[rng.IntN(len(oses))],
		}
	}
	// Positions are unique but not in time order, as in a real stream.
	rng.Shuffle(len(events), func(i, j int) { events[i].order, events[j].order = events[j].order, events[i].order })
	return events
}

func TestSessionsMatchQuadraticLoop(t *testing.T) {
	rng := rand.New(rand.NewPCG(20261030, 1))
	for i := range 50000 {
		events := randomSessionEvents(rng)
		want := quadraticSessions(events)
		got := buildSessions(slices.Clone(events), testNames)
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("sequence %d: got %d sessions, want %d\ngot  %v\nwant %v", i, len(got), len(want), got, want)
		}
	}
}

func TestSessions(t *testing.T) {
	win, ios := nameID("windows"), nameID("ios")
	winName, iosName := testNames.ptr(win), testNames.ptr(ios)
	const h = 3600
	tests := []struct {
		name   string
		events []sessionEvent
		want   []Session
	}{
		{
			name: "each end drains every pending start",
			events: []sessionEvent{
				{ts: 0, start: true, os: win},
				{ts: 60, start: true, os: ios},
				{ts: 600, start: false, os: win},
				{ts: 1200, start: false, os: win},
			},
			want: []Session{{DurationMins: 10, StartedDate: 0, EndedDate: 600, DeviceOS: winName}},
		},
		{
			name: "starts over 24 hours old are dropped",
			events: []sessionEvent{
				{ts: 0, start: true, os: win},
				{ts: 24*h - 60, start: true, os: ios},
				{ts: 24*h + 60, start: false, os: win},
			},
			want: []Session{{DurationMins: 2, StartedDate: 24*h - 60, EndedDate: 24*h + 60, DeviceOS: iosName}},
		},
		{
			name: "a start on an accepted bound is inside it",
			events: []sessionEvent{
				{ts: 0, start: true, os: win},
				{ts: 600, start: false, os: win},
				{ts: 600, start: true, os: ios},
				{ts: 900, start: false, os: ios},
			},
			want: []Session{{DurationMins: 10, StartedDate: 0, EndedDate: 600, DeviceOS: winName}},
		},
		{
			name: "ties sort in file order",
			events: []sessionEvent{
				{ts: 600, order: 1, start: false, os: win},
				{ts: 600, order: 0, start: true, os: ios},
			},
			want: []Session{{DurationMins: 0, StartedDate: 600, EndedDate: 600, DeviceOS: iosName}},
		},
		{
			name: "an end before any start pairs with nothing",
			events: []sessionEvent{
				{ts: 600, order: 0, start: false, os: win},
				{ts: 600, order: 1, start: true, os: ios},
			},
		},
		{
			name: "a start with a null os is still paired",
			events: []sessionEvent{
				{ts: 0, start: true},
				{ts: 59, start: false, os: win},
			},
			want: []Session{{DurationMins: 0, StartedDate: 0, EndedDate: 59}},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := buildSessions(tt.events, testNames); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}
