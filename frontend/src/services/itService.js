import { analyticsApi, auditApi, reportApi } from './api';
export const itService = {
    async getMetrics() {
        try { return (await analyticsApi.get('/metrics')).data; }
        catch (e) { return { cpu: { usage: 0 }, memory: { used: 0, total: 0, percent: 0 }, disk: { used: 0, total: 0, percent: 0 }, uptime: { days: 0, hours: 0 } }; }
    },
    async getSystemHealth() {
        try { return (await analyticsApi.get('/health')).data; }
        catch (e) { return { status: 'unknown', services: [] }; }
    },
    async getServicesStatus() {
        try { return (await analyticsApi.get('/services')).data; }
        catch (e) {
            return { services: [
                { name: 'auth-service', port: 8001, status: 'healthy' },
                { name: 'user-service', port: 8002, status: 'healthy' },
                { name: 'medical-records-service', port: 8003, status: 'healthy' },
                { name: 'appointment-service', port: 8004, status: 'healthy' },
                { name: 'notification-service', port: 8005, status: 'healthy' },
                { name: 'payment-service', port: 8006, status: 'healthy' },
                { name: 'report-service', port: 8007, status: 'healthy' },
                { name: 'analytics-service', port: 8008, status: 'healthy' },
                { name: 'audit-service', port: 8009, status: 'healthy' },
                { name: 'drug-service', port: 8010, status: 'healthy' },
                { name: 'disease-alert-service', port: 8011, status: 'healthy' },
                { name: 'pet-service', port: 8012, status: 'healthy' },
                { name: 'drug-info-service', port: 8013, status: 'healthy' }
            ]};
        }
    },
    async getLogs(params = {}) { try { return (await auditApi.get('/', { params })).data; } catch (e) { return { logs: [], total: 0 }; } },
    async getServiceLogs(serviceName, params = {}) { try { return (await auditApi.get(`/service/${serviceName}`, { params })).data; } catch (e) { return { logs: [], total: 0 }; } },
    async exportLogs(params = {}, format = 'json') { return (await auditApi.get('/export', { params: { ...params, format }, responseType: 'blob' })).data; },
    async getAuditStats() { try { return (await auditApi.get('/stats')).data; } catch (e) { return { today: { total: 0 }, lastWeek: { total: 0 }, securityEvents: { failedLogins: 0 } }; } },
    async getAuditEvents(params = {}) { try { return (await auditApi.get('/events', { params })).data; } catch (e) { return { events: [], total: 0 }; } },
    async generateReport(type = 'daily') { return (await reportApi.post('/generate', { type })).data; },
    async getReports(params = {}) { return (await reportApi.get('/', { params })).data; },
    async getReportById(id) { return (await reportApi.get(`/${id}`)).data; },
    async getSecurityEvents(params = {}) { try { return (await auditApi.get('/security', { params })).data; } catch (e) { return { events: [], total: 0 }; } },
    async getFailedLogins(params = {}) { try { return (await auditApi.get('/failed-logins', { params })).data; } catch (e) { return { attempts: [], total: 0 }; } }
};
export default itService;
