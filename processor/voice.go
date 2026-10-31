package processor

import (
	"cmp"
	"slices"
	"sort"
)

// A join is skipped when it falls inside the accepted session with the nearest
// earlier start, across all channels: only that one is checked, not every
// accepted session.
func buildVoiceSessions(events []voiceEvent) []VoiceSession {
	slices.SortFunc(events, func(a, b voiceEvent) int {
		return cmp.Or(cmp.Compare(a.channel, b.channel), cmp.Compare(a.order, b.order))
	})
	var (
		out    []VoiceSession
		starts []int64 // accepted starts, sorted, ties in acceptance order
		ends   []int64 // the end of the session at the same index in starts
	)
	bisectRight := func(t int64) int {
		return sort.Search(len(starts), func(i int) bool { return starts[i] > t })
	}
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
			if i := bisectRight(join.ts); i > 0 && ends[i-1] >= join.ts {
				continue
			}
			out = append(out, VoiceSession{
				ChannelID:    join.channel,
				GuildID:      join.guild,
				DurationMins: floorDiv(duration, 60),
				StartedDate:  float64(join.ts),
				EndedDate:    float64(leave),
			})
			ins := bisectRight(join.ts)
			starts = slices.Insert(starts, ins, join.ts)
			ends = slices.Insert(ends, ins, leave)
		}
	}
	return out
}
