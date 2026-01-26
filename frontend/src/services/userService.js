/**
 * PetCareApp - Serwis użytkowników
 * Obsługa zarządzania użytkownikami (admin)
 * @author VS
 */

import { userApi } from './api';

/**
 * Serwis użytkowników - zarządzanie kontami
 */
export const userService = {
    /**
     * Pobranie listy użytkowników
     * @param {Object} filters - Filtry (role, status, etc.)
     * @returns {Promise<Array>} Lista użytkowników
     */
    async getUsers(filters = {}) {
        const response = await userApi.get('/users', { params: filters });
        return response.data;
    },

    /**
     * Pobranie szczegółów użytkownika
     * @param {string} userId - ID użytkownika
     * @returns {Promise<Object>} Dane użytkownika
     */
    async getUserById(userId) {
        const response = await userApi.get(`/users/${userId}`);
        return response.data;
    },

    /**
     * Utworzenie nowego użytkownika (admin)
     * @param {Object} userData - Dane użytkownika
     * @returns {Promise<Object>} Utworzony użytkownik
     */
    async createUser(userData) {
        const response = await userApi.post('/users', userData);
        return response.data;
    },

    /**
     * Aktualizacja użytkownika
     * @param {string} userId - ID użytkownika
     * @param {Object} updates - Dane do aktualizacji
     * @returns {Promise<Object>} Zaktualizowany użytkownik
     */
    async updateUser(userId, updates) {
        const response = await userApi.put(`/users/${userId}`, updates);
        return response.data;
    },

    /**
     * Aktywacja konta użytkownika
     * @param {string} userId - ID użytkownika
     * @returns {Promise<void>}
     */
    async activateUser(userId) {
        await userApi.post(`/users/${userId}/activate`);
    },

    /**
     * Dezaktywacja konta użytkownika
     * @param {string} userId - ID użytkownika
     * @param {string} reason - Powód blokady
     * @returns {Promise<void>}
     */
    async deactivateUser(userId, reason) {
        await userApi.post(`/users/${userId}/deactivate`, { reason });
    },

    /**
     * Usunięcie użytkownika
     * @param {string} userId - ID użytkownika
     * @returns {Promise<void>}
     */
    async deleteUser(userId) {
        await userApi.delete(`/users/${userId}`);
    },

    /**
     * Pobranie weterynarzy
     * @param {Object} filters - Filtry
     * @returns {Promise<Array>} Lista weterynarzy
     */
    async getVeterinarians(filters = {}) {
        const response = await userApi.get('/users/veterinarians', { params: filters });
        return response.data;
    },

    /**
     * Pobranie klientów
     * @param {Object} filters - Filtry
     * @returns {Promise<Array>} Lista klientów
     */
    async getClients(filters = {}) {
        const response = await userApi.get('/users/clients', { params: filters });
        return response.data;
    },

    /**
     * Wyszukiwanie użytkowników
     * @param {string} query - Zapytanie wyszukiwania
     * @param {Object} filters - Dodatkowe filtry
     * @returns {Promise<Array>} Wyniki wyszukiwania
     */
    async searchUsers(query, filters = {}) {
        const response = await userApi.get('/users/search', {
            params: { q: query, ...filters }
        });
        return response.data;
    },

    /**
     * Pobranie statystyk użytkowników
     * @returns {Promise<Object>} Statystyki
     */
    async getUserStats() {
        const response = await userApi.get('/users/stats');
        return response.data;
    },

    /**
     * Export danych użytkownika (RODO)
     * @param {string} userId - ID użytkownika
     * @returns {Promise<Blob>} Plik z danymi
     */
    async exportUserData(userId) {
        const response = await userApi.get(`/users/${userId}/export`, {
            responseType: 'blob'
        });
        return response.data;
    },

    /**
     * Zmiana roli użytkownika
     * @param {string} userId - ID użytkownika
     * @param {string} newRole - Nowa rola
     * @returns {Promise<Object>} Zaktualizowany użytkownik
     */
    async changeUserRole(userId, newRole) {
        const response = await userApi.post(`/users/${userId}/role`, { role: newRole });
        return response.data;
    }
};

export default userService;
