import socket

from flask import Flask, jsonify, request, Response, make_response
from flask_cors import CORS

from flask_limiter import Limiter

# make sure tasks is imported before db
# as env is loaded from tasks (so the celery worker can use it)
from tasks import handle_package
from db import PackageProcessStatus, SavedPackageData, Session, fetch_package_status, fetch_package_data, fetch_package_rank

from sqlite import generate_demo_database

from util import check_discord_link, check_whitelisted_link, extract_package_id_from_discord_link, extract_package_id_from_upn, fetch_diswho_user

app = Flask(__name__)
CORS(app)

def get_request_package_id():
    return request.view_args.get('package_id')

limiter = Limiter(
    get_request_package_id,
    app=app,
    storage_uri="memory://",
)

def get_base_status_response():
    return {
        "isDataAvailable": False,

        "isUpgraded": False,

        "isErrored": False,
        "errorMessageCode": None,

        "isProcessing": False,
        "processingStep": None,
        "processingQueuePosition": {
            "user": 0,
            "total": 0,
            "userWhenStarted": 0,
            "totalWhenStarted": 0
        }
    }


def get_base_process_response():
    return {
        "isAccepted": False,
        "packageId": None,

        "errorMessageCode": None
    }


def get_base_delete_response():
    return {
        "isDeleted": False,
        "errorMessageCode": None
    }


def check_authorization_bearer(req, package_id):
    auth_header = req.headers.get('Authorization')

    if not auth_header:
        return (False, None)

    auth_token = auth_header.split(' ')[1]
    expected_package_id = extract_package_id_from_upn(auth_token)

    if not expected_package_id or package_id != expected_package_id:
        return (False, None)

    return (True, auth_token)

@app.route('/health', methods=['GET'])
def health():
    
    hostname = socket.gethostname()

    return jsonify({
        'status': 'alive',
        'hostname': hostname
    }), 200

@app.route('/process', methods=['POST'])
def process_link():

    link = request.json['package_link']

    if not link or (not check_discord_link(link) and not check_whitelisted_link(link)):
        res = get_base_process_response()
        res['errorMessageCode'] = 'INVALID_LINK'
        return jsonify(res), 200

    package_id = extract_package_id_from_discord_link(link)

    res = get_base_process_response()
    res['isAccepted'] = True
    res['packageId'] = package_id

    print(
        f'Order taken, package added to the queue. (package_id: {package_id})')

    session = Session()

    existing_package_process_status = fetch_package_status(package_id, session)
    if existing_package_process_status and not existing_package_process_status.is_errored and not existing_package_process_status.is_cancelled:
        return jsonify(res), 200

    package_process_status = PackageProcessStatus(
        package_id=package_id, step='LOCKED')
    session.add(package_process_status)
    session.commit()

    (queue_position, queue_total) = fetch_package_rank(
        package_id, package_process_status, session)

    package_process_status.queue_position_when_started = queue_position
    package_process_status.queue_total_when_started = queue_total
    session.commit()

    id = package_process_status.id

    session.close()

    handle_package.apply_async(
        args=[id, package_id, link], queue='regular_process')

    return jsonify(res), 200


@app.route('/process/<package_id>/status', methods=['GET'])
def get_package_status(package_id):

    res = get_base_status_response()

    (is_auth, _) = check_authorization_bearer(request, package_id)
    if not is_auth:
        res['errorMessageCode'] = 'UNAUTHORIZED'
        return jsonify(res), 401

    session = Session()
    package_status = fetch_package_status(package_id, session)
    package_rank = fetch_package_rank(package_id, package_status, session)
    session.close()

    if not package_status:
        res['errorMessageCode'] = 'UNKNOWN_PACKAGE_ID'
        return jsonify(res), 200

    res['isUpgraded'] = package_status.is_upgraded
    res['isErrored'] = package_status.is_errored

    if package_status.is_errored:
        res['errorMessageCode'] = package_status.error_message_code

    if package_status.step == 'PROCESSED':
        res['isDataAvailable'] = True
        res['processingStep'] = package_status.step

    else:
        res['isProcessing'] = True
        res['processingStep'] = package_status.step
        res['processingQueuePosition']['user'] = package_rank[0]
        res['processingQueuePosition']['total'] = package_rank[1]
        res['processingQueuePosition']['userWhenStarted'] = package_status.queue_position_when_started
        res['processingQueuePosition']['totalWhenStarted'] = package_status.queue_total_when_started

    return jsonify(res), 200


@app.route('/process/<package_id>/data', methods=['GET'])
def get_package_data(package_id):

    if package_id == 'demo':
        session = Session()
        data = fetch_package_data('demo', 'demo', session)
        if not data:
            binary_data = generate_demo_database()
            session.add(SavedPackageData(package_id='demo', encrypted_data=binary_data, iv='demo'))
            session.commit()
            data = binary_data
        session.close()
        return Response(data, mimetype='application/octet-stream')

    (is_auth, auth_upn) = check_authorization_bearer(request, package_id)
    if not is_auth:
        return make_response('', 401)

    session = Session()
    data = fetch_package_data(package_id, auth_upn, session)
    session.close()

    if not data:
        return make_response('', 404)
    
    return Response(data, mimetype='application/octet-stream')

@app.route('/process/<package_id>', methods=['DELETE'])
def cancel_package(package_id):

    (is_auth, _) = check_authorization_bearer(request, package_id)
    if not is_auth:
        return make_response('', 401)

    res = get_base_delete_response()

    session = Session()
    package_status = fetch_package_status(package_id, session)

    if not package_status:
        res['errorMessageCode'] = 'UNKNOWN_PACKAGE_ID'
        session.close()
        return jsonify(res), 200
    
    session.query(PackageProcessStatus).filter(PackageProcessStatus.package_id == package_id).delete()
    session.query(SavedPackageData).filter(SavedPackageData.package_id == package_id).delete()

    session.commit()

    session.close()

    return jsonify(res), 200

@app.route('/process/<package_id>/user/<user_id>', methods=['GET'])
@limiter.limit("2/second")
def get_avatar(package_id, user_id):
    
        (is_auth, auth_upn) = check_authorization_bearer(request, package_id)
        if not is_auth:
            return make_response('', 401)
    
        session = Session()
        data = fetch_package_status(package_id, session)
        session.close()

        if not data:
            return make_response('', 401)
        
        user = fetch_diswho_user(user_id)

        if not user:
            return make_response('', 500)
        
        avatar_extension = 'avatar' in user and user['avatar'].startswith('a_') and 'gif' or 'png'
        avatar_url = 'avatar' in user and f'https://cdn.discordapp.com/avatars/{user_id}/{user["avatar"]}.{avatar_extension}' or None

        return jsonify({
            'user_id': user_id,
            'display_name': user['display_name'] or None,
            'avatar_url': avatar_url
        }), 200

@app.errorhandler(404)
def page_not_found(e):
    return jsonify({'error': 'Route not found.'}), 404


@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({'error': 'Internal server error.'}), 500
