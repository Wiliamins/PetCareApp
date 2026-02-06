"""
PetCareApp - Drug Service
Serwis zarządzania receptami
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
CORS(app, resources={r"/api/*": {"origins": "*"}})

AWS_REGION = os.getenv('AWS_REGION', 'eu-north-1')
TABLE_NAME = 'PetCareApp-Prescriptions'

dynamodb = None
table = None
try:
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    table = dynamodb.Table(TABLE_NAME)
    logger.info(f"DynamoDB connected: {TABLE_NAME}")
except Exception as e:
    logger.warning(f"DynamoDB not available: {e}")

prescriptions_db = {}

def save_prescription(prescription):
    if table:
        try:
            table.put_item(Item=prescription)
            return True
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    prescriptions_db[prescription['id']] = prescription
    return True

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'drug-service', 'status': 'healthy', 'dynamodb': table is not None})

@app.route('/api/v1/prescriptions', methods=['GET'])
def get_prescriptions():
    """Get prescriptions - VS"""
    pet_id = request.args.get('petId')
    vet_id = request.args.get('vetId')
    status = request.args.get('status')
    
    if table:
        try:
            if pet_id:
                response = table.query(
                    IndexName='petId-index',
                    KeyConditionExpression='petId = :pid',
                    ExpressionAttributeValues={':pid': pet_id}
                )
                prescriptions = response.get('Items', [])
            else:
                response = table.scan()
                prescriptions = response.get('Items', [])
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
            prescriptions = list(prescriptions_db.values())
    else:
        prescriptions = list(prescriptions_db.values())
    
    if vet_id:
        prescriptions = [p for p in prescriptions if p.get('vetId') == vet_id]
    if status:
        prescriptions = [p for p in prescriptions if p.get('status') == status]
    
    return jsonify(prescriptions)

@app.route('/api/v1/prescriptions/<prescription_id>', methods=['GET'])
def get_prescription(prescription_id):
    if table:
        try:
            response = table.get_item(Key={'id': prescription_id})
            prescription = response.get('Item')
            if prescription:
                return jsonify(prescription)
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    prescription = prescriptions_db.get(prescription_id)
    if not prescription:
        return jsonify({'error': 'Prescription not found'}), 404
    return jsonify(prescription)

@app.route('/api/v1/prescriptions', methods=['POST'])
def create_prescription():
    """Create new prescription - VS"""
    data = request.get_json()
    
    prescription = {
        'id': str(uuid.uuid4()),
        'petId': data.get('petId'),
        'petName': data.get('petName'),
        'ownerId': data.get('ownerId'),
        'ownerName': data.get('ownerName'),
        'vetId': data.get('vetId'),
        'vetName': data.get('vetName'),
        'diagnosis': data.get('diagnosis', ''),
        'medications': data.get('medications', []),  # [{name, dosage, frequency, duration, instructions}]
        'notes': data.get('notes', ''),
        'validFrom': data.get('validFrom', datetime.utcnow().isoformat()),
        'validUntil': data.get('validUntil'),
        'status': 'active',  # active, completed, cancelled
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    }
    
    save_prescription(prescription)
    logger.info(f"Prescription created: {prescription['id']} for pet {prescription['petId']}")
    return jsonify(prescription), 201

@app.route('/api/v1/prescriptions/<prescription_id>', methods=['PUT'])
def update_prescription(prescription_id):
    """Update prescription - VS"""
    if table:
        try:
            response = table.get_item(Key={'id': prescription_id})
            prescription = response.get('Item')
        except:
            prescription = None
    else:
        prescription = prescriptions_db.get(prescription_id)
    
    if not prescription:
        return jsonify({'error': 'Prescription not found'}), 404
    
    data = request.get_json()
    prescription.update({
        'medications': data.get('medications', prescription.get('medications')),
        'notes': data.get('notes', prescription.get('notes')),
        'status': data.get('status', prescription.get('status')),
        'updatedAt': datetime.utcnow().isoformat()
    })
    
    save_prescription(prescription)
    return jsonify(prescription)

@app.route('/api/v1/prescriptions/<prescription_id>/complete', methods=['POST'])
def complete_prescription(prescription_id):
    """Mark prescription as completed - VS"""
    if table:
        try:
            response = table.get_item(Key={'id': prescription_id})
            prescription = response.get('Item')
        except:
            prescription = None
    else:
        prescription = prescriptions_db.get(prescription_id)
    
    if not prescription:
        return jsonify({'error': 'Prescription not found'}), 404
    
    prescription['status'] = 'completed'
    prescription['completedAt'] = datetime.utcnow().isoformat()
    prescription['updatedAt'] = datetime.utcnow().isoformat()
    
    save_prescription(prescription)
    return jsonify(prescription)

@app.route('/api/v1/prescriptions/<prescription_id>', methods=['DELETE'])
def delete_prescription(prescription_id):
    if table:
        try:
            table.delete_item(Key={'id': prescription_id})
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    if prescription_id in prescriptions_db:
        del prescriptions_db[prescription_id]
    
    return jsonify({'message': 'Prescription deleted'})

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 8013))
    logger.info(f"Starting Drug Service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)