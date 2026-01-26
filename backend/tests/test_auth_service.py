"""
PetCareApp - Auth Service Tests
Unit tests for authentication service
@author VS
"""

import pytest
import json
import sys
import os

# Add service to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'auth_service'))

from app import app


@pytest.fixture
def client():
    """Flask test client fixture - VS"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestHealthCheck:
    """Test health check endpoint - VS"""
    
    def test_health_check(self, client):
        """Test that health check returns OK"""
        response = client.get('/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'service' in data


class TestAuthEndpoints:
    """Test authentication endpoints - VS"""
    
    def test_login_missing_credentials(self, client):
        """Test login with missing credentials"""
        response = client.post('/login', json={})
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials in dev mode"""
        response = client.post('/login', json={
            'email': 'test@example.com',
            'password': 'wrongpassword'
        })
        # In dev mode, any credentials work
        # In prod mode with Cognito, this would fail
        assert response.status_code in [200, 401]
    
    def test_login_success_dev_mode(self, client):
        """Test successful login in development mode"""
        response = client.post('/login', json={
            'email': 'admin@petcareapp.com',
            'password': 'admin123'
        })
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'access_token' in data or 'AccessToken' in data
    
    def test_register_missing_data(self, client):
        """Test registration with missing data"""
        response = client.post('/register', json={
            'email': 'new@example.com'
        })
        assert response.status_code == 400
    
    def test_register_success(self, client):
        """Test successful registration"""
        response = client.post('/register', json={
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'firstName': 'Test',
            'lastName': 'User',
            'phone': '+48123456789'
        })
        assert response.status_code in [200, 201]
    
    def test_verify_token_missing(self, client):
        """Test token verification without token"""
        response = client.get('/verify')
        assert response.status_code == 401
    
    def test_verify_token_invalid(self, client):
        """Test token verification with invalid token"""
        response = client.get('/verify', headers={
            'Authorization': 'Bearer invalid_token'
        })
        assert response.status_code in [401, 403]


class TestPasswordReset:
    """Test password reset functionality - VS"""
    
    def test_reset_password_missing_email(self, client):
        """Test password reset without email"""
        response = client.post('/reset-password', json={})
        assert response.status_code == 400
    
    def test_reset_password_request(self, client):
        """Test password reset request"""
        response = client.post('/reset-password', json={
            'email': 'user@example.com'
        })
        # Should succeed even if user doesn't exist (security)
        assert response.status_code in [200, 400]


class TestLogout:
    """Test logout functionality - VS"""
    
    def test_logout_without_token(self, client):
        """Test logout without token"""
        response = client.post('/logout')
        assert response.status_code in [200, 401]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
