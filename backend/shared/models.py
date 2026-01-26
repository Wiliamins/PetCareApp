"""
PetCareApp - Base Models
Modele bazowe dla wszystkich encji
@author VS
"""

from datetime import datetime
from typing import Optional, Dict, Any
from dataclasses import dataclass, field, asdict
from enum import Enum
import uuid

class UserRole(Enum):
    """Role użytkowników w systemie - VS"""
    CLIENT = 'client'
    VET = 'vet'
    ADMIN = 'admin'
    IT = 'it'

class AppointmentStatus(Enum):
    """Statusy wizyt - VS"""
    SCHEDULED = 'scheduled'
    CONFIRMED = 'confirmed'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    NO_SHOW = 'no_show'

class PaymentStatus(Enum):
    """Statusy płatności - VS"""
    PENDING = 'pending'
    COMPLETED = 'completed'
    FAILED = 'failed'
    REFUNDED = 'refunded'

class NotificationType(Enum):
    """Typy powiadomień - VS"""
    APPOINTMENT = 'appointment'
    VACCINATION = 'vaccination'
    MEDICATION = 'medication'
    PAYMENT = 'payment'
    SYSTEM = 'system'

@dataclass
class BaseModel:
    """Bazowy model z wspólnymi polami - VS"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    
    def to_dict(self) -> Dict[str, Any]:
        """Konwersja do słownika - VS"""
        return asdict(self)
    
    def update_timestamp(self):
        """Aktualizacja znacznika czasu - VS"""
        self.updated_at = datetime.utcnow().isoformat()

@dataclass
class User(BaseModel):
    """Model użytkownika - VS"""
    email: str = ''
    first_name: str = ''
    last_name: str = ''
    phone: str = ''
    role: str = UserRole.CLIENT.value
    is_active: bool = True
    cognito_sub: Optional[str] = None
    
    # Dodatkowe pola dla weterynarza - VS
    specialization: Optional[str] = None
    license_number: Optional[str] = None

@dataclass
class Pet(BaseModel):
    """Model zwierzęcia - VS"""
    owner_id: str = ''
    name: str = ''
    species: str = ''
    breed: str = ''
    birth_date: Optional[str] = None
    gender: str = ''
    weight: Optional[float] = None
    color: Optional[str] = None
    microchip_number: Optional[str] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None

@dataclass
class Appointment(BaseModel):
    """Model wizyty - VS"""
    pet_id: str = ''
    owner_id: str = ''
    vet_id: str = ''
    date: str = ''
    time: str = ''
    duration_minutes: int = 30
    type: str = ''
    status: str = AppointmentStatus.SCHEDULED.value
    notes: Optional[str] = None
    price: Optional[float] = None

@dataclass
class MedicalRecord(BaseModel):
    """Model rekordu medycznego - VS"""
    pet_id: str = ''
    vet_id: str = ''
    appointment_id: Optional[str] = None
    record_type: str = ''  # diagnosis, procedure, vaccination, prescription
    title: str = ''
    description: str = ''
    attachments: list = field(default_factory=list)

@dataclass
class Vaccination(BaseModel):
    """Model szczepienia - VS"""
    pet_id: str = ''
    vet_id: str = ''
    vaccine_name: str = ''
    batch_number: Optional[str] = None
    administered_date: str = ''
    valid_until: Optional[str] = None
    notes: Optional[str] = None

@dataclass
class Prescription(BaseModel):
    """Model recepty - VS"""
    pet_id: str = ''
    vet_id: str = ''
    medication_name: str = ''
    dosage: str = ''
    frequency: str = ''
    duration: str = ''
    notes: Optional[str] = None

@dataclass
class Payment(BaseModel):
    """Model płatności - VS"""
    owner_id: str = ''
    appointment_id: Optional[str] = None
    amount: float = 0.0
    currency: str = 'PLN'
    status: str = PaymentStatus.PENDING.value
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    invoice_number: Optional[str] = None

@dataclass
class Notification(BaseModel):
    """Model powiadomienia - VS"""
    user_id: str = ''
    type: str = NotificationType.SYSTEM.value
    title: str = ''
    message: str = ''
    is_read: bool = False
    data: Dict[str, Any] = field(default_factory=dict)

@dataclass
class AuditLog(BaseModel):
    """Model logu audytu - VS"""
    user_id: Optional[str] = None
    action: str = ''
    resource_type: str = ''
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)
