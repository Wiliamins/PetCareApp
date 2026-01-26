/**
 * PetCareApp - Serwis płatności
 * Obsługa płatności i faktur
 * @author VS
 */

import { paymentApi } from './api';

/**
 * Serwis płatności - zarządzanie płatnościami i fakturami
 */
export const paymentService = {
    /**
     * Pobranie listy płatności użytkownika
     * @param {Object} filters - Filtry (status, data, etc.)
     * @returns {Promise<Array>} Lista płatności
     */
    async getPayments(filters = {}) {
        const response = await paymentApi.get('/payments', { params: filters });
        return response.data;
    },

    /**
     * Pobranie szczegółów płatności
     * @param {string} paymentId - ID płatności
     * @returns {Promise<Object>} Dane płatności
     */
    async getPaymentById(paymentId) {
        const response = await paymentApi.get(`/payments/${paymentId}`);
        return response.data;
    },

    /**
     * Utworzenie nowej płatności
     * @param {Object} paymentData - Dane płatności
     * @returns {Promise<Object>} Utworzona płatność
     */
    async createPayment(paymentData) {
        const response = await paymentApi.post('/payments', paymentData);
        return response.data;
    },

    /**
     * Inicjalizacja płatności online
     * @param {string} paymentId - ID płatności
     * @param {string} method - Metoda płatności (card/blik/transfer)
     * @returns {Promise<Object>} Dane do przekierowania
     */
    async initiateOnlinePayment(paymentId, method) {
        const response = await paymentApi.post(`/payments/${paymentId}/initiate`, { method });
        return response.data;
    },

    /**
     * Potwierdzenie płatności (webhook callback)
     * @param {string} paymentId - ID płatności
     * @param {Object} confirmationData - Dane potwierdzenia
     * @returns {Promise<Object>} Potwierdzona płatność
     */
    async confirmPayment(paymentId, confirmationData) {
        const response = await paymentApi.post(`/payments/${paymentId}/confirm`, confirmationData);
        return response.data;
    },

    /**
     * Pobranie listy faktur
     * @param {Object} filters - Filtry
     * @returns {Promise<Array>} Lista faktur
     */
    async getInvoices(filters = {}) {
        const response = await paymentApi.get('/invoices', { params: filters });
        return response.data;
    },

    /**
     * Pobranie faktury PDF
     * @param {string} invoiceId - ID faktury
     * @returns {Promise<Blob>} Plik PDF
     */
    async downloadInvoice(invoiceId) {
        const response = await paymentApi.get(`/invoices/${invoiceId}/download`, {
            responseType: 'blob'
        });
        return response.data;
    },

    /**
     * Pobranie podsumowania finansowego
     * @returns {Promise<Object>} Podsumowanie
     */
    async getFinancialSummary() {
        const response = await paymentApi.get('/payments/summary');
        return response.data;
    },

    /**
     * Pobranie cennika usług
     * @returns {Promise<Array>} Lista usług z cenami
     */
    async getPriceList() {
        const response = await paymentApi.get('/price-list');
        return response.data;
    },

    /**
     * Aktualizacja cennika (admin)
     * @param {Array} priceList - Zaktualizowany cennik
     * @returns {Promise<Array>} Zaktualizowany cennik
     */
    async updatePriceList(priceList) {
        const response = await paymentApi.put('/price-list', { items: priceList });
        return response.data;
    },

    /**
     * Generowanie raportu płatności (admin)
     * @param {Object} filters - Filtry raportu
     * @returns {Promise<Object>} Raport
     */
    async generatePaymentReport(filters) {
        const response = await paymentApi.post('/payments/report', filters);
        return response.data;
    }
};

export default paymentService;
