"""
PetCareApp - Pet Service
Управление питомцами и их профилями

@author VS
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
import uuid
import boto3
from botocore.exceptions import ClientError

app = Flask(__name__)
CORS(app)

# DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'eu-north-1'))
pets_table = dynamodb.Table('PetCareApp-Pets')

# ============================================
# HEALTH CHECK
# ============================================
@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({
        'service': 'pet_service',
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    })

# ============================================
# CRUD ОПЕРАЦИИ
# ============================================

@app.route('/api/v1/pets', methods=['GET'])
def get_pets():
    """Получить список питомцев."""
    try:
        owner_id = request.args.get('owner_id')
        
        if owner_id:
            response = pets_table.scan(
                FilterExpression='owner_id = :oid',
                ExpressionAttributeValues={':oid': owner_id}
            )
        else:
            response = pets_table.scan()
        
        return jsonify(response.get('Items', []))
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/pets/<pet_id>', methods=['GET'])
def get_pet(pet_id):
    """Получить питомца по ID."""
    try:
        response = pets_table.get_item(Key={'id': pet_id})
        item = response.get('Item')
        
        if not item:
            return jsonify({'error': 'Pet not found'}), 404
        
        return jsonify(item)
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/pets', methods=['POST'])
def create_pet():
    """Создать нового питомца."""
    try:
        data = request.get_json()
        
        pet = {
            'id': str(uuid.uuid4()),
            'name': data.get('name'),
            'species': data.get('species'),  # dog, cat, bird, etc.
            'breed': data.get('breed'),
            'gender': data.get('gender'),
            'date_of_birth': data.get('date_of_birth'),
            'weight': data.get('weight'),
            'color': data.get('color'),
            'microchip_number': data.get('microchip_number'),
            'owner_id': data.get('owner_id'),
            'photo_url': data.get('photo_url'),
            'allergies': data.get('allergies', []),
            'chronic_conditions': data.get('chronic_conditions', []),
            'notes': data.get('notes'),
            'status': 'active',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        pets_table.put_item(Item=pet)
        
        return jsonify(pet), 201
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/pets/<pet_id>', methods=['PUT'])
def update_pet(pet_id):
    """Обновить данные питомца."""
    try:
        data = request.get_json()
        
        # Проверяем что питомец существует
        response = pets_table.get_item(Key={'id': pet_id})
        if not response.get('Item'):
            return jsonify({'error': 'Pet not found'}), 404
        
        update_expression = "SET updated_at = :updated"
        expression_values = {':updated': datetime.utcnow().isoformat()}
        
        allowed_fields = ['name', 'breed', 'weight', 'color', 'microchip_number', 
                          'photo_url', 'allergies', 'chronic_conditions', 'notes', 'status']
        
        for field in allowed_fields:
            if field in data:
                update_expression += f", {field} = :{field}"
                expression_values[f':{field}'] = data[field]
        
        pets_table.update_item(
            Key={'id': pet_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        # Возвращаем обновлённого питомца
        response = pets_table.get_item(Key={'id': pet_id})
        return jsonify(response.get('Item'))
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/pets/<pet_id>', methods=['DELETE'])
def delete_pet(pet_id):
    """Удалить питомца (soft delete)."""
    try:
        pets_table.update_item(
            Key={'id': pet_id},
            UpdateExpression="SET #status = :status, updated_at = :updated",
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'deleted',
                ':updated': datetime.utcnow().isoformat()
            }
        )
        return jsonify({'message': 'Pet deleted'}), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# ДОПОЛНИТЕЛЬНЫЕ ЭНДПОИНТЫ
# ============================================

@app.route('/api/v1/pets/<pet_id>/medical-history', methods=['GET'])
def get_pet_medical_history(pet_id):
    """Получить медицинскую историю питомца."""
    try:
        # Получаем записи из таблицы MedicalRecords
        medical_table = dynamodb.Table('PetCareApp-MedicalRecords')
        response = medical_table.scan(
            FilterExpression='pet_id = :pid',
            ExpressionAttributeValues={':pid': pet_id}
        )
        
        records = response.get('Items', [])
        # Сортируем по дате
        records.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        return jsonify(records)
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/pets/<pet_id>/vaccinations', methods=['GET'])
def get_pet_vaccinations(pet_id):
    """Получить историю вакцинаций питомца."""
    try:
        medical_table = dynamodb.Table('PetCareApp-MedicalRecords')
        response = medical_table.scan(
            FilterExpression='pet_id = :pid AND record_type = :type',
            ExpressionAttributeValues={
                ':pid': pet_id,
                ':type': 'vaccination'
            }
        )
        
        return jsonify(response.get('Items', []))
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/pets/search', methods=['GET'])
def search_pets():
    """Поиск питомцев."""
    try:
        query = request.args.get('q', '').lower()
        species = request.args.get('species')
        
        response = pets_table.scan()
        pets = response.get('Items', [])
        
        # Фильтруем
        if query:
            pets = [p for p in pets if query in p.get('name', '').lower() 
                    or query in p.get('microchip_number', '').lower()]
        
        if species:
            pets = [p for p in pets if p.get('species') == species]
        
        # Исключаем удалённых
        pets = [p for p in pets if p.get('status') != 'deleted']
        
        return jsonify(pets)
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/pets/stats', methods=['GET'])
def get_pets_stats():
    """Статистика по питомцам."""
    try:
        response = pets_table.scan()
        pets = [p for p in response.get('Items', []) if p.get('status') != 'deleted']
        
        stats = {
            'total': len(pets),
            'by_species': {},
            'by_gender': {'male': 0, 'female': 0, 'unknown': 0}
        }
        
        for pet in pets:
            species = pet.get('species', 'unknown')
            gender = pet.get('gender', 'unknown')
            
            stats['by_species'][species] = stats['by_species'].get(species, 0) + 1
            
            if gender in stats['by_gender']:
                stats['by_gender'][gender] += 1
            else:
                stats['by_gender']['unknown'] += 1
        
        return jsonify(stats)
    except ClientError as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# ЗАПУСК
# ============================================
if __name__ == '__main__':
    port = int(os.getenv('PORT', 8012))
    app.run(host='0.0.0.0', port=port, debug=False)
