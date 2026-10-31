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
func buildSessions(events []sessionEvent, n *names) []Session {
	sortByTime(events, func(e sessionEvent) (int64, uint64) { return e.ts, e.order })
	ends := 0
	for _, ev := range events {
		if !ev.start {
			ends++
		}
	}
	// An end accepts at most one session: the starts after the one it takes
	// fall inside it.
	var (
		pending []sessionEvent // starts waiting for an end, oldest first
		out     = make([]Session, 0, ends)
		open    = make([]int, 0, ends) // indexes in out of the sessions that may contain a later start
		mins    = make([]int, 0, ends) // the open sessions whose start is a running minimum
	)
	// The dates are whole seconds, so they compare exactly as floats.
	startOf := func(i int) float64 { return out[i].StartedDate }
	endOf := func(i int) float64 { return out[i].EndedDate }
	for _, ev := range events {
		if ev.start {
			pending = append(pending, ev)
			continue
		}
		for len(pending) > 0 {
			st := pending[0]
			duration := ev.ts - st.ts
			if duration > maxSessionSeconds {
				pending = pending[1:]
				continue
			}
			if duration < 0 {
				break
			}
			pending = pending[1:]
			t := float64(st.ts)
			for len(open) > 0 && endOf(open[0]) < t {
				if len(mins) > 0 && mins[0] == open[0] {
					mins = mins[1:]
				}
				open = open[1:]
			}
			if len(mins) > 0 && startOf(mins[0]) <= t {
				continue
			}
			out = append(out, Session{
				DurationMins: floorDiv(duration, 60),
				StartedDate:  t,
				EndedDate:    float64(ev.ts),
				DeviceOS:     n.ptr(st.os),
			})
			i := len(out) - 1
			open = append(open, i)
			for len(mins) > 0 && startOf(mins[len(mins)-1]) >= t {
				mins = mins[:len(mins)-1]
			}
			mins = append(mins, i)
		}
	}
	if len(out) == 0 {
		return nil
	}
	return out
}
