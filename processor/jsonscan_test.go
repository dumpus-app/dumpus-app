package processor

import (
	"reflect"
	"testing"
)

func TestObjectMembers(t *testing.T) {
	doc := []byte(` { "a" : 1, "b\"}" : {"x": [1, "]}", {"y": null}]}, "a": "last", "\u0063": true, "e": [] } `)
	m, err := parseObject(doc)
	if err != nil {
		t.Fatal(err)
	}
	if want := []string{"a", `b"}`, "c", "e"}; !reflect.DeepEqual(m.keys, want) {
		t.Errorf("keys = %q, want %q", m.keys, want)
	}
	want := map[string]string{"a": `"last"`, `b"}`: `{"x": [1, "]}", {"y": null}]}`, "c": "true", "e": "[]"}
	for k, v := range want {
		if got, _ := m.get(k); string(got) != v {
			t.Errorf("member %q = %s, want %s", k, got, v)
		}
	}
	if _, err := parseObject([]byte(`[1]`)); problemOf(err) != ProblemWrongType {
		t.Errorf("array: %v", err)
	}
	if _, err := parseObject([]byte(`{"a": }`)); problemOf(err) != ProblemMalformed {
		t.Errorf("malformed: %v", err)
	}
}

func TestEachElement(t *testing.T) {
	var got []string
	err := eachElement([]byte(`[ {"Timestamp": "2021"}, "s\"]", 12.5e3 , null ]`), func(v []byte) bool {
		got = append(got, string(v))
		return true
	})
	if err != nil {
		t.Fatal(err)
	}
	want := []string{`{"Timestamp": "2021"}`, `"s\"]"`, `12.5e3`, `null`}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestDecodeValues(t *testing.T) {
	if s, ok := decodeString([]byte(`"\"2021-04-06T12:34:56.789Z\""`)); !ok || s != `"2021-04-06T12:34:56.789Z"` {
		t.Errorf("decodeString = %q, %v", s, ok)
	}
	if s, ok := decodeString([]byte(`"caf\u00e9 \ud83d\ude00"`)); !ok || s != "café 😀" {
		t.Errorf("decodeString = %q, %v", s, ok)
	}
	for in, want := range map[string]number{
		"999":                         {isInt: true, i: 999},
		"-1":                          {isInt: true, i: -1},
		"4.5":                         {f: 4.5},
		"1e2":                         {f: 100},
		"123456789012345678901234567": {f: 1.2345678901234568e26},
	} {
		if got, ok := decodeNumber([]byte(in)); !ok || got != want {
			t.Errorf("decodeNumber(%s) = %+v, %v", in, got, ok)
		}
	}
}

func TestSniffEventType(t *testing.T) {
	tests := []struct {
		line string
		want string
		s    sniff
	}{
		{`{"event_type":"session_start","os":"Windows"}`, "session_start", sniffValue},
		{`{"a": 1, "event_type" : "app_opened"}`, "app_opened", sniffValue},
		{`{"a": 1}`, "", sniffAbsent},
		// The words as a value, not a key.
		{`{"name": "event_type", "a": 1}`, "", sniffAbsent},
		{`{"note": "\"event_type"}`, "", sniffAbsent},
		{`{"event_type": null}`, "", sniffAmbiguous},
		{`{"event_type": "app_\u006fpened"}`, "", sniffAmbiguous},
		{`{"props": {"event_type": "x"}, "event_type": "session_end"}`, "", sniffAmbiguous},
	}
	for _, tt := range tests {
		got, s := sniffEventType([]byte(tt.line))
		if string(got) != tt.want || s != tt.s {
			t.Errorf("sniffEventType(%s) = %q, %d; want %q, %d", tt.line, got, s, tt.want, tt.s)
		}
	}
}

func TestScanEventKeysAreExact(t *testing.T) {
	var f eventFields
	line := []byte(`{"OS": "Linux", "Timestamp": "x", "event_type": "app_opened", "os": "Windows", "os": "Android"}`)
	if err := scanEvent(line, &f); err != nil {
		t.Fatal(err)
	}
	if f.has(fTimestamp) {
		t.Error("Timestamp matched timestamp")
	}
	if got := string(f.values[fOS]); got != `"Android"` {
		t.Errorf("os = %s, want the last duplicate", got)
	}
}

func TestMaskPath(t *testing.T) {
	if got := maskPath("Mensajes/c123456789012345678/messages.json"); got != "Mensajes/c*/messages.json" {
		t.Errorf("got %s", got)
	}
	if got := maskPath("Activity/analytics/events-2023-00000-of-00001.json"); got != "Activity/analytics/events-*-*-of-*.json" {
		t.Errorf("got %s", got)
	}
}
