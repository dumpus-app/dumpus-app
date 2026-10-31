import re

import pytest

from support import env, packages
from support.shapes import errored_package, existing_package, new_package, processed_package, webhooks
from support.upstream import make_upn, package_id


def status_row(postgres, row_id=None):
    rows = postgres.rows('SELECT * FROM package_process_status ORDER BY id')
    return rows if row_id is None else next(row for row in rows if row['id'] == row_id)


def row_without_times(row):
    assert row['created_at'] <= row['updated_at']
    return {key: value for key, value in row.items() if key not in ('created_at', 'updated_at')}


def processed_row(package_id, row_id=1, queue_total=1):
    return {
        'id': row_id,
        'package_id': package_id,
        'step': 'PROCESSED',
        # The worker never writes it.
        'progress': None,
        'queue_standard_total_when_started': queue_total,
        'queue_premium_total_when_started': 0,
        'queue_standard_total_when_upgraded': None,
        'queue_premium_total_when_upgraded': None,
        'is_upgraded': False,
        'is_errored': False,
        'error_message_code': None,
        'error_message_traceback': None,
        'is_cancelled': False,
    }


def test_discord_link_is_processed_end_to_end(submit, postgres, upstream, s3, stored, zip_dir):
    package = submit('full')

    assert package.response.status_code == 200
    assert package.response.get_json() == {'isAccepted': True, 'packageId': package.package_id, 'errorMessageCode': None}

    (row,) = status_row(postgres)
    assert row_without_times(row) == processed_row(package.package_id)
    assert postgres.steps(package.package_id) == ['LOCKED', 'DOWNLOADING', 'ANALYZING', 'PROCESSED']

    (saved,) = postgres.rows('SELECT * FROM saved_package_data')
    assert saved['package_id'] == package.package_id
    assert re.fullmatch(r'[0-9a-f]{32}', saved['iv'])

    keys = [item['Key'] for item in s3.list_objects_v2(Bucket=env.BUCKET)['Contents']]
    assert keys == [f'packages/{package.package_id}.bin']
    stored_object = s3.get_object(Bucket=env.BUCKET, Key=keys[0])
    assert stored_object['ContentType'] == 'application/octet-stream'
    assert stored_object['ContentLength'] % 16 == 0
    assert stored(package).startswith(b'SQLite format 3\x00')

    # A HEAD to check the link, then the download, both through Discord's redirect.
    assert upstream.calls() == [
        ('HEAD', '/click/ls/click'), ('HEAD', '/storage/full.zip'),
        ('GET', '/click/ls/click'), ('GET', '/storage/full.zip'),
    ]
    assert webhooks(upstream) == [new_package(package.package_id), processed_package(package.package_id)]
    assert list(zip_dir.iterdir()) == []


def test_package_id_is_the_md5_of_the_upn(submit):
    package = submit('account_only')

    assert package.response.get_json()['packageId'] == package_id(make_upn('account_only'))


def test_whitelisted_link_is_downloaded_without_the_link_check(submit, postgres, upstream):
    package = submit('full', whitelisted=True)

    assert package.response.get_json() == {'isAccepted': True, 'packageId': package.package_id, 'errorMessageCode': None}
    (row,) = status_row(postgres)
    assert row['step'] == 'PROCESSED'
    assert upstream.calls() == [('GET', '/whitelisted/full.zip')]


@pytest.mark.parametrize('link', [
    None,
    '',
    'https://example.com/package.zip',
    'https://click.discord.com/ls/click?upn=' + 'a' * 499,
    'http://click.discord.com/ls/click?upn=' + 'a' * 600,
    'https://click.discord.com/ls/click?upn=' + 'a' * 600 + '&utm=1',
    'https://click.discord.com/ls/click?upn=' + 'a' * 599 + '%',
])
def test_links_that_are_neither_discord_nor_whitelisted_are_refused(client, postgres, upstream, link):
    response = client.post('/process', json={'package_link': link})

    assert response.status_code == 200
    assert response.get_json() == {'isAccepted': False, 'packageId': None, 'errorMessageCode': 'INVALID_LINK'}
    assert status_row(postgres) == []
    assert upstream.received == []


def test_body_without_package_link_is_a_500(client):
    response = client.post('/process', json={'link': 'https://example.com'})

    assert response.status_code == 500
    assert response.get_json() == {'error': 'Internal server error.'}


def test_body_that_is_not_json_is_a_415(client):
    response = client.post('/process', data='package_link=x', content_type='application/x-www-form-urlencoded')

    assert response.status_code == 415


def test_malformed_json_is_a_400(client):
    response = client.post('/process', data='{"package_link":', content_type='application/json')

    assert response.status_code == 400


def assert_errored(postgres, upstream, package, code, steps, *, traceback=None):
    (row,) = status_row(postgres)
    assert row['is_errored'] is True
    assert row['error_message_code'] == code
    if traceback is None:
        assert row['error_message_traceback'] is None
    else:
        assert traceback in row['error_message_traceback']
    assert postgres.steps(package.package_id) == steps
    assert postgres.rows('SELECT * FROM saved_package_data') == []
    assert webhooks(upstream) == [new_package(package.package_id), errored_package(package.package_id, code)]


def test_expired_link_errors_as_expired_link(submit, postgres, upstream, s3, zip_dir):
    package = submit('full', expired=True)

    # The API accepts the link; the worker finds it expired.
    assert package.response.get_json() == {'isAccepted': True, 'packageId': package.package_id, 'errorMessageCode': None}
    assert_errored(postgres, upstream, package, 'EXPIRED_LINK', ['LOCKED'])
    assert upstream.calls() == [('HEAD', '/click/ls/click'), ('HEAD', '/storage/full.zip')]
    assert 'Contents' not in s3.list_objects_v2(Bucket=env.BUCKET)
    assert list(zip_dir.iterdir()) == []


def test_link_unknown_to_discord_errors_as_expired_link(client, postgres, upstream):
    upn = make_upn('never-registered')
    client.post('/process', json={'package_link': f'https://click.discord.com/ls/click?upn={upn}'})

    (row,) = status_row(postgres)
    assert (row['is_errored'], row['error_message_code']) == (True, 'EXPIRED_LINK')
    assert upstream.calls() == [('HEAD', '/click/ls/click')]


@pytest.mark.parametrize('link_options', [
    {'content_type': 'text/html; charset=utf-8'},
    {'status': 503},
])
def test_link_that_is_not_a_file_errors_as_invalid_link(submit, postgres, upstream, link_options):
    package = submit('full', **link_options)

    assert_errored(postgres, upstream, package, 'INVALID_LINK', ['LOCKED'])


def test_package_without_user_json_errors_as_missing_user_data(submit, postgres, upstream):
    package = submit('missing_user')

    assert_errored(postgres, upstream, package, 'MISSING_USER_DATA', ['LOCKED', 'DOWNLOADING', 'ANALYZING'])


def test_file_that_is_not_a_zip_errors_as_unknown_error_with_its_traceback(submit, postgres, upstream, zip_dir):
    package = submit('corrupt', b'this is not a zip file')

    assert_errored(postgres, upstream, package, 'UNKNOWN_ERROR', ['LOCKED', 'DOWNLOADING', 'ANALYZING'],
                   traceback='Exception: dumpus-processor exited 1')
    assert list(zip_dir.iterdir()) == []


def test_whitelisted_link_answering_404_is_saved_and_fails_as_unknown_error(submit, postgres, upstream):
    package = submit('gone', b'<html>Not Found</html>', whitelisted=True, status=404, content_type='text/html')

    assert_errored(postgres, upstream, package, 'UNKNOWN_ERROR', ['LOCKED', 'DOWNLOADING', 'ANALYZING'],
                   traceback='Exception: dumpus-processor exited 1')


def test_processed_package_is_not_processed_again(submit, postgres, upstream):
    first = submit('full')
    calls = upstream.calls()
    second = submit('full')

    assert second.response.status_code == 200
    assert second.response.get_json() == first.response.get_json()
    assert len(status_row(postgres)) == 1
    assert len(postgres.rows('SELECT * FROM saved_package_data')) == 1
    assert upstream.calls() == calls
    assert webhooks(upstream)[-1] == existing_package(first.package_id)


@pytest.mark.parametrize('step', ['LOCKED', 'DOWNLOADING', 'ANALYZING'])
def test_package_in_progress_is_not_queued_twice(client, postgres, upstream, step):
    upn = make_upn('in-progress')
    postgres.insert_status(package_id(upn), step=step)

    response = client.post('/process', json={'package_link': f'https://click.discord.com/ls/click?upn={upn}'})

    assert response.get_json() == {'isAccepted': True, 'packageId': package_id(upn), 'errorMessageCode': None}
    assert len(status_row(postgres)) == 1
    assert upstream.calls() == []
    assert webhooks(upstream) == [existing_package(package_id(upn))]


def test_errored_package_is_queued_again(submit, client, postgres, upstream):
    failed = submit('full', expired=True)
    retried = submit('full')

    assert retried.response.get_json() == {'isAccepted': True, 'packageId': failed.package_id, 'errorMessageCode': None}
    first, second = status_row(postgres)
    assert (first['id'], first['step'], first['is_errored'], first['error_message_code']) == (1, 'LOCKED', True, 'EXPIRED_LINK')
    # The errored row no longer counts in the queue the retry joins.
    assert row_without_times(second) == processed_row(failed.package_id, row_id=2, queue_total=1)
    assert webhooks(upstream) == [
        new_package(failed.package_id), errored_package(failed.package_id, 'EXPIRED_LINK'),
        new_package(failed.package_id), processed_package(failed.package_id),
    ]
    status = client.get(f'/process/{failed.package_id}/status', headers=retried.auth).get_json()
    assert (status['isDataAvailable'], status['isErrored']) == (True, False)


def test_cancelled_package_is_queued_again(submit, postgres, upstream):
    upn = make_upn('full')
    postgres.insert_status(package_id(upn), step='DOWNLOADING', is_cancelled=True)

    submit('full')

    first, second = status_row(postgres)
    assert (first['step'], first['is_cancelled']) == ('DOWNLOADING', True)
    assert (second['step'], second['is_cancelled']) == ('PROCESSED', False)
    assert webhooks(upstream)[0] == new_package(package_id(upn))


def test_queue_size_is_recorded_when_a_package_joins(submit, postgres):
    for name in ('queued-a', 'queued-b'):
        postgres.insert_status(package_id(make_upn(name)))
    postgres.insert_status(package_id(make_upn('done')), step='PROCESSED')
    postgres.insert_status(package_id(make_upn('failed')), is_errored=True, error_message_code='UNKNOWN_ERROR')
    postgres.insert_status(package_id(make_upn('premium')), is_upgraded=True)

    package = submit('account_only')

    row = next(row for row in status_row(postgres) if row['package_id'] == package.package_id)
    # Standard: itself and the two queued ahead. Premium: the upgraded one.
    assert (row['queue_standard_total_when_started'], row['queue_premium_total_when_started']) == (3, 1)


def test_zip_already_in_the_tmp_dir_is_used_instead_of_downloading(client, postgres, upstream, zip_dir):
    upn = make_upn('full')
    (zip_dir / f'{package_id(upn)}.zip').write_bytes(packages.build('full'))

    client.post('/process', json={'package_link': f'https://click.discord.com/ls/click?upn={upn}'})

    (row,) = status_row(postgres)
    assert row['step'] == 'PROCESSED'
    assert postgres.steps(package_id(upn)) == ['LOCKED', 'ANALYZING', 'PROCESSED']
    assert upstream.calls() == []
    assert list(zip_dir.iterdir()) == []
