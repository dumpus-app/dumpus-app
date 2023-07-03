from dotenv import load_dotenv
load_dotenv()

from celery import Celery, current_task

import subprocess
import traceback

import pandas as pd
import re
import time

from datetime import datetime
from itertools import groupby

# Read JSON
import orjson

from crypto import encrypt_sqlite_data

# Unzip
from zipfile import ZipFile
from io import TextIOWrapper

# Export database
import gzip
import tempfile

from sqlite import create_new_empty_database, export_sqlite_to_bin

import os
from collections import defaultdict

from db import update_progress, update_step, SavedPackageData, Session, PackageProcessStatus
from util import (
    # discord utilities
    extract_key_from_discord_link,
    generate_avatar_url_from_user_id_avatar_hash,
    check_whitelisted_link,
    # file path
    get_package_zip_path,
    # time utilities
    count_dates_hours,
    count_dates_day,
    get_ts_regular_string_parser,
    get_ts_string_parser
)

from nltk.sentiment import SentimentIntensityAnalyzer
sia = SentimentIntensityAnalyzer()

def count_sentiments(contents):
    sentiments = []
    for content in contents:
        if not content:
            return
        score = sia.polarity_scores(str(content))["compound"]
        if score != 0:
            sentiments.append(score)
    return sum(sentiments) / len(sentiments) if len(sentiments) > 0 else 0

app = Celery(config_source='celeryconfig')

def download_file(package_status_id, package_id, link, session):
    # check if file exists in tmp
    path = get_package_zip_path(package_id)
    try:
        with open(path, 'rb') as f:
            return path
    except FileNotFoundError:
        pass

    if not check_whitelisted_link(link):
        print('checking content type')
        command = f"curl -L -I {link}"
        process = subprocess.run(command, shell=True, capture_output=True, text=True)

        if "application/octet-stream" not in process.stdout or "HTTP/2 400" in process.stdout:
            print('The link does not point to a zip file.')
            raise Exception('EXPIRED_LINK')

    print('downloading')
    update_step(package_status_id, package_id, 'DOWNLOADING', session)
    command = f"curl -L -o {path} {link}"

    process = subprocess.Popen(command, shell=True)
    process.wait()

    return path

def read_analytics_file(package_status_id, package_id, link, session):
    update_step(package_status_id, package_id, 'ANALYZING', session)
    update_progress(package_status_id, package_id, 0, session)

    start = time.time()

    analytics_line_count = 0

    session_logs = []

    user_data = {}

    guilds = []
    users = []
    channels = []

    dms_channels_data = []
    guild_channels_data = []
    
    # Voice Channels Logs, used to compute duration later
    voice_channel_logs = []

    payments = []

    guild_joined = []
    add_reaction = []
    app_opened = []
    email_opened = []
    login_successful = []
    app_crashed = []
    user_avatar_updated = []
    oauth2_authorize_accepted = []
    remote_auth_login = []
    notification_clicked = []
    captcha_served = []
    voice_message_recorded = []
    message_reported = []
    message_edited = []
    premium_upsell_viewed = []

    # dev
    bot_token_compromised = []
    dev_portal_page_viewed = [] # filter with docs/ only
    application_created = []

    application_command_used = []

    path = get_package_zip_path(package_id)

    with ZipFile(path) as zip:
        
        '''
        Read base user data.
        All this data will be useful to parse more complex things later.
        '''

        user_content = zip.open('account/user.json')
        user_json = orjson.loads(user_content.read())
        user_data = {
            'id': user_json['id'],
            'username': user_json['username'],
            'discriminator': user_json['discriminator'],
            'email': user_json['email'],
            'avatar_url': generate_avatar_url_from_user_id_avatar_hash(user_json['id'], user_json['avatar_hash']),
            'display_name': 'display_name' in user_json and user_json['display_name'] or None,
        }
        for relation_ship in user_json['relationships']:
            users.append({
                'id': relation_ship['id'],
                'username': relation_ship['user']['username'], # here username is not User#0000, but the actual username. No need to check for new usernames type.
                'discriminator': relation_ship['user']['discriminator'],
                'avatar_url': generate_avatar_url_from_user_id_avatar_hash(relation_ship['id'], relation_ship['user']['avatar']),
                'display_name': 'display_name' in relation_ship and relation_ship['display_name'] or None,
            })
        for payment in user_json['payments']:
            payments.append({
                'id': payment['id'],
                'amount': payment['amount'],
                'currency': payment['currency'],
                'timestamp': get_ts_regular_string_parser(payment['created_at']).timestamp(),
                'description': payment['description']
            })

        print(f'User data: {time.time() - start}')

        '''
        Read analytics file.
        This file is the most important one, it contains all the events that happened on Discord.
        We read it line by line (each line is a JSON object).
        '''

        analytics_file_name = next((name for name in zip.namelist() if name.startswith('activity/analytics') and name.endswith('.json')), None)

        compute_time_per_line = []
        for line in TextIOWrapper(zip.open(analytics_file_name)):

            compute_time_per_line_start = time.time()

            analytics_line_json = orjson.loads(line)
            # count
            analytics_line_count += 1

            if not 'event_type' in analytics_line_json:
                continue

            try:

                event_type = analytics_line_json['event_type']

                # voice channel logs
                if event_type == 'join_voice_channel' or event_type == 'leave_voice_channel':
                    voice_channel_logs.append({
                        'timestamp': get_ts_string_parser(
                            analytics_line_json['client_track_timestamp'] if analytics_line_json['client_track_timestamp'] != 'null' else analytics_line_json['timestamp']
                        ).timestamp(),
                        'event_type': event_type,
                        'channel_id': analytics_line_json['channel_id'],
                        'guild_id': analytics_line_json['guild_id'] if 'guild_id' in analytics_line_json else None
                    })

                if event_type == 'session_start' or event_type == 'session_end':
                    session_logs.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp(),
                        'event_type': 'session_start' if event_type == 'session_start' else 'session_end',
                        'os': analytics_line_json['os']
                    })
                
                if event_type == 'guild_joined':
                    guild_joined.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp(),
                        'guild_id': analytics_line_json['guild_id']
                    })

                if event_type == 'bot_token_compromised':
                    bot_token_compromised.append(get_ts_string_parser(analytics_line_json['timestamp']).timestamp())

                if event_type == 'dev_portal_page_viewed':
                    if analytics_line_json['page_name'].startswith('/docs/'):
                        dev_portal_page_viewed.append(get_ts_string_parser(analytics_line_json['timestamp']).timestamp())

                if event_type == 'application_created':
                    application_created.append(get_ts_string_parser(analytics_line_json['timestamp']).timestamp())

                if event_type == 'email_opened':
                    email_opened.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp(),
                    })

                if event_type == 'login_successful':
                    login_successful.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp()
                    })

                if event_type == 'user_avatar_updated':
                    user_avatar_updated.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp()
                    })
                
                if event_type == 'app_crashed' or event_type == 'app_native_crash':
                    app_crashed.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp()
                    })

                if event_type == 'oauth2_authorize_accepted':
                    oauth2_authorize_accepted.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp()
                    })

                if event_type == 'remote_auth_login':
                    remote_auth_login.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp()
                    })

                if event_type == 'notification_clicked':
                    notification_clicked.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp()
                    })

                if event_type == 'captcha_served':
                    captcha_served.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp()
                    })

                if event_type == 'voice_message_recorded':
                    voice_message_recorded.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp()
                    })

                if event_type == 'message_reported':
                    message_reported.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp()
                    })

                if event_type == 'message_edited':
                    message_edited.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp()
                    })

                if event_type == 'premium_upsell_viewed':
                    premium_upsell_viewed.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp()
                    })

                if event_type == 'application_command_used':
                    if analytics_line_json['application_id'] == '-1' or 'guild_id' not in analytics_line_json:
                        continue
                    application_command_used.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp(),
                        'application_id': analytics_line_json['application_id'],
                        'guild_id': analytics_line_json['guild_id']
                    })

                if event_type == 'add_reaction':
                    add_reaction.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp(),
                        'user_id': analytics_line_json['user_id'],
                        'channel_id': analytics_line_json['channel_id'],
                        'emoji_name': analytics_line_json['emoji_name'],
                        'is_custom_emoji': 'emoji_id' in analytics_line_json
                    })

                if event_type == 'app_opened':
                    app_opened.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp(),
                        'os': analytics_line_json['os']
                    })

            except:
                print('Error while parsing analytics line: ')
                print(analytics_line_json)
                raise

            compute_time_per_line.append(time.time() - compute_time_per_line_start)

        print(f'Analytics data: {time.time() - start}')
        print(f'Average compute time per line: {sum(compute_time_per_line) / len(compute_time_per_line)}')
        print(f'Session logs: {len(session_logs)}')

        '''
        Read Guild Data.
        This will be used later to get the guild name from the guild_id.
        '''

        server_content = zip.open('servers/index.json')
        server_json = orjson.loads(server_content.read())
        for guild_id in server_json:
            guilds.append({
                'id': guild_id,
                'name': server_json[guild_id]
            })

        '''
        Read Channels Data.
        This will be used later to get the channel name from the channel_id (or to check whether it is a DM or a Guild Channel).
        '''

        message_index_content = zip.open('messages/index.json')
        message_index_json = orjson.loads(message_index_content.read())
        for channel_id in message_index_json:
            full_name = message_index_json[channel_id]
            if full_name is None:
                continue
            is_dm = full_name.startswith('Direct Message with')
            name = full_name if not is_dm else full_name[20:]
            is_new_username = '#0000' in name
            if is_new_username:
                name = name[:-5]
            channels.append({
                'id': channel_id,
                'name': name,
                'is_dm': is_dm
            })

        print(f'Guilds and Channels data: {time.time() - start}')

        '''
        Read messages.
        '''

        read_channel_times = []
        read_csv_times = []
        read_json_times = []
        compute_times = []
        compute_1_times = []
        compute_2_times = []
        channel_json_files = [file_name for file_name in zip.namelist() if file_name.startswith('messages/') and file_name.endswith('channel.json')]
        for channel_json_file in channel_json_files:
            read_time_start = time.time()
            channel_content = zip.open(channel_json_file)
            read_time_diff = time.time() - read_time_start
            read_channel_times.append(read_time_diff)
            read_time_start = time.time()
            channel_json = orjson.loads(channel_content.read())
            read_time_diff = time.time() - read_time_start
            read_json_times.append(read_time_diff)
            channel_id = re.match(r'messages\/c?([0-9]{16,32})\/', channel_json_file).group(1)
            # new package includes 'c' before the channel id
            is_new_package = channel_json_file.startswith('messages/c')
            read_time_start = time.time()
            message_content = zip.open(f'messages/{"c" if is_new_package else ""}{channel_id}/messages.csv')
            read_time_diff = time.time() - read_time_start
            read_channel_times.append(read_time_diff)
            read_time_start = time.time()
            cols_to_use = ['Contents', 'Timestamp']
            message_csv = pd.read_csv(message_content, usecols=cols_to_use)
            read_time_diff = time.time() - read_time_start
            read_csv_times.append(read_time_diff)
            compute_time_start = time.time()
            compute_1_time_start = time.time()
            message_csv['Timestamp'] = pd.to_datetime(message_csv['Timestamp'], format="mixed").apply(lambda x: x.timestamp())
            message_csv.rename(columns={'Contents': 'content', 'Timestamp': 'timestamp'}, inplace=True)
            messages = message_csv.to_dict('records')
            messages.sort(key=lambda message: message['timestamp'])
            compute_1_time_diff = time.time() - compute_1_time_start
            compute_1_times.append(compute_1_time_diff)
           #print(f'Channel {channel_id} has {len(messages)} messages')
            compute_2_time_start = time.time()
            if 'recipients' in channel_json and len(channel_json['recipients']) == 2:
                dm_user_id = [user for user in channel_json['recipients'] if user != user_data['id']][0]
                dms_channels_data.append({
                    'channel_id': channel_id,
                    'dm_user_id': dm_user_id,
                    # TODO : get username from user_id
                    'message_timestamps': count_dates_hours(map(lambda message: message['timestamp'], messages)),
                    'sentiment_score': count_sentiments(map(lambda message: message['content'], messages)),
                    'total_message_count': len(messages),
                    # make sure content exists
                    'first_10_messages': list(filter(lambda message: 'content' in message, messages))[:10]
                })

            elif 'guild' in channel_json:
                guild_channels_data.append({
                    'guild_id': channel_json['guild']['id'],
                    'guild_name': channel_json['guild']['name'],
                    'channel_id': channel_id,
                    'message_timestamps': count_dates_hours(map(lambda message: message['timestamp'], messages)),
                    'total_message_count': len(messages),
                    'first_10_messages': list(filter(lambda message: 'content' in message, messages))[:10]
                })
            compute_2_time_diff = time.time() - compute_2_time_start
            compute_2_times.append(compute_2_time_diff)
            compute_time_diff = time.time() - compute_time_start
            compute_times.append(compute_time_diff)

        print(f'Channel messages data: {time.time() - start}')
        print(f'Average channel read time: {sum(read_channel_times) / len(read_channel_times)}')
        print(f'Average CSV read time: {sum(read_csv_times) / len(read_csv_times)}')
        print(f'Average JSON read time: {sum(read_json_times) / len(read_json_times)}')
        print(f'Average compute time: {sum(compute_times) / len(compute_times)}')
        print(f'Average compute 1 time: {sum(compute_1_times) / len(compute_1_times)}')
        print(f'Average compute 2 time: {sum(compute_2_times) / len(compute_2_times)}')

    '''
    Process voice channel logs to get a list of "events"
    '''
    # Group voice channel logs by channel_id
    logs_by_channel = {k: list(v) for k, v in groupby(sorted(voice_channel_logs, key=lambda x: x['channel_id']), key=lambda x: x['channel_id'])}
    voice_channel_logs_duration = []
    for channel_id, logs in logs_by_channel.items():
        # Separate join and leave events
        joins = [x for x in logs if x['event_type'] == 'join_voice_channel']
        leaves = [x for x in logs if x['event_type'] == 'leave_voice_channel']

        # Sort events by timestamp
        sorted_joins = sorted(joins, key=lambda x: x['timestamp'])
        sorted_leaves = sorted(leaves, key=lambda x: x['timestamp'])
        
        for join in sorted_joins:
            # Find the next leave event that happened after this join
            next_leave = next((leave for leave in sorted_leaves if leave['timestamp'] >= join['timestamp']), None)
            
            # Calculate duration
            duration = next_leave['timestamp'] - join['timestamp'] if next_leave else 0
            
            if duration > 24 * 60 * 60:
                pass
            elif not next_leave:
                pass
            else:
                join_is_included_in_duration = any(
                    join['timestamp'] >= e['started_date'] # this join happened after the start of another event
                    and join['timestamp'] <= e['ended_date'] # this same event ended after this join
                    for e in voice_channel_logs_duration)
                
                if join_is_included_in_duration:
                    #print(f'Join is included in duration: {join}')
                    pass
                else:
                    voice_channel_logs_duration.append({
                        'channel_id': channel_id,
                        'guild_id': join['guild_id'] if 'guild_id' in join else None,
                        'duration_mins': duration // 60,
                        'started_date': join['timestamp'],
                        'ended_date': next_leave['timestamp'] if next_leave else None
                    })

    session_logs_duration = []

    session_logs = sorted(session_logs, key=lambda x: x['timestamp'])

    ongoing_sessions = []
    session_logs_duration = []

    for event in session_logs:
        if event['event_type'] == 'session_start':
            ongoing_sessions.append(event)
        else: # session_end
            while ongoing_sessions:
                start_event = ongoing_sessions.pop(0)
                
                duration = event['timestamp'] - start_event['timestamp']
                if duration > 24 * 60 * 60:
                    continue
                if duration < 0:
                    ongoing_sessions.insert(0, start_event) # Put back the event, it belongs to a future session_end
                    break
                
                # At this point, we have a valid session duration
                # We need to check if it is included in any existing session duration
                start_is_included_in_duration = any(
                    start_event['timestamp'] >= e['started_date'] # this join happened after the start of another event
                    and start_event['timestamp'] <= e['ended_date'] # this same event ended after this join
                    for e in session_logs_duration)
                
                if not start_is_included_in_duration:
                    session_logs_duration.append({
                        'duration_mins': duration // 60,
                        'started_date': start_event['timestamp'],
                        'ended_date': event['timestamp'],
                        'os': start_event['os'],
                    })

    print(f'Finish processing: {time.time() - start}')

    # todo remove this log
    print(f'Found: {len(voice_channel_logs_duration)} voice channel logs, {len(session_logs_duration)} session logs')

    # auto-generated SQLite documentation starts here

    (conn, cur) = create_new_empty_database()

    activity_data = []
    guild_channel_data = []
    guild_data = []
    dm_user_data = []
    payments_data = []
    voice_session_data = []
    session_data = []

    for channel in [*dms_channels_data, *guild_channels_data]:

        ch_data = next(filter(lambda x: x['id'] == channel['channel_id'], channels), None)
        if not ch_data:
            print(f'Channel not found: {channel["total_message_count"]}')
            continue

        if 'dm_user_id' in channel:
            user = next(filter(lambda x: x['id'] == channel['dm_user_id'], users), None)
            dm_user_data.append((channel['channel_id'], channel['dm_user_id'], ch_data['name'], user['display_name'] if user else None, user['avatar_url'] if user else None, channel['total_message_count'], 0, channel['sentiment_score']))
        elif 'guild_id' in channel:
            guild_channel_data.append((channel['channel_id'], channel['guild_id'], ch_data['name'], channel['total_message_count'], 0))
    
        for timestamp, count in channel['message_timestamps'].items():
            day = timestamp.strftime('%Y-%m-%d')
            hour = int(timestamp.strftime('%H'))
            activity_data.append(('message_sent', day, hour, count, channel['channel_id'], channel['guild_id'] if 'guild_id' in channel else None, None, None, None))

    for guild in guilds:
        total_message_count = sum(channel['total_message_count'] for channel in guild_channels_data if channel['guild_id'] == guild['id'])
        guild_data.append((guild['id'], guild['name'], total_message_count))

    for payment in payments:
        payments_data.append((payment['id'], datetime.fromtimestamp(payment['timestamp']).strftime('%Y-%m-%d'), payment['amount'], payment['currency'], payment['description']))

    for voice_session in voice_channel_logs_duration:
        voice_session_data.append((voice_session['channel_id'], voice_session['guild_id'], voice_session['duration_mins'], voice_session['started_date'], voice_session['ended_date']))

    for l_session in session_logs_duration:
        session_data.append((l_session['duration_mins'], l_session['started_date'], l_session['ended_date'], l_session['os']))

    # regroup guild joined per guild, then regroup each guild's entries per hour
    guild_joined_per_guild_id = defaultdict(list)
    for guild_joined in guild_joined:
        guild_joined_per_guild_id[guild_joined['guild_id']].append(guild_joined)

    for guild_id, guild_joined_entries in guild_joined_per_guild_id.items():
        entries = count_dates_hours(map(lambda ev: ev['timestamp'], guild_joined_entries))
        for timestamp, count in entries.items():
            day = timestamp.strftime('%Y-%m-%d')
            hour = int(timestamp.strftime('%H'))
            activity_data.append(('guild_joined', day, hour, count, None, guild_id, None, None, None))

    application_command_used_pdf = pd.DataFrame(application_command_used)
    application_command_used_pdf_grouped = application_command_used_pdf.groupby(['guild_id', 'application_id'])
    for (guild_id, application_id), group in application_command_used_pdf_grouped:
        # check if first element includes a guild_id key
        entries = count_dates_day(group['timestamp'])
        for timestamp, count in entries.items():
            day = timestamp.strftime('%Y-%m-%d')
            hour = int(timestamp.strftime('%H'))
            activity_data.append(('application_command_used', day, hour, count, None, guild_id, application_id, None, None))

    add_reaction_pdf = pd.DataFrame(add_reaction)
    add_reaction_pdf_grouped = add_reaction_pdf.groupby(['channel_id', 'emoji_name'])
    for (channel_id, emoji_name), group in add_reaction_pdf_grouped:
        # check with first item if is custom
        is_custom = '1' if group.iloc[0]['is_custom_emoji'] is True else '0'
        entries = count_dates_day(group['timestamp'])
        for timestamp, count in entries.items():
            day = timestamp.strftime('%Y-%m-%d')
            hour = int(timestamp.strftime('%H'))
            activity_data.append(('add_reaction', day, hour, count, channel_id, None, None, emoji_name, is_custom))

    app_opened_pdf = pd.DataFrame(app_opened)
    app_opened_pdf_grouped = app_opened_pdf.groupby(['os'])
    for (os,), group in app_opened_pdf_grouped:
        entries = count_dates_day(group['timestamp'])
        for timestamp, count in entries.items():
            day = timestamp.strftime('%Y-%m-%d')
            hour = int(timestamp.strftime('%H'))
            activity_data.append(('app_opened', day, hour, count, None, None, None, os, None))

    email_opened_entries = count_dates_day(map(lambda ev: ev['timestamp'], email_opened))
    for timestamp, count in email_opened_entries.items():
        day = timestamp.strftime('%Y-%m-%d')
        hour = int(timestamp.strftime('%H'))
        activity_data.append(('email_opened', day, hour, count, None, None, None, None, None))

    login_successful_entries = count_dates_day(map(lambda ev: ev['timestamp'], login_successful))
    for timestamp, count in login_successful_entries.items():
        day = timestamp.strftime('%Y-%m-%d')
        hour = int(timestamp.strftime('%H'))
        activity_data.append(('login_successful', day, hour, count, None, None, None, None, None))

    app_crashed_entries = count_dates_day(map(lambda ev: ev['timestamp'], app_crashed))
    for timestamp, count in app_crashed_entries.items():
        day = timestamp.strftime('%Y-%m-%d')
        hour = int(timestamp.strftime('%H'))
        activity_data.append(('app_crashed', day, hour, count, None, None, None, None, None))

    user_avatar_updated_entries = count_dates_day(map(lambda ev: ev['timestamp'], user_avatar_updated))
    for timestamp, count in user_avatar_updated_entries.items():
        day = timestamp.strftime('%Y-%m-%d')
        hour = int(timestamp.strftime('%H'))
        activity_data.append(('user_avatar_updated', day, hour, count, None, None, None, None, None))

    oauth2_authorize_accepted_entries = count_dates_day(map(lambda ev: ev['timestamp'], oauth2_authorize_accepted))
    for timestamp, count in oauth2_authorize_accepted_entries.items():
        day = timestamp.strftime('%Y-%m-%d')
        hour = int(timestamp.strftime('%H'))
        activity_data.append(('oauth2_authorize_accepted', day, hour, count, None, None, None, None, None))

    remote_auth_login_entries = count_dates_day(map(lambda ev: ev['timestamp'], remote_auth_login))
    for timestamp, count in remote_auth_login_entries.items():
        day = timestamp.strftime('%Y-%m-%d')
        hour = int(timestamp.strftime('%H'))
        activity_data.append(('remote_auth_login', day, hour, count, None, None, None, None, None))

    notification_clicked_entries = count_dates_day(map(lambda ev: ev['timestamp'], notification_clicked))
    for timestamp, count in notification_clicked_entries.items():
        day = timestamp.strftime('%Y-%m-%d')
        hour = int(timestamp.strftime('%H'))
        activity_data.append(('notification_clicked', day, hour, count, None, None, None, None, None))

    captcha_served_entries = count_dates_day(map(lambda ev: ev['timestamp'], captcha_served))
    for timestamp, count in captcha_served_entries.items():
        day = timestamp.strftime('%Y-%m-%d')
        hour = int(timestamp.strftime('%H'))
        activity_data.append(('captcha_served', day, hour, count, None, None, None, None, None))

    voice_message_recorded_entries = count_dates_day(map(lambda ev: ev['timestamp'], voice_message_recorded))
    for timestamp, count in voice_message_recorded_entries.items():
        day = timestamp.strftime('%Y-%m-%d')
        hour = int(timestamp.strftime('%H'))
        activity_data.append(('voice_message_recorded', day, hour, count, None, None, None, None, None))

    message_reported_entries = count_dates_day(map(lambda ev: ev['timestamp'], message_reported))
    for timestamp, count in message_reported_entries.items():
        day = timestamp.strftime('%Y-%m-%d')
        hour = int(timestamp.strftime('%H'))
        activity_data.append(('message_reported', day, hour, count, None, None, None, None, None))

    message_edited_entries = count_dates_day(map(lambda ev: ev['timestamp'], message_edited))
    for timestamp, count in message_edited_entries.items():
        day = timestamp.strftime('%Y-%m-%d')
        hour = int(timestamp.strftime('%H'))
        activity_data.append(('message_edited', day, hour, count, None, None, None, None, None))

    premium_upsell_viewed_entries = count_dates_day(map(lambda ev: ev['timestamp'], premium_upsell_viewed))
    for timestamp, count in premium_upsell_viewed_entries.items():
        day = timestamp.strftime('%Y-%m-%d')
        hour = int(timestamp.strftime('%H'))
        activity_data.append(('premium_upsell_viewed', day, hour, count, None, None, None, None, None))

    activity_query = '''
        INSERT INTO activity
        (event_name, day, hour, occurence_count, associated_channel_id, associated_guild_id, associated_user_id, extra_field_1, extra_field_2)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    '''

    dm_user_query = '''
        INSERT INTO dm_channels_data
        (channel_id, dm_user_id, user_name, display_name, user_avatar_url, total_message_count, total_voice_channel_duration, sentiment_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    '''

    guild_channel_query = '''
        INSERT INTO guild_channels_data
        (channel_id, guild_id, channel_name, total_message_count, total_voice_channel_duration)
        VALUES (?, ?, ?, ?, ?);
    '''

    guild_query = '''
        INSERT INTO guilds
        (guild_id, guild_name, total_message_count)
        VALUES (?, ?, ?);
    '''

    payment_query = '''
        INSERT INTO payments
        (payment_id, payment_date, payment_amount, payment_currency, payment_description)
        VALUES (?, ?, ?, ?, ?);
    '''

    voice_session_query = '''
        INSERT INTO voice_sessions
        (channel_id, guild_id, duration_mins, started_date, ended_date)
        VALUES (?, ?, ?, ?, ?);
    '''

    session_query = '''
        INSERT INTO sessions
        (duration_mins, started_date, ended_date, device_os)
        VALUES (?, ?, ?, ?);
    '''

    cur.executemany(dm_user_query, dm_user_data)
    cur.executemany(guild_channel_query, guild_channel_data)
    cur.executemany(activity_query, activity_data)
    cur.executemany(guild_query, guild_data)
    cur.executemany(payment_query, payments_data)
    cur.executemany(voice_session_query, voice_session_data)
    cur.executemany(session_query, session_data)

    cur.execute('''
        INSERT INTO package_data
        (package_id, package_version, package_owner_id, package_owner_name, package_owner_display_name, package_owner_avatar_url)
        VALUES (?, ?, ?, ?, ?, ?);
    ''', (package_id, '0.1.0',  user_data['id'], user_data['username'], user_data['display_name'], user_data['avatar_url']))

    conn.commit()

    # make database smaller
    cur.execute('VACUUM;')

    conn.commit()

    zipped_buffer = export_sqlite_to_bin(cur, conn)
    key = extract_key_from_discord_link(link)
    (data, iv) = encrypt_sqlite_data(zipped_buffer, key)

    session.add(SavedPackageData(package_id=package_id, encrypted_data=data, iv=iv))
    session.commit()

    print(f'SQLite serialization: {time.time() - start}')

    update_step(package_status_id, package_id, 'PROCESSED', session)

    return analytics_line_count

@app.task()
def handle_package(package_status_id, package_id, link):
    print(f'handling package {package_id} with link {link}')
    session = Session()
    package_status = session.query(PackageProcessStatus).filter(PackageProcessStatus.id == package_status_id).first()
    if not package_status:
        print('package not found')
        return
    
    if package_status.is_cancelled:
        print('package is cancelled, skipping')
        return

    # regular_process or premium_process
    worker_name = current_task.request.hostname

    if package_status.is_upgraded and worker_name.startswith('regular_process'):
        print('package is upgraded and worker is regular, skipping')
        # the package has already been added to the premium worker queue
        return

    try:
        download_file(package_status_id, package_id, link, session)
        read_analytics_file(package_status_id, package_id, link, session)
    except Exception as e:
        expected = ('EXPIRED_LINK')
        current = str(e)
        e_traceback = None
        if expected not in current:
            current = 'UNKNOWN_ERROR'
            e_traceback = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
        session.query(PackageProcessStatus).filter(PackageProcessStatus.id == package_status_id).update({
            'is_errored': True,
            'error_message_code': current,
            'error_message_traceback': e_traceback
        })
        session.commit()
    finally:
        session.close()
