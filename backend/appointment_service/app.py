"""
PetCareApp - Appointment Service
Serwis zarządzania wizytami z AWS DynamoDB
@author VS
"""

from flask import Flask, request, jsonify

from datetime import datetime, timedelta
import uuid
import os
import logging
import boto3
from botocore.exceptions import ClientError

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)


AWS_REGION = os.getenv('AWS_REGION', 'eu-north-1')
TABLE_NAME = 'PetCareApp-Appointments'

dynamodb = None
table = None
try:
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    table = dynamodb.Table(TABLE_NAME)
    logger.info(f"DynamoDB connected: {TABLE_NAME}")
except Exception as e:
    logger.warning(f"DynamoDB not available: {e}")

appointments_db = {}

def save_appointment(appointment):
    if table:
        try:
            table.put_item(Item=appointment)
            return True
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    appointments_db[appointment['id']] = appointment
    return True

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'appointment-service', 'status': 'healthy', 'dynamodb': table is not None})

@app.route('/api/v1/appointments', methods=['GET'])
def get_appointments():
    """Get appointments with filters - VS"""
    owner_id = request.args.get('ownerId')
    vet_id = request.args.get('vetId')
    pet_id = request.args.get('petId')
    status = request.args.get('status')
    date_from = request.args.get('dateFrom')
    date_to = request.args.get('dateTo')
    
    if table:
        try:
            if owner_id:
                response = table.query(
                    IndexName='ownerId-dateTime-index',
                    KeyConditionExpression='ownerId = :oid',
                    ExpressionAttributeValues={':oid': owner_id},
                    ScanIndexForward=False
                )
                appointments = response.get('Items', [])
            elif vet_id:
                response = table.query(
                    IndexName='vetId-dateTime-index',
                    KeyConditionExpression='vetId = :vid',
                    ExpressionAttributeValues={':vid': vet_id},
                    ScanIndexForward=False
                )
                appointments = response.get('Items', [])
            else:
                response = table.scan()
                appointments = response.get('Items', [])
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
            appointments = list(appointments_db.values())
    else:
        appointments = list(appointments_db.values())
    
    # Apply filters - VS
    if pet_id:
        appointments = [a for a in appointments if a.get('petId') == pet_id]
    if status:
        appointments = [a for a in appointments if a.get('status') == status]
    if date_from:
        appointments = [a for a in appointments if a.get('dateTime', '') >= date_from]
    if date_to:
        appointments = [a for a in appointments if a.get('dateTime', '') <= date_to]
    
    return jsonify(appointments)

@app.route('/api/v1/appointments/<appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    if table:
        try:
            response = table.get_item(Key={'id': appointment_id})
            appointment = response.get('Item')
            if appointment:
                return jsonify(appointment)
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    appointment = appointments_db.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    return jsonify(appointment)

@app.route('/api/v1/appointments', methods=['POST'])
def create_appointment():
    """Create new appointment - VS"""
    data = request.get_json()
    
    appointment = {
        'id': str(uuid.uuid4()),
        'petId': data.get('petId'),
        'petName': data.get('petName', ''),
        'ownerId': data.get('ownerId'),
        'ownerName': data.get('ownerName', ''),
        'vetId': data.get('vetId'),
        'vetName': data.get('vetName', ''),
        'dateTime': data.get('dateTime'),
        'duration': data.get('duration', 30),
        'serviceType': data.get('serviceType', 'consultation'),
        'serviceName': data.get('serviceName', ''),
        'price': data.get('price', 0),
        'status': 'scheduled',  # scheduled, confirmed, completed, cancelled
        'notes': data.get('notes', ''),
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    }
    
    save_appointment(appointment)
    logger.info(f"Appointment created: {appointment['id']}")
    return jsonify(appointment), 201

@app.route('/api/v1/appointments/<appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    """Update appointment - VS"""
    if table:
        try:
            response = table.get_item(Key={'id': appointment_id})
            appointment = response.get('Item')
        except:
            appointment = None
    else:
        appointment = appointments_db.get(appointment_id)
    
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    data = request.get_json()
    appointment.update({
        'dateTime': data.get('dateTime', appointment.get('dateTime')),
        'vetId': data.get('vetId', appointment.get('vetId')),
        'vetName': data.get('vetName', appointment.get('vetName')),
        'status': data.get('status', appointment.get('status')),
        'notes': data.get('notes', appointment.get('notes')),
        'updatedAt': datetime.utcnow().isoformat()
    })
    
    save_appointment(appointment)
    return jsonify(appointment)

@app.route('/api/v1/appointments/<appointment_id>/cancel', methods=['POST'])
def cancel_appointment(appointment_id):
    """Cancel appointment - VS"""
    if table:
        try:
            response = table.get_item(Key={'id': appointment_id})
            appointment = response.get('Item')
        except:
            appointment = None
    else:
        appointment = appointments_db.get(appointment_id)
    
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    data = request.get_json() or {}
    appointment['status'] = 'cancelled'
    appointment['cancelReason'] = data.get('reason', '')
    appointment['cancelledAt'] = datetime.utcnow().isoformat()
    appointment['updatedAt'] = datetime.utcnow().isoformat()
    
    save_appointment(appointment)
    return jsonify(appointment)

@app.route('/api/v1/appointments/<appointment_id>/complete', methods=['POST'])
def complete_appointment(appointment_id):
    """Mark appointment as completed - VS"""
    if table:
        try:
            response = table.get_item(Key={'id': appointment_id})
            appointment = response.get('Item')
        except:
            appointment = None
    else:
        appointment = appointments_db.get(appointment_id)
    
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404
    
    appointment['status'] = 'completed'
    appointment['completedAt'] = datetime.utcnow().isoformat()
    appointment['updatedAt'] = datetime.utcnow().isoformat()
    
    save_appointment(appointment)
    return jsonify(appointment)

@app.route('/api/v1/appointments/available-slots', methods=['GET'])
def get_available_slots():
    """Get available time slots - VS"""
    vet_id = request.args.get('vetId')
    date = request.args.get('date')
    
    if not date:
        date = datetime.utcnow().strftime('%Y-%m-%d')
    
    # Generate slots from 9:00 to 17:00 - VS
    slots = []
    for hour in range(9, 17):
        for minute in [0, 30]:
            slot_time = f"{date}T{hour:02d}:{minute:02d}:00"
            slots.append({
                'time': slot_time,
                'available': True
            })
    
    # Mark booked slots - VS
    if vet_id:
        if table:
            try:
                response = table.query(
                    IndexName='vetId-dateTime-index',
                    KeyConditionExpression='vetId = :vid AND begins_with(dateTime, :date)',
                    ExpressionAttributeValues={':vid': vet_id, ':date': date}
                )
                booked = response.get('Items', [])
            except:
                booked = []
        else:
            booked = [a for a in appointments_db.values() if a.get('vetId') == vet_id and a.get('dateTime', '').startswith(date)]
        
        booked_times = [a.get('dateTime', '')[:16] + ':00' for a in booked if a.get('status') != 'cancelled']
        
        for slot in slots:
            if slot['time'] in booked_times:
                slot['available'] = False
    
    return jsonify(slots)

@app.route('/api/v1/appointments/<appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    if table:
        try:
            table.delete_item(Key={'id': appointment_id})
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    if appointment_id in appointments_db:
        del appointments_db[appointment_id]
    
    return jsonify({'message': 'Appointment deleted'})

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 8004))
    logger.info(f"Starting Appointment Service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)