/**
 * PetCareApp - ClientAppointments
 * Pełne zarządzanie wizytami z systemem rezerwacji
 * @author VS
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../context/NotificationContext';
import appointmentService from '../../services/appointmentService';
import petService from '../../services/petService';
import '../dashboards/DashboardPages.css';
import './ClientPages.css';

function ClientAppointments() {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    
    // Stan - VS
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(null);
    
    // Stan rezerwacji - VS
    const [bookingStep, setBookingStep] = useState(1);
    const [pets, setPets] = useState([]);
    const [vets, setVets] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [bookingData, setBookingData] = useState({
        petId: '',
        vetId: '',
        date: '',
        time: '',
        type: 'consultation',
        notes: ''
    });

    const menuItems = [
        { path: '/dashboard/client', label: t('dashboard.client.overview'), icon: '📊', exact: true },
        { path: '/dashboard/client/pets', label: t('dashboard.client.pets'), icon: '🐾' },
        { path: '/dashboard/client/appointments', label: t('dashboard.client.appointments'), icon: '📅' },
        { path: '/dashboard/client/notifications', label: t('dashboard.client.notifications'), icon: '🔔' },
        { path: '/dashboard/client/payments', label: t('dashboard.client.payments'), icon: '💳' },
        { path: '/dashboard/client/contact', label: t('dashboard.client.contact'), icon: '✉️' }
    ];

    const appointmentTypes = [
        { value: 'consultation', label: 'Konsultacja', icon: '💬', price: 100 },
        { value: 'vaccination', label: 'Szczepienie', icon: '💉', price: 80 },
        { value: 'checkup', label: 'Badanie kontrolne', icon: '🩺', price: 120 },
        { value: 'surgery', label: 'Zabieg', icon: '⚕️', price: 300 },
        { value: 'grooming', label: 'Pielęgnacja', icon: '✂️', price: 60 },
        { value: 'emergency', label: 'Nagły przypadek', icon: '🚨', price: 200 }
    ];

    useEffect(() => {
        fetchAppointments();
        fetchPets();
        fetchVets();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await appointmentService.getMyAppointments();
            setAppointments(response.data || []);
        } catch (error) {
            // Demo dane - VS
            setAppointments([
                { id: '1', petId: '1', petName: 'Burek', vetName: 'dr Anna Kowalska', date: '2024-12-20', time: '14:00', type: 'checkup', status: 'confirmed', notes: '' },
                { id: '2', petId: '2', petName: 'Mruczka', vetName: 'dr Jan Nowak', date: '2024-12-22', time: '10:00', type: 'vaccination', status: 'pending', notes: 'Szczepienie przeciw wściekliźnie' },
                { id: '3', petId: '1', petName: 'Burek', vetName: 'dr Anna Kowalska', date: '2024-11-15', time: '09:00', type: 'consultation', status: 'completed', notes: 'Kontrola po zabiegu' },
                { id: '4', petId: '2', petName: 'Mruczka', vetName: 'dr Maria Wiśniewska', date: '2024-10-20', time: '11:00', type: 'grooming', status: 'completed', notes: '' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPets = async () => {
        try {
            const response = await petService.getMyPets();
            setPets(response.data || []);
        } catch (error) {
            setPets([
                { id: '1', name: 'Burek', species: 'dog' },
                { id: '2', name: 'Mruczka', species: 'cat' }
            ]);
        }
    };

    const fetchVets = async () => {
        try {
            const response = await appointmentService.getVeterinarians();
            setVets(response.data || []);
        } catch (error) {
            setVets([
                { id: '1', name: 'dr Anna Kowalska', specialization: 'Chirurgia' },
                { id: '2', name: 'dr Jan Nowak', specialization: 'Dermatologia' },
                { id: '3', name: 'dr Maria Wiśniewska', specialization: 'Kardiologia' }
            ]);
        }
    };

    const fetchAvailableSlots = async (vetId, date) => {
        try {
            const response = await appointmentService.getAvailableSlots(vetId, date);
            setAvailableSlots(response.data || []);
        } catch (error) {
            // Demo sloty - VS
            const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
            const unavailable = ['10:00', '14:00', '15:30'];
            setAvailableSlots(allSlots.map(time => ({
                time,
                available: !unavailable.includes(time)
            })));
        }
    };

    // Filtrowanie wizyt - VS
    const filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (filter) {
            case 'upcoming':
                return aptDate >= today && apt.status !== 'cancelled';
            case 'past':
                return aptDate < today || apt.status === 'completed';
            case 'cancelled':
                return apt.status === 'cancelled';
            default:
                return true;
        }
    }).sort((a, b) => {
        if (filter === 'past') {
            return new Date(b.date) - new Date(a.date);
        }
        return new Date(a.date) - new Date(b.date);
    });

    // Obsługa rezerwacji - VS
    const handleBookingChange = (field, value) => {
        setBookingData(prev => ({ ...prev, [field]: value }));
        
        if (field === 'vetId' && bookingData.date) {
            fetchAvailableSlots(value, bookingData.date);
        }
        if (field === 'date' && bookingData.vetId) {
            fetchAvailableSlots(bookingData.vetId, value);
        }
    };

    const nextStep = () => {
        if (bookingStep === 1 && !bookingData.petId) {
            showNotification('Wybierz zwierzę', 'error');
            return;
        }
        if (bookingStep === 2 && !bookingData.type) {
            showNotification('Wybierz typ wizyty', 'error');
            return;
        }
        if (bookingStep === 3 && (!bookingData.vetId || !bookingData.date || !bookingData.time)) {
            showNotification('Wybierz lekarza, datę i godzinę', 'error');
            return;
        }
        setBookingStep(prev => prev + 1);
    };

    const prevStep = () => {
        setBookingStep(prev => prev - 1);
    };

    const handleBooking = async () => {
        try {
            const pet = pets.find(p => p.id === bookingData.petId);
            const vet = vets.find(v => v.id === bookingData.vetId);
            
            await appointmentService.createAppointment(bookingData);
            
            const newAppointment = {
                id: Date.now().toString(),
                petId: bookingData.petId,
                petName: pet?.name,
                vetName: vet?.name,
                date: bookingData.date,
                time: bookingData.time,
                type: bookingData.type,
                status: 'pending',
                notes: bookingData.notes
            };
            
            setAppointments(prev => [...prev, newAppointment]);
            showNotification(t('appointments.booked'), 'success');
            closeBookingModal();
        } catch (error) {
            showNotification(t('common.error'), 'error');
        }
    };

    const handleCancel = async (appointmentId) => {
        try {
            await appointmentService.cancelAppointment(appointmentId);
            setAppointments(prev => prev.map(apt => 
                apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
            ));
            showNotification(t('appointments.cancelled'), 'success');
            setShowCancelModal(null);
        } catch (error) {
            showNotification(t('common.error'), 'error');
        }
    };

    const openBookingModal = () => {
        setBookingData({
            petId: '',
            vetId: '',
            date: '',
            time: '',
            type: 'consultation',
            notes: ''
        });
        setBookingStep(1);
        setShowBookingModal(true);
    };

    const closeBookingModal = () => {
        setShowBookingModal(false);
        setBookingStep(1);
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            confirmed: { label: 'Potwierdzona', class: 'confirmed' },
            pending: { label: 'Oczekuje', class: 'pending' },
            completed: { label: 'Zakończona', class: 'completed' },
            cancelled: { label: 'Anulowana', class: 'cancelled' }
        };
        return statusMap[status] || { label: status, class: '' };
    };

    const getTypeInfo = (type) => {
        return appointmentTypes.find(t => t.value === type) || { label: type, icon: '📋' };
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return {
            day: date.getDate(),
            month: date.toLocaleString('pl', { month: 'short' }),
            weekday: date.toLocaleString('pl', { weekday: 'long' })
        };
    };

    // Minimalny dzień do rezerwacji (jutro) - VS
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    const minDateStr = minDate.toISOString().split('T')[0];

    if (loading) {
        return (
            <DashboardLayout menuItems={menuItems} title={t('appointments.title')} roleColor="#2d7a5e">
                <LoadingSpinner />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout menuItems={menuItems} title={t('appointments.title')} roleColor="#2d7a5e">
            <div className="dashboard-page">
                {/* Nagłówek - VS */}
                <div className="page-header">
                    <div className="filter-buttons">
                        <button 
                            className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
                            onClick={() => setFilter('upcoming')}
                        >
                            📅 Nadchodzące
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
                            onClick={() => setFilter('past')}
                        >
                            📋 Historia
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
                            onClick={() => setFilter('cancelled')}
                        >
                            ❌ Anulowane
                        </button>
                    </div>
                    <Button onClick={openBookingModal}>
                        + {t('appointments.book')}
                    </Button>
                </div>

                {/* Lista wizyt - VS */}
                {filteredAppointments.length === 0 ? (
                    <Card className="empty-state-card">
                        <div className="empty-state">
                            <span className="empty-icon">📅</span>
                            <h3>{filter === 'upcoming' ? 'Brak nadchodzących wizyt' : 'Brak wizyt'}</h3>
                            <p>Umów pierwszą wizytę dla swojego pupila</p>
                            <Button onClick={openBookingModal}>{t('appointments.book')}</Button>
                        </div>
                    </Card>
                ) : (
                    <div className="appointments-list-page">
                        {filteredAppointments.map(apt => {
                            const dateInfo = formatDate(apt.date);
                            const typeInfo = getTypeInfo(apt.type);
                            const statusInfo = getStatusBadge(apt.status);
                            
                            return (
                                <Card key={apt.id} className="appointment-card" hoverable>
                                    <div className="appointment-date-box">
                                        <span className="date-day">{dateInfo.day}</span>
                                        <span className="date-month">{dateInfo.month}</span>
                                    </div>
                                    
                                    <div className="appointment-info">
                                        <div className="appointment-type">
                                            {typeInfo.icon} {typeInfo.label}
                                        </div>
                                        <div className="appointment-meta">
                                            <span>🕐 {apt.time}</span>
                                            <span>🐾 {apt.petName}</span>
                                            <span>👨‍⚕️ {apt.vetName}</span>
                                        </div>
                                        {apt.notes && (
                                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                                                📝 {apt.notes}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <span className={`appointment-status-badge ${statusInfo.class}`}>
                                            {statusInfo.label}
                                        </span>
                                        
                                        {(apt.status === 'confirmed' || apt.status === 'pending') && (
                                            <Button 
                                                variant="ghost" 
                                                size="small"
                                                onClick={() => setShowCancelModal(apt.id)}
                                            >
                                                Anuluj
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Modal rezerwacji - VS */}
                {showBookingModal && (
                    <div className="modal-overlay" onClick={closeBookingModal}>
                        <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{t('appointments.book')}</h2>
                                <button className="modal-close" onClick={closeBookingModal}>×</button>
                            </div>
                            
                            {/* Kroki rezerwacji - VS */}
                            <div className="booking-steps">
                                <div className={`step ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`}>
                                    <span className="step-number">{bookingStep > 1 ? '✓' : '1'}</span>
                                    <span>Zwierzę</span>
                                </div>
                                <div className="step-connector" />
                                <div className={`step ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}`}>
                                    <span className="step-number">{bookingStep > 2 ? '✓' : '2'}</span>
                                    <span>Typ wizyty</span>
                                </div>
                                <div className="step-connector" />
                                <div className={`step ${bookingStep >= 3 ? 'active' : ''} ${bookingStep > 3 ? 'completed' : ''}`}>
                                    <span className="step-number">{bookingStep > 3 ? '✓' : '3'}</span>
                                    <span>Termin</span>
                                </div>
                                <div className="step-connector" />
                                <div className={`step ${bookingStep >= 4 ? 'active' : ''}`}>
                                    <span className="step-number">4</span>
                                    <span>Potwierdzenie</span>
                                </div>
                            </div>
                            
                            <div className="modal-body">
                                {/* Krok 1: Wybór zwierzęcia - VS */}
                                {bookingStep === 1 && (
                                    <div>
                                        <h3 style={{ marginBottom: 'var(--space-4)' }}>Wybierz zwierzę</h3>
                                        <div className="pets-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                                            {pets.map(pet => (
                                                <Card 
                                                    key={pet.id}
                                                    className={`pet-select-card ${bookingData.petId === pet.id ? 'selected' : ''}`}
                                                    onClick={() => handleBookingChange('petId', pet.id)}
                                                    hoverable
                                                    style={{ 
                                                        cursor: 'pointer',
                                                        border: bookingData.petId === pet.id ? '2px solid var(--primary)' : '1px solid var(--border-color)'
                                                    }}
                                                >
                                                    <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                                                        <span style={{ fontSize: '3rem' }}>
                                                            {pet.species === 'dog' ? '🐕' : '🐱'}
                                                        </span>
                                                        <h4 style={{ margin: 'var(--space-2) 0 0' }}>{pet.name}</h4>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Krok 2: Typ wizyty - VS */}
                                {bookingStep === 2 && (
                                    <div>
                                        <h3 style={{ marginBottom: 'var(--space-4)' }}>Wybierz typ wizyty</h3>
                                        <div className="pets-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                                            {appointmentTypes.map(type => (
                                                <Card 
                                                    key={type.value}
                                                    onClick={() => handleBookingChange('type', type.value)}
                                                    hoverable
                                                    style={{ 
                                                        cursor: 'pointer',
                                                        border: bookingData.type === type.value ? '2px solid var(--primary)' : '1px solid var(--border-color)'
                                                    }}
                                                >
                                                    <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                                                        <span style={{ fontSize: '2rem' }}>{type.icon}</span>
                                                        <h4 style={{ margin: 'var(--space-2) 0' }}>{type.label}</h4>
                                                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{type.price} zł</span>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Krok 3: Wybór terminu - VS */}
                                {bookingStep === 3 && (
                                    <div>
                                        <h3 style={{ marginBottom: 'var(--space-4)' }}>Wybierz termin</h3>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Lekarz</label>
                                                <select 
                                                    value={bookingData.vetId}
                                                    onChange={(e) => handleBookingChange('vetId', e.target.value)}
                                                >
                                                    <option value="">Wybierz lekarza...</option>
                                                    {vets.map(vet => (
                                                        <option key={vet.id} value={vet.id}>
                                                            {vet.name} - {vet.specialization}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <Input
                                                label="Data"
                                                type="date"
                                                value={bookingData.date}
                                                onChange={(e) => handleBookingChange('date', e.target.value)}
                                                min={minDateStr}
                                            />
                                        </div>
                                        
                                        {bookingData.vetId && bookingData.date && (
                                            <div style={{ marginTop: 'var(--space-6)' }}>
                                                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
                                                    Dostępne godziny
                                                </label>
                                                <div className="time-slots-grid">
                                                    {availableSlots.map(slot => (
                                                        <button
                                                            key={slot.time}
                                                            className={`time-slot ${!slot.available ? 'unavailable' : ''} ${bookingData.time === slot.time ? 'selected' : ''}`}
                                                            onClick={() => slot.available && handleBookingChange('time', slot.time)}
                                                            disabled={!slot.available}
                                                        >
                                                            {slot.time}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                                            <label>Dodatkowe uwagi (opcjonalnie)</label>
                                            <textarea
                                                value={bookingData.notes}
                                                onChange={(e) => handleBookingChange('notes', e.target.value)}
                                                rows={3}
                                                placeholder="Opisz objawy lub cel wizyty..."
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                {/* Krok 4: Podsumowanie - VS */}
                                {bookingStep === 4 && (
                                    <div>
                                        <h3 style={{ marginBottom: 'var(--space-4)' }}>Podsumowanie rezerwacji</h3>
                                        <Card variant="flat">
                                            <div style={{ padding: 'var(--space-4)' }}>
                                                <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Zwierzę:</span>
                                                        <span style={{ fontWeight: 500 }}>
                                                            {pets.find(p => p.id === bookingData.petId)?.name}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Typ wizyty:</span>
                                                        <span style={{ fontWeight: 500 }}>
                                                            {getTypeInfo(bookingData.type).icon} {getTypeInfo(bookingData.type).label}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Lekarz:</span>
                                                        <span style={{ fontWeight: 500 }}>
                                                            {vets.find(v => v.id === bookingData.vetId)?.name}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Data i godzina:</span>
                                                        <span style={{ fontWeight: 500 }}>
                                                            {bookingData.date} o {bookingData.time}
                                                        </span>
                                                    </div>
                                                    {bookingData.notes && (
                                                        <div>
                                                            <span style={{ color: 'var(--text-muted)' }}>Uwagi:</span>
                                                            <p style={{ margin: 'var(--space-1) 0 0', fontStyle: 'italic' }}>
                                                                {bookingData.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 'var(--space-2) 0' }} />
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ fontWeight: 600 }}>Szacunkowy koszt:</span>
                                                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 'var(--text-lg)' }}>
                                                            {getTypeInfo(bookingData.type).price} zł
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </div>
                            
                            <div className="modal-footer">
                                {bookingStep > 1 && (
                                    <Button variant="ghost" onClick={prevStep}>
                                        ← Wstecz
                                    </Button>
                                )}
                                <div style={{ flex: 1 }} />
                                {bookingStep < 4 ? (
                                    <Button onClick={nextStep}>
                                        Dalej →
                                    </Button>
                                ) : (
                                    <Button onClick={handleBooking}>
                                        ✓ Potwierdź rezerwację
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal anulowania - VS */}
                {showCancelModal && (
                    <div className="modal-overlay" onClick={() => setShowCancelModal(null)}>
                        <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Anuluj wizytę</h2>
                            </div>
                            <div className="modal-body">
                                <p>Czy na pewno chcesz anulować tę wizytę? Tej operacji nie można cofnąć.</p>
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost" onClick={() => setShowCancelModal(null)}>
                                    Nie, zachowaj
                                </Button>
                                <Button variant="danger" onClick={() => handleCancel(showCancelModal)}>
                                    Tak, anuluj
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default ClientAppointments;
