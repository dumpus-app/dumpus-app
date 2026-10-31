from support import env
from support.shapes import bearer, deleted_package, status, webhooks
from support.upstream import make_upn, package_id


def test_delete_without_authorization_is_an_empty_401(submit, client, postgres):
    package = submit('account_only')

    for headers in ({}, bearer(make_upn('someone-else'))):
        response = client.delete(f'/process/{package.package_id}', headers=headers)
        assert (response.status_code, response.data) == (401, b'')
    assert len(postgres.rows('SELECT * FROM package_process_status')) == 1


def test_delete_of_an_unknown_package(client, upstream):
    upn = make_upn('unknown')

    response = client.delete(f'/process/{package_id(upn)}', headers=bearer(upn))

    assert response.status_code == 200
    assert response.get_json() == {'isDeleted': False, 'errorMessageCode': 'UNKNOWN_PACKAGE_ID'}
    assert webhooks(upstream) == []


def test_delete_removes_every_row_of_the_package_but_not_its_blob(submit, client, postgres, upstream, s3):
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
    # The encrypted blob stays in S3, unreachable through the API.
    assert s3.head_object(Bucket=env.BUCKET, Key=f'packages/{package.package_id}.bin')
    assert client.get(f'/process/{package.package_id}/blob', headers=package.auth).status_code == 404
    assert client.get(f'/process/{package.package_id}/status', headers=package.auth).get_json() == status(
        errorMessageCode='UNKNOWN_PACKAGE_ID')
