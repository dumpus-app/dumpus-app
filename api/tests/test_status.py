import pytest

from support.shapes import bearer, processing_queue, status
from support.upstream import make_upn, package_id

UPN = make_upn('status')
PACKAGE_ID = package_id(UPN)


def get_status(client, headers, package=PACKAGE_ID):
    return client.get(f'/process/{package}/status', headers=headers)


def test_status_without_authorization_is_401(client):
    response = get_status(client, {})

    assert response.status_code == 401
    assert response.get_json() == status(errorMessageCode='UNAUTHORIZED')


def test_status_with_another_packages_upn_is_401(client, postgres):
    postgres.insert_status(PACKAGE_ID)

    response = get_status(client, bearer(make_upn('someone-else')))

    assert response.status_code == 401
    assert response.get_json() == status(errorMessageCode='UNAUTHORIZED')


def test_any_scheme_works_in_front_of_the_upn(client, postgres):
    postgres.insert_status(PACKAGE_ID)

    response = get_status(client, {'Authorization': f'Token {UPN}'})

    assert response.status_code == 200


def test_authorization_without_a_token_is_500(client):
    response = get_status(client, {'Authorization': 'Bearer'})

    assert response.status_code == 500
    assert response.get_json() == {'error': 'Internal server error.'}


def test_status_of_an_unknown_package(client):
    response = get_status(client, bearer(UPN))

    assert response.status_code == 200
    assert response.get_json() == status(errorMessageCode='UNKNOWN_PACKAGE_ID')


@pytest.mark.parametrize('step', ['LOCKED', 'DOWNLOADING', 'ANALYZING'])
def test_status_while_queued_or_processing(client, postgres, step):
    postgres.insert_status(package_id(make_upn('ahead')))
    postgres.insert_status(package_id(make_upn('ahead-but-failed')), step='DOWNLOADING', is_errored=True,
                           error_message_code='UNKNOWN_ERROR')
    postgres.insert_status(package_id(make_upn('ahead-but-done')), step='PROCESSED')
    postgres.insert_status(package_id(make_upn('ahead-premium')), is_upgraded=True)
    postgres.insert_status(PACKAGE_ID, step=step, progress=0, queue_standard_total_when_started=2)
    postgres.insert_status(package_id(make_upn('behind')))

    response = get_status(client, bearer(UPN))

    assert response.status_code == 200
    # "Ahead" counts every earlier unfinished package, premium ones included.
    assert response.get_json() == status(
        isProcessing=True,
        processingStep=step,
        processingQueuePosition=processing_queue(premium_total=1, standard_total=3, standard_user=2,
                                                 standard_when_joined=2),
    )


def test_status_of_an_upgraded_package(client, postgres):
    postgres.insert_status(package_id(make_upn('premium-ahead')), is_upgraded=True)
    postgres.insert_status(package_id(make_upn('standard-ahead')))
    postgres.insert_status(PACKAGE_ID, is_upgraded=True, queue_premium_total_when_started=5)

    response = get_status(client, bearer(UPN))

    assert response.get_json() == status(
        isUpgraded=True,
        isProcessing=True,
        processingStep='LOCKED',
        processingQueuePosition=processing_queue(premium_total=2, standard_total=1, premium_user=1,
                                                 standard_user=None, premium_when_joined=5),
    )


def test_status_of_a_processed_package(submit, client):
    package = submit('full')

    response = get_status(client, package.auth, package.package_id)

    assert response.status_code == 200
    assert response.get_json() == status(isDataAvailable=True, processingStep='PROCESSED')


@pytest.mark.parametrize('name, body, link_options, code, step', [
    ('full', None, {'expired': True}, 'EXPIRED_LINK', 'LOCKED'),
    ('full', None, {'content_type': 'text/html'}, 'INVALID_LINK', 'LOCKED'),
    ('missing_user', None, {}, 'MISSING_USER_DATA', 'ANALYZING'),
    ('corrupt', b'not a zip', {}, 'UNKNOWN_ERROR', 'ANALYZING'),
])
def test_status_of_an_errored_package(submit, client, name, body, link_options, code, step):
    package = submit(name, body, **link_options)

    response = get_status(client, package.auth, package.package_id)

    assert response.status_code == 200
    # Still "processing", at the step it failed in, with its queue position.
    assert response.get_json() == status(
        isErrored=True,
        errorMessageCode=code,
        isProcessing=True,
        processingStep=step,
        processingQueuePosition=processing_queue(standard_when_joined=1),
    )


def test_status_reads_the_latest_row(client, postgres):
    postgres.insert_status(PACKAGE_ID, step='PROCESSED')
    postgres.insert_status(PACKAGE_ID, step='DOWNLOADING')

    response = get_status(client, bearer(UPN))

    assert response.get_json()['processingStep'] == 'DOWNLOADING'


def test_status_of_the_demo_needs_authorization(client):
    assert get_status(client, {}, 'demo').status_code == 401
