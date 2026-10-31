package processor

// Model is the content of the database the app reads, one slice per table.
// Field types follow what the reference binds, so that SQLite applies the same
// column affinity: for eg. the session dates are floats stored in TEXT columns,
// which SQLite renders as `'1617712440.0'`. A nil pointer is NULL.
type Model struct {
	DMChannels    []DMChannel
	GuildChannels []GuildChannel
	Activity      []Activity
	Guilds        []Guild
	Payments      []Payment
	VoiceSessions []VoiceSession
	Sessions      []Session
	Package       PackageData
}

// Activity is a row of `activity`: an event count for one day, or one
// hour for `message_sent` and `guild_joined`, Hour being 0 otherwise.
type Activity struct {
	EventName       string
	Day             string
	Hour            int64
	OccurrenceCount int64
	ChannelID       *string
	GuildID         *string
	UserID          *string
	ExtraField1     *string
	ExtraField2     *string
}

// DMChannel is a row of `dm_channels_data`.
type DMChannel struct {
	ChannelID                 string
	DMUserID                  *string
	UserName                  string
	DisplayName               *string
	UserAvatarURL             *string
	TotalMessageCount         int64
	TotalVoiceChannelDuration int64
	SentimentScore            float64
}

// GuildChannel is a row of `guild_channels_data`.
type GuildChannel struct {
	ChannelID                 string
	GuildID                   *string
	ChannelName               string
	TotalMessageCount         int64
	TotalVoiceChannelDuration int64
}

// Guild is a row of `guilds`.
type Guild struct {
	GuildID           string
	GuildName         *string
	TotalMessageCount int64
}

// Payment is a row of `payments`. Amount holds an int64, a float64 or a string,
// whichever JSON type the package used.
type Payment struct {
	PaymentID   *string
	PaymentDate string
	Amount      any
	Currency    *string
	Description *string
}

// VoiceSession is a row of `voice_sessions`; the dates are epoch seconds.
type VoiceSession struct {
	ChannelID    string
	GuildID      *string
	DurationMins int64
	StartedDate  float64
	EndedDate    float64
}

// Session is a row of `sessions`; the dates are epoch seconds.
type Session struct {
	DurationMins int64
	StartedDate  float64
	EndedDate    float64
	DeviceOS     *string
}

// PackageData is the single row of `package_data`.
type PackageData struct {
	PackageID        string
	PackageVersion   string
	OwnerID          string
	OwnerName        string
	OwnerDisplayName *string
	OwnerAvatarURL   *string
	IsPartial        bool
	// ActivityStream is the activity stream read, `analytics` or
	// `reporting`, nil when none was. `reporting` never carries some event
	// types, for eg. `message_edited`, so their counts are unknown, not 0.
	ActivityStream *string
}

func strPtr(s string) *string { return &s }
