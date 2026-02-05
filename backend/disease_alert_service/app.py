"""
PetCareApp - Disease Alert Service with External API Integration
Integrates with WOAH/OIE, ADNS/ADIS, GIW (PL), EFSA
@author VS
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import requests
import hashlib
import json
from datetime import datetime, timedelta
from functools import wraps
from concurrent.futures import ThreadPoolExecutor

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache
CACHE_TTL = 1800  # 30 min
cache = {}

def get_cache_key(prefix, params):
    return f"{prefix}:{hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()}"

def get_cached(key):
    if key in cache:
        data, expires = cache[key]
        if datetime.now() < expires:
            return data
    return None

def set_cached(key, data, ttl=CACHE_TTL):
    cache[key] = (data, datetime.now() + timedelta(seconds=ttl))

# ============== Auth Decorator ==============
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not request.headers.get('Authorization') and os.getenv('APP_ENV') == 'production':
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

# ============== Health ==============
@app.route("/health", methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'disease-alert-service',
        'mode': os.getenv('APP_ENV', 'development'),
        'sources': ['WOAH/OIE', 'ADNS/ADIS (EU)', 'GIW (PL)', 'EFSA']
    })

# ============== Example Alerts Endpoint ==============
@app.route("/alerts", methods=['GET'])
@require_auth
def alerts():
    country = request.args.get('country', 'POL')
    source = request.args.get('source', 'ALL').upper()
    limit = min(int(request.args.get('limit', 50)), 100)
    
    cache_key = get_cache_key('alerts', {'country': country, 'source': source})
    cached = get_cached(cache_key)
    if cached:
        return jsonify({**cached, 'cached': True})
    
    results = {
        'country': country,
        'sources': [],
        'alerts': [],
        'data_portals': []
    }
    
    results['sources'].append({
        'id': 'WOAH',
        'name': 'World Organisation for Animal Health',
        'url': 'https://wahis.woah.org',
        'count': 0,
        'note': ''
    })
    
    set_cached(cache_key, results)
    return jsonify(results)

# ============== ASF Info ==============
@app.route("/alerts/asf", methods=['GET'])
@require_auth
def asf_info():
    return jsonify({
        'source': 'GIW',
        'disease': 'ASF',
        'map_url': 'https://www.wetgiw.gov.pl/nadzor-weterynaryjny/asf-mapa',
        'zones': [
            {'type': 'I', 'name': 'Strefa I', 'color': 'blue'},
            {'type': 'II', 'name': 'Strefa II', 'color': 'pink'},
            {'type': 'III', 'name': 'Strefa III', 'color': 'red'}
        ]
    })

# ============== Monitored Diseases ==============
@app.route("/alerts/diseases", methods=['GET'])
def monitored_diseases():
    return jsonify([
        {'id': 'asf', 'name': 'Afrykański pomór świń', 'notifiable': True},
        {'id': 'hpai', 'name': 'Wysoce zjadliwa grypa ptaków', 'notifiable': True},
        {'id': 'rabies', 'name': 'Wścieklizna', 'notifiable': True}
    ])

# ============== Stats ==============
@app.route("/stats", methods=['GET'])
def stats():
    return jsonify({
        'cache_entries': len(cache),
        'sources_count': 4,
        'real_time_sources': ['WOAH'],
        'data_portal_sources': ['ADNS/ADIS', 'EFSA'],
        'map_sources': ['GIW']
    })

# ============== Main ==============
if __name__ == "__main__":
    port = int(os.getenv('PORT', 8011))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('APP_ENV', 'development') != 'production')
