/**
 * PetCareApp - Serwis autoryzacji
 * @author VS
 */
import { authApi } from './api';

export const authService = {
    async login(email, password, role) {
        const response = await authApi.post('/login', { email, password, role });
        if (response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
    },
    async register(userData) {
        const response = await authApi.post('/register', { ...userData, role: 'client' });
        return response.data;
    },
    async logout() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) await authApi.post('/logout', { refreshToken });
        } catch (e) { console.error('Logout error:', e); }
        finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    },
    async verifyToken(token) {
        try {
            const response = await authApi.get('/verify', { headers: { Authorization: `Bearer ${token}` } });
            const user = response.data.user || response.data;
            if (user) localStorage.setItem('user', JSON.stringify(user));
            return user;
        } catch (error) {
            const savedUser = localStorage.getItem('user');
            if (savedUser) return JSON.parse(savedUser);
            throw error;
        }
    },
    async refreshToken(refreshToken) {
        const response = await authApi.post('/refresh', { refreshToken });
        return response.data;
    },
    async resetPassword(email) { await authApi.post('/reset-password', { email }); },
    async setNewPassword(token, newPassword) { await authApi.post('/set-password', { token, newPassword }); },
    async changePassword(currentPassword, newPassword) { await authApi.post('/change-password', { currentPassword, newPassword }); },
    async updateProfile(updates) {
        const response = await authApi.put('/profile', updates);
        const savedUser = localStorage.getItem('user');
        if (savedUser) localStorage.setItem('user', JSON.stringify({ ...JSON.parse(savedUser), ...response.data }));
        return response.data;
    },
    getCurrentUser() {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    }
};
export default authService;
