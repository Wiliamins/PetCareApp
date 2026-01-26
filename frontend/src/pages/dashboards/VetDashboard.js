/**
 * PetCareApp - Dashboard Weterynarza
 * Panel główny dla weterynarzy
 * @author VS
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import './DashboardPages.css';

function VetDashboard() {
    const { t } = useTranslation();
    const { user } = useAuth();

    // Menu sidebara - VS
    const menuItems = [
        { path: '/dashboard/vet', label: t('dashboard.vet.overview'), icon: '📊', exact: true },
        { path: '/dashboard/vet/patients', label: t('dashboard.vet.patients'), icon: '🐾' },
        { path: '/dashboard/vet/records', label: t('dashboard.vet.records'), icon: '📋' },
        { path: '/dashboard/vet/schedule', label: t('dashboard.vet.schedule'), icon: '📅' },
        { path: '/dashboard/vet/stats', label: t('dashboard.vet.stats'), icon: '📈' }
    ];

    // Dane dzisiejszego dnia - VS
    const [todayStats] = useState({
        totalAppointments: 8,
        completed: 3,
        upcoming: 5,
        emergencies: 0
    });

    const [todayAppointments] = useState([
        { id: 1, time: '09:00', pet: 'Burek', owner: 'Jan Kowalski', type: 'Szczepienie', status: 'completed', species: '🐕' },
        { id: 2, time: '10:00', pet: 'Mruczka', owner: 'Anna Nowak', type: 'Badanie kontrolne', status: 'completed', species: '🐱' },
        { id: 3, time: '11:00', pet: 'Rex', owner: 'Piotr Wiśniewski', type: 'Zabieg', status: 'completed', species: '🐕' },
        { id: 4, time: '13:00', pet: 'Luna', owner: 'Maria Kowalczyk', type: 'Konsultacja', status: 'current', species: '🐱' },
        { id: 5, time: '14:00', pet: 'Max', owner: 'Tomasz Zieliński', type: 'Szczepienie', status: 'upcoming', species: '🐕' },
        { id: 6, time: '15:00', pet: 'Bella', owner: 'Katarzyna Dąbrowska', type: 'Badanie', status: 'upcoming', species: '🐕' }
    ]);

    const [recentPatients] = useState([
        { id: 1, name: 'Burek', owner: 'Jan Kowalski', lastVisit: '2024-12-15', condition: 'Zdrowy', species: '🐕' },
        { id: 2, name: 'Mruczka', owner: 'Anna Nowak', lastVisit: '2024-12-15', condition: 'W leczeniu', species: '🐱' },
        { id: 3, name: 'Rex', owner: 'Piotr Wiśniewski', lastVisit: '2024-12-14', condition: 'Rekonwalescencja', species: '🐕' }
    ]);

    const currentTime = new Date().toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit' });
    const currentAppointment = todayAppointments.find(a => a.status === 'current');
    const nextAppointment = todayAppointments.find(a => a.status === 'upcoming');

    return (
        <DashboardLayout 
            menuItems={menuItems} 
            title={`${t('dashboard.vet.welcome')} ${user?.lastName || ''}!`}
            roleColor="#3498db"
        >
            <div className="dashboard-page">
                {/* Statystyki dnia - VS */}
                <div className="stats-cards">
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}>📅</div>
                        <div className="stat-content">
                            <span className="stat-value">{todayStats.totalAppointments}</span>
                            <span className="stat-label">Wizyty dzisiaj</span>
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#e8f5e9', color: '#388e3c' }}>✅</div>
                        <div className="stat-content">
                            <span className="stat-value">{todayStats.completed}</span>
                            <span className="stat-label">Zakończone</span>
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#fff3e0', color: '#f57c00' }}>⏰</div>
                        <div className="stat-content">
                            <span className="stat-value">{todayStats.upcoming}</span>
                            <span className="stat-label">Oczekujące</span>
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#ffebee', color: '#d32f2f' }}>🚨</div>
                        <div className="stat-content">
                            <span className="stat-value">{todayStats.emergencies}</span>
                            <span className="stat-label">Nagłe przypadki</span>
                        </div>
                    </Card>
                </div>

                <div className="dashboard-grid vet-grid">
                    {/* Aktualny/Następny pacjent - VS */}
                    <div className="current-patient-section">
                        {currentAppointment && (
                            <Card className="current-patient-card" variant="elevated">
                                <div className="current-badge">Teraz</div>
                                <div className="patient-header">
                                    <span className="patient-avatar">{currentAppointment.species}</span>
                                    <div className="patient-info">
                                        <h3 className="patient-name">{currentAppointment.pet}</h3>
                                        <p className="patient-owner">Właściciel: {currentAppointment.owner}</p>
                                    </div>
                                </div>
                                <div className="patient-details">
                                    <span className="detail-item">
                                        <span className="detail-icon">📋</span>
                                        {currentAppointment.type}
                                    </span>
                                    <span className="detail-item">
                                        <span className="detail-icon">🕐</span>
                                        {currentAppointment.time}
                                    </span>
                                </div>
                                <div className="patient-actions">
                                    <Button variant="primary" fullWidth>Rozpocznij wizytę</Button>
                                </div>
                            </Card>
                        )}

                        {nextAppointment && (
                            <Card className="next-patient-card">
                                <div className="next-badge">Następny</div>
                                <div className="patient-mini">
                                    <span className="patient-avatar-mini">{nextAppointment.species}</span>
                                    <div>
                                        <p className="patient-name-mini">{nextAppointment.pet}</p>
                                        <p className="patient-time">{nextAppointment.time} • {nextAppointment.type}</p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Harmonogram dnia - VS */}
                    <Card 
                        title={t('dashboard.vet.todayAppointments')}
                        icon={<span>📅</span>}
                        actions={
                            <Link to="/dashboard/vet/schedule">
                                <Button variant="ghost" size="small">Pełny harmonogram</Button>
                            </Link>
                        }
                        className="schedule-card"
                    >
                        <div className="schedule-timeline">
                            {todayAppointments.map(apt => (
                                <div key={apt.id} className={`timeline-item status-${apt.status}`}>
                                    <div className="timeline-time">{apt.time}</div>
                                    <div className="timeline-marker">
                                        <div className="marker-dot"></div>
                                        <div className="marker-line"></div>
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <span className="timeline-pet">{apt.species} {apt.pet}</span>
                                            <span className={`timeline-status status-badge-${apt.status}`}>
                                                {apt.status === 'completed' && '✓'}
                                                {apt.status === 'current' && '●'}
                                                {apt.status === 'upcoming' && '○'}
                                            </span>
                                        </div>
                                        <p className="timeline-type">{apt.type}</p>
                                        <p className="timeline-owner">{apt.owner}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Ostatni pacjenci - VS */}
                    <Card 
                        title="Ostatni pacjenci"
                        icon={<span>🐾</span>}
                        actions={
                            <Link to="/dashboard/vet/patients">
                                <Button variant="ghost" size="small">Zobacz wszystkich</Button>
                            </Link>
                        }
                    >
                        <div className="patients-list">
                            {recentPatients.map(patient => (
                                <div key={patient.id} className="patient-row">
                                    <span className="patient-avatar-sm">{patient.species}</span>
                                    <div className="patient-row-info">
                                        <span className="patient-row-name">{patient.name}</span>
                                        <span className="patient-row-owner">{patient.owner}</span>
                                    </div>
                                    <div className="patient-row-meta">
                                        <span className={`condition-badge condition-${patient.condition.toLowerCase().replace(' ', '-')}`}>
                                            {patient.condition}
                                        </span>
                                        <span className="last-visit">{patient.lastVisit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Szybkie akcje - VS */}
                    <Card title="Szybkie akcje" icon={<span>⚡</span>}>
                        <div className="quick-actions">
                            <button className="quick-action">
                                <span className="action-icon">📋</span>
                                <span className="action-label">Nowy rekord</span>
                            </button>
                            <button className="quick-action">
                                <span className="action-icon">💉</span>
                                <span className="action-label">Szczepienie</span>
                            </button>
                            <button className="quick-action">
                                <span className="action-icon">💊</span>
                                <span className="action-label">Recepta</span>
                            </button>
                            <button className="quick-action">
                                <span className="action-icon">🔬</span>
                                <span className="action-label">Badanie</span>
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default VetDashboard;
