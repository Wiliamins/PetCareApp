/**
 * PetCareApp - Serwis API
 * Główny moduł do komunikacji z mikroserwisami backendu
 * @author VS
 */

import axios from 'axios';

// Konfiguracja bazowych URL dla mikroserwisów - VS
const API_BASE = process.env.REACT_APP_API_URL || 'http://13.62.204.234';

const API_CONFIG = {
  AUTH_SERVICE: `${API_BASE}/api/v1/auth`,
  USER_SERVICE: `${API_BASE}/api/v1/users`,
  MEDICAL_SERVICE: `${API_BASE}/api/v1/records`,
  APPOINTMENT_SERVICE: `${API_BASE}/api/v1/appointments`,
  NOTIFICATION_SERVICE: `${API_BASE}/api/v1/notifications`,
  PAYMENT_SERVICE: `${API_BASE}/api/v1/payments`,
  REPORT_SERVICE: `${API_BASE}/api/v1/reports`,
  ANALYTICS_SERVICE: `${API_BASE}/api/v1/system`,
  AUDIT_SERVICE: `${API_BASE}/api/v1/logs`,
  DRUG_SERVICE: `${API_BASE}/api/v1/drug`,
  DISEASE_ALERT_SERVICE: `${API_BASE}/api/v1/disease-alerts`,
  PET_SERVICE: `${API_BASE}/api/v1/pets`,
  DRUG_INFO_SERVICE: `${API_BASE}/api/v1/drugs`,
};


/**
 * Tworzenie instancji axios z konfiguracją
 * @param {string} baseURL - Bazowy URL mikroserwisu
 * @returns {AxiosInstance} Skonfigurowana instancja axios
 */
const createApiInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    // Interceptor dla requestów - dodawanie tokena - VS
    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            
            // Dodanie języka - VS
            const language = localStorage.getItem('language') || 'pl';
            config.headers['Accept-Language'] = language;
            
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Interceptor dla odpowiedzi - obsługa błędów i refresh token - VS
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // Jeśli błąd 401 i nie jest to retry - próbuj odświeżyć token - VS
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken) {
                        const response = await axios.post(
                            `${API_CONFIG.AUTH_SERVICE}/auth/refresh`,
                            { refreshToken }
                        );

                        const { accessToken } = response.data;
                        localStorage.setItem('accessToken', accessToken);

                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        return instance(originalRequest);
                    }
                } catch (refreshError) {
                    // Jeśli refresh się nie powiódł - wyloguj - VS
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }

            // Formatowanie błędu - VS
            const formattedError = {
                status: error.response?.status,
                message: error.response?.data?.message || error.message,
                code: error.response?.data?.code,
                details: error.response?.data?.details
            };

            return Promise.reject(formattedError);
        }
    );

    return instance;
};

// Instancje API dla każdego mikroserwisu - VS
export const authApi = createApiInstance(API_CONFIG.AUTH_SERVICE);
export const userApi = createApiInstance(API_CONFIG.USER_SERVICE);
export const medicalApi = createApiInstance(API_CONFIG.MEDICAL_SERVICE);
export const appointmentApi = createApiInstance(API_CONFIG.APPOINTMENT_SERVICE);
export const notificationApi = createApiInstance(API_CONFIG.NOTIFICATION_SERVICE);
export const paymentApi = createApiInstance(API_CONFIG.PAYMENT_SERVICE);
export const reportApi = createApiInstance(API_CONFIG.REPORT_SERVICE);
export const analyticsApi = createApiInstance(API_CONFIG.ANALYTICS_SERVICE);
export const auditApi = createApiInstance(API_CONFIG.AUDIT_SERVICE);
export const drugApi = createApiInstance(API_CONFIG.DRUG_SERVICE);
export const diseaseAlertApi = createApiInstance(API_CONFIG.DISEASE_ALERT_SERVICE);
export const petApi = createApiInstance(API_CONFIG.PET_SERVICE);
export const drugInfoApi = createApiInstance(API_CONFIG.DRUG_INFO_SERVICE);

// Export konfiguracji - VS
export { API_CONFIG };

// Domyślny eksport z wszystkimi instancjami - VS
export default {
    auth: authApi,
    user: userApi,
    medical: medicalApi,
    appointment: appointmentApi,
    notification: notificationApi,
    payment: paymentApi,
    report: reportApi,
    analytics: analyticsApi,
    audit: auditApi,
    drug: drugApi,
    diseaseAlert: diseaseAlertApi
};
