"""How production runs the code: API Gateway to `lambda_handlers.api`, SQS to
`lambda_handlers.forwarder`, ECS to `worker_main`."""
import importlib
import json
import socket
import sys

import boto3
import pytest
import requests
from botocore.stub import Stubber

from support import env, packages
from support.upstream import package_id

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
    response = lambda_api(http_api_event('GET', '/health'), None)

    assert response['statusCode'] == 200
    assert json.loads(response['body']) == {'status': 'alive', 'hostname': socket.gethostname()}


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
