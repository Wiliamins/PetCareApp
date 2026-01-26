/**
 * PetCareApp - Strona resetowania hasła
 * Formularz do resetowania hasła
 * @author VS
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './AuthPages.css';

/**
 * Komponent strony resetowania hasła
 */
function ForgotPasswordPage() {
    const { t } = useTranslation();
    const { resetPassword } = useAuth();
    const { showError, showSuccess } = useNotification();
    const { toggleLanguage, languageInfo } = useLanguage();

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Obsługa wysłania - VS
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setError(t('auth.errors.emailRequired'));
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Nieprawidłowy format adresu e-mail');
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword(email);
            setIsSubmitted(true);
            showSuccess(t('auth.forgotPassword.success'));
        } catch (err) {
            showError(err.message || 'Wystąpił błąd');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page auth-page-simple">
            <div className="auth-background">
                <div className="auth-shape auth-shape-1"></div>
                <div className="auth-shape auth-shape-2"></div>
            </div>

            <div className="auth-content auth-content-centered">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <span className="logo-icon">🐾</span>
                        <span className="logo-text">{t('common.appName')}</span>
                    </Link>
                    <button 
                        className="lang-toggle" 
                        onClick={toggleLanguage}
                    >
                        {languageInfo.flag} {languageInfo.code.toUpperCase()}
                    </button>
                </div>

                <div className="auth-form-container auth-form-simple">
                    {!isSubmitted ? (
                        <>
                            <div className="auth-form-header">
                                <div className="auth-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                </div>
                                <h1 className="auth-title">{t('auth.forgotPassword.title')}</h1>
                                <p className="auth-subtitle">{t('auth.forgotPassword.subtitle')}</p>
                            </div>

                            <form className="auth-form" onSubmit={handleSubmit}>
                                <Input
                                    type="email"
                                    name="email"
                                    label={t('auth.forgotPassword.email')}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError('');
                                    }}
                                    error={error}
                                    placeholder="twoj@email.pl"
                                    required
                                    icon={
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                            <polyline points="22,6 12,13 2,6"/>
                                        </svg>
                                    }
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    size="large"
                                    loading={isLoading}
                                >
                                    {t('auth.forgotPassword.submit')}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="auth-success">
                            <div className="success-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                            </div>
                            <h2 className="success-title">E-mail wysłany!</h2>
                            <p className="success-message">
                                Sprawdź swoją skrzynkę pocztową. Wysłaliśmy link do resetowania hasła na adres <strong>{email}</strong>.
                            </p>
                            <p className="success-note">
                                Jeśli nie widzisz e-maila, sprawdź folder spam.
                            </p>
                        </div>
                    )}

                    <div className="auth-footer">
                        <Link to="/login" className="back-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12"/>
                                <polyline points="12 19 5 12 12 5"/>
                            </svg>
                            {t('auth.forgotPassword.backToLogin')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;
