/**
 * PetCareApp - VetSchedule
 * Harmonogram wizyt weterynarza
 * @author VS
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../context/NotificationContext';
import '../dashboards/DashboardPages.css';
import './VetPages.css';

function VetSchedule() {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('day'); // day, week
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const menuItems = [
        { path: '/dashboard/vet', label: t('dashboard.vet.overview'), icon: '📊', exact: true },
        { path: '/dashboard/vet/patients', label: t('dashboard.vet.patients'), icon: '🐾' },
        { path: '/dashboard/vet/records', label: t('dashboard.vet.records'), icon: '📋' },
        { path: '/dashboard/vet/schedule', label: t('dashboard.vet.schedule'), icon: '📅' },
        { path: '/dashboard/vet/stats', label: t('dashboard.vet.stats'), icon: '📈' }
    ];

    const timeSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

    useEffect(() => { fetchAppointments(); }, [currentDate]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const dateStr = currentDate.toISOString().split('T')[0];
            // Demo data - VS
            setAppointments([
                { id: '1', date: dateStr, time: '09:00', duration: 30, patient: 'Burek', owner: 'Jan Kowalski', type: 'Szczepienie', species: 'dog', status: 'confirmed' },
                { id: '2', date: dateStr, time: '10:00', duration: 60, patient: 'Mruczka', owner: 'Anna Nowak', type: 'Badanie kontrolne', species: 'cat', status: 'confirmed' },
                { id: '3', date: dateStr, time: '11:30', duration: 30, patient: 'Rex', owner: 'Piotr Wiśniewski', type: 'Kontrola po zabiegu', species: 'dog', status: 'confirmed' },
                { id: '4', date: dateStr, time: '13:00', duration: 30, patient: 'Luna', owner: 'Maria Kowalczyk', type: 'Konsultacja', species: 'cat', status: 'pending' },
                { id: '5', date: dateStr, time: '14:30', duration: 30, patient: 'Max', owner: 'Tomasz Zieliński', type: 'Szczepienie', species: 'dog', status: 'confirmed' },
                { id: '6', date: dateStr, time: '16:00', duration: 60, patient: 'Bella', owner: 'Katarzyna Dąbrowska', type: 'Zabieg', species: 'dog', status: 'confirmed' }
            ]);
        } finally { setLoading(false); }
    };

    const navigateDate = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + direction);
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    const getAppointmentForSlot = (time) => appointments.find(a => a.time === time);

    const getSpeciesIcon = (species) => species === 'dog' ? '🐕' : species === 'cat' ? '🐱' : '🐾';

    const formatDate = (date) => {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('pl', options);
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const getWeekDays = () => {
        const days = [];
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }
        return days;
    };

    const todayStats = {
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'completed').length,
        pending: appointments.filter(a => a.status === 'pending').length
    };

    if (loading) return <DashboardLayout menuItems={menuItems} title="Harmonogram" roleColor="#3498db"><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout menuItems={menuItems} title="Harmonogram" roleColor="#3498db">
            <div className="dashboard-page">
                {/* Nagłówek z nawigacją - VS */}
                <div className="calendar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <div className="calendar-nav">
                            <button onClick={() => navigateDate(-1)}>← Poprzedni</button>
                            <button onClick={goToToday} style={{ fontWeight: isToday(currentDate) ? 600 : 400 }}>Dziś</button>
                            <button onClick={() => navigateDate(1)}>Następny →</button>
                        </div>
                        <h2 style={{ margin: 0, textTransform: 'capitalize' }}>{formatDate(currentDate)}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Button variant={view === 'day' ? 'primary' : 'ghost'} size="small" onClick={() => setView('day')}>Dzień</Button>
                        <Button variant={view === 'week' ? 'primary' : 'ghost'} size="small" onClick={() => setView('week')}>Tydzień</Button>
                    </div>
                </div>

                {/* Podsumowanie dnia - VS */}
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                    <Card variant="flat" style={{ flex: 1, padding: 'var(--space-4)', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{todayStats.total}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Wizyty zaplanowane</div>
                    </Card>
                    <Card variant="flat" style={{ flex: 1, padding: 'var(--space-4)', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--success)' }}>{todayStats.completed}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Zakończone</div>
                    </Card>
                    <Card variant="flat" style={{ flex: 1, padding: 'var(--space-4)', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--warning)' }}>{todayStats.pending}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Oczekujące potwierdzenia</div>
                    </Card>
                </div>

                {/* Widok dnia - VS */}
                {view === 'day' && (
                    <Card>
                        <div className="schedule-grid">
                            {timeSlots.map(time => {
                                const appointment = getAppointmentForSlot(time);
                                return (
                                    <React.Fragment key={time}>
                                        <div className="time-label">{time}</div>
                                        <div className={`schedule-slot ${appointment ? 'has-appointment' : ''}`}
                                             onClick={() => appointment ? setSelectedSlot(appointment) : null}
                                             style={{ cursor: appointment ? 'pointer' : 'default' }}>
                                            {appointment && (
                                                <div className="appointment-in-slot">
                                                    <span style={{ fontSize: '1.5rem' }}>{getSpeciesIcon(appointment.species)}</span>
                                                    <div>
                                                        <div className="slot-patient">{appointment.patient}</div>
                                                        <div className="slot-type">{appointment.type} • {appointment.owner}</div>
                                                    </div>
                                                    {appointment.status === 'pending' && (
                                                        <span style={{ marginLeft: 'auto', color: 'var(--warning)' }}>⏳</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* Widok tygodnia - VS */}
                {view === 'week' && (
                    <Card>
                        <div className="week-view">
                            <div className="week-header" />
                            {getWeekDays().map((day, idx) => (
                                <div key={idx} className={`week-header ${isToday(day) ? 'today' : ''}`}
                                     onClick={() => { setCurrentDate(day); setView('day'); }}
                                     style={{ cursor: 'pointer' }}>
                                    <div>{['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'][idx]}</div>
                                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{day.getDate()}</div>
                                </div>
                            ))}
                            
                            {['09:00', '11:00', '13:00', '15:00'].map(time => (
                                <React.Fragment key={time}>
                                    <div className="time-label">{time}</div>
                                    {getWeekDays().map((day, idx) => {
                                        const dayStr = day.toISOString().split('T')[0];
                                        const apt = appointments.find(a => a.date === dayStr && a.time === time);
                                        return (
                                            <div key={idx} className={`schedule-slot ${apt ? 'has-appointment' : ''}`}
                                                 style={{ minHeight: '80px', fontSize: 'var(--text-sm)' }}>
                                                {apt && (
                                                    <div>
                                                        <div>{getSpeciesIcon(apt.species)} {apt.patient}</div>
                                                        <div style={{ color: 'var(--text-muted)' }}>{apt.type}</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Modal szczegółów wizyty - VS */}
                {selectedSlot && (
                    <div className="modal-overlay" onClick={() => setSelectedSlot(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{getSpeciesIcon(selectedSlot.species)} {selectedSlot.patient}</h2>
                                <button className="modal-close" onClick={() => setSelectedSlot(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-list">
                                    <div><span>Godzina:</span><span>{selectedSlot.time}</span></div>
                                    <div><span>Typ wizyty:</span><span>{selectedSlot.type}</span></div>
                                    <div><span>Właściciel:</span><span>{selectedSlot.owner}</span></div>
                                    <div><span>Status:</span><span style={{ color: selectedSlot.status === 'confirmed' ? 'var(--success)' : 'var(--warning)' }}>{selectedSlot.status === 'confirmed' ? '✅ Potwierdzona' : '⏳ Oczekuje'}</span></div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost">📋 Kartoteka</Button>
                                <Button variant="ghost">❌ Anuluj</Button>
                                <Button>▶️ Rozpocznij wizytę</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default VetSchedule;
