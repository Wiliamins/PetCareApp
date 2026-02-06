"""
PetCareApp - Email Service with AWS SES
Sends transactional emails via AWS SES or SMTP fallback
@author VS
"""

import os
import sys
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# AWS SES
try:
    import boto3
    from botocore.exceptions import ClientError
    AWS_AVAILABLE = True
except ImportError:
    AWS_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailService:
    """
    Email Service supporting AWS SES 
    @author VS
    """
    
    def __init__(self):
        self.mode = 'ses' if self._check_ses() else 'smtp' if self._check_smtp() else 'log'
        logger.info(f"Email service initialized in {self.mode} mode")
    
    def _check_ses(self):
        """Check if AWS SES is available"""
        if not AWS_AVAILABLE:
            return False
        if os.getenv('APP_ENV') != 'production':
            return False
        try:
            self.ses_client = boto3.client('ses', region_name=os.getenv('AWS_REGION', 'eu-north-1'))
            return True
        except Exception:
            return False
    
    def send_email(self, to_email: str, subject: str, body_text: str, body_html: str = None, from_email: str = None):
        """
        Send email via available method
        """
        from_email = from_email or os.getenv('FROM_EMAIL', 'petcareappverify@gmail.com')
        
        if self.mode == 'ses':
            return self._send_ses(to_email, subject, body_text, body_html, from_email)
        elif self.mode == 'smtp':
            return self._send_smtp(to_email, subject, body_text, body_html, from_email)
        else:
            return self._log_email(to_email, subject, body_text)
    
    def _send_ses(self, to_email, subject, body_text, body_html, from_email):
        """Send via AWS SES"""
        try:
            body = {'Text': {'Data': body_text, 'Charset': 'UTF-8'}}
            if body_html:
                body['Html'] = {'Data': body_html, 'Charset': 'UTF-8'}
            
            response = self.ses_client.send_email(
                Source=from_email,
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                    'Body': body
                }
            )
            logger.info(f"SES email sent to {to_email}, MessageId: {response['MessageId']}")
            return {'success': True, 'message_id': response['MessageId']}
        except ClientError as e:
            logger.error(f"SES error: {e}")
            return {'success': False, 'error': str(e)}
    
    def _send_smtp(self, to_email, subject, body_text, body_html, from_email):
        """Send via SMTP"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = from_email
            msg['To'] = to_email
            
            msg.attach(MIMEText(body_text, 'plain', 'utf-8'))
            if body_html:
                msg.attach(MIMEText(body_html, 'html', 'utf-8'))
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(from_email, to_email, msg.as_string())
            
            logger.info(f"SMTP email sent to {to_email}")
            return {'success': True, 'message_id': f"smtp_{datetime.now().timestamp()}"}
        except Exception as e:
            logger.error(f"SMTP error: {e}")
            return {'success': False, 'error': str(e)}
    
    def _log_email(self, to_email, subject, body_text):
        """Log email (for development)"""
        logger.info(f"""
╔══════════════════════════════════════════════════════════════════╗
║                        EMAIL (LOG MODE)                          ║
╠══════════════════════════════════════════════════════════════════╣
║ To: {to_email[:50]}
║ Subject: {subject[:50]}
║ Body: {body_text[:100]}...
╚══════════════════════════════════════════════════════════════════╝
        """)
        return {'success': True, 'message_id': 'logged', 'mode': 'log'}


# Email Templates
class EmailTemplates:
    """Pre-built email templates - VS"""
    
    @staticmethod
    def welcome(user_name: str, login_url: str):
        subject = "Witamy w PetCareApp! 🐾"
        body_text = f"""
Cześć {user_name}!

Dziękujemy za rejestrację w PetCareApp - systemie zarządzania opieką weterynaryjną.

Twoje konto jest już aktywne. Możesz się zalogować tutaj:
{login_url}

Co możesz zrobić w PetCareApp:
- Dodawać profile swoich zwierząt
- Rezerwować wizyty u weterynarza
- Przeglądać historię medyczną
- Otrzymywać przypomnienia o szczepieniach

W razie pytań, skontaktuj się z nami.

Pozdrawiamy,
Zespół PetCareApp
        """
        body_html = f"""
<!DOCTYPE html>
<html>
<head><style>
    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
    .header {{ background: #3498db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
    .button {{ display: inline-block; background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
</style></head>
<body>
<div class="container">
    <div class="header">
        <h1>🐾 Witamy w PetCareApp!</h1>
    </div>
    <div class="content">
        <p>Cześć <strong>{user_name}</strong>!</p>
        <p>Dziękujemy za rejestrację w PetCareApp - systemie zarządzania opieką weterynaryjną.</p>
        <p>Twoje konto jest już aktywne:</p>
        <a href="{login_url}" class="button">Zaloguj się</a>
        <h3>Co możesz zrobić:</h3>
        <ul>
            <li>🐕 Dodawać profile swoich zwierząt</li>
            <li>📅 Rezerwować wizyty u weterynarza</li>
            <li>📋 Przeglądać historię medyczną</li>
            <li>💉 Otrzymywać przypomnienia o szczepieniach</li>
        </ul>
    </div>
    <div class="footer">
        <p>Pozdrawiamy, Zespół PetCareApp</p>
    </div>
</div>
</body>
</html>
        """
        return subject, body_text, body_html
    
    @staticmethod
    def appointment_confirmation(user_name: str, pet_name: str, date: str, time: str, vet_name: str, clinic_address: str):
        subject = f"Potwierdzenie wizyty - {pet_name} 📅"
        body_text = f"""
Cześć {user_name}!

Twoja wizyta została potwierdzona:

🐾 Pacjent: {pet_name}
📅 Data: {date}
🕐 Godzina: {time}
👨‍⚕️ Weterynarz: {vet_name}
📍 Adres: {clinic_address}

Pamiętaj, aby:
- Przyjść 10 minut wcześniej
- Zabrać książeczkę zdrowia zwierzęcia
- Nie karmić zwierzęcia 2h przed wizytą (jeśli planowane jest badanie)

Do zobaczenia!
Zespół PetCareApp
        """
        body_html = f"""
<!DOCTYPE html>
<html>
<head><style>
    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
    .header {{ background: #2ecc71; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
    .info-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2ecc71; }}
    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
</style></head>
<body>
<div class="container">
    <div class="header">
        <h1>✅ Wizyta potwierdzona!</h1>
    </div>
    <div class="content">
        <p>Cześć <strong>{user_name}</strong>!</p>
        <div class="info-box">
            <p>🐾 <strong>Pacjent:</strong> {pet_name}</p>
            <p>📅 <strong>Data:</strong> {date}</p>
            <p>🕐 <strong>Godzina:</strong> {time}</p>
            <p>👨‍⚕️ <strong>Weterynarz:</strong> {vet_name}</p>
            <p>📍 <strong>Adres:</strong> {clinic_address}</p>
        </div>
        <h3>Pamiętaj:</h3>
        <ul>
            <li>Przyjdź 10 minut wcześniej</li>
            <li>Zabierz książeczkę zdrowia</li>
            <li>Nie karm zwierzęcia 2h przed (jeśli badanie)</li>
        </ul>
    </div>
    <div class="footer">
        <p>Do zobaczenia! Zespół PetCareApp</p>
    </div>
</div>
</body>
</html>
        """
        return subject, body_text, body_html
    
    @staticmethod
    def payment_confirmation(user_name: str, invoice_number: str, amount: float, currency: str = 'PLN'):
        subject = f"Potwierdzenie płatności - {invoice_number} 💳"
        body_text = f"""
Cześć {user_name}!

Dziękujemy za płatność!

💰 Kwota: {amount} {currency}
📄 Faktura: {invoice_number}
✅ Status: Opłacona

Fakturę możesz pobrać w aplikacji PetCareApp.

Pozdrawiamy,
Zespół PetCareApp
        """
        body_html = f"""
<!DOCTYPE html>
<html>
<head><style>
    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
    .header {{ background: #9b59b6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
    .amount {{ font-size: 32px; font-weight: bold; color: #2ecc71; text-align: center; margin: 20px 0; }}
    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
</style></head>
<body>
<div class="container">
    <div class="header">
        <h1>💳 Płatność otrzymana!</h1>
    </div>
    <div class="content">
        <p>Cześć <strong>{user_name}</strong>!</p>
        <p>Dziękujemy za płatność:</p>
        <div class="amount">{amount} {currency}</div>
        <p><strong>Faktura:</strong> {invoice_number}</p>
        <p><strong>Status:</strong> ✅ Opłacona</p>
    </div>
    <div class="footer">
        <p>Pozdrawiamy, Zespół PetCareApp</p>
    </div>
</div>
</body>
</html>
        """
        return subject, body_text, body_html
    
    @staticmethod
    def vaccination_reminder(user_name: str, pet_name: str, vaccine_name: str, due_date: str):
        subject = f"Przypomnienie o szczepieniu - {pet_name} 💉"
        body_text = f"""
Cześć {user_name}!

Przypominamy o zbliżającym się szczepieniu:

🐾 Zwierzę: {pet_name}
💉 Szczepienie: {vaccine_name}
📅 Termin: {due_date}

Zarezerwuj wizytę w aplikacji PetCareApp.

Pozdrawiamy,
Zespół PetCareApp
        """
        return subject, body_text, None


# Singleton instance
email_service = EmailService()
