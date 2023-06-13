import hashlib
import re
from datetime import datetime
from collections import Counter
import pandas as pd
import os
import base64

discord_link_regex = r'https:\/\/click\.discord\.com\/ls\/click\?upn=([A-Za-z0-9-_]{500,})'
dl_whitelisted_domains_raw = os.getenv('DL_ZIP_WHITELISTED_DOMAINS')
dl_whitelisted_domains = dl_whitelisted_domains_raw and dl_whitelisted_domains_raw.split(',') or []

def check_discord_link (link):
    if not re.match(discord_link_regex, link):
        return False
    return True

def check_whitelisted_link (link):
    return any([link.startswith(domain) for domain in dl_whitelisted_domains])

def extract_upn_from_discord_link (link):
    # get everything after first / and encode base64
    t = link.split('/')[1]
    t_bytes = t.encode('ascii')
    base64_bytes = base64.b64decode(t_bytes)
    upn = base64_bytes.decode('ascii')
    if re.match(discord_link_regex, link):
        upn = re.match(discord_link_regex, link).group(1)
    return upn

def extract_package_id_from_discord_link (link):
    upn = extract_upn_from_discord_link(link)
    return extract_package_id_from_upn(upn)

def extract_package_id_from_upn(upn):
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
    # Convert list of timestamps to a pandas Series
    timestamps_series = pd.Series(timestamps)
    # Convert timestamps to datetime and floor to nearest hour
    timestamps_hour = pd.to_datetime(timestamps_series, unit='s').dt.floor('H')
    # Count occurrences of each unique hour
    date_hour_counts = timestamps_hour.value_counts().to_dict()
    return date_hour_counts
