"""
PetCareApp - Report Service
@author VS
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'report_service', 'status': 'healthy'})

@app.route('/api/v1/reports/appointments', methods=['GET'])
def appointments_report():
    return jsonify({'total': 150, 'completed': 120, 'cancelled': 10, 'noShow': 5, 'pending': 15})

@app.route('/api/v1/reports/revenue', methods=['GET'])
def revenue_report():
    return jsonify({
        'monthly': [72000, 68000, 75000, 82000, 79000, 85000],
        'total': 461000,
        'average': 76833
    })

@app.route('/api/v1/reports/pets', methods=['GET'])
def pets_report():
    return jsonify({'dogs': 1450, 'cats': 720, 'other': 170, 'total': 2340})

@app.route('/api/v1/reports/generate', methods=['POST'])
def generate_report():
    data = request.get_json()
    return jsonify({'reportId': 'RPT-2024-001', 'status': 'generating', 'type': data.get('type')})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8007, debug=True)
