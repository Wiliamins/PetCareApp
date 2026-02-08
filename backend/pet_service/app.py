"""
PetCareApp - Pet Service
Serwis zarządzania zwierzętami z AWS DynamoDB i S3
@author VS
"""

from flask import Flask, request, jsonify

from datetime import datetime
import uuid
import os
import logging
import boto3
from botocore.exceptions import ClientError
import base64

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)


AWS_REGION = os.getenv('AWS_REGION', 'eu-north-1')
TABLE_NAME = 'PetCareApp-Pets'
S3_BUCKET = os.getenv('S3_BUCKET', 'petcareapp-files')

# AWS clients - VS
dynamodb = None
table = None
s3_client = None

try:
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    table = dynamodb.Table(TABLE_NAME)
    logger.info(f"DynamoDB connected: {TABLE_NAME}")
except Exception as e:
    logger.warning(f"DynamoDB not available: {e}")

try:
    s3_client = boto3.client('s3', region_name=AWS_REGION)
    logger.info(f"S3 client initialized for bucket: {S3_BUCKET}")
except Exception as e:
    logger.warning(f"S3 not available: {e}")

pets_db = {}

def save_pet(pet):
    if table:
        try:
            table.put_item(Item=pet)
            return True
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    pets_db[pet['id']] = pet
    return True

def get_pets_by_owner(owner_id):
    if table:
        try:
            response = table.query(
                IndexName='ownerId-index',
                KeyConditionExpression='ownerId = :oid',
                ExpressionAttributeValues={':oid': owner_id}
            )
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    return [p for p in pets_db.values() if p.get('ownerId') == owner_id]

def upload_to_s3(file_data, file_name, content_type='image/jpeg'):
    """Upload file to S3 - VS"""
    if not s3_client:
        logger.warning("S3 not configured")
        return None
    
    try:
        key = f"pets/{datetime.utcnow().strftime('%Y/%m')}/{uuid.uuid4()}/{file_name}"
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=file_data,
            ContentType=content_type
        )
        
        url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
        logger.info(f"File uploaded to S3: {key}")
        return url
    except ClientError as e:
        logger.error(f"S3 upload error: {e}")
        return None

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({
        'service': 'pet-service',
        'status': 'healthy',
        'dynamodb': table is not None,
        's3': s3_client is not None
    })

@app.route('/api/v1/pets', methods=['GET'])
def get_pets():
    """Get pets with filters - VS"""
    owner_id = request.args.get('ownerId')
    species = request.args.get('species')
    
    if owner_id:
        pets = get_pets_by_owner(owner_id)
    elif table:
        try:
            response = table.scan()
            pets = response.get('Items', [])
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
            pets = list(pets_db.values())
    else:
        pets = list(pets_db.values())
    
    if species:
        pets = [p for p in pets if p.get('species') == species]
    
    return jsonify(pets)

@app.route('/api/v1/pets/<pet_id>', methods=['GET'])
def get_pet(pet_id):
    if table:
        try:
            response = table.get_item(Key={'id': pet_id})
            pet = response.get('Item')
            if pet:
                return jsonify(pet)
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    pet = pets_db.get(pet_id)
    if not pet:
        return jsonify({'error': 'Pet not found'}), 404
    return jsonify(pet)

@app.route('/api/v1/pets', methods=['POST'])
def create_pet():
    """Create new pet - VS"""
    data = request.get_json()
    
    pet = {
        'id': str(uuid.
                  uuid4()),
        'ownerId': data.get('ownerId'),
        'name': data.get('name'),
        'species': data.get('species'),  # dog, cat, rabbit, etc.
        'breed': data.get('breed', ''),
        'gender': data.get('gender'),  # male, female
        'birthDate': data.get('birthDate'),
        'weight': data.get('weight'),
        'color': data.get('color', ''),
        'microchipNumber': data.get('microchipNumber', ''),
        'isNeutered': data.get('isNeutered', False),
        'allergies': data.get('allergies', []),
        'chronicConditions': data.get('chronicConditions', []),
        'notes': data.get('notes', ''),
        'photoUrl': data.get('photoUrl', ''),
        'isActive': True,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    }
    
    save_pet(pet)
    logger.info(f"Pet created: {pet['id']} - {pet['name']}")
    return jsonify(pet), 201

@app.route('/api/v1/pets/<pet_id>', methods=['PUT'])
def update_pet(pet_id):
    """Update pet - VS"""
    if table:
        try:
            response = table.get_item(Key={'id': pet_id})
            pet = response.get('Item')
        except:
            pet = None
    else:
        pet = pets_db.get(pet_id)
    
    if not pet:
        return jsonify({'error': 'Pet not found'}), 404
    
    data = request.get_json()
    pet.update({
        'name': data.get('name', pet.get('name')),
        'breed': data.get('breed', pet.get('breed')),
        'weight': data.get('weight', pet.get('weight')),
        'color': data.get('color', pet.get('color')),
        'isNeutered': data.get('isNeutered', pet.get('isNeutered')),
        'allergies': data.get('allergies', pet.get('allergies')),
        'chronicConditions': data.get('chronicConditions', pet.get('chronicConditions')),
        'notes': data.get('notes', pet.get('notes')),
        'photoUrl': data.get('photoUrl', pet.get('photoUrl')),
        'updatedAt': datetime.utcnow().isoformat()
    })
    
    save_pet(pet)
    return jsonify(pet)

@app.route('/api/v1/pets/<pet_id>/photo', methods=['POST'])
def upload_pet_photo(pet_id):
    """Upload pet photo to S3 - VS"""
    if table:
        try:
            response = table.get_item(Key={'id': pet_id})
            pet = response.get('Item')
        except:
            pet = None
    else:
        pet = pets_db.get(pet_id)
    
    if not pet:
        return jsonify({'error': 'Pet not found'}), 404
    
    data = request.get_json()
    image_data = data.get('image')  # Base64 encoded
    file_name = data.get('fileName', 'photo.jpg')
    
    if not image_data:
        return jsonify({'error': 'No image data'}), 400
    
    try:
        # Decode base64
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        
        # Upload to S3
        photo_url = upload_to_s3(image_bytes, file_name)
        
        if photo_url:
            pet['photoUrl'] = photo_url
            pet['updatedAt'] = datetime.utcnow().isoformat()
            save_pet(pet)
            return jsonify({'photoUrl': photo_url})
        else:
            return jsonify({'error': 'Failed to upload'}), 500
            
    except Exception as e:
        logger.error(f"Photo upload error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/pets/<pet_id>', methods=['DELETE'])
def delete_pet(pet_id):
    if table:
        try:
            table.delete_item(Key={'id': pet_id})
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    if pet_id in pets_db:
        del pets_db[pet_id]
    
    return jsonify({'message': 'Pet deleted'})

@app.route('/api/v1/pets/species', methods=['GET'])
def get_species_list():
    """Get list of supported species - VS"""
    species = [
        {'id': 'dog', 'name': 'Pies', 'icon': '🐕'},
        {'id': 'cat', 'name': 'Kot', 'icon': '🐈'},
        {'id': 'rabbit', 'name': 'Królik', 'icon': '🐰'},
        {'id': 'hamster', 'name': 'Chomik', 'icon': '🐹'},
        {'id': 'guinea_pig', 'name': 'Świnka morska', 'icon': '🐹'},
        {'id': 'bird', 'name': 'Ptak', 'icon': '🐦'},
        {'id': 'fish', 'name': 'Ryba', 'icon': '🐟'},
        {'id': 'reptile', 'name': 'Gad', 'icon': '🦎'},
        {'id': 'other', 'name': 'Inne', 'icon': '🐾'}
    ]
    return jsonify(species)

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 8012))
    logger.info(f"Starting Pet Service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)