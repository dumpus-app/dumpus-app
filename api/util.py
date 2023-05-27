import hashlib
import re
from datetime import datetime
from collections import Counter

discord_link_regex = r'https:\/\/click\.discord\.com\/ls\/click\?upn=([A-Za-z0-9-_]{500,})'

def check_discord_link (link):
    if not re.match(discord_link_regex, link):
        return False
    return True

def extract_upn_from_discord_link (link):
    upn = re.match(discord_link_regex, link).group(1)
    return upn

def extract_package_id_from_discord_link (link):
    upn = extract_upn_from_discord_link(link)
    package_id = hashlib.md5(upn.encode('utf-8')).hexdigest()
    return package_id

def extract_key_from_discord_link (link):
    upn = extract_upn_from_discord_link(link)
    encrypt_key = upn
    return encrypt_key

def generate_avatar_url_from_user_id_avatar_hash (user_id, hash):
    if hash:
        extension = hash.startswith('a_') and 'gif' or 'jpg'
        return f'https://cdn.discordapp.com/avatars/{user_id}/{hash}.{extension}'
    return None

def ts_included_in_range (ts, start_date, end_date):
    if not start_date:
        return ts <= end_date
    else:
        return start_date <= ts <= end_date

def get_ts_string_parser(line):
    year, month, day = int(line[1:5]), int(line[6:8]), int(line[9:11])
    hour, minute = int(line[12:14]), int(line[15:17])

    return datetime(year=year, month=month, day=day, hour=hour, minute=minute)

def get_ts_regular_string_parser(line):
    year, month, day = int(line[0:4]), int(line[5:7]), int(line[8:10])
    hour, minute = int(line[11:13]), int(line[14:16])

    return datetime(year=year, month=month, day=day, hour=hour, minute=minute)

def count_dates_hours(timestamps):
    date_hour_counts = Counter()
    for ts in timestamps:
        dt = datetime.fromtimestamp(ts)
        # clear minutes, seconds and microseconds
        dt = dt.replace(minute=0, second=0, microsecond=0)
        # convert it back to timestamp
        timestamp_hour = dt.timestamp()
        date_hour_counts[timestamp_hour] += 1
    return dict(date_hour_counts)
