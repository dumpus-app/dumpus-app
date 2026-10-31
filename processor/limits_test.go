package processor

import (
	"context"
	"slices"
	"strings"
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
