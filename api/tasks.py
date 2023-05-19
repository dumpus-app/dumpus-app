from dotenv import load_dotenv
load_dotenv()

import pandas as pd
from distutils.command.config import config
import re
import time
from celery import Celery, chain

from datetime import datetime, timezone
from collections import Counter
from itertools import groupby

# Download File
import requests

# Read JSON
import orjson
import cryptocode

# Unzip
from zipfile import ZipFile
from io import TextIOWrapper

from db import SavedPackageData, session, update_progress, update_step
from util import extract_key_from_discord_link, generate_avatar_url_from_user_id_avatar_hash

app = Celery(config_source='celeryconfig')

def get_ts_string_parser(line):
    year, month, day = int(line[1:5]), int(line[6:8]), int(line[9:11])
    hour, minute = int(line[12:14]), int(line[15:17])

    return datetime(year=year, month=month, day=day, hour=hour, minute=minute)

def get_ts_regular_string_parser(line):
    year, month, day = int(line[0:4]), int(line[5:7]), int(line[8:10])
    hour, minute = int(line[11:13]), int(line[14:16])

    return datetime(year=year, month=month, day=day, hour=hour, minute=minute)

def count_dates(timestamps):
    dates = [datetime.fromtimestamp(ts).date() for ts in timestamps]
    date_counts = Counter(dates)
    date_counts = {datetime.combine(date, datetime.min.time(), timezone.utc).timestamp(): count for date, count in date_counts.items()}
    return date_counts

def download_file(package_id, link):
    # check if file exists in tmp
    path = f'tmp/{package_id}.zip'
    try:
        with open(path, 'rb') as f:
            return path
    except FileNotFoundError:
        pass

    print('downloading')
    update_step(package_id, 'downloading')
    with requests.get(link, stream=True, timeout=(5.0, 30.0)) as r:
        r.raise_for_status()
        with open(path, 'wb') as f:
            total_length = int(r.headers.get('Content-Length'))
            print(f'Total length: {total_length}')
            dl = 0
            for chunk in r.iter_content(chunk_size=8192):
                dl += len(chunk)
                percent = round(dl / total_length) * 100
                f.write(chunk)
            done = True
    return path

def read_analytics_file(package_id, link):
    update_step(package_id, 'analyzing')
    update_progress(package_id, 0)

    analytics_line_count = 0

    session_starts = []

    used_commands = []

    user_data = {}

    guilds = []
    users = []
    channels = []

    dms_channels_data = []
    guild_channels_data = []

    # Voice Channels Logs, used to compute duration later
    voice_channel_logs = []

    payments = []

    package_id = 'f3559e67245fbaa1c84f766b96c2a0e9'
    path = f'../tmp/{package_id}.zip'

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
                'amount': payment['amount'],
                'currency': payment['currency'],
                'timestamp': get_ts_regular_string_parser(payment['created_at']).timestamp(),
                'description': payment['description']
            })

        '''
        Read analytics file.
        This file is the most important one, it contains all the events that happened on Discord.
        We read it line by line (each line is a JSON object).
        '''

        analytics_file_name = next((name for name in zip.namelist() if name.startswith('activity/analytics') and name.endswith('.json')), None)

        for line in TextIOWrapper(zip.open(analytics_file_name)):
            analytics_line_json = orjson.loads(line)
            # count
            analytics_line_count += 1

            event_type = analytics_line_json['event_type']

            # voice channel logs
            if event_type == 'join_voice_channel' or event_type == 'leave_voice_channel':
                voice_channel_logs.append({
                    'timestamp': get_ts_string_parser(
                        analytics_line_json['client_track_timestamp'] if analytics_line_json['client_track_timestamp'] != 'null' else analytics_line_json['timestamp']
                    ).timestamp(),
                    'event_type': event_type,
                    'channel_id': analytics_line_json['channel_id']
                })

            if analytics_line_json['event_type'] == 'session_start':
                session_starts.append({
                    'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp(),
                    #'device': analytics_line_json['device'] if 'device' in analytics_line_json else 'Unknown',
                    # we can not trust device, it's often null, unknown or equal to the os
                    'os': analytics_line_json['os']
                })

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

        '''
        Read messages.
        '''

        channel_json_files = [file_name for file_name in zip.namelist() if file_name.startswith('messages/') and file_name.endswith('channel.json')]
        for channel_json_file in channel_json_files:
            channel_content = zip.open(channel_json_file)
            channel_json = orjson.loads(channel_content.read())
            channel_id = re.match(r'messages\/c?([0-9]{16,32})\/', channel_json_file).group(1)
            # new package includes 'c' before the channel id
            is_new_package = channel_json_file.startswith('messages/c')
            message_content = zip.open(f'messages/{"c" if is_new_package else ""}{channel_id}/messages.csv')
            message_csv = pd.read_csv(message_content)
            messages = []
            for message_row in message_csv.values.tolist():
                # in the CSV file:
                # 0 is message_id
                # 1 is timestamp
                # 2 is contents
                # 3 is attachments
                messages.append({
                    'content': message_row[2],
                    'timestamp': get_ts_string_parser(message_row[1]).timestamp(),
                })

            # sort messages by timestamp (oldest to newest)
            messages.sort(key=lambda message: message['timestamp'])

            if 'recipients' in channel_json and len(channel_json['recipients']) == 2:
                dm_user_id = [user for user in channel_json['recipients'] if user != user_data['id']][0]
                dms_channels_data.append({
                    'channel_id': channel_id,
                    'dm_user_id': dm_user_id,
                    # TODO : get username from user_id
                    'message_timestamps': count_dates(messages),
                    'total_message_count': len(messages),
                    # make sure content exists
                    'first_10_messages': filter(messages, lambda message: 'content' in message)[:10]
                })

            elif 'guild' in channel_json:
                guild_channels_data.append({
                    'guild_id': channel_json['guild']['id'],
                    'guild_name': channel_json['guild']['name'],
                    'channel_id': channel_id,
                    'message_timestamps': count_dates(messages),
                    'total_message_count': len(messages),
                    'first_10_messages': filter(messages, lambda message: 'content' in message)[:10]
                })

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
        sorted_joins = sorted(joins, key=lambda x: get_ts_string_parser(x['timestamp']).timestamp())
        sorted_leaves = sorted(leaves, key=lambda x: get_ts_string_parser(x['timestamp']).timestamp())
        
        for join in sorted_joins:
            # Find the next leave event that happened after this join
            next_leave = next((leave for leave in sorted_leaves if get_ts_string_parser(leave['timestamp']).timestamp() > get_ts_string_parser(join['timestamp']).timestamp()), None)
            
            # Calculate duration
            duration = get_ts_string_parser(next_leave['timestamp']).timestamp() - get_ts_string_parser(join['timestamp']).timestamp() if next_leave else 0
            
            if duration > 24 * 60 * 60 * 1000:
                pass
            elif not next_leave:
                pass
            else:
                join_is_included_in_duration = any(get_ts_string_parser(join['timestamp']).timestamp() >= get_ts_string_parser(e['started_date']).timestamp() and get_ts_string_parser(join['timestamp']).timestamp() <= get_ts_string_parser(e['ended_date']).timestamp() for e in voice_channel_logs_duration)
                
                if join_is_included_in_duration:
                    print(f'Join is included in duration: {join}')
                else:
                    voice_channel_logs_duration.append({
                        'channel_id': channel_id,
                        'duration': duration,
                        'started_date': join['timestamp'],
                        'ended_date': next_leave['timestamp'] if next_leave else None,
                        'mins': duration // 1000 // 60
                    })

    start = time.process_time()

    print(time.process_time() - start)

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

    time_before_encrypt = time.process_time()
    key = extract_key_from_discord_link(link)
    data = cryptocode.encrypt(plaintext.decode(), key)
    print(time.process_time() - time_before_encrypt)

    session.add(SavedPackageData(package_id=package_id, data=data, created_at=datetime.now(), updated_at=datetime.now()))
    session.commit()

    update_step(package_id, 'processed')

    return analytics_line_count

@app.task()
def handle_package(package_id, link):
    print(f'handling package {package_id} with link {link}')
    download_file(package_id, link),
    read_analytics_file(package_id, link)

# todo
# verify that file exists before reading
# split tasks into smaller tasks