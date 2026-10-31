"""What the API sends back and posts out, written once for the route tests."""
import re

NEW = 0x1F8BFF
EXISTING = 0xbbfcbb
PROCESSED = 0x4b9e4b
ERRORED = 0x9e4b4b
DELETED = 0xf79494


def bearer(upn):
    return {'Authorization': f'Bearer {upn}'}


def embed(title, description, color):
    return {'embeds': [{'title': title, 'description': description, 'color': color}]}


def webhooks(upstream):
    """Webhook payloads in the order they were posted, with the processing time masked."""
    payloads = upstream.webhooks
    for payload in payloads:
        for item in payload.get('embeds', []):
            item['description'] = re.sub(r'\(took \d\d:\d\d:\d\d\)', '(took HH:MM:SS)', item.get('description', ''))
    return payloads


def new_package(package_id):
    return embed('New package added to the queue', f'Package ID: {package_id}', NEW)


def existing_package(package_id):
    return embed('Loading existing package', f'Package ID: {package_id}', EXISTING)


def processed_package(package_id):
    return embed('Package processed successfully', f'Package ID: {package_id} (took HH:MM:SS)', PROCESSED)


def errored_package(package_id, code):
    return embed('Package errored', f'Package ID: {package_id} (error {code})', ERRORED)


def deleted_package(package_id):
    return embed('Deleting existing package data', f'Package ID: {package_id}', DELETED)


BASE_QUEUE = {'user': 0, 'total': 0, 'userWhenStarted': 0, 'totalWhenStarted': 0}


def status(**fields):
    response = {
        'isDataAvailable': False,
        'isUpgraded': False,
        'isErrored': False,
        'errorMessageCode': None,
        'isProcessing': False,
        'processingStep': None,
        'processingQueuePosition': dict(BASE_QUEUE),
    }
    response.update(fields)
    return response


def processing_queue(*, premium_total=0, standard_total=0, premium_user=None, standard_user=0,
                     standard_when_joined=None, premium_when_joined=None):
    return {
        **BASE_QUEUE,
        'premiumQueueTotal': premium_total,
        'standardQueueTotal': standard_total,
        'premiumQueueUser': premium_user,
        'standardQueueUser': standard_user,
        'standardWhenJoined': standard_when_joined,
        'premiumWhenJoined': premium_when_joined,
    }
