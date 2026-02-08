"""
PetCareApp - Medical Records Service
Serwis dokumentacji medycznej z AWS DynamoDB
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
TABLE_NAME = 'PetCareApp-MedicalRecords'

dynamodb = None
table = None
try:
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    table = dynamodb.Table(TABLE_NAME)
    logger.info(f"DynamoDB connected: {TABLE_NAME}")
except Exception as e:
    logger.warning(f"DynamoDB not available: {e}")

records_db = {}

def save_record(record):
    if table:
        try:
            table.put_item(Item=record)
            return True
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    records_db[record['id']] = record
    return True

def get_records_by_pet(pet_id):
    if table:
        try:
            response = table.query(
                IndexName='petId-createdAt-index',
                KeyConditionExpression='petId = :pid',
                ExpressionAttributeValues={':pid': pet_id},
                ScanIndexForward=False
            )
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    return [r for r in records_db.values() if r.get('petId') == pet_id]

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'medical-records-service', 'status': 'healthy', 'dynamodb': table is not None})

@app.route('/api/v1/medical-records', methods=['GET'])
def get_medical_records():
    """Get medical records - VS"""
    pet_id = request.args.get('petId')
    record_type = request.args.get('type')
    
    if pet_id:
        records = get_records_by_pet(pet_id)
    elif table:
        try:
            response = table.scan()
            records = response.get('Items', [])
        except:
            records = list(records_db.values())
    else:
        records = list(records_db.values())
    
    if record_type:
        records = [r for r in records if r.get('type') == record_type]
    
    return jsonify(records)

@app.route('/api/v1/medical-records/<record_id>', methods=['GET'])
def get_medical_record(record_id):
    if table:
        try:
            response = table.get_item(Key={'id': record_id})
            record = response.get('Item')
            if record:
                return jsonify(record)
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    record = records_db.get(record_id)
    if not record:
        return jsonify({'error': 'Record not found'}), 404
    return jsonify(record)

@app.route('/api/v1/medical-records', methods=['POST'])
def create_medical_record():
    """Create new medical record - VS"""
    data = request.get_json()
    
    record = {
        'id': str(uuid.uuid4()),
        'petId': data.get('petId'),
        'vetId': data.get('vetId'),
        'type': data.get('type', 'examination'),  # examination, vaccination, surgery, prescription
        'diagnosis': data.get('diagnosis', ''),
        'description': data.get('description', ''),
        'treatment': data.get('treatment', ''),
        'medications': data.get('medications', []),
        'vaccinations': data.get('vaccinations', []),
        'notes': data.get('notes', ''),
        'attachments': data.get('attachments', []),
        'followUpDate': data.get('followUpDate'),
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    }
    
    save_record(record)
    logger.info(f"Medical record created: {record['id']} for pet {record['petId']}")
    return jsonify(record), 201

@app.route('/api/v1/medical-records/<record_id>', methods=['PUT'])
def update_medical_record(record_id):
    """Update medical record - VS"""
    if table:
        try:
            response = table.get_item(Key={'id': record_id})
            record = response.get('Item')
        except:
            record = None
    else:
        record = records_db.get(record_id)
    
    if not record:
        return jsonify({'error': 'Record not found'}), 404
    
    data = request.get_json()
    record.update({
        'diagnosis': data.get('diagnosis', record.get('diagnosis')),
        'description': data.get('description', record.get('description')),
        'treatment': data.get('treatment', record.get('treatment')),
        'medications': data.get('medications', record.get('medications')),
        'notes': data.get('notes', record.get('notes')),
        'updatedAt': datetime.utcnow().isoformat()
    })
    
    save_record(record)
    return jsonify(record)

@app.route('/api/v1/medical-records/<record_id>', methods=['DELETE'])
def delete_medical_record(record_id):
    if table:
        try:
            table.delete_item(Key={'id': record_id})
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    if record_id in records_db:
        del records_db[record_id]
    
    return jsonify({'message': 'Record deleted'})

@app.route('/api/v1/medical-records/pet/<pet_id>/history', methods=['GET'])
def get_pet_medical_history(pet_id):
    """Get complete medical history for a pet - VS"""
    records = get_records_by_pet(pet_id)
    
    history = {
        'petId': pet_id,
        'totalRecords': len(records),
        'examinations': [r for r in records if r.get('type') == 'examination'],
        'vaccinations': [r for r in records if r.get('type') == 'vaccination'],
        'surgeries': [r for r in records if r.get('type') == 'surgery'],
        'prescriptions': [r for r in records if r.get('type') == 'prescription'],
        'records': records
    }
    
    return jsonify(history)

@app.route('/api/v1/medical-records/pet/<pet_id>/vaccinations', methods=['GET'])
def get_pet_vaccinations(pet_id):
    """Get vaccination records for a pet - VS"""
    records = get_records_by_pet(pet_id)
    vaccinations = [r for r in records if r.get('type') == 'vaccination']
    return jsonify(vaccinations)

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 8003))
    logger.info(f"Starting Medical Records Service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)