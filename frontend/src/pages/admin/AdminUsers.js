/**
 * PetCareApp - AdminUsers
 * Zarządzanie użytkownikami systemu
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

function AdminUsers() {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'client', status: 'active' });

    const menuItems = [
        { path: '/dashboard/admin', label: t('dashboard.admin.overview'), icon: '📊', exact: true },
        { path: '/dashboard/admin/users', label: t('dashboard.admin.users'), icon: '👥' },
        { path: '/dashboard/admin/appointments', label: t('dashboard.admin.appointments'), icon: '📅' },
        { path: '/dashboard/admin/services', label: t('dashboard.admin.services'), icon: '💼' },
        { path: '/dashboard/admin/content', label: t('dashboard.admin.content'), icon: '📝' },
        { path: '/dashboard/admin/reports', label: t('dashboard.admin.reports'), icon: '📈' }
    ];

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setUsers([
                { id: '1', firstName: 'Jan', lastName: 'Kowalski', email: 'jan@example.com', phone: '+48123456789', role: 'client', status: 'active', createdAt: '2024-01-15', pets: 2 },
                { id: '2', firstName: 'Anna', lastName: 'Nowak', email: 'anna@example.com', phone: '+48987654321', role: 'client', status: 'active', createdAt: '2024-02-20', pets: 1 },
                { id: '3', firstName: 'Dr Anna', lastName: 'Kowalska', email: 'anna.k@clinic.com', phone: '+48555666777', role: 'vet', status: 'active', createdAt: '2023-06-01', specialization: 'Chirurgia' },
                { id: '4', firstName: 'Dr Jan', lastName: 'Nowak', email: 'jan.n@clinic.com', phone: '+48111222333', role: 'vet', status: 'active', createdAt: '2023-08-15', specialization: 'Dermatologia' },
                { id: '5', firstName: 'Piotr', lastName: 'Wiśniewski', email: 'piotr@example.com', phone: '+48444555666', role: 'client', status: 'inactive', createdAt: '2024-03-10', pets: 0 },
                { id: '6', firstName: 'Maria', lastName: 'Zielińska', email: 'maria@clinic.com', phone: '+48777888999', role: 'admin', status: 'active', createdAt: '2023-01-01' }
            ]);
        } finally { setLoading(false); }
    };

    const handleSave = () => {
        if (!formData.firstName || !formData.email) {
            showNotification('Uzupełnij wymagane pola', 'error');
            return;
        }
        if (editingUser) {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
            showNotification('Użytkownik zaktualizowany', 'success');
        } else {
            setUsers(prev => [...prev, { id: Date.now().toString(), ...formData, createdAt: new Date().toISOString().split('T')[0] }]);
            showNotification('Użytkownik dodany', 'success');
        }
        closeModal();
    };

    const handleDelete = (userId) => {
        if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            showNotification('Użytkownik usunięty', 'success');
        }
    };

    const toggleStatus = (userId) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
        showNotification('Status zmieniony', 'success');
    };

    const openModal = (user = null) => {
        setEditingUser(user);
        setFormData(user || { firstName: '', lastName: '', email: '', phone: '', role: 'client', status: 'active' });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingUser(null); };

    const getRoleLabel = (role) => ({ client: '👤 Klient', vet: '👨‍⚕️ Weterynarz', admin: '👑 Admin', it: '💻 IT' }[role] || role);
    const getStatusBadge = (status) => status === 'active' ? { label: 'Aktywny', class: 'success' } : { label: 'Nieaktywny', class: 'danger' };

    const filtered = users.filter(u => {
        const matchesSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (loading) return <DashboardLayout menuItems={menuItems} title="Użytkownicy" roleColor="#9b59b6"><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout menuItems={menuItems} title="Użytkownicy" roleColor="#9b59b6">
            <div className="dashboard-page">
                <div className="page-header">
                    <div className="search-filter-row">
                        <Input type="text" placeholder="Szukaj użytkownika..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} icon="🔍" className="search-input" />
                        <div className="filter-buttons">
                            {['all', 'client', 'vet', 'admin'].map(r => (
                                <button key={r} className={`filter-btn ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
                                    {r === 'all' ? 'Wszyscy' : getRoleLabel(r)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button onClick={() => openModal()}>+ Dodaj użytkownika</Button>
                </div>

                <Card>
                    <table className="admin-table">
                        <thead>
                            <tr><th>Użytkownik</th><th>Kontakt</th><th>Rola</th><th>Status</th><th>Data rejestracji</th><th>Akcje</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(user => {
                                const status = getStatusBadge(user.status);
                                return (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="avatar">{user.firstName[0]}{user.lastName[0]}</div>
                                                <div><div className="name">{user.firstName} {user.lastName}</div></div>
                                            </div>
                                        </td>
                                        <td><div>{user.email}</div><div className="muted">{user.phone}</div></td>
                                        <td>{getRoleLabel(user.role)}</td>
                                        <td><span className={`status-badge ${status.class}`}>{status.label}</span></td>
                                        <td>{user.createdAt}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <Button variant="ghost" size="small" onClick={() => openModal(user)}>✏️</Button>
                                                <Button variant="ghost" size="small" onClick={() => toggleStatus(user.id)}>{user.status === 'active' ? '🔒' : '🔓'}</Button>
                                                <Button variant="ghost" size="small" onClick={() => handleDelete(user.id)}>🗑️</Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>

                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingUser ? 'Edytuj użytkownika' : 'Nowy użytkownik'}</h2>
                                <button className="modal-close" onClick={closeModal}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <Input label="Imię *" value={formData.firstName} onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} />
                                    <Input label="Nazwisko" value={formData.lastName} onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} />
                                    <Input label="Email *" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                                    <Input label="Telefon" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                                    <div className="form-group">
                                        <label>Rola</label>
                                        <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}>
                                            <option value="client">Klient</option>
                                            <option value="vet">Weterynarz</option>
                                            <option value="admin">Administrator</option>
                                            <option value="it">IT</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                                            <option value="active">Aktywny</option>
                                            <option value="inactive">Nieaktywny</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost" onClick={closeModal}>Anuluj</Button>
                                <Button onClick={handleSave}>Zapisz</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default AdminUsers;
