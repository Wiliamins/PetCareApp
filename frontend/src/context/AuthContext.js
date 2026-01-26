/**
 * PetCareApp - Kontekst autoryzacji
 * Zarządzanie stanem użytkownika, logowanie, wylogowanie, rejestracja
 * @author VS
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

// Tworzenie kontekstu - VS
const AuthContext = createContext(null);

/**
 * Provider kontekstu autoryzacji
 * @param {Object} props - Właściwości komponentu
 * @param {React.ReactNode} props.children - Komponenty dzieci
 */
export function AuthProvider({ children }) {
    // Stan użytkownika - VS
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sprawdzenie sesji przy starcie aplikacji - VS
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    const userData = await authService.verifyToken(token);
                    setUser(userData);
                }
            } catch (err) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                console.error('Błąd weryfikacji tokena:', err);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    /**
     * Logowanie użytkownika
     * @param {string} email - Adres email
     * @param {string} password - Hasło
     * @param {string} role - Rola użytkownika
     */
    const login = useCallback(async (email, password, role) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.login(email, password, role);
            
            // Zapisanie tokenów - VS
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            
            setUser(response.user);
            return response.user;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Rejestracja nowego użytkownika (tylko klient)
     * @param {Object} userData - Dane rejestracyjne
     */
    const register = useCallback(async (userData) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.register(userData);
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Wylogowanie użytkownika
     */
    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch (err) {
            console.error('Błąd wylogowania:', err);
        } finally {
            // Zawsze czyścimy stan lokalny - VS
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
        }
    }, []);

    /**
     * Resetowanie hasła
     * @param {string} email - Adres email
     */
    const resetPassword = useCallback(async (email) => {
        setIsLoading(true);
        setError(null);

        try {
            await authService.resetPassword(email);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Aktualizacja danych użytkownika
     * @param {Object} updates - Dane do aktualizacji
     */
    const updateUser = useCallback(async (updates) => {
        try {
            const updatedUser = await authService.updateProfile(updates);
            setUser(prev => ({ ...prev, ...updatedUser }));
            return updatedUser;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Wartość kontekstu - VS
    const value = {
        user,
        isLoading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        resetPassword,
        updateUser,
        clearError: () => setError(null)
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook do użycia kontekstu autoryzacji
 * @returns {Object} Kontekst autoryzacji
 */
export function useAuth() {
    const context = useContext(AuthContext);
    
    if (!context) {
        throw new Error('useAuth musi być użyty wewnątrz AuthProvider');
    }
    
    return context;
}

export default AuthContext;
