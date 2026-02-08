import { appointmentApi } from './api';
export const appointmentService = {
    async getMyAppointments(filters = {}) { return await appointmentApi.get('/', { params: filters }); },
    async getAllAppointments(filters = {}) { return await appointmentApi.get('/all', { params: filters }); },
    async getVetAppointments(vetId, filters = {}) { return await appointmentApi.get('/vet', { params: { vetId, ...filters } }); },
    async getAppointmentById(id) { return (await appointmentApi.get(`/${id}`)).data; },
    async createAppointment(data) { return await appointmentApi.post('/', data); },
    async updateAppointment(id, updates) { return await appointmentApi.put(`/${id}`, updates); },
    async cancelAppointment(id, reason = '') { return await appointmentApi.post(`/${id}/cancel`, { reason }); },
    async confirmAppointment(id) { return await appointmentApi.post(`/${id}/confirm`); },
    async startAppointment(id) { return await appointmentApi.post(`/${id}/start`); },
    async completeAppointment(id, summary = {}) { return await appointmentApi.post(`/${id}/complete`, summary); },
    async getAvailableSlots(vetId, date, serviceId) { return (await appointmentApi.get('/slots', { params: { vetId, date, serviceId } })).data; },
    async getServices() { return (await appointmentApi.get('/services')).data; },
    async getVets() { return (await appointmentApi.get('/vets')).data; },
    async rescheduleAppointment(id, newSlot) { return await appointmentApi.post(`/${id}/reschedule`, newSlot); },
    async getStats(filters = {}) { return (await appointmentApi.get('/stats', { params: filters })).data; }
};
export default appointmentService;
