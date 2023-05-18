import pandas as pd
from distutils.command.config import config
import re
import time
from celery import Celery, chain

from datetime import datetime

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

    events_per_channel_id = {}
    time_spent_in_channels = []

    payments = []

    with ZipFile(f'tmp/{package_id}.zip') as zip:

        # READ USER DATA

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

        # READ ANALYTICS
        analytics_file_name = next((name for name in zip.namelist() if name.startswith('activity/analytics') and name.endswith('.json')), None)
        for line in TextIOWrapper(zip.open(analytics_file_name)):
            analytics_line_json = orjson.loads(line)
            # count
            analytics_line_count += 1

            if analytics_line_json['event_type'] == 'session_start':
                session_starts.append({
                    'timestamp': get_ts_string_parser(analytics_line_json['timestamp']).timestamp(),
                    #'device': analytics_line_json['device'] if 'device' in analytics_line_json else 'Unknown',
                    # we can not trust device, it's often null, unknown or equal to the os
                    'os': analytics_line_json['os']
                })

            if analytics_line_json['event_type'] == 'join_voice_channel':
                if not analytics_line_json['channel_id'] in events_per_channel_id:
                    events_per_channel_id[analytics_line_json['channel_id']] = []
                events_per_channel_id[analytics_line_json['channel_id']].append({
                    'timestamp': get_ts_string_parser(
                        analytics_line_json['client_track_timestamp'] if analytics_line_json['client_track_timestamp'] != 'null' else analytics_line_json['timestamp']
                    ).timestamp(),
                    'type': 'join'
                })

            # todo, regarder voice disconnect? (peut-être que l'évènement leave_voice_channel n'est pas écrit quand on a un voice_disconnect)

            if analytics_line_json['event_type'] == 'leave_voice_channel':
                if not analytics_line_json['channel_id'] in events_per_channel_id:
                    events_per_channel_id[analytics_line_json['channel_id']] = []
                events_per_channel_id[analytics_line_json['channel_id']].append({
                    'timestamp': get_ts_string_parser(
                        analytics_line_json['client_track_timestamp'] if analytics_line_json['client_track_timestamp'] != 'null' else analytics_line_json['timestamp']
                    ).timestamp(),
                    'type': 'leave'
                })

        server_content = zip.open('servers/index.json')
        server_json = orjson.loads(server_content.read())
        for guild_id in server_json:
            guilds.append({
                'id': guild_id,
                'name': server_json[guild_id]
            })

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

        channel_json_files = [file_name for file_name in zip.namelist() if file_name.startswith('messages/') and file_name.endswith('channel.json')]
        for channel_json_file in channel_json_files:
            channel_content = zip.open(channel_json_file)
            channel_json = orjson.loads(channel_content.read())
            channel_id = re.match(r'messages\/c?([0-9]{16,32})\/', channel_json_file).group(1)
            is_new_package = channel_json_file.startswith('messages/c')
            message_content = zip.open(f'messages/{"c" if is_new_package else ""}{channel_id}/messages.csv')
            message_csv = pd.read_csv(message_content)
            messages = []
            for message_row in message_csv.values.tolist():
                # 0 is message_id
                # 1 is timestamp
                # 2 is contents
                # 3 is attachments
                messages.append(get_ts_regular_string_parser(message_row[1]).timestamp())

            messages.sort()

            if 'recipients' in channel_json and len(channel_json['recipients']) == 2:
                dm_user_id = [user for user in channel_json['recipients'] if user != user_data['id']][0]
                dms_channels_data.append({
                    'channel_id': channel_id,
                    'dm_user_id': dm_user_id,
                    # here, we can either get the username from the relation ships or from the channel index json
                    'message_timestamps': messages,
                    'total_message_count': len(messages),
                    'first_message_timestamp': messages[0] if len(messages) > 0 else None
                })

            elif 'guild' in channel_json:
                guild_channels_data.append({
                    'guild_id': channel_json['guild']['id'],
                    'guild_name': channel_json['guild']['name'],
                    'channel_id': channel_id,
                    'message_timestamps': messages,
                    'total_message_count': len(messages),
                    'first_message_timestamp': messages[0] if len(messages) > 0 else None
                })

    start = time.process_time()
    session_starts.sort(key=lambda x: x['timestamp'])

    print(time.process_time() - start)
    print(len(session_starts))
    print(len(used_commands))

    for channel_id in events_per_channel_id:

        events_channel_id = events_per_channel_id[channel_id]
        events_channel_id.sort(key=lambda x: x['timestamp'])

        index = 0

        while index < len(events_channel_id) - 1:
            current_event = events_channel_id[index]
            next_event = events_channel_id[index + 1]
            if current_event['type'] == 'leave':
                index += 1
                continue
            if next_event['type'] == 'join':
                index += 1
                continue
            if next_event['type'] == 'leave':
                time_delta = next_event['timestamp'] - current_event['timestamp']
                if time_delta < 60 * 60 * 10:
                    time_spent_in_channels.append({
                        'channel_id': channel_id,
                        'timedelta': time_delta,
                        'start': current_event['timestamp'],
                        'end': next_event['timestamp']
                    })
                else:
                    #print('more than 10 hours spent in voice, ignoring')
                    pass
                index += 2

    total_time = 0
    for channel in time_spent_in_channels:
        total_time += channel['timedelta']

    plaintext = orjson.dumps({
        'total_time': total_time,
        'analytics_line_count': analytics_line_count,
        'session_starts': session_starts,
        'guilds': guilds,
        'used_commands': used_commands,
        'time_spent_in_channels': time_spent_in_channels,
        'channels': channels,
        'user_data': user_data,
        'users': users,
        'payments': payments,
        'dms_channels_data': dms_channels_data,
        'guild_channels_data': guild_channels_data
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