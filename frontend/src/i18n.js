/**
 * PetCareApp - Konfiguracja i18next
 * Obsługa tłumaczeń PL/EN
 * @author VS
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import plTranslations from './locales/pl/translation.json';
import enTranslations from './locales/en/translation.json';

// Zasoby językowe - VS
const resources = {
    pl: {
        translation: plTranslations
    },
    en: {
        translation: enTranslations
    }
};

// Inicjalizacja i18next - VS
i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem('language') || 'pl', // Domyślny język: polski
        fallbackLng: 'pl',
        interpolation: {
            escapeValue: false // React sam zabezpiecza przed XSS
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        }
    });

export default i18n;
