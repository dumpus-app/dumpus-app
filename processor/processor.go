// Package processor turns a Discord data package into the model of the
// database the Dumpus app reads. It reproduces the Python worker's parser,
// quirks included, except that a missing or unreadable field never fails a
// package: it is skipped and counted in the Report. A package fails without
// `user.json`, with ErrMissingUserData, and when its zip can't be read, for eg.
// a corrupt entry, with the read error.
package processor

import (
	"archive/zip"
	"cmp"
	"context"
	"errors"
	"io"
	"runtime"
	"strings"
	"time"

	"golang.org/x/sync/errgroup"
)

// The codes Report.Error carries, the Python worker's.
const (
	CodeMissingUserData = "MISSING_USER_DATA"
	CodeUnknownError    = "UNKNOWN_ERROR"
)

// ErrMissingUserData is returned for a package without `user.json`, which
// happens when the "User data" option is left out of the export request.
var ErrMissingUserData = errors.New(CodeMissingUserData)

// PackageVersion is the `package_version` the app's databases carry.
const PackageVersion = "0.1.0"

// Options configure Process.
type Options struct {
	// PackageID is written to `package_data`.
	PackageID string
	// Workers is the number of goroutines decoding the activity stream and
	// reading the other files. Zero means `GOMAXPROCS`.
	Workers int

	// chunkBytes is the size of the chunks the activity stream is cut into;
	// zero means 4 MiB. Tests make it small so that lines span chunks.
	chunkBytes int
}

// Result is the processed package.
type Result struct {
	Model  *Model // nil when Process fails
	Report *Report
}

// Process reads the package zip from r, of the given size. The zip entries are
// read concurrently through ReadAt, so r can be a local file or a remote one
// read with range requests. The Result always carries a Report, on failure
// too.
func Process(ctx context.Context, r io.ReaderAt, size int64, opts Options) (*Result, error) {
	start := time.Now()
	rep := newReport()
	m, err := processPackage(ctx, r, size, opts, rep)
	rep.TimingsMS["total"] = time.Since(start).Milliseconds()
	if err != nil {
		// Which issues were found before the failure depends on how far the
		// concurrent reads got, so a failed report has none.
		rep.Issues = []Issue{}
		rep.Error = CodeUnknownError
		if errors.Is(err, ErrMissingUserData) {
			rep.Error = CodeMissingUserData
		}
		return &Result{Report: rep}, err
	}
	return &Result{Model: m, Report: rep}, nil
}

func processPackage(ctx context.Context, r io.ReaderAt, size int64, opts Options, rep *Report) (*Model, error) {
	workers := opts.Workers
	if workers <= 0 {
		workers = runtime.GOMAXPROCS(0)
	}
	zr, err := zip.NewReader(r, size)
	if err != nil && !errors.Is(err, zip.ErrInsecurePath) {
		return nil, err
	}
	ents := indexEntries(zr)
	var iss issues
	defer func() { rep.Issues = iss.list() }()

	userPath := ents.userEntry()
	if userPath == "" {
		rep.MissingFiles = append(rep.MissingFiles, MissingFile{Role: "user", Path: "Account/user.json"})
		return nil, ErrMissingUserData
	}
	rep.Inputs["user"] = maskPath(userPath)
	userData, err := readAll(ents.get(userPath))
	if err != nil {
		return nil, err
	}
	own, rels := readOwner(userData, userPath, &iss)
	rep.Counts.Relationships = len(rels)

	activityPath := ents.activityStream()
	if activityPath != "" {
		rep.Inputs["activity"] = maskPath(activityPath)
	} else {
		rep.MissingFiles = append(rep.MissingFiles, MissingFile{Role: "activity", Path: "Activity/analytics/events-*.json"})
	}

	// The activity stream, the long pole, is read beside everything else. The
	// group returns the first error, the cause, not the cancellation it led to.
	g, gctx := errgroup.WithContext(ctx)
	act := newActivityAgg()
	var files *packageFiles
	var actTime, filesTime time.Duration
	if activityPath != "" {
		g.Go(func() error {
			t := time.Now()
			a, err := readActivity(gctx, ents.get(activityPath), max(workers-1, 1), cmp.Or(opts.chunkBytes, defaultChunkBytes))
			if err != nil {
				return err
			}
			act, actTime = a, time.Since(t)
			return nil
		})
	}
	g.Go(func() error {
		t := time.Now()
		pf, err := readFiles(gctx, ents, userPath, own.id, workers, &iss)
		files, filesTime = pf, time.Since(t)
		return err
	})
	if err := g.Wait(); err != nil {
		return nil, err
	}
	if activityPath != "" {
		rep.TimingsMS["activity"] = actTime.Milliseconds()
	}
	rep.TimingsMS["files"] = filesTime.Milliseconds()
	iss.merge(act.issues)

	for role, path := range map[string]string{
		"servers_index": files.serversIndexPath, "messages_index": files.messagesIndexPath, "payments": files.paymentsPath,
	} {
		if path != "" && ents.get(path) != nil {
			rep.Inputs[role] = maskPath(path)
		}
	}
	rep.MissingFiles = append(rep.MissingFiles, files.missing...)

	t := time.Now()
	m := buildModel(opts.PackageID, own, rels, files, act, activityPath != "")
	rep.TimingsMS["build"] = time.Since(t).Milliseconds()
	rep.Counts.ActivityLines = act.lines
	rep.Counts.ActivityEvents = act.events
	rep.Counts.ChannelFiles = len(files.channels)
	rep.Counts.Messages = files.messages
	rep.Counts.DMChannels = len(m.DMChannels)
	rep.Counts.GuildChannels = len(m.GuildChannels)
	rep.Counts.Guilds = len(m.Guilds)
	rep.Counts.Payments = len(m.Payments)
	rep.Counts.Sessions = len(m.Sessions)
	rep.Counts.VoiceSessions = len(m.VoiceSessions)
	rep.Counts.ActivityRows = len(m.Activity)
	return m, nil
}

// packageFiles is everything read besides `user.json` and the activity stream.
// Each task of the pool sets its own fields.
type packageFiles struct {
	serversIndexPath, messagesIndexPath, paymentsPath string

	missing           []MissingFile
	guilds            []guildEntry
	serversIndexRead  bool
	labels            map[string]string
	messagesIndexRead bool
	payments          []Payment
	channels          []channelResult
	messages          int64
}

func readFiles(ctx context.Context, ents *entries, userPath, ownerID string, workers int, iss *issues) (*packageFiles, error) {
	messagesRoot := ents.messagesRoot()
	pf := &packageFiles{
		serversIndexPath:  ents.indexPath(ents.serversRoot(messagesRoot), "Servers/index.json", "servers/index.json"),
		messagesIndexPath: ents.indexPath(messagesRoot, "Messages/index.json", "messages/index.json"),
		paymentsPath:      userPath[:strings.LastIndexByte(userPath, '/')] + "/user_data_exports/discord_billing/payments.json",
	}
	channelPaths := ents.channelFiles(messagesRoot)
	pf.channels = make([]channelResult, len(channelPaths))

	g, ctx := errgroup.WithContext(ctx)
	g.SetLimit(workers)
	optional := func(path string, use func(data []byte)) {
		if path == "" || ents.get(path) == nil {
			return
		}
		g.Go(func() error {
			data, err := readAll(ents.get(path))
			if err == nil {
				use(data)
			}
			return err
		})
	}
	optional(pf.serversIndexPath, func(data []byte) {
		pf.guilds, pf.serversIndexRead = readServersIndex(data, pf.serversIndexPath, iss)
	})
	optional(pf.messagesIndexPath, func(data []byte) {
		pf.labels, pf.messagesIndexRead = readMessagesIndex(data, pf.messagesIndexPath, iss)
	})
	optional(pf.paymentsPath, func(data []byte) {
		pf.payments = readPayments(data, pf.paymentsPath, iss)
	})
	for i, path := range channelPaths {
		g.Go(func() error {
			if err := ctx.Err(); err != nil {
				return err
			}
			res, err := readChannelFolder(ents, path, ownerID, iss)
			pf.channels[i] = res
			return err
		})
	}
	if err := g.Wait(); err != nil {
		return nil, err
	}

	if !pf.serversIndexRead {
		pf.missing = append(pf.missing, MissingFile{Role: "servers_index", Path: maskPath(orDefault(pf.serversIndexPath, "Servers/index.json"))})
	}
	if !pf.messagesIndexRead {
		pf.missing = append(pf.missing, MissingFile{Role: "messages_index", Path: maskPath(orDefault(pf.messagesIndexPath, "Messages/index.json"))})
	}
	for _, c := range pf.channels {
		pf.messages += c.total
	}
	return pf, nil
}

func orDefault(s, def string) string {
	if s == "" {
		return def
	}
	return s
}

// `channel.json` is parsed before looking for `messages.json`, so a malformed
// one is reported even in a folder without messages.
func readChannelFolder(ents *entries, channelPath, ownerID string, iss *issues) (channelResult, error) {
	data, err := readAll(ents.get(channelPath))
	if err != nil {
		return channelResult{}, err
	}
	channel, err := parseObject(data)
	if err != nil {
		iss.add(channelPath, "", "", problemOf(err), 1)
		return channelResult{}, nil
	}
	id, messagesPath, ok := messagesEntryFor(channelPath)
	if !ok {
		return channelResult{}, nil
	}
	f := ents.get(messagesPath)
	if f == nil {
		return channelResult{}, nil
	}
	msgs, err := readAll(f)
	if err != nil {
		return channelResult{}, err
	}
	return readChannel(channelInput{
		channelPath: channelPath, channel: channel, channelID: id, messagesPath: messagesPath, messagesJSON: msgs,
	}, ownerID, iss), nil
}
