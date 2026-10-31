package processor

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
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

var (
	english   = folders{"Account", "Messages", "Servers", "Activity"}
	spanish   = folders{"Cuenta", "Mensajes", "Servidores", "Actividad"}
	lowercase = folders{"account", "messages", "servers", "activity"}
)

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
	event("dev_portal_page_viewed", "timestamp", ts("2021-04-06T09:00:00.000Z"), "page_name", `"/docs/intro"`),
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
	add("package_data", fmt.Sprintf("%s|%s|%s|%s|%s|%s|%v", p.PackageID, p.PackageVersion, p.OwnerID, p.OwnerName,
		ptr(p.OwnerDisplayName), ptr(p.OwnerAvatarURL), p.IsPartial))
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
	// Gated on dev_portal_page_viewed; oauth2_authorize_accepted and
	// voice_message_recorded have no rows, their gates being empty.
	"notification_clicked|2021-04-06|0|1|NULL|NULL|NULL|NULL|NULL",
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
			ownerID + "/a_ownerhash.gif|false"},
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

func TestLocalizedAndLowercaseFolders(t *testing.T) {
	for _, l := range []folders{spanish, lowercase} {
		t.Run(l.account, func(t *testing.T) {
			res := process(t, fullPackage(l))
			diffTables(t, tables(res.Model), fullTables())
			if got := res.Report.Inputs["activity"]; got != l.activity+"/analytics/events-*-*-of-*.json" {
				t.Errorf("activity input = %s", got)
			}
		})
	}
}

func without(es []entry, prefixes ...string) []entry {
	return slices.DeleteFunc(slices.Clone(es), func(e entry) bool {
		return slices.ContainsFunc(prefixes, func(p string) bool { return strings.HasPrefix(e.name, p) })
	})
}

func TestMissingSections(t *testing.T) {
	t.Run("servers", func(t *testing.T) {
		for _, l := range []folders{english, spanish} {
			res := process(t, without(fullPackage(l), l.servers+"/"))
			got := tables(res.Model)
			want := fullTables()
			// The messages index, under a translated name or not, is never
			// taken for the servers index.
			want["guilds"] = nil
			want["package_data"] = []string{strings.Replace(want["package_data"][0], "|false", "|true", 1)}
			diffTables(t, got, want)
			if !reflect.DeepEqual(res.Report.MissingFiles, []MissingFile{{Role: "servers_index", Path: "Servers/index.json"}}) {
				t.Errorf("%s: missing files %+v", l.account, res.Report.MissingFiles)
			}
		}
	})
	t.Run("messages", func(t *testing.T) {
		res := process(t, without(fullPackage(english), "Messages/"))
		got := tables(res.Model)
		want := fullTables()
		want["activity"] = sorted(slices.Clone(eventRows)...)
		want["dm_channels_data"], want["guild_channels_data"] = nil, nil
		want["guilds"] = sorted(guildOne+"|Guild One|0", guildTwo+"|Guild Two|0")
		want["package_data"] = []string{strings.Replace(want["package_data"][0], "|false", "|true", 1)}
		diffTables(t, got, want)
		if !reflect.DeepEqual(res.Report.MissingFiles, []MissingFile{{Role: "messages_index", Path: "Messages/index.json"}}) {
			t.Errorf("missing files %+v", res.Report.MissingFiles)
		}
	})
	t.Run("activity", func(t *testing.T) {
		// tns and modeling streams are never read.
		res := process(t, without(fullPackage(english), "Activity/analytics/"))
		got := tables(res.Model)
		want := fullTables()
		want["activity"] = sorted(slices.Clone(messageSentRows)...)
		want["sessions"], want["voice_sessions"] = nil, nil
		want["package_data"] = []string{strings.Replace(want["package_data"][0], "|false", "|true", 1)}
		diffTables(t, got, want)
		if len(res.Report.MissingFiles) != 1 || res.Report.MissingFiles[0].Role != "activity" {
			t.Errorf("missing files %+v", res.Report.MissingFiles)
		}
	})
	t.Run("payments", func(t *testing.T) {
		res := process(t, without(fullPackage(english), "Account/user_data_exports/"))
		if len(res.Model.Payments) != 0 || len(res.Report.MissingFiles) != 0 || res.Model.Package.IsPartial {
			t.Errorf("payments %v, missing %+v", res.Model.Payments, res.Report.MissingFiles)
		}
	})
	t.Run("user", func(t *testing.T) {
		r, size := zipOf(t, without(fullPackage(spanish), "Cuenta/"))
		res, err := Process(context.Background(), r, size, Options{PackageID: "pkg-test"})
		if !errors.Is(err, ErrMissingUserData) {
			t.Fatalf("err = %v", err)
		}
		if res == nil || res.Report.Error != "MISSING_USER_DATA" {
			t.Errorf("report = %+v", res)
		}
	})
}

func TestActivityStreamChoice(t *testing.T) {
	base := without(fullPackage(english), "Activity/")
	otherLines := lines(event("app_opened", "timestamp", ts("2020-01-01T00:00:00.000Z"), "os", `"Other"`))
	appOpened := func(m *Model) []string {
		var out []string
		for _, r := range m.Activity {
			if r.EventName == "app_opened" {
				out = append(out, *r.ExtraField1+"|"+r.Day)
			}
		}
		slices.Sort(out)
		return out
	}
	full := []string{"Android|2021-04-07", "Windows|2021-04-06"}
	tests := []struct {
		name    string
		entries []entry
		want    []string
		partial bool
	}{
		{"reporting only", []entry{
			{"Activity/modeling/events-2021-00000-of-00001.json", otherLines},
			{"Activity/reporting/events-2021-00000-of-00001.json", activityLines},
		}, full, false},
		{"analytics over reporting", []entry{
			{"Activity/reporting/events-2021-00000-of-00001.json", otherLines},
			{"Activity/analytics/events-2021-00000-of-00001.json", activityLines},
		}, full, false},
		{"first shard only", []entry{
			{"Activity/analytics/events-2021-00000-of-00002.json", activityLines},
			{"Activity/analytics/events-2021-00001-of-00002.json", otherLines},
		}, full, false},
		{"tns and modeling are not read", []entry{
			{"Activity/tns/events-2021-00000-of-00001.json", otherLines},
			{"Activity/modeling/events-2021-00000-of-00001.json", otherLines},
		}, nil, true},
		{"no line has an event type", []entry{
			{"Activity/analytics/events-2021-00000-of-00001.json", lines(`{"a": 1}`, `{"b": {"event_type": "x"}}`)},
		}, nil, true},
		{"only skipped application commands", []entry{
			{"Activity/analytics/events-2021-00000-of-00001.json", lines(
				event("application_command_used", "timestamp", ts("2021-04-06T09:00:00.000Z"), "application_id", `"-1"`, "guild_id", `"1"`),
				event("application_command_used", "timestamp", ts("2021-04-06T09:00:00.000Z"), "application_id", `"1"`),
			)},
		}, nil, true},
		{"an unused event type is usable", []entry{
			{"Activity/analytics/events-2021-00000-of-00001.json", lines(`{"event_type": "something_else"}`)},
		}, nil, false},
		{"an empty stream", []entry{
			{"Activity/analytics/events-2021-00000-of-00001.json", ""},
		}, nil, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res := process(t, append(slices.Clone(base), tt.entries...))
			if got := appOpened(res.Model); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("app_opened = %v, want %v", got, tt.want)
			}
			if res.Model.Package.IsPartial != tt.partial {
				t.Errorf("is_partial = %v, want %v", res.Model.Package.IsPartial, tt.partial)
			}
		})
	}
}

// TestNoEventRead marks the package partial when events of a type the parser
// reads failed and none was read, as after a format change, whatever events
// the reference skips without a problem; a reported fallback is a read.
func TestNoEventRead(t *testing.T) {
	base := without(fullPackage(english), "Activity/")
	unused := event("unused_event", "timestamp", ts("2021-04-06T09:00:00.000Z"))
	tests := []struct {
		name    string
		lines   string
		partial bool
		failed  int
	}{
		{"every timestamp broken", lines(unused,
			event("session_start", "timestamp", `"2021-04-06T10:00:00Z"`, "os", `"Linux"`),
			event("app_opened", "timestamp", `"2021-04-06T10:00:00Z"`, "os", `"Linux"`),
			`{"event_type": "email_opened", "timestamp": `,
		), true, 3},
		{"beside the reference's skips", lines(unused,
			event("session_start", "timestamp", `"2021-04-06T10:00:00Z"`, "os", `"Linux"`),
			event("email_opened", "timestamp", `"2021-04-06T10:00:00Z"`),
			event("app_opened", "timestamp", ts("2021-04-06T09:00:00.000Z")),
			event("application_command_used", "timestamp", ts("2021-04-06T09:00:00.000Z"), "application_id", `"-1"`, "guild_id", `"1"`),
			event("application_command_used", "timestamp", ts("2021-04-06T09:00:00.000Z"), "application_id", `"`+app+`"`),
			event("dev_portal_page_viewed", "timestamp", ts("2021-04-06T09:00:00.000Z"), "page_name", `"/blog"`),
		), true, 2},
		{"one event read", lines(unused,
			event("session_start", "timestamp", `"2021-04-06T10:00:00Z"`, "os", `"Linux"`),
			event("email_opened", "timestamp", ts("2021-04-06T09:00:00.000Z")),
		), false, 0},
		{"only skips the reference makes", lines(unused,
			event("app_opened", "timestamp", ts("2021-04-06T09:00:00.000Z")),
			event("application_command_used", "timestamp", ts("2021-04-06T09:00:00.000Z"), "application_id", `"-1"`, "guild_id", `"1"`),
		), false, 0},
		{"a reported fallback", lines(
			event("join_voice_channel", "timestamp", ts("2021-04-06T20:00:00.000Z"), "channel_id", `"`+voiceChan+`"`),
		), false, 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res := process(t, append(slices.Clone(base), entry{"Activity/analytics/events-2021-00000-of-00001.json", tt.lines}))
			if res.Model.Package.IsPartial != tt.partial {
				t.Errorf("is_partial = %v, want %v", res.Model.Package.IsPartial, tt.partial)
			}
			got := 0
			for _, i := range res.Report.Issues {
				if i.Problem == ProblemNoEventRead {
					got = i.Count
				}
			}
			if got != tt.failed {
				t.Errorf("no_event_read count = %d, want %d", got, tt.failed)
			}
		})
	}
}

func TestTimestampEdges(t *testing.T) {
	es := without(fullPackage(english), "Activity/", "Messages/")
	es = append(es,
		entry{"Messages/index.json", `{"` + general + `": "general"}`},
		entry{"Activity/analytics/events-2021-00000-of-00001.json", lines(
			// Minutes are kept, seconds and fractions dropped, across midnight UTC.
			event("session_start", "timestamp", ts("2021-04-06T23:59:59.999Z"), "os", `"Linux"`),
			event("session_end", "timestamp", ts("2021-04-07T00:00:00.001Z"), "os", `"Linux"`),
			event("email_opened", "timestamp", ts("2021-04-06T23:59:59.999Z")),
			event("email_opened", "timestamp", ts("2021-04-07T00:00:00.000Z")),
			event("guild_joined", "timestamp", ts("2021-04-06T23:59:59.999Z"), "guild_id", `"`+guildOne+`"`),
			event("guild_joined", "timestamp", ts("2021-04-07T00:00:59.000Z"), "guild_id", `"`+guildOne+`"`),
			event("guild_joined", "timestamp", ts("2021-04-07T00:30:00.000+02:00"), "guild_id", `null`),
		)},
	)
	es = append(es, channelFolder(english, general, guildChannel(general, guildOne), messages(
		// One format per channel, so pandas reads them all; the offset is kept
		// as the bucket's zone, not converted.
		"2021-04-06 23:59:59.999+02:00", "2021-04-07 00:00:00.000+02:00", "2021-04-07 00:00:00.5+02:00"))...)
	got := tables(process(t, es).Model)
	want := map[string][]string{
		"activity": sorted(
			"message_sent|2021-04-06|23|1|"+general+"|"+guildOne+"|NULL|NULL|NULL",
			"message_sent|2021-04-07|0|2|"+general+"|"+guildOne+"|NULL|NULL|NULL",
			"email_opened|2021-04-06|0|1|NULL|NULL|NULL|NULL|NULL",
			"email_opened|2021-04-07|0|1|NULL|NULL|NULL|NULL|NULL",
			"guild_joined|2021-04-06|23|1|NULL|"+guildOne+"|NULL|NULL|NULL",
			"guild_joined|2021-04-07|0|1|NULL|"+guildOne+"|NULL|NULL|NULL",
			// A null guild id is kept: guild_joined isn't grouped by pandas.
			"guild_joined|2021-04-07|0|1|NULL|NULL|NULL|NULL|NULL",
		),
		"sessions": {"1|1617753540.0|1617753600.0|Linux"},
	}
	for _, table := range []string{"activity", "sessions"} {
		if !reflect.DeepEqual(got[table], want[table]) {
			t.Errorf("%s:\ngot  %q\nwant %q", table, got[table], want[table])
		}
	}
}

// TestMissingFields covers what fails the Python worker: here the package goes
// through and the report counts the problems, as paths and counts.
func TestMissingFields(t *testing.T) {
	user := `{"id": "` + ownerID + `", "username": "owner_user", "email": "x"}`
	es := []entry{
		{"Account/user.json", user},
		{"Servers/index.json", `{"` + guildOne + `": "Guild One", "` + guildTwo + `": null}`},
		{"Messages/index.json", `{"` + dmFriend + `": "Direct Message with me", "` + general + `": "general", "` + dmOther + `": "Direct Message with friend"}`},
		{"Activity/analytics/events-2021-00000-of-00001.json", lines(
			event("add_reaction", "timestamp", ts("2021-04-06T08:00:00.000Z"), "user_id", `"1"`, "channel_id", `"`+general+`"`),
			event("session_start", "os", `"Linux"`),
			event("session_start", "timestamp", ts("2021-04-06T10:00:00.000Z"), "os", `"Linux"`),
			event("session_end", "timestamp", ts("not a date"), "os", `"Linux"`),
			event("session_end", "timestamp", ts("2021-04-06T10:30:00.000Z"), "os", `"Linux"`),
			event("join_voice_channel", "timestamp", ts("2021-04-06T20:00:00.000Z"), "channel_id", `"`+voiceChan+`"`),
			event("leave_voice_channel", "timestamp", ts("2021-04-06T20:10:00.000Z"), "client_track_timestamp", `null`, "channel_id", `"`+voiceChan+`"`),
			`{"event_type": "app_opened", "timestamp": `,
			event("email_opened", "timestamp", `12`),
			event("application_command_used", "timestamp", ts("2021-04-06T09:00:00.000Z"), "guild_id", `"1"`),
		)},
	}
	// A DM with yourself, a DM message without Contents, mixed formats.
	es = append(es, channelFolder(english, dmFriend, dmChannel(dmFriend, ownerID, ownerID),
		`[{"ID": 1, "Timestamp": "2021-04-06 12:00:00"}, {"ID": 2, "Contents": "x"}, {"ID": 3, "Timestamp": null, "Contents": ""}]`)...)
	es = append(es, channelFolder(english, general, guildChannel(general, guildOne),
		messages("2021-04-06 12:00:00", "2021-04-06 12:30:00.250", "garbage", ""))...)
	es = append(es, channelFolder(english, dmOther, `{"id": "x", "recipients": "`+ownerID+`"}`, messages("2021-04-06 12:00:00"))...)

	res := process(t, es)
	got := tables(res.Model)
	want := map[string][]string{
		"activity": sorted(
			"message_sent|2021-04-06|12|1|"+dmFriend+"|NULL|NULL|NULL|NULL",
			"message_sent|2021-04-06|12|2|"+general+"|"+guildOne+"|NULL|NULL|NULL",
		),
		"dm_channels_data":    {dmFriend + "|" + ownerID + "|me|NULL|NULL|3|0|0.5"},
		"guild_channels_data": {general + "|" + guildOne + "|general|4|0"},
		"guilds":              sorted(guildOne+"|Guild One|4", guildTwo+"|NULL|0"),
		"sessions":            {"30|1617703200.0|1617705000.0|Linux"},
		"voice_sessions":      {voiceChan + "|NULL|10|1617739200.0|1617739800.0"},
		"package_data":        {"pkg-test|0.1.0|" + ownerID + "|owner_user|NULL|NULL|false"},
	}
	diffTables(t, got, want)

	const stream = "Activity/analytics/events-*-*-of-*.json"
	wantIssues := []Issue{
		{Path: "Account/user.json", Field: "avatar_hash", Problem: ProblemMissing, Count: 1},
		{Path: "Account/user.json", Field: "relationships", Problem: ProblemMissing, Count: 1},
		{Path: stream, EventType: "add_reaction", Field: "emoji_name", Problem: ProblemMissing, Count: 1},
		{Path: stream, EventType: "app_opened", Problem: ProblemMalformed, Count: 1},
		{Path: stream, EventType: "application_command_used", Field: "application_id", Problem: ProblemMissing, Count: 1},
		{Path: stream, EventType: "email_opened", Field: "timestamp", Problem: ProblemWrongType, Count: 1},
		{Path: stream, EventType: "join_voice_channel", Field: "client_track_timestamp", Problem: ProblemMissing, Count: 1},
		{Path: stream, EventType: "leave_voice_channel", Field: "client_track_timestamp", Problem: ProblemNull, Count: 1},
		{Path: stream, EventType: "session_end", Field: "timestamp", Problem: ProblemUnparseable, Count: 1},
		{Path: stream, EventType: "session_start", Field: "timestamp", Problem: ProblemMissing, Count: 1},
		{Path: "Messages/c*/channel.json", Field: "recipients", Problem: ProblemSelfDM, Count: 1},
		{Path: "Messages/c*/channel.json", Field: "recipients", Problem: ProblemWrongType, Count: 1},
		{Path: "Messages/c*/messages.json", Field: "Contents", Problem: ProblemMissing, Count: 1},
		{Path: "Messages/c*/messages.json", Field: "Timestamp", Problem: ProblemMissing, Count: 1},
		{Path: "Messages/c*/messages.json", Field: "Timestamp", Problem: ProblemMixedFormats, Count: 1},
		{Path: "Messages/c*/messages.json", Field: "Timestamp", Problem: ProblemUnparseable, Count: 1},
	}
	if !reflect.DeepEqual(res.Report.Issues, wantIssues) {
		t.Errorf("issues:\ngot  %+v\nwant %+v", res.Report.Issues, wantIssues)
	}
}

// corrupt returns the zip with the data of the entries matching name flipped.
func corrupt(t *testing.T, entries []entry, name func(string) bool) (*bytes.Reader, int64) {
	t.Helper()
	r, size := zipOf(t, entries)
	data := make([]byte, size)
	if _, err := r.ReadAt(data, 0); err != nil {
		t.Fatal(err)
	}
	zr, err := zip.NewReader(bytes.NewReader(data), size)
	if err != nil {
		t.Fatal(err)
	}
	for _, f := range zr.File {
		if name(f.Name) {
			off, err := f.DataOffset()
			if err != nil {
				t.Fatal(err)
			}
			for i := off; i < off+min(int64(f.CompressedSize64), 20); i++ {
				data[i] ^= 0xff
			}
		}
	}
	return bytes.NewReader(data), size
}

// TestUnstoredFields reads an event whatever the type of a field the reference
// neither stores nor tests, the os of a session_end or the guild of a
// leave_voice_channel, while one it stores still has to be a string or null.
func TestUnstoredFields(t *testing.T) {
	base := without(fullPackage(english), "Activity/")
	stream := "Activity/analytics/events-2021-00000-of-00001.json"
	for _, v := range []string{`"Linux"`, `7`, `true`, `[1]`, `{"a": 1}`} {
		res := process(t, append(slices.Clone(base), entry{stream, lines(
			event("session_start", "timestamp", ts("2021-04-06T10:00:00.000Z"), "os", `"Linux"`),
			event("session_end", "timestamp", ts("2021-04-06T10:30:00.000Z"), "os", v),
			event("join_voice_channel", "timestamp", ts("2021-04-06T20:00:00.000Z"), "client_track_timestamp", `"null"`,
				"channel_id", `"`+voiceChan+`"`, "guild_id", `"`+guildOne+`"`),
			event("leave_voice_channel", "timestamp", ts("2021-04-06T20:45:00.000Z"), "client_track_timestamp", `"null"`,
				"channel_id", `"`+voiceChan+`"`, "guild_id", v),
		)}))
		if len(res.Model.Sessions) != 1 || len(res.Model.VoiceSessions) != 1 || len(res.Report.Issues) != 0 {
			t.Errorf("%s: %d sessions, %d voice sessions, issues %+v", v, len(res.Model.Sessions), len(res.Model.VoiceSessions), res.Report.Issues)
		}
	}
	res := process(t, append(slices.Clone(base), entry{stream, lines(
		event("session_start", "timestamp", ts("2021-04-06T10:00:00.000Z"), "os", `7`),
		event("session_end", "timestamp", ts("2021-04-06T10:30:00.000Z"), "os", `"Linux"`),
	)}))
	want := []Issue{{Path: "Activity/analytics/events-*-*-of-*.json", EventType: "session_start", Field: "os", Problem: ProblemWrongType, Count: 1}}
	if len(res.Model.Sessions) != 0 || !reflect.DeepEqual(res.Report.Issues, want) {
		t.Errorf("a number as the start's os: %d sessions, issues %+v", len(res.Model.Sessions), res.Report.Issues)
	}
}

// TestFailedReportHasNoIssues fails a package whose other entries have issues:
// which of them are found before the failure depends on timing, so a failed
// report lists none, not even those of `user.json`, read first.
func TestFailedReportHasNoIssues(t *testing.T) {
	es := without(fullPackage(english), "Activity/", "Account/user.json")
	es = append(es,
		entry{"Account/user.json", strings.Replace(userJSON, `"avatar_hash": "a_ownerhash",`, "", 1)},
		entry{"Activity/analytics/events-2021-00000-of-00001.json", lines(event("email_opened", "timestamp", `"x"`))},
		entry{"Messages/c400000000000000099/channel.json", "{"},
	)
	r, size := corrupt(t, es, func(name string) bool { return name == "Messages/c"+general+"/messages.json" })
	for range 20 {
		res, err := Process(context.Background(), r, size, Options{PackageID: "pkg-test", Workers: 4})
		if err == nil {
			t.Fatal("the corrupt entry didn't fail the package")
		}
		if len(res.Report.Issues) != 0 {
			t.Fatalf("issues %+v", res.Report.Issues)
		}
	}
}

func TestUnreadableEntryFails(t *testing.T) {
	r, size := corrupt(t, fullPackage(english), func(name string) bool { return strings.Contains(name, "/analytics/") })
	res, err := Process(context.Background(), r, size, Options{PackageID: "pkg-test"})
	if err == nil || errors.Is(err, ErrMissingUserData) || errors.Is(err, context.Canceled) {
		t.Errorf("err = %v, want a read error", err)
	}
	if res.Report.Error != CodeUnknownError {
		t.Errorf("report error = %q", res.Report.Error)
	}
}

// TestChannelErrorIsTheCause fails a channel folder while the activity stream
// is still being read: the error is the channel's, not the cancellation that
// stops the stream.
func TestChannelErrorIsTheCause(t *testing.T) {
	filler := strings.Repeat(event("unused_event", "n", "1")+"\n", 300000)
	es := append(without(fullPackage(english), "Activity/"), entry{"Activity/analytics/events-2021-00000-of-00001.json", filler})
	r, size := corrupt(t, es, func(name string) bool { return name == "Messages/c"+general+"/messages.json" })
	_, err := Process(context.Background(), r, size, Options{PackageID: "pkg-test", Workers: 2})
	if err == nil || errors.Is(err, context.Canceled) {
		t.Fatalf("err = %v, want the channel's read error", err)
	}
	if !strings.Contains(err.Error(), "Messages/c*/messages.json") {
		t.Errorf("err = %v, want it to name the entry", err)
	}
}
