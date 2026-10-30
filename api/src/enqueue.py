"""Pluggable queue dispatch.

Production (Lambda) uses SQS. Local dev defaults to `sync` — process the package
inline on the request thread, which is good enough at our volume and means
no broker is needed to run the API locally.
"""
import json
import os


def enqueue_package(package_status_id, package_id, link):
    backend = os.getenv('QUEUE_BACKEND', 'sync')

    if backend == 'sqs':
        import boto3
        sqs = boto3.client('sqs')
        sqs.send_message(
            QueueUrl=os.environ['SQS_QUEUE_URL'],
            MessageBody=json.dumps({
                'package_status_id': package_status_id,
                'package_id': package_id,
                'link': link,
            }),
        )
        return

    if backend == 'sync':
        from tasks import process_package
        process_package(package_status_id, package_id, link)
        return

    raise ValueError(f'Unknown QUEUE_BACKEND: {backend}')
