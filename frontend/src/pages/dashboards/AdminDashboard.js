/**
 * PetCareApp - Dashboard Administratora
 * Panel zarządzania kliniką
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

function AdminDashboard() {
    const { t } = useTranslation();
    const { user } = useAuth();

    // Menu sidebara - VS
    const menuItems = [
        { path: '/dashboard/admin', label: t('dashboard.admin.overview'), icon: '📊', exact: true },
        { path: '/dashboard/admin/users', label: t('dashboard.admin.users'), icon: '👥' },
        { path: '/dashboard/admin/appointments', label: t('dashboard.admin.appointments'), icon: '📅' },
        { path: '/dashboard/admin/services', label: t('dashboard.admin.services'), icon: '💼' },
        { path: '/dashboard/admin/content', label: t('dashboard.admin.content'), icon: '📝' },
        { path: '/dashboard/admin/reports', label: t('dashboard.admin.reports'), icon: '📈' }
    ];

    // Statystyki kliniki - VS
    const [clinicStats] = useState({
        totalClients: 1250,
        totalPets: 2340,
        totalVets: 12,
        monthlyRevenue: 85000
    });

    const [todayStats] = useState({
        appointments: 45,
        completed: 28,
        cancelled: 2,
        newClients: 5
    });

    const [recentUsers] = useState([
        { id: 1, name: 'Jan Kowalski', email: 'jan@example.com', role: 'client', status: 'active', date: '2024-12-15' },
        { id: 2, name: 'Anna Nowak', email: 'anna@example.com', role: 'client', status: 'active', date: '2024-12-15' },
        { id: 3, name: 'Dr Maria Wiśniewska', email: 'maria@clinic.com', role: 'vet', status: 'active', date: '2024-12-14' }
    ]);

    const [revenueData] = useState([
        { month: 'Lip', value: 72000 },
        { month: 'Sie', value: 68000 },
        { month: 'Wrz', value: 75000 },
        { month: 'Paź', value: 82000 },
        { month: 'Lis', value: 79000 },
        { month: 'Gru', value: 85000 }
    ]);

    const maxRevenue = Math.max(...revenueData.map(d => d.value));

    return (
        <DashboardLayout 
            menuItems={menuItems} 
            title={t('dashboard.admin.welcome')}
            roleColor="#9b59b6"
        >
            <div className="dashboard-page">
                {/* Statystyki główne - VS */}
                <div className="stats-cards">
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#e8f5f1', color: '#2d7a5e' }}>👥</div>
                        <div className="stat-content">
                            <span className="stat-value">{clinicStats.totalClients.toLocaleString()}</span>
                            <span className="stat-label">Klientów</span>
                        </div>
                        <span className="stat-trend positive">+12%</span>
                    </Card>
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}>🐾</div>
                        <div className="stat-content">
                            <span className="stat-value">{clinicStats.totalPets.toLocaleString()}</span>
                            <span className="stat-label">Zwierząt</span>
                        </div>
                        <span className="stat-trend positive">+8%</span>
                    </Card>
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#f3e5f5', color: '#7b1fa2' }}>👨‍⚕️</div>
                        <div className="stat-content">
                            <span className="stat-value">{clinicStats.totalVets}</span>
                            <span className="stat-label">Weterynarzy</span>
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#e8f5e9', color: '#388e3c' }}>💰</div>
                        <div className="stat-content">
                            <span className="stat-value">{(clinicStats.monthlyRevenue / 1000).toFixed(0)}k zł</span>
                            <span className="stat-label">Przychód (miesiąc)</span>
                        </div>
                        <span className="stat-trend positive">+15%</span>
                    </Card>
                </div>

                <div className="dashboard-grid admin-grid">
                    {/* Statystyki dzisiejsze - VS */}
                    <Card title="Dzisiaj" icon={<span>📅</span>}>
                        <div className="today-stats-grid">
                            <div className="today-stat">
                                <span className="today-value">{todayStats.appointments}</span>
                                <span className="today-label">Wszystkie wizyty</span>
                            </div>
                            <div className="today-stat">
                                <span className="today-value text-success">{todayStats.completed}</span>
                                <span className="today-label">Zakończone</span>
                            </div>
                            <div className="today-stat">
                                <span className="today-value text-danger">{todayStats.cancelled}</span>
                                <span className="today-label">Anulowane</span>
                            </div>
                            <div className="today-stat">
                                <span className="today-value text-primary">{todayStats.newClients}</span>
                                <span className="today-label">Nowi klienci</span>
                            </div>
                        </div>
                    </Card>

                    {/* Wykres przychodów - VS */}
                    <Card 
                        title="Przychody" 
                        icon={<span>📈</span>}
                        actions={
                            <Link to="/dashboard/admin/reports">
                                <Button variant="ghost" size="small">Szczegóły</Button>
                            </Link>
                        }
                        className="revenue-card"
                    >
                        <div className="simple-chart">
                            {revenueData.map((item, index) => (
                                <div key={index} className="chart-bar-container">
                                    <div 
                                        className="chart-bar"
                                        style={{ height: `${(item.value / maxRevenue) * 100}%` }}
                                    >
                                        <span className="bar-value">{(item.value / 1000).toFixed(0)}k</span>
                                    </div>
                                    <span className="bar-label">{item.month}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Ostatni użytkownicy - VS */}
                    <Card 
                        title="Nowi użytkownicy" 
                        icon={<span>👥</span>}
                        actions={
                            <Link to="/dashboard/admin/users">
                                <Button variant="ghost" size="small">Zobacz wszystkich</Button>
                            </Link>
                        }
                    >
                        <div className="users-table">
                            <div className="table-header">
                                <span>Użytkownik</span>
                                <span>Rola</span>
                                <span>Status</span>
                            </div>
                            {recentUsers.map(user => (
                                <div key={user.id} className="table-row">
                                    <div className="user-cell">
                                        <div className="user-avatar-table">
                                            {user.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="user-info-table">
                                            <span className="user-name-table">{user.name}</span>
                                            <span className="user-email-table">{user.email}</span>
                                        </div>
                                    </div>
                                    <span className={`role-badge role-${user.role}`}>
                                        {user.role === 'client' ? 'Klient' : 'Weterynarz'}
                                    </span>
                                    <span className={`status-badge status-${user.status}`}>
                                        {user.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Szybkie akcje - VS */}
                    <Card title="Zarządzanie" icon={<span>⚙️</span>}>
                        <div className="admin-actions">
                            <Link to="/dashboard/admin/users" className="admin-action">
                                <span className="action-icon">👤</span>
                                <div className="action-text">
                                    <span className="action-title">Dodaj użytkownika</span>
                                    <span className="action-desc">Klient lub weterynarz</span>
                                </div>
                            </Link>
                            <Link to="/dashboard/admin/services" className="admin-action">
                                <span className="action-icon">💼</span>
                                <div className="action-text">
                                    <span className="action-title">Cennik usług</span>
                                    <span className="action-desc">Edytuj ceny i usługi</span>
                                </div>
                            </Link>
                            <Link to="/dashboard/admin/content" className="admin-action">
                                <span className="action-icon">📢</span>
                                <div className="action-text">
                                    <span className="action-title">Ogłoszenia</span>
                                    <span className="action-desc">Dodaj aktualność</span>
                                </div>
                            </Link>
                            <Link to="/dashboard/admin/reports" className="admin-action">
                                <span className="action-icon">📊</span>
                                <div className="action-text">
                                    <span className="action-title">Raporty</span>
                                    <span className="action-desc">Generuj zestawienia</span>
                                </div>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default AdminDashboard;
