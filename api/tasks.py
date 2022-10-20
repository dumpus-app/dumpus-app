from distutils.command.config import config
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
from util import extract_key_from_discord_link

app = Celery(config_source='celeryconfig')

def get_ts_string_parser(line):
    year, month, day = int(line[1:5]), int(line[6:8]), int(line[9:11])
    hour, minute = int(line[12:14]), int(line[15:17])

    return datetime(year=year, month=month, day=day, hour=hour, minute=minute)

@app.task()
def download_file(package_id, link):
    update_step(package_id, 'downloading')
    with requests.get(link, stream=True, timeout=(5.0, 30.0)) as r:
        r.raise_for_status()
        with open(f'tmp/{package_id}.zip', 'wb') as f:
            total_length = int(r.headers.get('Content-Length'))
            print(f'Total length: {total_length}')
            dl = 0
            for chunk in r.iter_content(chunk_size=8192):
                dl += len(chunk)
                percent = round(dl / total_length) * 100
                f.write(chunk)
            done = True
    return f'tmp/{package_id}.zip'

@app.task()
def read_analytics_file(package_id, link):
    update_step(package_id, 'processing')
    update_progress(package_id, 0)

    analytics_line_count = 0
    
    join_voice_channels = []
    leave_voice_channels = []
    voice_channel_sessions = []

    with ZipFile(f'tmp/{package_id}.zip') as zip:
        for file_name in zip.namelist():
            if file_name.startswith('activity/analytics'):
                    for line in TextIOWrapper(zip.open(file_name)):
                        json = orjson.loads(line)
                        # count
                        analytics_line_count += 1
                        if json['event_type'] == 'join_voice_channel':
                            join_voice_channels.append(get_ts_string_parser(json['timestamp']))
                        elif json['event_type'] == 'leave_voice_channel':
                            leave_voice_channels.append(get_ts_string_parser(json['timestamp']))
            else:
                continue

    # calculate time spent in voice channels
    # sort join and leave timestamps
    join_voice_channels.sort()
    leave_voice_channels.sort()
    for i in range(len(join_voice_channels)):
        voice_channel_sessions.append({
            'timedelta': (leave_voice_channels[i] - join_voice_channels[i]).total_seconds(),
            'start_at': join_voice_channels[i]
        })
    
    print(f'Sessions spent in voice channels: {len(voice_channel_sessions)}')

    plaintext = orjson.dumps({
        'analytics_line_count': analytics_line_count,
        'voice_channel_sessions': voice_channel_sessions
    })

    key = extract_key_from_discord_link(link)
    data = cryptocode.decrypt(plaintext.decode(), key)

    session.add(SavedPackageData(package_id=package_id, data=data, created_at=datetime.now(), updated_at=datetime.now()))
    session.commit()

    update_step(package_id, 'done')

    return analytics_line_count

@app.task
def handle_package(package_id, link):
    ch = chain(
        download_file.si(package_id, link).set(queue='default'),
        read_analytics_file.si(package_id, link).set(queue='packages')
    )
    ch()

# todo
# verify that file exists before reading
# split tasks into smaller tasks