"""
PetCareApp - User Service
Serwis zarządzania użytkownikami z AWS DynamoDB
@author VS
"""

from flask import Flask, request, jsonify

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
TABLE_NAME = 'PetCareApp-Users'

# DynamoDB - VS
dynamodb = None
table = None
try:
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    table = dynamodb.Table(TABLE_NAME)
    logger.info(f"DynamoDB connected: {TABLE_NAME}")
except Exception as e:
    logger.warning(f"DynamoDB not available: {e}")

# In-memory storage - VS
users_db = {}

def get_user(user_id):
    if table:
        try:
            response = table.get_item(Key={'id': user_id})
            return response.get('Item')
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    return users_db.get(user_id)

def save_user(user):
    if table:
        try:
            table.put_item(Item=user)
            return True
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    users_db[user['id']] = user
    return True

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'user-service', 'status': 'healthy', 'dynamodb': table is not None})

@app.route('/api/v1/users', methods=['GET'])
def get_users():
    """Get all users - VS"""
    role = request.args.get('role')
    
    if table:
        try:
            if role:
                response = table.scan(FilterExpression='#r = :role', ExpressionAttributeNames={'#r': 'role'}, ExpressionAttributeValues={':role': role})
            else:
                response = table.scan()
            return jsonify(response.get('Items', []))
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    users = list(users_db.values())
    if role:
        users = [u for u in users if u.get('role') == role]
    return jsonify(users)

@app.route('/api/v1/users/<user_id>', methods=['GET'])
def get_user_by_id(user_id):
    user = get_user(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user)

@app.route('/api/v1/users', methods=['POST'])
def create_user():
    """Create new user - VS"""
    data = request.get_json()
    
    user = {
        'id': str(uuid.uuid4()),
        'email': data.get('email', '').lower(),
        'firstName': data.get('firstName', ''),
        'lastName': data.get('lastName', ''),
        'role': data.get('role', 'client'),
        'phone': data.get('phone', ''),
        'address': data.get('address', ''),
        'isActive': True,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    }
    
    save_user(user)
    return jsonify(user), 201

@app.route('/api/v1/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user - VS"""
    user = get_user(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    user.update({
        'firstName': data.get('firstName', user.get('firstName')),
        'lastName': data.get('lastName', user.get('lastName')),
        'phone': data.get('phone', user.get('phone')),
        'address': data.get('address', user.get('address')),
        'updatedAt': datetime.utcnow().isoformat()
    })
    
    save_user(user)
    return jsonify(user)

@app.route('/api/v1/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user - VS"""
    if table:
        try:
            table.delete_item(Key={'id': user_id})
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    if user_id in users_db:
        del users_db[user_id]
        return jsonify({'message': 'User deleted'})

@app.route('/api/v1/users/vets', methods=['GET'])
def get_vets():
    """Get all veterinarians - VS"""
    if table:
        try:
            response = table.scan(FilterExpression='#r = :role', ExpressionAttributeNames={'#r': 'role'}, ExpressionAttributeValues={':role': 'vet'})
            return jsonify(response.get('Items', []))
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    vets = [u for u in users_db.values() if u.get('role') == 'vet']
    return jsonify(vets)

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 8002))
    logger.info(f"Starting User Service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)