"""
PetCareApp - Appointment Service
Mikroserwis zarządzania wizytami
@author VS
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)
appointments_db = {}

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'appointment_service', 'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/v1/appointments', methods=['GET', 'POST'])
def appointments():
    if request.method == 'POST':
        data = request.get_json()
        apt_id = str(uuid.uuid4())
        appointment = {'id': apt_id, **data, 'status': 'scheduled', 'createdAt': datetime.utcnow().isoformat()}
        appointments_db[apt_id] = appointment
        return jsonify(appointment), 201
    return jsonify(list(appointments_db.values()))

@app.route('/api/v1/appointments/<apt_id>', methods=['GET', 'PUT'])
def appointment_detail(apt_id):
    if apt_id not in appointments_db:
        return jsonify({'error': 'Nie znaleziono'}), 404
    if request.method == 'PUT':
        appointments_db[apt_id].update(request.get_json())
        return jsonify(appointments_db[apt_id])
    return jsonify(appointments_db[apt_id])

@app.route('/api/v1/appointments/<apt_id>/confirm', methods=['POST'])
def confirm_appointment(apt_id):
    if apt_id in appointments_db:
        appointments_db[apt_id]['status'] = 'confirmed'
        return jsonify(appointments_db[apt_id])
    return jsonify({'error': 'Nie znaleziono'}), 404

@app.route('/api/v1/appointments/<apt_id>/cancel', methods=['POST'])
def cancel_appointment(apt_id):
    if apt_id in appointments_db:
        appointments_db[apt_id]['status'] = 'cancelled'
        return jsonify({'message': 'Anulowano wizytę'})
    return jsonify({'error': 'Nie znaleziono'}), 404

@app.route('/api/v1/appointments/slots', methods=['GET'])
def get_available_slots():
    return jsonify([{'time': f'{h}:00', 'available': True} for h in range(9, 18)])

@app.route('/api/v1/veterinarians', methods=['GET'])
def get_veterinarians():
    return jsonify([
        {'id': 'vet-1', 'name': 'dr Anna Kowalska', 'specialization': 'Chirurgia'},
        {'id': 'vet-2', 'name': 'dr Piotr Nowak', 'specialization': 'Dermatologia'}
    ])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8004, debug=True)
