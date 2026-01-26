"""
PetCareApp - Kafka Integration
Producer and Consumer classes for event-driven architecture
@author VS
"""

import json
import logging
import os
from typing import Callable, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Check if kafka-python is available
try:
    from kafka import KafkaProducer, KafkaConsumer
    from kafka.errors import KafkaError
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False
    logger.warning("kafka-python not installed. Kafka functionality disabled.")


class KafkaConfig:
    """Kafka configuration - VS"""
    BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    NOTIFICATION_TOPIC = 'petcareapp.notifications'
    APPOINTMENT_TOPIC = 'petcareapp.appointments'
    AUDIT_TOPIC = 'petcareapp.audit'
    ANALYTICS_TOPIC = 'petcareapp.analytics'
    PAYMENT_TOPIC = 'petcareapp.payments'


class EventProducer:
    """
    Kafka Event Producer
    Sends events to Kafka topics for async processing
    @author VS
    """
    
    _instance = None
    _producer = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not KAFKA_AVAILABLE:
            logger.warning("Kafka not available - events will be logged only")
            return
            
        if self._producer is None:
            try:
                self._producer = KafkaProducer(
                    bootstrap_servers=KafkaConfig.BOOTSTRAP_SERVERS,
                    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                    key_serializer=lambda k: k.encode('utf-8') if k else None,
                    acks='all',
                    retries=3,
                    max_in_flight_requests_per_connection=1
                )
                logger.info(f"Kafka producer connected to {KafkaConfig.BOOTSTRAP_SERVERS}")
            except Exception as e:
                logger.error(f"Failed to create Kafka producer: {e}")
                self._producer = None
    
    def send_event(self, topic: str, event_type: str, data: Dict[str, Any], key: Optional[str] = None) -> bool:
        """Send event to Kafka topic - VS"""
        event = {
            'event_type': event_type,
            'timestamp': datetime.utcnow().isoformat(),
            'data': data
        }
        
        # Log event regardless of Kafka availability
        logger.info(f"Event: {topic} -> {event_type}: {json.dumps(data)[:200]}")
        
        if not KAFKA_AVAILABLE or self._producer is None:
            return False
            
        try:
            future = self._producer.send(topic, value=event, key=key)
            future.get(timeout=10)  # Wait for confirmation
            return True
        except KafkaError as e:
            logger.error(f"Failed to send event to {topic}: {e}")
            return False
    
    # Convenience methods for specific topics - VS
    def send_notification(self, notification_type: str, user_id: str, data: Dict):
        """Send notification event"""
        return self.send_event(
            KafkaConfig.NOTIFICATION_TOPIC,
            notification_type,
            {'user_id': user_id, **data},
            key=user_id
        )
    
    def send_appointment_event(self, event_type: str, appointment_id: str, data: Dict):
        """Send appointment event"""
        return self.send_event(
            KafkaConfig.APPOINTMENT_TOPIC,
            event_type,
            {'appointment_id': appointment_id, **data},
            key=appointment_id
        )
    
    def send_audit_event(self, action: str, user_id: str, resource: str, details: Dict):
        """Send audit event"""
        return self.send_event(
            KafkaConfig.AUDIT_TOPIC,
            'audit_log',
            {
                'action': action,
                'user_id': user_id,
                'resource': resource,
                'details': details
            },
            key=user_id
        )
    
    def send_analytics_event(self, event_name: str, data: Dict):
        """Send analytics event"""
        return self.send_event(
            KafkaConfig.ANALYTICS_TOPIC,
            event_name,
            data
        )
    
    def send_payment_event(self, event_type: str, payment_id: str, data: Dict):
        """Send payment event"""
        return self.send_event(
            KafkaConfig.PAYMENT_TOPIC,
            event_type,
            {'payment_id': payment_id, **data},
            key=payment_id
        )
    
    def close(self):
        """Close producer connection"""
        if self._producer:
            self._producer.flush()
            self._producer.close()
            self._producer = None


class EventConsumer:
    """
    Kafka Event Consumer
    Consumes events from Kafka topics
    @author VS
    """
    
    def __init__(self, topics: list, group_id: str, auto_offset_reset: str = 'earliest'):
        self._consumer = None
        self._running = False
        self._handlers: Dict[str, Callable] = {}
        
        if not KAFKA_AVAILABLE:
            logger.warning("Kafka not available - consumer disabled")
            return
            
        try:
            self._consumer = KafkaConsumer(
                *topics,
                bootstrap_servers=KafkaConfig.BOOTSTRAP_SERVERS,
                group_id=group_id,
                auto_offset_reset=auto_offset_reset,
                value_deserializer=lambda v: json.loads(v.decode('utf-8')),
                enable_auto_commit=True,
                auto_commit_interval_ms=5000
            )
            logger.info(f"Kafka consumer connected, topics: {topics}, group: {group_id}")
        except Exception as e:
            logger.error(f"Failed to create Kafka consumer: {e}")
    
    def register_handler(self, event_type: str, handler: Callable):
        """Register handler for specific event type - VS"""
        self._handlers[event_type] = handler
        logger.info(f"Registered handler for event type: {event_type}")
    
    def start(self):
        """Start consuming events - VS"""
        if not self._consumer:
            logger.warning("Consumer not available")
            return
            
        self._running = True
        logger.info("Starting event consumer...")
        
        try:
            for message in self._consumer:
                if not self._running:
                    break
                    
                try:
                    event = message.value
                    event_type = event.get('event_type')
                    
                    logger.debug(f"Received event: {event_type} from {message.topic}")
                    
                    handler = self._handlers.get(event_type)
                    if handler:
                        handler(event)
                    else:
                        logger.debug(f"No handler for event type: {event_type}")
                        
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    
        except Exception as e:
            logger.error(f"Consumer error: {e}")
        finally:
            self.stop()
    
    def stop(self):
        """Stop consuming events - VS"""
        self._running = False
        if self._consumer:
            self._consumer.close()
            logger.info("Event consumer stopped")


# Singleton producer instance - VS
producer = EventProducer()


# Event type constants - VS
class EventTypes:
    # Notification events
    NOTIFICATION_EMAIL = 'notification.email'
    NOTIFICATION_SMS = 'notification.sms'
    NOTIFICATION_PUSH = 'notification.push'
    
    # Appointment events
    APPOINTMENT_CREATED = 'appointment.created'
    APPOINTMENT_CONFIRMED = 'appointment.confirmed'
    APPOINTMENT_CANCELLED = 'appointment.cancelled'
    APPOINTMENT_COMPLETED = 'appointment.completed'
    APPOINTMENT_REMINDER = 'appointment.reminder'
    
    # User events
    USER_REGISTERED = 'user.registered'
    USER_LOGIN = 'user.login'
    USER_LOGOUT = 'user.logout'
    USER_UPDATED = 'user.updated'
    
    # Payment events
    PAYMENT_INITIATED = 'payment.initiated'
    PAYMENT_COMPLETED = 'payment.completed'
    PAYMENT_FAILED = 'payment.failed'
    PAYMENT_REFUNDED = 'payment.refunded'
    
    # Pet events
    PET_CREATED = 'pet.created'
    PET_UPDATED = 'pet.updated'
    PET_DELETED = 'pet.deleted'
    
    # Medical events
    MEDICAL_RECORD_CREATED = 'medical.record.created'
    VACCINATION_RECORDED = 'medical.vaccination.recorded'
    PRESCRIPTION_CREATED = 'medical.prescription.created'


# Example usage decorator - VS
def publish_event(topic: str, event_type: str):
    """Decorator to automatically publish events after function execution"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            if result:
                producer.send_event(topic, event_type, {'result': str(result)[:500]})
            return result
        return wrapper
    return decorator
