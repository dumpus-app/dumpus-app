"""SQS-triggered worker Lambda.

Receives a batch of SQS records, each with a JSON body containing
{package_status_id, package_id, link}. Calls process_package for each.

Failures are reported via the partial-batch-response protocol so successful
records aren't redelivered. The Lambda event source mapping must be
configured with FunctionResponseTypes=["ReportBatchItemFailures"].
"""
import json
import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import secrets_loader  # noqa: F401, E402 — runs at import to fetch SM secrets into os.environ
from tasks import process_package  # noqa: E402


def handler(event, context):
    failures = []

    for record in event.get('Records', []):
        try:
            body = json.loads(record['body'])
            process_package(
                body['package_status_id'],
                body['package_id'],
                body['link'],
                worker_name='regular_process',
            )
        except Exception as e:
            print(f"record {record.get('messageId')} failed: {e}")
            traceback.print_exc()
            failures.append({'itemIdentifier': record['messageId']})

    return {'batchItemFailures': failures}
