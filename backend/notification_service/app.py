"""
PetCareApp - Notification Service
Serwis powiadomień z AWS SES i DynamoDB
@author VS
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid
import os
import logging
import boto3
from botocore.exceptions import ClientError

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)


AWS_REGION = os.getenv('AWS_REGION', 'eu-north-1')
SES_REGION = os.getenv('SES_REGION', 'eu-north-1')  
TABLE_NAME = 'PetCareApp-Notifications'
SES_FROM_EMAIL = os.getenv('SES_FROM_EMAIL', 'petcareappverify@gmail.com')

# AWS clients - VS
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
    ses_client = boto3.client('ses', region_name=SES_REGION)
    logger.info("AWS SES client initialized")
except Exception as e:
    logger.warning(f"SES not available: {e}")

notifications_db = {}

def send_email_ses(to_email, subject, html_body, text_body=None):
    """Send email via AWS SES - VS"""
    if not ses_client:
        logger.warning("SES not configured")
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
        logger.info(f"Email sent to {to_email}, MessageId: {response['MessageId']}")
        return True
    except ClientError as e:
        logger.error(f"SES error: {e.response['Error']['Message']}")
        return False

def create_appointment_reminder_html(data):
    """Create appointment reminder email - VS"""
    pet_name = data.get('petName', 'Twoje zwierzę')
    date_time = data.get('dateTime', '')
    vet_name = data.get('vetName', 'lekarz')
    service = data.get('serviceType', 'wizyta')
    
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
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1>🐾 PetCareApp</h1>
        </div>
        <div style="padding: 20px;">
            <h2>Przypomnienie o wizycie</h2>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>🐕 Pacjent:</strong> {pet_name}</p>
                <p><strong>📅 Data:</strong> {formatted_date}</p>
                <p><strong>🕐 Godzina:</strong> {formatted_time}</p>
                <p><strong>💉 Usługa:</strong> {service}</p>
                <p><strong>👨‍⚕️ Lekarz:</strong> {vet_name}</p>
            </div>
            <p>Do zobaczenia!</p>
        </div>
    </body>
    </html>
    """
    text = f"Przypomnienie o wizycie\nPacjent: {pet_name}\nData: {formatted_date} {formatted_time}\nLekarz: {vet_name}"
    return html, text

def save_notification(notification):
    if table:
        try:
            table.put_item(Item=notification)
            return True
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    notifications_db[notification['id']] = notification
    return True

def get_notifications(user_id, limit=50):
    if table:
        try:
            response = table.query(
                IndexName='userId-createdAt-index',
                KeyConditionExpression='userId = :uid',
                ExpressionAttributeValues={':uid': user_id},
                ScanIndexForward=False,
                Limit=limit
            )
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    notifs = [n for n in notifications_db.values() if n.get('userId') == user_id]
    return sorted(notifs, key=lambda x: x.get('createdAt', ''), reverse=True)[:limit]

@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({
        'service': 'notification-service',
        'status': 'healthy',
        'ses': ses_client is not None,
        'dynamodb': table is not None
    })

@app.route('/api/v1/notifications', methods=['GET'])
def get_user_notifications():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'error': 'userId required'}), 400
    notifications = get_notifications(user_id)
    return jsonify(notifications)

@app.route('/api/v1/notifications', methods=['POST'])
def create_notification():
    """Create in-app notification - VS"""
    data = request.get_json()
    
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
def get_unread_count():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'count': 0})
    
    notifications = get_notifications(user_id, limit=100)
    count = len([n for n in notifications if not n.get('isRead', False)])
    return jsonify({'count': count})

@app.route('/api/v1/notifications/<notif_id>/read', methods=['POST'])
def mark_read(notif_id):
    if table:
        try:
            table.update_item(
                Key={'id': notif_id},
                UpdateExpression='SET isRead = :true',
                ExpressionAttributeValues={':true': True}
            )
        except ClientError as e:
            logger.error(f"DynamoDB error: {e}")
    
    if notif_id in notifications_db:
        notifications_db[notif_id]['isRead'] = True
    
    return jsonify({'success': True})

@app.route('/api/v1/notifications/read-all', methods=['POST'])
def mark_all_read():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'error': 'userId required'}), 400
    
    notifications = get_notifications(user_id, limit=100)
    for notif in notifications:
        if table:
            try:
                table.update_item(
                    Key={'id': notif['id']},
                    UpdateExpression='SET isRead = :true',
                    ExpressionAttributeValues={':true': True}
                )
            except:
                pass
        if notif['id'] in notifications_db:
            notifications_db[notif['id']]['isRead'] = True
    
    return jsonify({'success': True})

@app.route('/api/v1/notifications/send-email', methods=['POST'])
def send_email():
    """Send email notification via SES - VS"""
    data = request.get_json()
    to_email = data.get('to')
    notif_type = data.get('type')
    notif_data = data.get('data', {})
    
    if not to_email:
        return jsonify({'error': 'Email required'}), 400
    
    if notif_type == 'appointment_reminder':
        html, text = create_appointment_reminder_html(notif_data)
        subject = f"Przypomnienie o wizycie - {notif_data.get('petName', 'PetCareApp')}"
    else:
        subject = data.get('subject', 'Powiadomienie z PetCareApp')
        html = f"<p>{data.get('message', '')}</p>"
        text = data.get('message', '')
    
    success = send_email_ses(to_email, subject, html, text)
    # Save notification record
    if data.get('userId'):
        notification = {
            'id': str(uuid.uuid4()),
            'userId': data['userId'],
            'type': notif_type or 'email',
            'title': subject,
            'message': text[:200],
            'emailSent': success,
            'emailTo': to_email,
            'isRead': False,
            'createdAt': datetime.utcnow().isoformat()
        }
        save_notification(notification)
    
    return jsonify({'success': success})

@app.route('/api/v1/notifications/send-appointment-reminder', methods=['POST'])
def send_appointment_reminder():
    """Send appointment reminder email - VS"""
    data = request.get_json()
    
    if not data.get('email'):
        return jsonify({'error': 'Email required'}), 400
    
    html, text = create_appointment_reminder_html(data)
    subject = f"Przypomnienie o wizycie - {data.get('petName', 'PetCareApp')}"
    success = send_email_ses(data['email'], subject, html, text)
    
    return jsonify({'success': success})

@app.route('/api/v1/notifications/settings', methods=['GET', 'PUT'])
def notification_settings():
    user_id = request.args.get('userId', 'default')
    
    default = {
        'emailAppointmentReminder': True,
        'emailVaccinationReminder': True,
        'emailPaymentConfirmation': True,
        'inAppNotifications': True
    }
    
    if request.method == 'PUT':
        data = request.get_json()
        return jsonify({**default, **data})
    
    return jsonify(default)

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 8005))
    logger.info(f"Starting Notification Service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)