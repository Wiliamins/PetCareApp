#!/bin/bash
# PetCareApp - AWS Setup Script
# Skrypt automatycznej konfiguracji AWS
# @author VS

set -e

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Konfiguracja
AWS_REGION="${AWS_REGION:-eu-central-1}"
APP_NAME="petcareapp"
TABLE_PREFIX="${APP_NAME}_"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       PetCareApp - AWS Infrastructure Setup              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Sprawdź AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI nie jest zainstalowane!${NC}"
    echo "Zainstaluj: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Sprawdź konfigurację AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI nie jest skonfigurowane!${NC}"
    echo "Uruchom: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account: ${ACCOUNT_ID}${NC}"
echo -e "${GREEN}✓ Region: ${AWS_REGION}${NC}"
echo ""

# ============================================
# 1. COGNITO
# ============================================
echo -e "${YELLOW}[1/4] Konfiguracja Cognito...${NC}"

# Sprawdź czy User Pool istnieje
EXISTING_POOL=$(aws cognito-idp list-user-pools --max-results 10 --query "UserPools[?Name=='${APP_NAME}-users'].Id" --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_POOL" ]; then
    echo -e "${BLUE}  ℹ User Pool już istnieje: ${EXISTING_POOL}${NC}"
    USER_POOL_ID=$EXISTING_POOL
else
    echo "  📦 Tworzenie User Pool..."
    USER_POOL_ID=$(aws cognito-idp create-user-pool \
        --pool-name "${APP_NAME}-users" \
        --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":false}}' \
        --auto-verified-attributes email \
        --username-attributes email \
        --schema '[{"Name":"email","Required":true,"Mutable":true},{"Name":"given_name","Required":true,"Mutable":true},{"Name":"family_name","Required":true,"Mutable":true},{"Name":"phone_number","Required":false,"Mutable":true}]' \
        --region ${AWS_REGION} \
        --query 'UserPool.Id' \
        --output text)
    echo -e "${GREEN}  ✓ User Pool utworzony: ${USER_POOL_ID}${NC}"
fi

# Sprawdź czy App Client istnieje
EXISTING_CLIENT=$(aws cognito-idp list-user-pool-clients --user-pool-id ${USER_POOL_ID} --query "UserPoolClients[?ClientName=='${APP_NAME}-web'].ClientId" --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_CLIENT" ]; then
    echo -e "${BLUE}  ℹ App Client już istnieje: ${EXISTING_CLIENT}${NC}"
    CLIENT_ID=$EXISTING_CLIENT
    CLIENT_SECRET=$(aws cognito-idp describe-user-pool-client --user-pool-id ${USER_POOL_ID} --client-id ${CLIENT_ID} --query 'UserPoolClient.ClientSecret' --output text 2>/dev/null || echo "")
else
    echo "  📦 Tworzenie App Client..."
    CLIENT_RESPONSE=$(aws cognito-idp create-user-pool-client \
        --user-pool-id ${USER_POOL_ID} \
        --client-name "${APP_NAME}-web" \
        --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
        --generate-secret \
        --region ${AWS_REGION})
    
    CLIENT_ID=$(echo $CLIENT_RESPONSE | jq -r '.UserPoolClient.ClientId')
    CLIENT_SECRET=$(echo $CLIENT_RESPONSE | jq -r '.UserPoolClient.ClientSecret')
    echo -e "${GREEN}  ✓ App Client utworzony: ${CLIENT_ID}${NC}"
fi

# ============================================
# 2. DYNAMODB
# ============================================
echo ""
echo -e "${YELLOW}[2/4] Konfiguracja DynamoDB...${NC}"

TABLES=(
    "users:id:S"
    "pets:id:S"
    "appointments:id:S"
    "medical_records:id:S"
    "vaccinations:id:S"
    "prescriptions:id:S"
    "payments:id:S"
    "notifications:id:S"
    "audit_logs:id:S"
)

for table_def in "${TABLES[@]}"; do
    IFS=':' read -r table_name pk_name pk_type <<< "$table_def"
    full_name="${TABLE_PREFIX}${table_name}"
    
    # Sprawdź czy tabela istnieje
    if aws dynamodb describe-table --table-name ${full_name} --region ${AWS_REGION} &> /dev/null; then
        echo -e "${BLUE}  ℹ Tabela ${full_name} już istnieje${NC}"
    else
        echo "  📦 Tworzenie tabeli ${full_name}..."
        aws dynamodb create-table \
            --table-name ${full_name} \
            --attribute-definitions AttributeName=${pk_name},AttributeType=${pk_type} \
            --key-schema AttributeName=${pk_name},KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            --region ${AWS_REGION} > /dev/null
        echo -e "${GREEN}  ✓ Tabela ${full_name} utworzona${NC}"
    fi
done

# ============================================
# 3. S3
# ============================================
echo ""
echo -e "${YELLOW}[3/4] Konfiguracja S3...${NC}"

BUCKET_NAME="${APP_NAME}-files-${ACCOUNT_ID}"

if aws s3api head-bucket --bucket ${BUCKET_NAME} 2>/dev/null; then
    echo -e "${BLUE}  ℹ Bucket ${BUCKET_NAME} już istnieje${NC}"
else
    echo "  📦 Tworzenie bucketu ${BUCKET_NAME}..."
    aws s3 mb s3://${BUCKET_NAME} --region ${AWS_REGION}
    
    # Konfiguracja CORS
    aws s3api put-bucket-cors --bucket ${BUCKET_NAME} --cors-configuration '{
        "CORSRules": [{
            "AllowedOrigins": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedHeaders": ["*"],
            "MaxAgeSeconds": 3000
        }]
    }'
    
    # Blokada publicznego dostępu
    aws s3api put-public-access-block --bucket ${BUCKET_NAME} --public-access-block-configuration '{
        "BlockPublicAcls": true,
        "IgnorePublicAcls": true,
        "BlockPublicPolicy": true,
        "RestrictPublicBuckets": true
    }'
    
    echo -e "${GREEN}  ✓ Bucket ${BUCKET_NAME} utworzony${NC}"
fi

# ============================================
# 4. GENEROWANIE .env
# ============================================
echo ""
echo -e "${YELLOW}[4/4] Generowanie pliku .env...${NC}"

ENV_FILE=".env"

cat > ${ENV_FILE} << EOF
# PetCareApp - Production Environment
# Wygenerowano automatycznie: $(date)
# @author VS

# ==============================================
# TRYB PRACY
# ==============================================
APP_ENV=production
DEBUG=false
LOG_LEVEL=INFO

# ==============================================
# AWS
# ==============================================
AWS_REGION=${AWS_REGION}
# AWS_ACCESS_KEY_ID i AWS_SECRET_ACCESS_KEY ustaw osobno lub użyj IAM Role

# ==============================================
# COGNITO
# ==============================================
COGNITO_USER_POOL_ID=${USER_POOL_ID}
COGNITO_CLIENT_ID=${CLIENT_ID}
COGNITO_CLIENT_SECRET=${CLIENT_SECRET}

# ==============================================
# DYNAMODB
# ==============================================
DYNAMODB_TABLE_PREFIX=${TABLE_PREFIX}
# DYNAMODB_ENDPOINT= # Zostaw puste dla AWS

# ==============================================
# S3
# ==============================================
S3_BUCKET_NAME=${BUCKET_NAME}
S3_REGION=${AWS_REGION}

# ==============================================
# REDIS (ustaw dla produkcji)
# ==============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ==============================================
# KAFKA (ustaw dla produkcji)
# ==============================================
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
KAFKA_GROUP_ID=${APP_NAME}

# ==============================================
# JWT
# ==============================================
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=604800

# ==============================================
# EMAIL (skonfiguruj dla produkcji)
# ==============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=PetCareApp
SMTP_FROM_EMAIL=noreply@petcareapp.pl

# ==============================================
# FRONTEND
# ==============================================
REACT_APP_API_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080

# ==============================================
# MONITORING
# ==============================================
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
GRAFANA_ADMIN_PASSWORD=$(openssl rand -hex 8)
EOF

echo -e "${GREEN}  ✓ Plik .env wygenerowany${NC}"

# ============================================
# PODSUMOWANIE
# ============================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               KONFIGURACJA ZAKOŃCZONA!                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Utworzone zasoby:${NC}"
echo -e "  • Cognito User Pool: ${USER_POOL_ID}"
echo -e "  • Cognito Client ID: ${CLIENT_ID}"
echo -e "  • DynamoDB Tables:   ${TABLE_PREFIX}*"
echo -e "  • S3 Bucket:         ${BUCKET_NAME}"
echo ""
echo -e "${BLUE}Plik .env został wygenerowany z konfiguracją.${NC}"
echo ""
echo -e "${YELLOW}Następne kroki:${NC}"
echo -e "  1. Sprawdź plik .env i uzupełnij brakujące wartości"
echo -e "  2. Uruchom: docker-compose up -d --build"
echo -e "  3. Sprawdź: docker-compose ps"
echo ""
echo -e "${BLUE}Aby utworzyć użytkownika admina:${NC}"
echo -e "  aws cognito-idp admin-create-user \\"
echo -e "    --user-pool-id ${USER_POOL_ID} \\"
echo -e "    --username admin@petcareapp.pl \\"
echo -e "    --user-attributes Name=email,Value=admin@petcareapp.pl \\"
echo -e "    --temporary-password 'TempPass123!'"
echo ""
