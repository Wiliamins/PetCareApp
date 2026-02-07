/**
 * PetCareApp - Disease Alert Service
 * API dla alertów epidemiologicznych z integracją (WOAH, ADNS, GIW, EFSA)
 * @author VS
 */

import { diseaseAlertApi } from './api';

export const diseaseAlertService = {
    /**
     * Pobranie alertów z zewnętrznych źródeł
     */
    async getAlerts(filters = {}) {
        const params = new URLSearchParams();
        if (filters.country) params.append('country', filters.country);
        if (filters.source) params.append('source', filters.source);
        if (filters.status) params.append('status', filters.status);
        if (filters.severity) params.append('severity', filters.severity);
        
        const response = await diseaseAlertApi.get(`/?${params}`);
        return response.data;
    },

    /**
     * Pobranie dostępnych źródeł danych
     */
    async getSources() {
        const response = await diseaseAlertApi.get('/sources');
        return response.data;
    },

    /**
     * Pobranie listy monitorowanych chorób
     */
    async getDiseases() {
        const response = await diseaseAlertApi.get('/diseases');
        return response.data;
    },

    /**
     * Pobranie informacji o strefach ASF
     */
    async getASFZones() {
        const response = await diseaseAlertApi.get('/asf');
        return response.data;
    },

    /**
     * Pobranie szczegółów alertu
     */
    async getAlertById(alertId) {
        const response = await diseaseAlertApi.get(`/${alertId}`);
        return response.data;
    },

    /**
     * Pobranie aktywnych alertów
     */
    async getActiveAlerts() {
        const response = await diseaseAlertApi.get('/active');
        return response.data;
    },

    /**
     * Alerty w pobliżu lokalizacji
     */
    async getNearbyAlerts(lat, lng, radius = 100) {
        const response = await diseaseAlertApi.get(`/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
        return response.data;
    },

    /**
     * Pobranie bazy chorób
     */
    async getDiseases(filters = {}) {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.zoonotic !== undefined) params.append('zoonotic', filters.zoonotic);
        if (filters.notifiable !== undefined) params.append('notifiable', filters.notifiable);
        
        const response = await diseaseAlertApi.get(`/diseases?${params}`);
        return response.data;
    },

    /**
     * Szczegóły choroby
     */
    async getDiseaseById(diseaseId) {
        const response = await diseaseAlertApi.get(`/diseases/${diseaseId}`);
        return response.data;
    },

    /**
     * Statystyki alertów
     */
    async getStats() {
        const response = await diseaseAlertApi.get('/stats');
        return response.data;
    },

    /**
     * Lista województw
     */
    async getRegions() {
        const response = await diseaseAlertApi.get('/regions');
        return response.data;
    }
};

export default diseaseAlertService;
