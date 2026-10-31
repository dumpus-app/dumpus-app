package processor

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"reflect"
	"slices"
	"strings"
	"testing"
)

// Synthetic packages: every id, name and value below is made up.

type entry struct{ name, body string }

func zipOf(t testing.TB, entries []entry) (*bytes.Reader, int64) {
	t.Helper()
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for _, e := range entries {
		method := zip.Deflate
		if strings.HasSuffix(e.name, "/") {
			method = zip.Store
		}
		w, err := zw.CreateHeader(&zip.FileHeader{Name: e.name, Method: method})
		if err != nil {
			t.Fatal(err)
		}
		if _, err := w.Write([]byte(e.body)); err != nil {
			t.Fatal(err)
		}
	}
	if err := zw.Close(); err != nil {
		t.Fatal(err)
	}
	return bytes.NewReader(buf.Bytes()), int64(buf.Len())
}

func process(t testing.TB, entries []entry) *Result {
	t.Helper()
	r, size := zipOf(t, entries)
	res, err := Process(context.Background(), r, size, Options{PackageID: "pkg-test", Workers: 3})
	if err != nil {
		t.Fatal(err)
	}
	return res
}

// ts is an analytics timestamp value, which keeps its own quotes.
func ts(s string) string { return `"\"` + s + `\""` }

// event is one activity line from key and raw JSON value pairs.
func event(eventType string, kv ...string) string {
	parts := []string{`"event_type":"` + eventType + `"`}
	for i := 0; i < len(kv); i += 2 {
		parts = append(parts, `"`+kv[i]+`":`+kv[i+1])
	}
	return "{" + strings.Join(parts, ",") + "}"
}

func lines(ls ...string) string { return strings.Join(ls, "\n") + "\n" }

type folders struct{ account, messages, servers, activity string }

var english = folders{"Account", "Messages", "Servers", "Activity"}

const (
	ownerID   = "100000000000000001"
	friend    = "200000000000000002"
	stranger  = "200000000000000009"
	guildOne  = "300000000000000001"
	guildTwo  = "300000000000000002"
	dmFriend  = "400000000000000001"
	dmOther   = "400000000000000002"
	general   = "400000000000000003"
	unindexed = "400000000000000004"
	group     = "400000000000000005"
	noMsgs    = "400000000000000007"
	news      = "400000000000000008"
	app       = "600000000000000001"
	voiceChan = "700000000000000001"
)

var userJSON = `{
  "id": "` + ownerID + `", "username": "owner_user", "global_name": "Owner Name",
  "email": "owner@example.invalid", "avatar_hash": "a_ownerhash",
  "relationships": [
    {"id": "` + friend + `", "type": 1, "nickname": null,
     "user": {"id": "` + friend + `", "username": "friend_one", "global_name": "Friend One", "avatar": "friendhash", "discriminator": "0"}},
    {"id": "200000000000000003", "type": 1, "nickname": null,
     "user": {"id": "200000000000000003", "username": "friend_two", "global_name": null, "avatar": null, "discriminator": "0"}}
  ]
}`

var paymentsJSON = `{"records": [
  {"id": "p1", "status": 1, "currency": "usd", "amount": 999, "created_at": "2022-03-04T05:06:07.000000+00:00", "description": "Nitro"},
  {"id": "p2", "status": 3, "currency": "usd", "amount": 999, "created_at": "2022-04-04T05:06:07.000000+00:00", "description": "Refunded"},
  {"id": "p3", "status": 1, "currency": "discord_orb", "amount": 700, "created_at": "2022-05-04T05:06:07.000000+00:00", "description": "Orbs"},
  {"id": "p4", "status": 1, "currency": "eur", "amount": 4.5, "created_at": "2022-12-31T23:59:59+00:00", "description": "Boost"}
]}`

func messages(timestamps ...string) string {
	var ms []string
	for i, t := range timestamps {
		ms = append(ms, fmt.Sprintf(`{"ID": %d, "Timestamp": "%s", "Contents": "text", "Attachments": ""}`, i+1, t))
	}
	return "[" + strings.Join(ms, ", ") + "]"
}

func channelFolder(l folders, id, channelJSON, messagesJSON string) []entry {
	dir := l.messages + "/c" + id + "/"
	es := []entry{{dir, ""}, {dir + "channel.json", channelJSON}}
	if messagesJSON != "" {
		es = append(es, entry{dir + "messages.json", messagesJSON})
	}
	return es
}

func dmChannel(id string, recipients ...string) string {
	return `{"id": "` + id + `", "type": 1, "recipients": ["` + strings.Join(recipients, `", "`) + `"]}`
}

func guildChannel(id, guild string) string {
	return `{"id": "` + id + `", "type": 0, "name": "chan", "guild": {"id": "` + guild + `", "name": "Guild"}}`
}

var activityLines = lines(
	event("session_start", "timestamp", ts("2021-04-06T10:00:30.123Z"), "os", `"Windows"`),
	event("session_start", "timestamp", ts("2021-04-06T10:05:00.000Z")),
	event("session_end", "timestamp", ts("2021-04-06T11:30:59.999Z"), "os", `"Windows"`),
	event("app_opened", "timestamp", ts("2021-04-06T10:00:00.000Z"), "os", `"Windows"`),
	event("app_opened", "timestamp", ts("2021-04-06T23:59:59.999Z"), "os", `"Windows"`),
	event("app_opened", "timestamp", ts("2021-04-07T00:00:00.000Z"), "os", `"Android"`),
	event("app_opened", "timestamp", ts("2021-04-07T00:00:00.000Z")),
	event("add_reaction", "timestamp", ts("2021-04-06T08:00:00.000Z"), "user_id", `"`+ownerID+`"`,
		"channel_id", `"`+general+`"`, "emoji_name", `"thumbsup"`),
	event("add_reaction", "timestamp", ts("2021-04-06T08:01:00.000Z"), "user_id", `"`+ownerID+`"`,
		"channel_id", `"`+general+`"`, "emoji_name", `"custom_emoji"`, "emoji_id", `"500000000000000001"`),
	event("guild_joined", "timestamp", ts("2021-04-06T08:15:00.000Z"), "guild_id", `"`+guildTwo+`"`),
	event("application_command_used", "timestamp", ts("2021-04-06T09:00:00.000Z"),
		"application_id", `"`+app+`"`, "guild_id", `"`+guildOne+`"`),
	event("application_command_used", "timestamp", ts("2021-04-06T09:00:00.000Z"),
		"application_id", `"-1"`, "guild_id", `"`+guildOne+`"`),
	event("application_command_used", "timestamp", ts("2021-04-06T09:00:00.000Z"), "application_id", `"`+app+`"`),
	event("join_voice_channel", "timestamp", ts("2021-04-06T20:00:00.000Z"),
		"client_track_timestamp", ts("2021-04-06T20:01:00.000Z"), "channel_id", `"`+voiceChan+`"`, "guild_id", `"`+guildOne+`"`),
	event("leave_voice_channel", "timestamp", ts("2021-04-06T20:45:00.000Z"),
		"client_track_timestamp", `"null"`, "channel_id", `"`+voiceChan+`"`, "guild_id", `"`+guildOne+`"`),
	event("email_opened", "timestamp", ts("2021-04-06T09:00:00.000Z")),
	event("oauth2_authorize_accepted", "timestamp", ts("2021-04-06T09:00:00.000Z"), "application_id", `"`+app+`"`),
	event("notification_clicked", "timestamp", ts("2021-04-06T09:00:00.000Z")),
	event("voice_message_recorded", "timestamp", ts("2021-04-06T09:00:00.000Z")),
	event("app_native_crash", "timestamp", ts("2021-04-06T09:00:00.000Z")),
	event("app_crashed", "timestamp", ts("2021-04-06T09:30:00.000Z")),
	event("some_unused_event", "timestamp", ts("2021-04-06T09:00:00.000Z")),
	`{"no_event_type": true}`,
)

// fullPackage is a package with every section, in the given folders.
func fullPackage(l folders) []entry {
	es := []entry{
		{l.account + "/", ""},
		{l.account + "/user.json", userJSON},
		{l.account + "/user_data_exports/discord_billing/payments.json", paymentsJSON},
		// Another user.json deeper down must not be taken for the owner's.
		{"Activities/Activities_1/users/user.json", `{"id": "1"}`},
		{l.servers + "/index.json", `{"` + guildOne + `": "Guild One", "` + guildTwo + `": "Guild Two"}`},
		{l.servers + "/" + guildOne + "/guild.json", `{"id": "` + guildOne + `", "name": "Guild One"}`},
		{l.messages + "/index.json", `{
			"` + dmFriend + `": "Direct Message with friend_one#0000",
			"` + dmOther + `": "Direct Message with stranger",
			"` + general + `": "general",
			"` + group + `": "Group Chat",
			"` + news + `": "news#0000-old",
			"400000000000000006": null}`},
	}
	es = append(es, channelFolder(l, dmFriend, dmChannel(dmFriend, ownerID, friend),
		messages("2021-04-06 12:34:56", "2021-04-06 12:59:59", "2021-04-06 13:00:00"))...)
	es = append(es, channelFolder(l, dmOther, dmChannel(dmOther, stranger, ownerID), messages("2021-04-07 00:00:00"))...)
	es = append(es, channelFolder(l, general, guildChannel(general, guildOne),
		messages("2021-04-06 23:59:59.500", "2021-04-06 23:00:00.000"))...)
	es = append(es, channelFolder(l, unindexed, guildChannel(unindexed, guildOne),
		messages("2021-04-06 01:00:00", "2021-04-06 01:00:00", "2021-04-06 01:00:00", "2021-04-06 01:00:00", "2021-04-06 01:00:00"))...)
	es = append(es, channelFolder(l, group, dmChannel(group, ownerID, friend, stranger), messages("2021-04-06 12:00:00"))...)
	es = append(es, channelFolder(l, noMsgs, guildChannel(noMsgs, guildOne), "")...)
	es = append(es, channelFolder(l, news, guildChannel(news, guildTwo), messages("2021-04-06 12:00:00"))...)
	es = append(es,
		entry{l.activity + "/", ""},
		entry{l.activity + "/analytics/events-2021-00000-of-00001.json", activityLines},
		entry{l.activity + "/tns/events-2021-00000-of-00001.json", lines(event("app_opened", "timestamp", ts("2020-01-01T00:00:00.000Z"), "os", `"tns"`))},
	)
	return es
}

func ptr(s *string) string {
	if s == nil {
		return "NULL"
	}
	return *s
}

// tables formats every row of the model, each table sorted.
func tables(m *Model) map[string][]string {
	out := map[string][]string{}
	add := func(table, row string) { out[table] = append(out[table], row) }
	for _, r := range m.Activity {
		add("activity", fmt.Sprintf("%s|%s|%d|%d|%s|%s|%s|%s|%s", r.EventName, r.Day, r.Hour, r.OccurrenceCount,
			ptr(r.ChannelID), ptr(r.GuildID), ptr(r.UserID), ptr(r.ExtraField1), ptr(r.ExtraField2)))
	}
	for _, r := range m.DMChannels {
		add("dm_channels_data", fmt.Sprintf("%s|%s|%s|%s|%s|%d|%d|%v", r.ChannelID, ptr(r.DMUserID), r.UserName,
			ptr(r.DisplayName), ptr(r.UserAvatarURL), r.TotalMessageCount, r.TotalVoiceChannelDuration, r.SentimentScore))
	}
	for _, r := range m.GuildChannels {
		add("guild_channels_data", fmt.Sprintf("%s|%s|%s|%d|%d", r.ChannelID, ptr(r.GuildID), r.ChannelName,
			r.TotalMessageCount, r.TotalVoiceChannelDuration))
	}
	for _, r := range m.Guilds {
		add("guilds", fmt.Sprintf("%s|%s|%d", r.GuildID, ptr(r.GuildName), r.TotalMessageCount))
	}
	for _, r := range m.Payments {
		add("payments", fmt.Sprintf("%s|%s|%v|%s|%s", ptr(r.PaymentID), r.PaymentDate, r.Amount, ptr(r.Currency), ptr(r.Description)))
	}
	for _, r := range m.Sessions {
		add("sessions", fmt.Sprintf("%d|%.1f|%.1f|%s", r.DurationMins, r.StartedDate, r.EndedDate, ptr(r.DeviceOS)))
	}
	for _, r := range m.VoiceSessions {
		add("voice_sessions", fmt.Sprintf("%s|%s|%d|%.1f|%.1f", r.ChannelID, ptr(r.GuildID), r.DurationMins, r.StartedDate, r.EndedDate))
	}
	p := m.Package
	add("package_data", fmt.Sprintf("%s|%s|%s|%s|%s|%s|%v|%s", p.PackageID, p.PackageVersion, p.OwnerID, p.OwnerName,
		ptr(p.OwnerDisplayName), ptr(p.OwnerAvatarURL), p.IsPartial, ptr(p.ActivityStream)))
	for _, rows := range out {
		slices.Sort(rows)
	}
	return out
}

func sorted(rows ...string) []string {
	slices.Sort(rows)
	return rows
}

var messageSentRows = []string{
	"message_sent|2021-04-06|12|2|" + dmFriend + "|NULL|NULL|NULL|NULL",
	"message_sent|2021-04-06|13|1|" + dmFriend + "|NULL|NULL|NULL|NULL",
	"message_sent|2021-04-07|0|1|" + dmOther + "|NULL|NULL|NULL|NULL",
	"message_sent|2021-04-06|23|2|" + general + "|" + guildOne + "|NULL|NULL|NULL",
	"message_sent|2021-04-06|12|1|" + news + "|" + guildTwo + "|NULL|NULL|NULL",
}

var eventRows = []string{
	"guild_joined|2021-04-06|8|1|NULL|" + guildTwo + "|NULL|NULL|NULL",
	"application_command_used|2021-04-06|0|1|NULL|" + guildOne + "|" + app + "|NULL|NULL",
	// is_custom is always '0', as in the reference.
	"add_reaction|2021-04-06|0|1|" + general + "|NULL|NULL|custom_emoji|0",
	"add_reaction|2021-04-06|0|1|" + general + "|NULL|NULL|thumbsup|0",
	"app_opened|2021-04-06|0|2|NULL|NULL|NULL|Windows|NULL",
	"app_opened|2021-04-07|0|1|NULL|NULL|NULL|Android|NULL",
	"email_opened|2021-04-06|0|1|NULL|NULL|NULL|NULL|NULL",
	"app_crashed|2021-04-06|0|2|NULL|NULL|NULL|NULL|NULL",
	"oauth2_authorize_accepted|2021-04-06|0|1|NULL|NULL|NULL|NULL|NULL",
	"notification_clicked|2021-04-06|0|1|NULL|NULL|NULL|NULL|NULL",
	"voice_message_recorded|2021-04-06|0|1|NULL|NULL|NULL|NULL|NULL",
}

func fullTables() map[string][]string {
	return map[string][]string{
		"activity": sorted(append(slices.Clone(messageSentRows), eventRows...)...),
		"dm_channels_data": sorted(
			dmFriend+"|"+friend+"|friend_one|Friend One|https://cdn.discordapp.com/avatars/"+friend+"/friendhash.jpg|3|0|0.5",
			dmOther+"|"+stranger+"|stranger|NULL|NULL|1|0|0.5",
		),
		"guild_channels_data": sorted(
			general+"|"+guildOne+"|general|2|0",
			// The cut drops the last five characters wherever "#0000" is.
			news+"|"+guildTwo+"|news#000|1|0",
		),
		// Guild One counts the channel missing from the index.
		"guilds":         sorted(guildOne+"|Guild One|7", guildTwo+"|Guild Two|1"),
		"payments":       sorted("p1|2022-03-04|999|usd|Nitro", "p4|2022-12-31|4.5|eur|Boost"),
		"sessions":       {"90|1617703200.0|1617708600.0|Windows"},
		"voice_sessions": {voiceChan + "|" + guildOne + "|44|1617739260.0|1617741900.0"},
		"package_data": {"pkg-test|0.1.0|" + ownerID + "|owner_user|Owner Name|https://cdn.discordapp.com/avatars/" +
			ownerID + "/a_ownerhash.gif|false|analytics"},
	}
}

func diffTables(t *testing.T, got, want map[string][]string) {
	t.Helper()
	for table, w := range want {
		if g := got[table]; !reflect.DeepEqual(g, w) {
			t.Errorf("%s:\ngot  %q\nwant %q", table, g, w)
		}
	}
	for table := range got {
		if _, ok := want[table]; !ok {
			t.Errorf("unexpected table %s: %q", table, got[table])
		}
	}
}

func TestFullPackage(t *testing.T) {
	res := process(t, fullPackage(english))
	diffTables(t, tables(res.Model), fullTables())
	if len(res.Report.Issues) != 0 || len(res.Report.MissingFiles) != 0 {
		t.Errorf("report: issues %+v, missing %+v", res.Report.Issues, res.Report.MissingFiles)
	}
	wantInputs := map[string]string{
		"user":           "Account/user.json",
		"activity":       "Activity/analytics/events-*-*-of-*.json",
		"servers_index":  "Servers/index.json",
		"messages_index": "Messages/index.json",
		"payments":       "Account/user_data_exports/discord_billing/payments.json",
	}
	if !reflect.DeepEqual(res.Report.Inputs, wantInputs) {
		t.Errorf("inputs = %v", res.Report.Inputs)
	}
}

func without(es []entry, prefixes ...string) []entry {
	return slices.DeleteFunc(slices.Clone(es), func(e entry) bool {
		return slices.ContainsFunc(prefixes, func(p string) bool { return strings.HasPrefix(e.name, p) })
	})
}
