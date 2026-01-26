"""
PetCareApp - Shared Configuration
Wspólna konfiguracja dla wszystkich mikroserwisów
@author VS
"""

import os
from dataclasses import dataclass
from typing import Optional

@dataclass
class DatabaseConfig:
    """Konfiguracja bazy danych DynamoDB - VS"""
    region: str = os.getenv('AWS_REGION', 'eu-central-1')
    endpoint_url: Optional[str] = os.getenv('DYNAMODB_ENDPOINT', None)
    table_prefix: str = os.getenv('DYNAMODB_TABLE_PREFIX', 'petcareapp_')

@dataclass
class CognitoConfig:
    """Konfiguracja AWS Cognito - VS"""
    user_pool_id: str = os.getenv('COGNITO_USER_POOL_ID', '')
    client_id: str = os.getenv('COGNITO_CLIENT_ID', '')
    region: str = os.getenv('AWS_REGION', 'eu-central-1')

@dataclass
class KafkaConfig:
    """Konfiguracja Apache Kafka - VS"""
    bootstrap_servers: str = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    group_id: str = os.getenv('KAFKA_GROUP_ID', 'petcareapp')

@dataclass
class RedisConfig:
    """Konfiguracja Redis Cache - VS"""
    host: str = os.getenv('REDIS_HOST', 'localhost')
    port: int = int(os.getenv('REDIS_PORT', '6379'))
    password: Optional[str] = os.getenv('REDIS_PASSWORD', None)
    db: int = int(os.getenv('REDIS_DB', '0'))

@dataclass
class S3Config:
    """Konfiguracja AWS S3 - VS"""
    bucket_name: str = os.getenv('S3_BUCKET_NAME', 'petcareapp-files')
    region: str = os.getenv('AWS_REGION', 'eu-central-1')

@dataclass
class ServiceConfig:
    """Główna konfiguracja serwisu - VS"""
    name: str
    port: int
    debug: bool = os.getenv('DEBUG', 'false').lower() == 'true'
    log_level: str = os.getenv('LOG_LEVEL', 'INFO')
    
    # Bazy danych i cache - VS
    database: DatabaseConfig = None
    redis: RedisConfig = None
    
    # Zewnętrzne serwisy - VS
    cognito: CognitoConfig = None
    kafka: KafkaConfig = None
    s3: S3Config = None
    
    def __post_init__(self):
        self.database = DatabaseConfig()
        self.redis = RedisConfig()
        self.cognito = CognitoConfig()
        self.kafka = KafkaConfig()
        self.s3 = S3Config()

# Konfiguracje poszczególnych serwisów - VS
AUTH_SERVICE_CONFIG = ServiceConfig(name='auth_service', port=8001)
USER_SERVICE_CONFIG = ServiceConfig(name='user_service', port=8002)
MEDICAL_SERVICE_CONFIG = ServiceConfig(name='medical_records_service', port=8003)
APPOINTMENT_SERVICE_CONFIG = ServiceConfig(name='appointment_service', port=8004)
NOTIFICATION_SERVICE_CONFIG = ServiceConfig(name='notification_service', port=8005)
PAYMENT_SERVICE_CONFIG = ServiceConfig(name='payment_service', port=8006)
REPORT_SERVICE_CONFIG = ServiceConfig(name='report_service', port=8007)
ANALYTICS_SERVICE_CONFIG = ServiceConfig(name='analytics_service', port=8008)
AUDIT_SERVICE_CONFIG = ServiceConfig(name='audit_service', port=8009)
DRUG_SERVICE_CONFIG = ServiceConfig(name='drug_info_service', port=8010)
DISEASE_ALERT_SERVICE_CONFIG = ServiceConfig(name='disease_alert_service', port=8011)
