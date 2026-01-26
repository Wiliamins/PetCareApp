/**
 * PetCareApp - Kontekst powiadomień
 * Zarządzanie powiadomieniami toast i systemowymi
 * @author VS
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

// Typy powiadomień - VS
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Tworzenie kontekstu - VS
const NotificationContext = createContext(null);

/**
 * Provider kontekstu powiadomień
 * @param {Object} props - Właściwości komponentu
 * @param {React.ReactNode} props.children - Komponenty dzieci
 */
export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [systemNotifications, setSystemNotifications] = useState([]);

    /**
     * Generowanie unikalnego ID dla powiadomienia
     */
    const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    /**
     * Dodawanie powiadomienia toast
     * @param {string} message - Treść powiadomienia
     * @param {string} type - Typ powiadomienia
     * @param {number} duration - Czas wyświetlania (ms)
     */
    const addNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
        const id = generateId();
        const notification = {
            id,
            message,
            type,
            timestamp: new Date()
        };

        setNotifications(prev => [...prev, notification]);

        // Automatyczne usuwanie po czasie - VS
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }

        return id;
    }, []);

    /**
     * Usuwanie powiadomienia
     * @param {string} id - ID powiadomienia
     */
    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    /**
     * Skróty do tworzenia powiadomień różnych typów - VS
     */
    const showSuccess = useCallback((message, duration) => {
        return addNotification(message, NOTIFICATION_TYPES.SUCCESS, duration);
    }, [addNotification]);

    const showError = useCallback((message, duration = 7000) => {
        return addNotification(message, NOTIFICATION_TYPES.ERROR, duration);
    }, [addNotification]);

    const showWarning = useCallback((message, duration) => {
        return addNotification(message, NOTIFICATION_TYPES.WARNING, duration);
    }, [addNotification]);

    const showInfo = useCallback((message, duration) => {
        return addNotification(message, NOTIFICATION_TYPES.INFO, duration);
    }, [addNotification]);

    /**
     * Czyszczenie wszystkich powiadomień
     */
    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    /**
     * Dodawanie powiadomienia systemowego (np. z backend)
     * @param {Object} notification - Dane powiadomienia
     */
    const addSystemNotification = useCallback((notification) => {
        setSystemNotifications(prev => [notification, ...prev]);
    }, []);

    /**
     * Oznaczanie powiadomienia systemowego jako przeczytane
     * @param {string} id - ID powiadomienia
     */
    const markAsRead = useCallback((id) => {
        setSystemNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    /**
     * Oznaczanie wszystkich jako przeczytane
     */
    const markAllAsRead = useCallback(() => {
        setSystemNotifications(prev => 
            prev.map(n => ({ ...n, read: true }))
        );
    }, []);

    // Liczba nieprzeczytanych powiadomień - VS
    const unreadCount = systemNotifications.filter(n => !n.read).length;

    // Wartość kontekstu - VS
    const value = {
        notifications,
        systemNotifications,
        unreadCount,
        addNotification,
        removeNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        clearAll,
        addSystemNotification,
        markAsRead,
        markAllAsRead
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

/**
 * Hook do użycia kontekstu powiadomień
 * @returns {Object} Kontekst powiadomień
 */
export function useNotification() {
    const context = useContext(NotificationContext);
    
    if (!context) {
        throw new Error('useNotification musi być użyty wewnątrz NotificationProvider');
    }
    
    return context;
}

export default NotificationContext;
