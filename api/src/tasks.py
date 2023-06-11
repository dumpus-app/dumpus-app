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
import sqlite3
import tempfile

from db import update_progress, update_step, SavedPackageData, Session, PackageProcessStatus
from util import (
    # discord utilities
    extract_key_from_discord_link,
    generate_avatar_url_from_user_id_avatar_hash,
    # time utilities
    count_dates_hours,
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

def download_file(package_id, link, session):
    # check if file exists in tmp
    path = f'tmp/{package_id}.zip'
    try:
        with open(path, 'rb') as f:
            return path
    except FileNotFoundError:
        pass

    print('checking content type')
    command = f"curl -L -I {link}"
    process = subprocess.run(command, shell=True, capture_output=True, text=True)

    if "application/zip" not in process.stdout or "HTTP/2 400" in process.stdout:
        print('The link does not point to a zip file.')
        raise Exception('EXPIRED_LINK')

    print('downloading')
    update_step(package_id, 'DOWNLOADING', session)
    command = f"curl -L -o {path} {link}"

    process = subprocess.Popen(command, shell=True)
    process.wait()

    return path

def read_analytics_file(package_id, link, session):
    update_step(package_id, 'ANALYZING', session)
    update_progress(package_id, 0, session)

    start = time.time()

    analytics_line_count = 0

    session_starts = []

    guilds_joins = []

    user_data = {}

    guilds = []
    users = []
    channels = []

    dms_channels_data = []
    guild_channels_data = []
    
    channels_messages = []

    # Voice Channels Logs, used to compute duration later
    voice_channel_logs = []

    payments = []

    guild_joined = []

    # dev
    bot_token_compromised = []
    dev_portal_page_viewed = [] # filter with docs/ only
    application_created = []

    application_command_used = []

    path = f'tmp/{package_id}.zip'

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
            'avatar_url': generate_avatar_url_from_user_id_avatar_hash(user_json['id'], user_json['avatar_hash'])
        }
        for relation_ship in user_json['relationships']:
            users.append({
                'id': relation_ship['id'],
                'username': relation_ship['user']['username'],
                'discriminator': relation_ship['user']['discriminator'],
                'avatar_url': generate_avatar_url_from_user_id_avatar_hash(relation_ship['id'], relation_ship['user']['avatar'])
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

                if analytics_line_json['event_type'] == 'session_start':
                    session_starts.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp(),
                        #'device': analytics_line_json['device'] if 'device' in analytics_line_json else 'Unknown',
                        # we can not trust device, it's often null, unknown or equal to the os
                        'os': analytics_line_json['os']
                    })

                
                if analytics_line_json['event_type'] == 'guild_joined':
                    guild_joined.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp(),
                        'guild_id': analytics_line_json['guild_id']
                    })

                if analytics_line_json['event_type'] == 'bot_token_compromised':
                    bot_token_compromised.append(get_ts_string_parser(analytics_line_json['timestamp']).timestamp())

                if analytics_line_json['event_type'] == 'dev_portal_page_viewed':
                    if analytics_line_json['page_name'].startswith('/docs/'):
                        dev_portal_page_viewed.append(get_ts_string_parser(analytics_line_json['timestamp']).timestamp())

                if analytics_line_json['event_type'] == 'application_created':
                    application_created.append(get_ts_string_parser(analytics_line_json['timestamp']).timestamp())

                if analytics_line_json['event_type'] == 'application_command_used':
                    if analytics_line_json['application_id'] == '-1' or 'channel_id' not in analytics_line_json:
                        continue
                    application_command_used.append({
                        'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp(),
                        'application_id': analytics_line_json['application_id'],
                        'channel_id': analytics_line_json['channel_id']
                    })

            except:
                print('Error while parsing analytics line: ')
                print(analytics_line_json)
                raise

            compute_time_per_line.append(time.time() - compute_time_per_line_start)

        print(f'Analytics data: {time.time() - start}')
        print(f'Average compute time per line: {sum(compute_time_per_line) / len(compute_time_per_line)}')

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
            next_leave = next((leave for leave in sorted_leaves if leave['timestamp'] > join['timestamp']), None)
            
            # Calculate duration
            duration = next_leave['timestamp'] - join['timestamp'] if next_leave else 0
            
            if duration > 24 * 60 * 60 * 1000:
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
                        'duration_mins': duration // 1000 // 60,
                        'started_date': join['timestamp'],
                        'ended_date': next_leave['timestamp'] if next_leave else None
                    })

    print(f'Finish processing: {time.time() - start}')

    '''
    plaintext = orjson.dumps({
        'analytics_line_count': analytics_line_count,
        'guilds': guilds,
        'channels': channels,
        'user_data': user_data,
        'users': users,
        'payments': payments,
        'dms_channels_data': dms_channels_data,
        'guild_channels_data': guild_channels_data,
        'voice_channel_logs_duration': voice_channel_logs_duration
    })
    '''

    # auto-generated SQLite documentation starts here

    conn = sqlite3.connect(':memory:')
    cur = conn.cursor()

    cur.execute('''
        CREATE TABLE activity (
            event_name TEXT NOT NULL,
            day TEXT NOT NULL,
            hour INTEGER,
            occurence_count INTEGER NOT NULL,
            associated_dm_user_id TEXT,
            associated_channel_id TEXT,
            associated_guild_id TEXT,
            PRIMARY KEY (event_name, day, hour, associated_channel_id, associated_guild_id)
        )
    ''')

    cur.execute('''
        CREATE TABLE dm_channels_data (
            channel_id TEXT NOT NULL,
            dm_user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            user_avatar_url TEXT,
            total_message_count INTEGER NOT NULL,
            total_voice_channel_duration INTEGER NOT NULL,
            sentiment_score REAL NOT NULL,
            PRIMARY KEY (channel_id)
        )
    ''')

    cur.execute('''
        CREATE TABLE guild_channels_data (
            channel_id TEXT NOT NULL,
            channel_name TEXT NOT NULL,
            guild_id TEXT NOT NULL,
            total_message_count INTEGER NOT NULL,
            total_voice_channel_duration INTEGER NOT NULL,
            PRIMARY KEY (channel_id)
        )
    ''')

    cur.execute('''
        CREATE TABLE guilds (
            guild_id TEXT NOT NULL,
            guild_name TEXT NOT NULL,
            total_message_count INTEGER NOT NULL,
            PRIMARY KEY (guild_id)
        )
    ''')

    cur.execute('''
        CREATE TABLE payments (
            payment_id TEXT NOT NULL,
            payment_date TEXT NOT NULL,
            payment_amount INTEGER NOT NULL,
            payment_currency TEXT NOT NULL,
            payment_description TEXT NOT NULL,
            PRIMARY KEY (payment_id)
        )
    ''')

    cur.execute('''
        CREATE TABLE voice_sessions (
            channel_id TEXT NOT NULL,
            guild_id TEXT,
            duration_mins INTEGER NOT NULL,
            started_date TEXT NOT NULL,
            ended_date TEXT NOT NULL,
            PRIMARY KEY (channel_id, started_date)
        )
    ''')

    message_sent_data = []
    guild_channel_data = []
    guild_data = []
    dm_user_data = []
    payments_data = []
    voice_session_data = []

    suma = 0

    for channel in [*dms_channels_data, *guild_channels_data]:

        ch_data = next(filter(lambda x: x['id'] == channel['channel_id'], channels), None)
        if not ch_data:
            print(f'Channel not found: {channel["total_message_count"]}')
            continue

        if 'dm_user_id' in channel:
            user = next(filter(lambda x: x['id'] == channel['dm_user_id'], users), None)
            dm_user_data.append((channel['channel_id'], channel['dm_user_id'], ch_data['name'], user['avatar_url'] if user else None, channel['total_message_count'], 0, channel['sentiment_score']))
        elif 'guild_id' in channel:
            guild_channel_data.append((channel['channel_id'], channel['guild_id'], ch_data['name'], channel['total_message_count'], 0))
    
        for timestamp, count in channel['message_timestamps'].items():
            day = timestamp.strftime('%Y-%m-%d')
            hour = int(timestamp.strftime('%H'))
            message_sent_data.append(('message_sent', day, hour, count, channel['channel_id'], channel['guild_id'] if 'guild_id' in channel else None))
            suma += count

    for guild in guilds:
        total_message_count = sum(channel['total_message_count'] for channel in guild_channels_data if channel['guild_id'] == guild['id'])
        guild_data.append((guild['id'], guild['name'], total_message_count))

    for payment in payments:
        payments_data.append((payment['id'], datetime.fromtimestamp(payment['timestamp']).strftime('%Y-%m-%d'), payment['amount'], payment['currency'], payment['description']))

    for voice_session in voice_channel_logs_duration:
        voice_session_data.append((voice_session['channel_id'], voice_session['guild_id'], voice_session['duration_mins'], voice_session['started_date'], voice_session['ended_date']))

    message_sent_query = '''
        INSERT INTO activity
        (event_name, day, hour, occurence_count, associated_channel_id, associated_guild_id)
        VALUES (?, ?, ?, ?, ?, ?);
    '''

    dm_user_query = '''
        INSERT INTO dm_channels_data
        (channel_id, dm_user_id, user_name, user_avatar_url, total_message_count, total_voice_channel_duration, sentiment_score)
        VALUES (?, ?, ?, ?, ?, ?, ?);
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

    cur.executemany(dm_user_query, dm_user_data)
    cur.executemany(guild_channel_query, guild_channel_data)
    cur.executemany(message_sent_query, message_sent_data)
    cur.executemany(guild_query, guild_data)
    cur.executemany(payment_query, payments_data)
    cur.executemany(voice_session_query, voice_session_data)

    # make database smaller
    cur.execute('VACUUM;')

    conn.commit()

    # creating a temporary file is the only way to get a file-like object from sqlite3 (the format the client expects)
    with tempfile.NamedTemporaryFile() as tempf:
        with sqlite3.connect('file:' + tempf.name + '?mode=rwc', uri=True) as disk_db:
            conn.backup(disk_db)

        tempf.seek(0)
        sqlite_buffer = tempf.read()

        zipped_buffer = gzip.compress(sqlite_buffer)

        key = extract_key_from_discord_link(link)
        (data, iv) = encrypt_sqlite_data(zipped_buffer, key)

        session.add(SavedPackageData(package_id=package_id, data=data, iv=iv))
        session.commit()

    print(f'SQLite serialization: {time.time() - start}')

    update_step(package_id, 'PROCESSED', session)

    return analytics_line_count

@app.task()
def handle_package(package_id, link):
    print(f'handling package {package_id} with link {link}')
    session = Session()
    package_status = session.query(PackageProcessStatus).filter(PackageProcessStatus.package_id == package_id).first()
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
        download_file(package_id, link, session)
        read_analytics_file(package_id, link, session)
    except Exception as e:
        expected = ('EXPIRED_LINK')
        current = str(e)
        e_traceback = None
        if expected not in current:
            current = 'UNKNOWN_ERROR'
            e_traceback = ''.join(traceback.format_exception(etype=type(e), value=e, tb=e.__traceback__))
        session.query(PackageProcessStatus).filter(PackageProcessStatus.package_id == package_id).update({
            'is_errored': True,
            'error_message_code': current,
            'error_message_traceback': e_traceback
        })
        session.commit()
    finally:
        session.close()
