"""
PetCareApp - Audit Service
Serwis logów audytu z AWS DynamoDB
@author VS
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid
import os
import logging
import boto3
from botocore.exceptions import ClientError

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

AWS_REGION = os.getenv('AWS_REGION', 'eu-north-1')
TABLE_NAME = 'PetCareApp-AuditLogs'

dynamodb = None
table = None
try:
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    table = dynamodb.Table(TABLE_NAME)
    logger.info(f"DynamoDB connected: {TABLE_NAME}")
except Exception as e:
    logger.warning(f"DynamoDB not available: {e}")

audit_logs_db = {}

def save_audit_log(log):
    if table:
        try:
            table.put_item(Item=log)
            return True
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    audit_logs_db[log['id']] = log
    return True

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'audit-service', 'status': 'healthy', 'dynamodb': table is not None})

@app.route('/api/v1/audit/logs', methods=['GET'])
def get_audit_logs():
    """Get audit logs with filters - VS"""
    user_id = request.args.get('userId')
    action = request.args.get('action')
    resource = request.args.get('resource')
    date_from = request.args.get('dateFrom')
    date_to = request.args.get('dateTo')
    limit = request.args.get('limit', 100, type=int)
    
    if table:
        try:
            if user_id:
                response = table.query(
                    IndexName='userId-timestamp-index',
                    KeyConditionExpression='userId = :uid',
                    ExpressionAttributeValues={':uid': user_id},
                    ScanIndexForward=False,
                    Limit=limit
                )
            else:
                response = table.scan(Limit=limit)
            logs = response.get('Items', [])
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
            logs = list(audit_logs_db.values())
    else:
        logs = list(audit_logs_db.values())
    
    # Apply filters - VS
    if action:
        logs = [l for l in logs if l.get('action') == action]
    if resource:
        logs = [l for l in logs if l.get('resource') == resource]
    if date_from:
        logs = [l for l in logs if l.get('timestamp', '') >= date_from]
    if date_to:
        logs = [l for l in logs if l.get('timestamp', '') <= date_to]
    
    return jsonify(logs[:limit])

@app.route('/api/v1/audit/logs', methods=['POST'])
def create_audit_log():
    """Create new audit log entry - VS"""
    data = request.get_json()
    
    log = {
        'id': str(uuid.uuid4()),
        'userId': data.get('userId'),
        'userEmail': data.get('userEmail'),
        'action': data.get('action'),  # create, read, update, delete, login, logout
        'resource': data.get('resource'),  # user, pet, appointment, payment, etc.
        'resourceId': data.get('resourceId'),
        'details': data.get('details', {}),
        'ip': data.get('ip') or request.remote_addr,
        'userAgent': data.get('userAgent') or request.headers.get('User-Agent', ''),
        'timestamp': datetime.utcnow().isoformat(),
        'status': data.get('status', 'success')
    }
    
    save_audit_log(log)
    logger.info(f"Audit log: {log['action']} on {log['resource']} by {log['userId']}")
    return jsonify(log), 201

@app.route('/api/v1/audit/logs/<log_id>', methods=['GET'])
def get_audit_log(log_id):
    """Get single audit log - VS"""
    if table:
        try:
            response = table.get_item(Key={'id': log_id})
            log = response.get('Item')
            if log:
                return jsonify(log)
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    log = audit_logs_db.get(log_id)
    if not log:
        return jsonify({'error': 'Log not found'}), 404
    return jsonify(log)

@app.route('/api/v1/audit/user/<user_id>/activity', methods=['GET'])
def get_user_activity(user_id):
    """Get user activity history - VS"""
    limit = request.args.get('limit', 50, type=int)
    
    if table:
        try:
            response = table.query(
                IndexName='userId-timestamp-index',
                KeyConditionExpression='userId = :uid',
                ExpressionAttributeValues={':uid': user_id},
                ScanIndexForward=False,
                Limit=limit
            )
            logs = response.get('Items', [])
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
            logs = []
    else:
        logs = [l for l in audit_logs_db.values() if l.get('userId') == user_id]
        logs = sorted(logs, key=lambda x: x.get('timestamp', ''), reverse=True)[:limit]
    
    return jsonify({
        'userId': user_id,
        'activityCount': len(logs),
        'activities': logs
    })

@app.route('/api/v1/audit/stats', methods=['GET'])
def get_audit_stats():
    """Get audit statistics - VS"""
    
    # Demo stats - in production aggregate from DynamoDB - VS
    stats = {
        'today': {
            'total': 156,
            'byAction': {
                'login': 45,
                'logout': 38,
                'create': 28,
                'read': 89,
                'update': 22,
                'delete': 5
            }
        },
        'lastWeek': {
            'total': 1243,
            'byResource': {
                'appointment': 345,
                'pet': 234,
                'user': 189,
                'payment': 156,
                'medical_record': 178,
                'other': 141
            }
        },
        'securityEvents': {
            'failedLogins': 12,
            'suspiciousActivity': 3,
            'passwordResets': 8
        },
        'generatedAt': datetime.utcnow().isoformat()
    }
    
    return jsonify(stats)

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 8009))
    logger.info(f"Starting Audit Service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)