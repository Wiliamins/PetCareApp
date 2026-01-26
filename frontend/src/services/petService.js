/**
 * PetCareApp - Serwis zwierząt
 * Obsługa CRUD dla zwierząt pacjentów
 * @author VS
 */

import { userApi, medicalApi } from './api';

/**
 * Serwis zwierząt - zarządzanie danymi zwierząt
 */
export const petService = {
    /**
     * Pobranie listy zwierząt użytkownika
     * @param {string} userId - ID właściciela (opcjonalne - dla admina/weta)
     * @returns {Promise<Array>} Lista zwierząt
     */
    async getPets(userId = null) {
        const url = userId ? `/pets?userId=${userId}` : '/pets';
        const response = await userApi.get(url);
        return response.data;
    },

    /**
     * Pobranie szczegółów zwierzęcia
     * @param {string} petId - ID zwierzęcia
     * @returns {Promise<Object>} Dane zwierzęcia
     */
    async getPetById(petId) {
        const response = await userApi.get(`/pets/${petId}`);
        return response.data;
    },

    /**
     * Dodanie nowego zwierzęcia
     * @param {Object} petData - Dane zwierzęcia
     * @returns {Promise<Object>} Utworzone zwierzę
     */
    async createPet(petData) {
        const response = await userApi.post('/pets', petData);
        return response.data;
    },

    /**
     * Aktualizacja danych zwierzęcia
     * @param {string} petId - ID zwierzęcia
     * @param {Object} updates - Dane do aktualizacji
     * @returns {Promise<Object>} Zaktualizowane dane
     */
    async updatePet(petId, updates) {
        const response = await userApi.put(`/pets/${petId}`, updates);
        return response.data;
    },

    /**
     * Usunięcie zwierzęcia
     * @param {string} petId - ID zwierzęcia
     * @returns {Promise<void>}
     */
    async deletePet(petId) {
        await userApi.delete(`/pets/${petId}`);
    },

    /**
     * Upload zdjęcia zwierzęcia
     * @param {string} petId - ID zwierzęcia
     * @param {File} file - Plik zdjęcia
     * @returns {Promise<Object>} URL zdjęcia
     */
    async uploadPhoto(petId, file) {
        const formData = new FormData();
        formData.append('photo', file);
        
        const response = await userApi.post(`/pets/${petId}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Pobranie historii medycznej zwierzęcia
     * @param {string} petId - ID zwierzęcia
     * @returns {Promise<Array>} Historia medyczna
     */
    async getMedicalHistory(petId) {
        const response = await medicalApi.get(`/records/pet/${petId}`);
        return response.data;
    },

    /**
     * Pobranie historii szczepień
     * @param {string} petId - ID zwierzęcia
     * @returns {Promise<Array>} Lista szczepień
     */
    async getVaccinations(petId) {
        const response = await medicalApi.get(`/vaccinations/pet/${petId}`);
        return response.data;
    },

    /**
     * Pobranie dokumentów zwierzęcia
     * @param {string} petId - ID zwierzęcia
     * @returns {Promise<Array>} Lista dokumentów
     */
    async getDocuments(petId) {
        const response = await userApi.get(`/pets/${petId}/documents`);
        return response.data;
    },

    /**
     * Upload dokumentu
     * @param {string} petId - ID zwierzęcia
     * @param {File} file - Plik dokumentu
     * @param {string} type - Typ dokumentu
     * @returns {Promise<Object>} Dane dokumentu
     */
    async uploadDocument(petId, file, type) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', type);
        
        const response = await userApi.post(`/pets/${petId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Wyszukiwanie zwierząt (dla admina/weta)
     * @param {Object} filters - Filtry wyszukiwania
     * @returns {Promise<Array>} Lista zwierząt
     */
    async searchPets(filters) {
        const response = await userApi.get('/pets/search', { params: filters });
        return response.data;
    }
};

export default petService;
