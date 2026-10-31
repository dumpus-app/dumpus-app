"""Helpers whose output lands in the database or the envelope, pinned on their own
so a change shows up here before it blurs into a golden."""
import jwt
import pytest

from support import env

UPN = 'synthetic-upn-for-the-known-answer-test'


@pytest.mark.parametrize('plaintext, ciphertext', [
    (b'dumpus characterization', '6f3ee0e91b939921206b07ece6e8aefd687f37557cd7c4275e0cb368313e49fe'),
    # A full block still gets a block of padding.
    (b'0123456789abcdef', '0312b72f75ae41e38ba29fe6581a05eb2521bdc67c2721bf22af881a6c892ea0'),
])
def test_encryption_matches_openssl(api, monkeypatch, plaintext, ciphertext):
    # Expected values from `openssl enc -aes-256-cbc -K <sha256 of the UPN> -iv 000102...0f`.
    monkeypatch.setattr(api.crypto.os, 'urandom', lambda size: bytes(range(size)))

    data, iv = api.crypto.encrypt_sqlite_data(plaintext, UPN)

    assert iv == bytes(range(16))
    assert data.hex() == ciphertext


def test_encryption_draws_a_fresh_iv(api):
    first = api.crypto.encrypt_sqlite_data(b'same input', UPN)
    second = api.crypto.encrypt_sqlite_data(b'same input', UPN)

    assert first[1] != second[1] and first[0] != second[0]


@pytest.mark.parametrize('link, valid', [
    ('https://click.discord.com/ls/click?upn=' + 'a' * 500, True),
    ('https://click.discord.com/ls/click?upn=' + 'Az09-._' * 80, True),
    ('https://click.discord.com/ls/click?upn=' + 'a' * 499, False),
    ('https://click.discord.com/ls/click?upn=' + 'a' * 500 + '=', False),
])
def test_discord_link_check(api, link, valid):
    assert api.util.check_discord_link(link) is valid


def test_key_and_package_id_of_a_discord_link(api):
    upn = 'b' * 600
    link = f'https://click.discord.com/ls/click?upn={upn}'

    assert api.util.extract_key_from_discord_link(link) == upn
    # `md5` of the UPN.
    assert api.util.extract_package_id_from_discord_link(link) == '95a13d4df13e9b2c95fb54d06d74ebaf'


def test_key_of_any_other_link_is_its_base64_path(api):
    assert api.util.extract_key_from_discord_link('https://files.example/a/b.zip?sig=1') == 'YS9iLnppcA=='


def test_whitelist_is_a_prefix_match(api):
    whitelisted = api.util.dl_whitelisted_domains[0]

    assert api.util.check_whitelisted_link(whitelisted + 'anything.zip') is True
    assert api.util.check_whitelisted_link(whitelisted[:-1]) is False


def test_diswho_token_is_signed_with_the_secret(api):
    claims = jwt.decode(api.util.generate_diswho_jwt(), env.DISWHO_JWT_SECRET, algorithms=['HS256'])

    assert list(claims) == ['expirationTimestamp']
    assert isinstance(claims['expirationTimestamp'], int)
