"""
PetCareApp - User Management Service
Mikroserwis zarządzania użytkownikami i zwierzętami z DynamoDB
@author VS
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr
import os
import logging
from datetime import datetime
import uuid
import json

# Konfiguracja logowania - VS
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ==============================================
# Konfiguracja - VS
# ==============================================
APP_ENV = os.getenv('APP_ENV', 'development')
DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'

# DynamoDB - VS
AWS_REGION = os.getenv('AWS_REGION', 'eu-central-1')
DYNAMODB_ENDPOINT = os.getenv('DYNAMODB_ENDPOINT', None)
TABLE_PREFIX = os.getenv('DYNAMODB_TABLE_PREFIX', 'petcareapp_')

USERS_TABLE = f'{TABLE_PREFIX}users'
PETS_TABLE = f'{TABLE_PREFIX}pets'

# Inicjalizacja DynamoDB - VS
dynamodb = None
users_table = None
pets_table = None

# In-memory storage dla development bez DynamoDB - VS
users_memory = {}
pets_memory = {}

def init_dynamodb():
    """Inicjalizacja połączenia z DynamoDB - VS"""
    global dynamodb, users_table, pets_table
    
    try:
        if DYNAMODB_ENDPOINT:
            dynamodb = boto3.resource(
                'dynamodb',
                region_name=AWS_REGION,
                endpoint_url=DYNAMODB_ENDPOINT
            )
        else:
            dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
        
        users_table = dynamodb.Table(USERS_TABLE)
        pets_table = dynamodb.Table(PETS_TABLE)
        
        # Test połączenia - VS
        users_table.table_status
        pets_table.table_status
        
        logger.info(f"DynamoDB connected: {USERS_TABLE}, {PETS_TABLE}")
        return True
    except Exception as e:
        logger.warning(f"DynamoDB not available, using in-memory storage: {e}")
        return False

# Spróbuj połączyć z DynamoDB - VS
USE_DYNAMODB = init_dynamodb()

def token_required(f):
    """Dekorator wymagający tokena JWT - VS"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Brak tokena autoryzacji'}), 401
        
        # W produkcji token jest weryfikowany przez API Gateway lub Auth Service - VS
        # Tutaj zakładamy że token jest już zweryfikowany
        request.user = {'id': 'user-from-token', 'role': 'client'}
        return f(*args, **kwargs)
    return decorated

# ==============================================
# Helper Functions - VS
# ==============================================

def create_user_in_db(user_data):
    """Tworzenie użytkownika w bazie - VS"""
    user_id = user_data.get('id') or str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    user = {
        'id': user_id,
        'email': user_data['email'],
        'firstName': user_data.get('firstName', ''),
        'lastName': user_data.get('lastName', ''),
        'phone': user_data.get('phone', ''),
        'role': user_data.get('role', 'client'),
        'isActive': user_data.get('isActive', True),
        'createdAt': timestamp,
        'updatedAt': timestamp
    }
    
    if USE_DYNAMODB:
        try:
            users_table.put_item(Item=user)
        except ClientError as e:
            logger.error(f"Error creating user: {e}")
            raise
    else:
        users_memory[user_id] = user
    
    return user

def get_user_by_id(user_id):
    """Pobranie użytkownika po ID - VS"""
    if USE_DYNAMODB:
        try:
            response = users_table.get_item(Key={'id': user_id})
            return response.get('Item')
        except ClientError as e:
            logger.error(f"Error getting user: {e}")
            return None
    else:
        return users_memory.get(user_id)

def get_all_users(role=None, limit=100):
    """Pobranie wszystkich użytkowników - VS"""
    if USE_DYNAMODB:
        try:
            if role:
                response = users_table.scan(
                    FilterExpression=Attr('role').eq(role),
                    Limit=limit
                )
            else:
                response = users_table.scan(Limit=limit)
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"Error scanning users: {e}")
            return []
    else:
        users = list(users_memory.values())
        if role:
            users = [u for u in users if u.get('role') == role]
        return users[:limit]

def update_user_in_db(user_id, updates):
    """Aktualizacja użytkownika - VS"""
    updates['updatedAt'] = datetime.utcnow().isoformat()
    
    if USE_DYNAMODB:
        try:
            update_expr = "SET " + ", ".join(f"#{k} = :{k}" for k in updates.keys())
            expr_names = {f"#{k}": k for k in updates.keys()}
            expr_values = {f":{k}": v for k, v in updates.items()}
            
            response = users_table.update_item(
                Key={'id': user_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values,
                ReturnValues='ALL_NEW'
            )
            return response.get('Attributes')
        except ClientError as e:
            logger.error(f"Error updating user: {e}")
            return None
    else:
        if user_id in users_memory:
            users_memory[user_id].update(updates)
            return users_memory[user_id]
        return None

def create_pet_in_db(pet_data):
    """Tworzenie zwierzęcia w bazie - VS"""
    pet_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    pet = {
        'id': pet_id,
        'ownerId': pet_data['ownerId'],
        'name': pet_data['name'],
        'species': pet_data.get('species', ''),
        'breed': pet_data.get('breed', ''),
        'birthDate': pet_data.get('birthDate'),
        'gender': pet_data.get('gender', ''),
        'weight': pet_data.get('weight'),
        'color': pet_data.get('color', ''),
        'microchipNumber': pet_data.get('microchipNumber'),
        'photoUrl': pet_data.get('photoUrl'),
        'notes': pet_data.get('notes', ''),
        'createdAt': timestamp,
        'updatedAt': timestamp
    }
    
    if USE_DYNAMODB:
        try:
            pets_table.put_item(Item=pet)
        except ClientError as e:
            logger.error(f"Error creating pet: {e}")
            raise
    else:
        pets_memory[pet_id] = pet
    
    return pet

def get_pet_by_id(pet_id):
    """Pobranie zwierzęcia po ID - VS"""
    if USE_DYNAMODB:
        try:
            response = pets_table.get_item(Key={'id': pet_id})
            return response.get('Item')
        except ClientError as e:
            logger.error(f"Error getting pet: {e}")
            return None
    else:
        return pets_memory.get(pet_id)

def get_pets_by_owner(owner_id):
    """Pobranie zwierząt właściciela - VS"""
    if USE_DYNAMODB:
        try:
            response = pets_table.scan(
                FilterExpression=Attr('ownerId').eq(owner_id)
            )
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"Error getting pets: {e}")
            return []
    else:
        return [p for p in pets_memory.values() if p.get('ownerId') == owner_id]

def delete_pet_from_db(pet_id):
    """Usunięcie zwierzęcia - VS"""
    if USE_DYNAMODB:
        try:
            pets_table.delete_item(Key={'id': pet_id})
            return True
        except ClientError as e:
            logger.error(f"Error deleting pet: {e}")
            return False
    else:
        if pet_id in pets_memory:
            del pets_memory[pet_id]
            return True
        return False

# ==============================================
# Health Check
# ==============================================

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """Sprawdzenie stanu serwisu - VS"""
    db_status = 'dynamodb' if USE_DYNAMODB else 'in-memory'
    return jsonify({
        'service': 'user_service',
        'status': 'healthy',
        'mode': APP_ENV,
        'database': db_status,
        'timestamp': datetime.utcnow().isoformat()
    })

# ==============================================
# Users API
# ==============================================

@app.route('/api/v1/users', methods=['GET'])
@token_required
def get_users():
    """Pobranie listy użytkowników (admin) - VS"""
    role = request.args.get('role')
    limit = int(request.args.get('limit', 100))
    
    users = get_all_users(role=role, limit=limit)
    return jsonify(users)

@app.route('/api/v1/users/<user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    """Pobranie użytkownika po ID - VS"""
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'Użytkownik nie znaleziony'}), 404
    return jsonify(user)

@app.route('/api/v1/users', methods=['POST'])
@token_required
def create_user():
    """Utworzenie użytkownika (admin) - VS"""
    data = request.get_json()
    
    if not data.get('email'):
        return jsonify({'error': 'Email jest wymagany'}), 400
    
    try:
        user = create_user_in_db(data)
        logger.info(f"Created user: {user['id']}")
        return jsonify(user), 201
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return jsonify({'error': 'Błąd tworzenia użytkownika'}), 500

@app.route('/api/v1/users/<user_id>', methods=['PUT'])
@token_required
def update_user(user_id):
    """Aktualizacja użytkownika - VS"""
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'Użytkownik nie znaleziony'}), 404
    
    data = request.get_json()
    # Nie pozwalaj na zmianę ID i email - VS
    data.pop('id', None)
    data.pop('email', None)
    
    updated = update_user_in_db(user_id, data)
    if updated:
        return jsonify(updated)
    return jsonify({'error': 'Błąd aktualizacji'}), 500

@app.route('/api/v1/users/<user_id>/activate', methods=['POST'])
@token_required
def activate_user(user_id):
    """Aktywacja użytkownika - VS"""
    updated = update_user_in_db(user_id, {'isActive': True})
    if updated:
        return jsonify({'message': 'Użytkownik aktywowany'})
    return jsonify({'error': 'Użytkownik nie znaleziony'}), 404

@app.route('/api/v1/users/<user_id>/deactivate', methods=['POST'])
@token_required
def deactivate_user(user_id):
    """Dezaktywacja użytkownika - VS"""
    updated = update_user_in_db(user_id, {'isActive': False})
    if updated:
        return jsonify({'message': 'Użytkownik dezaktywowany'})
    return jsonify({'error': 'Użytkownik nie znaleziony'}), 404

@app.route('/api/v1/users/veterinarians', methods=['GET'])
@token_required
def get_veterinarians():
    """Pobranie listy weterynarzy - VS"""
    vets = get_all_users(role='vet')
    return jsonify(vets)

@app.route('/api/v1/users/clients', methods=['GET'])
@token_required
def get_clients():
    """Pobranie listy klientów - VS"""
    clients = get_all_users(role='client')
    return jsonify(clients)

@app.route('/api/v1/users/stats', methods=['GET'])
@token_required
def get_user_stats():
    """Pobranie statystyk użytkowników - VS"""
    all_users = get_all_users()
    all_pets = list(pets_memory.values()) if not USE_DYNAMODB else []
    
    if USE_DYNAMODB:
        try:
            response = pets_table.scan(Select='COUNT')
            pets_count = response.get('Count', 0)
        except:
            pets_count = 0
    else:
        pets_count = len(all_pets)
    
    return jsonify({
        'totalUsers': len(all_users),
        'clients': len([u for u in all_users if u.get('role') == 'client']),
        'veterinarians': len([u for u in all_users if u.get('role') == 'vet']),
        'totalPets': pets_count
    })

# ==============================================
# Pets API
# ==============================================

@app.route('/api/v1/pets', methods=['GET'])
@token_required
def get_pets():
    """Pobranie listy zwierząt użytkownika - VS"""
    user_id = request.args.get('userId') or request.args.get('ownerId') or request.user['id']
    pets = get_pets_by_owner(user_id)
    return jsonify(pets)

@app.route('/api/v1/pets/<pet_id>', methods=['GET'])
@token_required
def get_pet(pet_id):
    """Pobranie zwierzęcia po ID - VS"""
    pet = get_pet_by_id(pet_id)
    if not pet:
        return jsonify({'error': 'Zwierzę nie znalezione'}), 404
    return jsonify(pet)

@app.route('/api/v1/pets', methods=['POST'])
@token_required
def create_pet():
    """Dodanie nowego zwierzęcia - VS"""
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Nazwa zwierzęcia jest wymagana'}), 400
    
    # Ustaw właściciela - VS
    data['ownerId'] = data.get('ownerId') or request.user['id']
    
    try:
        pet = create_pet_in_db(data)
        logger.info(f"Created pet: {pet['id']} for owner {pet['ownerId']}")
        return jsonify(pet), 201
    except Exception as e:
        logger.error(f"Error creating pet: {e}")
        return jsonify({'error': 'Błąd dodawania zwierzęcia'}), 500

@app.route('/api/v1/pets/<pet_id>', methods=['PUT'])
@token_required
def update_pet(pet_id):
    """Aktualizacja zwierzęcia - VS"""
    pet = get_pet_by_id(pet_id)
    if not pet:
        return jsonify({'error': 'Zwierzę nie znalezione'}), 404
    
    data = request.get_json()
    data['updatedAt'] = datetime.utcnow().isoformat()
    
    if USE_DYNAMODB:
        try:
            update_expr = "SET " + ", ".join(f"#{k} = :{k}" for k in data.keys())
            expr_names = {f"#{k}": k for k in data.keys()}
            expr_values = {f":{k}": v for k, v in data.items()}
            
            response = pets_table.update_item(
                Key={'id': pet_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values,
                ReturnValues='ALL_NEW'
            )
            return jsonify(response.get('Attributes'))
        except ClientError as e:
            logger.error(f"Error updating pet: {e}")
            return jsonify({'error': 'Błąd aktualizacji'}), 500
    else:
        pets_memory[pet_id].update(data)
        return jsonify(pets_memory[pet_id])

@app.route('/api/v1/pets/<pet_id>', methods=['DELETE'])
@token_required
def delete_pet(pet_id):
    """Usunięcie zwierzęcia - VS"""
    if not get_pet_by_id(pet_id):
        return jsonify({'error': 'Zwierzę nie znalezione'}), 404
    
    if delete_pet_from_db(pet_id):
        logger.info(f"Deleted pet: {pet_id}")
        return jsonify({'message': 'Zwierzę usunięte'})
    return jsonify({'error': 'Błąd usuwania'}), 500

@app.route('/api/v1/pets/search', methods=['GET'])
@token_required
def search_pets():
    """Wyszukiwanie zwierząt - VS"""
    query = request.args.get('q', '').lower()
    species = request.args.get('species')
    
    if USE_DYNAMODB:
        try:
            scan_kwargs = {}
            filters = []
            
            if species:
                filters.append(Attr('species').eq(species))
            
            if filters:
                scan_kwargs['FilterExpression'] = filters[0]
                for f in filters[1:]:
                    scan_kwargs['FilterExpression'] = scan_kwargs['FilterExpression'] & f
            
            response = pets_table.scan(**scan_kwargs)
            results = response.get('Items', [])
            
            if query:
                results = [p for p in results if query in p.get('name', '').lower()]
            
            return jsonify(results)
        except ClientError as e:
            logger.error(f"Error searching pets: {e}")
            return jsonify([])
    else:
        results = list(pets_memory.values())
        if query:
            results = [p for p in results if query in p.get('name', '').lower()]
        if species:
            results = [p for p in results if p.get('species') == species]
        return jsonify(results)

# ==============================================
# Error Handlers
# ==============================================

@app.errorhandler(400)
def bad_request(e):
    return jsonify({'error': 'Nieprawidłowe żądanie'}), 400

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
    port = int(os.getenv('PORT', 8002))
    
    logger.info(f"Starting User Service on port {port}")
    logger.info(f"Environment: {APP_ENV}")
    logger.info(f"Database: {'DynamoDB' if USE_DYNAMODB else 'In-Memory'}")
    
    app.run(host='0.0.0.0', port=port, debug=DEBUG)
