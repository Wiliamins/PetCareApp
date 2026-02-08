import { notificationApi } from './api';
export const notificationService = {
    async getMyNotifications(filters = {}) { return await notificationApi.get('/', { params: filters }); },
    async getUnread() { return await notificationApi.get('/unread'); },
    async getUnreadCount() { return (await notificationApi.get('/unread/count')).data; },
    async markAsRead(id) { return await notificationApi.post(`/${id}/read`); },
    async markAllAsRead() { return await notificationApi.post('/read-all'); },
    async deleteNotification(id) { await notificationApi.delete(`/${id}`); },
    async deleteAll() { await notificationApi.delete('/all'); },
    async getSettings() { return (await notificationApi.get('/settings')).data; },
    async updateSettings(settings) { return (await notificationApi.put('/settings', settings)).data; },
    async sendNotification(data) { return await notificationApi.post('/send', data); },
    async sendEmail(data) { return await notificationApi.post('/email', data); }
};
export default notificationService;
