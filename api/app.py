from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

# make sure tasks is imported before db
# as env is loaded from tasks (so the celery worker can use it)
from tasks import handle_package
from db import PackageProcessStatus, Session, fetch_package_status, fetch_package_data, fetch_package_rank

from util import check_discord_link, extract_package_id_from_discord_link, extract_package_id_from_upn

app = Flask(__name__)
CORS(app)

def get_base_status_response():
    return {
        "isDataAvailable": False,

        "isUpgraded": False,
        "errorMessageCode": None,

        "isProcessing": False,
        "processingStep": None,
        "processingQueuePosition": {
            "current": 0,
            "totalWhenStarted": 0,
            "total": 0
    }
}

def get_base_process_response():
    return {
    "isAccepted": False,
    "packageId": None,

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

@app.route('/process', methods=['POST'])
def process_link():

    link = request.json['package_link']

    if not link or not check_discord_link(link):
        res = get_base_process_response()
        res['errorMessageCode'] = 'INVALID_LINK'
        return jsonify(res), 200

    package_id = extract_package_id_from_discord_link(link)

    res = get_base_process_response()
    res['isAccepted'] = True
    res['packageId'] = package_id

    print(f'Order taken, package added to the queue. (package_id: {package_id})')

    session = Session()

    existing_package_process_status = fetch_package_status(package_id, session)
    if existing_package_process_status:
        return jsonify(res), 200

    package_process_status = PackageProcessStatus(package_id=package_id, step='locked', progress=0)
    session.add(package_process_status)
    session.commit()
    session.close()

    handle_package.apply_async(args=[package_id, link], queue='regular_process')

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

    res['isUpgraded'] = package_status['is_upgraded']

    if package_status['step'] == 'processed':
        res['isDataAvailable'] = True

    else:
        res['isProcessing'] = True
        res['processingStep'] = package_status['step']
        res['processingQueuePosition']['current'] = package_rank[0]
        res['processingQueuePosition']['total'] = package_status[1]
        res['processingQueuePosition']['totalWhenStarted'] = package_status['total_when_started']

    return jsonify(package_status), 200

@app.route('/process/<package_id>/data', methods=['GET'])
def get_package_data(package_id):

    (is_auth, auth_upn) = check_authorization_bearer(request, package_id)
    if not is_auth:
        return 401
    
    session = Session()
    data = fetch_package_data(package_id, auth_upn, session)
    session.close()
    
    if not data:
        return 404
    
    return send_file(data, mimetype='application/octet-stream')

@app.route('/health', methods=['GET'])
def health_check():
    return '', 200

@app.errorhandler(404)
def page_not_found(e):
    return jsonify({'error': 'Route not found.'}), 404

@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({'error': 'Internal server error.'}), 500
