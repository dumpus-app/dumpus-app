package processor

import (
	"cmp"
	"maps"
	"slices"
)

// buildModel fills the tables in the reference's order; rows within a table
// can come in another order, which only changes their rowids.
func buildModel(packageID string, own owner, rels []relationship, pf *packageFiles, act *activityAgg, stream *string, skipped bool) *Model {
	m := &Model{}

	friends := make(map[string]relationship, len(rels))
	for _, r := range rels {
		if _, seen := friends[r.id]; !seen {
			friends[r.id] = r
		}
	}

	// DMs come before guild channels. A channel missing from the messages index
	// is dropped from both tables, with its messages.
	ordered := make([]*channelResult, 0, len(pf.channels))
	for _, kind := range []channelKind{channelDM, channelGuild} {
		for i := range pf.channels {
			if pf.channels[i].kind == kind {
				ordered = append(ordered, &pf.channels[i])
			}
		}
	}
	for _, c := range ordered {
		name, ok := pf.labels[c.channelID]
		if !ok {
			continue
		}
		var guildID *string
		if c.kind == channelDM {
			row := DMChannel{
				ChannelID:         c.channelID,
				DMUserID:          c.dmUserID,
				UserName:          name,
				TotalMessageCount: c.total,
				SentimentScore:    0.5,
			}
			if c.dmUserID != nil {
				if f, ok := friends[*c.dmUserID]; ok {
					row.DisplayName, row.UserAvatarURL = f.displayName, f.avatarURL
				}
			}
			m.DMChannels = append(m.DMChannels, row)
		} else {
			guildID = c.guildID
			m.GuildChannels = append(m.GuildChannels, GuildChannel{
				ChannelID:         c.channelID,
				GuildID:           c.guildID,
				ChannelName:       name,
				TotalMessageCount: c.total,
			})
		}
		for _, hour := range slices.Sorted(maps.Keys(c.hours)) {
			day, h := hourParts(hour)
			m.Activity = append(m.Activity, Activity{
				EventName: "message_sent", Day: day, Hour: h, OccurrenceCount: c.hours[hour],
				ChannelID: strPtr(c.channelID), GuildID: guildID,
			})
		}
	}

	// A guild's total counts every channel of it that had messages, those
	// dropped above included.
	totals := map[string]int64{}
	for _, c := range pf.channels {
		if c.kind == channelGuild && c.guildID != nil {
			totals[*c.guildID] += c.total
		}
	}
	for _, g := range pf.guilds {
		m.Guilds = append(m.Guilds, Guild{GuildID: g.id, GuildName: g.name, TotalMessageCount: totals[g.id]})
	}

	m.Payments = pf.payments
	m.VoiceSessions = buildVoiceSessions(act.voice, act.names)
	m.Sessions = buildSessions(act.sessions, act.names)
	m.Activity = append(m.Activity, activityRows(act)...)

	isPartial := !(stream != nil && act.usable) || !pf.serversIndexRead || !pf.messagesIndexRead || skipped
	m.Package = PackageData{
		PackageID:        packageID,
		PackageVersion:   PackageVersion,
		OwnerID:          own.id,
		OwnerName:        own.username,
		OwnerDisplayName: own.displayName,
		OwnerAvatarURL:   own.avatarURL,
		IsPartial:        isPartial,
		ActivityStream:   stream,
	}
	return m
}

func activityRows(a *activityAgg) []Activity {
	var rows []Activity

	n := a.names
	// Rows are sorted by their strings, not their ids, which depend on which
	// worker met a string first.
	name := func(id uint32) string {
		if id == 0 {
			return ""
		}
		return n.str(id)
	}
	for _, k := range slices.SortedFunc(maps.Keys(a.guildJoined), func(x, y guildHourKey) int {
		return cmp.Or(compareBool(x.guild == 0, y.guild == 0), cmp.Compare(name(x.guild), name(y.guild)), cmp.Compare(x.hour, y.hour))
	}) {
		day, h := hourParts(k.hour)
		rows = append(rows, Activity{EventName: "guild_joined", Day: day, Hour: h, OccurrenceCount: a.guildJoined[k], GuildID: n.ptr(k.guild)})
	}

	for _, k := range slices.SortedFunc(maps.Keys(a.appCommands), func(x, y appCommandKey) int {
		return cmp.Or(cmp.Compare(name(x.guild), name(y.guild)), cmp.Compare(name(x.app), name(y.app)), cmp.Compare(x.day, y.day))
	}) {
		rows = append(rows, Activity{
			EventName: "application_command_used", Day: dayString(k.day), OccurrenceCount: a.appCommands[k],
			GuildID: n.ptr(k.guild), UserID: n.ptr(k.app),
		})
	}

	for _, k := range slices.SortedFunc(maps.Keys(a.reactions), func(x, y reactionKey) int {
		return cmp.Or(cmp.Compare(name(x.channel), name(y.channel)), cmp.Compare(name(x.emoji), name(y.emoji)), cmp.Compare(x.day, y.day))
	}) {
		// The reference tests the first reaction's numpy bool with `is True`,
		// which never holds, so every reaction is stored as not custom.
		rows = append(rows, Activity{
			EventName: "add_reaction", Day: dayString(k.day), OccurrenceCount: a.reactions[k],
			ChannelID: n.ptr(k.channel), ExtraField1: n.ptr(k.emoji), ExtraField2: strPtr("0"),
		})
	}

	for _, k := range slices.SortedFunc(maps.Keys(a.appOpened), func(x, y osDayKey) int {
		return cmp.Or(cmp.Compare(name(x.os), name(y.os)), cmp.Compare(x.day, y.day))
	}) {
		rows = append(rows, Activity{
			EventName: "app_opened", Day: dayString(k.day), OccurrenceCount: a.appOpened[k],
			ExtraField1: n.ptr(k.os),
		})
	}

	days := slices.SortedFunc(maps.Keys(a.daily), func(x, y dayKey) int {
		return cmp.Or(cmp.Compare(x.daily, y.daily), cmp.Compare(x.day, y.day))
	})
	for _, k := range days {
		rows = append(rows, Activity{EventName: dailyEvents[k.daily].name, Day: dayString(k.day), OccurrenceCount: a.daily[k]})
	}
	return rows
}

func compareBool(a, b bool) int {
	switch {
	case a == b:
		return 0
	case a:
		return 1
	}
	return -1
}
