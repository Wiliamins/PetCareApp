"""
PetCareApp - Medical Records Service
@author VS
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)
records_db = {}
vaccinations_db = {}
prescriptions_db = {}

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'medical_records_service', 'status': 'healthy'})

@app.route('/api/v1/records/pet/<pet_id>', methods=['GET'])
def get_records(pet_id):
    return jsonify([r for r in records_db.values() if r.get('petId') == pet_id])

@app.route('/api/v1/records', methods=['POST'])
def create_record():
    data = request.get_json()
    rec_id = str(uuid.uuid4())
    record = {'id': rec_id, **data, 'createdAt': datetime.utcnow().isoformat()}
    records_db[rec_id] = record
    return jsonify(record), 201

@app.route('/api/v1/vaccinations/pet/<pet_id>', methods=['GET'])
def get_vaccinations(pet_id):
    return jsonify([v for v in vaccinations_db.values() if v.get('petId') == pet_id])

@app.route('/api/v1/vaccinations', methods=['POST'])
def add_vaccination():
    data = request.get_json()
    vac_id = str(uuid.uuid4())
    vaccination = {'id': vac_id, **data, 'createdAt': datetime.utcnow().isoformat()}
    vaccinations_db[vac_id] = vaccination
    return jsonify(vaccination), 201

@app.route('/api/v1/prescriptions/pet/<pet_id>', methods=['GET'])
def get_prescriptions(pet_id):
    return jsonify([p for p in prescriptions_db.values() if p.get('petId') == pet_id])

@app.route('/api/v1/prescriptions', methods=['POST'])
def create_prescription():
    data = request.get_json()
    presc_id = str(uuid.uuid4())
    prescription = {'id': presc_id, **data, 'createdAt': datetime.utcnow().isoformat()}
    prescriptions_db[presc_id] = prescription
    return jsonify(prescription), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8003, debug=True)
