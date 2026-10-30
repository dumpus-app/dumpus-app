"""SQS → ECS RunTask forwarder Lambda.

Replaces the old SQS-triggered worker Lambda. For each incoming SQS record,
fires off one Fargate task with the message body passed as container env
overrides. The Fargate task does the actual heavy work without the 15-min /
3008 MB Lambda caps.

Failure semantics: if RunTask fails (capacity issues, IAM, etc.) the record
is reported back via partial-batch-response so SQS retries it. Once the task
is started successfully, the message is acked — the task itself is then
responsible for marking the package row ERRORED on uncaught exceptions
(process_package already does this and posts a Discord webhook).
"""
import json
import os
import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import boto3

ecs = boto3.client('ecs')

CLUSTER = os.environ['ECS_CLUSTER']
TASK_DEF = os.environ['ECS_TASK_DEFINITION']
CONTAINER = os.environ['ECS_CONTAINER_NAME']
SUBNETS = os.environ['ECS_SUBNETS'].split(',')
SECURITY_GROUPS = os.environ['ECS_SECURITY_GROUPS'].split(',')


def handler(event, context):
    failures = []

    for record in event.get('Records', []):
        message_id = record.get('messageId')
        try:
            body = json.loads(record['body'])
            ecs.run_task(
                cluster=CLUSTER,
                taskDefinition=TASK_DEF,
                launchType='FARGATE',
                networkConfiguration={
                    'awsvpcConfiguration': {
                        'subnets': SUBNETS,
                        'securityGroups': SECURITY_GROUPS,
                        'assignPublicIp': 'DISABLED',
                    },
                },
                overrides={
                    'containerOverrides': [{
                        'name': CONTAINER,
                        'environment': [
                            {'name': 'PACKAGE_STATUS_ID', 'value': str(body['package_status_id'])},
                            {'name': 'PACKAGE_ID',        'value': body['package_id']},
                            {'name': 'PACKAGE_LINK',      'value': body['link']},
                        ],
                    }],
                },
            )
            print(f'launched task for package {body["package_id"]}')
        except Exception as e:
            print(f'record {message_id} failed: {e}')
            traceback.print_exc()
            failures.append({'itemIdentifier': message_id})

    return {'batchItemFailures': failures}
