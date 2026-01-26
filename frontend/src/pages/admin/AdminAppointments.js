/**
 * PetCareApp - AdminAppointments - Zarządzanie wizytami
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
import '../dashboards/DashboardPages.css';
import './AdminPages.css';

function AdminAppointments() {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('all');

    const menuItems = [
        { path: '/dashboard/admin', label: t('dashboard.admin.overview'), icon: '📊', exact: true },
        { path: '/dashboard/admin/users', label: t('dashboard.admin.users'), icon: '👥' },
        { path: '/dashboard/admin/appointments', label: t('dashboard.admin.appointments'), icon: '📅' },
        { path: '/dashboard/admin/services', label: t('dashboard.admin.services'), icon: '💼' },
        { path: '/dashboard/admin/content', label: t('dashboard.admin.content'), icon: '📝' },
        { path: '/dashboard/admin/reports', label: t('dashboard.admin.reports'), icon: '📈' }
    ];

    useEffect(() => { 
        setLoading(true);
        setTimeout(() => {
            setAppointments([
                { id: '1', date: dateFilter, time: '09:00', patient: 'Burek', owner: 'Jan Kowalski', vet: 'dr Anna Kowalska', type: 'Szczepienie', status: 'confirmed' },
                { id: '2', date: dateFilter, time: '10:00', patient: 'Mruczka', owner: 'Anna Nowak', vet: 'dr Jan Nowak', type: 'Badanie', status: 'pending' },
                { id: '3', date: dateFilter, time: '11:30', patient: 'Rex', owner: 'Piotr Wiśniewski', vet: 'dr Anna Kowalska', type: 'Kontrola', status: 'confirmed' },
                { id: '4', date: dateFilter, time: '14:00', patient: 'Luna', owner: 'Maria Kowalczyk', vet: 'dr Maria Wiśniewska', type: 'Zabieg', status: 'cancelled' }
            ]);
            setLoading(false);
        }, 500);
    }, [dateFilter]);

    const handleStatusChange = (id, newStatus) => {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        showNotification('Status zmieniony', 'success');
    };

    const getStatusBadge = (status) => ({
        confirmed: { label: 'Potwierdzona', class: 'success' },
        pending: { label: 'Oczekuje', class: 'warning' },
        cancelled: { label: 'Anulowana', class: 'danger' },
        completed: { label: 'Zakończona', class: 'success' }
    }[status] || { label: status, class: '' });

    const filtered = appointments.filter(a => statusFilter === 'all' || a.status === statusFilter);

    if (loading) return <DashboardLayout menuItems={menuItems} title="Wizyty" roleColor="#9b59b6"><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout menuItems={menuItems} title="Zarządzanie wizytami" roleColor="#9b59b6">
            <div className="dashboard-page">
                <div className="appointment-filters">
                    <div className="date-filter">
                        <label>Data:</label>
                        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                    </div>
                    <div className="filter-buttons">
                        {['all', 'confirmed', 'pending', 'cancelled'].map(s => (
                            <button key={s} className={`filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                                {s === 'all' ? 'Wszystkie' : getStatusBadge(s).label}
                            </button>
                        ))}
                    </div>
                </div>

                <Card>
                    <table className="admin-table">
                        <thead><tr><th>Godzina</th><th>Pacjent</th><th>Właściciel</th><th>Weterynarz</th><th>Typ</th><th>Status</th><th>Akcje</th></tr></thead>
                        <tbody>
                            {filtered.map(apt => {
                                const status = getStatusBadge(apt.status);
                                return (
                                    <tr key={apt.id}>
                                        <td><strong>{apt.time}</strong></td>
                                        <td>🐾 {apt.patient}</td>
                                        <td>{apt.owner}</td>
                                        <td>{apt.vet}</td>
                                        <td>{apt.type}</td>
                                        <td><span className={`status-badge ${status.class}`}>{status.label}</span></td>
                                        <td>
                                            <select value={apt.status} onChange={e => handleStatusChange(apt.id, e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px' }}>
                                                <option value="pending">Oczekuje</option>
                                                <option value="confirmed">Potwierdzona</option>
                                                <option value="completed">Zakończona</option>
                                                <option value="cancelled">Anulowana</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default AdminAppointments;
