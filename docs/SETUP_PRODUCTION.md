# 🚀 PetCareApp - Полная настройка Production

## Содержание
1. [AWS Аккаунт и IAM](#1-aws-аккаунт-и-iam)
2. [AWS Cognito (Аутентификация)](#2-aws-cognito)
3. [AWS DynamoDB (База данных)](#3-aws-dynamodb)
4. [AWS S3 (Хранилище файлов)](#4-aws-s3)
5. [AWS SES (Email уведомления)](#5-aws-ses-email)
6. [Stripe (Платежи)](#6-stripe-платежи)
7. [Финальная конфигурация](#7-финальная-конфигурация)

---

## 1. AWS Аккаунт и IAM

### Шаг 1.1: Создание AWS аккаунта
1. Перейди на https://aws.amazon.com/
2. Нажми "Create an AWS Account"
3. Заполни данные (нужна карта для верификации, но Free Tier бесплатный)

### Шаг 1.2: Создание IAM пользователя
1. Войди в AWS Console → IAM → Users → Create User
2. Имя: `petcareapp-admin`
3. Permissions: Attach policies directly:
   - `AmazonCognitoPowerUser`
   - `AmazonDynamoDBFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonSESFullAccess`
4. Create User → Download credentials (Access Key ID + Secret)

### Шаг 1.3: Настройка AWS CLI
```bash
# Установка
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Конфигурация
aws configure
# AWS Access Key ID: [твой ключ]
# AWS Secret Access Key: [твой секрет]
# Default region: eu-central-1
# Default output format: json
```

---

## 2. AWS Cognito

### Шаг 2.1: Создание User Pool (через консоль)
1. AWS Console → Cognito → Create user pool
2. **Step 1 - Sign-in experience:**
   - Cognito user pool sign-in options: ✅ Email
   - User name requirements: оставить пустым
   
3. **Step 2 - Security requirements:**
   - Password policy: Custom
     - Minimum length: 8
     - ✅ Numbers, ✅ Special characters, ✅ Uppercase, ✅ Lowercase
   - MFA: No MFA (для начала)
   - Account recovery: ✅ Email only

4. **Step 3 - Sign-up experience:**
   - Self-registration: ✅ Enable
   - Attribute verification: ✅ Email
   - Required attributes: email, given_name, family_name
   - Custom attributes: Add → `role` (String)

5. **Step 4 - Message delivery:**
   - Email provider: Send email with Cognito (для начала)
   - FROM email: no-reply@verificationemail.com

6. **Step 5 - App integration:**
   - User pool name: `petcareapp-users`
   - App client name: `petcareapp-web`
   - Client secret: ❌ Don't generate
   - Authentication flows: ✅ ALLOW_USER_PASSWORD_AUTH, ✅ ALLOW_REFRESH_TOKEN_AUTH

7. **Review and Create**

### Шаг 2.2: Записать данные
После создания запиши:
- **User Pool ID:** eu-central-1_XXXXXXXXX
- **App Client ID:** xxxxxxxxxxxxxxxxxxxxxxxxxx

---

## 3. AWS DynamoDB

### Шаг 3.1: Создание таблиц (автоматически)
Запусти скрипт из проекта:
```bash
cd petcareapp
python scripts/create_dynamodb_tables.py
```

### Или вручную через консоль:
Создай 9 таблиц с такими параметрами:

| Table Name | Partition Key | Sort Key | Billing |
|------------|---------------|----------|---------|
| petcareapp-users | id (S) | - | On-demand |
| petcareapp-pets | id (S) | - | On-demand |
| petcareapp-appointments | id (S) | - | On-demand |
| petcareapp-medical-records | id (S) | - | On-demand |
| petcareapp-prescriptions | id (S) | - | On-demand |
| petcareapp-vaccinations | id (S) | - | On-demand |
| petcareapp-invoices | id (S) | - | On-demand |
| petcareapp-notifications | id (S) | - | On-demand |
| petcareapp-audit-logs | id (S) | timestamp (S) | On-demand |

### Global Secondary Indexes (GSI):
- **petcareapp-users:** `email-index` (email as partition key)
- **petcareapp-pets:** `ownerId-index` (ownerId as partition key)
- **petcareapp-appointments:** `date-index` (date as partition key)

---

## 4. AWS S3

### Шаг 4.1: Создание Bucket
1. AWS Console → S3 → Create bucket
2. **Bucket name:** `petcareapp-files-[твой-уникальный-id]`
3. **Region:** eu-central-1
4. **Block Public Access:** ✅ Block all (будем использовать presigned URLs)
5. Create bucket

### Шаг 4.2: CORS Configuration
После создания: Bucket → Permissions → CORS → Edit:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
        "ExposeHeaders": ["ETag"]
    }
]
```

### Шаг 4.3: Создание папок
В bucket создай папки:
- `pets/` - фото животных
- `documents/` - медицинские документы
- `avatars/` - аватары пользователей

---

## 5. AWS SES (Email)

### Шаг 5.1: Верификация домена/email
1. AWS Console → SES → Verified identities → Create identity
2. **Для теста:** Identity type: Email address → твой email
3. Подтверди email по ссылке

### Шаг 5.2: Выход из Sandbox (для production)
1. SES → Account dashboard → Request production access
2. Заполни форму (обычно одобряют за 24 часа)

### Шаг 5.3: Создание SMTP Credentials
1. SES → SMTP settings → Create SMTP credentials
2. IAM user name: `petcareapp-ses-smtp`
3. **Запиши:**
   - SMTP Username
   - SMTP Password
   - SMTP Endpoint: email-smtp.eu-central-1.amazonaws.com
   - Port: 587 (TLS)

---

## 6. Stripe (Платежи)

### Шаг 6.1: Регистрация
1. Перейди на https://stripe.com/
2. Create account (для Польши доступен)
3. Подтверди email

### Шаг 6.2: Получение API Keys
1. Dashboard → Developers → API keys
2. **Для теста используй Test mode keys:**
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

### Шаг 6.3: Настройка Webhook (опционально)
1. Developers → Webhooks → Add endpoint
2. URL: `https://yourdomain.com/api/payments/webhook`
3. Events: `payment_intent.succeeded`, `payment_intent.failed`

### Тестовые карты Stripe:
| Номер | Результат |
|-------|-----------|
| 4242 4242 4242 4242 | ✅ Успешная оплата |
| 4000 0000 0000 0002 | ❌ Отклонено |
| 4000 0000 0000 3220 | 🔐 Требует 3D Secure |

---

## 7. Финальная конфигурация

### Шаг 7.1: Создай файл `.env`
```bash
# ===== AWS =====
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-central-1

# ===== Cognito =====
COGNITO_USER_POOL_ID=eu-central-1_XXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# ===== DynamoDB =====
DYNAMODB_ENDPOINT=https://dynamodb.eu-central-1.amazonaws.com

# ===== S3 =====
S3_BUCKET_NAME=petcareapp-files-xxxxx

# ===== SES (Email) =====
SMTP_HOST=email-smtp.eu-central-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIA...  # SES SMTP credentials
SMTP_PASSWORD=...
FROM_EMAIL=noreply@yourdomain.com

# ===== Stripe =====
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ===== App =====
APP_ENV=production
JWT_SECRET=your-super-secret-key-minimum-32-characters
FRONTEND_URL=http://localhost:3000
```

### Шаг 7.2: Запуск
```bash
# С Docker
docker-compose -f docker-compose.prod.yml up -d

# Без Docker
cd backend && pip install -r requirements.txt
cd frontend && npm install && npm start
```

---

## 🎉 Готово!

После всех настроек у тебя будет:
- ✅ Регистрация/логин через AWS Cognito
- ✅ База данных в DynamoDB
- ✅ Файлы в S3
- ✅ Email уведомления через SES
- ✅ Тестовые платежи через Stripe

## 💰 Стоимость (Free Tier первый год):
- Cognito: 50,000 MAU бесплатно
- DynamoDB: 25GB + 25 WCU/RCU бесплатно
- S3: 5GB бесплатно
- SES: 62,000 emails/месяц бесплатно (из EC2)
- **Итого: ~$0/месяц для малого проекта**
