package sqlitedb

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"github.com/dumpus-app/dumpus-app/processor"
)

func s(v string) *string { return &v }

// model has one row per table, with made-up values, plus rows the schema
// refuses.
func model() *processor.Model {
	return &processor.Model{
		DMChannels: []processor.DMChannel{
			{ChannelID: "400000000000000001", DMUserID: s("200000000000000002"), UserName: "friend_one",
				DisplayName: s("Friend One"), TotalMessageCount: 3, SentimentScore: 0.5},
			{ChannelID: "400000000000000009", UserName: "no recipient", SentimentScore: 0.5},
		},
		GuildChannels: []processor.GuildChannel{
			{ChannelID: "400000000000000003", GuildID: s("300000000000000001"), ChannelName: "general", TotalMessageCount: 2},
		},
		Activity: []processor.Activity{
			{EventName: "message_sent", Day: "2021-04-06", Hour: 12, OccurrenceCount: 2, ChannelID: s("400000000000000001")},
			{EventName: "add_reaction", Day: "2021-04-06", OccurrenceCount: 1, ChannelID: s("400000000000000003"),
				ExtraField1: s("thumbsup"), ExtraField2: s("0")},
		},
		Guilds: []processor.Guild{
			{GuildID: "300000000000000001", GuildName: s("Guild One"), TotalMessageCount: 7},
			{GuildID: "300000000000000001", GuildName: s("Duplicate"), TotalMessageCount: 1},
			{GuildID: "300000000000000002", TotalMessageCount: 0},
		},
		Payments: []processor.Payment{
			{PaymentID: s("p1"), PaymentDate: "2022-03-04", Amount: int64(999), Currency: s("usd"), Description: s("Nitro")},
			{PaymentID: s("p4"), PaymentDate: "2022-12-31", Amount: 4.5, Currency: s("eur"), Description: s("Boost")},
			{PaymentID: s("p5"), PaymentDate: "2022-12-31", Amount: "499", Currency: s("eur"), Description: s("Text")},
		},
		VoiceSessions: []processor.VoiceSession{
			{ChannelID: "700000000000000001", DurationMins: 44, StartedDate: 1617739260, EndedDate: 1617741900},
		},
		Sessions: []processor.Session{
			{DurationMins: 90, StartedDate: 1617703200, EndedDate: 1617708600, DeviceOS: s("Windows")},
			{DurationMins: 1, StartedDate: 1617753540, EndedDate: 1617753600},
		},
		Package: processor.PackageData{PackageID: "pkg-test", PackageVersion: processor.PackageVersion,
			OwnerID: "100000000000000001", OwnerName: "owner_user", IsPartial: true},
	}
}

func query(t *testing.T, db *sql.DB, q string) []string {
	t.Helper()
	rows, err := db.Query(q)
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err != nil {
			t.Fatal(err)
		}
		out = append(out, v)
	}
	return out
}

func TestWrite(t *testing.T) {
	path := filepath.Join(t.TempDir(), "out.sqlite")
	res, err := Write(context.Background(), path, model())
	if err != nil {
		t.Fatal(err)
	}
	if want := map[string]int{"dm_channels_data": 1, "guilds": 2, "sessions": 1}; !reflect.DeepEqual(res.DroppedRows, want) {
		t.Errorf("dropped = %v, want %v", res.DroppedRows, want)
	}

	st, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if st.Mode().Perm() != 0o600 {
		t.Errorf("mode = %v", st.Mode())
	}
	header := make([]byte, 20)
	f, err := os.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := f.Read(header); err != nil {
		t.Fatal(err)
	}
	f.Close()
	// File format versions 1 mean a rollback journal; WAL would be 2.
	if header[18] != 1 || header[19] != 1 {
		t.Errorf("file format versions %d %d", header[18], header[19])
	}

	db, err := sql.Open("sqlite", "file:"+path+"?mode=ro")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	ddl := strings.Join(query(t, db, `SELECT sql FROM sqlite_master WHERE type = 'table' ORDER BY name`), "\n")
	for _, want := range []string{"occurence_count INTEGER NOT NULL", "sentiment_score REAL NOT NULL",
		"started_date TEXT NOT NULL", "package_is_partial BOOLEAN NOT NULL DEFAULT 0",
		"PRIMARY KEY (event_name, day, hour, associated_channel_id, associated_guild_id, associated_user_id, extra_field_1)"} {
		if !strings.Contains(ddl, want) {
			t.Errorf("schema lacks %q", want)
		}
	}
	indexes := query(t, db, `SELECT name FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL ORDER BY name`)
	wantIndexes := []string{"idx_activity_event_channel_day", "idx_activity_event_guild_day", "idx_dm_channels_dm_user_id",
		"idx_guild_channels_guild_id", "idx_sessions_started_date", "idx_voice_sessions_started_date"}
	if !reflect.DeepEqual(indexes, wantIndexes) {
		t.Errorf("indexes = %v", indexes)
	}

	// Values with their storage class, as the Python worker stores them.
	checks := map[string][]string{
		`SELECT typeof(started_date) || ' ' || started_date || ' ' || typeof(duration_mins) || ' ' || device_os FROM sessions`: {
			"text 1617703200.0 integer Windows"},
		`SELECT typeof(started_date) || ' ' || ended_date || ' ' || typeof(guild_id) FROM voice_sessions`: {
			"text 1617741900.0 null"},
		`SELECT payment_id || ' ' || typeof(payment_amount) || ' ' || payment_amount FROM payments ORDER BY payment_id`: {
			"p1 integer 999", "p4 real 4.5", "p5 integer 499"},
		`SELECT typeof(sentiment_score) || ' ' || sentiment_score || ' ' || typeof(display_name) || ' ' || typeof(user_avatar_url) FROM dm_channels_data`: {
			"real 0.5 text null"},
		`SELECT typeof(hour) || ' ' || hour || ' ' || typeof(associated_guild_id) || ' ' || coalesce(extra_field_2, '-') FROM activity ORDER BY event_name`: {
			"integer 0 null 0", "integer 12 null -"},
		`SELECT typeof(package_is_partial) || ' ' || package_is_partial || ' ' || typeof(package_owner_display_name) FROM package_data`: {
			"integer 1 null"},
		`SELECT guild_id || ' ' || guild_name FROM guilds`: {"300000000000000001 Guild One"},
	}
	for q, want := range checks {
		if got := query(t, db, q); !reflect.DeepEqual(got, want) {
			t.Errorf("%s\ngot  %q\nwant %q", q, got, want)
		}
	}
}

func TestWriteReplacesAnExistingFile(t *testing.T) {
	// Characters a URI would read as a query, a fragment or an escape.
	path := filepath.Join(t.TempDir(), "a dir?#%", "out?.sqlite")
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte("not a database"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Write(context.Background(), path, model()); err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("sqlite", dsn(path))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	if got := query(t, db, `SELECT package_id FROM package_data`); !reflect.DeepEqual(got, []string{"pkg-test"}) {
		t.Errorf("package_data = %v", got)
	}
}
