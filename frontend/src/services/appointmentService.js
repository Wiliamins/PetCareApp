/**
 * PetCareApp - Serwis wizyt
 * Obsługa rezerwacji i zarządzania wizytami
 * @author VS
 */

import { appointmentApi } from './api';

/**
 * Serwis wizyt - zarządzanie wizytami w klinice
 */
export const appointmentService = {
    /**
     * Pobranie listy wizyt użytkownika
     * @param {Object} filters - Filtry (status, data, etc.)
     * @returns {Promise<Array>} Lista wizyt
     */
    async getAppointments(filters = {}) {
        const response = await appointmentApi.get('/', { params: filters });
        return response.data;
    },

    /**
     * Pobranie szczegółów wizyty
     * @param {string} appointmentId - ID wizyty
     * @returns {Promise<Object>} Dane wizyty
     */
    async getAppointmentById(appointmentId) {
        const response = await appointmentApi.get(`/${appointmentId}`);
        return response.data;
    },

    /**
     * Utworzenie nowej wizyty
     * @param {Object} appointmentData - Dane wizyty
     * @returns {Promise<Object>} Utworzona wizyta
     */
    async createAppointment(appointmentData) {
        const response = await appointmentApi.post('/', appointmentData);
        return response.data;
    },

    /**
     * Aktualizacja wizyty
     * @param {string} appointmentId - ID wizyty
     * @param {Object} updates - Dane do aktualizacji
     * @returns {Promise<Object>} Zaktualizowana wizyta
     */
    async updateAppointment(appointmentId, updates) {
        const response = await appointmentApi.put(`/${appointmentId}`, updates);
        return response.data;
    },

    /**
     * Anulowanie wizyty
     * @param {string} appointmentId - ID wizyty
     * @param {string} reason - Powód anulowania
     * @returns {Promise<void>}
     */
    async cancelAppointment(appointmentId, reason) {
        await appointmentApi.post(`/${appointmentId}/cancel`, { reason });
    },

    /**
     * Potwierdzenie wizyty
     * @param {string} appointmentId - ID wizyty
     * @returns {Promise<Object>} Potwierdzona wizyta
     */
    async confirmAppointment(appointmentId) {
        const response = await appointmentApi.post(`/${appointmentId}/confirm`);
        return response.data;
    },

    /**
     * Pobranie dostępnych terminów
     * @param {string} vetId - ID weterynarza
     * @param {string} date - Data (YYYY-MM-DD)
     * @param {string} serviceType - Typ usługi
     * @returns {Promise<Array>} Dostępne terminy
     */
    async getAvailableSlots(vetId, date, serviceType) {
        const response = await appointmentApi.get('/slots', {
            params: { vetId, date, serviceType }
        });
        return response.data;
    },

    /**
     * Pobranie listy weterynarzy
     * @param {string} specialization - Specjalizacja (opcjonalnie)
     * @returns {Promise<Array>} Lista weterynarzy
     */
    async getVeterinarians(specialization = null) {
        const params = specialization ? { specialization } : {};
        const response = await appointmentApi.get('/veterinarians', { params });
        return response.data;
    },

    /**
     * Pobranie typów wizyt/usług
     * @returns {Promise<Array>} Lista typów wizyt
     */
    async getAppointmentTypes() {
        const response = await appointmentApi.get('/appointment-types');
        return response.data;
    },

    /**
     * Pobranie wizyt na dany dzień (dla weterynarza)
     * @param {string} date - Data (YYYY-MM-DD)
     * @returns {Promise<Array>} Lista wizyt
     */
    async getDaySchedule(date) {
        const response = await appointmentApi.get('/schedule', {
            params: { date }
        });
        return response.data;
    },

    /**
     * Pobranie harmonogramu weterynarza
     * @param {string} vetId - ID weterynarza
     * @param {string} startDate - Data początkowa
     * @param {string} endDate - Data końcowa
     * @returns {Promise<Object>} Harmonogram
     */
    async getVetSchedule(vetId, startDate, endDate) {
        const response = await appointmentApi.get(`/veterinarians/${vetId}/schedule`, {
            params: { startDate, endDate }
        });
        return response.data;
    },

    /**
     * Ustawienie dostępności weterynarza
     * @param {Object} availabilityData - Dane dostępności
     * @returns {Promise<Object>} Zaktualizowana dostępność
     */
    async setAvailability(availabilityData) {
        const response = await appointmentApi.post('/veterinarians/availability', availabilityData);
        return response.data;
    },

    /**
     * Oznaczenie wizyty jako zakończonej
     * @param {string} appointmentId - ID wizyty
     * @param {Object} summary - Podsumowanie wizyty
     * @returns {Promise<Object>} Zakończona wizyta
     */
    async completeAppointment(appointmentId, summary) {
        const response = await appointmentApi.post(`/${appointmentId}/complete`, summary);
        return response.data;
    },

    /**
     * Pobranie statystyk wizyt (dla admina)
     * @param {Object} filters - Filtry czasowe
     * @returns {Promise<Object>} Statystyki
     */
    async getAppointmentStats(filters = {}) {
        const response = await appointmentApi.get('/stats', { params: filters });
        return response.data;
    }
};

export default appointmentService;
