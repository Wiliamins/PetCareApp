import { paymentApi } from './api';
export const paymentService = {
    async getMyPayments(filters = {}) { return await paymentApi.get('/', { params: filters }); },
    async getAllPayments(filters = {}) { return await paymentApi.get('/all', { params: filters }); },
    async getPaymentById(id) { return (await paymentApi.get(`/${id}`)).data; },
    async createPaymentIntent(data) { return (await paymentApi.post('/create-intent', data)).data; },
    async confirmPayment(paymentIntentId) { return (await paymentApi.post('/confirm', { paymentIntentId })).data; },
    async cancelPayment(id) { return await paymentApi.post(`/${id}/cancel`); },
    async requestRefund(id, data) { return (await paymentApi.post(`/${id}/refund`, data)).data; },
    async getServices() { const r = await paymentApi.get('/services'); return r.data || r; },
    async getServiceById(id) { return (await paymentApi.get(`/services/${id}`)).data; },
    async saveService(data) { return data.id ? await paymentApi.put(`/services/${data.id}`, data) : await paymentApi.post('/services', data); },
    async deleteService(id) { await paymentApi.delete(`/services/${id}`); },
    async getStats(filters = {}) { return (await paymentApi.get('/stats', { params: filters })).data; },
    async generateInvoice(id) { return (await paymentApi.get(`/${id}/invoice`, { responseType: 'blob' })).data; },
    async getStripeConfig() { return (await paymentApi.get('/config')).data; }
};
export default paymentService;
