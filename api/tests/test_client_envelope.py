"""Blobs opened by the app's own algorithm, in Node: `tests/client/open-blob.mjs`.

Skipped when `node` or the client's `node_modules` are missing, unless
`DUMPUS_REQUIRE_CLIENT=1` (CI), where that fails instead.
"""
import json
import os
import shutil
import subprocess

import pytest
import requests

from support import blobs, env
from support.upstream import make_upn

CLIENT_DIR = env.API_DIR / 'tests' / 'client'


@pytest.fixture
def node():
    node = shutil.which('node')
    missing = None
    if not node:
        missing = '`node` is not installed'
    elif not (CLIENT_DIR / 'node_modules').is_dir():
        missing = 'the client check needs `npm ci --prefix tests/client`'
    if missing:
        if os.environ.get('DUMPUS_REQUIRE_CLIENT') == '1':
            pytest.fail(missing)
        pytest.skip(missing)
    return node


def open_in_client(node, tmp_path, blob, *key):
    path = tmp_path / 'blob.bin'
    path.write_bytes(blob)
    return subprocess.run([node, str(CLIENT_DIR / 'open-blob.mjs'), str(path), *key],
                          capture_output=True, text=True, timeout=60)


def python_view(sqlite_bytes):
    tables, _ = blobs.read_tables(sqlite_bytes)
    return {
        'tables': {name: len(table['rows']) for name, table in tables.items()},
        'package_data': blobs.as_dicts(tables['package_data'])[0],
    }


def download(client, package_id, headers=None):
    body = client.get(f'/process/{package_id}/blob', headers=headers or {}).get_json()
    return requests.get(body['url']).content, body['iv']


def test_client_opens_a_processed_package(node, submit, client, tmp_path):
    package = submit('full')
    blob, iv = download(client, package.package_id, package.auth)

    opened = open_in_client(node, tmp_path, blob, iv, package.upn)

    assert opened.returncode == 0, opened.stderr
    assert json.loads(opened.stdout) == python_view(blobs.open_blob(blob, iv, package.upn))


def test_client_opens_the_demo_without_a_key(node, client, tmp_path):
    blob, iv = download(client, 'demo')
    assert iv is None

    opened = open_in_client(node, tmp_path, blob)

    assert opened.returncode == 0, opened.stderr
    assert json.loads(opened.stdout) == python_view(blobs.open_blob(blob, None, None))


def test_client_cannot_open_a_package_with_another_upn(node, submit, client, tmp_path):
    package = submit('account_only')
    blob, iv = download(client, package.package_id, package.auth)

    opened = open_in_client(node, tmp_path, blob, iv, make_upn('someone-else'))

    assert opened.returncode != 0
