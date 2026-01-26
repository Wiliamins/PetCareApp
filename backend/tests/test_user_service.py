"""
PetCareApp - User Service Tests
Unit tests for user management service
@author VS
"""

import pytest
import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'user_service'))

from app import app


@pytest.fixture
def client():
    """Flask test client fixture - VS"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def auth_headers():
    """Mock auth headers for protected endpoints - VS"""
    return {'Authorization': 'Bearer test_token_for_dev_mode'}


class TestHealthCheck:
    """Test health endpoints - VS"""
    
    def test_health_check(self, client):
        response = client.get('/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
    
    def test_stats_endpoint(self, client):
        response = client.get('/stats')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'total_users' in data


class TestUserEndpoints:
    """Test user CRUD operations - VS"""
    
    def test_get_users(self, client, auth_headers):
        """Test get all users"""
        response = client.get('/users', headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
    
    def test_get_user_not_found(self, client, auth_headers):
        """Test get non-existent user"""
        response = client.get('/users/nonexistent_id', headers=auth_headers)
        assert response.status_code == 404
    
    def test_create_user(self, client, auth_headers):
        """Test user creation"""
        response = client.post('/users', 
            headers=auth_headers,
            json={
                'email': 'test@example.com',
                'firstName': 'Test',
                'lastName': 'User',
                'role': 'client'
            }
        )
        assert response.status_code in [200, 201]
        data = json.loads(response.data)
        assert 'id' in data or 'email' in data
    
    def test_create_user_missing_data(self, client, auth_headers):
        """Test user creation with missing required fields"""
        response = client.post('/users',
            headers=auth_headers,
            json={'email': 'incomplete@example.com'}
        )
        assert response.status_code in [400, 500]
    
    def test_get_veterinarians(self, client, auth_headers):
        """Test get veterinarians list"""
        response = client.get('/veterinarians', headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
    
    def test_get_clients(self, client, auth_headers):
        """Test get clients list"""
        response = client.get('/clients', headers=auth_headers)
        assert response.status_code == 200


class TestPetEndpoints:
    """Test pet CRUD operations - VS"""
    
    def test_get_pets(self, client, auth_headers):
        """Test get all pets"""
        response = client.get('/pets', headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
    
    def test_create_pet(self, client, auth_headers):
        """Test pet creation"""
        response = client.post('/pets',
            headers=auth_headers,
            json={
                'name': 'TestDog',
                'species': 'dog',
                'breed': 'Labrador',
                'ownerId': 'test_owner_id'
            }
        )
        assert response.status_code in [200, 201]
    
    def test_search_pets(self, client, auth_headers):
        """Test pet search"""
        response = client.get('/pets/search?q=dog', headers=auth_headers)
        assert response.status_code == 200


class TestActivation:
    """Test user activation/deactivation - VS"""
    
    def test_activate_user(self, client, auth_headers):
        """Test user activation"""
        response = client.post('/users/test_id/activate', headers=auth_headers)
        assert response.status_code in [200, 404]
    
    def test_deactivate_user(self, client, auth_headers):
        """Test user deactivation"""
        response = client.post('/users/test_id/deactivate', headers=auth_headers)
        assert response.status_code in [200, 404]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
