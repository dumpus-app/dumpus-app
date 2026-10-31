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
	"fmt"
	"io"
	"path/filepath"
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
	// limits replaces the default limits, field by field; set by tests.
	limits limits
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
	var iss issues
	defer func() { rep.Issues = iss.list() }()
	lim := opts.limits.orDefaults()
	p := newPkg(zr, r, lim, &iss)
	rep.Counts.InsecurePaths = insecurePaths(zr)

	l := p.layout()
	for _, name := range l.duplicates {
		p.skip(p.get(name), ProblemDuplicate)
	}
	p.share(l.user, l.activity, l.serversIndex, l.messagesIndex, l.payments)
	if l.user == "" {
		rep.MissingFiles = append(rep.MissingFiles, MissingFile{Role: "user", Path: "Account/user.json"})
		return nil, ErrMissingUserData
	}
	p.budget(p.readOrder(l), lim.inflateBudget(size))
	if err := p.locate(ctx, workers); err != nil {
		return nil, err
	}
	rep.Inputs["user"] = maskPath(l.user)
	userData, ok, err := p.readWhole(p.get(l.user))
	if err != nil {
		return nil, err
	}
	var own owner
	var rels []relationship
	if ok {
		own, rels = readOwner(userData, l.user, &iss)
	}
	rep.Counts.Relationships = len(rels)

	var activity *zip.File
	var stream *string
	if l.activity == "" {
		rep.MissingFiles = append(rep.MissingFiles, MissingFile{Role: "activity", Path: "Activity/analytics/events-*.json"})
	} else {
		rep.Inputs["activity"] = maskPath(l.activity)
		if f := p.get(l.activity); p.allowed[f] {
			activity, stream = f, strPtr(l.stream)
		}
	}

	// The activity stream, the long pole, is read beside everything else. The
	// group returns the first error, the cause, not the cancellation it led to.
	g, gctx := errgroup.WithContext(ctx)
	act := newActivityAgg()
	var files *packageFiles
	var actTime, filesTime time.Duration
	if activity != nil {
		g.Go(func() error {
			t := time.Now()
			a, err := readActivity(gctx, p, activity, activityConfig{
				workers:    max(workers-1, 1),
				chunkBytes: cmp.Or(opts.chunkBytes, defaultChunkBytes),
				lineBytes:  lim.lineBytes,
				events:     lim.eventLimit(size),
			})
			if err != nil {
				return err
			}
			act, actTime = a, time.Since(t)
			return nil
		})
	}
	g.Go(func() error {
		t := time.Now()
		pf, err := readFiles(gctx, p, l, own.id, workers)
		files, filesTime = pf, time.Since(t)
		return err
	})
	if err := g.Wait(); err != nil {
		return nil, err
	}
	if activity != nil {
		rep.TimingsMS["activity"] = actTime.Milliseconds()
	}
	rep.TimingsMS["files"] = filesTime.Milliseconds()
	iss.merge(act.issues)

	for role, path := range map[string]string{
		"servers_index": l.serversIndex, "messages_index": l.messagesIndex, "payments": l.payments,
	} {
		if path != "" && p.get(path) != nil {
			rep.Inputs[role] = maskPath(path)
		}
	}
	rep.MissingFiles = append(rep.MissingFiles, files.missing...)

	t := time.Now()
	m := buildModel(opts.PackageID, own, rels, files, act, stream, p.skipped.Load())
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

// insecurePaths counts the names `archive/zip` rejects when
// `GODEBUG=zipinsecurepath=0`: nothing is written to disk by name, so they
// are only reported.
func insecurePaths(zr *zip.Reader) int {
	n := 0
	for _, f := range zr.File {
		if f.Name != "" && (!filepath.IsLocal(f.Name) || strings.Contains(f.Name, `\`)) {
			n++
		}
	}
	return n
}

// packageFiles is everything read besides `user.json` and the activity stream.
// Each task of the pool sets its own fields.
type packageFiles struct {
	missing           []MissingFile
	guilds            []guildEntry
	serversIndexRead  bool
	labels            map[string]string
	messagesIndexRead bool
	payments          []Payment
	channels          []channelResult
	messages          int64
}

func readFiles(ctx context.Context, p *pkg, l layout, ownerID string, workers int) (*packageFiles, error) {
	pf := &packageFiles{channels: make([]channelResult, len(l.channels))}
	g, ctx := errgroup.WithContext(ctx)
	g.SetLimit(workers)
	optional := func(path string, use func(data []byte)) {
		if path == "" || p.get(path) == nil {
			return
		}
		g.Go(func() error {
			data, ok, err := p.readWhole(p.get(path))
			if ok {
				use(data)
			}
			return err
		})
	}
	optional(l.serversIndex, func(data []byte) {
		pf.guilds, pf.serversIndexRead = readServersIndex(data, l.serversIndex, p.iss)
	})
	optional(l.messagesIndex, func(data []byte) {
		pf.labels, pf.messagesIndexRead = readMessagesIndex(data, l.messagesIndex, p.iss)
	})
	optional(l.payments, func(data []byte) {
		pf.payments = readPayments(data, l.payments, p.iss)
	})
	for i, path := range l.channels {
		g.Go(func() error {
			if err := ctx.Err(); err != nil {
				return err
			}
			res, err := readChannelFolder(p, path, ownerID)
			pf.channels[i] = res
			return err
		})
	}
	if err := g.Wait(); err != nil {
		return nil, err
	}

	if !pf.serversIndexRead {
		pf.missing = append(pf.missing, MissingFile{Role: "servers_index", Path: maskPath(orDefault(l.serversIndex, "Servers/index.json"))})
	}
	if !pf.messagesIndexRead {
		pf.missing = append(pf.missing, MissingFile{Role: "messages_index", Path: maskPath(orDefault(l.messagesIndex, "Messages/index.json"))})
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
func readChannelFolder(p *pkg, channelPath, ownerID string) (channelResult, error) {
	data, ok, err := p.readWhole(p.get(channelPath))
	if err != nil || !ok {
		return channelResult{}, err
	}
	channel, err := parseObject(data)
	if err != nil {
		p.iss.add(channelPath, "", "", problemOf(err), 1)
		return channelResult{}, nil
	}
	id, messagesPath, found := messagesEntryFor(channelPath)
	if !found {
		return channelResult{}, nil
	}
	// `messages.json` is streamed, so only the inflate budget bounds it: a heavy
	// account's channel can be far larger than an entry read whole.
	f := p.get(messagesPath)
	if f == nil || !p.allowed[f] {
		return channelResult{}, nil
	}
	e, err := p.open(f, true)
	if err != nil {
		return channelResult{}, fmt.Errorf("%s: %w", maskPath(messagesPath), err)
	}
	defer e.Close()
	res, err := readChannel(channelInput{
		channelPath: channelPath, channel: channel, channelID: id, messagesPath: messagesPath, messages: e,
	}, ownerID, p.iss)
	if err == nil {
		// A file left as malformed is read to its end, where its size and
		// CRC-32 are checked: a corrupt entry fails the package.
		_, err = io.Copy(io.Discard, e)
	}
	if err != nil {
		return channelResult{}, fmt.Errorf("%s: %w", maskPath(messagesPath), err)
	}
	return res, nil
}
