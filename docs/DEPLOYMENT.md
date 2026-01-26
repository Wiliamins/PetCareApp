# 🚀 PetCareApp - Instrukcja Wdrożenia na AWS

## Spis treści
1. [Wymagania wstępne](#1-wymagania-wstępne)
2. [Konfiguracja AWS](#2-konfiguracja-aws)
3. [Konfiguracja Cognito](#3-konfiguracja-cognito)
4. [Konfiguracja DynamoDB](#4-konfiguracja-dynamodb)
5. [Konfiguracja S3](#5-konfiguracja-s3)
6. [Deployment na EC2](#6-deployment-na-ec2)
7. [Deployment na ECS](#7-deployment-na-ecs-alternatywa)
8. [Konfiguracja domeny i SSL](#8-konfiguracja-domeny-i-ssl)
9. [Monitoring](#9-monitoring)

---

## 1. Wymagania wstępne

### Zainstaluj narzędzia:
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose -y

# Node.js (dla frontendu)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Skonfiguruj AWS CLI:
```bash
aws configure
# AWS Access Key ID: TWÓJ_ACCESS_KEY
# AWS Secret Access Key: TWÓJ_SECRET_KEY
# Default region name: eu-central-1
# Default output format: json
```

---

## 2. Konfiguracja AWS

### 2.1 Utwórz użytkownika IAM

1. Zaloguj się do AWS Console → IAM
2. Users → Create User
3. Nazwa: `petcareapp-admin`
4. Dodaj polityki:
   - `AmazonCognitoPowerUser`
   - `AmazonDynamoDBFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonEC2FullAccess`
   - `CloudWatchFullAccess`

5. Utwórz Access Key i zapisz!

### 2.2 Utwórz VPC (opcjonalnie)
```bash
# Użyj domyślnego VPC lub utwórz nowy
aws ec2 describe-vpcs --query 'Vpcs[0].VpcId' --output text
```

---

## 3. Konfiguracja Cognito

### 3.1 Utwórz User Pool

```bash
# Utwórz User Pool
aws cognito-idp create-user-pool \
  --pool-name "PetCareApp-Users" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --schema '[
    {"Name": "email", "Required": true, "Mutable": true},
    {"Name": "given_name", "Required": true, "Mutable": true},
    {"Name": "family_name", "Required": true, "Mutable": true},
    {"Name": "phone_number", "Required": false, "Mutable": true},
    {"Name": "custom:role", "AttributeDataType": "String", "Mutable": true}
  ]' \
  --region eu-central-1

# Zapisz USER_POOL_ID z odpowiedzi!
```

### 3.2 Utwórz App Client

```bash
# Zastąp YOUR_USER_POOL_ID rzeczywistym ID
aws cognito-idp create-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-name "PetCareApp-Web" \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --generate-secret \
  --region eu-central-1

# Zapisz CLIENT_ID i CLIENT_SECRET!
```

### 3.3 Utwórz użytkownika admina

```bash
# Utwórz użytkownika
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@petcareapp.pl \
  --user-attributes Name=email,Value=admin@petcareapp.pl Name=given_name,Value=Admin Name=family_name,Value=System Name=custom:role,Value=admin \
  --temporary-password "TempPass123!" \
  --region eu-central-1

# Ustaw stałe hasło
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@petcareapp.pl \
  --password "TwojeStaleHaslo123!" \
  --permanent \
  --region eu-central-1
```

---

## 4. Konfiguracja DynamoDB

### 4.1 Uruchom skrypt tworzenia tabel

```bash
# Ustaw zmienne środowiskowe
export AWS_REGION=eu-central-1
export DYNAMODB_TABLE_PREFIX=petcareapp_

# Uruchom skrypt
cd backend/scripts
python init_dynamodb.py create
```

### 4.2 Lub utwórz tabele ręcznie przez AWS Console

Tabele do utworzenia:
- `petcareapp_users` (PK: id, GSI: email-index, role-index)
- `petcareapp_pets` (PK: id, GSI: owner-index)
- `petcareapp_appointments` (PK: id, GSI: owner-date-index, vet-date-index)
- `petcareapp_medical_records` (PK: id, GSI: pet-index)
- `petcareapp_vaccinations` (PK: id, GSI: pet-index)
- `petcareapp_prescriptions` (PK: id, GSI: pet-index)
- `petcareapp_payments` (PK: id, GSI: owner-index)
- `petcareapp_notifications` (PK: id, GSI: user-index)
- `petcareapp_audit_logs` (PK: id)

---

## 5. Konfiguracja S3

### 5.1 Utwórz bucket

```bash
# Utwórz bucket (nazwa musi być globalnie unikalna!)
aws s3 mb s3://petcareapp-files-TWOJA_NAZWA --region eu-central-1

# Skonfiguruj CORS
aws s3api put-bucket-cors --bucket petcareapp-files-TWOJA_NAZWA --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}'

# Wyłącz publiczny dostęp
aws s3api put-public-access-block --bucket petcareapp-files-TWOJA_NAZWA --public-access-block-configuration '{
  "BlockPublicAcls": true,
  "IgnorePublicAcls": true,
  "BlockPublicPolicy": true,
  "RestrictPublicBuckets": true
}'
```

---

## 6. Deployment na EC2

### 6.1 Utwórz instancję EC2

```bash
# Utwórz Security Group
aws ec2 create-security-group \
  --group-name petcareapp-sg \
  --description "PetCareApp Security Group"

# Dodaj reguły
aws ec2 authorize-security-group-ingress --group-name petcareapp-sg --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name petcareapp-sg --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name petcareapp-sg --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name petcareapp-sg --protocol tcp --port 3000 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name petcareapp-sg --protocol tcp --port 8080 --cidr 0.0.0.0/0

# Utwórz Key Pair
aws ec2 create-key-pair --key-name petcareapp-key --query 'KeyMaterial' --output text > petcareapp-key.pem
chmod 400 petcareapp-key.pem

# Uruchom instancję (Ubuntu 22.04, t3.medium)
aws ec2 run-instances \
  --image-id ami-0faab6bdbac9486fb \
  --instance-type t3.medium \
  --key-name petcareapp-key \
  --security-groups petcareapp-sg \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=PetCareApp}]' \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30}}]'

# Pobierz publiczne IP
aws ec2 describe-instances --filters "Name=tag:Name,Values=PetCareApp" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

### 6.2 Skonfiguruj serwer

```bash
# Połącz się z serwerem
ssh -i petcareapp-key.pem ubuntu@TWOJE_IP

# Na serwerze:
sudo apt-get update && sudo apt-get upgrade -y

# Zainstaluj Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Zainstaluj Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Wyloguj i zaloguj ponownie
exit
ssh -i petcareapp-key.pem ubuntu@TWOJE_IP
```

### 6.3 Wdróż aplikację

```bash
# Na serwerze
cd ~
git clone https://github.com/TWOJE_REPO/petcareapp.git
# LUB skopiuj pliki przez SCP
# scp -i petcareapp-key.pem -r petcareapp/ ubuntu@TWOJE_IP:~/

cd petcareapp

# Utwórz plik .env
cp .env.example .env
nano .env
# Wypełnij wszystkie wartości!

# Zbuduj i uruchom
docker-compose up -d --build

# Sprawdź status
docker-compose ps
docker-compose logs -f
```

---

## 7. Deployment na ECS (Alternatywa)

### 7.1 Utwórz repozytorium ECR

```bash
# Dla każdego serwisu
aws ecr create-repository --repository-name petcareapp/auth-service
aws ecr create-repository --repository-name petcareapp/user-service
aws ecr create-repository --repository-name petcareapp/frontend
# ... itd.

# Zaloguj do ECR
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com
```

### 7.2 Zbuduj i wypchnij obrazy

```bash
# Przykład dla auth-service
cd backend/auth_service
docker build -t petcareapp/auth-service .
docker tag petcareapp/auth-service:latest ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/petcareapp/auth-service:latest
docker push ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/petcareapp/auth-service:latest
```

### 7.3 Utwórz klaster ECS

Użyj AWS Console lub Terraform (rekomendowane dla produkcji).

---

## 8. Konfiguracja domeny i SSL

### 8.1 Route 53

```bash
# Utwórz hosted zone (jeśli masz domenę)
aws route53 create-hosted-zone --name petcareapp.pl --caller-reference $(date +%s)

# Dodaj rekord A wskazujący na EC2
aws route53 change-resource-record-sets --hosted-zone-id ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "petcareapp.pl",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "TWOJE_IP"}]
    }
  }]
}'
```

### 8.2 SSL z Let's Encrypt

```bash
# Na serwerze EC2
sudo apt-get install certbot python3-certbot-nginx -y

# Uzyskaj certyfikat
sudo certbot --nginx -d petcareapp.pl -d www.petcareapp.pl

# Auto-odnowienie
sudo certbot renew --dry-run
```

---

## 9. Monitoring

### 9.1 CloudWatch

```bash
# Utwórz grupę logów
aws logs create-log-group --log-group-name /petcareapp/services

# Dashboard (przez AWS Console)
# CloudWatch → Dashboards → Create dashboard
```

### 9.2 Prometheus & Grafana (już w docker-compose)

Dostępne na:
- Prometheus: http://TWOJE_IP:9090
- Grafana: http://TWOJE_IP:3001 (admin/admin)

---

## 📋 Checklist przed uruchomieniem

- [ ] AWS CLI skonfigurowane
- [ ] Cognito User Pool utworzony
- [ ] Cognito App Client utworzony
- [ ] DynamoDB tabele utworzone
- [ ] S3 bucket utworzony
- [ ] EC2 instancja uruchomiona
- [ ] Security Group skonfigurowany
- [ ] Plik .env wypełniony
- [ ] docker-compose up działa
- [ ] Frontend dostępny na porcie 3000
- [ ] API dostępne na porcie 8080
- [ ] SSL certyfikat (opcjonalnie)

---

## 🆘 Troubleshooting

### Cognito błędy
```bash
# Sprawdź logi
docker-compose logs auth-service

# Zweryfikuj credentials
aws cognito-idp describe-user-pool --user-pool-id YOUR_POOL_ID
```

### DynamoDB błędy
```bash
# Sprawdź czy tabele istnieją
aws dynamodb list-tables

# Sprawdź połączenie
python -c "import boto3; print(boto3.resource('dynamodb').tables.all())"
```

### Docker błędy
```bash
# Zrestartuj serwisy
docker-compose restart

# Wyczyść i zbuduj od nowa
docker-compose down -v
docker-compose up -d --build
```

---

## 📞 Kontakt

W przypadku problemów sprawdź logi:
```bash
docker-compose logs -f --tail=100
```

@author VS
