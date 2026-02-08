import { userApi } from './api';
export const userService = {
    async getUsers(filters = {}) { return await userApi.get('/', { params: filters }); },
    async getAllUsers() { return await userApi.get('/all'); },
    async getUserById(id) { return (await userApi.get(`/${id}`)).data; },
    async createUser(data) { return await userApi.post('/', data); },
    async updateUser(id, updates) { return await userApi.put(`/${id}`, updates); },
    async deleteUser(id) { await userApi.delete(`/${id}`); },
    async setUserStatus(id, isActive) { return await userApi.post(`/${id}/status`, { isActive }); },
    async getVets() { const r = await userApi.get('/vets'); return r.data || r; },
    async getClients() { const r = await userApi.get('/clients'); return r.data || r; },
    async searchUsers(query) { return (await userApi.get('/search', { params: { q: query } })).data; },
    async getStats() { return (await userApi.get('/stats')).data; },
    async resetUserPassword(id, newPassword) { return await userApi.post(`/${id}/reset-password`, { newPassword }); }
};
export default userService;
