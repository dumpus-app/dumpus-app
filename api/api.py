from datetime import datetime
from flask import Flask, render_template, jsonify, request

from tasks import handle_package

import cryptocode

from db import PackageProcessStatus, SavedPackageData, session

import orjson

from util import check_discord_link, extract_key_from_discord_link, extract_package_id_from_discord_link, ts_included_in_range

app = Flask(__name__)

def get_package_stats(link, package_id):
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
    package_stats = get_package_stats(link, package_id)
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
    stats = get_package_stats(link, package_id)
    return jsonify(stats)

@app.route('/api/stats/top', methods=['GET'])
def get_stats_top():
    link = request.args.get('link')
    if not link:
        return jsonify({'error': 'No link provided.'}), 400
    start_date = float(request.args.get('start_date'))
    end_date = float(request.args.get('end_date') or datetime.now().timestamp())

    if not start_date:
        return jsonify({'error': 'No start date provided.'}), 400

    limit = int(request.args.get('limit') or 10)
    offset = int(request.args.get('offset') or 0)

    dms_top = []
    channels_top = []
    guilds_top = []

    package_id = extract_package_id_from_discord_link(link)
    stats = get_package_stats(link, package_id)

    if stats['status'] != 'processed':
        return jsonify({
            'status': stats['status'],
            'message': 'This link has not been processed yet.'
        })

    data = stats['data']

    for dm_channel_data in data['dms_channels_data']:
        message_count = len([ts for ts in dm_channel_data['message_timestamps'] if ts_included_in_range(ts, start_date, end_date)])
        user_data = next((user for user in data['users'] if user['id'] == dm_channel_data['dm_user_id']), None)
        dms_top.append({
            'message_count': message_count,
            'channel_id': dm_channel_data['channel_id'],
            'dm_user_id': dm_channel_data['dm_user_id'],
            'total_message_count': dm_channel_data['total_message_count'],
            'first_message_timestamp': dm_channel_data['first_message_timestamp'],
            'user_data': user_data,
        })

    dms_top.sort(key=lambda x: x['message_count'], reverse=True)
    dms_top = dms_top[offset:offset + limit]

    for channel_data in data['guild_channels_data']:
        message_count = len([ts for ts in channel_data['message_timestamps'] if ts_included_in_range(ts, start_date, end_date)])
        channels_top.append({
            'message_count': message_count,
            'channel_id': channel_data['channel_id'],
            'total_message_count': channel_data['total_message_count'],
            'first_message_timestamp': channel_data['first_message_timestamp'],
        })
        guild_idx = next((idx for idx in range(len(guilds_top)) if guilds_top[idx]['guild_id'] == channel_data['guild_id']), None)
        print(guild_idx)
        if guild_idx:
            guilds_top[guild_idx]['message_count'] += message_count
        else:
            guilds_top.append({
                'message_count': message_count,
                'guild_id': channel_data['guild_id'],
                'guild_name': channel_data['guild_name']
            })
    
    channels_top.sort(key=lambda x: x['message_count'], reverse=True)
    channels_top = channels_top[offset:offset + limit]

    guilds_top.sort(key=lambda x: x['message_count'], reverse=True)
    guilds_top = guilds_top[offset:offset + limit]

    return jsonify({
        'status': stats['status'],
        'data': {
            'dms_top': dms_top,
            'channels_top': channels_top,
            'guilds_top': guilds_top,
        }
    })

if __name__ == "__main__":
    app.run(port=5500, debug=True)
