"""
PetCareApp - Authentication Service
Mikroserwis autoryzacji z pełną integracją AWS Cognito
@author VS
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import boto3
from botocore.exceptions import ClientError
import os
import logging
from datetime import datetime
import jwt
import hashlib
import hmac
import base64
import time

# Logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ==============================================
# ENV VARIABLES
# ==============================================
APP_ENV = os.getenv('APP_ENV', 'development')
DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'

<<<<<<< HEAD
# AWS Cognito
COGNITO_REGION = os.getenv('AWS_REGION', 'eu-central-1')
=======
# AWS Cognito - VS
COGNITO_REGION = os.getenv('AWS_REGION', 'eu-north-1')
>>>>>>> 93048a3e (New code parts)
COGNITO_USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID', '')
COGNITO_CLIENT_ID = os.getenv('COGNITO_CLIENT_ID', '')
COGNITO_CLIENT_SECRET = os.getenv('COGNITO_CLIENT_SECRET', '')

# JWT for dev mode
JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')

# Initialize Cognito client if configured
cognito_client = None
if COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID:
    try:
        cognito_client = boto3.client('cognito-idp', region_name=COGNITO_REGION)
        logger.info(f"Cognito client initialized for region {COGNITO_REGION}")
    except Exception as e:
        logger.warning(f"Could not initialize Cognito client: {e}")

# ==============================================
# Helpers
# ==============================================
def get_secret_hash(username):
    if not COGNITO_CLIENT_SECRET:
        return None
    message = username + COGNITO_CLIENT_ID
    dig = hmac.new(
        COGNITO_CLIENT_SECRET.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()

def verify_dev_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except:
        return None

def create_dev_token(user_data):
    payload = {
        **user_data,
        'iat': int(time.time()),
        'exp': int(time.time()) + 3600
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Brak tokena autoryzacji'}), 401

        if cognito_client and COGNITO_USER_POOL_ID:
            try:
                user_response = cognito_client.get_user(AccessToken=token)
                request.user = {attr['Name']: attr['Value'] for attr in user_response['UserAttributes']}
            except ClientError:
                return jsonify({'error': 'Nieprawidłowy lub wygasły token'}), 401
        else:
            payload = verify_dev_token(token)
            if not payload:
                return jsonify({'error': 'Nieprawidłowy lub wygasły token'}), 401
            request.user = payload
        return f(*args, **kwargs)
    return decorated

# ==============================================
# ROOT & HEALTH
# ==============================================
@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "service": "auth_service",
        "status": "running",
        "message": "PetCareApp Auth Service is up"
    })

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    cognito_status = 'connected' if cognito_client else 'not configured (dev mode)'
    return jsonify({
        'service': 'auth_service',
        'status': 'healthy',
        'mode': APP_ENV,
        'cognito': cognito_status,
        'timestamp': datetime.utcnow().isoformat()
    })

# ==============================================
# Main
# ==============================================
if __name__ == '__main__':
    port = int(os.getenv('PORT', 8001))  
    logger.info(f"Starting Auth Service on port {port}")
    logger.info(f"Environment: {APP_ENV}")
    logger.info(f"Cognito configured: {bool(cognito_client)}")
    app.run(host='0.0.0.0', port=port, debug=DEBUG)
