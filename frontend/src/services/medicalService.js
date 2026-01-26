/**
 * PetCareApp - Serwis dokumentacji medycznej
 * Obsługa rekordów medycznych, diagnoz, recept
 * @author VS
 */

import { medicalApi } from './api';

/**
 * Serwis medyczny - zarządzanie dokumentacją medyczną
 */
export const medicalService = {
    /**
     * Pobranie rekordów medycznych zwierzęcia
     * @param {string} petId - ID zwierzęcia
     * @param {Object} filters - Filtry
     * @returns {Promise<Array>} Lista rekordów
     */
    async getMedicalRecords(petId, filters = {}) {
        const response = await medicalApi.get(`/records/pet/${petId}`, { params: filters });
        return response.data;
    },

    /**
     * Pobranie szczegółów rekordu medycznego
     * @param {string} recordId - ID rekordu
     * @returns {Promise<Object>} Dane rekordu
     */
    async getRecordById(recordId) {
        const response = await medicalApi.get(`/records/${recordId}`);
        return response.data;
    },

    /**
     * Utworzenie nowego rekordu medycznego
     * @param {Object} recordData - Dane rekordu
     * @returns {Promise<Object>} Utworzony rekord
     */
    async createRecord(recordData) {
        const response = await medicalApi.post('/records', recordData);
        return response.data;
    },

    /**
     * Aktualizacja rekordu medycznego
     * @param {string} recordId - ID rekordu
     * @param {Object} updates - Dane do aktualizacji
     * @returns {Promise<Object>} Zaktualizowany rekord
     */
    async updateRecord(recordId, updates) {
        const response = await medicalApi.put(`/records/${recordId}`, updates);
        return response.data;
    },

    /**
     * Pobranie szczepień zwierzęcia
     * @param {string} petId - ID zwierzęcia
     * @returns {Promise<Array>} Lista szczepień
     */
    async getVaccinations(petId) {
        const response = await medicalApi.get(`/vaccinations/pet/${petId}`);
        return response.data;
    },

    /**
     * Dodanie szczepienia
     * @param {Object} vaccinationData - Dane szczepienia
     * @returns {Promise<Object>} Dodane szczepienie
     */
    async addVaccination(vaccinationData) {
        const response = await medicalApi.post('/vaccinations', vaccinationData);
        return response.data;
    },

    /**
     * Pobranie recept zwierzęcia
     * @param {string} petId - ID zwierzęcia
     * @returns {Promise<Array>} Lista recept
     */
    async getPrescriptions(petId) {
        const response = await medicalApi.get(`/prescriptions/pet/${petId}`);
        return response.data;
    },

    /**
     * Utworzenie recepty
     * @param {Object} prescriptionData - Dane recepty
     * @returns {Promise<Object>} Utworzona recepta
     */
    async createPrescription(prescriptionData) {
        const response = await medicalApi.post('/prescriptions', prescriptionData);
        return response.data;
    },

    /**
     * Pobranie diagnoz
     * @param {string} petId - ID zwierzęcia
     * @returns {Promise<Array>} Lista diagnoz
     */
    async getDiagnoses(petId) {
        const response = await medicalApi.get(`/diagnoses/pet/${petId}`);
        return response.data;
    },

    /**
     * Dodanie diagnozy
     * @param {Object} diagnosisData - Dane diagnozy
     * @returns {Promise<Object>} Dodana diagnoza
     */
    async addDiagnosis(diagnosisData) {
        const response = await medicalApi.post('/diagnoses', diagnosisData);
        return response.data;
    },

    /**
     * Pobranie procedur medycznych
     * @param {string} petId - ID zwierzęcia
     * @returns {Promise<Array>} Lista procedur
     */
    async getProcedures(petId) {
        const response = await medicalApi.get(`/procedures/pet/${petId}`);
        return response.data;
    },

    /**
     * Dodanie procedury medycznej
     * @param {Object} procedureData - Dane procedury
     * @returns {Promise<Object>} Dodana procedura
     */
    async addProcedure(procedureData) {
        const response = await medicalApi.post('/procedures', procedureData);
        return response.data;
    },

    /**
     * Upload załącznika do rekordu
     * @param {string} recordId - ID rekordu
     * @param {File} file - Plik załącznika
     * @returns {Promise<Object>} Dane załącznika
     */
    async uploadAttachment(recordId, file) {
        const formData = new FormData();
        formData.append('attachment', file);
        
        const response = await medicalApi.post(`/records/${recordId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Wyszukiwanie w dokumentacji (dla weta)
     * @param {Object} searchParams - Parametry wyszukiwania
     * @returns {Promise<Array>} Wyniki wyszukiwania
     */
    async searchRecords(searchParams) {
        const response = await medicalApi.get('/records/search', { params: searchParams });
        return response.data;
    },

    /**
     * Pobranie statystyk medycznych (dla weta/admina)
     * @param {Object} filters - Filtry
     * @returns {Promise<Object>} Statystyki
     */
    async getMedicalStats(filters = {}) {
        const response = await medicalApi.get('/stats', { params: filters });
        return response.data;
    }
};

export default medicalService;
