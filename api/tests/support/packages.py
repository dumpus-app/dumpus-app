"""A synthetic Discord data package, laid out like a real export.

Every id, name and address is made up. `build(name)` zips the files of a
package of `CATALOG`.
"""
import io
import json
import zipfile

OWNER = '100000000000000001'
FRIEND_ALPHA = '200000000000000001'
STRANGER_BETA = '200000000000000002'
FRIEND_GAMMA = '200000000000000003'

GUILD_ONE = '300000000000000001'
GUILD_TWO = '300000000000000002'
GUILD_EMPTY = '300000000000000003'

DM_ALPHA = '400000000000000001'
DM_BETA = '400000000000000002'
GROUP_DM = '400000000000000003'
ONE_GENERAL = '500000000000000001'
ONE_MEMES = '500000000000000002'
TWO_GENERAL = '500000000000000003'
NOT_IN_INDEX = '500000000000000004'
NULL_IN_INDEX = '500000000000000005'
NO_MESSAGES = '500000000000000006'

VOICE_ONE = '510000000000000001'
VOICE_TWO = '510000000000000002'
VOICE_DM_CALL = '510000000000000003'
VOICE_LONG = '510000000000000004'
VOICE_TWICE = '510000000000000005'

APP_ONE = '900000000000000001'
APP_TWO = '900000000000000002'

FIXED_ZIP_TIME = (2024, 1, 1, 0, 0, 0)


def to_zip(files):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as archive:
        for path, content in files.items():
            info = zipfile.ZipInfo(path, date_time=FIXED_ZIP_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, content)
    return buffer.getvalue()


def _json(value):
    return json.dumps(value, ensure_ascii=False, indent=2).encode()


def _ndjson(events):
    return ''.join(json.dumps(event, ensure_ascii=False) + '\n' for event in events).encode()


def _quoted(at):
    # Analytics files store timestamps as JSON strings wrapping a quoted date.
    return f'"{at}"'


def event(event_type, at, **fields):
    return {'event_type': event_type, 'timestamp': _quoted(at), **fields}


def session(kind, at, os=None):
    fields = {} if os is None else {'os': os}
    return event(f'session_{kind}', at, **fields)


def voice(kind, at, channel, guild=None, client_at='same'):
    fields = {'channel_id': channel}
    if guild:
        fields['guild_id'] = guild
    fields['client_track_timestamp'] = 'null' if client_at is None else _quoted(at if client_at == 'same' else client_at)
    return event(f'{kind}_voice_channel', at, **fields)


def owner():
    def friend(user_id, username, avatar, discriminator, global_name):
        user = {'id': user_id, 'username': username, 'avatar': avatar, 'avatar_decoration_data': None, 'public_flags': 0,
                'discriminator': discriminator, 'global_name': global_name}
        return {'id': user_id, 'type': 1, 'nickname': None, 'user': user}

    return {
        'id': OWNER,
        'username': 'synthetic_owner',
        'global_name': 'Synthetic Owner',
        'avatar_hash': 'f00dfacef00dfacef00dfacef00dface',
        'email': 'owner@example.invalid',
        'verified': True,
        'has_mobile': False,
        'premium_until': None,
        'flags': 0,
        'phone': None,
        'ip': '192.0.2.1',
        'relationships': [
            friend(FRIEND_ALPHA, 'friend_alpha', 'a_0123456789abcdef', '0', 'Friend Alpha'),
            friend(FRIEND_GAMMA, 'friend_gamma', None, '4242', None),
        ],
        'discriminator': '0',
    }


PAYMENTS = {'records': [
    {'id': '600000000000000001', 'amount': 999, 'currency': 'usd', 'status': 1,
     'created_at': '2024-02-01T10:00:00.123456+00:00', 'description': 'Nitro Monthly'},
    {'id': '600000000000000002', 'amount': 999, 'currency': 'usd', 'status': 2,
     'created_at': '2024-03-01T10:00:00+00:00', 'description': 'Nitro Monthly (failed)'},
    {'id': '600000000000000003', 'amount': 499, 'currency': 'eur', 'status': 3,
     'created_at': '2024-04-01T23:30:00+00:00', 'description': 'Server Boost (refunded)'},
    {'id': '600000000000000004', 'amount': 29720, 'currency': 'discord_orb', 'status': 1,
     'created_at': '2024-05-01T10:00:00+00:00', 'description': 'Orb shop item'},
    {'id': '600000000000000005', 'amount': 499, 'currency': 'eur', 'status': 1,
     'created_at': '2024-06-15T23:59:00+00:00', 'description': 'Nitro Basic'},
    {'id': '600000000000000006', 'amount': 100, 'currency': 'usd',
     'created_at': '2024-07-01T00:00:00+00:00', 'description': 'No status'},
]}

SESSIONS = [
    # Out of order on purpose: the worker sorts by timestamp.
    session('end', '2024-03-01T09:30:00.000Z', 'windows'),
    session('start', '2024-03-01T08:00:00.000Z', 'windows'),
    session('start', '2024-03-01T08:15:00.000Z', 'android'),
    session('end', '2024-03-01T08:45:00.000Z', 'android'),
    session('start', '2024-03-02T20:00:00.000Z', 'linux'),
    session('end', '2024-03-02T22:10:00.000Z', 'linux'),
    # Longer than a day: dropped.
    session('start', '2024-03-03T10:00:00.000Z', 'ios'),
    session('end', '2024-03-04T11:00:00.000Z', 'ios'),
    # An end without a start.
    session('end', '2024-03-05T12:00:00.000Z', 'macos'),
    # Two starts, one end.
    session('start', '2024-03-06T09:00:00.000Z', 'windows'),
    session('start', '2024-03-06T09:05:00.000Z', 'windows'),
    session('end', '2024-03-06T10:00:00.000Z', 'windows'),
    # Zero length, then a start at the same time listed after its end.
    session('start', '2024-03-07T07:00:00.000Z', 'android'),
    session('end', '2024-03-07T07:00:00.000Z', 'android'),
    session('start', '2024-03-07T07:00:00.000Z', 'linux'),
    session('end', '2024-03-07T08:00:00.000Z', 'linux'),
    # Overlapping, not nested.
    session('start', '2024-03-08T10:00:00.000Z', 'windows'),
    session('start', '2024-03-08T10:30:00.000Z', 'macos'),
    session('end', '2024-03-08T11:00:00.000Z', 'windows'),
    session('end', '2024-03-08T11:30:00.000Z', 'macos'),
    # No os: ignored.
    session('start', '2024-03-09T10:00:00.000Z'),
    session('end', '2024-03-09T11:00:00.000Z'),
    # Never ends.
    session('start', '2024-03-31T23:00:00.000Z', 'ios'),
]

VOICE = [
    voice('join', '2024-03-01T18:00:00.000Z', VOICE_ONE, GUILD_ONE, client_at='2024-03-01T17:59:58.000Z'),
    voice('leave', '2024-03-01T18:45:00.000Z', VOICE_ONE, GUILD_ONE),
    # Rejoins inside the session above, in the same and in another channel.
    voice('join', '2024-03-01T18:10:00.000Z', VOICE_ONE, GUILD_ONE),
    voice('join', '2024-03-01T18:20:00.000Z', VOICE_TWO, GUILD_ONE),
    voice('leave', '2024-03-01T18:50:00.000Z', VOICE_TWO, GUILD_ONE),
    # A DM call: no guild, no client timestamp.
    voice('join', '2024-03-02T21:00:00.000Z', VOICE_DM_CALL, client_at=None),
    voice('leave', '2024-03-02T21:20:00.000Z', VOICE_DM_CALL, client_at=None),
    # A join never left.
    voice('join', '2024-03-03T10:00:00.000Z', VOICE_ONE, GUILD_ONE),
    # Longer than a day: dropped.
    voice('join', '2024-03-04T10:00:00.000Z', VOICE_LONG, GUILD_TWO),
    voice('leave', '2024-03-05T11:00:00.000Z', VOICE_LONG, GUILD_TWO),
    voice('join', '2024-03-06T10:00:00.000Z', VOICE_TWICE, GUILD_TWO),
    voice('leave', '2024-03-06T10:30:00.000Z', VOICE_TWICE, GUILD_TWO),
    voice('join', '2024-03-06T10:40:00.000Z', VOICE_TWICE, GUILD_TWO),
    voice('leave', '2024-03-06T11:00:00.000Z', VOICE_TWICE, GUILD_TWO),
    # A leave without a join, and voice events without a channel: ignored.
    voice('leave', '2024-03-07T10:00:00.000Z', VOICE_TWO, GUILD_ONE),
    event('join_voice_channel', '2024-03-07T11:00:00.000Z', guild_id=GUILD_ONE),
]

COUNTED = [
    event('guild_joined', '2024-03-01T12:00:00.000Z', guild_id=GUILD_ONE),
    event('guild_joined', '2024-03-01T12:30:00.000Z', guild_id=GUILD_ONE),
    event('guild_joined', '2024-03-02T09:00:00.000Z', guild_id=GUILD_TWO),
    event('oauth2_authorize_accepted', '2024-03-10T11:00:00.000Z'),
    event('oauth2_authorize_accepted', '2024-03-11T11:00:00.000Z'),
    event('notification_clicked', '2024-03-12T08:00:00.000Z'),
    event('voice_message_recorded', '2024-03-13T10:00:00.000Z'),
    event('email_opened', '2024-03-14T07:00:00.000Z'),
    event('email_opened', '2024-03-14T19:00:00.000Z'),
    event('login_successful', '2024-03-15T06:00:00.000Z'),
    event('user_avatar_updated', '2024-03-15T07:00:00.000Z'),
    event('app_crashed', '2024-03-16T01:00:00.000Z'),
    event('app_native_crash', '2024-03-16T02:00:00.000Z'),
    event('remote_auth_login', '2024-03-17T03:00:00.000Z'),
    event('captcha_served', '2024-03-17T04:00:00.000Z'),
    event('message_reported', '2024-03-18T05:00:00.000Z'),
    event('message_edited', '2024-03-18T06:00:00.000Z'),
    event('message_edited', '2024-03-19T06:00:00.000Z'),
    event('premium_upsell_viewed', '2024-03-20T12:00:00.000Z'),
    event('application_command_used', '2024-03-21T10:00:00.000Z', application_id=APP_ONE, guild_id=GUILD_ONE),
    event('application_command_used', '2024-03-21T15:00:00.000Z', application_id=APP_ONE, guild_id=GUILD_ONE),
    event('application_command_used', '2024-03-22T10:00:00.000Z', application_id=APP_ONE, guild_id=GUILD_TWO),
    event('application_command_used', '2024-03-22T11:00:00.000Z', application_id='-1', guild_id=GUILD_ONE),
    event('application_command_used', '2024-03-22T12:00:00.000Z', application_id=APP_TWO),
    event('add_reaction', '2024-03-23T10:00:00.000Z', user_id=OWNER, channel_id=ONE_GENERAL, emoji_name='👍'),
    event('add_reaction', '2024-03-23T11:00:00.000Z', user_id=OWNER, channel_id=ONE_GENERAL, emoji_name='👍'),
    event('add_reaction', '2024-03-23T12:00:00.000Z', user_id=OWNER, channel_id=ONE_GENERAL,
          emoji_name='synthetic_emote', emoji_id='910000000000000001'),
    event('app_opened', '2024-03-24T08:00:00.000Z', os='Windows'),
    event('app_opened', '2024-03-24T09:00:00.000Z', os='Android'),
    event('app_opened', '2024-03-25T08:00:00.000Z', os='Windows'),
    event('app_opened', '2024-03-25T09:00:00.000Z'),
    event('some_future_event', '2024-03-26T09:00:00.000Z'),
    {'event_id': 'no-event-type', 'timestamp': _quoted('2024-03-26T10:00:00.000Z')},
]

ANALYTICS = SESSIONS + VOICE + COUNTED

# The stream exports ship next to `analytics`, carrying a subset of its events.
REPORTING = [e for e in ANALYTICS if e.get('event_type', '').startswith(('session_', 'join_', 'leave_', 'app_opened', 'add_reaction', 'guild_joined'))]
TNS = [e for e in ANALYTICS if e.get('event_type') == 'app_opened']


def _messages(*stamps, contents='synthetic message'):
    return [
        {'ID': f'7{index:017d}', 'Timestamp': stamp, 'Contents': '' if index % 3 == 2 else f'{contents} {index}', 'Attachments': ''}
        for index, stamp in enumerate(stamps)
    ]


def _dm(channel_id, other):
    return {'id': channel_id, 'type': 'DM', 'recipients': [OWNER, other]}


def _guild_channel(channel_id, name, guild_id, guild_name):
    return {'id': channel_id, 'type': 'GUILD_TEXT', 'name': name, 'guild': {'id': guild_id, 'name': guild_name}}


CHANNELS = [
    # (id, name in index.json, channel.json, messages.json or None)
    (DM_ALPHA, 'Direct Message with friend_alpha#0000', _dm(DM_ALPHA, FRIEND_ALPHA), _messages(
        '2024-01-15 10:01:00', '2024-01-15 10:30:59', '2024-01-15 11:00:00', '2024-01-16 23:59:59', '2024-02-01 00:00:00')),
    (DM_BETA, 'Direct Message with stranger_beta#0000', _dm(DM_BETA, STRANGER_BETA), _messages(
        '2024-01-20 08:00:00', '2024-01-20 08:10:00')),
    (GROUP_DM, 'Synthetic Group', {'id': GROUP_DM, 'type': 'GROUP_DM', 'name': 'Synthetic Group',
                                   'recipients': [OWNER, FRIEND_ALPHA, STRANGER_BETA]},
     _messages('2024-01-21 08:00:00')),
    (ONE_GENERAL, 'general in Synthetic Guild One', _guild_channel(ONE_GENERAL, 'general', GUILD_ONE, 'Synthetic Guild One'),
     _messages('2024-01-10 12:00:00', '2024-01-10 12:05:00', '2024-01-10 12:59:59', '2024-01-11 00:00:00')),
    (ONE_MEMES, 'memes in Synthetic Guild One', _guild_channel(ONE_MEMES, 'memes', GUILD_ONE, 'Synthetic Guild One'),
     _messages('2024-01-12 18:00:00')),
    (TWO_GENERAL, 'general in Synthetic Guild Two', _guild_channel(TWO_GENERAL, 'general', GUILD_TWO, 'Synthetic Guild Two'),
     _messages('2024-02-29 23:00:00', '2024-03-01 01:00:00')),
    (NOT_IN_INDEX, None, _guild_channel(NOT_IN_INDEX, 'hidden', GUILD_TWO, 'Synthetic Guild Two'),
     _messages('2024-02-02 02:00:00')),
    (NULL_IN_INDEX, 'null', _guild_channel(NULL_IN_INDEX, 'nulled', GUILD_TWO, 'Synthetic Guild Two'),
     _messages('2024-02-03 03:00:00')),
    (NO_MESSAGES, 'empty in Synthetic Guild Two', _guild_channel(NO_MESSAGES, 'empty', GUILD_TWO, 'Synthetic Guild Two'), None),
]

GUILDS = {GUILD_ONE: 'Synthetic Guild One', GUILD_TWO: 'Synthetic Guild Two', GUILD_EMPTY: 'Synthetic Guild Empty'}


def messages_files(root):
    index = {}
    files = {}
    for channel_id, name, channel, messages in CHANNELS:
        if name == 'null':
            index[channel_id] = None
        elif name is not None:
            index[channel_id] = name
    files[f'{root}/index.json'] = _json(index)
    for channel_id, _, channel, messages in CHANNELS:
        files[f'{root}/c{channel_id}/channel.json'] = _json(channel)
        if messages is not None:
            files[f'{root}/c{channel_id}/messages.json'] = _json(messages)
    return files


def servers_files(root):
    files = {f'{root}/index.json': _json(GUILDS)}
    for guild_id, name in GUILDS.items():
        files[f'{root}/{guild_id}/guild.json'] = _json({'id': guild_id, 'name': name})
    return files


def current_export():
    """The layout Discord ships today."""
    files = {
        'Account/user.json': _json(owner()),
        'Account/user_data_exports/discord_billing/payments.json': _json(PAYMENTS),
    }
    for stream, events in {'analytics': ANALYTICS, 'reporting': REPORTING, 'tns': TNS}.items():
        files[f'Activity/{stream}/events-2024-00000-of-00001.json'] = _ndjson(events)
    files.update(messages_files('Messages'))
    files.update(servers_files('Servers'))
    return files


CATALOG = {
    # Current layout, every section present, owner with `discriminator`.
    'full': current_export,
}


def build(name):
    return to_zip(CATALOG[name]())
