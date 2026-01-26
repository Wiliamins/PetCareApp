/**
 * PetCareApp - Główny plik wejściowy aplikacji
 * Inicjalizacja React, i18n oraz providery kontekstu
 * @author VS
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import './i18n';
import './styles/global.css';

// Inicjalizacja głównego elementu DOM - VS
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <LanguageProvider>
                <AuthProvider>
                    <NotificationProvider>
                        <App />
                    </NotificationProvider>
                </AuthProvider>
            </LanguageProvider>
        </BrowserRouter>
    </React.StrictMode>
);
