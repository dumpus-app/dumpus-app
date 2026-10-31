"""How production runs the code: API Gateway to `lambda_handlers.api`, SQS to
`lambda_handlers.forwarder`, ECS to `worker_main`, plus `waitress-serve`,
the command of `Dockerfile.api`."""
import importlib
import json
import os
import socket
import subprocess
import sys
import time

import boto3
import pytest
import requests
from botocore.stub import Stubber

from support import env, packages
from support.upstream import make_upn, package_id

FORWARDER_ENV = {
    'ECS_CLUSTER': 'dumpus-test',
    'ECS_TASK_DEFINITION': 'dumpus-test-worker',
    'ECS_CONTAINER_NAME': 'worker',
    'ECS_SUBNETS': 'subnet-0001,subnet-0002',
    'ECS_SECURITY_GROUPS': 'sg-0001',
}


def http_api_event(method, path, *, headers=None, body=None):
    """An API Gateway HTTP API event, payload format 2.0 (`infra/terraform/apigw.tf`)."""
    return {
        'version': '2.0',
        'routeKey': '$default',
        'rawPath': path,
        'rawQueryString': '',
        'headers': {'host': 'api.dumpus.app', 'x-forwarded-proto': 'https', 'x-forwarded-port': '443', **(headers or {})},
        'requestContext': {
            'accountId': '000000000000',
            'apiId': 'synthetic',
            'domainName': 'api.dumpus.app',
            'http': {'method': method, 'path': path, 'protocol': 'HTTP/1.1', 'sourceIp': '203.0.113.7', 'userAgent': 'synthetic'},
            'requestId': 'synthetic-request',
            'routeKey': '$default',
            'stage': '$default',
        },
        'body': body,
        'isBase64Encoded': False,
    }


@pytest.fixture
def lambda_api(api):
    return importlib.import_module('lambda_handlers.api').handler


@pytest.fixture
def queue(monkeypatch):
    sqs = boto3.client('sqs', region_name=env.REGION)
    url = sqs.create_queue(QueueName='dumpus-test-packages')['QueueUrl']
    monkeypatch.setenv('QUEUE_BACKEND', 'sqs')
    monkeypatch.setenv('SQS_QUEUE_URL', url)
    return sqs, url


@pytest.fixture
def forwarder(api, monkeypatch):
    for name, value in FORWARDER_ENV.items():
        monkeypatch.setenv(name, value)
    # It reads its configuration and makes its ECS client at import.
    sys.modules.pop('lambda_handlers.forwarder', None)
    module = importlib.import_module('lambda_handlers.forwarder')
    with Stubber(module.ecs) as stubber:
        yield module, stubber
        stubber.assert_no_pending_responses()


# What RunTask answers when it starts the task.
STARTED = {'tasks': [{'taskArn': 'arn:aws:ecs:eu-west-1:000000000000:task/dumpus-test/0123456789abcdef'}], 'failures': []}


def run_task_params(status_id, package, link):
    return {
        'cluster': 'dumpus-test',
        'taskDefinition': 'dumpus-test-worker',
        'launchType': 'FARGATE',
        'networkConfiguration': {'awsvpcConfiguration': {
            'subnets': ['subnet-0001', 'subnet-0002'], 'securityGroups': ['sg-0001'], 'assignPublicIp': 'DISABLED'}},
        'overrides': {'containerOverrides': [{'name': 'worker', 'environment': [
            {'name': 'PACKAGE_STATUS_ID', 'value': str(status_id)},
            {'name': 'PACKAGE_ID', 'value': package},
            {'name': 'PACKAGE_LINK', 'value': link},
        ]}]},
    }


def test_lambda_handler_answers_api_gateway(lambda_api):
    response = lambda_api(http_api_event('GET', '/health', headers={'origin': 'https://web.dumpus.app'}), None)

    assert response == {
        'statusCode': 200,
        'cookies': [],
        'headers': {
            'content-type': 'application/json',
            'content-length': response['headers']['content-length'],
            'access-control-allow-origin': 'https://web.dumpus.app',
            'vary': 'Origin',
        },
        'isBase64Encoded': False,
        'body': response['body'],
    }
    assert json.loads(response['body']) == {'status': 'alive', 'hostname': socket.gethostname()}


def test_lambda_handler_passes_empty_error_bodies_through(lambda_api):
    upn = make_upn('lambda')

    response = lambda_api(http_api_event('GET', f'/process/{package_id(upn)}/blob'), None)

    assert response == {
        'statusCode': 401,
        'cookies': [],
        'headers': {'content-type': 'text/html; charset=utf-8', 'content-length': '0', 'access-control-allow-origin': '*'},
        'isBase64Encoded': False,
        'body': '',
    }


def test_package_goes_from_api_gateway_through_sqs_and_ecs_to_the_worker(
        lambda_api, queue, forwarder, upstream, postgres, monkeypatch):
    sqs, queue_url = queue
    module, ecs = forwarder
    link, upn = upstream.discord_link('full', packages.build('full'))
    package = package_id(upn)

    accepted = lambda_api(http_api_event('POST', '/process', headers={'content-type': 'application/json'},
                                         body=json.dumps({'package_link': link})), None)

    assert accepted['statusCode'] == 200
    assert json.loads(accepted['body']) == {'isAccepted': True, 'packageId': package, 'errorMessageCode': None}
    assert postgres.steps(package) == ['LOCKED']
    assert upstream.calls() == []
    (message,) = sqs.receive_message(QueueUrl=queue_url, MaxNumberOfMessages=10)['Messages']
    assert json.loads(message['Body']) == {'package_status_id': 1, 'package_id': package, 'link': link}

    ecs.add_response('run_task', STARTED, run_task_params(1, package, link))
    assert module.handler({'Records': [{'messageId': message['MessageId'], 'body': message['Body']}]}, None) == {
        'batchItemFailures': []}

    # ECS starts the worker with the overrides above as its environment.
    for name, value in (('PACKAGE_STATUS_ID', '1'), ('PACKAGE_ID', package), ('PACKAGE_LINK', link)):
        monkeypatch.setenv(name, value)
    assert importlib.import_module('worker_main').main() == 0

    assert postgres.steps(package) == ['LOCKED', 'DOWNLOADING', 'ANALYZING', 'PROCESSED']
    auth = {'authorization': f'Bearer {upn}'}
    status = json.loads(lambda_api(http_api_event('GET', f'/process/{package}/status', headers=auth), None)['body'])
    assert (status['isDataAvailable'], status['processingStep']) == (True, 'PROCESSED')
    blob = json.loads(lambda_api(http_api_event('GET', f'/process/{package}/blob', headers=auth), None)['body'])
    assert requests.get(blob['url']).status_code == 200


def test_forwarder_reports_the_records_it_could_not_start(forwarder):
    module, ecs = forwarder
    good = {'package_status_id': 7, 'package_id': 'a' * 32, 'link': 'https://click.discord.com/ls/click?upn=x'}
    params = run_task_params(7, 'a' * 32, good['link'])
    ecs.add_client_error('run_task', service_error_code='ClientException', http_status_code=400)
    ecs.add_response('run_task', {'tasks': [], 'failures': [{'reason': 'RESOURCE:ENI'}]}, params)
    ecs.add_response('run_task', {'tasks': [], 'failures': []}, params)
    ecs.add_response('run_task', STARTED, params)

    result = module.handler({'Records': [
        {'messageId': 'not-json', 'body': '{'},
        {'messageId': 'run-task-fails', 'body': json.dumps(good)},
        {'messageId': 'no-capacity', 'body': json.dumps(good)},
        {'messageId': 'no-task', 'body': json.dumps(good)},
        {'messageId': 'started', 'body': json.dumps(good)},
    ]}, None)

    assert result == {'batchItemFailures': [
        {'itemIdentifier': 'not-json'}, {'itemIdentifier': 'run-task-fails'},
        {'itemIdentifier': 'no-capacity'}, {'itemIdentifier': 'no-task'},
    ]}


@pytest.fixture
def worker(api, monkeypatch):
    def run(status_id, package, link):
        for name, value in (('PACKAGE_STATUS_ID', str(status_id)), ('PACKAGE_ID', package), ('PACKAGE_LINK', link)):
            monkeypatch.setenv(name, value)
        return importlib.import_module('worker_main').main()

    return run


def test_worker_exits_0_when_the_package_errors(worker, upstream, postgres):
    link, upn = upstream.discord_link('full', packages.build('full'))
    upstream.expire('full')
    status_id = postgres.insert_status(package_id(upn))

    assert worker(status_id, package_id(upn), link) == 0
    (row,) = postgres.rows('SELECT is_errored, error_message_code FROM package_process_status')
    assert row == {'is_errored': True, 'error_message_code': 'EXPIRED_LINK'}


def test_worker_exits_1_on_a_bad_status_id(worker, upstream):
    assert worker('not-a-number', 'a' * 32, 'https://click.discord.com/ls/click?upn=x') == 1
    assert upstream.received == []


@pytest.mark.parametrize('columns', [{'is_cancelled': True}, {'is_upgraded': True}, None])
def test_worker_skips_cancelled_upgraded_and_unknown_packages(worker, upstream, postgres, columns):
    link, upn = upstream.discord_link('full', packages.build('full'))
    status_id = postgres.insert_status(package_id(upn), **columns) if columns else 999

    assert worker(status_id, package_id(upn), link) == 0
    assert upstream.received == []
    assert postgres.steps(package_id(upn)) == (['LOCKED'] if columns else [])


def test_secrets_loader_fills_unset_variables_from_secrets_manager(api, monkeypatch):
    secrets = boto3.client('secretsmanager', region_name=env.REGION)
    filled = secrets.create_secret(Name='dumpus-test/filled', SecretString='from-secrets-manager')['ARN']
    kept = secrets.create_secret(Name='dumpus-test/kept', SecretString='not used')['ARN']
    monkeypatch.setenv('SECRETS_ARN_MAP', json.dumps({'SYNTHETIC_FILLED': filled, 'SYNTHETIC_KEPT': kept, 'SYNTHETIC_NO_ARN': ''}))
    monkeypatch.setenv('SYNTHETIC_KEPT', 'already set')
    secrets_loader = importlib.import_module('secrets_loader')

    try:
        secrets_loader._load()
        assert os.environ['SYNTHETIC_FILLED'] == 'from-secrets-manager'
        assert os.environ['SYNTHETIC_KEPT'] == 'already set'
        assert 'SYNTHETIC_NO_ARN' not in os.environ
    finally:
        os.environ.pop('SYNTHETIC_FILLED', None)


def test_waitress_serves_the_app_like_the_api_image(api):
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', 0))
        port = probe.getsockname()[1]
    server = subprocess.Popen([sys.executable, '-m', 'waitress', '--host=127.0.0.1', f'--port={port}', 'app:app'],
                              cwd=env.SRC_DIR, env=dict(os.environ), stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    try:
        deadline = time.monotonic() + 30
        while True:
            try:
                health = requests.get(f'http://127.0.0.1:{port}/health', timeout=1)
                break
            except requests.ConnectionError:
                assert server.poll() is None, server.stderr.read().decode()
                assert time.monotonic() < deadline, 'waitress did not start'
                time.sleep(0.2)
        assert health.status_code == 200
        assert health.headers['Server'] == 'waitress'
        assert health.json() == {'status': 'alive', 'hostname': socket.gethostname()}
        upn = make_upn('waitress')
        assert requests.get(f'http://127.0.0.1:{port}/process/{package_id(upn)}/blob').status_code == 401
    finally:
        server.terminate()
        server.wait(timeout=10)
        server.stderr.close()
