/**
 * PetCareApp - Drug Service
 * API dla bazy leków z integracją zewnętrznych źródeł (URPL, FDA, EMA)
 * @author VS
 */

import { drugApi } from './api';

export const drugService = {
    /**
     * Wyszukiwanie leków w zewnętrznych bazach
     */
    async searchDrugs(query, source = 'all') {
        const params = new URLSearchParams();
        params.append('q', query);
        params.append('source', source);
        
        const response = await drugApi.get(`/drugs/search?${params}`);
        return response.data;
    },

    /**
     * Pobranie dostępnych źródeł danych
     */
    async getSources() {
        const response = await drugApi.get('/drugs/sources');
        return response.data;
    },

    /**
     * Pobranie listy leków (legacy)
     */
    async getDrugs(filters = {}) {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.species) params.append('species', filters.species);
        if (filters.prescription !== undefined) params.append('prescription', filters.prescription);
        if (filters.search) params.append('search', filters.search);
        
        const response = await drugApi.get(`/drugs?${params}`);
        return response.data;
    },

    /**
     * Pobranie szczegółów leku
     */
    async getDrugById(drugId) {
        const response = await drugApi.get(`/drugs/${drugId}`);
        return response.data;
    },

    /**
     * Wyszukiwanie leków
     */
    async searchDrugs(query) {
        const response = await drugApi.get(`/drugs/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },

    /**
     * Pobranie kategorii leków
     */
    async getCategories() {
        const response = await drugApi.get('/drugs/categories');
        return response.data;
    },

    /**
     * Sprawdzenie interakcji
     */
    async checkInteractions(drugIds) {
        const response = await drugApi.post('/drugs/interactions', { drugIds });
        return response.data;
    },

    /**
     * Leki dla gatunku
     */
    async getDrugsBySpecies(species) {
        const response = await drugApi.get(`/drugs/by-species/${species}`);
        return response.data;
    },

    /**
     * Leki według wskazań
     */
    async getDrugsByIndication(indication) {
        const response = await drugApi.get(`/drugs/by-indication?indication=${encodeURIComponent(indication)}`);
        return response.data;
    },

    /**
     * Statystyki bazy
     */
    async getStats() {
        const response = await drugApi.get('/stats');
        return response.data;
    }
};

export default drugService;
