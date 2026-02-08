/**
 * PetCareApp - Kontekst powiadomień
 * @author VS
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

export const NOTIFICATION_TYPES = { SUCCESS: 'success', ERROR: 'error', WARNING: 'warning', INFO: 'info' };

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [systemNotifications, setSystemNotifications] = useState([]);

    const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const addNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
        const id = generateId();
        setNotifications(prev => [...prev, { id, message, type, timestamp: new Date() }]);
        if (duration > 0) setTimeout(() => removeNotification(id), duration);
        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const showNotification = useCallback((message, type = 'info') => {
        return addNotification(message, NOTIFICATION_TYPES[type.toUpperCase()] || NOTIFICATION_TYPES.INFO);
    }, [addNotification]);

    const showSuccess = useCallback((message, duration) => addNotification(message, NOTIFICATION_TYPES.SUCCESS, duration), [addNotification]);
    const showError = useCallback((message, duration = 7000) => addNotification(message, NOTIFICATION_TYPES.ERROR, duration), [addNotification]);
    const showWarning = useCallback((message, duration) => addNotification(message, NOTIFICATION_TYPES.WARNING, duration), [addNotification]);
    const showInfo = useCallback((message, duration) => addNotification(message, NOTIFICATION_TYPES.INFO, duration), [addNotification]);

    const clearAll = useCallback(() => setNotifications([]), []);

    const addSystemNotification = useCallback((notification) => {
        setSystemNotifications(prev => [notification, ...prev]);
    }, []);

    const markAsRead = useCallback((id) => {
        setSystemNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setSystemNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const unreadCount = systemNotifications.filter(n => !n.read).length;

    const value = {
        notifications, systemNotifications, unreadCount,
        addNotification, removeNotification, showNotification,
        showSuccess, showError, showWarning, showInfo,
        success: showSuccess, error: showError, warning: showWarning, info: showInfo,
        clearAll, addSystemNotification, markAsRead, markAllAsRead
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            {notifications.length > 0 && (
                <div className="toast-container">
                    {notifications.map(n => (
                        <div key={n.id} className={`toast toast-${n.type}`} onClick={() => removeNotification(n.id)}>
                            <span className="toast-icon">{n.type === 'success' ? '✓' : n.type === 'error' ? '✕' : n.type === 'warning' ? '⚠' : 'ℹ'}</span>
                            <span className="toast-message">{n.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification musi być użyty wewnątrz NotificationProvider');
    return context;
}

export default NotificationContext;
