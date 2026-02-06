"""
PetCareApp - Analytics Service
Serwis metryk systemowych i monitoringu
@author VS
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import logging
import psutil
import subprocess

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Services configuration - VS
SERVICES = [
    {'name': 'auth-service', 'port': 8001, 'container': 'petcare-auth'},
    {'name': 'user-service', 'port': 8002, 'container': 'petcare-user'},
    {'name': 'medical-records-service', 'port': 8003, 'container': 'petcare-medical'},
    {'name': 'appointment-service', 'port': 8004, 'container': 'petcare-appointment'},
    {'name': 'notification-service', 'port': 8005, 'container': 'petcare-notification'},
    {'name': 'payment-service', 'port': 8006, 'container': 'petcare-payment'},
    {'name': 'report-service', 'port': 8007, 'container': 'petcare-report'},
    {'name': 'analytics-service', 'port': 8008, 'container': 'petcare-analytics'},
    {'name': 'audit-service', 'port': 8009, 'container': 'petcare-audit'},
    {'name': 'drug-service', 'port': 8010, 'container': 'petcare-drug'},
    {'name': 'disease-alert-service', 'port': 8011, 'container': 'petcare-disease-alert'},
    {'name': 'pet-service', 'port': 8012, 'container': 'petcare-pet'},
    {'name': 'drug-info-service', 'port': 8013, 'container': 'petcare-drug-info'},
]

def get_container_status(container_name):
    """Check Docker container status - VS"""
    try:
        result = subprocess.run(
            ['docker', 'inspect', '-f', '{{.State.Status}}', container_name],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except:
        pass
    return 'unknown'

def get_system_metrics():
    """Get system metrics - VS"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Get uptime
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = (datetime.now() - boot_time).total_seconds()
        
        return {
            'cpu': {
                'usage': cpu_percent,
                'cores': psutil.cpu_count()
            },
            'memory': {
                'total': round(memory.total / (1024**3), 2),
                'used': round(memory.used / (1024**3), 2),
                'available': round(memory.available / (1024**3), 2),
                'percent': memory.percent
            },
            'disk': {
                'total': round(disk.total / (1024**3), 2),
                'used': round(disk.used / (1024**3), 2),
                'free': round(disk.free / (1024**3), 2),
                'percent': round((disk.used / disk.total) * 100, 1)
            },
            'uptime': int(uptime)
        }
    except Exception as e:
        logger.error(f"Error getting system metrics: {e}")
        return {
            'cpu': {'usage': 0, 'cores': 2},
            'memory': {'total': 4, 'used': 2, 'available': 2, 'percent': 50},
            'disk': {'total': 30, 'used': 15, 'free': 15, 'percent': 50},
            'uptime': 0
        }

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'analytics-service', 'status': 'healthy'})

@app.route('/api/v1/system/metrics', methods=['GET'])
def get_metrics():
    """Get system metrics - VS"""
    metrics = get_system_metrics()
    metrics['timestamp'] = datetime.utcnow().isoformat()
    return jsonify(metrics)

@app.route('/api/v1/system/services', methods=['GET'])
def get_services_status():
    """Get all services status - VS"""
    services_status = []
    
    for service in SERVICES:
        status = get_container_status(service['container'])
        services_status.append({
            'name': service['name'],
            'port': service['port'],
            'container': service['container'],
            'status': 'healthy' if status == 'running' else 'offline',
            'containerStatus': status
        })
    
    healthy_count = len([s for s in services_status if s['status'] == 'healthy'])
    
    return jsonify({
        'services': services_status,
        'summary': {
            'total': len(services_status),
            'healthy': healthy_count,
            'unhealthy': len(services_status) - healthy_count
        },
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/v1/system/health', methods=['GET'])
def get_system_health():
    """Get overall system health - VS"""
    metrics = get_system_metrics()
    
    # Check thresholds - VS
    warnings = []
    if metrics['cpu']['usage'] > 80:
        warnings.append('High CPU usage')
    if metrics['memory']['percent'] > 80:
        warnings.append('High memory usage')
    if metrics['disk']['percent'] > 80:
        warnings.append('Low disk space')
    
    status = 'healthy' if len(warnings) == 0 else 'warning'
    
    return jsonify({
        'status': status,
        'warnings': warnings,
        'metrics': metrics,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/v1/logs', methods=['GET'])
def get_logs():
    """Get system logs - VS"""
    service = request.args.get('service')
    level = request.args.get('level')
    limit = request.args.get('limit', 100, type=int)
    
    # Demo logs - in production read from CloudWatch or file - VS
    logs = []
    levels = ['info', 'info', 'info', 'warning', 'error', 'debug']
    messages = [
        'Request processed successfully',
        'User logged in',
        'Database query executed',
        'Slow query detected',
        'Connection timeout',
        'Cache hit'
    ]
    services = [s['name'] for s in SERVICES]
    
    import random
    now = datetime.utcnow()
    
    for i in range(limit):
        log_level = random.choice(levels)
        log_service = service if service else random.choice(services)
        
        if level and log_level != level:
            continue
            
        logs.append({
            'id': f'log-{i}',
            'timestamp': (now - timedelta(minutes=i)).isoformat(),
            'level': log_level,
            'service': log_service,
            'message': random.choice(messages),
            'ip': f'192.168.1.{random.randint(1, 255)}'
        })
    
    return jsonify({'logs': logs[:limit]})

@app.route('/api/v1/analytics/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get IT dashboard data - VS"""
    metrics = get_system_metrics()
    
    # Get services status
    services_status = []
    for service in SERVICES:
        status = get_container_status(service['container'])
        services_status.append({
            'name': service['name'],
            'status': 'healthy' if status == 'running' else 'offline'
        })
    
    healthy_count = len([s for s in services_status if s['status'] == 'healthy'])
    
    return jsonify({
        'metrics': metrics,
        'services': {
            'total': len(SERVICES),
            'healthy': healthy_count,
            'unhealthy': len(SERVICES) - healthy_count,
            'list': services_status
        },
        'recentEvents': [
            {'time': '10:45', 'type': 'info', 'message': 'System health check passed'},
            {'time': '10:30', 'type': 'info', 'message': 'Backup completed'},
            {'time': '10:15', 'type': 'warning', 'message': 'High memory usage detected'},
            {'time': '10:00', 'type': 'info', 'message': 'Scheduled maintenance completed'}
        ],
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 8008))
    logger.info(f"Starting Analytics Service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)
