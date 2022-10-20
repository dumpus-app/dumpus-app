from flask import Flask, render_template, jsonify, request

from tasks import handle_package

import hashlib

from db import PackageProcessStatus, SavedPackageData, session

import pyaes
import orjson

app = Flask(__name__)

discord_link_regex = r'https:\/\/click\.discord\.com\/ls\/click\?upn=([A-Za-z0-9-_]{500,})'

def get_package_status(url, package_id):
    status = session.query(PackageProcessStatus).filter_by(package_id=package_id).first()
    if status and status != 'processed':
        return {
            'status': 'in progress'
        }
    elif status and status.step == 'processed':
        result = session.query(SavedPackageData).filter_by(package_id=package_id).first()
        key = url.encode('utf-8')
        aes = pyaes.AESModeOfOperationCTR(key)
        data = aes.decrypt(result.data)
        if result:
            return {
                'status': 'processed',
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
        return jsonify({'error': 'No link provided'}), 400
    # Check if link is a discord link
    if not discord_link_regex.match(link):
        return jsonify({'error': 'Not a discord link'}), 400
    # Get the link from the regex
    link = discord_link_regex.match(link).group(1)
    # Link to md5
    package_id = hashlib.md5(link.encode('utf-8')).hexdigest()
    # Get package status
    package_status = get_package_status(link, package_id)
    if package_status['status'] != 'not started':
        return jsonify({
            'status': 'in progress',
            'message': 'This link is already being analyzed.'
        })
    # Process the link
    handle_package.apply_async(args=[package_id, link], queue='default')
    # Send a successful response
    return jsonify({'success': 'Processing your link'}), 200

@app.route('/api/link/<string:link>', methods=['GET'])
def get_link(link):
    return True

if __name__ == "__main__":
    app.run(port=5500, debug=True)
