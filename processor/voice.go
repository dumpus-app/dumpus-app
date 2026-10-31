package processor

import (
	"cmp"
	"math/bits"
	"slices"
	"sort"
)

// A join is skipped when it falls inside the accepted session with the nearest
// earlier start, across all channels: only that one is checked, not every
// accepted session.
func buildVoiceSessions(events []voiceEvent, n *names) []VoiceSession {
	slices.SortFunc(events, func(a, b voiceEvent) int {
		return cmp.Or(cmp.Compare(n.str(a.channel), n.str(b.channel)), cmp.Compare(a.order, b.order))
	})
	var out []VoiceSession
	acc := newAcceptedVoice(events)
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
		sortByTime(joins, func(e voiceEvent) (int64, uint64) { return e.ts, e.order })
		sortByTime(leaves, func(e voiceEvent) (int64, uint64) { return e.ts, e.order })
		for _, join := range joins {
			idx := sort.Search(len(leaves), func(i int) bool { return leaves[i].ts >= join.ts })
			if idx >= len(leaves) {
				continue
			}
			leave := leaves[idx].ts
			duration := leave - join.ts
			if duration > maxSessionSeconds {
				continue
			}
			if acc.covers(join.ts) {
				continue
			}
			out = append(out, VoiceSession{
				ChannelID:    n.str(join.channel),
				GuildID:      n.ptr(join.guild),
				DurationMins: floorDiv(duration, 60),
				StartedDate:  float64(join.ts),
				EndedDate:    float64(leave),
			})
			acc.add(join.ts, leave)
		}
	}
	return out
}

// acceptedVoice holds the accepted sessions by start. No two share a start,
// since a session contains its own, so the one with the latest start at or
// before a time is found by counting accepted starts per position among the
// joins' times, in a Fenwick tree: logarithmic time, where the reference
// shifts a sorted list on every acceptance.
type acceptedVoice struct {
	times []int64 // the joins' times, sorted and distinct
	tree  []int32 // the Fenwick tree of the accepted starts per position, from 1
	ends  []int64 // the end of the session accepted at each position
}

func newAcceptedVoice(events []voiceEvent) *acceptedVoice {
	var times []int64
	for _, ev := range events {
		if ev.join {
			times = append(times, ev.ts)
		}
	}
	slices.Sort(times)
	times = slices.Compact(times)
	return &acceptedVoice{times: times, tree: make([]int32, len(times)+1), ends: make([]int64, len(times))}
}

// pos is the position of a join's time.
func (a *acceptedVoice) pos(t int64) int {
	i, _ := slices.BinarySearch(a.times, t)
	return i
}

func (a *acceptedVoice) add(start, end int64) {
	i := a.pos(start)
	a.ends[i] = end
	for j := i + 1; j < len(a.tree); j += j & -j {
		a.tree[j]++
	}
}

// covers reports whether the accepted session with the latest start at or
// before t, a join's time, lasts until t.
func (a *acceptedVoice) covers(t int64) bool {
	k := int32(0) // accepted starts at or before t
	for j := a.pos(t) + 1; j > 0; j -= j & -j {
		k += a.tree[j]
	}
	if k == 0 {
		return false
	}
	// Find the position of the k-th accepted start.
	i := 0
	for step := 1 << bits.Len(uint(len(a.times))); step > 0; step >>= 1 {
		if i+step < len(a.tree) && a.tree[i+step] < k {
			i += step
			k -= a.tree[i]
		}
	}
	return a.ends[i] >= t
}
