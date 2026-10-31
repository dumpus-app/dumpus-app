import re
from urllib.parse import parse_qs, urlsplit

import requests

from support import blobs, env
from support.shapes import bearer
from support.upstream import make_upn, package_id

SIGNED_PARAMS = {
    'X-Amz-Algorithm', 'X-Amz-Credential', 'X-Amz-Date', 'X-Amz-Expires',
    'X-Amz-SignedHeaders', 'X-Amz-Security-Token', 'X-Amz-Signature',
}


def assert_presigned(url, key, ttl):
    parts = urlsplit(url)
    assert (parts.scheme, parts.netloc, parts.path) == ('https', f'{env.BUCKET}.s3.{env.REGION}.amazonaws.com', f'/{key}')
    query = parse_qs(parts.query)
    assert set(query) == SIGNED_PARAMS
    assert query['X-Amz-Algorithm'] == ['AWS4-HMAC-SHA256']
    assert query['X-Amz-Expires'] == [str(ttl)]
    assert query['X-Amz-SignedHeaders'] == ['host']
    assert re.fullmatch(rf'[^/]+/\d{{8}}/{env.REGION}/s3/aws4_request', query['X-Amz-Credential'][0])


def test_blob_of_a_processed_package(submit, client, postgres, s3):
    package = submit('full')

    response = client.get(f'/process/{package.package_id}/blob', headers=package.auth)

    assert response.status_code == 200
    body = response.get_json()
    (saved,) = postgres.rows('SELECT iv FROM saved_package_data')
    assert body == {'url': body['url'], 'iv': saved['iv'], 'ttl': 300}
    assert re.fullmatch(r'[0-9a-f]{32}', body['iv'])
    assert_presigned(body['url'], f'packages/{package.package_id}.bin', 300)

    # What the client does next: fetch the URL as is, decrypt with its UPN.
    download = requests.get(body['url'])
    assert download.status_code == 200
    assert download.content == s3.get_object(Bucket=env.BUCKET, Key=f'packages/{package.package_id}.bin')['Body'].read()
    assert blobs.open_blob(download.content, body['iv'], package.upn).startswith(b'SQLite format 3\x00')


def test_presigned_url_lifetime_comes_from_the_environment(submit, client, monkeypatch):
    package = submit('account_only')
    monkeypatch.setenv('PACKAGE_DATA_PRESIGNED_URL_TTL_SECONDS', '120')

    body = client.get(f'/process/{package.package_id}/blob', headers=package.auth).get_json()

    assert body['ttl'] == 120
    assert_presigned(body['url'], f'packages/{package.package_id}.bin', 120)


def test_blob_without_authorization_is_an_empty_401(submit, client):
    package = submit('account_only')

    for headers in ({}, bearer(make_upn('someone-else'))):
        response = client.get(f'/process/{package.package_id}/blob', headers=headers)
        assert (response.status_code, response.data) == (401, b'')


def test_blob_of_an_unknown_package_is_an_empty_404(client):
    upn = make_upn('unknown')

    response = client.get(f'/process/{package_id(upn)}/blob', headers=bearer(upn))

    assert (response.status_code, response.data) == (404, b'')


def test_blob_missing_from_s3_is_a_404(submit, client, s3):
    package = submit('account_only')
    s3.delete_object(Bucket=env.BUCKET, Key=f'packages/{package.package_id}.bin')

    response = client.get(f'/process/{package.package_id}/blob', headers=package.auth)

    assert (response.status_code, response.data) == (404, b'')


def test_blob_in_s3_without_a_saved_row_is_a_404(client, s3):
    upn = make_upn('orphan-blob')
    s3.put_object(Bucket=env.BUCKET, Key=f'packages/{package_id(upn)}.bin', Body=b'0' * 32)

    response = client.get(f'/process/{package_id(upn)}/blob', headers=bearer(upn))

    assert response.status_code == 404


def test_blob_hands_out_the_latest_iv(submit, client, postgres):
    package = submit('account_only')
    postgres.execute(
        "INSERT INTO saved_package_data (package_id, iv, created_at, updated_at) "
        "VALUES (%s, 'ffffffffffffffffffffffffffffffff', now() + interval '1 hour', now())",
        (package.package_id,))

    body = client.get(f'/process/{package.package_id}/blob', headers=package.auth).get_json()

    assert body['iv'] == 'f' * 32


DEMO_ROWS = {
    'activity': 5000,
    'dm_channels_data': 100,
    'guild_channels_data': 100,
    'guilds': 100,
    'package_data': 1,
    'payments': 0,
    'sessions': 10000,
    'voice_sessions': 100,
}


def test_demo_blob_is_seeded_once_and_served_unencrypted(client, s3):
    response = client.get('/process/demo/blob')

    assert response.status_code == 200
    body = response.get_json()
    assert body == {'url': body['url'], 'iv': None, 'ttl': 300}
    assert_presigned(body['url'], 'packages/demo.bin', 300)

    seeded = s3.get_object(Bucket=env.BUCKET, Key='packages/demo.bin')
    assert seeded['ContentType'] == 'application/octet-stream'
    tables, indexes = blobs.read_tables(blobs.open_blob(requests.get(body['url']).content, None, None))
    assert {name: len(table['rows']) for name, table in tables.items()} == DEMO_ROWS
    assert indexes == []
    (package_data,) = blobs.as_dicts(tables['package_data'])
    assert re.fullmatch(r'\d{18}', package_data.pop('package_owner_id'))
    assert package_data == {
        'package_id': 'demo',
        'package_version': '0.1.0',
        'package_owner_name': 'wumpus',
        'package_owner_display_name': 'Wumpus',
        'package_owner_avatar_url': 'https://cdn.discordapp.com/embed/avatars/0.png',
        'package_is_partial': 0,
    }

    # The demo is random: a second upload would change the object.
    assert client.get('/process/demo/blob').status_code == 200
    assert s3.head_object(Bucket=env.BUCKET, Key='packages/demo.bin')['ETag'] == seeded['ETag']


def test_existing_demo_blob_is_left_alone(client, s3):
    s3.put_object(Bucket=env.BUCKET, Key='packages/demo.bin', Body=b'already there')

    client.get('/process/demo/blob')

    assert s3.get_object(Bucket=env.BUCKET, Key='packages/demo.bin')['Body'].read() == b'already there'
