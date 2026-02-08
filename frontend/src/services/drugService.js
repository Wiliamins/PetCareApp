/**
 * PetCareApp - Drug Service
 * API dla bazy leków z integracją zewnętrznych źródeł (URPL, FDA, EMA)
 * @author VS
 */
import { drugApi, drugInfoApi } from './api';

export const drugService = {
    async searchDrugs(query, source = 'all', limit = 20) {
        try {
            const response = await drugInfoApi.get('/search', { params: { q: query, source, limit } });
            return response.data;
        } catch (error) {
            console.error('Drug search error:', error);
            return { query, drugs: [], sources: [{ id: source, name: source, count: 0, error: error.message }], total: 0, cached: false };
        }
    },
    async getSources() {
        try {
            const response = await drugInfoApi.get('/sources');
            return response.data;
        } catch (error) {
            return [
                { id: 'URPL', name: 'URPL (Polska)', country: 'PL', api: true, url: 'https://pub.rejestrymedyczne.csioz.gov.pl' },
                { id: 'FDA', name: 'FDA openFDA (USA)', country: 'US', api: true, url: 'https://open.fda.gov' },
                { id: 'EMA', name: 'EMA (UE)', country: 'EU', api: false, url: 'https://www.ema.europa.eu' }
            ];
        }
    },
    async getCategories() {
        try {
            const response = await drugInfoApi.get('/categories');
            return response.data;
        } catch (error) { return []; }
    },
    async getStats() {
        try {
            const response = await drugInfoApi.get('/stats');
            return response.data;
        } catch (error) { return { cache_entries: 0, real_time_apis: ['URPL', 'FDA'] }; }
    },
    async checkHealth() {
        try {
            const response = await drugInfoApi.get('/health');
            return response.data;
        } catch (error) { return { status: 'unhealthy', error: error.message }; }
    },
    async getPetPrescriptions(petId) {
        try {
            const response = await drugApi.get('/', { params: { petId } });
            return response.data;
        } catch (error) { return []; }
    },
    async getAllPrescriptions(filters = {}) {
        try {
            const response = await drugApi.get('/', { params: filters });
            return response.data;
        } catch (error) { return []; }
    },
    async createPrescription(prescriptionData) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return await drugApi.post('/', { ...prescriptionData, vetId: user.id, vetName: `${user.firstName || ''} ${user.lastName || ''}`.trim() });
    },
    async completePrescription(prescriptionId) {
        return await drugApi.post(`/${prescriptionId}/complete`);
    },
    async getDrugs(filters = {}) {
        if (filters.search || filters.query) return this.searchDrugs(filters.search || filters.query, filters.source || 'all');
        return { drugs: [], total: 0 };
    },
    async getDrugById(drugId) {
        try {
            const response = await drugInfoApi.get(`/${drugId}`);
            return response.data;
        } catch (error) { return null; }
    },
    async checkInteractions(drugIds) {
        try {
            const response = await drugInfoApi.post('/interactions', { drugIds });
            return response.data;
        } catch (error) { return { interactions: [], warnings: [] }; }
    }
};
export default drugService;
