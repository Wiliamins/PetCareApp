/**
 * PetCareApp - Kontekst języka
 * Zarządzanie przełączaniem języków PL/EN
 * @author VS
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// Dostępne języki - VS
export const LANGUAGES = {
    PL: 'pl',
    EN: 'en'
};

// Informacje o językach - VS
export const LANGUAGE_INFO = {
    pl: {
        code: 'pl',
        name: 'Polski',
        nativeName: 'Polski',
        flag: '🇵🇱'
    },
    en: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇬🇧'
    }
};

// Tworzenie kontekstu - VS
const LanguageContext = createContext(null);

/**
 * Provider kontekstu języka
 * @param {Object} props - Właściwości komponentu
 * @param {React.ReactNode} props.children - Komponenty dzieci
 */
export function LanguageProvider({ children }) {
    const { i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language || LANGUAGES.PL);

    /**
     * Zmiana języka aplikacji
     * @param {string} lang - Kod języka (pl/en)
     */
    const changeLanguage = useCallback((lang) => {
        if (LANGUAGE_INFO[lang]) {
            i18n.changeLanguage(lang);
            setCurrentLanguage(lang);
            localStorage.setItem('language', lang);
            document.documentElement.lang = lang;
        }
    }, [i18n]);

    /**
     * Przełączenie na drugi dostępny język
     */
    const toggleLanguage = useCallback(() => {
        const newLang = currentLanguage === LANGUAGES.PL ? LANGUAGES.EN : LANGUAGES.PL;
        changeLanguage(newLang);
    }, [currentLanguage, changeLanguage]);

    // Wartość kontekstu - VS
    const value = {
        currentLanguage,
        languageInfo: LANGUAGE_INFO[currentLanguage],
        languages: LANGUAGE_INFO,
        changeLanguage,
        toggleLanguage,
        isPolish: currentLanguage === LANGUAGES.PL,
        isEnglish: currentLanguage === LANGUAGES.EN
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

/**
 * Hook do użycia kontekstu języka
 * @returns {Object} Kontekst języka
 */
export function useLanguage() {
    const context = useContext(LanguageContext);
    
    if (!context) {
        throw new Error('useLanguage musi być użyty wewnątrz LanguageProvider');
    }
    
    return context;
}

export default LanguageContext;
