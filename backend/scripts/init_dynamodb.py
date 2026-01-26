#!/usr/bin/env python3
"""
PetCareApp - DynamoDB Tables Initialization
Skrypt tworzenia tabel w DynamoDB
@author VS
"""

import boto3
from botocore.exceptions import ClientError
import os
import sys

# Konfiguracja - VS
AWS_REGION = os.getenv('AWS_REGION', 'eu-central-1')
DYNAMODB_ENDPOINT = os.getenv('DYNAMODB_ENDPOINT', 'http://localhost:8000')
TABLE_PREFIX = os.getenv('DYNAMODB_TABLE_PREFIX', 'petcareapp_')

# Tabele do utworzenia - VS
TABLES = [
    {
        'TableName': f'{TABLE_PREFIX}users',
        'KeySchema': [
            {'AttributeName': 'id', 'KeyType': 'HASH'}
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'email', 'AttributeType': 'S'},
            {'AttributeName': 'role', 'AttributeType': 'S'}
        ],
        'GlobalSecondaryIndexes': [
            {
                'IndexName': 'email-index',
                'KeySchema': [{'AttributeName': 'email', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            },
            {
                'IndexName': 'role-index',
                'KeySchema': [{'AttributeName': 'role', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            }
        ],
        'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    },
    {
        'TableName': f'{TABLE_PREFIX}pets',
        'KeySchema': [
            {'AttributeName': 'id', 'KeyType': 'HASH'}
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'ownerId', 'AttributeType': 'S'}
        ],
        'GlobalSecondaryIndexes': [
            {
                'IndexName': 'owner-index',
                'KeySchema': [{'AttributeName': 'ownerId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            }
        ],
        'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    },
    {
        'TableName': f'{TABLE_PREFIX}appointments',
        'KeySchema': [
            {'AttributeName': 'id', 'KeyType': 'HASH'}
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'ownerId', 'AttributeType': 'S'},
            {'AttributeName': 'vetId', 'AttributeType': 'S'},
            {'AttributeName': 'date', 'AttributeType': 'S'}
        ],
        'GlobalSecondaryIndexes': [
            {
                'IndexName': 'owner-date-index',
                'KeySchema': [
                    {'AttributeName': 'ownerId', 'KeyType': 'HASH'},
                    {'AttributeName': 'date', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            },
            {
                'IndexName': 'vet-date-index',
                'KeySchema': [
                    {'AttributeName': 'vetId', 'KeyType': 'HASH'},
                    {'AttributeName': 'date', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            }
        ],
        'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    },
    {
        'TableName': f'{TABLE_PREFIX}medical_records',
        'KeySchema': [
            {'AttributeName': 'id', 'KeyType': 'HASH'}
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'petId', 'AttributeType': 'S'}
        ],
        'GlobalSecondaryIndexes': [
            {
                'IndexName': 'pet-index',
                'KeySchema': [{'AttributeName': 'petId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            }
        ],
        'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    },
    {
        'TableName': f'{TABLE_PREFIX}vaccinations',
        'KeySchema': [
            {'AttributeName': 'id', 'KeyType': 'HASH'}
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'petId', 'AttributeType': 'S'}
        ],
        'GlobalSecondaryIndexes': [
            {
                'IndexName': 'pet-index',
                'KeySchema': [{'AttributeName': 'petId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            }
        ],
        'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    },
    {
        'TableName': f'{TABLE_PREFIX}prescriptions',
        'KeySchema': [
            {'AttributeName': 'id', 'KeyType': 'HASH'}
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'petId', 'AttributeType': 'S'}
        ],
        'GlobalSecondaryIndexes': [
            {
                'IndexName': 'pet-index',
                'KeySchema': [{'AttributeName': 'petId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            }
        ],
        'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    },
    {
        'TableName': f'{TABLE_PREFIX}payments',
        'KeySchema': [
            {'AttributeName': 'id', 'KeyType': 'HASH'}
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'ownerId', 'AttributeType': 'S'}
        ],
        'GlobalSecondaryIndexes': [
            {
                'IndexName': 'owner-index',
                'KeySchema': [{'AttributeName': 'ownerId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            }
        ],
        'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    },
    {
        'TableName': f'{TABLE_PREFIX}notifications',
        'KeySchema': [
            {'AttributeName': 'id', 'KeyType': 'HASH'}
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'userId', 'AttributeType': 'S'}
        ],
        'GlobalSecondaryIndexes': [
            {
                'IndexName': 'user-index',
                'KeySchema': [{'AttributeName': 'userId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            }
        ],
        'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    },
    {
        'TableName': f'{TABLE_PREFIX}audit_logs',
        'KeySchema': [
            {'AttributeName': 'id', 'KeyType': 'HASH'}
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'id', 'AttributeType': 'S'}
        ],
        'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    }
]


def create_tables():
    """Tworzenie tabel w DynamoDB - VS"""
    print(f"Connecting to DynamoDB at {DYNAMODB_ENDPOINT or 'AWS'}...")
    
    if DYNAMODB_ENDPOINT:
        dynamodb = boto3.client(
            'dynamodb',
            region_name=AWS_REGION,
            endpoint_url=DYNAMODB_ENDPOINT
        )
    else:
        dynamodb = boto3.client('dynamodb', region_name=AWS_REGION)
    
    # Pobierz istniejące tabele - VS
    existing_tables = dynamodb.list_tables()['TableNames']
    print(f"Existing tables: {existing_tables}")
    
    created = 0
    skipped = 0
    
    for table_def in TABLES:
        table_name = table_def['TableName']
        
        if table_name in existing_tables:
            print(f"  ⏭️  Table {table_name} already exists, skipping...")
            skipped += 1
            continue
        
        try:
            print(f"  📦 Creating table {table_name}...")
            dynamodb.create_table(**table_def)
            
            # Poczekaj na aktywację tabeli - VS
            waiter = dynamodb.get_waiter('table_exists')
            waiter.wait(TableName=table_name)
            
            print(f"  ✅ Table {table_name} created successfully")
            created += 1
            
        except ClientError as e:
            print(f"  ❌ Error creating table {table_name}: {e}")
    
    print(f"\nSummary: {created} created, {skipped} skipped")
    return created, skipped


def delete_tables():
    """Usuwanie wszystkich tabel (tylko development!) - VS"""
    if DYNAMODB_ENDPOINT is None:
        print("❌ Refusing to delete tables on production AWS!")
        return
    
    print(f"Deleting all PetCareApp tables from {DYNAMODB_ENDPOINT}...")
    
    dynamodb = boto3.client(
        'dynamodb',
        region_name=AWS_REGION,
        endpoint_url=DYNAMODB_ENDPOINT
    )
    
    for table_def in TABLES:
        table_name = table_def['TableName']
        try:
            print(f"  🗑️  Deleting {table_name}...")
            dynamodb.delete_table(TableName=table_name)
            print(f"  ✅ Deleted {table_name}")
        except ClientError as e:
            if 'ResourceNotFoundException' in str(e):
                print(f"  ⏭️  Table {table_name} not found, skipping...")
            else:
                print(f"  ❌ Error: {e}")


def list_tables():
    """Lista wszystkich tabel - VS"""
    if DYNAMODB_ENDPOINT:
        dynamodb = boto3.client(
            'dynamodb',
            region_name=AWS_REGION,
            endpoint_url=DYNAMODB_ENDPOINT
        )
    else:
        dynamodb = boto3.client('dynamodb', region_name=AWS_REGION)
    
    tables = dynamodb.list_tables()['TableNames']
    print(f"Tables in DynamoDB ({DYNAMODB_ENDPOINT or 'AWS'}):")
    for table in tables:
        print(f"  - {table}")
    print(f"Total: {len(tables)} tables")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python init_dynamodb.py [create|delete|list]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'create':
        create_tables()
    elif command == 'delete':
        confirm = input("Are you sure you want to delete all tables? (yes/no): ")
        if confirm.lower() == 'yes':
            delete_tables()
        else:
            print("Cancelled")
    elif command == 'list':
        list_tables()
    else:
        print(f"Unknown command: {command}")
        print("Available commands: create, delete, list")
