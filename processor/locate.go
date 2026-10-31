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
	// most complete one, else `reporting`.
	activityStreams = []struct {
		name string // stored in `package_data.activity_stream`
		re   *regexp.Regexp
	}{
		{"analytics", regexp.MustCompile(`/analytics.*\.json$`)},
		{"reporting", regexp.MustCompile(`/reporting.*\.json$`)},
	}
)

// layout is what the processor reads, found from the entry names. An index
// or payments path is empty when there is no candidate.
type layout struct {
	user, activity                        string
	stream                                string // the activity entry's stream, see activityStreams
	serversIndex, messagesIndex, payments string
	channels                              []string // channel.json entries
	duplicates                            []string // channel.json entries left out, see channelFolders
}

func (e *entries) layout() layout {
	messagesRoot := e.messagesRoot()
	l := layout{
		user:          e.userEntry(),
		serversIndex:  e.indexPath(e.serversRoot(messagesRoot), "Servers/index.json", "servers/index.json"),
		messagesIndex: e.indexPath(messagesRoot, "Messages/index.json", "messages/index.json"),
	}
	l.activity, l.stream = e.activityStream()
	if l.user != "" {
		l.payments = l.user[:strings.LastIndexByte(l.user, '/')] + "/user_data_exports/discord_billing/payments.json"
	}
	l.channels, l.duplicates = e.channelFolders(messagesRoot, l.user, l.activity, l.serversIndex, l.messagesIndex, l.payments)
	return l
}

// readOrder is every entry the processor may read, in the order the inflate
// budget is handed out.
func (e *entries) readOrder(l layout) []*zip.File {
	var out []*zip.File
	add := func(name string) {
		if f := e.get(name); name != "" && f != nil {
			out = append(out, f)
		}
	}
	add(l.user)
	add(l.activity)
	add(l.serversIndex)
	add(l.messagesIndex)
	add(l.payments)
	for _, c := range l.channels {
		add(c)
		if _, messages, ok := messagesEntryFor(c); ok {
			add(messages)
		}
	}
	return out
}

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

func (e *entries) activityStream() (path, stream string) {
	for _, s := range activityStreams {
		if path = e.first(s.re.MatchString); path != "" {
			return path, s.name
		}
	}
	return "", ""
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

// channelFolders keeps, in zip order, the channel.json entries whose folder
// reads no entry that another folder or role already reads: a name can repeat,
// and the folders under `Messages/c<id>/` read the messages of `<id>` there,
// for eg. `Messages/c<id>/x/channel.json` reads `Messages/c<id>/<id>/messages.json`.
// Each entry is charged once to the inflate budget, so it is read once.
func (e *entries) channelFolders(messagesRoot string, roles ...string) (folders, duplicates []string) {
	read := map[*zip.File]bool{}
	for _, name := range roles {
		if f := e.get(name); f != nil {
			read[f] = true
		}
	}
	for _, name := range e.channelFiles(messagesRoot) {
		f := e.get(name)
		var messages *zip.File
		if _, path, ok := messagesEntryFor(name); ok {
			messages = e.get(path)
		}
		if read[f] || messages != nil && read[messages] {
			duplicates = append(duplicates, name)
			continue
		}
		read[f] = true
		if messages != nil {
			read[messages] = true
		}
		folders = append(folders, name)
	}
	return folders, duplicates
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
