/**
 * PetCareApp - Kontekst autoryzacji
 * @author VS
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const savedUser = localStorage.getItem('user');
                if (token) {
                    try {
                        const userData = await authService.verifyToken(token);
                        setUser(userData);
                    } catch (err) {
                        if (savedUser) setUser(JSON.parse(savedUser));
                        else { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); }
                    }
                } else if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
            } catch (err) {
                console.error('Auth check error:', err);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = useCallback(async (email, password, role) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authService.login(email, password, role);
            if (response.accessToken) localStorage.setItem('accessToken', response.accessToken);
            if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
            const userData = response.user || { email, role, firstName: email.split('@')[0], lastName: '' };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return userData;
        } catch (err) {
            const errorMessage = err.message || 'Błąd logowania';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (userData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authService.register(userData);
            return response;
        } catch (err) {
            setError(err.message || 'Błąd rejestracji');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try { await authService.logout(); } catch (err) { console.error('Logout error:', err); }
        finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
        }
    }, []);

    const resetPassword = useCallback(async (email) => {
        setIsLoading(true);
        setError(null);
        try { await authService.resetPassword(email); }
        catch (err) { setError(err.message); throw err; }
        finally { setIsLoading(false); }
    }, []);

    const updateUser = useCallback(async (updates) => {
        try {
            const updatedUser = await authService.updateProfile(updates);
            setUser(prev => ({ ...prev, ...updatedUser }));
            return updatedUser;
        } catch (err) { setError(err.message); throw err; }
    }, []);

    const value = {
        user, isLoading, error, isAuthenticated: !!user,
        login, register, logout, resetPassword, updateUser,
        clearError: () => setError(null)
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth musi być użyty wewnątrz AuthProvider');
    return context;
}

export default AuthContext;
