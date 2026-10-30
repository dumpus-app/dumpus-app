// Command dumpus-processor turns a Discord data package into the SQLite
// database the Dumpus app reads.
//
//	dumpus-processor --input package.zip --output package.sqlite --package-id ID [--report report.json]
//
// Exit codes:
//   - 0: the database was written, and the report when asked for.
//   - 1: the package can't be processed; stderr ends with
//     `{"error":"UNKNOWN_ERROR","message":"..."}`.
//   - 3: the package has no `user.json`; stderr ends with
//     `{"error":"MISSING_USER_DATA"}`.
//   - 4: the database was written but the report couldn't be; stderr ends with
//     `{"error":"REPORT_FAILED","message":"..."}`.
//   - 64: usage error. Go itself exits 2 on a panic or when out of memory.
//
// `UNKNOWN_ERROR` and `MISSING_USER_DATA` are the Python worker's codes.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/signal"
	"syscall"

	"github.com/dumpus-app/dumpus-app/processor"
	"github.com/dumpus-app/dumpus-app/processor/sqlitedb"
)

const (
	exitOK              = 0
	exitFailed          = 1
	exitMissingUserData = 3
	exitReportFailed    = 4
	exitUsage           = 64
)

const codeReportFailed = "REPORT_FAILED"

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	code := run(ctx, os.Args[1:], os.Stderr)
	stop()
	os.Exit(code)
}

func run(ctx context.Context, args []string, stderr io.Writer) int {
	fs := flag.NewFlagSet("dumpus-processor", flag.ContinueOnError)
	fs.SetOutput(stderr)
	input := fs.String("input", "", "the package `zip`")
	output := fs.String("output", "", "the SQLite `file` to write")
	packageID := fs.String("package-id", "", "the package `id` stored in package_data")
	reportPath := fs.String("report", "", "write a JSON report of missing files and fields to `file`")
	workers := fs.Int("workers", 0, "goroutines decoding the package (default GOMAXPROCS)")
	if err := fs.Parse(args); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return exitOK
		}
		return exitUsage
	}
	if *input == "" || *output == "" || *packageID == "" || fs.NArg() > 0 {
		fmt.Fprintln(stderr, "dumpus-processor: --input, --output and --package-id are required")
		fs.Usage()
		return exitUsage
	}

	rep, err := process(ctx, *input, *output, *packageID, *workers)
	code := exitOK
	fail := failure{}
	switch {
	case errors.Is(err, processor.ErrMissingUserData):
		code, fail = exitMissingUserData, failure{Error: processor.CodeMissingUserData}
	case err != nil:
		code, fail = exitFailed, failure{Error: processor.CodeUnknownError, Message: err.Error()}
	}
	if rep != nil && *reportPath != "" {
		if werr := writeReport(*reportPath, rep); werr != nil {
			if code != exitOK {
				fmt.Fprintf(stderr, "dumpus-processor: report: %v\n", werr)
			} else {
				code, fail = exitReportFailed, failure{Error: codeReportFailed, Message: werr.Error()}
			}
		}
	}
	if code != exitOK {
		line, _ := json.Marshal(fail)
		fmt.Fprintln(stderr, string(line))
	}
	return code
}

// failure is the last line of stderr when the run fails.
type failure struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// report is what --report writes: the processor's report and the rows the
// database refused.
type report struct {
	*processor.Report
	DroppedRows map[string]int `json:"dropped_rows,omitempty"`
}

func process(ctx context.Context, input, output, packageID string, workers int) (*report, error) {
	f, err := os.Open(input)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	st, err := f.Stat()
	if err != nil {
		return nil, err
	}
	res, err := processor.Process(ctx, f, st.Size(), processor.Options{PackageID: packageID, Workers: workers})
	rep := &report{Report: res.Report}
	if err != nil {
		return rep, err
	}

	tmp := output + ".tmp"
	written, err := sqlitedb.Write(ctx, tmp, res.Model)
	if err == nil {
		err = os.Rename(tmp, output)
	}
	if err != nil {
		os.Remove(tmp)
		os.Remove(tmp + "-journal")
		rep.Error = processor.CodeUnknownError
		return rep, err
	}
	if len(written.DroppedRows) > 0 {
		rep.DroppedRows = written.DroppedRows
	}
	return rep, nil
}

func writeReport(path string, r *report) error {
	data, err := json.MarshalIndent(r, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, append(data, '\n'), 0o600)
}
