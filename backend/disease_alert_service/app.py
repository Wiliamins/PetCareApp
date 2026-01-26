"""
PetCareApp - Disease Alert Service with External API Integration
Integrates with:
- ADNS (Animal Disease Notification System) - EU official system
- OIE/WOAH (World Organisation for Animal Health) - global alerts
- GIW (Główny Inspektorat Weterynarii) - Polish alerts
- EFSA (European Food Safety Authority) - EU risk assessments

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
import xml.etree.ElementTree as ET

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache
CACHE_TTL = 1800  # 30 min for alerts (more frequent updates)
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


# ============== External API Clients ==============

class WOAHClient:
    """
    World Organisation for Animal Health (WOAH/OIE)
    WAHIS - World Animal Health Information System
    Real API: https://wahis.woah.org/
    """
    BASE_URL = "https://wahis.woah.org/api/v1"
    
    @staticmethod
    def get_outbreaks(country='POL', disease=None, limit=50):
        try:
            # WAHIS public data endpoint
            url = f"{WOAHClient.BASE_URL}/pi/getOutbreakList"
            params = {
                'pageNumber': 0,
                'pageSize': limit,
                'sortColumn': 'reportDate',
                'sortOrder': 'DESC'
            }
            if country:
                params['reportingCountry'] = country
            if disease:
                params['disease'] = disease
            
            response = requests.get(url, params=params, timeout=15, headers={
                'Accept': 'application/json',
                'User-Agent': 'PetCareApp/1.0'
            })
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'source': 'WOAH',
                    'source_name': 'World Organisation for Animal Health (WAHIS)',
                    'url': 'https://wahis.woah.org',
                    'total': data.get('totalElements', 0),
                    'alerts': [WOAHClient._parse(o) for o in data.get('content', data.get('outbreaks', []))]
                }
            
            # Fallback: try WAHIS-Wild interface
            return WOAHClient._get_wahis_wild(country, limit)
            
        except Exception as e:
            logger.error(f"WOAH API error: {e}")
            return {'source': 'WOAH', 'error': str(e), 'alerts': [], 'url': 'https://wahis.woah.org'}
    
    @staticmethod
    def _get_wahis_wild(country, limit):
        """Alternative WAHIS endpoint for wildlife diseases"""
        try:
            url = "https://wahis.woah.org/api/v1/pi/getCountryDiseaseStatus"
            params = {'country': country}
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                return {
                    'source': 'WOAH',
                    'source_name': 'WOAH WAHIS',
                    'url': 'https://wahis.woah.org',
                    'alerts': response.json().get('diseases', [])
                }
        except:
            pass
        return {'source': 'WOAH', 'alerts': [], 'note': 'Use wahis.woah.org for interactive map'}
    
    @staticmethod
    def _parse(raw):
        return {
            'id': raw.get('outbreakId', raw.get('id', '')),
            'disease': raw.get('disease', raw.get('diseaseName', '')),
            'country': raw.get('country', raw.get('reportingCountry', '')),
            'region': raw.get('region', raw.get('adminDivision', '')),
            'dateReported': raw.get('reportDate', ''),
            'species': raw.get('species', []),
            'cases': raw.get('cases', raw.get('totalCases', 0)),
            'deaths': raw.get('deaths', 0),
            'status': raw.get('status', 'reported'),
            'source': 'WOAH'
        }


class ADNSClient:
    """
    Animal Disease Notification System (EU)
    Official EU notification system
    https://ec.europa.eu/food/animals/animal-diseases/animal-disease-information-system-adis_en
    """
    # ADIS replaced ADNS in 2021
    BASE_URL = "https://ec.europa.eu/food/api"
    
    @staticmethod
    def get_alerts(country='PL', limit=50):
        try:
            # EU ADIS/ADNS data is available via data.europa.eu
            url = "https://data.europa.eu/api/hub/search/datasets"
            params = {
                'q': 'animal disease notification',
                'limit': 10
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'source': 'ADNS/ADIS',
                    'source_name': 'EU Animal Disease Information System',
                    'url': 'https://ec.europa.eu/food/animals/animal-diseases_en',
                    'data_portal': 'https://data.europa.eu',
                    'note': 'Dane dostępne przez portal data.europa.eu',
                    'datasets': data.get('result', {}).get('results', [])[:5],
                    'alerts': []
                }
            
            return {
                'source': 'ADNS/ADIS',
                'url': 'https://ec.europa.eu/food/animals/animal-diseases_en',
                'alerts': [],
                'note': 'Access via EU Food Safety portal'
            }
            
        except Exception as e:
            logger.error(f"ADNS error: {e}")
            return {'source': 'ADNS', 'error': str(e), 'alerts': []}


class GIWClient:
    """
    Główny Inspektorat Weterynarii (Poland)
    Official Polish veterinary authority
    https://www.wetgiw.gov.pl
    """
    BASE_URL = "https://www.wetgiw.gov.pl"
    
    @staticmethod
    def get_alerts():
        """
        GIW doesn't have a public API
        Data available via:
        - https://www.wetgiw.gov.pl/nadzor-weterynaryjny/choroby-zwalczane
        - https://bfrw.mapserver.centerum.pl/ (interactive map)
        """
        return {
            'source': 'GIW',
            'source_name': 'Główny Inspektorat Weterynarii',
            'url': 'https://www.wetgiw.gov.pl',
            'api_available': False,
            'data_sources': [
                {
                    'name': 'Choroby zwalczane z urzędu',
                    'url': 'https://www.wetgiw.gov.pl/nadzor-weterynaryjny/choroby-zwalczane'
                },
                {
                    'name': 'Mapa ASF',
                    'url': 'https://www.wetgiw.gov.pl/nadzor-weterynaryjny/asf-mapa'
                },
                {
                    'name': 'Mapa HPAI',
                    'url': 'https://www.wetgiw.gov.pl/nadzor-weterynaryjny/hpai-mapa'
                },
                {
                    'name': 'System BFRW (mapa interaktywna)',
                    'url': 'https://bfrw.mapserver.centerum.pl/'
                }
            ],
            'monitored_diseases': [
                'ASF (Afrykański pomór świń)',
                'HPAI (Ptasia grypa)',
                'Wścieklizna',
                'Pryszczyca',
                'Choroba niebieskiego języka'
            ],
            'alerts': []
        }
    
    @staticmethod
    def get_asf_zones():
        """Get ASF restriction zones in Poland"""
        return {
            'source': 'GIW',
            'disease': 'ASF',
            'map_url': 'https://www.wetgiw.gov.pl/nadzor-weterynaryjny/asf-mapa',
            'zones': [
                {'type': 'I', 'name': 'Strefa objęta ograniczeniami I', 'color': 'blue'},
                {'type': 'II', 'name': 'Strefa objęta ograniczeniami II', 'color': 'pink'},
                {'type': 'III', 'name': 'Strefa objęta ograniczeniami III', 'color': 'red'}
            ],
            'note': 'Aktualne strefy na mapie GIW'
        }


class EFSAClient:
    """
    European Food Safety Authority
    Risk assessments and scientific opinions
    https://www.efsa.europa.eu
    """
    BASE_URL = "https://www.efsa.europa.eu/api"
    
    @staticmethod
    def get_publications(topic='animal health', limit=10):
        try:
            # EFSA has data on data.europa.eu
            url = "https://data.europa.eu/api/hub/search/datasets"
            params = {
                'q': f'EFSA {topic}',
                'limit': limit
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                return {
                    'source': 'EFSA',
                    'source_name': 'European Food Safety Authority',
                    'url': 'https://www.efsa.europa.eu',
                    'publications_url': 'https://www.efsa.europa.eu/en/publications',
                    'datasets': response.json().get('result', {}).get('results', [])[:5]
                }
            
            return {
                'source': 'EFSA',
                'url': 'https://www.efsa.europa.eu',
                'note': 'Scientific opinions available on EFSA website'
            }
        except Exception as e:
            return {'source': 'EFSA', 'error': str(e)}


# ============== Auth ==============
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not request.headers.get('Authorization') and os.getenv('APP_ENV') == 'production':
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


# ============== Endpoints ==============

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'disease-alert-service',
        'mode': 'external-api-integration',
        'sources': ['WOAH/OIE', 'ADNS/ADIS (EU)', 'GIW (PL)', 'EFSA']
    })


@app.route('/alerts', methods=['GET'])
@require_auth
def get_alerts():
    """
    Get disease alerts from external sources
    
    GET /alerts?country=POL&source=all
    """
    country = request.args.get('country', 'POL')
    source = request.args.get('source', 'all').upper()
    limit = min(int(request.args.get('limit', 50)), 100)
    
    cache_key = get_cache_key('alerts', {'country': country, 'source': source})
    cached = get_cached(cache_key)
    if cached:
        return jsonify({**cached, 'cached': True})
    
    results = {'country': country, 'sources': [], 'alerts': [], 'data_portals': []}
    
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {}
        
        if source in ['ALL', 'WOAH', 'OIE']:
            futures['WOAH'] = executor.submit(WOAHClient.get_outbreaks, country, None, limit)
        if source in ['ALL', 'ADNS', 'EU']:
            futures['ADNS'] = executor.submit(ADNSClient.get_alerts, country[:2], limit)
        if source in ['ALL', 'GIW', 'PL']:
            futures['GIW'] = executor.submit(GIWClient.get_alerts)
        if source in ['ALL', 'EFSA']:
            futures['EFSA'] = executor.submit(EFSAClient.get_publications)
        
        for src, future in futures.items():
            try:
                data = future.result(timeout=20)
                results['sources'].append({
                    'id': data.get('source', src),
                    'name': data.get('source_name', src),
                    'url': data.get('url', ''),
                    'count': len(data.get('alerts', [])),
                    'error': data.get('error'),
                    'note': data.get('note')
                })
                
                # Add data portals
                if 'data_sources' in data:
                    results['data_portals'].extend(data['data_sources'])
                
                for alert in data.get('alerts', []):
                    results['alerts'].append(alert)
                    
            except Exception as e:
                results['sources'].append({'id': src, 'error': str(e)})
    
    set_cached(cache_key, results)
    return jsonify(results)


@app.route('/alerts/sources', methods=['GET'])
def get_sources():
    """Get information about all available data sources"""
    return jsonify([
        {
            'id': 'WOAH',
            'name': 'World Organisation for Animal Health',
            'alt_name': 'OIE',
            'url': 'https://wahis.woah.org',
            'type': 'Global',
            'api': True,
            'description': 'Światowy system WAHIS - oficjalne zgłoszenia chorób'
        },
        {
            'id': 'ADIS',
            'name': 'Animal Disease Information System',
            'alt_name': 'ADNS',
            'url': 'https://ec.europa.eu/food/animals/animal-diseases_en',
            'type': 'EU',
            'api': False,
            'description': 'System UE - dane przez portal data.europa.eu'
        },
        {
            'id': 'GIW',
            'name': 'Główny Inspektorat Weterynarii',
            'url': 'https://www.wetgiw.gov.pl',
            'type': 'Poland',
            'api': False,
            'description': 'Polski nadzór weterynaryjny - mapy ASF, HPAI'
        },
        {
            'id': 'EFSA',
            'name': 'European Food Safety Authority',
            'url': 'https://www.efsa.europa.eu',
            'type': 'EU',
            'api': False,
            'description': 'Opinie naukowe i oceny ryzyka'
        }
    ])


@app.route('/alerts/asf', methods=['GET'])
@require_auth
def get_asf_info():
    """Get ASF-specific information for Poland"""
    return jsonify(GIWClient.get_asf_zones())


@app.route('/alerts/diseases', methods=['GET'])
def get_monitored_diseases():
    """Get list of officially monitored diseases"""
    return jsonify([
        {'id': 'asf', 'name': 'Afrykański pomór świń', 'name_en': 'African Swine Fever', 'notifiable': True, 'species': ['świnie', 'dziki']},
        {'id': 'hpai', 'name': 'Wysoce zjadliwa grypa ptaków', 'name_en': 'HPAI', 'notifiable': True, 'species': ['drób', 'ptaki']},
        {'id': 'rabies', 'name': 'Wścieklizna', 'name_en': 'Rabies', 'notifiable': True, 'zoonotic': True, 'species': ['wszystkie ssaki']},
        {'id': 'fmd', 'name': 'Pryszczyca', 'name_en': 'Foot and Mouth Disease', 'notifiable': True, 'species': ['bydło', 'świnie', 'owce']},
        {'id': 'csf', 'name': 'Klasyczny pomór świń', 'name_en': 'Classical Swine Fever', 'notifiable': True, 'species': ['świnie']},
        {'id': 'bse', 'name': 'BSE', 'name_en': 'Bovine Spongiform Encephalopathy', 'notifiable': True, 'species': ['bydło']},
        {'id': 'bluetongue', 'name': 'Choroba niebieskiego języka', 'name_en': 'Bluetongue', 'notifiable': True, 'species': ['przeżuwacze']}
    ])


@app.route('/stats', methods=['GET'])
def get_stats():
    return jsonify({
        'cache_entries': len(cache),
        'sources_count': 4,
        'real_time_sources': ['WOAH'],
        'data_portal_sources': ['ADNS/ADIS', 'EFSA'],
        'map_sources': ['GIW']
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 8011)), debug=os.getenv('APP_ENV') != 'production')
