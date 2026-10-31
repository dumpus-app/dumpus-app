import hashlib
import re
from datetime import datetime
from collections import Counter
import os
from urllib.parse import urlparse
import base64
import jwt
import requests

discord_link_regex = r'^https:\/\/click\.discord\.com\/ls\/click\?upn=([A-Za-z0-9-._]{500,})$'
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
    parsed = urlparse(link)
    part = parsed.path.strip('/')
    upn = base64.b64encode(part.encode('utf-8')).decode('utf-8')
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

def get_package_zip_path (package_id):
    return os.path.join('..', os.getenv('DL_ZIP_TMP_PATH'), f'{package_id}.zip')

def ts_included_in_range (ts, start_date, end_date):
    if not start_date:
        return ts <= end_date
    else:
        return start_date <= ts <= end_date

current_jwt = None
def generate_diswho_jwt():
    global current_jwt
    if not current_jwt:
        current_jwt = jwt.encode({
            'expirationTimestamp': (100 * 365 * 24 * 60 * 60 + int(datetime.now().timestamp())) * 1000
        }, os.getenv('DISWHO_JWT_SECRET'), algorithm="HS256")
    return current_jwt

def fetch_diswho_user(user_id):
    diswho_base_url = os.getenv('DISWHO_BASE_URL')
    if diswho_base_url:
        base_url = diswho_base_url + "/user"
        diswho_jwt = generate_diswho_jwt()
        auth = f"Bearer {diswho_jwt}"
    else:
        base_url = os.getenv('DISCORD_BASE_URL', 'https://discord.com/api/v8/users/')
        auth = f"Bot {os.getenv('DISCORD_BOT_TOKEN')}"

    headers = {
        'authorization': auth
    }

    r = requests.get(f'{base_url}/{user_id}', headers=headers)
    if r.status_code == 200:
        return r.json()
    else:
        return None


def fetch_discord_guild(guild_id):
    """Fetch a guild via the Discord bot API. Returns the parsed JSON or None on error."""
    bot_token = os.getenv('DISCORD_BOT_TOKEN')
    if not bot_token:
        return None
    r = requests.get(
        f'https://discord.com/api/v10/guilds/{guild_id}',
        params={'with_counts': 'true'},
        headers={'Authorization': f'Bot {bot_token}'},
        timeout=5,
    )
    if r.status_code != 200:
        return None
    return r.json()


def discord_icon_url(guild_id, icon_hash):
    if not icon_hash:
        return None
    ext = 'gif' if icon_hash.startswith('a_') else 'png'
    return f'https://cdn.discordapp.com/icons/{guild_id}/{icon_hash}.{ext}'
