/**
 * PetCareApp - Serwis autoryzacji
 * Obsługa logowania, rejestracji, tokenów
 * @author VS
 */

import { authApi } from './api';

/**
 * Serwis autoryzacji - komunikacja z Authentication Service
 */
export const authService = {
    /**
     * Logowanie użytkownika
     * @param {string} email - Adres email
     * @param {string} password - Hasło
     * @param {string} role - Rola użytkownika
     * @returns {Promise<Object>} Dane użytkownika i tokeny
     */
    async login(email, password, role) {
        const response = await authApi.post('/auth/login', {
            email,
            password,
            role
        });
        return response.data;
    },

    /**
     * Rejestracja nowego użytkownika (tylko klient)
     * @param {Object} userData - Dane rejestracyjne
     * @returns {Promise<Object>} Potwierdzenie rejestracji
     */
    async register(userData) {
        const response = await authApi.post('/auth/register', userData);
        return response.data;
    },

    /**
     * Wylogowanie użytkownika
     * @returns {Promise<void>}
     */
    async logout() {
        const refreshToken = localStorage.getItem('refreshToken');
        await authApi.post('/auth/logout', { refreshToken });
    },

    /**
     * Weryfikacja tokena i pobranie danych użytkownika
     * @param {string} token - Access token
     * @returns {Promise<Object>} Dane użytkownika
     */
    async verifyToken(token) {
        const response = await authApi.get('/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.user;
    },

    /**
     * Odświeżenie tokena
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} Nowy access token
     */
    async refreshToken(refreshToken) {
        const response = await authApi.post('/auth/refresh', { refreshToken });
        return response.data;
    },

    /**
     * Żądanie resetowania hasła
     * @param {string} email - Adres email
     * @returns {Promise<void>}
     */
    async resetPassword(email) {
        await authApi.post('/auth/reset-password', { email });
    },

    /**
     * Ustawienie nowego hasła
     * @param {string} token - Token resetowania
     * @param {string} newPassword - Nowe hasło
     * @returns {Promise<void>}
     */
    async setNewPassword(token, newPassword) {
        await authApi.post('/auth/set-password', { token, newPassword });
    },

    /**
     * Zmiana hasła zalogowanego użytkownika
     * @param {string} currentPassword - Aktualne hasło
     * @param {string} newPassword - Nowe hasło
     * @returns {Promise<void>}
     */
    async changePassword(currentPassword, newPassword) {
        await authApi.post('/auth/change-password', {
            currentPassword,
            newPassword
        });
    },

    /**
     * Aktualizacja profilu użytkownika
     * @param {Object} updates - Dane do aktualizacji
     * @returns {Promise<Object>} Zaktualizowane dane
     */
    async updateProfile(updates) {
        const response = await authApi.put('/auth/profile', updates);
        return response.data;
    },

    /**
     * Potwierdzenie adresu email
     * @param {string} token - Token potwierdzający
     * @returns {Promise<void>}
     */
    async confirmEmail(token) {
        await authApi.post('/auth/confirm-email', { token });
    },

    /**
     * Ponowne wysłanie emaila potwierdzającego
     * @param {string} email - Adres email
     * @returns {Promise<void>}
     */
    async resendConfirmation(email) {
        await authApi.post('/auth/resend-confirmation', { email });
    }
};

export default authService;
