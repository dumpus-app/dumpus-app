package processor

import "cmp"

// limits bound the memory and the work a crafted package can cause, each with
// a wide margin over what real exports need. Hitting one is counted in the
// report and never fails the package.
type limits struct {
	lineBytes    int    // longest activity line decoded; longer ones are skipped
	entryBytes   uint64 // largest entry read whole; larger ones are skipped
	inflateRatio uint64 // bytes inflated in all, per byte of zip,
	minInflate   uint64 // and at least this many
	events       int64  // relevant activity events; zero derives it from the inflate budget
}

var defaultLimits = limits{
	lineBytes:    32 << 20,
	entryBytes:   256 << 20,
	inflateRatio: 100,
	minInflate:   64 << 20,
}

// minEventLine is the shortest line, newline included, that can carry an
// event the parser keeps, for eg. `{"event_type":"app_crashed","timestamp":"x2021-04-06T12:3"}`:
// the timestamp is cut at fixed positions after its first character, which is
// never checked. A stream within the inflate budget can't hold more kept events
// than the budget over it, so the event limit follows the package's size.
const minEventLine = 60

func (l limits) orDefaults() limits {
	d := defaultLimits
	return limits{
		lineBytes:    cmp.Or(l.lineBytes, d.lineBytes),
		entryBytes:   cmp.Or(l.entryBytes, d.entryBytes),
		inflateRatio: cmp.Or(l.inflateRatio, d.inflateRatio),
		minInflate:   cmp.Or(l.minInflate, d.minInflate),
		events:       l.events,
	}
}

func (l limits) inflateBudget(size int64) uint64 {
	return max(l.minInflate, l.inflateRatio*uint64(max(size, 0)))
}

// eventLimit is how many relevant events a stream of a package of the given
// size may hold.
func (l limits) eventLimit(size int64) int64 {
	if l.events > 0 {
		return l.events
	}
	return int64(l.inflateBudget(size) / minEventLine)
}
