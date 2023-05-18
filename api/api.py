from dotenv import load_dotenv
load_dotenv()

from datetime import datetime
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS, cross_origin

from tasks import handle_package

import cryptocode

from db import PackageProcessStatus, SavedPackageData, session

import orjson

from util import check_discord_link, extract_key_from_discord_link, extract_package_id_from_discord_link, ts_included_in_range

app = Flask(__name__)
CORS(app)

def fetch_package_status(link, package_id):
    status = session.query(PackageProcessStatus).filter_by(package_id=package_id).first()
    if status and status.step != 'processed':
        return {
            'status': 'processing',
            'step': status.step,
        }
    elif status and status.step == 'processed':
        result = session.query(SavedPackageData).filter_by(package_id=package_id).first()
        key = extract_key_from_discord_link(link)
        data = cryptocode.decrypt(result.data, key)
        if result:
            return {
                'status': 'processed',
                'data': orjson.loads(data)
            }
    else:
        return {
            'status': 'unknown',
            'message': 'This link has not been analyzed yet.',
        }

@app.route('/api/link', methods=['POST'])
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
    package_stats = fetch_package_status(link, package_id)
    if package_stats['status'] != 'unknown':
        return jsonify({
            'status': package_stats['status'],
            'message': 'This link has already been submitted.'
        })
    package_process_status = PackageProcessStatus(package_id=package_id, step='locked', created_at=datetime.now(), updated_at=datetime.now())
    session.add(package_process_status)
    session.commit()
    # Process the link
    handle_package.apply_async(args=[package_id, link], queue='default')
    # Send a successful response
    return jsonify({'success': 'Started processing your link.'}), 200

# todo make this endpoint private
@app.route('/api/stats', methods=['GET'])
def get_stats():
    link = request.args.get('link')
    if not link:
        return jsonify({'error': 'No link provided.'}), 400
    # Check if link is a discord link
    if not check_discord_link(link):
        return jsonify({'error': 'Not a discord link.'}), 400
    package_id = extract_package_id_from_discord_link(link)
    stats = fetch_package_status(link, package_id)
    return jsonify(stats)

@app.route('/api/stats/top/<stats_type>', methods=['GET'])
def get_stats_top(stats_type):
    link = request.args.get('link')
    if not link:
        return jsonify({'error': 'No link provided.'}), 400

    start_date_param = request.args.get('start_date')
    if not start_date_param:
        return jsonify({'error': 'No start date provided.'}), 400

    if not stats_type in ['channels', 'dms', 'guilds']:
        return jsonify({'error': 'Invalid stats type.'}), 400 

    start_date = float(start_date_param)
    end_date = float(request.args.get('end_date') or datetime.now().timestamp())

    limit = int(request.args.get('limit') or 10)
    offset = int(request.args.get('offset') or 0)

    top_data = []

    package_id = extract_package_id_from_discord_link(link)
    stats = fetch_package_status(link, package_id)

    if stats['status'] != 'processed':
        return jsonify({
            'status': stats['status'],
            'message': 'This link has not been processed yet.'
        })

    data = stats['data']

    if stats_type == 'dms':

        for dm_channel_data in data['dms_channels_data']:
            message_count = len([ts for ts in dm_channel_data['message_timestamps'] if ts_included_in_range(ts, start_date, end_date)])
            user_data = next((user for user in data['users'] if user['id'] == dm_channel_data['dm_user_id']), None)
            top_data.append({
                'message_count': message_count,
                'channel_id': dm_channel_data['channel_id'],
                'dm_user_id': dm_channel_data['dm_user_id'],
                'total_message_count': dm_channel_data['total_message_count'],
                'first_message_timestamp': dm_channel_data['first_message_timestamp'],
                'user_data': user_data,
            })

        top_data.sort(key=lambda x: x['message_count'], reverse=True)
        top_data = top_data[offset:(offset + limit)]
        
    if stats_type == 'channels' or stats_type == 'guilds':

        for channel_data in data['guild_channels_data']:
            message_count = len([ts for ts in channel_data['message_timestamps'] if ts_included_in_range(ts, start_date, end_date)])
            if stats_type == 'channels':
                channel_name = next((channel['name'] for channel in data['channels'] if channel['id'] == channel_data['channel_id']), None)
                top_data.append({
                    'channel_name': channel_name,
                    'guild_name': channel_data['guild_name'],
                    'message_count': message_count,
                    'channel_id': channel_data['channel_id'],
                    'total_message_count': channel_data['total_message_count'],
                    'first_message_timestamp': channel_data['first_message_timestamp'],
                })
            if stats_type == 'guilds':                    
                guild_idx = next((index for (index, d) in enumerate(top_data) if d["guild_id"] == channel_data['guild_id']), None)
                if guild_idx is not None:
                    top_data[guild_idx]['message_count'] += message_count
                else:
                    top_data.append({
                        'message_count': message_count,
                        'guild_id': channel_data['guild_id'],
                        'guild_name': channel_data['guild_name']
                    })
    
        top_data.sort(key=lambda x: x['message_count'], reverse=True)
        top_data = top_data[offset:(offset + limit)]

    return jsonify({
        'status': stats['status'],
        'data': top_data
    })

if __name__ == "__main__":
    app.run(port=5500, debug=True)
