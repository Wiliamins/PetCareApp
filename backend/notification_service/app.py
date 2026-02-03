#PetCareApp - Notification Service
#Serwis powiadomień z AWS SES (email) i DynamoDB (in-app notifications)
#@author VS

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid
import os
import logging
import boto3
from botocore.exceptions import ClientError

# Konfiguracja logowania - VS
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ==============================================
# Konfiguracja AWS - VS
# ==============================================
AWS_REGION = os.getenv('AWS_REGION', 'eu-central-1')
TABLE_NAME = 'PetCareApp-Notifications'
SES_FROM_EMAIL = os.getenv('SES_FROM_EMAIL')

# Inicjalizacja klientów AWS - VS
dynamodb = None
table = None
ses_client = None

try:
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    table = dynamodb.Table(TABLE_NAME)
    logger.info(f"DynamoDB connected: {TABLE_NAME}")
except Exception as e:
    logger.warning(f"DynamoDB not available: {e}")

try:
    ses_client = boto3.client('ses', region_name=AWS_REGION)
    logger.info("AWS SES client initialized")
except Exception as e:
    logger.warning(f"AWS SES not available: {e}")

# In-memory storage dla development mode - VS
notifications_memory = {}
settings_memory = {}

# ==============================================
# AWS SES Email Functions - VS
# ==============================================

def send_email_ses(to_email, subject, html_body, text_body=None):

    if not ses_client:
        logger.warning("AWS SES not configured, skipping email")
        return False
    
    try:
        body = {'Html': {'Charset': 'UTF-8', 'Data': html_body}}
        if text_body:
            body['Text'] = {'Charset': 'UTF-8', 'Data': text_body}
        
        response = ses_client.send_email(
            Source=SES_FROM_EMAIL,
            Destination={'ToAddresses': [to_email]},
            Message={
                'Subject': {'Charset': 'UTF-8', 'Data': subject},
                'Body': body
            }
        )
        
        logger.info(f"Email sent via SES to {to_email}, MessageId: {response['MessageId']}")
        return True
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        logger.error(f"SES error ({error_code}): {e.response['Error']['Message']}")
        return False
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def create_appointment_reminder_email(data):
    """Tworzenie emaila z przypomnieniem o wizycie - VS"""
    pet_name = data.get('petName', 'Twoje zwierzę')
    date_time = data.get('dateTime', '')
    vet_name = data.get('vetName', 'lekarz weterynarii')
    service_type = data.get('serviceType', 'wizyta')
    
    try:
        dt = datetime.fromisoformat(date_time.replace('Z', '+00:00'))
        formatted_date = dt.strftime('%d.%m.%Y')
        formatted_time = dt.strftime('%H:%M')
    except:
        formatted_date = date_time
        formatted_time = ''
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🐾 PetCareApp</h1>
            <p style="margin: 10px 0 0 0;">Przypomnienie o wizycie</p>
        </div>
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
            <p>Dzień dobry!</p>
            <p>Przypominamy o zbliżającej się wizycie w naszej klinice weterynaryjnej.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>🐕 Pacjent:</strong> {pet_name}</p>
                <p style="margin: 8px 0;"><strong>📅 Data:</strong> {formatted_date}</p>
                <p style="margin: 8px 0;"><strong>🕐 Godzina:</strong> {formatted_time}</p>
                <p style="margin: 8px 0;"><strong>💉 Usługa:</strong> {service_type}</p>
                <p style="margin: 8px 0;"><strong>👨‍⚕️ Lekarz:</strong> {vet_name}</p>
            </div>
            
            <p><strong>Pamiętaj:</strong></p>
            <ul>
                <li>Przynieś książeczkę zdrowia zwierzęcia</li>
                <li>Pies powinien być na smyczy, kot w transporterze</li>
                <li>W razie potrzeby odwołania wizyty, zrób to minimum 24h wcześniej</li>
            </ul>
            
            <p>Do zobaczenia!</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>© 2026 PetCareApp - System zarządzania kliniką weterynaryjną</p>
        </div>
    </body>
    </html>
    """
    
    text = f"""Przypomnienie o wizycie - PetCareApp

Pacjent: {pet_name}
Data: {formatted_date}
Godzina: {formatted_time}
Usługa: {service_type}
Lekarz: {vet_name}

Pamiętaj:
- Przynieś książeczkę zdrowia zwierzęcia
- Pies powinien być na smyczy, kot w transporterze

Do zobaczenia!
--
PetCareApp"""
    
    return html, text

def create_vaccination_reminder_email(data):
    """Tworzenie emaila z przypomnieniem o szczepieniu - VS"""
    pet_name = data.get('petName', 'Twoje zwierzę')
    vaccine_name = data.get('vaccineName', 'szczepienie')
    expiry_date = data.get('expiryDate', '')
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🐾 PetCareApp</h1>
            <p style="margin: 10px 0 0 0;">Przypomnienie o szczepieniu</p>
        </div>
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>⚠️ Uwaga!</strong></p>
                <p style="margin: 5px 0;">Zbliża się termin ważności szczepienia dla <strong>{pet_name}</strong></p>
                <p style="margin: 5px 0;">Szczepienie: <strong>{vaccine_name}</strong></p>
                <p style="margin: 5px 0;">Ważne do: <strong>{expiry_date}</strong></p>
            </div>
            
            <p>Zalecamy umówienie wizyty w celu odnowienia szczepienia. Regularne szczepienia są kluczowe dla zdrowia Twojego pupila.</p>
            
            <p>Zaloguj się do aplikacji PetCareApp, aby umówić wizytę.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>© 2025 PetCareApp</p>
        </div>
    </body>
    </html>
    """
    
    text = f"""Przypomnienie o szczepieniu - PetCareApp

Pacjent: {pet_name}
Szczepienie: {vaccine_name}
Ważne do: {expiry_date}

Zalecamy umówienie wizyty w celu odnowienia szczepienia.
--
PetCareApp"""
    
    return html, text

def create_payment_confirmation_email(data):
    """Tworzenie emaila z potwierdzeniem płatności - VS"""
    amount = data.get('amount', 0)
    service = data.get('service', 'usługa weterynaryjna')
    date = data.get('date', datetime.now().strftime('%d.%m.%Y'))
    transaction_id = data.get('transactionId', '')
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🐾 PetCareApp</h1>
            <p style="margin: 10px 0 0 0;">Potwierdzenie płatności</p>
        </div>
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
            <div style="background: #d1fae5; border: 1px solid #10b981; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; font-size: 18px;">✅ Płatność zakończona pomyślnie!</p>
                <p style="margin: 15px 0 0 0; font-size: 36px; font-weight: bold; color: #059669;">{amount} PLN</p>
            </div>
            
            <p><strong>Szczegóły transakcji:</strong></p>
            <ul>
                <li>Usługa: {service}</li>
                <li>Data: {date}</li>
                <li>Kwota: {amount} PLN</li>
                <li>Status: Opłacone</li>
                {f'<li>ID transakcji: {transaction_id}</li>' if transaction_id else ''}
            </ul>
            
            <p>Dziękujemy za skorzystanie z usług naszej kliniki!</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>© 2025 PetCareApp</p>
        </div>
    </body>
    </html>
    """
    
    text = f"""Potwierdzenie płatności - PetCareApp

Płatność zakończona pomyślnie!

Kwota: {amount} PLN
Usługa: {service}
Data: {date}
Status: Opłacone

Dziękujemy!
--
PetCareApp"""
    
    return html, text

# ==============================================
# DynamoDB Functions (In-App Notifications) - VS
# ==============================================

def save_notification(notification):
    """Zapisz powiadomienie do DynamoDB - VS"""
    if table:
        try:
            table.put_item(Item=notification)
            logger.info(f"Notification saved: {notification['id']}")
            return True
        except ClientError as e:
            logger.error(f"DynamoDB put error: {e}")
    
    # Fallback do pamięci
    notifications_memory[notification['id']] = notification
    return True

def get_notifications(user_id, limit=50):
    """Pobierz powiadomienia użytkownika z DynamoDB - VS"""
    if table:
        try:
            response = table.query(
                IndexName='userId-createdAt-index',
                KeyConditionExpression='userId = :uid',
                ExpressionAttributeValues={':uid': user_id},
                ScanIndexForward=False,  # Najnowsze pierwsze
                Limit=limit
            )
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"DynamoDB query error: {e}")
    
    # Fallback do pamięci
    notifs = [n for n in notifications_memory.values() if n.get('userId') == user_id]
    return sorted(notifs, key=lambda x: x.get('createdAt', ''), reverse=True)[:limit]

def mark_notification_read(notif_id):
    """Oznacz powiadomienie jako przeczytane - VS"""
    if table:
        try:
            table.update_item(
                Key={'id': notif_id},
                UpdateExpression='SET isRead = :true, readAt = :now',
                ExpressionAttributeValues={
                    ':true': True,
                    ':now': datetime.utcnow().isoformat()
                }
            )
            return True
        except ClientError as e:
            logger.error(f"DynamoDB update error: {e}")
    
    if notif_id in notifications_memory:
        notifications_memory[notif_id]['isRead'] = True
        notifications_memory[notif_id]['readAt'] = datetime.utcnow().isoformat()
    return True

def get_unread_count(user_id):
    """Pobierz liczbę nieprzeczytanych powiadomień - VS"""
    if table:
        try:
            response = table.query(
                IndexName='userId-createdAt-index',
                KeyConditionExpression='userId = :uid',
                FilterExpression='isRead = :false',
                ExpressionAttributeValues={
':uid': user_id,
                    ':false': False
                },
                Select='COUNT'
            )
            return response.get('Count', 0)
        except ClientError as e:
            logger.error(f"DynamoDB count error: {e}")
    
    # Fallback
    return len([n for n in notifications_memory.values() 
                if n.get('userId') == user_id and not n.get('isRead', False)])

# ==============================================
# API Endpoints - VS
# ==============================================

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """Health check endpoint - VS"""
    return jsonify({
        'service': 'notification-service',
        'status': 'healthy',
        'aws_ses': ses_client is not None,
        'dynamodb': table is not None,
        'timestamp': datetime.utcnow().isoformat()
    })

# --- In-App Notifications ---

@app.route('/api/v1/notifications', methods=['GET'])
def get_user_notifications():
    """Pobierz powiadomienia in-app użytkownika - VS"""
    user_id = request.args.get('userId')
    limit = request.args.get('limit', 50, type=int)
    
    if not user_id:
        return jsonify({'error': 'userId is required'}), 400
    
    notifications = get_notifications(user_id, limit)
    return jsonify(notifications)

@app.route('/api/v1/notifications', methods=['POST'])
def create_notification():
    """Utwórz nowe powiadomienie in-app - VS"""
    data = request.get_json()
    
    if not data.get('userId'):
        return jsonify({'error': 'userId is required'}), 400
    
    notification = {
        'id': str(uuid.uuid4()),
        'userId': data.get('userId'),
        'type': data.get('type', 'system'),
        'title': data.get('title', ''),
        'message': data.get('message', ''),
        'data': data.get('data', {}),
        'isRead': False,
        'createdAt': datetime.utcnow().isoformat()
    }
    
    save_notification(notification)
    
    return jsonify(notification), 201

@app.route('/api/v1/notifications/unread-count', methods=['GET'])
def get_unread_notifications_count():
    """Pobierz liczbę nieprzeczytanych powiadomień - VS"""
    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'error': 'userId is required'}), 400
    
    count = get_unread_count(user_id)
    return jsonify({'count': count})

@app.route('/api/v1/notifications/<notif_id>/read', methods=['POST'])
def mark_read(notif_id):
    """Oznacz powiadomienie jako przeczytane - VS"""
    mark_notification_read(notif_id)
    return jsonify({'success': True})

@app.route('/api/v1/notifications/read-all', methods=['POST'])
def mark_all_read():
    """Oznacz wszystkie powiadomienia jako przeczytane - VS"""
    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'error': 'userId is required'}), 400
    
    notifications = get_notifications(user_id, limit=100)
    count = 0
    for notif in notifications:
        if not notif.get('isRead', False):
            mark_notification_read(notif['id'])
            count += 1
    
    return jsonify({'success': True, 'markedAsRead': count})

@app.route('/api/v1/notifications/settings', methods=['GET', 'PUT'])
def notification_settings():
    """Zarządzanie ustawieniami powiadomień użytkownika - VS"""
    user_id = request.args.get('userId', 'default')
    
    default_settings = {
        'emailAppointmentReminder': True,
        'emailVaccinationReminder': True,
        'emailPaymentConfirmation': True,
        'inAppNotifications': True,
        'reminderHoursBefore': 24
    }
    
    if request.method == 'PUT':
        data = request.get_json()
        settings_memory[user_id] = {**default_settings, **data}
        return jsonify(settings_memory[user_id])
    
    return jsonify(settings_memory.get(user_id, default_settings))

# --- Email Notifications via AWS SES ---

@app.route('/api/v1/notifications/send-email', methods=['POST'])
def send_email_notification():
    """
    Wyślij email przez AWS SES
    POST /api/v1/notifications/send-email

{
        "to": "email@example.com",
        "type": "appointment_reminder|vaccination_reminder|payment_confirmation|custom",
        "data": {...},
        "userId": "xxx" (opcjonalnie, do zapisania w historii)
    }
    @author VS
    """
    data = request.get_json()
    
    to_email = data.get('to')
    notif_type = data.get('type')
    notif_data = data.get('data', {})
    user_id = data.get('userId')
    
    if not to_email:
        return jsonify({'error': 'Email address (to) is required'}), 400
    
    # Generuj email w zależności od typu
    if notif_type == 'appointment_reminder':
        html, text = create_appointment_reminder_email(notif_data)
        subject = f"Przypomnienie o wizycie - {notif_data.get('petName', 'PetCareApp')}"
        title = "Przypomnienie o wizycie"
    
    elif notif_type == 'vaccination_reminder':
        html, text = create_vaccination_reminder_email(notif_data)
        subject = f"Przypomnienie o szczepieniu - {notif_data.get('petName', 'PetCareApp')}"
        title = "Przypomnienie o szczepieniu"
    
    elif notif_type == 'payment_confirmation':
        html, text = create_payment_confirmation_email(notif_data)
        subject = "Potwierdzenie płatności - PetCareApp"
        title = "Potwierdzenie płatności"
    
    elif notif_type == 'custom':
        subject = data.get('subject', 'Powiadomienie z PetCareApp')
        html = data.get('html', f"<p>{data.get('message', '')}</p>")
        text = data.get('message', '')
        title = subject
    
    else:
        return jsonify({'error': f'Unknown notification type: {notif_type}'}), 400
    
    # Wyślij email przez SES
    success = send_email_ses(to_email, subject, html, text)
    
    # Zapisz też jako powiadomienie in-app jeśli podano userId
    notification_id = None
    if user_id:
        notification = {
            'id': str(uuid.uuid4()),
            'userId': user_id,
            'type': notif_type,
            'title': title,
            'message': text[:200] if text else '',
            'emailSent': success,
            'emailTo': to_email,
            'isRead': False,
            'createdAt': datetime.utcnow().isoformat()
        }
        save_notification(notification)
        notification_id = notification['id']
    
    if success:
        return jsonify({
            'success': True,
            'message': f'Email sent to {to_email}',
            'notificationId': notification_id
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Failed to send email. Check AWS SES configuration.',
            'notificationId': notification_id
        }), 500

@app.route('/api/v1/notifications/send-appointment-reminder', methods=['POST'])
def send_appointment_reminder():
    """
    Wyślij przypomnienie o wizycie
    POST /api/v1/notifications/send-appointment-reminder
    {
        "email": "...",
        "petName": "...",
        "dateTime": "...",
        "vetName": "...",
        "serviceType": "...",
        "userId": "..." (opcjonalnie)
    }
    @author VS
    """
    data = request.get_json()
    
    if not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
    
    html, text = create_appointment_reminder_email(data)
    subject = f"Przypomnienie o wizycie - {data.get('petName', 'PetCareApp')}"
    
    success = send_email_ses(data['email'], subject, html, text)
    
    # Zapisz in-app notification
    if data.get('userId'):
        notification = {
            'id': str(uuid.uuid4()),
            'userId': data['userId'],
            'type': 'appointment_reminder',
            'title': 'Przypomnienie o wizycie',
            'message': f"Wizyta dla {data.get('petName', 'zwierzęcia')} - {data.get('dateTime', '')}",
            'data': data,
            'emailSent': success,
            'isRead': False,
            'createdAt': datetime.utcnow().isoformat()
        }
        save_notification(notification)
    
    return jsonify({'success': success})

@app.route('/api/v1/notifications/send-vaccination-reminder', methods=['POST'])

def send_vaccination_reminder():
    """Wyślij przypomnienie o szczepieniu - VS"""
    data = request.get_json()
    
    if not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
    
    html, text = create_vaccination_reminder_email(data)
    subject = f"Przypomnienie o szczepieniu - {data.get('petName', 'PetCareApp')}"
    
    success = send_email_ses(data['email'], subject, html, text)
    
    if data.get('userId'):
        notification = {
            'id': str(uuid.uuid4()),
            'userId': data['userId'],
            'type': 'vaccination_reminder',
            'title': 'Przypomnienie o szczepieniu',
            'message': f"Szczepienie {data.get('vaccineName', '')} dla {data.get('petName', '')} wygasa {data.get('expiryDate', '')}",
            'data': data,
            'emailSent': success,
            'isRead': False,
            'createdAt': datetime.utcnow().isoformat()
        }
        save_notification(notification)
    
    return jsonify({'success': success})

@app.route('/api/v1/notifications/send-payment-confirmation', methods=['POST'])
def send_payment_confirmation():
    """Wyślij potwierdzenie płatności - VS"""
    data = request.get_json()
    
    if not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
    
    html, text = create_payment_confirmation_email(data)
    subject = "Potwierdzenie płatności - PetCareApp"
    
    success = send_email_ses(data['email'], subject, html, text)
    
    if data.get('userId'):
        notification = {
            'id': str(uuid.uuid4()),
            'userId': data['userId'],
            'type': 'payment_confirmation',
            'title': 'Płatność potwierdzona',
            'message': f"Płatność {data.get('amount', 0)} PLN została zrealizowana",
            'data': data,
            'emailSent': success,
            'isRead': False,
            'createdAt': datetime.utcnow().isoformat()
        }
        save_notification(notification)
    
    return jsonify({'success': success})

# ==============================================
# Main - VS
# ==============================================

if name == '__main__':
    PORT = int(os.getenv('PORT', 8005))
    DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Starting Notification Service on port {PORT}")
    logger.info(f"AWS SES configured: {ses_client is not None}")
    logger.info(f"DynamoDB connected: {table is not None}")
    
    app.run(host='0.0.0.0', port=PORT, debug=DEBUG)