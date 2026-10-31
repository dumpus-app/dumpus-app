import json
from datetime import datetime

import jwt
import pytest

from support import env
from support.shapes import bearer
from support.upstream import make_upn, package_id

UPN = make_upn('user-lookups')
PACKAGE_ID = package_id(UPN)
USER_ID = '800000000000000001'
USER = {'id': USER_ID, 'username': 'synthetic_user', 'global_name': 'Synthetic User', 'avatar': 'a_feedc0de', 'discriminator': '0'}


@pytest.fixture
def known_package(postgres):
    postgres.insert_status(PACKAGE_ID, step='PROCESSED')


def lookup(client, user_id=USER_ID, headers=None):
    return client.get(f'/process/{PACKAGE_ID}/user/{user_id}', headers=bearer(UPN) if headers is None else headers)


def cached(postgres):
    return postgres.rows('SELECT user_id, payload, cached_at FROM cached_discord_user')


def test_user_lookup_without_authorization_is_401(client, known_package, upstream):
    for headers in ({}, bearer(make_upn('someone-else'))):
        response = lookup(client, headers=headers)
        assert (response.status_code, response.data) == (401, b'')
    assert upstream.received == []


def test_user_lookup_for_an_unknown_package_is_401(client, upstream):
    response = lookup(client)

    assert (response.status_code, response.data) == (401, b'')
    assert upstream.received == []


def test_first_lookup_asks_diswho_and_caches_the_user(client, known_package, upstream, postgres):
    upstream.users[USER_ID] = (200, USER)

    response = lookup(client)

    assert response.status_code == 200
    assert response.get_json() == {
        'user_id': USER_ID,
        'display_name': 'Synthetic User',
        'avatar_url': f'https://cdn.discordapp.com/avatars/{USER_ID}/a_feedc0de.gif',
        'username': 'synthetic_user',
    }
    (call,) = upstream.received
    assert (call.method, call.path) == ('GET', f'/diswho/user/{USER_ID}')
    scheme, token = call.headers['authorization'].split(' ')
    assert scheme == 'Bearer'
    claims = jwt.decode(token, env.DISWHO_JWT_SECRET, algorithms=['HS256'])
    assert list(claims) == ['expirationTimestamp']
    hundred_years_ms = 100 * 365 * 24 * 60 * 60 * 1000
    assert abs(claims['expirationTimestamp'] - (datetime.now().timestamp() * 1000 + hundred_years_ms)) < 24 * 3600 * 1000
    (row,) = cached(postgres)
    assert (row['user_id'], json.loads(row['payload'])) == (USER_ID, USER)


def test_cached_user_is_served_without_asking_diswho(client, known_package, upstream):
    upstream.users[USER_ID] = (200, USER)
    first = lookup(client).get_json()
    upstream.received.clear()

    assert lookup(client).get_json() == first
    assert upstream.received == []


def test_cache_older_than_a_day_is_refreshed(client, known_package, upstream, postgres):
    upstream.users[USER_ID] = (200, USER)
    lookup(client)
    postgres.execute("UPDATE cached_discord_user SET cached_at = now() - interval '25 hours'")
    upstream.users[USER_ID] = (200, {**USER, 'username': 'renamed_user'})

    response = lookup(client)

    assert response.get_json()['username'] == 'renamed_user'
    assert len(upstream.received) == 2
    (row,) = cached(postgres)
    assert json.loads(row['payload'])['username'] == 'renamed_user'


@pytest.mark.parametrize('status', [404, 429, 500])
def test_upstream_failure_is_an_empty_500_and_is_not_cached(client, known_package, upstream, postgres, status):
    upstream.users[USER_ID] = (status, {'message': 'synthetic failure'})

    response = lookup(client)

    assert (response.status_code, response.data) == (500, b'')
    assert cached(postgres) == []


def test_answer_without_username_is_served_but_not_cached(client, known_package, upstream, postgres):
    upstream.users[USER_ID] = (200, {'id': USER_ID, 'avatar': None})

    assert lookup(client).get_json() == {
        'user_id': USER_ID,
        'display_name': None,
        'avatar_url': f'https://cdn.discordapp.com/embed/avatars/{(int(USER_ID) >> 22) % 6}.png',
        'username': None,
    }
    assert cached(postgres) == []
    lookup(client)
    assert len(upstream.received) == 2


@pytest.mark.parametrize('avatar, discriminator, avatar_url', [
    ('a_feedc0de', '0', f'https://cdn.discordapp.com/avatars/{USER_ID}/a_feedc0de.gif'),
    ('feedc0de', '0', f'https://cdn.discordapp.com/avatars/{USER_ID}/feedc0de.webp'),
    (None, '1234', 'https://cdn.discordapp.com/embed/avatars/4.png'),
    (None, '0', f'https://cdn.discordapp.com/embed/avatars/{(int(USER_ID) >> 22) % 6}.png'),
    (None, None, f'https://cdn.discordapp.com/embed/avatars/{(int(USER_ID) >> 22) % 6}.png'),
])
def test_avatar_url(client, known_package, upstream, avatar, discriminator, avatar_url):
    upstream.users[USER_ID] = (200, {**USER, 'avatar': avatar, 'discriminator': discriminator, 'global_name': None})

    body = lookup(client).get_json()

    assert (body['avatar_url'], body['display_name']) == (avatar_url, None)


def test_without_diswho_the_discord_bot_api_is_asked(client, known_package, upstream, monkeypatch):
    monkeypatch.delenv('DISWHO_BASE_URL')
    monkeypatch.setenv('DISCORD_BOT_TOKEN', 'synthetic-bot-token')
    upstream.users[USER_ID] = (200, USER)

    assert lookup(client).status_code == 200

    (call,) = upstream.received
    # The default base URL ends with a slash and another one is added.
    assert (call.method, call.path) == ('GET', f'/discord/api/v8/users//{USER_ID}')
    assert call.headers['authorization'] == 'Bot synthetic-bot-token'
