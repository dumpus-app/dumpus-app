package processor

import (
	"cmp"
	"fmt"
	"math/rand/v2"
	"reflect"
	"slices"
	"testing"
)

// scanVoiceSessions is the voice pairing written with linear scans instead of
// binary searches: the first leave at or after each join, and the accepted
// session with the greatest start at or before it, the latest accepted on ties.
func scanVoiceSessions(events []voiceEvent) []VoiceSession {
	n := testNames
	events = slices.Clone(events)
	slices.SortFunc(events, func(a, b voiceEvent) int { return cmp.Compare(a.order, b.order) })
	slices.SortStableFunc(events, func(a, b voiceEvent) int { return cmp.Compare(n.str(a.channel), n.str(b.channel)) })
	type acc struct {
		start, end int64
		n          int
	}
	var accepted []acc
	var out []VoiceSession
	for lo := 0; lo < len(events); {
		hi := lo
		for hi < len(events) && events[hi].channel == events[lo].channel {
			hi++
		}
		var joins, leaves []voiceEvent
		for _, ev := range events[lo:hi] {
			if ev.join {
				joins = append(joins, ev)
			} else {
				leaves = append(leaves, ev)
			}
		}
		lo = hi
		slices.SortStableFunc(joins, func(a, b voiceEvent) int { return cmp.Compare(a.ts, b.ts) })
		for _, j := range joins {
			leave := int64(-1)
			for _, l := range leaves {
				if l.ts >= j.ts && (leave < 0 || l.ts < leave) {
					leave = l.ts
				}
			}
			if leave < 0 || leave-j.ts > 24*60*60 {
				continue
			}
			nearest := -1
			for i, a := range accepted {
				if a.start <= j.ts && (nearest < 0 || a.start > accepted[nearest].start ||
					a.start == accepted[nearest].start && a.n > accepted[nearest].n) {
					nearest = i
				}
			}
			if nearest >= 0 && accepted[nearest].end >= j.ts {
				continue
			}
			accepted = append(accepted, acc{start: j.ts, end: leave, n: len(accepted)})
			out = append(out, VoiceSession{
				ChannelID: n.str(j.channel), GuildID: n.ptr(j.guild), DurationMins: (leave - j.ts) / 60,
				StartedDate: float64(j.ts), EndedDate: float64(leave),
			})
		}
	}
	return out
}

func randomVoiceEvents(rng *rand.Rand) []voiceEvent {
	channels := []uint32{nameID("700000000000000001"), nameID("700000000000000002"), nameID("700000000000000010"), nameID("9")}
	guilds := []uint32{nameID("300000000000000001"), nameID("300000000000000002"), 0}
	spans := []int64{2 * 3600, 3 * 86400}
	span := spans[rng.IntN(len(spans))]
	n := rng.IntN(40)
	events := make([]voiceEvent, n)
	for i := range events {
		events[i] = voiceEvent{
			ts:      rng.Int64N(span/60) * 60,
			order:   uint64(i),
			join:    rng.IntN(2) == 0,
			channel: channels[rng.IntN(len(channels))],
			guild:   guilds[rng.IntN(len(guilds))],
		}
	}
	return events
}

func TestVoiceSessionsMatchLinearScan(t *testing.T) {
	rng := rand.New(rand.NewPCG(20261030, 2))
	for i := range 50000 {
		events := randomVoiceEvents(rng)
		want := scanVoiceSessions(events)
		got := buildVoiceSessions(slices.Clone(events), testNames)
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("sequence %d:\ngot  %v\nwant %v", i, got, want)
		}
	}
}

// TestVoiceSessionsAtScale compares the pairing with the linear scans on
// sequences long enough that the accepted sessions span many positions.
func TestVoiceSessionsAtScale(t *testing.T) {
	rng := rand.New(rand.NewPCG(20261030, 4))
	channels := make([]uint32, 50)
	for i := range channels {
		channels[i] = nameID(fmt.Sprintf("7%017d", i))
	}
	for i := range 20 {
		events := make([]voiceEvent, 2000)
		for j := range events {
			events[j] = voiceEvent{
				ts:      rng.Int64N(7*24*60) * 60,
				order:   uint64(j),
				join:    rng.IntN(2) == 0,
				channel: channels[rng.IntN(len(channels))],
			}
		}
		want := scanVoiceSessions(events)
		got := buildVoiceSessions(slices.Clone(events), testNames)
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("sequence %d: %d sessions, want %d", i, len(got), len(want))
		}
	}
}

// BenchmarkVoiceSessions accepts every join, each channel earlier than the
// last, so that every acceptance lands before all the others.
func BenchmarkVoiceSessions(b *testing.B) {
	n := newNames()
	var events []voiceEvent
	for i := range 100000 {
		ch := n.id(fmt.Appendf(nil, "c%08d", i))
		t := int64(2_000_000_000) - int64(i)*120
		events = append(events, voiceEvent{ts: t, order: uint64(2 * i), channel: ch, join: true},
			voiceEvent{ts: t, order: uint64(2*i + 1), channel: ch})
	}
	for b.Loop() {
		buildVoiceSessions(slices.Clone(events), n)
	}
}

func TestVoiceSessions(t *testing.T) {
	g1, g2 := nameID("300000000000000001"), nameID("300000000000000002")
	g1Name, g2Name := testNames.ptr(g1), testNames.ptr(g2)
	const a, b = "700000000000000001", "700000000000000002"
	ai, bi := nameID(a), nameID(b)
	const h = 3600
	tests := []struct {
		name   string
		events []voiceEvent
		want   []VoiceSession
	}{
		{
			name: "a join pairs with the first leave at or after it, zero length kept",
			events: []voiceEvent{
				{ts: 600, join: false, channel: ai},
				{ts: 600, join: true, channel: ai, guild: g1},
				{ts: 1200, join: false, channel: ai},
			},
			want: []VoiceSession{{ChannelID: a, GuildID: g1Name, DurationMins: 0, StartedDate: 600, EndedDate: 600}},
		},
		{
			name: "pairs over 24 hours are skipped",
			events: []voiceEvent{
				{ts: 0, join: true, channel: ai},
				{ts: 24*h + 60, join: false, channel: ai},
			},
		},
		{
			name: "a join inside an accepted session of another channel is skipped",
			events: []voiceEvent{
				{ts: 0, join: true, channel: ai},
				{ts: 600, join: false, channel: ai},
				{ts: 300, join: true, channel: bi, guild: g2},
				{ts: 900, join: false, channel: bi},
			},
			want: []VoiceSession{
				{ChannelID: a, DurationMins: 10, StartedDate: 0, EndedDate: 600},
			},
		},
		{
			name: "only the accepted session with the nearest earlier start is checked",
			events: []voiceEvent{
				// Channel a comes first in string order: a short session.
				{ts: 1 * h, join: true, channel: ai},
				{ts: 1*h + 600, join: false, channel: ai},
				// Channel b: a long session around it, then a join at 2h whose
				// nearest earlier accepted start is a's, already ended, so it
				// is accepted although it is inside b's long session.
				{ts: 0, join: true, channel: bi},
				{ts: 2 * h, join: true, channel: bi, guild: g2},
				{ts: 3 * h, join: false, channel: bi},
			},
			want: []VoiceSession{
				{ChannelID: a, DurationMins: 10, StartedDate: 1 * h, EndedDate: 1*h + 600},
				{ChannelID: b, DurationMins: 180, StartedDate: 0, EndedDate: 3 * h},
				{ChannelID: b, GuildID: g2Name, DurationMins: 60, StartedDate: 2 * h, EndedDate: 3 * h},
			},
		},
		{
			name: "tied joins keep file order",
			events: []voiceEvent{
				{ts: 0, order: 1, join: true, channel: ai, guild: g2},
				{ts: 0, order: 0, join: true, channel: ai, guild: g1},
				{ts: 60, order: 2, join: false, channel: ai},
			},
			want: []VoiceSession{{ChannelID: a, GuildID: g1Name, DurationMins: 1, StartedDate: 0, EndedDate: 60}},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := buildVoiceSessions(slices.Clone(tt.events), testNames)
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("got %v, want %v", got, tt.want)
			}
			if scan := scanVoiceSessions(tt.events); !reflect.DeepEqual(scan, tt.want) {
				t.Errorf("linear scan: got %v, want %v", scan, tt.want)
			}
		})
	}
}
