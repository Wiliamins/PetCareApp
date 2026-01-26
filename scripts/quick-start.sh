#!/bin/bash
# PetCareApp - Quick Start Script
# Szybki start lokalny bez AWS
# @author VS

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         PetCareApp - Quick Start (Development)           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Sprawdź Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker nie jest zainstalowany!${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose nie jest zainstalowany!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker zainstalowany${NC}"

# Utwórz .env jeśli nie istnieje
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Tworzenie pliku .env dla trybu development...${NC}"
    cat > .env << 'EOF'
# PetCareApp - Development Environment
APP_ENV=development
DEBUG=true
LOG_LEVEL=DEBUG

# Cognito - puste = tryb development
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=

# DynamoDB Local
DYNAMODB_ENDPOINT=http://dynamodb-local:8000
DYNAMODB_TABLE_PREFIX=petcareapp_

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Kafka
KAFKA_BOOTSTRAP_SERVERS=kafka:9092

# JWT (development)
JWT_SECRET_KEY=dev-secret-key-change-in-production

# Frontend
REACT_APP_API_URL=http://localhost:8080

# Grafana
GRAFANA_ADMIN_PASSWORD=admin
EOF
    echo -e "${GREEN}✓ Plik .env utworzony${NC}"
fi

echo ""
echo -e "${YELLOW}🚀 Uruchamianie kontenerów...${NC}"
echo ""

# Uruchom tylko podstawowe serwisy
docker-compose up -d dynamodb-local redis

echo -e "${YELLOW}⏳ Czekam na uruchomienie baz danych (10s)...${NC}"
sleep 10

# Utwórz tabele w DynamoDB Local
echo -e "${YELLOW}📦 Tworzenie tabel w DynamoDB Local...${NC}"

# Funkcja tworzenia tabeli
create_table() {
    local table_name=$1
    aws dynamodb create-table \
        --table-name ${table_name} \
        --attribute-definitions AttributeName=id,AttributeType=S \
        --key-schema AttributeName=id,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --endpoint-url http://localhost:8000 \
        --region eu-central-1 2>/dev/null || echo "  (tabela może już istnieć)"
}

for table in users pets appointments medical_records vaccinations prescriptions payments notifications audit_logs; do
    echo "  Creating petcareapp_${table}..."
    create_table "petcareapp_${table}"
done

echo ""
echo -e "${YELLOW}🚀 Uruchamianie wszystkich serwisów...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}✓ Serwisy uruchomione!${NC}"
echo ""

# Pokaż status
docker-compose ps

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    DOSTĘPNE ADRESY                       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Frontend:${NC}    http://localhost:3000"
echo -e "  ${GREEN}API:${NC}         http://localhost:8080"
echo -e "  ${GREEN}Prometheus:${NC}  http://localhost:9090"
echo -e "  ${GREEN}Grafana:${NC}     http://localhost:3001 (admin/admin)"
echo ""
echo -e "${YELLOW}Tryb development - logowanie działa z dowolnymi danymi!${NC}"
echo -e "  Email: dowolny@email.com"
echo -e "  Hasło: dowolne"
echo -e "  Rola: client/vet/admin/it"
echo ""
echo -e "${BLUE}Przydatne komendy:${NC}"
echo -e "  docker-compose logs -f        # Logi"
echo -e "  docker-compose ps             # Status"
echo -e "  docker-compose restart        # Restart"
echo -e "  docker-compose down           # Stop"
echo ""
