"""
PetCareApp - Analytics Service
@author VS
"""
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import psutil
import requests
import time

app = Flask(__name__)
CORS(app)

SERVICES = {

    'auth': {
        'name': 'Auth Service',
        'url': os.getenv('AUTH_SERVICE_URL')
    },
    'user': {
        'name': 'User Service',
        'url': os.getenv('USER_SERVICE_URL')
    },
    'pet': {
        'name': 'Pet Service',
        'url': os.getenv('PET_SERVICE_URL')
    },
    'medical': {
        'name': 'Medical Service',
        'url': os.getenv('MEDICAL_SERVICE_URL')
    },
    'appointment': {
        'name': 'Appointment Service',
        'url': os.getenv('APPOINTMENT_SERVICE_URL')
    },
    'payment': {
        'name': 'Payment Service',
        'url': os.getenv('PAYMENT_SERVICE_URL')
    },
    'report': {
        'name': 'Report Service',
        'url': os.getenv('REPORT_SERVICE_URL')
    },
    'analytics': {
        'name': 'Analitycs Service',
        'url': os.getenv('ANALITYCS_SERVICE_URL')
    },
    'audit': {
        'name': 'Audit Service',
        'url': os.getenv('AUDIT_SERVICE_URL')
    },
    'drug-info': {
        'name': 'Drug Info Service',
        'url': os.getenv('DRUGINFO_SERVICE_URL')
    },
    'disease-alert': {
        'name': 'Disease Alert Service',
        'url': os.getenv('DISEASEALERT_SERVICE_URL')
    },
    'notification': {
        'name': 'Notification Service',
        'url': os.getenv('NOTIFICATION_SERVICE_URL')
    },
    'drug': {
        'name': 'Drug Service',
        'url': os.getenv('DRUG_SERVICE_URL')
    }
    
}


# HEALTH CHECK

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({
        'service': 'analytics_service',
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    })


# Service status

def check_service_health(service_key, name):
    try:
        start = time.time()
        response = requests.get(
            f"{SERVICES[service_key]}/api/v1/health",
            timeout=5
        )
        latency = int((time.time() - start) * 1000)

        return {
            "service": name,
            "status": "healthy" if response.status_code == 200 else "unhealthy",
            "latency": f"{latency}ms"
        }
    except Exception as e:
        return {
            "service": name,
            "status": "down",
            "error": str(e)
        }

@app.route('/api/v1/system/services', methods=['GET'])
def services_status():
   
    results = []
    
    for service_id, config in SERVICES.items():
        status = check_service_health(service_id, config)
        results.append(status)
    
    results.sort(key=lambda x: (
        0 if x['status'] == 'error' else
        1 if x['status'] == 'timeout' else
        2 if x['status'] == 'unhealthy' else
        3
    ))
    
    return jsonify(results)

@app.route('/api/v1/system/services/<service_id>/health', methods=['GET'])
def service_health(service_id):
    
    if service_id not in SERVICES:
        return jsonify({'error': 'Service not found'}), 404
    
    status = check_service_health(service_id, SERVICES[service_id])
    return jsonify(status)


# System Metrics

@app.route('/api/v1/system/metrics', methods=['GET'])
def system_metrics():

    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        net_io = psutil.net_io_counters()
        
        return jsonify({
            'cpu': round(cpu_percent, 1),
            'memory': round(memory.percent, 1),
            'memory_used_gb': round(memory.used / (1024**3), 2),
            'memory_total_gb': round(memory.total / (1024**3), 2),
            'disk': round(disk.percent, 1),
            'disk_used_gb': round(disk.used / (1024**3), 2),
            'disk_total_gb': round(disk.total / (1024**3), 2),
            'network_sent_mb': round(net_io.bytes_sent / (1024**2), 2),
            'network_recv_mb': round(net_io.bytes_recv / (1024**2), 2),
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e), 'cpu': 0, 'memory': 0, 'disk': 0})


# DOCKER 

@app.route('/api/v1/infrastructure/containers', methods=['GET'])
def container_status():
  
    try:
        import docker
        client = docker.from_env()
        containers = client.containers.list(all=True)
        
        running = len([c for c in containers if c.status == 'running'])
        total = len(containers)
        
        container_list = []
        for c in containers:
            container_list.append({
                'id': c.short_id,
                'name': c.name,
                'status': c.status,
                'image': c.image.tags[0] if c.image.tags else 'unknown'
            })
        
        return jsonify({
            'total': total,
            'running': running,
            'stopped': total - running,
            'containers': container_list
        })
    except:
        return jsonify({
            'total': len(SERVICES),
            'running': len(SERVICES),
            'stopped': 0,
            'containers': [],
            'note': 'Docker API not available'
        })



@app.route('/api/v1/system/performance', methods=['GET'])
def performance_stats():
   
    latencies = []
    healthy = 0
    total = len(SERVICES)
    
    for service_id, config in SERVICES.items():
        status = check_service_health(service_id, config)
        if status['status'] == 'healthy':
            healthy += 1
            try:
                latency = int(status['latency'].replace('ms', ''))
                latencies.append(latency)
            except:
                pass
    
    avg_latency = round(sum(latencies) / len(latencies)) if latencies else 0
    
    return jsonify({
        'avgResponseTime': f'{avg_latency}ms',
        'healthyServices': healthy,
        'totalServices': total,
        'healthPercentage': round(healthy / total * 100, 1) if total > 0 else 0,
        'timestamp': datetime.utcnow().isoformat()
    })


# DB

@app.route('/api/v1/infrastructure/database', methods=['GET'])
def database_status():
   
    try:
        import boto3
        dynamodb = boto3.client('dynamodb', region_name=os.getenv('AWS_REGION', 'eu-north-1'))
        tables = dynamodb.list_tables()['TableNames']
        petcare_tables = [t for t in tables if t.startswith('PetCareApp')]
        
        return jsonify({
            'type': 'DynamoDB',
            'status': 'healthy',
            'tables': len(petcare_tables),
            'tableNames': petcare_tables,
            'region': os.getenv('AWS_REGION', 'eu-north-1')
        })
    except Exception as e:
        return jsonify({'type': 'DynamoDB', 'status': 'unknown', 'error': str(e)})


# Bezpieczestwo

@app.route('/api/v1/security/alerts', methods=['GET'])
def security_alerts():
    return jsonify([])

@app.route('/api/v1/security/ssl', methods=['GET'])
def ssl_status():
    return jsonify({
        'status': 'valid',
        'issuer': "Let's Encrypt",
        'expires': (datetime.utcnow() + timedelta(days=60)).isoformat(),
        'daysRemaining': 60
    })

@app.route('/api/v1/infrastructure/backups', methods=['GET'])
def backup_status():
    return jsonify([{
        'id': '1',
        'type': 'DynamoDB',
        'date': (datetime.utcnow() - timedelta(days=1)).isoformat(),
        'status': 'completed',
        'size': 'On-demand'
    }])

@app.route('/api/v1/system/overview', methods=['GET'])
def system_overview():
   
    cpu = psutil.cpu_percent(interval=0.5)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    healthy_count = 0
    warning_count = 0
    error_count = 0
    
    for service_id, config in SERVICES.items():
        status = check_service_health(service_id, config)
        if status['status'] == 'healthy':
            healthy_count += 1
        elif status['status'] in ['timeout', 'unhealthy']:
            warning_count += 1
        else:
            error_count += 1
    
    return jsonify({
        'metrics': {
            'cpu': round(cpu, 1),
            'memory': round(memory.percent, 1),
            'disk': round(disk.percent, 1)
        },
        'services': {
            'total': len(SERVICES),
            'healthy': healthy_count,
            'warning': warning_count,
            'error': error_count
        },
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8008))
    app.run(host='0.0.0.0', port=port, debug=False)