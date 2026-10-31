package processor

import (
	"bytes"
	"encoding/json"
	"sync"
)

type eventKind uint8

const (
	evJoinVoice eventKind = iota + 1
	evLeaveVoice
	evSessionStart
	evSessionEnd
	evGuildJoined
	evApplicationCommandUsed
	evAddReaction
	evAppOpened
	evDaily // counted per day, see dailyEvents
)

// dailyEvents are counted per day and written in this order.
var dailyEvents = []struct {
	name  string   // the activity event name
	types []string // the event types counted under it
}{
	{"email_opened", []string{"email_opened"}},
	{"login_successful", []string{"login_successful"}},
	{"app_crashed", []string{"app_crashed", "app_native_crash"}},
	{"user_avatar_updated", []string{"user_avatar_updated"}},
	{"oauth2_authorize_accepted", []string{"oauth2_authorize_accepted"}},
	{"remote_auth_login", []string{"remote_auth_login"}},
	{"notification_clicked", []string{"notification_clicked"}},
	{"captcha_served", []string{"captcha_served"}},
	{"voice_message_recorded", []string{"voice_message_recorded"}},
	{"message_reported", []string{"message_reported"}},
	{"message_edited", []string{"message_edited"}},
	{"premium_upsell_viewed", []string{"premium_upsell_viewed"}},
}

type eventSpec struct {
	name  string // the event type
	kind  eventKind
	daily int // for evDaily, the index in dailyEvents
}

// Lines of other event types are skipped without being decoded.
var eventTypes = func() map[string]eventSpec {
	m := map[string]eventSpec{
		"join_voice_channel":       {kind: evJoinVoice},
		"leave_voice_channel":      {kind: evLeaveVoice},
		"session_start":            {kind: evSessionStart},
		"session_end":              {kind: evSessionEnd},
		"guild_joined":             {kind: evGuildJoined},
		"application_command_used": {kind: evApplicationCommandUsed},
		"add_reaction":             {kind: evAddReaction},
		"app_opened":               {kind: evAppOpened},
	}
	for i, d := range dailyEvents {
		for _, t := range d.types {
			m[t] = eventSpec{kind: evDaily, daily: i}
		}
	}
	for name, spec := range m {
		spec.name = name
		m[name] = spec
	}
	return m
}()

const (
	fEventType = iota
	fTimestamp
	fClientTrackTimestamp
	fOS
	fGuildID
	fChannelID
	fApplicationID
	fUserID
	fEmojiName
	numFields
)

var fieldNames = [numFields]string{
	fEventType:            "event_type",
	fTimestamp:            "timestamp",
	fClientTrackTimestamp: "client_track_timestamp",
	fOS:                   "os",
	fGuildID:              "guild_id",
	fChannelID:            "channel_id",
	fApplicationID:        "application_id",
	fUserID:               "user_id",
	fEmojiName:            "emoji_name",
}

var fieldIndex = func() map[string]int {
	m := make(map[string]int, numFields)
	for i, name := range fieldNames {
		m[name] = i
	}
	return m
}()

type eventFields struct {
	present uint16
	values  [numFields][]byte
}

func (f *eventFields) has(i int) bool { return f.present&(1<<i) != 0 }

// Duplicate keys keep the last value, like Python's dict. The line must have
// passed `json.Valid`.
func scanEvent(line []byte, f *eventFields) error {
	*f = eventFields{}
	return eachMember(line, func(key, value []byte) bool {
		if bytes.IndexByte(key, '\\') >= 0 {
			key = []byte(keyString(key))
		}
		if i, ok := fieldIndex[string(key)]; ok {
			f.present |= 1 << i
			f.values[i] = value
		}
		return true
	})
}

var eventTypeKey = []byte(`"event_type"`)

type sniff uint8

const (
	sniffAbsent    sniff = iota // no event_type key anywhere on the line
	sniffValue                  // a single event_type key with a plain string value
	sniffAmbiguous              // anything else, decided by a full decode
)

// sniffEventType reads the event type of a line without decoding it. A plain
// `"event_type"` that isn't followed by a colon is a string value, not a key.
func sniffEventType(line []byte) ([]byte, sniff) {
	i := bytes.Index(line, eventTypeKey)
	if i < 0 {
		return nil, sniffAbsent
	}
	rest := line[i+len(eventTypeKey):]
	if bytes.Contains(rest, eventTypeKey) {
		return nil, sniffAmbiguous
	}
	j := skipSpace(rest, 0)
	if j >= len(rest) || rest[j] != ':' {
		return nil, sniffAbsent
	}
	j = skipSpace(rest, j+1)
	if j >= len(rest) || rest[j] != '"' {
		return nil, sniffAmbiguous
	}
	end := bytes.IndexAny(rest[j+1:], `"\`)
	if end < 0 || rest[j+1+end] == '\\' {
		return nil, sniffAmbiguous
	}
	return rest[j+1 : j+1+end], sniffValue
}

// Keys count days and hours since the epoch, in UTC, and hold strings by their
// id in names, 0 being null.
type (
	dayKey struct {
		daily int32 // the index in dailyEvents
		day   int64
	}
	guildHourKey struct {
		guild uint32
		hour  int64
	}
	appCommandKey struct {
		guild, app uint32
		day        int64
	}
	reactionKey struct {
		channel, emoji uint32
		day            int64
	}
	osDayKey struct {
		os  uint32
		day int64
	}
	// sessionEvent and voiceEvent keep their position in the file, so that
	// sorting by (timestamp, position) reproduces Python's stable sort.
	sessionEvent struct {
		ts    int64
		order uint64
		os    uint32
		start bool
	}
	voiceEvent struct {
		ts             int64
		order          uint64
		channel, guild uint32
		join           bool
	}
)

// names interns the strings stored events carry, for all the workers of a
// stream: a stream repeats a few os names and ids many times, and a stored
// event is then a few integers. Id 0 is null.
type names struct {
	mu  sync.Mutex
	ids map[string]uint32
	all []string
}

func newNames() *names { return &names{ids: map[string]uint32{}} }

func (n *names) id(s []byte) uint32 {
	n.mu.Lock()
	defer n.mu.Unlock()
	if id, ok := n.ids[string(s)]; ok {
		return id
	}
	n.all = append(n.all, string(s))
	id := uint32(len(n.all))
	n.ids[n.all[id-1]] = id
	return id
}

// str and ptr read the strings back once the stream is read, when the table no
// longer grows.
func (n *names) str(id uint32) string { return n.all[id-1] }

func (n *names) ptr(id uint32) *string {
	if id == 0 {
		return nil
	}
	return &n.all[id-1]
}

type activityAgg struct {
	lines, events int64
	tooLong       int
	usable        bool
	// read counts the relevant events the parser took and failed those it
	// left out over a problem; the events the reference skips silently are in
	// neither.
	read, failed int64
	daily        map[dayKey]int64
	guildJoined  map[guildHourKey]int64
	appCommands  map[appCommandKey]int64
	reactions    map[reactionKey]int64
	appOpened    map[osDayKey]int64
	sessions     []sessionEvent
	voice        []voiceEvent
	sessionParts [][]sessionEvent
	voiceParts   [][]voiceEvent
	names        *names // set once the stream is read, nil without events
	issues       map[issueKey]int
}

func newActivityAgg() *activityAgg {
	return &activityAgg{
		daily:       map[dayKey]int64{},
		guildJoined: map[guildHourKey]int64{},
		appCommands: map[appCommandKey]int64{},
		reactions:   map[reactionKey]int64{},
		appOpened:   map[osDayKey]int64{},
		issues:      map[issueKey]int{},
	}
}

// setAside drops what the stream contributed, keeping its line count and
// issues.
func (a *activityAgg) setAside() {
	kept := newActivityAgg()
	kept.lines, kept.issues = a.lines, a.issues
	*a = *kept
}

func (a *activityAgg) merge(b *activityAgg) {
	a.lines += b.lines
	a.events += b.events
	a.tooLong += b.tooLong
	a.read += b.read
	a.failed += b.failed
	for k, n := range b.daily {
		a.daily[k] += n
	}
	for k, n := range b.guildJoined {
		a.guildJoined[k] += n
	}
	for k, n := range b.appCommands {
		a.appCommands[k] += n
	}
	for k, n := range b.reactions {
		a.reactions[k] += n
	}
	for k, n := range b.appOpened {
		a.appOpened[k] += n
	}
	// Stored events are kept per chunk and joined once, at their final size.
	if len(b.sessions) > 0 {
		a.sessionParts = append(a.sessionParts, b.sessions)
	}
	if len(b.voice) > 0 {
		a.voiceParts = append(a.voiceParts, b.voice)
	}
	for k, n := range b.issues {
		a.issues[k] += n
	}
}

type lineReader struct {
	agg    *activityAgg
	s      *stream
	fields eventFields
	str    []byte
}

func (r *lineReader) issue(spec eventSpec, field int, problem string) {
	fname := ""
	if field >= 0 {
		fname = fieldNames[field]
	}
	r.agg.issues[issueKey{r.s.path, spec.name, fname, problem}]++
}

func (r *lineReader) markUsable() {
	if !r.s.usable.Load() {
		r.s.usable.Store(true)
	}
}

// order is the line's position in the stream.
func (r *lineReader) line(line []byte, order uint64) {
	r.agg.lines++
	et, s := sniffEventType(line)
	var spec eventSpec
	switch s {
	case sniffAbsent:
		return
	case sniffValue:
		var used bool
		if spec, used = eventTypes[string(et)]; !used {
			if !r.s.usable.Load() {
				r.confirmUsable(line)
			}
			return
		}
	}
	if !json.Valid(line) {
		if spec.kind != 0 {
			r.agg.failed++
		}
		r.issue(spec, -1, ProblemMalformed)
		return
	}
	f := &r.fields
	if scanEvent(line, f) != nil || !f.has(fEventType) {
		return
	}
	if s == sniffAmbiguous {
		name, _ := decodeString(f.values[fEventType])
		var used bool
		if spec, used = eventTypes[name]; !used {
			r.markUsable()
			return
		}
	}
	r.agg.events++
	switch r.event(spec, f, order) {
	case eventRead:
		r.agg.read++
	case eventFailed:
		r.agg.failed++
	}
}

// confirmUsable decodes a line of an unused type to check that its
// `event_type` is a top-level key, which is what makes the reference treat the
// stream as having usable events.
func (r *lineReader) confirmUsable(line []byte) {
	if !json.Valid(line) {
		return
	}
	f := &r.fields
	if scanEvent(line, f) == nil && f.has(fEventType) {
		r.markUsable()
	}
}

// timestamp reads a field holding a timestamp such as `"\"2021-04-06T12:34:56.789Z\""`,
// the leading quote being part of the value.
func (r *lineReader) timestamp(spec eventSpec, f *eventFields, field int) (int64, bool) {
	if !f.has(field) {
		r.issue(spec, field, ProblemMissing)
		return 0, false
	}
	v := f.values[field]
	switch kindOf(v) {
	case kindString:
	case kindNull:
		r.issue(spec, field, ProblemNull)
		return 0, false
	default:
		r.issue(spec, field, ProblemWrongType)
		return 0, false
	}
	var ts int64
	var ok bool
	if r.str, ok = appendSimple(r.str[:0], v); ok {
		ts, ok = pyTimestamp(r.str, 1)
	} else {
		s, _ := decodeString(v)
		ts, ok = pyTimestamp(s, 1)
	}
	if !ok {
		r.issue(spec, field, ProblemUnparseable)
	}
	return ts, ok
}

// text reads a field holding a string, as its id in names; null is 0.
func (r *lineReader) text(spec eventSpec, f *eventFields, field int) (uint32, bool) {
	if !f.has(field) {
		r.issue(spec, field, ProblemMissing)
		return 0, false
	}
	v := f.values[field]
	switch kindOf(v) {
	case kindString:
		raw := v[1 : len(v)-1]
		if bytes.IndexByte(raw, '\\') >= 0 {
			s, _ := decodeString(v)
			raw = append(r.str[:0], s...)
			r.str = raw
		}
		return r.s.names.id(raw), true
	case kindNull:
		return 0, true
	}
	r.issue(spec, field, ProblemWrongType)
	return 0, false
}

// outcome is what event did with an event of a type the parser reads. A field
// reported but replaced, for eg. a missing `client_track_timestamp`, still
// gives eventRead.
type outcome uint8

const (
	eventRead    outcome = iota // taken, as the reference takes it
	eventSkipped                // left out without a problem, as the reference does
	eventFailed                 // left out over a problem, which is reported
)

// event mirrors the reference's per-event branches, in their order of checks.
// A field is only checked where the reference stores or tests it.
func (r *lineReader) event(spec eventSpec, f *eventFields, order uint64) outcome {
	a := r.agg
	// An application command the reference skips (id '-1', no guild) doesn't
	// make the stream usable: its `continue` comes before the line is counted.
	if spec.kind != evApplicationCommandUsed {
		r.markUsable()
	}
	switch spec.kind {
	case evJoinVoice, evLeaveVoice:
		if !f.has(fChannelID) {
			return eventSkipped
		}
		field := fClientTrackTimestamp
		switch v := f.values[fClientTrackTimestamp]; {
		case !f.has(fClientTrackTimestamp):
			r.issue(spec, fClientTrackTimestamp, ProblemMissing)
			field = fTimestamp
		case kindOf(v) == kindNull:
			r.issue(spec, fClientTrackTimestamp, ProblemNull)
			field = fTimestamp
		default:
			// The reference compares with the string 'null', which is what
			// exports write when the client sent no timestamp.
			if s, ok := decodeString(v); ok && s == "null" {
				field = fTimestamp
			}
		}
		ts, ok := r.timestamp(spec, f, field)
		if !ok {
			return eventFailed
		}
		channel, ok := r.text(spec, f, fChannelID)
		if !ok {
			return eventFailed
		}
		if channel == 0 {
			r.issue(spec, fChannelID, ProblemNull)
			return eventFailed
		}
		// A session takes its guild from the join.
		var guild uint32
		if spec.kind == evJoinVoice && f.has(fGuildID) {
			if guild, ok = r.text(spec, f, fGuildID); !ok {
				return eventFailed
			}
		}
		a.voice = append(a.voice, voiceEvent{ts: ts, order: order, join: spec.kind == evJoinVoice, channel: channel, guild: guild})

	case evSessionStart, evSessionEnd:
		if !f.has(fOS) {
			return eventSkipped
		}
		ts, ok := r.timestamp(spec, f, fTimestamp)
		if !ok {
			return eventFailed
		}
		// A session takes its os from the start.
		var os uint32
		if spec.kind == evSessionStart {
			if os, ok = r.text(spec, f, fOS); !ok {
				return eventFailed
			}
		}
		a.sessions = append(a.sessions, sessionEvent{ts: ts, order: order, start: spec.kind == evSessionStart, os: os})

	case evGuildJoined:
		ts, ok := r.timestamp(spec, f, fTimestamp)
		if !ok {
			return eventFailed
		}
		guild, ok := r.text(spec, f, fGuildID)
		if !ok {
			return eventFailed
		}
		a.guildJoined[guildHourKey{guild: guild, hour: floorDiv(ts, secondsPerHour)}]++

	case evApplicationCommandUsed:
		if !f.has(fApplicationID) {
			r.issue(spec, fApplicationID, ProblemMissing)
			return eventFailed
		}
		if s, ok := decodeString(f.values[fApplicationID]); ok && s == "-1" || !f.has(fGuildID) {
			return eventSkipped
		}
		r.markUsable()
		ts, ok := r.timestamp(spec, f, fTimestamp)
		if !ok {
			return eventFailed
		}
		app, ok := r.text(spec, f, fApplicationID)
		if !ok {
			return eventFailed
		}
		guild, ok := r.text(spec, f, fGuildID)
		if !ok {
			return eventFailed
		}
		// pandas' groupby drops rows with a null key.
		if app != 0 && guild != 0 {
			a.appCommands[appCommandKey{guild: guild, app: app, day: floorDiv(ts, secondsPerDay)}]++
		}

	case evAddReaction:
		ts, ok := r.timestamp(spec, f, fTimestamp)
		if !ok {
			return eventFailed
		}
		if !f.has(fUserID) {
			r.issue(spec, fUserID, ProblemMissing)
			return eventFailed
		}
		channel, ok := r.text(spec, f, fChannelID)
		if !ok {
			return eventFailed
		}
		emoji, ok := r.text(spec, f, fEmojiName)
		if !ok {
			return eventFailed
		}
		if channel != 0 && emoji != 0 {
			a.reactions[reactionKey{channel: channel, emoji: emoji, day: floorDiv(ts, secondsPerDay)}]++
		}

	case evAppOpened:
		if !f.has(fOS) {
			return eventSkipped
		}
		ts, ok := r.timestamp(spec, f, fTimestamp)
		if !ok {
			return eventFailed
		}
		os, ok := r.text(spec, f, fOS)
		if !ok {
			return eventFailed
		}
		if os != 0 {
			a.appOpened[osDayKey{os: os, day: floorDiv(ts, secondsPerDay)}]++
		}

	case evDaily:
		ts, ok := r.timestamp(spec, f, fTimestamp)
		if !ok {
			return eventFailed
		}
		a.daily[dayKey{daily: int32(spec.daily), day: floorDiv(ts, secondsPerDay)}]++
	}
	return eventRead
}
