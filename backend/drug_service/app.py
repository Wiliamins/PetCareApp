"""
PetCareApp - Drug Service with External API Integration
Integrates with:
- URPLWMiPB (Polish drug registry) - real API
- EMA (European Medicines Agency) - EU database
- FDA openFDA - US veterinary drugs

@author VS
"""

from flask import Flask, request, jsonify

import os
import logging
import hashlib
import requests
import json
from datetime import datetime, timedelta
from functools import wraps
from concurrent.futures import ThreadPoolExecutor

app = Flask(__name__)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache
CACHE_TTL = 3600
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


#  External API Clients 

class URPLClient:
    """Polish Drug Registry (CSIOZ) - REAL API"""
    BASE_URL = "https://pub.rejestrymedyczne.csioz.gov.pl/api/rpl"
    
    @staticmethod
    def search(query, limit=50):
        try:
            url = f"{URPLClient.BASE_URL}/medicinal-products/public"
            params = {'name': query, 'size': limit}
            
            response = requests.get(url, params=params, timeout=15, headers={
                'Accept': 'application/json',
                'User-Agent': 'PetCareApp/1.0'
            })
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'source': 'URPL',
                    'source_name': 'Urząd Rejestracji Produktów Leczniczych (PL)',
                    'url': 'https://pub.rejestrymedyczne.csioz.gov.pl',
                    'total': data.get('totalElements', 0),
                    'drugs': [URPLClient._parse(d) for d in data.get('content', [])]
                }
            logger.warning(f"URPL: {response.status_code}")
            return {'source': 'URPL', 'error': f'HTTP {response.status_code}', 'drugs': []}
        except Exception as e:
            logger.error(f"URPL error: {e}")
            return {'source': 'URPL', 'error': str(e), 'drugs': []}
    
    @staticmethod
    def _parse(raw):
        return {
            'id': raw.get('id'),
            'name': raw.get('productName', raw.get('name', '')),
            'activeSubstance': raw.get('activeSubstance', ''),
            'form': raw.get('pharmaceuticalForm', ''),
            'manufacturer': raw.get('responsibleEntity', raw.get('manufacturer', '')),
            'registrationNumber': raw.get('registrationNumber', ''),
            'atcCode': raw.get('atcCode', ''),
            'status': raw.get('status', 'active'),
            'source': 'URPL'
        }


class FDAClient:
    """US FDA openFDA API - REAL API"""
    BASE_URL = "https://api.fda.gov"
    
    @staticmethod
    def search(query, limit=20):
        try:
            # Animal & Veterinary adverse events (has drug info)
            url = f"{FDAClient.BASE_URL}/animalandveterinary/event.json"
            params = {
                'search': f'drug.active_ingredients.name:"{query}"',
                'limit': min(limit, 100)
            }
            
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                drugs = []
                seen = set()
                
                for event in data.get('results', []):
                    for drug in event.get('drug', []):
                        name = drug.get('brand_name') or drug.get('active_ingredients', [{}])[0].get('name', '')
                        if name and name not in seen:
                            seen.add(name)
                            drugs.append({
                                'id': hashlib.md5(name.encode()).hexdigest()[:12],
                                'name': name,
                                'activeSubstance': ', '.join([i.get('name', '') for i in drug.get('active_ingredients', [])]),
                                'manufacturer': drug.get('manufacturer', {}).get('name', ''),
                                'form': drug.get('dosage_form', ''),
                                'route': drug.get('route', ''),
                                'source': 'FDA'
                            })
                
                return {
                    'source': 'FDA',
                    'source_name': 'FDA openFDA (US)',
                    'url': 'https://open.fda.gov',
                    'total': data.get('meta', {}).get('results', {}).get('total', len(drugs)),
                    'drugs': drugs
                }
            return {'source': 'FDA', 'error': f'HTTP {response.status_code}', 'drugs': []}
        except Exception as e:
            logger.error(f"FDA error: {e}")
            return {'source': 'FDA', 'error': str(e), 'drugs': []}


class EMAClient:
    """European Medicines Agency"""
    
    @staticmethod
    def search(query, limit=20):
        # EMA doesn't have public REST API for veterinary medicines
        # Data available via: https://www.ema.europa.eu/en/medicines/download-medicine-data
        return {
            'source': 'EMA',
            'source_name': 'European Medicines Agency (EU)',
            'url': 'https://www.ema.europa.eu/en/medicines/veterinary',
            'note': 'EMA nie udostępnia publicznego API. Dane dostępne do pobrania.',
            'download_url': 'https://www.ema.europa.eu/en/medicines/download-medicine-data',
            'drugs': []
        }


class PIWetClient:
    """Główny Inspektorat Weterynarii - official Polish vet authority"""
    
    @staticmethod
    def get_info():
        return {
            'source': 'GIW',
            'source_name': 'Główny Inspektorat Weterynarii',
            'url': 'https://www.wetgiw.gov.pl',
            'registry_url': 'https://www.wetgiw.gov.pl/handel-eksport-import/rejestry-produktow-leczniczych',
            'note': 'Oficjalny rejestr w formie plików PDF/Excel',
            'contact': 'https://www.wetgiw.gov.pl/kontakt'
        }


#  Auth 
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not request.headers.get('Authorization') and os.getenv('APP_ENV') == 'production':
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


#  Endpoints 

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'drug-service',
        'mode': 'external-api-integration',
        'sources': ['URPL (PL)', 'FDA (US)', 'EMA (EU)']
    })


@app.route('/drugs/search', methods=['GET'])
@require_auth
def search_drugs():
    """
    Search across external drug databases
    
    GET /drugs/search?q=amoxicillin&source=all&limit=20
    """
    query = request.args.get('q', '').strip()
    source = request.args.get('source', 'all').upper()
    limit = min(int(request.args.get('limit', 20)), 100)
    
    if len(query) < 2:
        return jsonify({'error': 'Query min 2 characters'}), 400
    
    # Check cache
    cache_key = get_cache_key('search', {'q': query, 'source': source, 'limit': limit})
    cached = get_cached(cache_key)
    if cached:
        return jsonify({**cached, 'cached': True})
    
    results = {'query': query, 'sources': [], 'drugs': [], 'total': 0}
    
    # Search in parallel
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {}
        
        if source in ['ALL', 'URPL']:
            futures['URPL'] = executor.submit(URPLClient.search, query, limit)
        if source in ['ALL', 'FDA']:
            futures['FDA'] = executor.submit(FDAClient.search, query, limit)
        if source in ['ALL', 'EMA']:
            futures['EMA'] = executor.submit(EMAClient.search, query, limit)
        
        for src, future in futures.items():
            try:
                data = future.result(timeout=20)
                results['sources'].append({
                    'id': src,
                    'name': data.get('source_name', src),
                    'url': data.get('url', ''),
                    'count': len(data.get('drugs', [])),
                    'error': data.get('error')
                })
                for drug in data.get('drugs', []):
                    results['drugs'].append(drug)
                results['total'] += len(data.get('drugs', []))
            except Exception as e:
                results['sources'].append({'id': src, 'error': str(e), 'count': 0})
    
    set_cached(cache_key, results)
    return jsonify(results)


@app.route('/drugs/sources', methods=['GET'])
def get_sources():
    """Get available data sources"""
    return jsonify([
        {
            'id': 'URPL',
            'name': 'Urząd Rejestracji Produktów Leczniczych',
            'country': 'PL',
            'url': 'https://pub.rejestrymedyczne.csioz.gov.pl',
            'api': True,
            'realtime': True,
            'description': 'Polski rejestr produktów leczniczych - API publiczne'
        },
        {
            'id': 'FDA',
            'name': 'Food and Drug Administration',
            'country': 'US',
            'url': 'https://open.fda.gov',
            'api': True,
            'realtime': True,
            'description': 'Amerykańska baza openFDA - leki weterynaryjne'
        },
        {
            'id': 'EMA',
            'name': 'European Medicines Agency',
            'country': 'EU',
            'url': 'https://www.ema.europa.eu',
            'api': False,
            'realtime': False,
            'description': 'Europejska baza EPAR - dane do pobrania'
        },
        PIWetClient.get_info()
    ])


@app.route('/drugs/categories', methods=['GET'])
def get_categories():
    """ATC-vet classification"""
    return jsonify([
        {'code': 'QA', 'name': 'Alimentary tract', 'name_pl': 'Przewód pokarmowy'},
        {'code': 'QJ', 'name': 'Antiinfectives', 'name_pl': 'Antybiotyki'},
        {'code': 'QP', 'name': 'Antiparasitics', 'name_pl': 'Przeciwpasożytnicze'},
        {'code': 'QI', 'name': 'Immunologicals', 'name_pl': 'Szczepionki'},
        {'code': 'QN', 'name': 'Nervous system', 'name_pl': 'Układ nerwowy'},
        {'code': 'QM', 'name': 'Musculo-skeletal', 'name_pl': 'Przeciwzapalne'}
    ])


@app.route('/stats', methods=['GET'])
def get_stats():
    return jsonify({
        'cache_entries': len(cache),
        'available_sources': 3,
        'real_time_apis': ['URPL', 'FDA']
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 8010)), debug=False)
