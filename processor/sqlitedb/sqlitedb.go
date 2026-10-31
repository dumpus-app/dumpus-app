// Package sqlitedb writes a `processor.Model` to the SQLite file the Dumpus app
// opens, with the Python worker's schema (the same DDL text, index names and
// column storage classes) plus `package_data.activity_stream`.
package sqlitedb

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/dumpus-app/dumpus-app/processor"
	"modernc.org/sqlite"
	sqlite3 "modernc.org/sqlite/lib"
)

// The DDL is the worker's text as is, so `sqlite_master` reads the same,
// except for `package_data.activity_stream`, added at the end.
var tables = []string{`
        CREATE TABLE activity (
            event_name TEXT NOT NULL,
            day TEXT NOT NULL,
            hour INTEGER,
            occurence_count INTEGER NOT NULL,
            associated_user_id TEXT,
            associated_channel_id TEXT,
            associated_guild_id TEXT,
            extra_field_1 TEXT,
            extra_field_2 TEXT,
            PRIMARY KEY (event_name, day, hour, associated_channel_id, associated_guild_id, associated_user_id, extra_field_1)
        )
    `, `
        CREATE TABLE dm_channels_data (
            channel_id TEXT NOT NULL,
            dm_user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            display_name TEXT,
            user_avatar_url TEXT,
            total_message_count INTEGER NOT NULL,
            total_voice_channel_duration INTEGER NOT NULL,
            sentiment_score REAL NOT NULL,
            PRIMARY KEY (channel_id)
        )
    `, `
        CREATE TABLE guild_channels_data (
            channel_id TEXT NOT NULL,
            channel_name TEXT NOT NULL,
            guild_id TEXT NOT NULL,
            total_message_count INTEGER NOT NULL,
            total_voice_channel_duration INTEGER NOT NULL,
            PRIMARY KEY (channel_id)
        )
    `, `
        CREATE TABLE guilds (
            guild_id TEXT NOT NULL,
            guild_name TEXT NOT NULL,
            total_message_count INTEGER NOT NULL,
            PRIMARY KEY (guild_id)
        )
    `, `
        CREATE TABLE payments (
            payment_id TEXT NOT NULL,
            payment_date TEXT NOT NULL,
            payment_amount INTEGER NOT NULL,
            payment_currency TEXT NOT NULL,
            payment_description TEXT NOT NULL,
            PRIMARY KEY (payment_id)
        )
    `, `
        CREATE TABLE voice_sessions (
            channel_id TEXT NOT NULL,
            guild_id TEXT,
            duration_mins INTEGER NOT NULL,
            started_date TEXT NOT NULL,
            ended_date TEXT NOT NULL,
            PRIMARY KEY (channel_id, started_date)
        )
    `, `
        CREATE TABLE sessions (
            started_date TEXT NOT NULL,
            ended_date TEXT NOT NULL,
            duration_mins INTEGER NOT NULL,
            device_os TEXT NOT NULL
        )
    `, `
        CREATE TABLE package_data (
            package_id TEXT NOT NULL,
            package_version TEXT NOT NULL,
            package_owner_id TEXT NOT NULL,
            package_owner_name TEXT NOT NULL,
            package_owner_display_name TEXT,
            package_owner_avatar_url TEXT,
            package_is_partial BOOLEAN NOT NULL DEFAULT 0,
            activity_stream TEXT
        )
    `}

var indexes = []string{
	`CREATE INDEX idx_activity_event_guild_day ON activity (event_name, associated_guild_id, day)`,
	`CREATE INDEX idx_activity_event_channel_day ON activity (event_name, associated_channel_id, day)`,
	`CREATE INDEX idx_sessions_started_date ON sessions (started_date)`,
	`CREATE INDEX idx_voice_sessions_started_date ON voice_sessions (started_date)`,
	`CREATE INDEX idx_dm_channels_dm_user_id ON dm_channels_data (dm_user_id)`,
	`CREATE INDEX idx_guild_channels_guild_id ON guild_channels_data (guild_id)`,
}

// insert is one table's rows; row builds the arguments of the i-th one as it
// is inserted, so that a large table is never held twice.
type insert struct {
	table, query string
	n            int
	row          func(i int) []any
}

func inserts(m *processor.Model) []insert {
	pk := m.Package
	partial := 0
	if pk.IsPartial {
		partial = 1
	}
	return []insert{{"dm_channels_data", `INSERT INTO dm_channels_data
        (channel_id, dm_user_id, user_name, display_name, user_avatar_url, total_message_count, total_voice_channel_duration, sentiment_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, len(m.DMChannels), func(i int) []any {
		r := m.DMChannels[i]
		return []any{r.ChannelID, r.DMUserID, r.UserName, r.DisplayName, r.UserAvatarURL,
			r.TotalMessageCount, r.TotalVoiceChannelDuration, r.SentimentScore}
	}}, {"guild_channels_data", `INSERT INTO guild_channels_data
        (channel_id, guild_id, channel_name, total_message_count, total_voice_channel_duration)
        VALUES (?, ?, ?, ?, ?)`, len(m.GuildChannels), func(i int) []any {
		r := m.GuildChannels[i]
		return []any{r.ChannelID, r.GuildID, r.ChannelName, r.TotalMessageCount, r.TotalVoiceChannelDuration}
	}}, {"activity", `INSERT INTO activity
        (event_name, day, hour, occurence_count, associated_channel_id, associated_guild_id, associated_user_id, extra_field_1, extra_field_2)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, len(m.Activity), func(i int) []any {
		r := m.Activity[i]
		return []any{r.EventName, r.Day, r.Hour, r.OccurrenceCount, r.ChannelID, r.GuildID,
			r.UserID, r.ExtraField1, r.ExtraField2}
	}}, {"guilds", `INSERT INTO guilds
        (guild_id, guild_name, total_message_count)
        VALUES (?, ?, ?)`, len(m.Guilds), func(i int) []any {
		r := m.Guilds[i]
		return []any{r.GuildID, r.GuildName, r.TotalMessageCount}
	}}, {"payments", `INSERT INTO payments
        (payment_id, payment_date, payment_amount, payment_currency, payment_description)
        VALUES (?, ?, ?, ?, ?)`, len(m.Payments), func(i int) []any {
		r := m.Payments[i]
		return []any{r.PaymentID, r.PaymentDate, r.Amount, r.Currency, r.Description}
	}}, {"voice_sessions", `INSERT INTO voice_sessions
        (channel_id, guild_id, duration_mins, started_date, ended_date)
        VALUES (?, ?, ?, ?, ?)`, len(m.VoiceSessions), func(i int) []any {
		r := m.VoiceSessions[i]
		return []any{r.ChannelID, r.GuildID, r.DurationMins, r.StartedDate, r.EndedDate}
	}}, {"sessions", `INSERT INTO sessions
        (duration_mins, started_date, ended_date, device_os)
        VALUES (?, ?, ?, ?)`, len(m.Sessions), func(i int) []any {
		r := m.Sessions[i]
		return []any{r.DurationMins, r.StartedDate, r.EndedDate, r.DeviceOS}
	}}, {"package_data", `INSERT INTO package_data
        (package_id, package_version, package_owner_id, package_owner_name, package_owner_display_name, package_owner_avatar_url, package_is_partial, activity_stream)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 1, func(int) []any {
		return []any{pk.PackageID, pk.PackageVersion, pk.OwnerID, pk.OwnerName, pk.OwnerDisplayName, pk.OwnerAvatarURL, partial, pk.ActivityStream}
	}}}
}

// Result is what Write did.
type Result struct {
	// DroppedRows counts, per table, the rows the schema refused, for eg. a
	// NULL in a NOT NULL column.
	DroppedRows map[string]int
}

// Write creates the database at path, replacing any file there, and syncs it
// to disk. A row the schema refuses is skipped and counted in the Result.
func Write(ctx context.Context, path string, m *processor.Model) (*Result, error) {
	for _, p := range []string{path, path + "-journal"} {
		if err := os.Remove(p); err != nil && !errors.Is(err, os.ErrNotExist) {
			return nil, err
		}
	}
	// The file holds a user's data: it is created private, and SQLite gives
	// its journal the same mode.
	f, err := os.OpenFile(path, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0o600)
	if err != nil {
		return nil, err
	}
	if err := f.Close(); err != nil {
		return nil, err
	}
	db, err := sql.Open("sqlite", dsn(path))
	if err != nil {
		return nil, err
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	dropped, err := write(ctx, db, m)
	if err != nil {
		return nil, err
	}
	if err := db.Close(); err != nil {
		return nil, err
	}
	return &Result{DroppedRows: dropped}, syncFile(path)
}

// dsn opens every connection with a rollback journal, never WAL, and with
// `VACUUM`'s scratch copy in memory rather than in the system temp directory.
// Durability comes from syncing the finished file once.
func dsn(path string) string {
	p := filepath.ToSlash(path)
	if filepath.IsAbs(path) && !strings.HasPrefix(p, "/") {
		p = "/" + p
	}
	u := url.URL{Scheme: "file", OmitHost: true, Path: p,
		RawQuery: "_pragma=journal_mode(DELETE)&_pragma=synchronous(OFF)&_pragma=temp_store(MEMORY)"}
	return u.String()
}

func syncFile(path string) error {
	f, err := os.OpenFile(path, os.O_RDWR, 0)
	if err != nil {
		return err
	}
	if err := f.Sync(); err != nil {
		f.Close()
		return err
	}
	return f.Close()
}

func write(ctx context.Context, db *sql.DB, m *processor.Model) (map[string]int, error) {
	for _, ddl := range tables {
		if _, err := db.ExecContext(ctx, ddl); err != nil {
			return nil, err
		}
	}
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	dropped := map[string]int{}
	for _, ins := range inserts(m) {
		stmt, err := tx.PrepareContext(ctx, ins.query)
		if err != nil {
			return nil, err
		}
		for i := range ins.n {
			if _, err := stmt.ExecContext(ctx, ins.row(i)...); err != nil {
				if !isConstraint(err) {
					stmt.Close()
					return nil, fmt.Errorf("insert into %s: %w", ins.table, err)
				}
				dropped[ins.table]++
			}
		}
		if err := stmt.Close(); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	for _, ddl := range indexes {
		if _, err := db.ExecContext(ctx, ddl); err != nil {
			return nil, err
		}
	}
	if _, err := db.ExecContext(ctx, "VACUUM"); err != nil {
		return nil, err
	}
	return dropped, nil
}

func isConstraint(err error) bool {
	var se *sqlite.Error
	return errors.As(err, &se) && se.Code()&0xff == sqlite3.SQLITE_CONSTRAINT
}
