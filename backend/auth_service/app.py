"""
PetCareApp - Auth Service
Serwis autoryzacji z AWS Cognito
@author VS
"""

from flask import Flask, request, jsonify

from datetime import datetime, timedelta
import os
import logging
import jwt
import boto3
from botocore.exceptions import ClientError

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# AWS Configuration - VS
AWS_REGION = os.getenv('AWS_REGION', 'eu-north-1')
COGNITO_USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID', '')
COGNITO_CLIENT_ID = os.getenv('COGNITO_CLIENT_ID', '')
JWT_SECRET = os.getenv('JWT_SECRET', 'petcareapp-secret-key-2025')

# Cognito client - VS
cognito_client = None
try:
    cognito_client = boto3.client('cognito-idp', region_name=AWS_REGION)
    logger.info("AWS Cognito client initialized")
except Exception as e:
    logger.warning(f"Cognito not available: {e}")

# Test accounts for development - VS
TEST_ACCOUNTS = {
    'admin@petcareapp.com': {'password': 'Admin123!', 'id': 'test-admin-001', 'firstName': 'Admin', 'lastName': 'System', 'role': 'admin'},
    'vet@petcareapp.com': {'password': 'Vet123!', 'id': 'test-vet-001', 'firstName': 'Jan', 'lastName': 'Kowalski', 'role': 'vet'},
    'client@petcareapp.com': {'password': 'Client123!', 'id': 'test-client-001', 'firstName': 'Anna', 'lastName': 'Nowak', 'role': 'client'},
    'it@petcareapp.com': {'password': 'It123!', 'id': 'test-it-001', 'firstName': 'Piotr', 'lastName': 'Wiśniewski', 'role': 'it'}
}

def create_token(user_data, expires_hours=24):
    """Create JWT token - VS"""
    payload = {
        **user_data,
        'exp': datetime.utcnow() + timedelta(hours=expires_hours),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token):
    """Verify JWT token - VS"""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({
        'service': 'auth-service',
        'status': 'healthy',
        'cognito': cognito_client is not None,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    """Login endpoint - VS"""
    data = request.get_json()
    email = data.get('email', '').lower().strip()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Check test accounts first - VS
    if email in TEST_ACCOUNTS:
        account = TEST_ACCOUNTS[email]
        if password == account['password']:
            user = {
                'id': account['id'],
                'email': email,
                'firstName': account['firstName'],
                'lastName': account['lastName'],
                'role': account['role']
            }
            access_token = create_token(user)
            refresh_token = create_token({'email': email, 'type': 'refresh'}, expires_hours=168)
            
            logger.info(f"Test account login: {email}")
            return jsonify({
                'user': user,
                'accessToken': access_token,
                'refreshToken': refresh_token,
                'expiresIn': 86400
            })
        else:
            return jsonify({'error': 'Invalid password'}), 401
    
    # Try Cognito authentication - VS
    if cognito_client and COGNITO_CLIENT_ID:
        try:
            response = cognito_client.initiate_auth(
                ClientId=COGNITO_CLIENT_ID,
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters={
                    'USERNAME': email,
                    'PASSWORD': password
                }
            )
            
            # Get user attributes
            access_token = response['AuthenticationResult']['AccessToken']
            user_response = cognito_client.get_user(AccessToken=access_token)
            
            attributes = {attr['Name']: attr['Value'] for attr in user_response['UserAttributes']}
            
            user = {
                'id': attributes.get('sub', ''),
                'email': email,
                'firstName': attributes.get('given_name', ''),
                'lastName': attributes.get('family_name', ''),
                'role': attributes.get('custom:role', 'client')
            }
            
            return jsonify({
                'user': user,
                'accessToken': response['AuthenticationResult']['AccessToken'],
                'refreshToken': response['AuthenticationResult']['RefreshToken'],
                'expiresIn': response['AuthenticationResult']['ExpiresIn']
            })
            
        except cognito_client.exceptions.NotAuthorizedException:
            return jsonify({'error': 'Invalid credentials'}), 401
        except cognito_client.exceptions.UserNotFoundException:
            return jsonify({'error': 'User not found'}), 404
        except Exception as e:
            logger.error(f"Cognito error: {e}")
            return jsonify({'error': 'Authentication failed'}), 500
    
    return jsonify({'error': 'Authentication service unavailable'}), 503

@app.route('/api/v1/auth/register', methods=['POST'])
def register():
    """Register new user - VS"""
    data = request.get_json()
    email = data.get('email', '').lower().strip()
    password = data.get('password', '')
    first_name = data.get('firstName', '')
    last_name = data.get('lastName', '')
    role = data.get('role', 'client')
    
    if not all([email, password, first_name, last_name]):
        return jsonify({'error': 'All fields are required'}), 400
    
    if cognito_client and COGNITO_CLIENT_ID:
        try:
            response = cognito_client.sign_up(
                ClientId=COGNITO_CLIENT_ID,
                Username=email,
                Password=password,
                UserAttributes=[
                    {'Name': 'email', 'Value': email},
                    {'Name': 'given_name', 'Value': first_name},
                    {'Name': 'family_name', 'Value': last_name},
                    {'Name': 'custom:role', 'Value': role}
                ]
            )
            
            return jsonify({
                'message': 'Registration successful. Please check your email for verification.',
                'userId': response['UserSub']
            }), 201
            
        except cognito_client.exceptions.UsernameExistsException:
            return jsonify({'error': 'User already exists'}), 409
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Registration service unavailable'}), 503

@app.route('/api/v1/auth/verify', methods=['GET'])
def verify():
    """Verify email with code - VS"""
    data = request.get_json()
    email = data.get('email', '')
    code = data.get('code', '')
    
    if cognito_client and COGNITO_CLIENT_ID:
        try:
            cognito_client.confirm_sign_up(
                ClientId=COGNITO_CLIENT_ID,
                Username=email,
                ConfirmationCode=code
            )
            return jsonify({'message': 'Email verified successfully'})
        except Exception as e:
            return jsonify({'error': str(e)}), 400
    
    return jsonify({'message': 'Verified'}), 200

@app.route('/api/v1/auth/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token - VS"""
    data = request.get_json()
    refresh_token = data.get('refreshToken', '')
    
    decoded = verify_token(refresh_token)
    if not decoded or decoded.get('type') != 'refresh':
        return jsonify({'error': 'Invalid refresh token'}), 401
    
    email = decoded.get('email', '')
    if email in TEST_ACCOUNTS:
        account = TEST_ACCOUNTS[email]
        user = {
            'id': account['id'],
            'email': email,
            'firstName': account['firstName'],
            'lastName': account['lastName'],
            'role': account['role']
        }
        new_token = create_token(user)
        return jsonify({'accessToken': new_token, 'expiresIn': 86400})
    
    return jsonify({'error': 'Token refresh failed'}), 401

@app.route('/api/v1/auth/logout', methods=['POST'])
def logout():
    """Logout user - VS"""
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/v1/auth/me', methods=['GET'])
def get_current_user():
    """Get current user from token - VS"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No token provided'}), 401
    
    token = auth_header.split(' ')[1]
    decoded = verify_token(token)
    
    if not decoded:
        return jsonify({'error': 'Invalid token'}), 401
    
    return jsonify({
        'id': decoded.get('id'),
        'email': decoded.get('email'),
        'firstName': decoded.get('firstName'),
        'lastName': decoded.get('lastName'),
        'role': decoded.get('role')
    })

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 8001))
    logger.info(f"Starting Auth Service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)