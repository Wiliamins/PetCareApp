"""
PetCareApp - Audit Service
@author VS
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)
logs_db = []
audit_db = []

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'audit_service', 'status': 'healthy'})

@app.route('/api/v1/logs', methods=['GET'])
def get_logs():
    level = request.args.get('level')
    service = request.args.get('service')
    logs = logs_db[-100:]
    if level:
        logs = [l for l in logs if l.get('level') == level]
    if service:
        logs = [l for l in logs if l.get('service') == service]
    return jsonify(logs)

@app.route('/api/v1/audit', methods=['GET', 'POST'])
def audit():
    if request.method == 'POST':
        data = request.get_json()
        log = {
            'id': str(uuid.uuid4()),
            'userId': data.get('userId'),
            'action': data.get('action'),
            'resource': data.get('resource'),
            'details': data.get('details'),
            'ip': request.remote_addr,
            'timestamp': datetime.utcnow().isoformat()
        }
        audit_db.append(log)
        return jsonify(log), 201
    return jsonify(audit_db[-50:])

@app.route('/api/v1/logs/export', methods=['GET'])
def export_logs():
    return jsonify({'url': '/downloads/logs-export.json', 'expires': '1 hour'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8009, debug=True)
