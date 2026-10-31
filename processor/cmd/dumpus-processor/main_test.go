package main

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

type entry struct{ name, body string }

// writeZip writes a made-up package to dir, its entries in the given order.
func writeZip(t *testing.T, dir string, entries []entry) string {
	t.Helper()
	path := filepath.Join(dir, "package.zip")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	zw := zip.NewWriter(f)
	for _, e := range entries {
		w, err := zw.Create(e.name)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := w.Write([]byte(e.body)); err != nil {
			t.Fatal(err)
		}
	}
	if err := zw.Close(); err != nil {
		t.Fatal(err)
	}
	if err := f.Close(); err != nil {
		t.Fatal(err)
	}
	return path
}

func readReport(t *testing.T, path string) map[string]any {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var r map[string]any
	if err := json.Unmarshal(data, &r); err != nil {
		t.Fatal(err)
	}
	return r
}

var minimalPackage = []entry{
	{"Compte/user.json", `{"id": "100000000000000001", "username": "owner_user", "email": "x", "avatar_hash": null, "relationships": []}`},
	{"Serveurs/index.json", `{"300000000000000001": "Guild One"}`},
	{"Messages/index.json", `{}`},
	{"Activité/analytics/e", ""},
}

func TestRun(t *testing.T) {
	dir := t.TempDir()
	input := writeZip(t, dir, minimalPackage)
	output := filepath.Join(dir, "out.sqlite")
	report := filepath.Join(dir, "report.json")
	var stderr bytes.Buffer
	code := run(context.Background(), []string{"--input", input, "--output", output, "--package-id", "pkg-test", "--report", report}, &stderr)
	if code != exitOK {
		t.Fatalf("exit %d: %s", code, stderr.String())
	}
	if _, err := os.Stat(output); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(output + ".tmp"); !os.IsNotExist(err) {
		t.Errorf("temporary file left: %v", err)
	}
	r := readReport(t, report)
	if _, ok := r["error"]; ok {
		t.Errorf("report has an error: %v", r)
	}
	missing, _ := json.Marshal(r["missing_files"])
	if !strings.Contains(string(missing), `"activity"`) {
		t.Errorf("missing files = %s", missing)
	}
}

func TestRunMissingUserData(t *testing.T) {
	dir := t.TempDir()
	input := writeZip(t, dir, []entry{
		{"Mensajes/index.json", `{}`},
		{"Mensajes/c400000000000000001/channel.json", `{"id": "400000000000000001"}`},
		{"Mensajes/c400000000000000001/messages.json", `[]`},
	})
	output := filepath.Join(dir, "out.sqlite")
	report := filepath.Join(dir, "report.json")
	var stderr bytes.Buffer
	code := run(context.Background(), []string{"--input", input, "--output", output, "--package-id", "pkg-test", "--report", report}, &stderr)
	if code != exitMissingUserData {
		t.Fatalf("exit %d, want %d", code, exitMissingUserData)
	}
	if got := strings.TrimSpace(stderr.String()); got != `{"error":"MISSING_USER_DATA"}` {
		t.Errorf("stderr = %q", got)
	}
	if _, err := os.Stat(output); !os.IsNotExist(err) {
		t.Errorf("output written: %v", err)
	}
	if r := readReport(t, report); r["error"] != "MISSING_USER_DATA" {
		t.Errorf("report error = %v", r["error"])
	}
}

func TestRunReportFailure(t *testing.T) {
	dir := t.TempDir()
	input := writeZip(t, dir, minimalPackage)
	output := filepath.Join(dir, "out.sqlite")
	var stderr bytes.Buffer
	code := run(context.Background(), []string{"--input", input, "--output", output, "--package-id", "pkg-test",
		"--report", filepath.Join(dir, "missing", "report.json")}, &stderr)
	if code != 4 {
		t.Fatalf("exit %d, want 4: %s", code, stderr.String())
	}
	if _, err := os.Stat(output); err != nil {
		t.Errorf("database not in place: %v", err)
	}
	lines := strings.Split(strings.TrimSpace(stderr.String()), "\n")
	var fail struct{ Error string }
	if err := json.Unmarshal([]byte(lines[len(lines)-1]), &fail); err != nil || fail.Error != "REPORT_FAILED" {
		t.Errorf("stderr = %q", stderr.String())
	}
}

func TestRunErrors(t *testing.T) {
	dir := t.TempDir()
	var stderr bytes.Buffer
	// Go exits 2 on a panic, so a usage error has its own code.
	if code := run(context.Background(), []string{"--input", "x.zip"}, &stderr); code != 64 {
		t.Errorf("missing flags: exit %d", code)
	}
	if code := run(context.Background(), []string{"-h"}, &stderr); code != 0 {
		t.Errorf("-h: exit %d", code)
	}
	notZip := filepath.Join(dir, "not.zip")
	if err := os.WriteFile(notZip, []byte("not a zip"), 0o600); err != nil {
		t.Fatal(err)
	}
	stderr.Reset()
	code := run(context.Background(), []string{"--input", notZip, "--output", filepath.Join(dir, "o.sqlite"), "--package-id", "p"}, &stderr)
	if code != exitFailed {
		t.Errorf("not a zip: exit %d", code)
	}
	lines := strings.Split(strings.TrimSpace(stderr.String()), "\n")
	var fail struct{ Error string }
	if err := json.Unmarshal([]byte(lines[len(lines)-1]), &fail); err != nil || fail.Error != "UNKNOWN_ERROR" {
		t.Errorf("stderr = %q", stderr.String())
	}
}
