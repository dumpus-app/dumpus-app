package processor

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"math/rand/v2"
	"reflect"
	"slices"
	"strings"
	"sync/atomic"
	"testing"
)

func processWith(t *testing.T, entries []entry, opts Options) *Result {
	t.Helper()
	r, size := zipOf(t, entries)
	opts.PackageID = "pkg-test"
	res, err := Process(context.Background(), r, size, opts)
	if err != nil {
		t.Fatal(err)
	}
	return res
}

func hasIssue(r *Report, path, problem string, count int) bool {
	return slices.Contains(r.Issues, Issue{Path: path, Problem: problem, Count: count})
}

const streamPath = "Activity/analytics/events-2021-00000-of-00001.json"

// TestLongLines skips activity lines over the limit, whether a chunk holds
// them whole or they span several, and decodes the rest as if they weren't
// there; a skipped line can hold an event, so the package is partial.
func TestLongLines(t *testing.T) {
	long := func(kind string) string {
		return event(kind, "timestamp", ts("2021-04-06T10:00:00.000Z"), "os", `"`+strings.Repeat("x", 3000)+`"`)
	}
	withLong := lines(
		event("session_start", "timestamp", ts("2021-04-06T10:00:00.000Z"), "os", `"Windows"`),
		long("session_start"),
		long("unused_event"),
		event("session_end", "timestamp", ts("2021-04-06T10:30:00.000Z"), "os", `"Windows"`),
		long("app_opened"),
	)
	plain := lines(
		event("session_start", "timestamp", ts("2021-04-06T10:00:00.000Z"), "os", `"Windows"`),
		event("session_end", "timestamp", ts("2021-04-06T10:30:00.000Z"), "os", `"Windows"`),
	)
	base := without(fullPackage(english), "Activity/")
	want := processWith(t, append(slices.Clone(base), entry{streamPath, plain}), Options{})
	for _, chunkBytes := range []int{512, 1 << 16} {
		got := processWith(t, append(slices.Clone(base), entry{streamPath, withLong}),
			Options{chunkBytes: chunkBytes, limits: limits{lineBytes: 1024}})
		if !got.Model.Package.IsPartial {
			t.Errorf("chunks of %d: the package is complete", chunkBytes)
		}
		got.Model.Package.IsPartial = false
		if !reflect.DeepEqual(got.Model, want.Model) {
			t.Errorf("chunks of %d: the long lines changed the model", chunkBytes)
		}
		if !hasIssue(got.Report, "Activity/analytics/events-*-*-of-*.json", ProblemTooLong, 3) {
			t.Errorf("chunks of %d: issues %+v", chunkBytes, got.Report.Issues)
		}
	}
}

// TestDuplicateChannels reads each entry once: a channel folder whose
// `channel.json` or `messages.json` another folder reads, under a repeated name
// or through a subfolder, is skipped and reported, and the package is partial.
func TestDuplicateChannels(t *testing.T) {
	base := without(fullPackage(english), "Activity/", "Messages/c"+general)
	msgs := messages("2021-04-06 12:00:00", "2021-04-06 13:00:00")
	for _, tt := range []struct {
		name   string
		copies func(i int) entry
		single []entry
		issue  Issue
	}{
		{"repeated name", func(int) entry {
			return entry{"Messages/c" + general + "/channel.json", guildChannel(general, guildOne)}
		},
			[]entry{{"Messages/c" + general + "/messages.json", msgs}},
			Issue{Path: "Messages/c*/channel.json", Problem: ProblemDuplicate, Count: 199}},
		{"subfolders", func(i int) entry {
			return entry{fmt.Sprintf("Messages/c%s/x%03d/channel.json", general, i), guildChannel(general, guildOne)}
		}, []entry{{"Messages/c" + general + "/" + general + "/messages.json", msgs}},
			Issue{Path: "Messages/c*/x*/channel.json", Problem: ProblemDuplicate, Count: 199}},
	} {
		t.Run(tt.name, func(t *testing.T) {
			one := append(slices.Clone(base), tt.copies(0))
			want := processWith(t, append(one, tt.single...), Options{})
			many := slices.Clone(base)
			for i := range 200 {
				many = append(many, tt.copies(i))
			}
			got := processWith(t, append(many, tt.single...), Options{})
			if !slices.Contains(got.Report.Issues, tt.issue) || !got.Model.Package.IsPartial {
				t.Errorf("issues %+v, partial %v", got.Report.Issues, got.Model.Package.IsPartial)
			}
			if got.Report.Counts.ChannelFiles != want.Report.Counts.ChannelFiles || got.Report.Counts.Messages != want.Report.Counts.Messages {
				t.Errorf("counts %+v, want %+v", got.Report.Counts, want.Report.Counts)
			}
			if !reflect.DeepEqual(got.Model.GuildChannels, want.Model.GuildChannels) || !reflect.DeepEqual(got.Model.Activity, want.Model.Activity) {
				t.Error("the copies changed the model")
			}
		})
	}
	// A folder whose `messages.json` is the activity stream reads nothing.
	es := append(without(fullPackage(english), "Activity/"),
		entry{"Messages/analytics/c" + general + "/channel.json", guildChannel(general, guildOne)},
		entry{"Messages/analytics/c" + general + "/messages.json", lines(event("email_opened", "timestamp", ts("2021-04-06T09:00:00.000Z")))})
	res := processWith(t, es, Options{})
	if !hasIssue(res.Report, "Messages/analytics/c*/channel.json", ProblemDuplicate, 1) {
		t.Errorf("issues %+v", res.Report.Issues)
	}
}

// shareData points the central directory record of entry from at the local
// header of entry to, so that both read the same compressed data.
func shareData(t *testing.T, data []byte, from, to string) []byte {
	t.Helper()
	data = slices.Clone(data)
	eocd := bytes.LastIndex(data, []byte("PK\x05\x06"))
	if eocd < 0 {
		t.Fatal("no end of central directory")
	}
	offsets := map[string]int{} // name -> position of its local header offset field
	headers := map[string]uint32{}
	for i := int(binary.LittleEndian.Uint32(data[eocd+16:])); bytes.HasPrefix(data[i:], []byte("PK\x01\x02")); {
		nameLen := int(binary.LittleEndian.Uint16(data[i+28:]))
		extraLen := int(binary.LittleEndian.Uint16(data[i+30:]))
		commentLen := int(binary.LittleEndian.Uint16(data[i+32:]))
		name := string(data[i+46 : i+46+nameLen])
		offsets[name] = i + 42
		headers[name] = binary.LittleEndian.Uint32(data[i+42:])
		i += 46 + nameLen + extraLen + commentLen
	}
	if _, ok := offsets[from]; !ok {
		t.Fatalf("no entry %s", from)
	}
	binary.LittleEndian.PutUint32(data[offsets[from]:], headers[to])
	return data
}

// TestSharedData refuses two entries that point at the same compressed data,
// which would let a small zip inflate the same bytes many times.
func TestSharedData(t *testing.T) {
	// Two folders with the same messages, so that either entry reads well on
	// its own and only their ranges give them away.
	const a, b = "400000000000000011", "400000000000000012"
	same := messages("2021-04-06 12:00:00", "2021-04-06 13:00:00")
	es := append(fullPackage(english), channelFolder(english, a, guildChannel(a, guildOne), same)...)
	es = append(es, channelFolder(english, b, guildChannel(b, guildOne), same)...)
	r, size := zipOf(t, es)
	data := make([]byte, size)
	if _, err := r.ReadAt(data, 0); err != nil {
		t.Fatal(err)
	}
	data = shareData(t, data, "Messages/c"+a+"/messages.json", "Messages/c"+b+"/messages.json")
	res, err := Process(context.Background(), bytes.NewReader(data), size, Options{PackageID: "pkg-test"})
	if !errors.Is(err, errSharedData) {
		t.Fatalf("err = %v, want errSharedData", err)
	}
	if res.Report.Error != CodeUnknownError {
		t.Errorf("report error = %q", res.Report.Error)
	}
}

// TestInflateBudget skips the entries past the budget, in a fixed order: here
// the activity stream, which declares more than the whole budget.
func TestInflateBudget(t *testing.T) {
	stream := strings.Repeat(event("unused_event", "n", "1")+"\n", 2000)
	es := append(without(fullPackage(english), "Activity/"), entry{streamPath, stream})
	res := processWith(t, es, Options{limits: limits{inflateRatio: 1, minInflate: 20000}})
	if !hasIssue(res.Report, "Activity/analytics/events-*-*-of-*.json", ProblemOverBudget, 1) {
		t.Errorf("issues %+v", res.Report.Issues)
	}
	if !res.Model.Package.IsPartial || len(res.Model.Sessions) != 0 {
		t.Errorf("partial %v, %d sessions", res.Model.Package.IsPartial, len(res.Model.Sessions))
	}
	if len(res.Model.DMChannels) == 0 {
		t.Error("the entries within the budget were not read")
	}
}

// TestEntryTooLarge skips the entries read whole that declare more than the
// limit and makes the package partial, while a `messages.json` of any size is
// streamed.
func TestEntryTooLarge(t *testing.T) {
	const limit = 4096
	var records []string
	for i := range 60 {
		records = append(records, fmt.Sprintf(`{"id": "p%d", "status": 1, "currency": "usd", "amount": 1, "created_at": "2022-03-04T05:06:07+00:00", "description": "x"}`, i))
	}
	bigPayments := `{"records": [` + strings.Join(records, ", ") + `]}`
	var stamps []string
	for range 200 {
		stamps = append(stamps, "2021-04-06 12:00:00")
	}
	bigMessages := messages(stamps...)
	if len(bigPayments) <= limit || len(bigMessages) <= limit || len(userJSON) > limit {
		t.Fatal("the synthetic entries don't straddle the limit")
	}
	swap := func(es []entry, name, body string) []entry {
		es = slices.Clone(es)
		for i := range es {
			if es[i].name == name {
				es[i].body = body
			}
		}
		return es
	}
	es := swap(fullPackage(english), "Account/user_data_exports/discord_billing/payments.json", bigPayments)
	es = swap(es, "Messages/c"+general+"/messages.json", bigMessages)
	res := processWith(t, es, Options{limits: limits{entryBytes: limit}})
	m := res.Model
	if !hasIssue(res.Report, "Account/user_data_exports/discord_billing/payments.json", ProblemTooLarge, 1) || len(m.Payments) != 0 {
		t.Errorf("payments: %d rows, issues %+v", len(m.Payments), res.Report.Issues)
	}
	if !m.Package.IsPartial || m.Package.OwnerName != "owner_user" {
		t.Errorf("partial %v, owner %q", m.Package.IsPartial, m.Package.OwnerName)
	}
	streamed := false
	for _, c := range m.GuildChannels {
		streamed = streamed || c.ChannelID == general && c.TotalMessageCount == 200
	}
	if !streamed {
		t.Errorf("the large messages.json was not read: %+v", m.GuildChannels)
	}

	es = swap(fullPackage(english), "Account/user.json", strings.Replace(userJSON, `"email"`, `"padding": "`+strings.Repeat("x", limit)+`", "email"`, 1))
	res = processWith(t, es, Options{limits: limits{entryBytes: limit}})
	if p := res.Model.Package; !p.IsPartial || p.OwnerID != "" || !hasIssue(res.Report, "Account/user.json", ProblemTooLarge, 1) {
		t.Errorf("user.json too large: partial %v, owner %q, issues %+v", p.IsPartial, p.OwnerID, res.Report.Issues)
	}
}

// TestMinEventLine checks that the line the event limit is derived from is
// one the parser keeps, and that one byte less of its timestamp isn't.
func TestMinEventLine(t *testing.T) {
	line := `{"event_type":"app_crashed","timestamp":"x2021-04-06T12:3"}`
	if len(line)+len("\n") != minEventLine {
		t.Fatalf("the line takes %d bytes, minEventLine is %d", len(line)+len("\n"), minEventLine)
	}
	base := without(fullPackage(english), "Activity/")
	for _, tt := range []struct {
		line string
		kept bool
	}{
		{line, true},
		{strings.Replace(line, ":3", ":", 1), false},
	} {
		res := process(t, append(slices.Clone(base), entry{"Activity/analytics/events-2021-00000-of-00001.json", tt.line + "\n"}))
		kept := slices.ContainsFunc(res.Model.Activity, func(a Activity) bool { return a.EventName == "app_crashed" })
		if kept != tt.kept {
			t.Errorf("%s: kept = %v, want %v", tt.line, kept, tt.kept)
		}
	}
}

// TestEventLimit sets aside a stream with more relevant events than the
// limit, cut at the same chunk whatever the timing: the report must not depend
// on which worker ran first.
func TestEventLimit(t *testing.T) {
	var ls []string
	for i := range 3000 {
		if i%7 == 0 {
			ls = append(ls, event("email_opened", "timestamp", `"no date"`))
		} else {
			ls = append(ls, event("email_opened", "timestamp", ts("2021-04-06T09:00:00.000Z")))
		}
	}
	es := append(without(fullPackage(english), "Activity/"), entry{streamPath, strings.Join(ls, "\n")})
	var first *Report
	for run := range 12 {
		res := processWith(t, es, Options{limits: limits{events: 1000}, Workers: 1 + run%6, chunkBytes: 2048})
		rep, m := res.Report, res.Model
		rep.TimingsMS = nil
		if !hasIssue(rep, "Activity/analytics/events-*-*-of-*.json", ProblemTooManyEvents, 1) || rep.Counts.ActivityEvents != 1000 {
			t.Fatalf("issues %+v, %d events", rep.Issues, rep.Counts.ActivityEvents)
		}
		if !m.Package.IsPartial || len(m.Sessions) != 0 {
			t.Errorf("partial %v, %d sessions", m.Package.IsPartial, len(m.Sessions))
		}
		for _, a := range m.Activity {
			if a.EventName != "message_sent" {
				t.Errorf("activity row %s kept", a.EventName)
			}
		}
		if first == nil {
			first = rep
		} else if !reflect.DeepEqual(rep, first) {
			t.Fatalf("run %d: the report differs:\n%+v\n%+v", run, rep, first)
		}
	}
}

// TestSkippedMessagesArePartial skips a `messages.json` past the inflate
// budget: its channel is left out, which makes the package partial.
func TestSkippedMessagesArePartial(t *testing.T) {
	es := without(fullPackage(english), "Activity/")
	var stamps []string
	for range 3000 {
		stamps = append(stamps, "2021-04-06 12:00:00")
	}
	es = append(es, channelFolder(english, "400000000000000020", guildChannel("400000000000000020", guildOne), messages(stamps...))...)
	res := processWith(t, es, Options{limits: limits{inflateRatio: 1, minInflate: 30000}})
	if !hasIssue(res.Report, "Messages/c*/messages.json", ProblemOverBudget, 1) {
		t.Errorf("issues %+v", res.Report.Issues)
	}
	if !res.Model.Package.IsPartial {
		t.Error("a skipped channel left the package complete")
	}
}

func TestCheckRanges(t *testing.T) {
	var ranges []dataRange
	for i := 1000; i > 0; i-- {
		ranges = append(ranges, dataRange{start: int64(i * 10), end: int64(i*10 + 10)})
	}
	if err := checkRanges(ranges); err != nil {
		t.Errorf("disjoint ranges: %v", err)
	}
	if err := checkRanges(append(ranges, dataRange{start: 505, end: 506})); !errors.Is(err, errSharedData) {
		t.Errorf("overlapping ranges: %v", err)
	}
}

type byteCounter struct {
	r            io.ReaderAt
	bytes, calls atomic.Int64
}

func (c *byteCounter) ReadAt(p []byte, off int64) (int, error) {
	n, err := c.r.ReadAt(p, off)
	c.bytes.Add(int64(n))
	c.calls.Add(1)
	return n, err
}

// TestOverlappingRecordsReadNothing points thousands of central directory
// records at one local header, each declaring a MiB of compressed data: the
// package fails before any of it is read, rather than after reading each
// record's MiB.
func TestOverlappingRecordsReadNothing(t *testing.T) {
	es := []entry{{"Account/user.json", userJSON}}
	for i := range 1000 {
		es = append(es, entry{fmt.Sprintf("Messages/c%d/channel.json", 400000000000000000+i), guildChannel(general, guildOne)})
	}
	r, size := zipOf(t, es)
	data := make([]byte, size)
	if _, err := r.ReadAt(data, 0); err != nil {
		t.Fatal(err)
	}
	eocd := bytes.LastIndex(data, []byte("PK\x05\x06"))
	first := int64(-1)
	for i := int(binary.LittleEndian.Uint32(data[eocd+16:])); bytes.HasPrefix(data[i:], []byte("PK\x01\x02")); {
		nameLen := int(binary.LittleEndian.Uint16(data[i+28:]))
		extraLen := int(binary.LittleEndian.Uint16(data[i+30:]))
		commentLen := int(binary.LittleEndian.Uint16(data[i+32:]))
		if strings.HasSuffix(string(data[i+46:i+46+nameLen]), "channel.json") {
			if first < 0 {
				first = int64(binary.LittleEndian.Uint32(data[i+42:]))
			}
			binary.LittleEndian.PutUint32(data[i+42:], uint32(first))
			binary.LittleEndian.PutUint32(data[i+20:], 1<<20)
		}
		i += 46 + nameLen + extraLen + commentLen
	}
	c := &byteCounter{r: bytes.NewReader(data)}
	if _, err := Process(context.Background(), c, size, Options{PackageID: "pkg-test", Workers: 2}); !errors.Is(err, errSharedData) {
		t.Fatalf("err = %v, want errSharedData", err)
	}
	if c.bytes.Load() > 2*size {
		t.Errorf("%d bytes read from a %d-byte zip in %d reads", c.bytes.Load(), size, c.calls.Load())
	}
}

// rangeCounter counts the bytes read within one range of the zip.
type rangeCounter struct {
	r          io.ReaderAt
	start, end int64
	n          atomic.Int64
}

func (c *rangeCounter) ReadAt(p []byte, off int64) (int, error) {
	n, err := c.r.ReadAt(p, off)
	if lo, hi := max(off, c.start), min(off+int64(n), c.end); hi > lo {
		c.n.Add(hi - lo)
	}
	return n, err
}

// TestRolesShareAnEntry gives one entry to the activity stream and both
// indexes, as a crafted package can: its data is read once for all three.
func TestRolesShareAnEntry(t *testing.T) {
	var members []string
	for i := range 2000 {
		members = append(members, fmt.Sprintf(`"%d": "g%d"`, 300000000000000000+i, i))
	}
	// The filler keeps the search for the end of the central directory away
	// from the shared entry's data.
	rng := rand.New(rand.NewPCG(20261030, 5))
	filler := make([]byte, 4096)
	for i := range filler {
		filler[i] = byte(rng.IntN(256))
	}
	const shared = "X/analytics/index.json"
	r, size := zipOf(t, []entry{
		{"Account/user.json", userJSON},
		{shared, "{" + strings.Join(members, ", ") + "}"},
		{"X/analytics/" + guildOne + "/guild.json", `{"id": "` + guildOne + `"}`},
		{"X/analytics/c" + general + "/channel.json", guildChannel(general, guildOne)},
		{"X/filler", string(filler)},
	})
	zr, err := zip.NewReader(r, size)
	if err != nil {
		t.Fatal(err)
	}
	i := slices.IndexFunc(zr.File, func(f *zip.File) bool { return f.Name == shared })
	f := zr.File[i]
	off, err := f.DataOffset()
	if err != nil {
		t.Fatal(err)
	}
	c := &rangeCounter{r: r, start: off, end: off + int64(f.CompressedSize64)}
	res, err := Process(context.Background(), c, size, Options{PackageID: "pkg-test", Workers: 4})
	if err != nil {
		t.Fatal(err)
	}
	for _, role := range []string{"activity", "servers_index", "messages_index"} {
		if res.Report.Inputs[role] != shared {
			t.Fatalf("inputs %v", res.Report.Inputs)
		}
	}
	if c.n.Load() != int64(f.CompressedSize64) {
		t.Errorf("%d bytes read of %d compressed", c.n.Load(), f.CompressedSize64)
	}
	if len(res.Model.Guilds) != len(members) {
		t.Errorf("%d guilds, want %d", len(res.Model.Guilds), len(members))
	}
}

func TestInsecurePaths(t *testing.T) {
	es := append(fullPackage(english), entry{"../outside.json", "{}"}, entry{"/absolute.json", "{}"})
	if got := processWith(t, es, Options{}).Report.Counts.InsecurePaths; got != 2 {
		t.Errorf("insecure paths = %d, want 2", got)
	}
}
