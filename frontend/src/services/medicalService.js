import { medicalApi } from './api';
export const medicalService = {
    async getPetRecords(petId) { return await medicalApi.get(`/pet/${petId}`); },
    async getPetHistory(petId) { return await medicalApi.get(`/pet/${petId}/history`); },
    async getAllRecords(filters = {}) { return await medicalApi.get('/', { params: filters }); },
    async getRecordById(id) { return (await medicalApi.get(`/${id}`)).data; },
    async createRecord(data) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return await medicalApi.post('/', { ...data, vetId: user.id, vetName: `${user.firstName || ''} ${user.lastName || ''}`.trim(), createdAt: new Date().toISOString() });
    },
    async updateRecord(id, updates) { return await medicalApi.put(`/${id}`, updates); },
    async deleteRecord(id) { await medicalApi.delete(`/${id}`); },
    async getVaccinations(petId) { return (await medicalApi.get(`/vaccinations/pet/${petId}`)).data; },
    async addVaccination(data) { return await medicalApi.post('/vaccinations', data); },
    async getLabResults(petId) { return (await medicalApi.get(`/lab-results/pet/${petId}`)).data; },
    async addLabResult(data) { return await medicalApi.post('/lab-results', data); },
    async getStats() { return (await medicalApi.get('/stats')).data; },
    async exportToPdf(petId) { return (await medicalApi.get(`/pet/${petId}/export`, { responseType: 'blob' })).data; }
};
export default medicalService;
