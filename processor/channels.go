package processor

import (
	"bytes"
	"errors"
	"io"
	"strings"
)

type guildEntry struct {
	id   string
	name *string
}

func readServersIndex(data []byte, path string, iss *issues) ([]guildEntry, bool) {
	m, err := parseObject(data)
	if err != nil {
		iss.add(path, "", "", problemOf(err), 1)
		return nil, false
	}
	out := make([]guildEntry, 0, len(m.keys))
	for _, id := range m.keys {
		v := m.values[id]
		g := guildEntry{id: id}
		switch kindOf(v) {
		case kindString:
			s, _ := decodeString(v)
			g.name = &s
		case kindNull:
		case kindNumber:
			if n, _ := decodeNumber(v); n.isInt {
				g.name = strPtr(itoa(n.i))
				break
			}
			fallthrough
		default:
			iss.add(path, "", "{guild_id}", ProblemWrongType, 1)
			continue
		}
		out = append(out, g)
	}
	return out, true
}

func readMessagesIndex(data []byte, path string, iss *issues) (map[string]string, bool) {
	m, err := parseObject(data)
	if err != nil {
		iss.add(path, "", "", problemOf(err), 1)
		return nil, false
	}
	out := make(map[string]string, len(m.keys))
	for _, id := range m.keys {
		v := m.values[id]
		switch kindOf(v) {
		case kindNull:
			continue
		case kindString:
		default:
			iss.add(path, "", "{channel_id}", ProblemWrongType, 1)
			continue
		}
		full, _ := decodeString(v)
		out[id] = channelName(full)
	}
	return out, true
}

// channelName renames an index label as the reference does, for guild channels
// too: 20 characters go with a "Direct Message with" prefix, and the last five
// whenever "#0000" appears anywhere in the name.
func channelName(full string) string {
	name := full
	if strings.HasPrefix(full, "Direct Message with") {
		name = pySlice(full, 20, len(full))
	}
	if strings.Contains(name, "#0000") {
		r := []rune(name)
		name = string(r[:max(len(r)-5, 0)])
	}
	return name
}

type channelKind uint8

const (
	channelDM channelKind = iota + 1
	channelGuild
)

type channelResult struct {
	kind      channelKind
	channelID string
	dmUserID  *string
	guildID   *string
	total     int64
	hours     map[int64]int64 // message count per wall-clock hour
}

type channelInput struct {
	channelPath  string
	channel      members
	channelID    string
	messagesPath string
	messages     io.Reader
}

// A channel with exactly two recipients is a DM, else one with a guild is a
// guild channel, else it is ignored, group DMs included. Its issues are only
// reported once `messages.json` is known to be well formed, which the
// reference reads first. err is a read error.
func readChannel(in channelInput, ownerID string, iss *issues) (channelResult, error) {
	var found issues
	res := classifyChannel(in, ownerID, &found)
	mc, problem, err := readMessages(in.messages, res.kind == channelDM)
	if err != nil || problem != "" {
		if problem != "" {
			iss.add(in.messagesPath, "", "", problem, 1)
		}
		return channelResult{}, err
	}
	iss.merge(found.m)
	if res.kind == 0 {
		return res, nil
	}
	iss.add(in.messagesPath, "", "[]", ProblemWrongType, mc.notObjects)
	iss.add(in.messagesPath, "", "Timestamp", ProblemMissing, mc.missingTS)
	iss.add(in.messagesPath, "", "Timestamp", ProblemWrongType, mc.wrongTS)
	iss.add(in.messagesPath, "", "Timestamp", ProblemUnparseable, mc.unparseable)
	iss.add(in.messagesPath, "", "Contents", ProblemMissing, mc.missingContents)
	if mc.mixed {
		iss.add(in.messagesPath, "", "Timestamp", ProblemMixedFormats, 1)
	}
	res.total, res.hours = mc.total, mc.hours
	return res, nil
}

func classifyChannel(in channelInput, ownerID string, iss *issues) channelResult {
	res := channelResult{channelID: in.channelID}
	isDM := false
	if rv, has := in.channel.get("recipients"); has {
		switch kindOf(rv) {
		case kindArray:
			var recipients [][]byte
			_ = eachElement(rv, func(v []byte) bool {
				recipients = append(recipients, v)
				return true
			})
			if len(recipients) == 2 {
				isDM = true
				id, ok := dmUserID(recipients, ownerID, in.channelPath, iss)
				if !ok {
					return res
				}
				res.dmUserID = id
			}
		case kindNull:
			iss.add(in.channelPath, "", "recipients", ProblemNull, 1)
		default:
			iss.add(in.channelPath, "", "recipients", ProblemWrongType, 1)
		}
	}
	if isDM {
		res.kind = channelDM
	} else if gv, has := in.channel.get("guild"); has {
		gm, ok := guildOf(gv, in.channelPath, iss)
		if !ok {
			return res
		}
		res.kind = channelGuild
		res.guildID = gm
	}
	return res
}

// dmUserID picks the first recipient that isn't the owner. A DM with yourself
// has none, where the reference fails; the owner is used instead.
func dmUserID(recipients [][]byte, ownerID, path string, iss *issues) (*string, bool) {
	values := make([]*string, len(recipients))
	for i, v := range recipients {
		switch kindOf(v) {
		case kindString:
			s, _ := decodeString(v)
			values[i] = &s
		case kindNull:
		default:
			iss.add(path, "", "recipients[]", ProblemWrongType, 1)
			return nil, false
		}
	}
	for _, v := range values {
		if v == nil || *v != ownerID {
			return v, true
		}
	}
	iss.add(path, "", "recipients", ProblemSelfDM, 1)
	return strPtr(ownerID), true
}

func guildOf(gv []byte, path string, iss *issues) (*string, bool) {
	switch kindOf(gv) {
	case kindObject:
	case kindNull:
		iss.add(path, "", "guild", ProblemNull, 1)
		return nil, false
	default:
		iss.add(path, "", "guild", ProblemWrongType, 1)
		return nil, false
	}
	gm, err := objectMembers(gv)
	if err != nil {
		iss.add(path, "", "guild", ProblemMalformed, 1)
		return nil, false
	}
	idv, has := gm.get("id")
	if !has {
		iss.add(path, "", "guild.id", ProblemMissing, 1)
		return nil, false
	}
	// The reference reads the name without using it, so only its absence is
	// reported.
	if _, has := gm.get("name"); !has {
		iss.add(path, "", "guild.name", ProblemMissing, 1)
	}
	switch kindOf(idv) {
	case kindString:
		s, _ := decodeString(idv)
		return &s, true
	case kindNull:
		return nil, true
	}
	iss.add(path, "", "guild.id", ProblemWrongType, 1)
	return nil, false
}

// messageCounts is what a `messages.json` gives the tables.
type messageCounts struct {
	total int64
	hours map[int64]int64 // message count per wall-clock hour
	// A channel mixing timestamp formats or offsets, on which pandas fails, is
	// reported and counted per message.
	mixed                                                        bool
	notObjects, missingTS, wrongTS, unparseable, missingContents int
}

// readMessages walks a `messages.json` as it is read, so that its size doesn't
// matter. problem is set when the whole file is unusable, err on a read error.
func readMessages(r io.Reader, dm bool) (mc messageCounts, problem string, err error) {
	s := newJSONStream(r)
	mc.hours = map[int64]int64{}
	c := s.nonSpace()
	if c != '[' {
		s.value(c, 1)
		s.end()
		if s.err == nil {
			return mc, ProblemWrongType, nil
		}
	} else {
		var first *messageStamp
		c = s.nonSpace()
		for done := c == ']'; !done && s.err == nil; {
			mc.total++
			if c == '{' {
				s.message(&mc, &first, dm)
			} else {
				mc.notObjects++
				s.value(c, 2)
			}
			c, done = s.close(']')
		}
		s.end()
	}
	switch {
	case s.err == nil:
		return mc, "", nil
	case errors.Is(s.err, errSyntax):
		return messageCounts{}, ProblemMalformed, nil
	}
	return messageCounts{}, "", s.err
}

// message reads one message object, its opening brace already read, and counts
// it per wall-clock hour of its Timestamp, as pandas does after flooring. Null
// and empty timestamps are skipped like pandas' NaT.
func (s *jsonStream) message(mc *messageCounts, first **messageStamp, dm bool) {
	var ts []byte
	tsKind, tsWhole, hasContents := kindInvalid, true, false
	c := s.nonSpace()
	for done := c == '}'; !done && s.err == nil; {
		if c != '"' {
			s.fail()
			return
		}
		// 64 bytes hold `Timestamp` with every letter escaped.
		key, whole := s.str(64)
		if whole && bytes.IndexByte(key, '\\') >= 0 {
			key = []byte(keyString(key))
		}
		if s.nonSpace() != ':' {
			s.fail()
			return
		}
		v := s.nonSpace()
		switch {
		case whole && string(key) == "Timestamp":
			tsKind, tsWhole = kindOfByte(v), true
			if v == '"' {
				// Exports write 19 bytes, for eg. `2021-04-06 12:34:56`, and
				// a string over 64 counts as unparseable.
				var raw []byte
				raw, tsWhole = s.str(64)
				ts = append(ts[:0], raw...)
			} else {
				s.value(v, 3)
			}
		case whole && string(key) == "Contents":
			hasContents = true
			s.value(v, 3)
		default:
			s.value(v, 3)
		}
		c, done = s.close('}')
	}
	if s.err != nil {
		return
	}
	if dm && !hasContents {
		mc.missingContents++
	}
	switch tsKind {
	case kindInvalid:
		mc.missingTS++
		return
	case kindNull:
		return
	case kindString:
	default:
		mc.wrongTS++
		return
	}
	str, ok := decodeString(append(append([]byte{'"'}, ts...), '"'))
	if !ok || !tsWhole {
		mc.unparseable++
		return
	}
	if natString(str) {
		return
	}
	st, ok := parseMessageTimestamp(str)
	if !ok {
		mc.unparseable++
		return
	}
	if *first == nil {
		*first = &st
	} else if st.format != (*first).format || st.offset != (*first).offset {
		mc.mixed = true
	}
	mc.hours[st.hour]++
}
