from datetime import datetime
from flask import Flask, render_template, jsonify, request

from tasks import handle_package

import cryptocode

from db import PackageProcessStatus, SavedPackageData, session

import orjson

from util import check_discord_link, extract_key_from_discord_link, extract_package_id_from_discord_link

app = Flask(__name__)

def get_package_status(link, package_id):
    status = session.query(PackageProcessStatus).filter_by(package_id=package_id).first()
    if status and status.step != 'done':
        return {
            'status': 'in progress',
            'step': status.step,
        }
    elif status and status.step == 'done':
        result = session.query(SavedPackageData).filter_by(package_id=package_id).first()
        key = extract_key_from_discord_link(link)
        data = cryptocode.decrypt(result.data, key)
        if result:
            return {
                'status': 'done',
                'data': orjson.loads(data)
            }
    else:
        return {
            'status': 'not started',
            'message': 'This link has not been analyzed yet.',
        }



@app.route('/api/link/', methods=['POST'])
def process_link():
    # Get link from body
    link = request.json['link']
    if not link:
        return jsonify({'error': 'No link provided.'}), 400
    # Check if link is a discord link
    if not check_discord_link(link):
        return jsonify({'error': 'Not a discord link.'}), 400
    # Link to md5
    package_id = extract_package_id_from_discord_link(link)
    # Get package status
    package_status = get_package_status(link, package_id)
    if package_status['status'] != 'not started':
        return jsonify({
            'status': 'in progress',
            'message': 'This link is already being analyzed.'
        })
    package_process_status = PackageProcessStatus(package_id=package_id, step='locked', created_at=datetime.now(), updated_at=datetime.now())
    session.add(package_process_status)
    session.commit()
    # Process the link
    handle_package.apply_async(args=[package_id, link], queue='default')
    # Send a successful response
    return jsonify({'success': 'Started processing your link.'}), 200

@app.route('/api/link', methods=['GET'])
def get_link():
    link = request.args.get('link')
    if not link:
        return jsonify({'error': 'No link provided.'}), 400
    # Check if link is a discord link
    if not check_discord_link(link):
        return jsonify({'error': 'Not a discord link.'}), 400
    package_id = extract_package_id_from_discord_link(link)
    status = get_package_status(link, package_id)
    return jsonify(status)

if __name__ == "__main__":
    app.run(port=5500, debug=True)
