"""
PetCareApp - Drug Info Service
@author VS
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

drugs_db = [
    {'id': '1', 'name': 'Amoksycylina', 'category': 'Antybiotyk', 'species': ['dog', 'cat'], 'dosage': '10-20mg/kg'},
    {'id': '2', 'name': 'Meloksykam', 'category': 'NLPZ', 'species': ['dog', 'cat'], 'dosage': '0.1-0.2mg/kg'},
    {'id': '3', 'name': 'Nobivac DHPPi', 'category': 'Szczepionka', 'species': ['dog'], 'dosage': '1ml SC'},
    {'id': '4', 'name': 'Feliway', 'category': 'Feromony', 'species': ['cat'], 'dosage': 'Spray/Dyfuzor'},
    {'id': '5', 'name': 'Metacam', 'category': 'NLPZ', 'species': ['dog', 'cat'], 'dosage': '0.1mg/kg'},
    {'id': '6', 'name': 'Synulox', 'category': 'Antybiotyk', 'species': ['dog', 'cat'], 'dosage': '12.5mg/kg'},
    {'id': '7', 'name': 'Frontline', 'category': 'Przeciwpasożytniczy', 'species': ['dog', 'cat'], 'dosage': '1 pipeta/miesiąc'}
]

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'drug_info_service', 'status': 'healthy'})

@app.route('/api/v1/drugs', methods=['GET'])
def get_drugs():
    category = request.args.get('category')
    species = request.args.get('species')
    results = drugs_db
    if category:
        results = [d for d in results if d['category'].lower() == category.lower()]
    if species:
        results = [d for d in results if species.lower() in [s.lower() for s in d['species']]]
    return jsonify(results)

@app.route('/api/v1/drugs/<drug_id>', methods=['GET'])
def get_drug(drug_id):
    drug = next((d for d in drugs_db if d['id'] == drug_id), None)
    if not drug:
        return jsonify({'error': 'Nie znaleziono'}), 404
    return jsonify(drug)

@app.route('/api/v1/drugs/search', methods=['GET'])
def search_drugs():
    q = request.args.get('q', '').lower()
    results = [d for d in drugs_db if q in d['name'].lower() or q in d['category'].lower()]
    return jsonify(results)

@app.route('/api/v1/drugs/categories', methods=['GET'])
def get_categories():
    categories = list(set(d['category'] for d in drugs_db))
    return jsonify(categories)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8013))
    debug = os.getenv('APP_ENV', 'development') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)
