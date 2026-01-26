/**
 * PetCareApp - Serwis IT
 * Monitorowanie systemu, logi, infrastruktura
 * @author VS
 */

import { analyticsApi, auditApi } from './api';

/**
 * Serwis IT - zarządzanie infrastrukturą i monitoringiem
 */
export const itService = {
    /**
     * Pobranie statusu wszystkich mikroserwisów
     * @returns {Promise<Array>} Status serwisów
     */
    async getServicesStatus() {
        const response = await analyticsApi.get('/system/services');
        return response.data;
    },

    /**
     * Pobranie szczegółowego statusu serwisu
     * @param {string} serviceName - Nazwa serwisu
     * @returns {Promise<Object>} Status serwisu
     */
    async getServiceHealth(serviceName) {
        const response = await analyticsApi.get(`/system/services/${serviceName}/health`);
        return response.data;
    },

    /**
     * Pobranie metryk systemowych
     * @param {string} timeRange - Zakres czasowy (1h, 24h, 7d, 30d)
     * @returns {Promise<Object>} Metryki
     */
    async getSystemMetrics(timeRange = '24h') {
        const response = await analyticsApi.get('/system/metrics', {
            params: { range: timeRange }
        });
        return response.data;
    },

    /**
     * Pobranie logów systemowych
     * @param {Object} filters - Filtry (level, service, timeRange)
     * @returns {Promise<Array>} Lista logów
     */
    async getLogs(filters = {}) {
        const response = await auditApi.get('/logs', { params: filters });
        return response.data;
    },

    /**
     * Pobranie logów audytu
     * @param {Object} filters - Filtry
     * @returns {Promise<Array>} Logi audytu
     */
    async getAuditLogs(filters = {}) {
        const response = await auditApi.get('/audit', { params: filters });
        return response.data;
    },

    /**
     * Pobranie alertów bezpieczeństwa
     * @param {Object} filters - Filtry
     * @returns {Promise<Array>} Lista alertów
     */
    async getSecurityAlerts(filters = {}) {
        const response = await analyticsApi.get('/security/alerts', { params: filters });
        return response.data;
    },

    /**
     * Pobranie statusu certyfikatów SSL
     * @returns {Promise<Array>} Status certyfikatów
     */
    async getSSLStatus() {
        const response = await analyticsApi.get('/security/ssl');
        return response.data;
    },

    /**
     * Pobranie statusu backupów
     * @returns {Promise<Array>} Status backupów
     */
    async getBackupStatus() {
        const response = await analyticsApi.get('/infrastructure/backups');
        return response.data;
    },

    /**
     * Uruchomienie backupu ręcznego
     * @param {string} type - Typ backupu (full, incremental)
     * @returns {Promise<Object>} Status operacji
     */
    async triggerBackup(type = 'incremental') {
        const response = await analyticsApi.post('/infrastructure/backups/trigger', { type });
        return response.data;
    },

    /**
     * Pobranie statusu kontenerów Docker
     * @returns {Promise<Array>} Status kontenerów
     */
    async getContainerStatus() {
        const response = await analyticsApi.get('/infrastructure/containers');
        return response.data;
    },

    /**
     * Restart serwisu
     * @param {string} serviceName - Nazwa serwisu
     * @returns {Promise<Object>} Status operacji
     */
    async restartService(serviceName) {
        const response = await analyticsApi.post(`/system/services/${serviceName}/restart`);
        return response.data;
    },

    /**
     * Pobranie konfiguracji firewalla
     * @returns {Promise<Object>} Konfiguracja
     */
    async getFirewallConfig() {
        const response = await analyticsApi.get('/security/firewall');
        return response.data;
    },

    /**
     * Aktualizacja reguł firewalla
     * @param {Object} rules - Nowe reguły
     * @returns {Promise<Object>} Zaktualizowana konfiguracja
     */
    async updateFirewallRules(rules) {
        const response = await analyticsApi.put('/security/firewall', rules);
        return response.data;
    },

    /**
     * Pobranie statystyk wydajności
     * @param {string} timeRange - Zakres czasowy
     * @returns {Promise<Object>} Statystyki
     */
    async getPerformanceStats(timeRange = '24h') {
        const response = await analyticsApi.get('/system/performance', {
            params: { range: timeRange }
        });
        return response.data;
    },

    /**
     * Pobranie statusu bazy danych
     * @returns {Promise<Object>} Status DB
     */
    async getDatabaseStatus() {
        const response = await analyticsApi.get('/infrastructure/database');
        return response.data;
    },

    /**
     * Pobranie statusu kolejek Kafka
     * @returns {Promise<Object>} Status kolejek
     */
    async getKafkaStatus() {
        const response = await analyticsApi.get('/infrastructure/kafka');
        return response.data;
    },

    /**
     * Pobranie statusu cache Redis
     * @returns {Promise<Object>} Status Redis
     */
    async getRedisStatus() {
        const response = await analyticsApi.get('/infrastructure/redis');
        return response.data;
    },

    /**
     * Eksport logów
     * @param {Object} filters - Filtry
     * @param {string} format - Format (json, csv)
     * @returns {Promise<Blob>} Plik z logami
     */
    async exportLogs(filters, format = 'json') {
        const response = await auditApi.get('/logs/export', {
            params: { ...filters, format },
            responseType: 'blob'
        });
        return response.data;
    }
};

export default itService;
