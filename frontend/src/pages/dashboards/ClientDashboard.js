/**
 * PetCareApp - Dashboard Klienta
 * Panel główny dla właścicieli zwierząt
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

function ClientDashboard() {
    const { t } = useTranslation();
    const { user } = useAuth();

    // Menu sidebara - VS
    const menuItems = [
        { path: '/dashboard/client', label: t('dashboard.client.overview'), icon: '📊', exact: true },
        { path: '/dashboard/client/pets', label: t('dashboard.client.pets'), icon: '🐾' },
        { path: '/dashboard/client/appointments', label: t('dashboard.client.appointments'), icon: '📅' },
        { path: '/dashboard/client/notifications', label: t('dashboard.client.notifications'), icon: '🔔', badge: 3 },
        { path: '/dashboard/client/payments', label: t('dashboard.client.payments'), icon: '💳' },
        { path: '/dashboard/client/contact', label: t('dashboard.client.contact'), icon: '✉️' }
    ];

    // Przykładowe dane - VS
    const [stats] = useState({
        pets: 2,
        upcomingAppointments: 1,
        notifications: 3,
        unpaidInvoices: 150
    });

    const [recentPets] = useState([
        { id: 1, name: 'Burek', species: 'dog', breed: 'Labrador', age: '3 lata', avatar: '🐕' },
        { id: 2, name: 'Mruczka', species: 'cat', breed: 'Perski', age: '5 lat', avatar: '🐱' }
    ]);

    const [upcomingAppointments] = useState([
        { id: 1, date: '2024-12-20', time: '14:00', pet: 'Burek', vet: 'dr Anna Kowalska', type: 'Badanie kontrolne', status: 'confirmed' }
    ]);

    const [recentNotifications] = useState([
        { id: 1, type: 'vaccination', message: 'Szczepienie Mruczki za 7 dni', date: '2024-12-13', read: false },
        { id: 2, type: 'appointment', message: 'Przypomnienie o wizycie jutro', date: '2024-12-14', read: false },
        { id: 3, type: 'payment', message: 'Nowa faktura do opłacenia', date: '2024-12-10', read: true }
    ]);

    return (
        <DashboardLayout 
            menuItems={menuItems} 
            title={`${t('dashboard.client.welcome')}, ${user?.firstName || 'Użytkownik'}!`}
            roleColor="#2d7a5e"
        >
            <div className="dashboard-page">
                {/* Statystyki - VS */}
                <div className="stats-cards">
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#e8f5f1', color: '#2d7a5e' }}>🐾</div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.pets}</span>
                            <span className="stat-label">{t('dashboard.client.stats.pets')}</span>
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}>📅</div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.upcomingAppointments}</span>
                            <span className="stat-label">{t('dashboard.client.stats.upcoming')}</span>
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#fff3e0', color: '#f57c00' }}>🔔</div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.notifications}</span>
                            <span className="stat-label">{t('dashboard.client.stats.notifications')}</span>
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#fce4ec', color: '#c2185b' }}>💳</div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.unpaidInvoices} zł</span>
                            <span className="stat-label">{t('dashboard.client.stats.unpaid')}</span>
                        </div>
                    </Card>
                </div>

                {/* Główna zawartość - VS */}
                <div className="dashboard-grid">
                    {/* Moje zwierzęta - VS */}
                    <Card 
                        title={t('dashboard.client.pets')}
                        icon={<span>🐾</span>}
                        actions={
                            <Link to="/dashboard/client/pets">
                                <Button variant="ghost" size="small">Zobacz wszystkie</Button>
                            </Link>
                        }
                    >
                        <div className="pets-list">
                            {recentPets.map(pet => (
                                <div key={pet.id} className="pet-item">
                                    <div className="pet-avatar">{pet.avatar}</div>
                                    <div className="pet-info">
                                        <span className="pet-name">{pet.name}</span>
                                        <span className="pet-details">{pet.breed} • {pet.age}</span>
                                    </div>
                                    <Button variant="ghost" size="small">Szczegóły</Button>
                                </div>
                            ))}
                        </div>
                        <Link to="/dashboard/client/pets" className="add-link">
                            + Dodaj nowe zwierzę
                        </Link>
                    </Card>

                    {/* Nadchodzące wizyty - VS */}
                    <Card 
                        title={t('appointments.upcoming')}
                        icon={<span>📅</span>}
                        actions={
                            <Link to="/dashboard/client/appointments">
                                <Button variant="ghost" size="small">Zobacz wszystkie</Button>
                            </Link>
                        }
                    >
                        {upcomingAppointments.length > 0 ? (
                            <div className="appointments-list">
                                {upcomingAppointments.map(apt => (
                                    <div key={apt.id} className="appointment-item">
                                        <div className="appointment-date">
                                            <span className="date-day">{new Date(apt.date).getDate()}</span>
                                            <span className="date-month">
                                                {new Date(apt.date).toLocaleString('pl', { month: 'short' })}
                                            </span>
                                        </div>
                                        <div className="appointment-info">
                                            <span className="appointment-type">{apt.type}</span>
                                            <span className="appointment-details">
                                                {apt.time} • {apt.pet} • {apt.vet}
                                            </span>
                                        </div>
                                        <span className={`appointment-status status-${apt.status}`}>
                                            {t(`appointments.status.${apt.status}`)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <span className="empty-icon">📅</span>
                                <p>Brak nadchodzących wizyt</p>
                            </div>
                        )}
                        <Link to="/dashboard/client/appointments">
                            <Button variant="outline" fullWidth>
                                {t('appointments.book')}
                            </Button>
                        </Link>
                    </Card>

                    {/* Powiadomienia - VS */}
                    <Card 
                        title={t('notifications.title')}
                        icon={<span>🔔</span>}
                        actions={
                            <Link to="/dashboard/client/notifications">
                                <Button variant="ghost" size="small">Zobacz wszystkie</Button>
                            </Link>
                        }
                    >
                        <div className="notifications-list">
                            {recentNotifications.map(notif => (
                                <div key={notif.id} className={`notification-item ${notif.read ? 'read' : ''}`}>
                                    <div className={`notification-icon type-${notif.type}`}>
                                        {notif.type === 'vaccination' && '💉'}
                                        {notif.type === 'appointment' && '📅'}
                                        {notif.type === 'payment' && '💳'}
                                    </div>
                                    <div className="notification-content">
                                        <p className="notification-message">{notif.message}</p>
                                        <span className="notification-date">{notif.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Szybkie akcje - VS */}
                    <Card title="Szybkie akcje" icon={<span>⚡</span>}>
                        <div className="quick-actions">
                            <Link to="/dashboard/client/appointments" className="quick-action">
                                <span className="action-icon">📅</span>
                                <span className="action-label">Umów wizytę</span>
                            </Link>
                            <Link to="/dashboard/client/pets" className="quick-action">
                                <span className="action-icon">🐾</span>
                                <span className="action-label">Dodaj zwierzę</span>
                            </Link>
                            <Link to="/dashboard/client/payments" className="quick-action">
                                <span className="action-icon">💳</span>
                                <span className="action-label">Opłać fakturę</span>
                            </Link>
                            <Link to="/dashboard/client/contact" className="quick-action">
                                <span className="action-icon">✉️</span>
                                <span className="action-label">Napisz do nas</span>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default ClientDashboard;
