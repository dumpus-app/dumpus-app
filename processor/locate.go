package processor

import (
	"archive/zip"
	"regexp"
	"strings"
)

// Exports name their top folders in the account's language (for eg. `Cuenta/`,
// `Mensajes/`, `Servidores/`), so entries are found by the shape of their path,
// with the same patterns and the same first-match-in-directory-order rule as the
// reference.
var (
	userEntryRe    = regexp.MustCompile(`^[^/]+/user\.json$`)
	channelEntryRe = regexp.MustCompile(`/c?[0-9]{16,32}/channel\.json$`)
	guildEntryRe   = regexp.MustCompile(`/[0-9]{16,32}/guild\.json$`)
	channelIDRe    = regexp.MustCompile(`/c?([0-9]{16,32})/`)
	// Only the first shard of the first stream found is read: `analytics`, the
	// most complete one, else `reporting`, which carries the same events.
	activityStreamRes = []*regexp.Regexp{
		regexp.MustCompile(`/analytics.*\.json$`),
		regexp.MustCompile(`/reporting.*\.json$`),
	}
)

type entries struct {
	files  []*zip.File
	byName map[string]*zip.File
}

func indexEntries(zr *zip.Reader) *entries {
	e := &entries{files: zr.File, byName: make(map[string]*zip.File, len(zr.File))}
	for _, f := range zr.File {
		// The last entry wins for a duplicated name, as with Python's zipfile.
		e.byName[f.Name] = f
	}
	return e
}

func (e *entries) get(name string) *zip.File { return e.byName[name] }

func (e *entries) first(match func(name string) bool) string {
	for _, f := range e.files {
		if match(f.Name) {
			return f.Name
		}
	}
	return ""
}

func parentOfParent(name string) string {
	segs := strings.Split(name, "/")
	return strings.Join(segs[:len(segs)-2], "/")
}

func (e *entries) userEntry() string {
	return e.first(userEntryRe.MatchString)
}

func (e *entries) messagesRoot() string {
	sample := e.first(channelEntryRe.MatchString)
	if sample == "" {
		return ""
	}
	return parentOfParent(sample)
}

// serversRoot returns the folder holding the per-guild folders, else the folder
// of the first `index.json` that isn't the messages index.
func (e *entries) serversRoot(messagesRoot string) string {
	if sample := e.first(guildEntryRe.MatchString); sample != "" {
		return parentOfParent(sample)
	}
	index := e.first(func(name string) bool {
		return strings.HasSuffix(name, "/index.json") &&
			!strings.HasPrefix(name, "Messages/") && !strings.HasPrefix(name, "messages/") &&
			(messagesRoot == "" || !strings.HasPrefix(name, messagesRoot+"/"))
	})
	if index == "" {
		return ""
	}
	return index[:strings.LastIndexByte(index, '/')]
}

// indexPath resolves an index file under the found root, else at one of the
// English names when present. A root found without its index yields a path that
// isn't in the zip.
func (e *entries) indexPath(root string, fallbacks ...string) string {
	if root != "" {
		return root + "/index.json"
	}
	for _, name := range fallbacks {
		if e.get(name) != nil {
			return name
		}
	}
	return ""
}

func (e *entries) activityStream() string {
	for _, re := range activityStreamRes {
		if name := e.first(re.MatchString); name != "" {
			return name
		}
	}
	return ""
}

func (e *entries) channelFiles(messagesRoot string) []string {
	var out []string
	for _, f := range e.files {
		name := f.Name
		if !strings.HasSuffix(name, "channel.json") {
			continue
		}
		if messagesRoot != "" {
			if strings.HasPrefix(name, messagesRoot+"/") {
				out = append(out, name)
			}
		} else if strings.HasPrefix(name, "Messages/") || strings.HasPrefix(name, "messages/") {
			out = append(out, name)
		}
	}
	return out
}

func messagesEntryFor(channelPath string) (channelID, messagesPath string, ok bool) {
	m := channelIDRe.FindStringSubmatch(channelPath)
	if m == nil {
		return "", "", false
	}
	channelID = m[1]
	segs := strings.Split(channelPath, "/")
	prefix := ""
	if strings.HasPrefix(segs[len(segs)-2], "c") {
		prefix = "c"
	}
	return channelID, parentOfParent(channelPath) + "/" + prefix + channelID + "/messages.json", true
}
