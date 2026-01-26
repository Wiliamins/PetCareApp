#!/usr/bin/env python3
"""
PetCareApp - DynamoDB Tables Setup
Creates all required tables in AWS DynamoDB
@author VS

Usage:
    python create_dynamodb_tables.py [--local]
    
Options:
    --local    Use local DynamoDB (http://localhost:8000)
"""

import boto3
import sys
import os
from botocore.exceptions import ClientError

# Configuration
REGION = os.getenv('AWS_REGION', 'eu-central-1')
LOCAL_ENDPOINT = 'http://localhost:8000'
TABLE_PREFIX = 'petcareapp-'

# Table definitions
TABLES = [
    {
        'name': 'users',
        'key_schema': [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        'attributes': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'email', 'AttributeType': 'S'},
            {'AttributeName': 'role', 'AttributeType': 'S'}
        ],
        'gsi': [
            {
                'IndexName': 'email-index',
                'KeySchema': [{'AttributeName': 'email', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            },
            {
                'IndexName': 'role-index',
                'KeySchema': [{'AttributeName': 'role', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ]
    },
    {
        'name': 'pets',
        'key_schema': [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        'attributes': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'ownerId', 'AttributeType': 'S'}
        ],
        'gsi': [
            {
                'IndexName': 'ownerId-index',
                'KeySchema': [{'AttributeName': 'ownerId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ]
    },
    {
        'name': 'appointments',
        'key_schema': [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        'attributes': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'date', 'AttributeType': 'S'},
            {'AttributeName': 'vetId', 'AttributeType': 'S'},
            {'AttributeName': 'clientId', 'AttributeType': 'S'}
        ],
        'gsi': [
            {
                'IndexName': 'date-index',
                'KeySchema': [{'AttributeName': 'date', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            },
            {
                'IndexName': 'vetId-index',
                'KeySchema': [{'AttributeName': 'vetId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            },
            {
                'IndexName': 'clientId-index',
                'KeySchema': [{'AttributeName': 'clientId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ]
    },
    {
        'name': 'medical-records',
        'key_schema': [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        'attributes': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'petId', 'AttributeType': 'S'},
            {'AttributeName': 'vetId', 'AttributeType': 'S'}
        ],
        'gsi': [
            {
                'IndexName': 'petId-index',
                'KeySchema': [{'AttributeName': 'petId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            },
            {
                'IndexName': 'vetId-index',
                'KeySchema': [{'AttributeName': 'vetId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ]
    },
    {
        'name': 'prescriptions',
        'key_schema': [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        'attributes': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'petId', 'AttributeType': 'S'}
        ],
        'gsi': [
            {
                'IndexName': 'petId-index',
                'KeySchema': [{'AttributeName': 'petId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ]
    },
    {
        'name': 'vaccinations',
        'key_schema': [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        'attributes': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'petId', 'AttributeType': 'S'}
        ],
        'gsi': [
            {
                'IndexName': 'petId-index',
                'KeySchema': [{'AttributeName': 'petId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ]
    },
    {
        'name': 'invoices',
        'key_schema': [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        'attributes': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'clientId', 'AttributeType': 'S'},
            {'AttributeName': 'status', 'AttributeType': 'S'}
        ],
        'gsi': [
            {
                'IndexName': 'clientId-index',
                'KeySchema': [{'AttributeName': 'clientId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            },
            {
                'IndexName': 'status-index',
                'KeySchema': [{'AttributeName': 'status', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ]
    },
    {
        'name': 'notifications',
        'key_schema': [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        'attributes': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'userId', 'AttributeType': 'S'}
        ],
        'gsi': [
            {
                'IndexName': 'userId-index',
                'KeySchema': [{'AttributeName': 'userId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ]
    },
    {
        'name': 'audit-logs',
        'key_schema': [
            {'AttributeName': 'id', 'KeyType': 'HASH'},
            {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
        ],
        'attributes': [
            {'AttributeName': 'id', 'AttributeType': 'S'},
            {'AttributeName': 'timestamp', 'AttributeType': 'S'},
            {'AttributeName': 'userId', 'AttributeType': 'S'}
        ],
        'gsi': [
            {
                'IndexName': 'userId-index',
                'KeySchema': [{'AttributeName': 'userId', 'KeyType': 'HASH'}],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ]
    }
]


def get_dynamodb_client(use_local=False):
    """Create DynamoDB client"""
    if use_local:
        return boto3.client(
            'dynamodb',
            endpoint_url=LOCAL_ENDPOINT,
            region_name=REGION,
            aws_access_key_id='dummy',
            aws_secret_access_key='dummy'
        )
    return boto3.client('dynamodb', region_name=REGION)


def create_table(client, table_config):
    """Create a single DynamoDB table"""
    table_name = TABLE_PREFIX + table_config['name']
    
    # Check if table exists
    try:
        client.describe_table(TableName=table_name)
        print(f"  ⏭️  Table {table_name} already exists, skipping...")
        return True
    except ClientError as e:
        if e.response['Error']['Code'] != 'ResourceNotFoundException':
            raise
    
    # Build create table params
    params = {
        'TableName': table_name,
        'KeySchema': table_config['key_schema'],
        'AttributeDefinitions': table_config['attributes'],
        'BillingMode': 'PAY_PER_REQUEST'  # On-demand pricing
    }
    
    # Add GSI if defined
    if 'gsi' in table_config:
        params['GlobalSecondaryIndexes'] = table_config['gsi']
    
    try:
        client.create_table(**params)
        print(f"  ✅ Created table: {table_name}")
        
        # Wait for table to be active
        waiter = client.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        print(f"  ✅ Table {table_name} is now active")
        return True
    except ClientError as e:
        print(f"  ❌ Error creating {table_name}: {e}")
        return False


def main():
    use_local = '--local' in sys.argv
    
    print("=" * 60)
    print("PetCareApp - DynamoDB Tables Setup")
    print("=" * 60)
    print(f"Mode: {'LOCAL' if use_local else 'AWS PRODUCTION'}")
    print(f"Region: {REGION}")
    print(f"Tables to create: {len(TABLES)}")
    print("=" * 60)
    
    if not use_local:
        confirm = input("\n⚠️  This will create tables in AWS. Continue? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Aborted.")
            return
    
    client = get_dynamodb_client(use_local)
    
    print("\nCreating tables...\n")
    
    success_count = 0
    for table_config in TABLES:
        if create_table(client, table_config):
            success_count += 1
    
    print("\n" + "=" * 60)
    print(f"✅ Successfully created/verified {success_count}/{len(TABLES)} tables")
    print("=" * 60)
    
    # List all tables
    print("\nExisting tables:")
    response = client.list_tables()
    for table in response.get('TableNames', []):
        if table.startswith(TABLE_PREFIX):
            print(f"  • {table}")


if __name__ == '__main__':
    main()
