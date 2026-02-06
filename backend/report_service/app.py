"""
PetCareApp - Report Service
Serwis generowania raportów
@author VS
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from datetime import datetime, timedelta
import uuid
import os
import logging
import boto3
from botocore.exceptions import ClientError
import json
import io

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

AWS_REGION = os.getenv('AWS_REGION', 'eu-north-1')

# DynamoDB clients for querying other tables - VS
dynamodb = None
try:
    dynamodb = boto3.resource(
        'dynamodb', 
        region_name=AWS_REGION
        )
    logger.info("DynamoDB connected for reports")
except Exception as e:
    logger.warning(f"DynamoDB not available: {e}")

reports_db = {}

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({'service': 'report-service', 'status': 'healthy', 'dynamodb': dynamodb is not None})

@app.route('/api/v1/reports/summary', methods=['GET'])
def get_summary_report():
    """Get summary statistics - VS"""
    date_from = request.args.get('dateFrom', (datetime.utcnow() - timedelta(days=30)).isoformat())
    date_to = request.args.get('dateTo', datetime.utcnow().isoformat())
    
    # Demo data - in production query from DynamoDB - VS
    summary = {
        'period': {'from': date_from, 'to': date_to},
        'appointments': {
            'total': 156,
            'completed': 142,
            'cancelled': 8,
            'noShow': 6,
            'completionRate': 91.0
        },
        'revenue': {
            'total': 23450.00,
            'average': 150.32,
            'byService': [
                {'service': 'Konsultacja', 'amount': 8500.00, 'count': 57},
                {'service': 'Szczepienie', 'amount': 4200.00, 'count': 42},
                {'service': 'Chirurgia', 'amount': 6500.00, 'count': 13},
                {'service': 'Stomatologia', 'amount': 2400.00, 'count': 8},
                {'service': 'Inne', 'amount': 1850.00, 'count': 22}
            ]
        },
        'patients': {
            'total': 89,
            'new': 23,
            'returning': 66,
            'bySpecies': [
                {'species': 'Pies', 'count': 52},
                {'species': 'Kot', 'count': 31},
                {'species': 'Inne', 'count': 6}
            ]
        },
        'generatedAt': datetime.utcnow().isoformat()
    }
    
    return jsonify(summary)

@app.route('/api/v1/reports/financial', methods=['GET'])
def get_financial_report():
    """Get financial report - VS"""
    date_from = request.args.get('dateFrom')
    date_to = request.args.get('dateTo')
    group_by = request.args.get('groupBy', 'day')  # day, week, month
    
    # Demo data - VS
    data = []
    base_date = datetime.utcnow() - timedelta(days=30)
    
    for i in range(30):
        date = base_date + timedelta(days=i)
        data.append({
            'date': date.strftime('%Y-%m-%d'),
            'revenue': 500 + (i * 50) + (i % 7 * 100),
            'expenses': 200 + (i * 20),
            'profit': 300 + (i * 30) + (i % 7 * 100),
            'transactions': 3 + (i % 5)
        })
    
    report = {
        'period': {'from': date_from, 'to': date_to, 'groupBy': group_by},
        'data': data,
        'totals': {
            'revenue': sum(d['revenue'] for d in data),
            'expenses': sum(d['expenses'] for d in data),
            'profit': sum(d['profit'] for d in data),
            'transactions': sum(d['transactions'] for d in data)
        },
        'generatedAt': datetime.utcnow().isoformat()
    }
    
    return jsonify(report)

@app.route('/api/v1/reports/appointments', methods=['GET'])
def get_appointments_report():
    """Get appointments statistics report - VS"""
    vet_id = request.args.get('vetId')
    date_from = request.args.get('dateFrom')
    date_to = request.args.get('dateTo')
    
    # Demo data - VS
    report = {
        'byStatus': [
            {'status': 'completed', 'count': 142, 'percentage': 91.0},
            {'status': 'cancelled', 'count': 8, 'percentage': 5.1},
            {'status': 'noShow', 'count': 6, 'percentage': 3.9}
        ],
        'byService': [
            {'service': 'Konsultacja', 'count': 57},
            {'service': 'Szczepienie', 'count': 42},
            {'service': 'Chirurgia', 'count': 13},
            {'service': 'Stomatologia', 'count': 8},
            {'service': 'RTG', 'count': 15},
            {'service': 'USG', 'count': 12},
            {'service': 'Inne', 'count': 9}
        ],
        'byDayOfWeek': [
            {'day': 'Poniedziałek', 'count': 28},
            {'day': 'Wtorek', 'count': 32},
            {'day': 'Środa', 'count': 25},
            {'day': 'Czwartek', 'count': 30},
            {'day': 'Piątek', 'count': 35},
            {'day': 'Sobota', 'count': 6}
        ],
        'byHour': [
            {'hour': '09:00', 'count': 18},
            {'hour': '10:00', 'count': 22},
            {'hour': '11:00', 'count': 25},
            {'hour': '12:00', 'count': 15},
            {'hour': '13:00', 'count': 12},
            {'hour': '14:00', 'count': 20},
            {'hour': '15:00', 'count': 23},
            {'hour': '16:00', 'count': 21}
        ],
        'generatedAt': datetime.utcnow().isoformat()
    }
    
    return jsonify(report)

@app.route('/api/v1/reports/patients', methods=['GET'])
def get_patients_report():
    """Get patients statistics report - VS"""
    
    report = {
        'total': 234,
        'active': 189,
        'bySpecies': [
            {'species': 'Pies', 'count': 132, 'percentage': 56.4},
            {'species': 'Kot', 'count': 78, 'percentage': 33.3},
            {'species': 'Królik', 'count': 12, 'percentage': 5.1},
            {'species': 'Świnka morska', 'count': 8, 'percentage': 3.4},
            {'species': 'Inne', 'count': 4, 'percentage': 1.7}
        ],
        'byAge': [
            {'range': '0-1 lat', 'count': 45},
            {'range': '1-3 lat', 'count': 67},
            {'range': '3-7 lat', 'count': 78},
            {'range': '7+ lat', 'count': 44}
        ],
        'newPatientsPerMonth': [
            {'month': '2024-10', 'count': 18},
            {'month': '2024-11', 'count': 22},
            {'month': '2024-12', 'count': 15},
            {'month': '2025-01', 'count': 23}
        ],
        'generatedAt': datetime.utcnow().isoformat()
    }
    
    return jsonify(report)

@app.route('/api/v1/reports/vets', methods=['GET'])
def get_vets_report():
    """Get veterinarians performance report - VS"""
    
    report = {
        'vets': [
            {
                'id': 'vet-001',
                'name': 'Dr Jan Kowalski',
                'appointments': 45,
                'revenue': 6750.00,
                'avgRating': 4.8,
                'completionRate': 95.5
            },
            {
                'id': 'vet-002',
                'name': 'Dr Anna Nowak',
                'appointments': 52,
                'revenue': 7800.00,
                'avgRating': 4.9,
                'completionRate': 98.1
            },
            {
                'id': 'vet-003',
                'name': 'Dr Piotr Wiśniewski',
                'appointments': 38,
                'revenue': 5700.00,
                'avgRating': 4.7,
                'completionRate': 92.1
            }
        ],
        'generatedAt': datetime.utcnow().isoformat()
    }
    
    return jsonify(report)

@app.route('/api/v1/reports/export', methods=['POST'])
def export_report():
    """Export report to file - VS"""
    data = request.get_json()
    report_type = data.get('type', 'summary')
    format_type = data.get('format', 'json')
    
    # Generate report data
    if report_type == 'summary':
        report_data = {'type': 'summary', 'data': 'Summary report data'}
    elif report_type == 'financial':
        report_data = {'type': 'financial', 'data': 'Financial report data'}
    else:
        report_data = {'type': report_type, 'data': 'Report data'}
        report_data['generatedAt'] = datetime.utcnow().isoformat()
    
    if format_type == 'json':
        return jsonify(report_data)
    elif format_type == 'csv':
        csv_content = "type,generatedAt\n" + f"{report_type},{report_data['generatedAt']}"
        return send_file(
            io.BytesIO(csv_content.encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'report_{report_type}_{datetime.utcnow().strftime("%Y%m%d")}.csv'
        )
    
    return jsonify(report_data)

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 8007))
    logger.info(f"Starting Report Service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)