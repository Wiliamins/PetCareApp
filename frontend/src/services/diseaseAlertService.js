/**
 * PetCareApp - Disease Alert Service
 * API dla alertów epidemiologicznych (WOAH, ADNS, GIW, EFSA)
 * @author VS
 */
import { diseaseAlertApi } from './api';

export const diseaseAlertService = {
    async getAlerts(filters = {}) {
        try {
            const response = await diseaseAlertApi.get('/alerts', {
                params: { country: filters.country || 'POL', source: filters.source || 'ALL', limit: filters.limit || 50 }
            });
            return response.data;
        } catch (error) {
            return { alerts: [], sources: [], data_portals: [{ name: 'WOAH WAHIS', url: 'https://wahis.woah.org' }, { name: 'GIW', url: 'https://www.wetgiw.gov.pl' }] };
        }
    },
    async getAllAlerts() { return this.getAlerts({ limit: 100 }); },
    async getActiveAlerts() {
        try { return (await diseaseAlertApi.get('/alerts/active')).data; }
        catch (error) { return { alerts: [] }; }
    },
    async getSources() {
        try { return (await diseaseAlertApi.get('/sources')).data; }
        catch (error) {
            return [
                { id: 'WOAH', name: 'World Organisation for Animal Health', alt_name: 'OIE', url: 'https://wahis.woah.org', type: 'Global', api: true, description: 'Światowa Organizacja Zdrowia Zwierząt' },
                { id: 'ADIS', name: 'EU Animal Disease Information System', alt_name: 'ADNS', url: 'https://ec.europa.eu/food/animals/animal-diseases_en', type: 'EU', api: false, description: 'Europejski system informacji' },
                { id: 'GIW', name: 'Główny Inspektorat Weterynarii', url: 'https://www.wetgiw.gov.pl', type: 'Poland', api: false, description: 'Polski nadzór weterynaryjny' },
                { id: 'EFSA', name: 'European Food Safety Authority', url: 'https://www.efsa.europa.eu', type: 'EU', api: false, description: 'Europejski Urząd ds. Bezpieczeństwa' }
            ];
        }
    },
    async getDiseases() {
        try { return (await diseaseAlertApi.get('/diseases')).data; }
        catch (error) {
            return [
                { id: 'asf', name: 'ASF', name_en: 'African Swine Fever', notifiable: true, zoonotic: false, species: ['świnie', 'dziki'] },
                { id: 'hpai', name: 'HPAI', name_en: 'Highly Pathogenic Avian Influenza', notifiable: true, zoonotic: true, species: ['drób'] },
                { id: 'rabies', name: 'Wścieklizna', name_en: 'Rabies', notifiable: true, zoonotic: true, species: ['ssaki'] }
            ];
        }
    },
    async getASFInfo() {
        try { return (await diseaseAlertApi.get('/asf')).data; }
        catch (error) {
            return {
                source: 'GIW', map_url: 'https://www.wetgiw.gov.pl/nadzor-weterynaryjny/asf-mapa',
                zones: [{ type: 'I', name: 'Strefa ochronna', color: '#fbbf24' }, { type: 'II', name: 'Strefa nadzoru', color: '#f97316' }, { type: 'III', name: 'Strefa zakażona', color: '#ef4444' }]
            };
        }
    },
    async getStats() {
        try { return (await diseaseAlertApi.get('/stats')).data; }
        catch (error) { return { cache_entries: 0, sources_count: 4 }; }
    },
    async checkHealth() {
        try { return (await diseaseAlertApi.get('/health')).data; }
        catch (error) { return { status: 'unhealthy', error: error.message }; }
    },
    async getAlertById(alertId) {
        try { return (await diseaseAlertApi.get(`/alerts/${alertId}`)).data; }
        catch (error) { return null; }
    },
    async getActiveCount() {
        try {
            const alerts = await this.getAlerts();
            return { count: alerts.alerts?.length || 0 };
        } catch (error) { return { count: 0 }; }
    }
};
export default diseaseAlertService;
