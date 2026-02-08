/**
 * PetCareApp - Serwis API
 * Główny moduł do komunikacji z mikroserwisami backendu
 * @author VS
 */

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://13.62.204.234';

const API_CONFIG = {
  AUTH_SERVICE: `${API_BASE}/api/v1/auth`,
  USER_SERVICE: `${API_BASE}/api/v1/users`,
  PET_SERVICE: `${API_BASE}/api/v1/pets`,
  MEDICAL_SERVICE: `${API_BASE}/api/v1/records`,
  APPOINTMENT_SERVICE: `${API_BASE}/api/v1/appointments`,
  NOTIFICATION_SERVICE: `${API_BASE}/api/v1/notifications`,
  PAYMENT_SERVICE: `${API_BASE}/api/v1/payments`,
  REPORT_SERVICE: `${API_BASE}/api/v1/reports`,
  ANALYTICS_SERVICE: `${API_BASE}/api/v1/system`,
  AUDIT_SERVICE: `${API_BASE}/api/v1/logs`,
  DRUG_SERVICE: `${API_BASE}/api/v1/prescriptions`,
  DRUG_INFO_SERVICE: `${API_BASE}/api/v1/drugs`,
  DISEASE_ALERT_SERVICE: `${API_BASE}/api/v1/disease-alerts`,
};

const createApiInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
        timeout: 30000,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });

    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('accessToken');
            if (token) config.headers.Authorization = `Bearer ${token}`;
            config.headers['Accept-Language'] = localStorage.getItem('language') || 'pl';
            return config;
        },
        (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken) {
                        const response = await axios.post(`${API_CONFIG.AUTH_SERVICE}/refresh`, { refreshToken });
                        localStorage.setItem('accessToken', response.data.accessToken);
                        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                        return instance(originalRequest);
                    }
                } catch (refreshError) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }
            return Promise.reject({
                status: error.response?.status,
                message: error.response?.data?.message || error.response?.data?.error || error.message,
            });
        }
    );
    return instance;
};

export const authApi = createApiInstance(API_CONFIG.AUTH_SERVICE);
export const userApi = createApiInstance(API_CONFIG.USER_SERVICE);
export const petApi = createApiInstance(API_CONFIG.PET_SERVICE);
export const medicalApi = createApiInstance(API_CONFIG.MEDICAL_SERVICE);
export const appointmentApi = createApiInstance(API_CONFIG.APPOINTMENT_SERVICE);
export const notificationApi = createApiInstance(API_CONFIG.NOTIFICATION_SERVICE);
export const paymentApi = createApiInstance(API_CONFIG.PAYMENT_SERVICE);
export const reportApi = createApiInstance(API_CONFIG.REPORT_SERVICE);
export const analyticsApi = createApiInstance(API_CONFIG.ANALYTICS_SERVICE);
export const auditApi = createApiInstance(API_CONFIG.AUDIT_SERVICE);
export const drugApi = createApiInstance(API_CONFIG.DRUG_SERVICE);
export const drugInfoApi = createApiInstance(API_CONFIG.DRUG_INFO_SERVICE);
export const diseaseAlertApi = createApiInstance(API_CONFIG.DISEASE_ALERT_SERVICE);

export { API_CONFIG, API_BASE };
export default { auth: authApi, user: userApi, pet: petApi, medical: medicalApi, appointment: appointmentApi, notification: notificationApi, payment: paymentApi, report: reportApi, analytics: analyticsApi, audit: auditApi, drug: drugApi, drugInfo: drugInfoApi, diseaseAlert: diseaseAlertApi };
