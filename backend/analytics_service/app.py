"""
PetCareApp - Analytics Service
@author VS
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'analytics_service', 'status': 'healthy'})

@app.route('/api/v1/system/services', methods=['GET'])
def services_status():
    return jsonify([
        {'name': 'Auth Service', 'status': 'healthy', 'uptime': '99.99%', 'latency': '12ms', 'port': 8001},
        {'name': 'User Service', 'status': 'healthy', 'uptime': '99.98%', 'latency': '15ms', 'port': 8002},
        {'name': 'Medical Records', 'status': 'healthy', 'uptime': '99.97%', 'latency': '18ms', 'port': 8003},
        {'name': 'Appointment Service', 'status': 'healthy', 'uptime': '99.99%', 'latency': '14ms', 'port': 8004},
        {'name': 'Notification Service', 'status': 'warning', 'uptime': '99.85%', 'latency': '45ms', 'port': 8005},
        {'name': 'Payment Service', 'status': 'healthy', 'uptime': '99.99%', 'latency': '22ms', 'port': 8006},
        {'name': 'Report Service', 'status': 'healthy', 'uptime': '99.96%', 'latency': '35ms', 'port': 8007},
        {'name': 'Analytics Service', 'status': 'healthy', 'uptime': '99.94%', 'latency': '28ms', 'port': 8008},
        {'name': 'Audit Service', 'status': 'healthy', 'uptime': '99.99%', 'latency': '10ms', 'port': 8009},
        {'name': 'Drug Info Service', 'status': 'healthy', 'uptime': '99.92%', 'latency': '55ms', 'port': 8010},
        {'name': 'Disease Alert (PIW)', 'status': 'healthy', 'uptime': '99.88%', 'latency': '120ms', 'port': 8011}
    ])

@app.route('/api/v1/system/metrics', methods=['GET'])
def system_metrics():
    return jsonify({'cpu': 35, 'memory': 62, 'disk': 45, 'network': 28})

@app.route('/api/v1/system/performance', methods=['GET'])
def performance_stats():
    return jsonify({
        'avgResponseTime': '45ms',
        'requestsPerSecond': 150,
        'errorRate': '0.02%',
        'activeConnections': 234
    })

@app.route('/api/v1/infrastructure/containers', methods=['GET'])
def container_status():
    return jsonify({'total': 15, 'running': 14, 'stopped': 1})

@app.route('/api/v1/infrastructure/database', methods=['GET'])
def database_status():
    return jsonify({'status': 'healthy', 'connections': 45, 'readCapacity': '80%', 'writeCapacity': '60%'})

@app.route('/api/v1/infrastructure/backups', methods=['GET'])
def backup_status():
    return jsonify([
        {'id': '1', 'type': 'full', 'date': '2024-12-15', 'size': '2.5GB', 'status': 'completed'},
        {'id': '2', 'type': 'incremental', 'date': '2024-12-16', 'size': '150MB', 'status': 'completed'}
    ])

@app.route('/api/v1/security/alerts', methods=['GET'])
def security_alerts():
    return jsonify([
        {'id': '1', 'type': 'warning', 'message': 'High latency detected', 'time': '10 min ago'}
    ])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8008, debug=True)
