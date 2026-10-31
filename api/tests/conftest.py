import base64
import gc
import os
from dataclasses import dataclass
from urllib.parse import urlsplit

import pytest

from support import env

env.prepare()

# Imported before any boto3 client exists, so moto can answer all of them.
import boto3  # noqa: E402
import requests  # noqa: E402
from moto import mock_aws  # noqa: E402

from support import blobs, packages, postgres as pg  # noqa: E402
from support.shapes import bearer  # noqa: E402
from support.upstream import RoutedRequests, Upstream, package_id  # noqa: E402


def pytest_sessionstart(session):
    # Before Postgres starts: without the binary, every package would fail as UNKNOWN_ERROR.
    if not (env.PROCESSOR and os.access(env.PROCESSOR, os.X_OK)):
        pytest.exit('`DUMPUS_PROCESSOR` must name a dumpus-processor binary: `make test` builds one from `processor/`',
                    returncode=4)


@pytest.fixture(scope='session')
def postgres():
    server = pg.start(env.API_DIR)
    yield server
    server.stop()


@pytest.fixture(scope='session')
def upstream():
    server = Upstream().start()
    yield server
    server.stop()


@pytest.fixture(scope='session')
def api(postgres, upstream, tmp_path_factory):
    """The API modules, imported once against the test Postgres and upstream."""
    env.configure(postgres_url=postgres.url, upstream_base=upstream.base, zip_dir=tmp_path_factory.mktemp('zips'))
    modules = env.import_api()
    routed = RoutedRequests(requests, upstream.base)
    modules.tasks.requests = routed
    modules.util.requests = routed
    postgres.install_step_log()
    # Keeps the per-test `gc.collect()` below from rescanning everything imported so far.
    gc.freeze()
    return modules


@pytest.fixture(scope='session')
def s3(api):
    return boto3.client('s3', region_name=env.REGION)


@pytest.fixture(autouse=True)
def isolation(api, postgres, upstream, s3, tmp_path, monkeypatch):
    # The API leaves some sessions open; collecting them hands their
    # connections back to the pool before the tables are cleared.
    gc.collect()
    postgres.clear()
    upstream.reset()
    zip_dir = tmp_path / 'zips'
    zip_dir.mkdir()
    monkeypatch.setenv('DL_ZIP_TMP_PATH', str(zip_dir))
    env.blocked.clear()
    with mock_aws():
        s3.create_bucket(Bucket=env.BUCKET, CreateBucketConfiguration={'LocationConstraint': env.REGION})
        yield
    assert not env.blocked, f'the test tried to reach {env.blocked}'


@pytest.fixture
def client(api):
    return api.app.app.test_client()


@pytest.fixture
def zip_dir(tmp_path):
    return tmp_path / 'zips'


@dataclass
class Submitted:
    name: str
    link: str
    upn: str
    package_id: str
    response: object

    @property
    def auth(self):
        return bearer(self.upn)


@pytest.fixture
def submit(client, upstream):
    """POST a synthetic package to `/process`. With `QUEUE_BACKEND=sync` it is processed before this returns."""

    def submit(name, body=None, *, whitelisted=False, expired=False, **link_options):
        body = packages.build(name) if body is None else body
        if whitelisted:
            link = upstream.whitelisted_link(name, body, **link_options)
            # For links that aren't Discord's, the API takes the URL path as the UPN.
            upn = base64.b64encode(urlsplit(link).path.strip('/').encode()).decode()
        else:
            link, upn = upstream.discord_link(name, body, **link_options)
            if expired:
                upstream.expire(name)
        response = client.post('/process', json={'package_link': link})
        return Submitted(name, link, upn, package_id(upn), response)

    return submit


@pytest.fixture
def stored(postgres, s3):
    """The SQLite a client gets for a processed package: S3 object, iv from Postgres, key from the UPN."""

    def stored(submitted):
        (row,) = postgres.rows('SELECT iv FROM saved_package_data WHERE package_id = %s', (submitted.package_id,))
        blob = s3.get_object(Bucket=env.BUCKET, Key=f'packages/{submitted.package_id}.bin')['Body'].read()
        return blobs.open_blob(blob, row['iv'], submitted.upn)

    return stored
