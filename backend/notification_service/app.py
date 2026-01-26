"""
PetCareApp - Notification Service
@author VS
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)
notifications_db = {}

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'notification_service', 'status': 'healthy'})

@app.route('/api/v1/notifications', methods=['GET', 'POST'])
def notifications():
    if request.method == 'POST':
        data = request.get_json()
        notif_id = str(uuid.uuid4())
        notification = {'id': notif_id, **data, 'isRead': False, 'createdAt': datetime.utcnow().isoformat()}
        notifications_db[notif_id] = notification
        return jsonify(notification), 201
    user_id = request.args.get('userId')
    notifs = list(notifications_db.values())
    if user_id:
        notifs = [n for n in notifs if n.get('userId') == user_id]
    return jsonify(notifs)

@app.route('/api/v1/notifications/unread-count', methods=['GET'])
def unread_count():
    count = len([n for n in notifications_db.values() if not n.get('isRead')])
    return jsonify({'count': count})

@app.route('/api/v1/notifications/<notif_id>/read', methods=['POST'])
def mark_read(notif_id):
    if notif_id in notifications_db:
        notifications_db[notif_id]['isRead'] = True
    return jsonify({'success': True})

@app.route('/api/v1/notifications/read-all', methods=['POST'])
def mark_all_read():
    for notif in notifications_db.values():
        notif['isRead'] = True
    return jsonify({'success': True})

@app.route('/api/v1/notifications/settings', methods=['GET', 'PUT'])
def notification_settings():
    settings = {'email': True, 'push': True, 'sms': False}
    if request.method == 'PUT':
        settings.update(request.get_json())
    return jsonify(settings)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8005, debug=True)
