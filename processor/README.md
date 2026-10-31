# dumpus-processor

Turns a Discord data package into the SQLite database the Dumpus app reads, with the tables, columns and values of the Python worker, on any machine Go runs on.

## Usage

```sh
go install github.com/dumpus-app/dumpus-app/processor/cmd/dumpus-processor@latest
dumpus-processor --input package.zip --output package.sqlite --package-id ID [--report report.json] [--workers N]
```

- `0`: the database is written, and the report when asked for.
- `1`: the package can't be processed, `UNKNOWN_ERROR`.
- `3`: the package has no `user.json`, `MISSING_USER_DATA`.
- `4`: the database is written but the report isn't, `REPORT_FAILED`.
- `64`: a usage error.

On `1`, `3` and `4`, stderr ends with a JSON line, for eg. `{"error":"UNKNOWN_ERROR","message":"..."}`. `--report` lists what the package lacked as masked entry paths and counts, never a value from it, for eg. `{"path": "Activity/analytics/events-*-*-of-*.json", "event_type": "add_reaction", "field": "emoji_name", "problem": "missing", "count": 3}` among its `issues`, beside `inputs`, `missing_files`, `counts` and `dropped_rows`. `problem` is one of `missing`, `null`, `wrong_type`, `unparseable` and `malformed` for what the parser can't read, `mixed_formats` and `self_dm` for channels the worker fails on, `duplicate` for a channel folder whose entries another folder or role reads, `no_event_read` for a stream where events failed and none was read, and `too_large`, `over_budget`, `too_long` and `too_many_events` for a limit. A failed report has `error` and no issues.

## Limits

Each limit sits far above the maxima measured on real exports. Past one, the processor skips and reports, and the package is partial.

| Limit | Default | Real exports | Past it |
| --- | --- | --- | --- |
| activity line | 32 MiB | about 2 MB | skipped, `too_long` |
| entry read whole: `user.json`, an index, the payments, a `channel.json` | 256 MiB | under 10 MB | skipped, `too_large` |
| bytes inflated in all | 100 times the zip, at least 64 MiB | under 20 times | entries skipped in a fixed order, `over_budget` |
| relevant activity events | the inflate budget over 60 bytes, the shortest line that holds one | 0.001 per byte of zip | stream set aside, `too_many_events` |

## As a library

`processor.Process(ctx, r, size, processor.Options{PackageID: id})` reads the package from an `io.ReaderAt`, a local file or one read with range requests, at one read per local header and per MiB of data, and returns a `Result` whose `Report` is there on failure too; `sqlitedb.Write(ctx, path, res.Model)` writes the database.

## How it works

- Entries are found by the shape of their path, since exports name their folders in the account's language; the activity stream is the first shard of `analytics`, else `reporting`.
- Each entry is inflated at most once: the local headers come first, so that entries sharing compressed data fail the package before any data is read, an entry that several roles name, which only a crafted package does, is read whole once for all of them, and a channel folder that would read another's entry is skipped as `duplicate`.
- One goroutine inflates the activity stream into chunks of whole lines that workers decode, a pool reads the other entries, and `processor/sqlitedb` writes the worker's DDL with `modernc.org/sqlite`, pure Go.

## Parity with the Python worker

- The worker's quirks are kept: reactions never custom, activity timestamps cut to the minute at fixed positions and read as UTC, session and voice dates stored as TEXT like `'1617712440.0'`, its pairing loops, and the rows pandas groups with a null key dropped.
- Messages count by the hour written in their timestamp, and channels missing from the messages index are dropped but count in their guild's total.

## Known differences from the Python worker

- Where the worker fails a package, the processor goes on: it skips and reports an event, message, payment or relationship with a missing, null, mistyped or unparseable field, and a line or channel that isn't valid JSON, and it reads a DM with yourself, a DM message without `Contents` and mixed timestamp formats.
- An id, name or `os` field the worker stores must be a string or null, or the event is skipped. The worker stores a number or a boolean as text, `7` as `'7'` and `true` as `'1'`, but its pandas grouping turns an integer beside nulls into `'7.0'`, and in `application_command_used` and `add_reaction`, grouped by two fields, stores a field of only integers or only booleans as BLOBs of numpy's bytes. Fields it neither stores nor tests aren't checked.
- A row SQLite refuses is skipped and counted in `dropped_rows`, and rows come in another order, so rowids differ.
- `package_data` has one more column, `activity_stream`: the stream read, `analytics` or `reporting`, or NULL when none was. `reporting` never carries some event types, for eg. `message_edited`, so their counts are unknown, not 0.
- The worker wrote `oauth2_authorize_accepted` only beside a `bot_token_compromised`, `notification_clicked` beside a `dev_portal_page_viewed` of a `/docs/` page, and `voice_message_recorded` beside an `application_created`; the processor writes each whenever the stream has it.

## License

MIT, see [LICENSE](LICENSE); the rest of the repository stays GPL-3.0.
