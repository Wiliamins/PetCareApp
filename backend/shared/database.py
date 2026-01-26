"""
PetCareApp - Database Helper
Pomocnik do operacji na DynamoDB
@author VS
"""

import boto3
from botocore.exceptions import ClientError
from typing import Dict, List, Any, Optional
from .config import DatabaseConfig
import logging

logger = logging.getLogger(__name__)

class DynamoDBHelper:
    """Helper do operacji na DynamoDB - VS"""
    
    def __init__(self, config: DatabaseConfig, table_name: str):
        self.config = config
        self.table_name = f"{config.table_prefix}{table_name}"
        
        # Inicjalizacja klienta DynamoDB - VS
        self.dynamodb = boto3.resource(
            'dynamodb',
            region_name=config.region,
            endpoint_url=config.endpoint_url
        )
        self.table = self.dynamodb.Table(self.table_name)
    
    def create_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Utworzenie nowego elementu - VS"""
        try:
            self.table.put_item(Item=item)
            logger.info(f"Utworzono element w {self.table_name}: {item.get('id')}")
            return item
        except ClientError as e:
            logger.error(f"Błąd tworzenia elementu: {e}")
            raise
    
    def get_item(self, key: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Pobranie elementu po kluczu - VS"""
        try:
            response = self.table.get_item(Key=key)
            return response.get('Item')
        except ClientError as e:
            logger.error(f"Błąd pobierania elementu: {e}")
            raise
    
    def update_item(self, key: Dict[str, str], updates: Dict[str, Any]) -> Dict[str, Any]:
        """Aktualizacja elementu - VS"""
        try:
            # Budowanie wyrażenia aktualizacji - VS
            update_expression = "SET "
            expression_values = {}
            expression_names = {}
            
            for i, (field, value) in enumerate(updates.items()):
                update_expression += f"#field{i} = :val{i}, "
                expression_values[f":val{i}"] = value
                expression_names[f"#field{i}"] = field
            
            update_expression = update_expression.rstrip(", ")
            
            response = self.table.update_item(
                Key=key,
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values,
                ExpressionAttributeNames=expression_names,
                ReturnValues="ALL_NEW"
            )
            
            logger.info(f"Zaktualizowano element w {self.table_name}: {key}")
            return response.get('Attributes', {})
        except ClientError as e:
            logger.error(f"Błąd aktualizacji elementu: {e}")
            raise
    
    def delete_item(self, key: Dict[str, str]) -> bool:
        """Usunięcie elementu - VS"""
        try:
            self.table.delete_item(Key=key)
            logger.info(f"Usunięto element z {self.table_name}: {key}")
            return True
        except ClientError as e:
            logger.error(f"Błąd usuwania elementu: {e}")
            raise
    
    def query(
        self, 
        key_condition: str, 
        expression_values: Dict[str, Any],
        index_name: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Zapytanie do tabeli - VS"""
        try:
            params = {
                'KeyConditionExpression': key_condition,
                'ExpressionAttributeValues': expression_values,
                'Limit': limit
            }
            
            if index_name:
                params['IndexName'] = index_name
            
            response = self.table.query(**params)
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"Błąd zapytania: {e}")
            raise
    
    def scan(
        self, 
        filter_expression: Optional[str] = None,
        expression_values: Optional[Dict[str, Any]] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Skanowanie tabeli - VS"""
        try:
            params = {'Limit': limit}
            
            if filter_expression:
                params['FilterExpression'] = filter_expression
            if expression_values:
                params['ExpressionAttributeValues'] = expression_values
            
            response = self.table.scan(**params)
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"Błąd skanowania: {e}")
            raise

class CacheHelper:
    """Helper do operacji na Redis Cache - VS"""
    
    def __init__(self, config):
        import redis
        self.redis = redis.Redis(
            host=config.host,
            port=config.port,
            password=config.password,
            db=config.db,
            decode_responses=True
        )
    
    def get(self, key: str) -> Optional[str]:
        """Pobranie wartości z cache - VS"""
        return self.redis.get(key)
    
    def set(self, key: str, value: str, ttl: int = 3600) -> bool:
        """Zapisanie wartości w cache - VS"""
        return self.redis.setex(key, ttl, value)
    
    def delete(self, key: str) -> bool:
        """Usunięcie wartości z cache - VS"""
        return self.redis.delete(key) > 0
    
    def exists(self, key: str) -> bool:
        """Sprawdzenie czy klucz istnieje - VS"""
        return self.redis.exists(key) > 0
