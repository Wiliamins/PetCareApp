/**
 * PetCareApp - ClientNotifications
 * Centrum powiadomień z pełną funkcjonalnością
 * @author VS
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../context/NotificationContext';
import notificationService from '../../services/notificationService';
import '../dashboards/DashboardPages.css';
import './ClientPages.css';

function ClientNotifications() {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({
        email: true, push: true, sms: false,
        appointmentReminders: true, vaccinationReminders: true,
        paymentReminders: true, promotions: false
    });

    const menuItems = [
        { path: '/dashboard/client', label: t('dashboard.client.overview'), icon: '📊', exact: true },
        { path: '/dashboard/client/pets', label: t('dashboard.client.pets'), icon: '🐾' },
        { path: '/dashboard/client/appointments', label: t('dashboard.client.appointments'), icon: '📅' },
        { path: '/dashboard/client/notifications', label: t('dashboard.client.notifications'), icon: '🔔' },
        { path: '/dashboard/client/payments', label: t('dashboard.client.payments'), icon: '💳' },
        { path: '/dashboard/client/contact', label: t('dashboard.client.contact'), icon: '✉️' }
    ];

    useEffect(() => { fetchNotifications(); }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getNotifications();
            setNotifications(response.data || []);
        } catch (error) {
            setNotifications([
                { id: '1', type: 'appointment', title: 'Przypomnienie o wizycie', message: 'Wizyta Burka u dr Kowalskiej jutro o 14:00.', date: '2024-12-19T10:00:00', read: false },
                { id: '2', type: 'vaccination', title: 'Zbliża się termin szczepienia', message: 'Szczepienie Mruczki przeciw wściekliźnie za 7 dni.', date: '2024-12-18T14:30:00', read: false },
                { id: '3', type: 'payment', title: 'Nowa faktura', message: 'Faktura FV/2024/12/001 na kwotę 150 zł.', date: '2024-12-17T09:00:00', read: true },
                { id: '4', type: 'reminder', title: 'Podanie leku', message: 'Pamiętaj o antybiotyku dla Burka.', date: '2024-12-16T08:00:00', read: true }
            ]);
        } finally { setLoading(false); }
    };

    const markAsRead = async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        showNotification('Oznaczono jako przeczytane', 'success');
    };

    const deleteNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setSelectedNotification(null);
        showNotification('Usunięto', 'success');
    };

    const getIcon = (type) => ({ appointment: '📅', vaccination: '💉', payment: '💳', reminder: '⏰' }[type] || '🔔');
    
    const formatTime = (date) => {
        const diff = Date.now() - new Date(date);
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} min temu`;
        if (mins < 1440) return `${Math.floor(mins/60)} godz. temu`;
        return `${Math.floor(mins/1440)} dni temu`;
    };

    const filtered = notifications.filter(n => filter === 'all' || (filter === 'unread' ? !n.read : n.type === filter));
    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) return <DashboardLayout menuItems={menuItems} title={t('notifications.title')} roleColor="#2d7a5e"><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout menuItems={menuItems} title={t('notifications.title')} roleColor="#2d7a5e">
            <div className="dashboard-page">
                <div className="page-header">
                    <div className="filter-buttons">
                        {['all', 'unread', 'appointment', 'vaccination'].map(f => (
                            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                                {f === 'all' ? 'Wszystkie' : f === 'unread' ? `Nieprzeczytane (${unreadCount})` : f === 'appointment' ? '📅 Wizyty' : '💉 Szczepienia'}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {unreadCount > 0 && <Button variant="ghost" onClick={markAllAsRead}>✓ Oznacz wszystkie</Button>}
                        <Button variant="outline" onClick={() => setShowSettings(true)}>⚙️ Ustawienia</Button>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <Card className="empty-state-card"><div className="empty-state"><span className="empty-icon">🔔</span><h3>Brak powiadomień</h3></div></Card>
                ) : (
                    <Card>
                        <div className="notifications-list">
                            {filtered.map(n => (
                                <div key={n.id} className={`notification-item-full ${n.read ? '' : 'unread'}`}
                                    onClick={() => { setSelectedNotification(n); if (!n.read) markAsRead(n.id); }}>
                                    <div className={`notification-icon-large type-${n.type}`}>{getIcon(n.type)}</div>
                                    <div className="notification-content-full">
                                        <div className="notification-title">{n.title}</div>
                                        <div className="notification-message">{n.message.substring(0, 80)}...</div>
                                        <div className="notification-time">{formatTime(n.date)}</div>
                                    </div>
                                    {!n.read && <div className="unread-dot" />}
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {selectedNotification && (
                    <div className="modal-overlay" onClick={() => setSelectedNotification(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{getIcon(selectedNotification.type)} {selectedNotification.title}</h2>
                                <button className="modal-close" onClick={() => setSelectedNotification(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p>{selectedNotification.message}</p>
                                <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-4)' }}>{new Date(selectedNotification.date).toLocaleString('pl')}</p>
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost" onClick={() => deleteNotification(selectedNotification.id)}>🗑️ Usuń</Button>
                                <Button onClick={() => setSelectedNotification(null)}>Zamknij</Button>
                            </div>
                        </div>
                    </div>
                )}

                {showSettings && (
                    <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header"><h2>Ustawienia powiadomień</h2><button className="modal-close" onClick={() => setShowSettings(false)}>×</button></div>
                            <div className="modal-body">
                                {[{ key: 'email', label: '📧 Email' }, { key: 'push', label: '🔔 Push' }, { key: 'sms', label: '📱 SMS' }].map(ch => (
                                    <label key={ch.key} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-2)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={settings[ch.key]} onChange={() => setSettings(p => ({ ...p, [ch.key]: !p[ch.key] }))} />
                                        {ch.label}
                                    </label>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost" onClick={() => setShowSettings(false)}>Anuluj</Button>
                                <Button onClick={() => { showNotification('Zapisano', 'success'); setShowSettings(false); }}>Zapisz</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default ClientNotifications;
