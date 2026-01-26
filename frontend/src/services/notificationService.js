/**
 * PetCareApp - Serwis powiadomień
 * Obsługa powiadomień systemowych
 * @author VS
 */

import { notificationApi } from './api';

/**
 * Serwis powiadomień - zarządzanie powiadomieniami
 */
export const notificationService = {
    /**
     * Pobranie powiadomień użytkownika
     * @param {Object} filters - Filtry (read, type, etc.)
     * @returns {Promise<Array>} Lista powiadomień
     */
    async getNotifications(filters = {}) {
        const response = await notificationApi.get('/notifications', { params: filters });
        return response.data;
    },

    /**
     * Pobranie liczby nieprzeczytanych powiadomień
     * @returns {Promise<number>} Liczba nieprzeczytanych
     */
    async getUnreadCount() {
        const response = await notificationApi.get('/notifications/unread-count');
        return response.data.count;
    },

    /**
     * Oznaczenie powiadomienia jako przeczytane
     * @param {string} notificationId - ID powiadomienia
     * @returns {Promise<void>}
     */
    async markAsRead(notificationId) {
        await notificationApi.post(`/notifications/${notificationId}/read`);
    },

    /**
     * Oznaczenie wszystkich jako przeczytane
     * @returns {Promise<void>}
     */
    async markAllAsRead() {
        await notificationApi.post('/notifications/read-all');
    },

    /**
     * Usunięcie powiadomienia
     * @param {string} notificationId - ID powiadomienia
     * @returns {Promise<void>}
     */
    async deleteNotification(notificationId) {
        await notificationApi.delete(`/notifications/${notificationId}`);
    },

    /**
     * Pobranie ustawień powiadomień
     * @returns {Promise<Object>} Ustawienia
     */
    async getSettings() {
        const response = await notificationApi.get('/notifications/settings');
        return response.data;
    },

    /**
     * Aktualizacja ustawień powiadomień
     * @param {Object} settings - Nowe ustawienia
     * @returns {Promise<Object>} Zaktualizowane ustawienia
     */
    async updateSettings(settings) {
        const response = await notificationApi.put('/notifications/settings', settings);
        return response.data;
    },

    /**
     * Subskrypcja push notifications
     * @param {Object} subscription - Dane subskrypcji
     * @returns {Promise<void>}
     */
    async subscribePush(subscription) {
        await notificationApi.post('/notifications/push/subscribe', subscription);
    },

    /**
     * Anulowanie subskrypcji push
     * @returns {Promise<void>}
     */
    async unsubscribePush() {
        await notificationApi.post('/notifications/push/unsubscribe');
    },

    /**
     * Wysłanie powiadomienia (admin/system)
     * @param {Object} notificationData - Dane powiadomienia
     * @returns {Promise<Object>} Wysłane powiadomienie
     */
    async sendNotification(notificationData) {
        const response = await notificationApi.post('/notifications/send', notificationData);
        return response.data;
    },

    /**
     * Wysłanie powiadomienia masowego (admin)
     * @param {Object} broadcastData - Dane powiadomienia
     * @returns {Promise<Object>} Wynik wysyłki
     */
    async broadcastNotification(broadcastData) {
        const response = await notificationApi.post('/notifications/broadcast', broadcastData);
        return response.data;
    }
};

export default notificationService;
