"""
PetCareApp - Notification Consumer
Processes notification events from Kafka
@author VS
"""

import os
import sys
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Add shared to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))

from kafka_events import EventConsumer, KafkaConfig, EventTypes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NotificationProcessor:
    """
    Processes notification events and sends via appropriate channels
    @author VS
    """
    
    def __init__(self):
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@petcareapp.com')
    
    def send_email(self, to_email: str, subject: str, body: str, html_body: str = None):
        """Send email notification - VS"""
        if not self.smtp_user:
            logger.warning(f"SMTP not configured. Would send email to {to_email}: {subject}")
            return True
            
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            msg.attach(MIMEText(body, 'plain'))
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, to_email, msg.as_string())
            
            logger.info(f"Email sent to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    def send_sms(self, phone: str, message: str):
        """Send SMS notification - VS"""
        # TODO: Integrate with SMS gateway (Twilio, etc.)
        logger.info(f"SMS would be sent to {phone}: {message}")
        return True
    
    def send_push(self, user_id: str, title: str, body: str, data: dict = None):
        """Send push notification - VS"""
        # TODO: Integrate with FCM/APNs
        logger.info(f"Push notification would be sent to user {user_id}: {title}")
        return True
    
    def process_email_event(self, event: dict):
        """Process email notification event - VS"""
        data = event.get('data', {})
        self.send_email(
            to_email=data.get('email'),
            subject=data.get('subject'),
            body=data.get('body'),
            html_body=data.get('html_body')
        )
    
    def process_sms_event(self, event: dict):
        """Process SMS notification event - VS"""
        data = event.get('data', {})
        self.send_sms(
            phone=data.get('phone'),
            message=data.get('message')
        )
    
    def process_push_event(self, event: dict):
        """Process push notification event - VS"""
        data = event.get('data', {})
        self.send_push(
            user_id=data.get('user_id'),
            title=data.get('title'),
            body=data.get('body'),
            data=data.get('extra_data')
        )


def main():
    """Main entry point for notification consumer - VS"""
    logger.info("Starting Notification Consumer...")
    
    processor = NotificationProcessor()
    
    consumer = EventConsumer(
        topics=[KafkaConfig.NOTIFICATION_TOPIC],
        group_id='notification-service-consumer'
    )
    
    # Register handlers
    consumer.register_handler(EventTypes.NOTIFICATION_EMAIL, processor.process_email_event)
    consumer.register_handler(EventTypes.NOTIFICATION_SMS, processor.process_sms_event)
    consumer.register_handler(EventTypes.NOTIFICATION_PUSH, processor.process_push_event)
    
    try:
        consumer.start()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        consumer.stop()


if __name__ == '__main__':
    main()
