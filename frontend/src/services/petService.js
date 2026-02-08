/**
 * PetCareApp - Serwis zwierząt
 * @author VS
 */
import { petApi, medicalApi } from './api';

export const petService = {
    async getMyPets() {
        const response = await petApi.get('/');
        return response;
    },
    async getPets(userId = null) {
        const url = userId ? `/?userId=${userId}` : '/';
        return await petApi.get(url);
    },
    async getAllPets() {
        return await petApi.get('/all');
    },
    async getPetById(petId) {
        const response = await petApi.get(`/${petId}`);
        return response.data;
    },
    async createPet(petData) {
        return await petApi.post('/', petData);
    },
    async updatePet(petId, updates) {
        return await petApi.put(`/${petId}`, updates);
    },
    async deletePet(petId) {
        await petApi.delete(`/${petId}`);
    },
    async uploadPhoto(petId, file) {
        const formData = new FormData();
        formData.append('photo', file);
        return await petApi.post(`/${petId}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    async getMedicalHistory(petId) {
        const response = await medicalApi.get(`/pet/${petId}`);
        return response.data;
    },
    async getVaccinations(petId) {
        const response = await medicalApi.get(`/vaccinations/pet/${petId}`);
        return response.data;
    },
    async searchPets(filters) {
        const response = await petApi.get('/search', { params: filters });
        return response.data;
    }
};
export default petService;
