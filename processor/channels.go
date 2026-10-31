package processor

import (
	"bytes"
	"encoding/json"
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
	messagesJSON []byte
}

// A channel with exactly two recipients is a DM, else one with a guild is a
// guild channel, else it is ignored, group DMs included.
func readChannel(in channelInput, ownerID string, iss *issues) channelResult {
	res := channelResult{channelID: in.channelID}
	cj := in.channel
	if !json.Valid(in.messagesJSON) {
		iss.add(in.messagesPath, "", "", ProblemMalformed, 1)
		return res
	}
	if kindOf(in.messagesJSON[skipSpace(in.messagesJSON, 0):]) != kindArray {
		iss.add(in.messagesPath, "", "", ProblemWrongType, 1)
		return res
	}

	isDM := false
	if rv, has := cj.get("recipients"); has {
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
	} else if gv, has := cj.get("guild"); has {
		gm, ok := guildOf(gv, in.channelPath, iss)
		if !ok {
			return res
		}
		res.kind = channelGuild
		res.guildID = gm
	} else {
		return res
	}
	countMessages(&res, in.messagesJSON, in.messagesPath, res.kind == channelDM, iss)
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

// A channel mixing timestamp formats or offsets, on which pandas fails, is
// reported and counted per message.
func countMessages(res *channelResult, data []byte, path string, dm bool, iss *issues) {
	res.hours = map[int64]int64{}
	var first *messageStamp
	mixed := false
	var missingTS, wrongTS, unparseable, missingContents, notObjects int
	_ = eachElement(data, func(v []byte) bool {
		res.total++
		if kindOf(v) != kindObject {
			notObjects++
			return true
		}
		var ts []byte
		hasTS, hasContents := false, false
		_ = eachMember(v, func(key, value []byte) bool {
			if bytes.IndexByte(key, '\\') >= 0 {
				key = []byte(keyString(key))
			}
			switch string(key) {
			case "Timestamp":
				ts, hasTS = value, true
			case "Contents":
				hasContents = true
			}
			return true
		})
		if dm && !hasContents {
			missingContents++
		}
		if !hasTS {
			missingTS++
			return true
		}
		switch kindOf(ts) {
		case kindNull:
			return true
		case kindString:
		default:
			wrongTS++
			return true
		}
		s, _ := decodeString(ts)
		if natString(s) {
			return true
		}
		st, ok := parseMessageTimestamp(s)
		if !ok {
			unparseable++
			return true
		}
		if first == nil {
			first = &st
		} else if st.format != first.format || st.offset != first.offset {
			mixed = true
		}
		res.hours[st.hour]++
		return true
	})
	iss.add(path, "", "[]", ProblemWrongType, notObjects)
	iss.add(path, "", "Timestamp", ProblemMissing, missingTS)
	iss.add(path, "", "Timestamp", ProblemWrongType, wrongTS)
	iss.add(path, "", "Timestamp", ProblemUnparseable, unparseable)
	iss.add(path, "", "Contents", ProblemMissing, missingContents)
	if mixed {
		iss.add(path, "", "Timestamp", ProblemMixedFormats, 1)
	}
}
