# dumpus-processor

Turns a Discord data package into the SQLite database the Dumpus app reads: the same tables, columns, column types and values as the Python worker, so the app needs no change. It runs anywhere Go does, with no Dumpus account or server involved.

## Usage

```sh
go install github.com/dumpus-app/dumpus-app/processor/cmd/dumpus-processor@latest
dumpus-processor --input package.zip --output package.sqlite --package-id ID [--report report.json]
```

`--package-id` is the id stored in `package_data`. `--workers` sets how many goroutines decode the package (default `GOMAXPROCS`).

Exit codes:

- 0: the database was written, and the report when asked for.
- 1: the package can't be processed (an unreadable zip, a corrupt entry); stderr ends with `{"error":"UNKNOWN_ERROR","message":"..."}`.
- 3: the package has no `user.json`; stderr ends with `{"error":"MISSING_USER_DATA"}`.
- 4: the database was written but the report couldn't be; stderr ends with `{"error":"REPORT_FAILED","message":"..."}`.
- 64: usage error. Go itself exits 2 on a panic or when out of memory.

`UNKNOWN_ERROR` and `MISSING_USER_DATA` are the Python worker's codes. The database is written next to `--output`, synced to disk and moved into place once complete, with mode `0600`.

### The report

`--report` writes what the package lacked compared to what the parser expects, as entry paths and counts, never a value from the package: digit runs in paths are masked (`Messages/c*/messages.json`), and event types and fields come from the parser's own vocabulary.

```json
{
  "inputs": {"user": "Cuenta/user.json", "activity": "Actividad/analytics/events-*-*-of-*.json", "...": "..."},
  "missing_files": [{"role": "servers_index", "path": "Servers/index.json"}],
  "issues": [
    {"path": "Activity/reporting/events-*-*-of-*.json", "event_type": "add_reaction", "field": "emoji_name", "problem": "missing", "count": 3}
  ],
  "dropped_rows": {"sessions": 1},
  "counts": {"activity_lines": 500000, "activity_events": 90000, "...": 0},
  "timings_ms": {"activity": 1200, "files": 30, "build": 10, "total": 1240}
}
```

`problem` is one of `missing`, `null`, `wrong_type`, `unparseable`, `malformed`, `mixed_formats`, `self_dm` and `duplicate` for a channel folder whose entries another one reads, then `too_large`, `over_budget`, `too_long` and `too_many_events` when a limit was hit. `counts.insecure_paths` counts the entry names `archive/zip` calls insecure, for eg. absolute, climbing out with `..` or holding a backslash; names are never used as paths on disk. `inputs` lists the entry found for each role, also when a limit skipped it. On failure the report carries `error` with the same code as stderr, and no issue: which ones were found before the failure depends on timing.

### Limits

A package is untrusted input, so the processor bounds what one can cost. Each limit is set far above the maxima measured across 169 real exports, and hitting one is reported rather than failing the package:

| Limit | Default | Measured maximum | Past it |
| --- | --- | --- | --- |
| activity line length | 32 MiB | about 2 MB | the line is skipped, `too_long` |
| entry read whole: `user.json`, the indexes, the payments and each `channel.json` | 256 MiB | under 10 MB | the entry is skipped, `too_large` |
| bytes inflated in all | 100 times the zip size, at least 64 MiB | 19.3 times for an activity stream, 19.2 for a whole package | entries are skipped in a fixed order, `over_budget` |
| relevant activity events | the inflate budget over 60 bytes, the shortest line, newline included, that can carry an event the parser keeps | 0.001 per byte of zip, against 1.67 allowed | the stream is cut after the last whole chunk under the limit and set aside, `too_many_events` |

The activity stream and each `messages.json` are read as streams, in constant memory, so only the inflate budget bounds them; the largest `messages.json` measured is under 70 MB. A stored event takes 24 to 32 bytes, its strings kept once per stream, so the events a package may hold cost at most about half its inflate budget in memory, and the event limit follows the package's size: only a stream of lines shorter than any real event can trip it. An entry fails the package as soon as it inflates past its declared size, and so do two entries read that share compressed data, which Python's `zipfile` refuses too. Any entry or line a limit skips, a duplicate channel folder and a set-aside stream make the package partial. For a set-aside stream, `counts.activity_events` is the limit, and its issues, `too_long` aside, are those of the chunks before the cut.

### As a library

```go
res, err := processor.Process(ctx, f, size, processor.Options{PackageID: id})
if err != nil {
	// res.Report.Error is processor.CodeMissingUserData or processor.CodeUnknownError.
	return err
}
written, err := sqlitedb.Write(ctx, "package.sqlite", res.Model)
if err != nil {
	return err
}
// written.DroppedRows counts the rows the schema refused.
```

`Process` takes an `io.ReaderAt` and a size, so the package can be a local file or a remote one read with range requests: each entry is read through one buffer sized to it, so a small entry costs two reads and a large one a read per MiB. Only `user.json`, the payments, the servers and messages indexes, the channel folders and one activity stream are read.

## How it works

- Entries are found by the shape of their path, never by folder name, since exports name their top folders in the account's language (`Cuenta/`, `Mensajes/`, `Servidores/`, `Actividad/`, lowercase or TitleCase): `user.json` one folder deep, the folder holding `c<id>/channel.json`, the folder holding `<id>/guild.json`. The activity stream is the first shard of `analytics`, else `reporting`; `tns` and `modeling` are never read.
- One goroutine inflates the activity stream and cuts it into chunks of whole lines. Workers skip a line whose `event_type` the parser doesn't use without decoding it, decode the rest and aggregate. Another goroutine checksums the chunks in order. Each event keeps its position in the file, so sorting sessions and voice events reproduces Python's stable sorts.
- A pool reads the indexes, the payments and the channel folders in parallel, each zip entry through its own `ReadAt`.
- `sqlitedb` writes the worker's DDL text and index names with `modernc.org/sqlite` (pure Go), binds the same types so SQLite stores the same classes, builds the indexes after the inserts, then runs `VACUUM`. Rollback journal, never WAL.

## Parity with the Python worker

The output matches the worker's `read_analytics_file` bug for bug, including its fixes for the missing `discriminator`, `global_name` display names, linear session pairing and the servers fallback that skips the messages index. Each quirk below is kept on purpose, to be fixed in its own change:

- `oauth2_authorize_accepted` is counted only when the unrelated `bot_token_compromised` list is non-empty, `notification_clicked` only with `dev_portal_page_viewed` on `/docs/`, `voice_message_recorded` only with `application_created`.
- `add_reaction.extra_field_2` (is_custom) is always `'0'`.
- Activity timestamps keep the year to the minute, read at fixed positions and taken as UTC; session and voice dates are stored as TEXT like `'1617712440.0'`.
- Each `session_end` drains the whole queue of pending starts; voice joins are checked only against the accepted session with the nearest earlier start.
- Rows grouped by pandas with a null key are dropped (application commands, reactions, app opens); a `guild_joined` with a null guild is kept.
- Message timestamps are bucketed by the hour written in them, offset included, not converted to UTC.
- Channels missing from the messages index are dropped, but still count in their guild's total; group DMs are ignored; only `messages.json` is read.
- `sentiment_score` is 0.5; `is_partial` is true unless a usable event was read, and whenever the servers or messages index is missing.

`processor/*_test.go` checks these on synthetic packages, and the session pairing against a port of the original quadratic loop.

## Known differences from the Python worker

Where the worker fails a package, the processor goes on and counts the problem in the report:

- A field the worker reads is missing, null where a value is needed, of another JSON type, or a timestamp it can't parse: the event, message, payment or relationship is skipped. For eg. an `add_reaction` without `emoji_name`, a payment without `description`, a `user.json` without `avatar_hash` (the avatar is `NULL`) or `relationships`. A missing owner `id` or `username` is stored as an empty string.
- A voice event without `client_track_timestamp`, or with JSON null, uses `timestamp`, as for the string `'null'`.
- Id, name and `os` fields the worker stores must be strings or null: a number or a boolean there skips the event, where the worker stores it as text, for eg. `7` as `'7'` and `true` as `'1'`. A field it neither stores nor tests, for eg. the `os` of a `session_end` or the `guild_id` of a `leave_voice_channel`, isn't checked. The servers index names and the payment text fields accept integers.
- A DM with yourself, both recipients being the owner: `dm_user_id` is the owner's id. The worker fails with `IndexError`.
- A DM message without `Contents` is counted like any other. The worker fails with `KeyError`.
- A message without `Timestamp` counts in the channel's total but not per hour; one that isn't an ISO 8601 date is skipped (pandas reads some other formats, or fails).
- Mixed timestamp formats in one channel, for eg. `:56` and `:56.123`, or two offsets: every message is bucketed by its own hour. pandas fails the whole package.
- Where a limit is hit, see [Limits](#limits), the processor skips and reports; the worker has no limits.
- A channel folder whose `channel.json` or `messages.json` another folder or role reads is skipped, reported as `duplicate`, and the package is partial: for eg. a repeated entry name, or `channel.json` files in subfolders of `Messages/c<id>/`, which read the same `messages.json`. The worker reads every copy, and fails on the duplicate `channel_id` when the channel is in the messages index.
- A line of the activity stream that isn't JSON is skipped, and counted when it carries an event type the parser uses; lines of other types aren't validated. The worker fails on any such line, blank lines included.
- A `channel.json` or `messages.json` that isn't valid JSON skips the channel. A `recipients` that isn't a list is reported, then the channel is read as a guild channel when it has a `guild`, as the worker does for any `recipients` but a pair.
- A servers or messages index whose folder exists but which is missing, invalid or not an object counts as missing: the package is partial.
- A row SQLite refuses, a `NULL` in a `NOT NULL` column (for eg. a session started with `"os": null`, a guild with a null name) or a duplicate primary key, is skipped and counted in `dropped_rows`.
- Entries compressed with anything but stored or deflate fail the package; Python's `zipfile` also reads bzip2 and LZMA, which Discord doesn't use.
- Rows are inserted in another order within each table, so rowids differ. The app's `ORDER BY occurence_count` has no tie-breaker and can list ties in another order; that query is to be fixed rather than rowids matched.

## Development

```sh
cd processor
go vet ./...
go test ./...
```

Tests build their packages in memory with made-up ids and names; no real package or database belongs in this repository.

## License

This module is MIT-licensed, see [LICENSE](LICENSE); the rest of the repository stays GPL-3.0.
