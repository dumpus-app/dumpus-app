package processor

import (
	"cmp"
	"slices"
)

const maxSessionSeconds = 24 * 60 * 60

func sortByTime[E any](events []E, key func(E) (int64, uint64)) {
	slices.SortFunc(events, func(a, b E) int {
		ta, oa := key(a)
		tb, ob := key(b)
		return cmp.Or(cmp.Compare(ta, tb), cmp.Compare(oa, ob))
	})
}

// Starts are checked in time order and sessions are accepted in end order, so a
// session that ended before the current start can't contain a later one: only
// the sessions still open are kept, with a running minimum of their starts,
// which gives the reference's full scan in linear time.
func buildSessions(events []sessionEvent) []Session {
	sortByTime(events, func(e sessionEvent) (int64, uint64) { return e.ts, e.order })
	var (
		pending []sessionEvent // starts waiting for an end, oldest first
		out     []Session
		bounds  [][2]int64 // start and end of each session in out
		open    []int      // indexes of the sessions that may contain a later start
		mins    []int      // the open sessions whose start is a running minimum
	)
	for _, ev := range events {
		if ev.start {
			pending = append(pending, ev)
			continue
		}
		for len(pending) > 0 {
			start := pending[0]
			duration := ev.ts - start.ts
			if duration > maxSessionSeconds {
				pending = pending[1:]
				continue
			}
			if duration < 0 {
				break
			}
			pending = pending[1:]
			for len(open) > 0 && bounds[open[0]][1] < start.ts {
				if len(mins) > 0 && mins[0] == open[0] {
					mins = mins[1:]
				}
				open = open[1:]
			}
			if len(mins) > 0 && bounds[mins[0]][0] <= start.ts {
				continue
			}
			out = append(out, Session{
				DurationMins: floorDiv(duration, 60),
				StartedDate:  float64(start.ts),
				EndedDate:    float64(ev.ts),
				DeviceOS:     start.os,
			})
			bounds = append(bounds, [2]int64{start.ts, ev.ts})
			i := len(out) - 1
			open = append(open, i)
			for len(mins) > 0 && bounds[mins[len(mins)-1]][0] >= start.ts {
				mins = mins[:len(mins)-1]
			}
			mins = append(mins, i)
		}
	}
	return out
}
