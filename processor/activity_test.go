package processor

import (
	"context"
	"fmt"
	"math/rand/v2"
	"reflect"
	"slices"
	"strings"
	"testing"
	"time"
)

// randomStream returns activity lines mixing session, voice and filler events,
// with ties on the minute, and the session events it holds in file order.
func randomStream(rng *rand.Rand, n int) (string, []sessionEvent) {
	base := time.Date(2021, 4, 6, 0, 0, 0, 0, time.UTC)
	stamp := func() (string, int64) {
		t := base.Add(time.Duration(rng.IntN(48*60)) * time.Minute).Add(time.Duration(rng.IntN(60000)) * time.Millisecond)
		return ts(t.Format("2006-01-02T15:04:05.000Z")), t.Truncate(time.Minute).Unix()
	}
	oses := []string{"Windows", "Android", "iOS"}
	var ls []string
	var sessions []sessionEvent
	for i := range n {
		switch rng.IntN(6) {
		case 0, 1:
			v, sec := stamp()
			kind, start := "session_end", false
			if rng.IntN(3) < 2 {
				kind, start = "session_start", true
			}
			os := oses[rng.IntN(len(oses))]
			ls = append(ls, event(kind, "timestamp", v, "os", `"`+os+`"`))
			sessions = append(sessions, sessionEvent{ts: sec, order: uint64(i), start: start, os: nameID(os)})
		case 2:
			v, _ := stamp()
			kind := "join_voice_channel"
			if rng.IntN(2) == 0 {
				kind = "leave_voice_channel"
			}
			ls = append(ls, event(kind, "timestamp", v, "client_track_timestamp", `"null"`,
				"channel_id", fmt.Sprintf(`"70000000000000000%d"`, rng.IntN(3))))
		case 3:
			// A line much longer than the test chunks.
			ls = append(ls, event("unused_event", "payload", `"`+strings.Repeat("x", rng.IntN(5000))+`"`))
		default:
			ls = append(ls, event("unused_event", "n", fmt.Sprint(i)))
		}
	}
	return strings.Join(ls, "\n"), sessions
}

// TestPageNameWhileInterning reads `dev_portal_page_viewed` lines on many
// workers while others intern the strings they store, which the race detector
// checks; the page's prefix still sets its gate.
func TestPageNameWhileInterning(t *testing.T) {
	var ls []string
	for i := range 5000 {
		ls = append(ls,
			event("app_opened", "timestamp", ts("2021-04-06T10:00:00.000Z"), "os", fmt.Sprintf(`"os-%d"`, i)),
			event("dev_portal_page_viewed", "timestamp", ts("2021-04-06T10:00:00.000Z"), "page_name", fmt.Sprintf(`"/docs/p%d"`, i)))
	}
	ls = append(ls, event("notification_clicked", "timestamp", ts("2021-04-06T10:00:00.000Z")))
	pkg := append(without(fullPackage(english), "Activity/"), entry{"Activity/analytics/events-2021-00000-of-00001.json", lines(ls...)})
	r, size := zipOf(t, pkg)
	res, err := Process(context.Background(), r, size, Options{PackageID: "p", Workers: 8, chunkBytes: 4096})
	if err != nil {
		t.Fatal(err)
	}
	if !slices.ContainsFunc(res.Model.Activity, func(a Activity) bool { return a.EventName == "notification_clicked" }) {
		t.Error("the docs pages didn't set their gate")
	}
}

// TestChunksKeepFileOrder cuts the stream into chunks far smaller than its
// lines and spreads them over workers: the sessions and voice sessions must
// come out as with a single chunk and a single worker.
func TestChunksKeepFileOrder(t *testing.T) {
	rng := rand.New(rand.NewPCG(20261030, 3))
	for i := range 20 {
		stream, events := randomStream(rng, 2000)
		pkg := append(without(fullPackage(english), "Activity/"),
			entry{"Activity/analytics/events-2021-00000-of-00001.json", stream})
		r, size := zipOf(t, pkg)

		one, err := Process(context.Background(), r, size, Options{PackageID: "p", Workers: 1})
		if err != nil {
			t.Fatal(err)
		}
		many, err := Process(context.Background(), r, size, Options{PackageID: "p", Workers: 5, chunkBytes: 512 + rng.IntN(2048)})
		if err != nil {
			t.Fatal(err)
		}
		if !reflect.DeepEqual(one.Model, many.Model) {
			t.Fatalf("stream %d: chunked result differs", i)
		}
		if want := buildSessions(slices.Clone(events), testNames); !reflect.DeepEqual(many.Model.Sessions, want) {
			t.Fatalf("stream %d: sessions differ from the events in file order", i)
		}
		if many.Report.Counts.ActivityLines != 2000 {
			t.Fatalf("stream %d: %d lines", i, many.Report.Counts.ActivityLines)
		}
	}
}
