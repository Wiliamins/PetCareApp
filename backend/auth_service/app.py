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

# Konfiguracja logowania - VS
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ==============================================
# Konfiguracja z zmiennych środowiskowych - VS
# ==============================================
APP_ENV = os.getenv('APP_ENV', 'development')
DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'

# AWS Cognito - VS
COGNITO_REGION = os.getenv('AWS_REGION', 'eu-central-1')
COGNITO_USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID', '')
COGNITO_CLIENT_ID = os.getenv('COGNITO_CLIENT_ID', '')
COGNITO_CLIENT_SECRET = os.getenv('COGNITO_CLIENT_SECRET', '')

# JWT dla development mode - VS
JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')

# Inicjalizacja klienta Cognito - VS
cognito_client = None
if COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID:
    try:
        cognito_client = boto3.client('cognito-idp', region_name=COGNITO_REGION)
        logger.info(f"Cognito client initialized for region {COGNITO_REGION}")
    except Exception as e:
        logger.warning(f"Could not initialize Cognito client: {e}")

def get_secret_hash(username):
    """Generowanie secret hash dla Cognito - VS"""
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
    """Weryfikacja tokena w trybie development - VS"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except:
        return None

def create_dev_token(user_data):
    """Tworzenie tokena w trybie development - VS"""
    import time
    payload = {
        **user_data,
        'iat': int(time.time()),
        'exp': int(time.time()) + 3600
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def token_required(f):
    """Dekorator wymagający tokena JWT - VS"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'error': 'Brak tokena autoryzacji'}), 401
        
        # Weryfikacja tokena - VS
        if cognito_client and COGNITO_USER_POOL_ID:
            try:
                # Pobierz dane użytkownika z Cognito - VS
                user_response = cognito_client.get_user(AccessToken=token)
                user_attributes = {attr['Name']: attr['Value'] for attr in user_response['UserAttributes']}
                request.user = user_attributes
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
# Health Check
# ==============================================

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """Sprawdzenie stanu serwisu - VS"""
    cognito_status = 'connected' if cognito_client else 'not configured (dev mode)'
    return jsonify({
        'service': 'auth_service',
        'status': 'healthy',
        'mode': APP_ENV,
        'cognito': cognito_status,
        'timestamp': datetime.utcnow().isoformat()
    })

# ==============================================
# Authentication Endpoints
# ==============================================

@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    """Logowanie użytkownika - VS"""
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'client')
    
    if not email or not password:
        return jsonify({'error': 'Email i hasło są wymagane'}), 400
    
    # Tryb produkcyjny - Cognito - VS
    if cognito_client and COGNITO_USER_POOL_ID:
        try:
            auth_params = {
                'USERNAME': email,
                'PASSWORD': password
            }
            
            secret_hash = get_secret_hash(email)
            if secret_hash:
                auth_params['SECRET_HASH'] = secret_hash
            
            response = cognito_client.initiate_auth(
                AuthFlow='USER_PASSWORD_AUTH',
                ClientId=COGNITO_CLIENT_ID,
                AuthParameters=auth_params
            )
            
            # Pobierz dane użytkownika - VS
            access_token = response['AuthenticationResult']['AccessToken']
            user_response = cognito_client.get_user(AccessToken=access_token)
            
            user_attributes = {attr['Name']: attr['Value'] for attr in user_response['UserAttributes']}
            
            user = {
                'id': user_attributes.get('sub'),
                'email': user_attributes.get('email'),
                'firstName': user_attributes.get('given_name', ''),
                'lastName': user_attributes.get('family_name', ''),
                'phone': user_attributes.get('phone_number', ''),
                'role': user_attributes.get('custom:role', role)
            }
            
            logger.info(f"User logged in via Cognito: {email}")
            
            return jsonify({
                'user': user,
                'accessToken': response['AuthenticationResult']['AccessToken'],
                'refreshToken': response['AuthenticationResult']['RefreshToken'],
                'expiresIn': response['AuthenticationResult']['ExpiresIn']
            })
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.warning(f"Cognito login error: {error_code} for {email}")
            
            if error_code == 'NotAuthorizedException':
                return jsonify({'error': 'Nieprawidłowy email lub hasło'}), 401
            elif error_code == 'UserNotFoundException':
                return jsonify({'error': 'Użytkownik nie istnieje'}), 404
            elif error_code == 'UserNotConfirmedException':
                return jsonify({'error': 'Konto nie zostało potwierdzone. Sprawdź email.'}), 403
            else:
                return jsonify({'error': 'Błąd logowania'}), 401
    
    # Tryb development - lokalna autoryzacja - VS
    else:
        logger.info(f"Development mode login: {email} as {role}")
        
        user = {
            'id': f'dev-user-{abs(hash(email)) % 10000}',
            'email': email,
            'firstName': email.split('@')[0].title(),
            'lastName': 'Dev',
            'role': role
        }
        
        access_token = create_dev_token(user)
        refresh_token = create_dev_token({'email': email, 'type': 'refresh'})
        
        return jsonify({
            'user': user,
            'accessToken': access_token,
            'refreshToken': refresh_token,
            'expiresIn': 3600
        })

@app.route('/api/v1/auth/register', methods=['POST'])
def register():
    """Rejestracja nowego użytkownika - VS"""
    data = request.get_json()
    
    required_fields = ['email', 'password', 'firstName', 'lastName', 'phone']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Pole {field} jest wymagane'}), 400
    
    email = data['email']
    password = data['password']
    
    # Walidacja hasła - VS
    if len(password) < 8:
        return jsonify({'error': 'Hasło musi mieć minimum 8 znaków'}), 400
    
    # Tryb produkcyjny - Cognito - VS
    if cognito_client and COGNITO_USER_POOL_ID:
        try:
            sign_up_params = {
                'ClientId': COGNITO_CLIENT_ID,
                'Username': email,
                'Password': password,
                'UserAttributes': [
                    {'Name': 'email', 'Value': email},
                    {'Name': 'given_name', 'Value': data['firstName']},
                    {'Name': 'family_name', 'Value': data['lastName']},
                    {'Name': 'phone_number', 'Value': data['phone']},
                    {'Name': 'custom:role', 'Value': 'client'}
                ]
            }
            
            secret_hash = get_secret_hash(email)
            if secret_hash:
                sign_up_params['SecretHash'] = secret_hash
            
            response = cognito_client.sign_up(**sign_up_params)
            
            logger.info(f"User registered via Cognito: {email}")
            
            return jsonify({
                'message': 'Rejestracja udana. Sprawdź email w celu potwierdzenia konta.',
                'userId': response['UserSub'],
                'confirmed': response['UserConfirmed']
            }), 201
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.warning(f"Cognito registration error: {error_code}")
            
            if error_code == 'UsernameExistsException':
                return jsonify({'error': 'Użytkownik o tym adresie email już istnieje'}), 409
            elif error_code == 'InvalidPasswordException':
                return jsonify({'error': 'Hasło nie spełnia wymagań bezpieczeństwa'}), 400
            else:
                return jsonify({'error': 'Błąd rejestracji'}), 400
    
    # Tryb development - VS
    else:
        logger.info(f"Development mode registration: {email}")
        return jsonify({
            'message': 'Rejestracja udana (tryb development).',
            'userId': f'dev-user-{abs(hash(email)) % 10000}',
            'confirmed': True
        }), 201

@app.route('/api/v1/auth/verify', methods=['GET'])
@token_required
def verify_token_endpoint():
    """Weryfikacja tokena i pobranie danych użytkownika - VS"""
    user = request.user
    return jsonify({
        'user': {
            'id': user.get('sub') or user.get('id'),
            'email': user.get('email'),
            'firstName': user.get('given_name') or user.get('firstName'),
            'lastName': user.get('family_name') or user.get('lastName'),
            'role': user.get('custom:role') or user.get('role', 'client')
        }
    })

@app.route('/api/v1/auth/refresh', methods=['POST'])
def refresh_token():
    """Odświeżenie tokena - VS"""
    data = request.get_json()
    refresh_token = data.get('refreshToken')
    
    if not refresh_token:
        return jsonify({'error': 'Refresh token jest wymagany'}), 400
    
    # Tryb produkcyjny - Cognito - VS
    if cognito_client and COGNITO_USER_POOL_ID:
        try:
            auth_params = {'REFRESH_TOKEN': refresh_token}
            
            response = cognito_client.initiate_auth(
                AuthFlow='REFRESH_TOKEN_AUTH',
                ClientId=COGNITO_CLIENT_ID,
                AuthParameters=auth_params
            )
            
            return jsonify({
                'accessToken': response['AuthenticationResult']['AccessToken'],
                'expiresIn': response['AuthenticationResult']['ExpiresIn']
            })
            
        except ClientError as e:
            logger.warning(f"Token refresh error: {e}")
            return jsonify({'error': 'Nieprawidłowy refresh token'}), 401
    
    # Tryb development - VS
    else:
        payload = verify_dev_token(refresh_token)
        if payload and payload.get('type') == 'refresh':
            new_token = create_dev_token({'email': payload['email'], 'role': 'client'})
            return jsonify({'accessToken': new_token, 'expiresIn': 3600})
        return jsonify({'error': 'Nieprawidłowy refresh token'}), 401

@app.route('/api/v1/auth/logout', methods=['POST'])
def logout():
    """Wylogowanie użytkownika - VS"""
    # Tryb produkcyjny - unieważnienie tokenów w Cognito - VS
    if cognito_client and COGNITO_USER_POOL_ID:
        try:
            access_token = request.headers.get('Authorization', '').replace('Bearer ', '')
            if access_token:
                cognito_client.global_sign_out(AccessToken=access_token)
                logger.info("User signed out via Cognito")
        except ClientError as e:
            logger.warning(f"Cognito sign out error: {e}")
    
    return jsonify({'message': 'Wylogowano pomyślnie'})

@app.route('/api/v1/auth/reset-password', methods=['POST'])
def reset_password():
    """Żądanie resetowania hasła - VS"""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email jest wymagany'}), 400
    
    # Tryb produkcyjny - Cognito - VS
    if cognito_client and COGNITO_USER_POOL_ID:
        try:
            params = {
                'ClientId': COGNITO_CLIENT_ID,
                'Username': email
            }
            
            secret_hash = get_secret_hash(email)
            if secret_hash:
                params['SecretHash'] = secret_hash
            
            cognito_client.forgot_password(**params)
            logger.info(f"Password reset requested for: {email}")
            
        except ClientError as e:
            logger.warning(f"Password reset error: {e}")
        
        # Zawsze zwracaj sukces ze względów bezpieczeństwa - VS
        return jsonify({'message': 'Jeśli konto istnieje, link został wysłany na podany email.'})
    
    # Tryb development - VS
    else:
        logger.info(f"Development mode password reset: {email}")
        return jsonify({'message': 'Link do resetowania hasła został wysłany (tryb development).'})

@app.route('/api/v1/auth/change-password', methods=['POST'])
@token_required
def change_password():
    """Zmiana hasła zalogowanego użytkownika - VS"""
    data = request.get_json()
    
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Aktualne i nowe hasło są wymagane'}), 400
    
    if len(new_password) < 8:
        return jsonify({'error': 'Nowe hasło musi mieć minimum 8 znaków'}), 400
    
    if cognito_client and COGNITO_USER_POOL_ID:
        try:
            access_token = request.headers.get('Authorization', '').replace('Bearer ', '')
            
            cognito_client.change_password(
                PreviousPassword=current_password,
                ProposedPassword=new_password,
                AccessToken=access_token
            )
            
            logger.info("Password changed successfully")
            return jsonify({'message': 'Hasło zostało zmienione'})
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NotAuthorizedException':
                return jsonify({'error': 'Nieprawidłowe aktualne hasło'}), 401
            return jsonify({'error': 'Błąd zmiany hasła'}), 400
    
    return jsonify({'message': 'Hasło zmienione (tryb development).'})

# ==============================================
# Error Handlers
# ==============================================

@app.errorhandler(400)
def bad_request(e):
    return jsonify({'error': 'Nieprawidłowe żądanie'}), 400

@app.errorhandler(401)
def unauthorized(e):
    return jsonify({'error': 'Brak autoryzacji'}), 401

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Nie znaleziono'}), 404

@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal error: {e}")
    return jsonify({'error': 'Błąd serwera'}), 500

# ==============================================
# Main
# ==============================================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8001))
    
    logger.info(f"Starting Auth Service on port {port}")
    logger.info(f"Environment: {APP_ENV}")
    logger.info(f"Cognito configured: {bool(cognito_client)}")
    
    app.run(host='0.0.0.0', port=port, debug=DEBUG)
