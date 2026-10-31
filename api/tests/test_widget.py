import pytest

GUILD_ID = '300000000000000001'


@pytest.fixture
def bot_token(monkeypatch):
    monkeypatch.setenv('DISCORD_BOT_TOKEN', 'synthetic-bot-token')


def test_guild_id_must_be_digits(client, upstream):
    response = client.get('/widget/not-a-guild')

    assert response.status_code == 400
    assert response.get_json() == {'error': 'invalid guild id'}
    assert upstream.received == []


def test_without_a_bot_token_every_guild_is_not_found(client, upstream):
    response = client.get(f'/widget/{GUILD_ID}')

    assert response.status_code == 404
    assert response.get_json() == {'error': 'guild not found or bot lacks access'}
    assert upstream.received == []


def test_widget_of_a_guild_the_bot_sees(client, upstream, bot_token):
    upstream.guilds[GUILD_ID] = (200, {'id': GUILD_ID, 'name': 'Synthetic Guild', 'icon': 'a_c0ffee', 'approximate_member_count': 42})

    response = client.get(f'/widget/{GUILD_ID}')

    assert response.status_code == 200
    assert response.get_json() == {
        'name': 'Synthetic Guild',
        'icon_url': f'https://cdn.discordapp.com/icons/{GUILD_ID}/a_c0ffee.gif',
        'member_count': 42,
    }
    (call,) = upstream.received
    assert (call.method, call.path, call.query) == ('GET', f'/discord/api/v10/guilds/{GUILD_ID}', {'with_counts': ['true']})
    assert call.headers['Authorization'] == 'Bot synthetic-bot-token'


@pytest.mark.parametrize('guild, expected', [
    ({'name': 'Static', 'icon': 'c0ffee', 'approximate_member_count': 7},
     {'name': 'Static', 'icon_url': f'https://cdn.discordapp.com/icons/{GUILD_ID}/c0ffee.png', 'member_count': 7}),
    ({'name': 'No icon, no count', 'icon': None}, {'name': 'No icon, no count', 'icon_url': None, 'member_count': 0}),
])
def test_widget_icon_and_member_count(client, upstream, bot_token, guild, expected):
    upstream.guilds[GUILD_ID] = (200, guild)

    assert client.get(f'/widget/{GUILD_ID}').get_json() == expected


@pytest.mark.parametrize('status', [403, 404, 500])
def test_guild_the_bot_cant_see_is_not_found(client, upstream, bot_token, status):
    upstream.guilds[GUILD_ID] = (status, {'message': 'Missing Access', 'code': 50001})

    response = client.get(f'/widget/{GUILD_ID}')

    assert response.status_code == 404
    assert response.get_json() == {'error': 'guild not found or bot lacks access'}
