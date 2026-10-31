from botocore.exceptions import ClientError

from support import env
from support.shapes import bearer, deleted_package, status, webhooks
from support.upstream import make_upn, package_id


def blob_keys(s3):
    return [item['Key'] for item in s3.list_objects_v2(Bucket=env.BUCKET).get('Contents', [])]


def test_delete_without_authorization_is_an_empty_401(submit, client, postgres, s3):
    package = submit('account_only')

    for headers in ({}, bearer(make_upn('someone-else'))):
        response = client.delete(f'/process/{package.package_id}', headers=headers)
        assert (response.status_code, response.data) == (401, b'')
    assert len(postgres.rows('SELECT * FROM package_process_status')) == 1
    assert blob_keys(s3) == [f'packages/{package.package_id}.bin']


def test_delete_of_an_unknown_package(client, upstream):
    upn = make_upn('unknown')

    response = client.delete(f'/process/{package_id(upn)}', headers=bearer(upn))

    assert response.status_code == 200
    assert response.get_json() == {'isDeleted': False, 'errorMessageCode': 'UNKNOWN_PACKAGE_ID'}
    assert webhooks(upstream) == []


def test_delete_removes_every_row_and_the_blob_of_the_package(submit, client, postgres, upstream, s3):
    other = submit('account_only')
    submit('full', expired=True)
    package = submit('full')
    assert len(postgres.rows('SELECT * FROM package_process_status WHERE package_id = %s', (package.package_id,))) == 2

    response = client.delete(f'/process/{package.package_id}', headers=package.auth)

    assert response.status_code == 200
    assert response.get_json() == {'isDeleted': True, 'errorMessageCode': None}
    assert [row['package_id'] for row in postgres.rows('SELECT package_id FROM package_process_status')] == [other.package_id]
    assert [row['package_id'] for row in postgres.rows('SELECT package_id FROM saved_package_data')] == [other.package_id]
    assert webhooks(upstream)[-1] == deleted_package(package.package_id)
    assert blob_keys(s3) == [f'packages/{other.package_id}.bin']
    assert client.get(f'/process/{package.package_id}/blob', headers=package.auth).status_code == 404
    assert client.get(f'/process/{package.package_id}/status', headers=package.auth).get_json() == status(
        errorMessageCode='UNKNOWN_PACKAGE_ID')


def test_delete_of_a_package_without_a_blob(submit, client, postgres, s3):
    package = submit('full', expired=True)
    assert blob_keys(s3) == []

    response = client.delete(f'/process/{package.package_id}', headers=package.auth)

    assert response.status_code == 200
    assert response.get_json() == {'isDeleted': True, 'errorMessageCode': None}
    assert postgres.rows('SELECT * FROM package_process_status') == []


def test_delete_keeps_the_rows_when_s3_refuses_so_it_can_be_retried(api, submit, client, postgres, upstream, s3,
                                                                     monkeypatch):
    package = submit('full')

    def refuse(_package_id):
        raise ClientError({'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}, 'DeleteObject')

    with monkeypatch.context() as patched:
        patched.setattr(api.blob_storage, 'delete', refuse)
        refused = client.delete(f'/process/{package.package_id}', headers=package.auth)

    assert (refused.status_code, refused.get_json()) == (500, {'error': 'Internal server error.'})
    assert len(postgres.rows('SELECT * FROM package_process_status')) == 1
    assert len(postgres.rows('SELECT * FROM saved_package_data')) == 1
    assert blob_keys(s3) == [f'packages/{package.package_id}.bin']
    assert webhooks(upstream)[-1] != deleted_package(package.package_id)

    retried = client.delete(f'/process/{package.package_id}', headers=package.auth)

    assert retried.get_json() == {'isDeleted': True, 'errorMessageCode': None}
    assert blob_keys(s3) == []
    assert postgres.rows('SELECT * FROM package_process_status') == []
