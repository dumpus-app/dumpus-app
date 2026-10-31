"""Process-wide setup that has to happen before the API modules are imported.

`db.py` connects and migrates at import, `util.py` reads the link whitelist
at import, and `tasks.py` calls `load_dotenv()`, so the environment is fixed
here once for the whole run.
"""
import importlib
import ipaddress
import os
import socket
import sys
import time
from pathlib import Path
from types import SimpleNamespace

API_DIR = Path(__file__).resolve().parents[2]
# Lets the suite run unchanged against another checkout's sources, for eg. a
# branch in its own worktree: `DUMPUS_API_SRC=../other/api/src make test`.
SRC_DIR = Path(os.environ.get('DUMPUS_API_SRC') or API_DIR / 'src').resolve()
# The dumpus-processor binary the worker runs, which `make test` builds from `processor/`.
PROCESSOR = os.environ.get('DUMPUS_PROCESSOR')

REGION = 'eu-west-1'
BUCKET = 'dumpus-test-packages'
DISWHO_JWT_SECRET = 'synthetic-diswho-secret'

API_MODULES = ('app', 'tasks', 'db', 'util', 'crypto', 'blob_storage', 'enqueue', 'sqlite', 'wh')

# Read by the code under test or by botocore, and meant to be unset. They are
# set to "" while the API is imported, so `load_dotenv()` can't fill them from
# a developer's `.env`, then removed.
UNSET = (
    'DISCORD_BASE_URL',
    'DISCORD_BOT_TOKEN',
    'SQS_QUEUE_URL',
    'SECRETS_ARN_MAP',
    'PACKAGE_DATA_PRESIGNED_URL_TTL_SECONDS',
    'AWS_PROFILE',
    'AWS_DEFAULT_PROFILE',
    'AWS_ENDPOINT_URL',
    'AWS_ENDPOINT_URL_S3',
    'AWS_ENDPOINT_URL_SQS',
    'AWS_ENDPOINT_URL_ECS',
    'AWS_ENDPOINT_URL_SECRETS_MANAGER',
)

blocked = []


class NetworkBlocked(RuntimeError):
    pass


def _is_loopback(host):
    if isinstance(host, bytes):
        host = host.decode()
    if host == 'localhost':
        return True
    try:
        return ipaddress.ip_address(str(host).split('%')[0]).is_loopback
    except ValueError:
        return False


def _guard_network():
    """Refuse any connection or DNS lookup that isn't loopback.

    The local Postgres and the fake upstream are on loopback, moto answers
    boto3 in process, so anything else is a call to the real AWS or Discord.
    The error isn't an `OSError`, so `requests` and `urllib3` let it through.
    """
    connect, connect_ex, getaddrinfo = socket.socket.connect, socket.socket.connect_ex, socket.getaddrinfo

    def check(target):
        if not _is_loopback(target):
            blocked.append(target)
            raise NetworkBlocked(f'the test suite only talks to local services, not {target!r}')

    def guarded_connect(self, address):
        if self.family in (socket.AF_INET, socket.AF_INET6):
            check(address[0])
        return connect(self, address)

    def guarded_connect_ex(self, address):
        if self.family in (socket.AF_INET, socket.AF_INET6):
            check(address[0])
        return connect_ex(self, address)

    def guarded_getaddrinfo(host, *args, **kwargs):
        if host is not None:
            check(host)
        return getaddrinfo(host, *args, **kwargs)

    socket.socket.connect = guarded_connect
    socket.socket.connect_ex = guarded_connect_ex
    socket.getaddrinfo = guarded_getaddrinfo


def prepare():
    # Production runs in UTC, and the worker turns naive datetimes into epochs
    # with the local zone, so the goldens only hold in UTC.
    os.environ['TZ'] = 'UTC'
    time.tzset()
    if str(SRC_DIR) not in sys.path:
        sys.path.insert(0, str(SRC_DIR))
    _guard_network()


def configure(*, postgres_url, upstream_base, zip_dir):
    os.environ.update({
        'POSTGRES_URL': postgres_url,
        'QUEUE_BACKEND': 'sync',
        'DL_ZIP_TMP_PATH': str(zip_dir),
        'DL_ZIP_WHITELISTED_DOMAINS': f'{upstream_base}/whitelisted/',
        'WH_URL': f'{upstream_base}/webhook',
        'DISWHO_BASE_URL': f'{upstream_base}/diswho',
        'DISWHO_JWT_SECRET': DISWHO_JWT_SECRET,
        'PACKAGE_DATA_BUCKET': BUCKET,
        'AWS_REGION': REGION,
        'AWS_DEFAULT_REGION': REGION,
        'AWS_ACCESS_KEY_ID': 'testing',
        'AWS_SECRET_ACCESS_KEY': 'testing',
        # Lambda and Fargate run on role credentials, which carry a token.
        'AWS_SESSION_TOKEN': 'testing',
        'AWS_CONFIG_FILE': os.devnull,
        'AWS_SHARED_CREDENTIALS_FILE': os.devnull,
        'NO_PROXY': '127.0.0.1,localhost,::1',
        'no_proxy': '127.0.0.1,localhost,::1',
    })
    for name in UNSET:
        os.environ[name] = ''


def import_api():
    before = set(os.environ)
    modules = {name: importlib.import_module(name) for name in API_MODULES}
    for name in set(os.environ) - before:
        del os.environ[name]
    for name in UNSET:
        os.environ.pop(name, None)
    return SimpleNamespace(**modules)
