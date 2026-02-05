"""
PetCareApp - Medical Records Service (AWS DynamoDB)
@author VS
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid
import boto3
from boto3.dynamodb.conditions import Key

import os
import logging

# ------------------------------
# Flask app
# ------------------------------
app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ------------------------------
# AWS DynamoDB
# ------------------------------
AWS_REGION = os.getenv('AWS_REGION', 'eu-north-1')

dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)

RECORDS_TABLE = os.getenv('RECORDS_TABLE', 'PetRecords')
VACCINATIONS_TABLE = os.getenv('VACCINATIONS_TABLE', 'PetVaccinations')
PRESCRIPTIONS_TABLE = os.getenv('PRESCRIPTIONS_TABLE', 'PetPrescriptions')

records_table = dynamodb.Table(RECORDS_TABLE)
vaccinations_table = dynamodb.Table(VACCINATIONS_TABLE)
prescriptions_table = dynamodb.Table(PRESCRIPTIONS_TABLE)

# ------------------------------
# Health Check
# ------------------------------
@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'medical_records_service', 'status': 'healthy'})

# ------------------------------
# Records
# ------------------------------
@app.route('/api/v1/records/pet/<pet_id>', methods=['GET'])
def get_records(pet_id):
    """Get all medical records for a pet"""
    try:
        response = records_table.query(
            IndexName='PetIdIndex',  # GSI on petId
            KeyConditionExpression=Key('petId').eq(pet_id)
        )
        return jsonify(response.get('Items', []))
    except Exception as e:
        logger.error(f"Error fetching records: {e}")
        return jsonify({'error': 'Unable to fetch records'}), 500

@app.route('/api/v1/records', methods=['POST'])
def create_record():
    """Create a new medical record"""
    try:
        data = request.get_json()
        rec_id = str(uuid.uuid4())
        record = {
            'id': rec_id,
            'petId': data['petId'],
            'description': data.get('description', ''),
            'createdAt': datetime.utcnow().isoformat()
        }
        records_table.put_item(Item=record)
        return jsonify(record), 201
    except Exception as e:
        logger.error(f"Error creating record: {e}")
        return jsonify({'error': 'Unable to create record'}), 500

# ------------------------------
# Vaccinations
# ------------------------------
@app.route('/api/v1/vaccinations/pet/<pet_id>', methods=['GET'])
def get_vaccinations(pet_id):
    """Get all vaccinations for a pet"""
    try:
        response = vaccinations_table.query(
            IndexName='PetIdIndex',  # GSI on petId
            KeyConditionExpression=Key('petId').eq(pet_id)
        )
        return jsonify(response.get('Items', []))
    except Exception as e:
        logger.error(f"Error fetching vaccinations: {e}")
        return jsonify({'error': 'Unable to fetch vaccinations'}), 500

@app.route('/api/v1/vaccinations', methods=['POST'])
def add_vaccination():
    """Add a vaccination record"""
    try:
        data = request.get_json()
        vac_id = str(uuid.uuid4())
        vaccination = {
            'id': vac_id,
            'petId': data['petId'],
            'vaccine': data.get('vaccine', ''),
            'date': data.get('date', datetime.utcnow().isoformat()),
            'notes': data.get('notes', ''),
            'createdAt': datetime.utcnow().isoformat()
        }
        vaccinations_table.put_item(Item=vaccination)
        return jsonify(vaccination), 201
    except Exception as e:
        logger.error(f"Error adding vaccination: {e}")
        return jsonify({'error': 'Unable to add vaccination'}), 500

# ------------------------------
# Prescriptions
# ------------------------------
@app.route('/api/v1/prescriptions/pet/<pet_id>', methods=['GET'])
def get_prescriptions(pet_id):
    """Get all prescriptions for a pet"""
    try:
        response = prescriptions_table.query(
            IndexName='PetIdIndex',  # GSI on petId
            KeyConditionExpression=Key('petId').eq(pet_id)
        )
        return jsonify(response.get('Items', []))
    except Exception as e:
        logger.error(f"Error fetching prescriptions: {e}")
        return jsonify({'error': 'Unable to fetch prescriptions'}), 500

@app.route('/api/v1/prescriptions', methods=['POST'])
def create_prescription():
    """Create a new prescription"""
    try:
        data = request.get_json()
        presc_id = str(uuid.uuid4())
        prescription = {
            'id': presc_id,
            'petId': data['petId'],
            'drug': data.get('drug', ''),
            'dosage': data.get('dosage', ''),
            'notes': data.get('notes', ''),
            'createdAt': datetime.utcnow().isoformat()
        }
        prescriptions_table.put_item(Item=prescription)
        return jsonify(prescription), 201
    except Exception as e:
        logger.error(f"Error creating prescription: {e}")
        return jsonify({'error': 'Unable to create prescription'}), 500

# ------------------------------
# Main
# ------------------------------
if __name__ == '__main__':
    port = int(os.getenv('PORT', 8003))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('APP_ENV') != 'production')
