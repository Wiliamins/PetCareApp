/**
 * PetCareApp - Strona logowania
 * Formularz logowania z wyborem roli
 * @author VS
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './AuthPages.css';

/**
 * Komponent strony logowania
 */
function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { showError, showSuccess } = useNotification();
    const { toggleLanguage, languageInfo } = useLanguage();

    // Stan formularza - VS
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'client'
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showRoleSelector, setShowRoleSelector] = useState(false);

    // Role użytkowników - VS
    const roles = [
        { id: 'client', label: t('auth.login.roles.client'), icon: '👤', color: '#2d7a5e' },
        { id: 'vet', label: t('auth.login.roles.vet'), icon: '👨‍⚕️', color: '#3498db' },
        { id: 'admin', label: t('auth.login.roles.admin'), icon: '⚙️', color: '#9b59b6' },
        { id: 'it', label: t('auth.login.roles.it'), icon: '💻', color: '#e74c3c' }
    ];

    // Obsługa zmiany pól - VS
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Czyszczenie błędu przy edycji - VS
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Wybór roli - VS
    const handleRoleSelect = (roleId) => {
        setFormData(prev => ({ ...prev, role: roleId }));
        setShowRoleSelector(false);
    };

    // Walidacja formularza - VS
    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = t('auth.errors.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Nieprawidłowy format adresu e-mail';
        }

        if (!formData.password) {
            newErrors.password = t('auth.errors.passwordRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Obsługa wysłania formularza - VS
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await login(formData.email, formData.password, formData.role);
            showSuccess('Zalogowano pomyślnie!');
            
            // Przekierowanie do dashboardu - VS
            const from = location.state?.from?.pathname || `/dashboard/${formData.role}`;
            navigate(from, { replace: true });
        } catch (error) {
            showError(error.message || t('auth.errors.invalidCredentials'));
        } finally {
            setIsLoading(false);
        }
    };

    const selectedRole = roles.find(r => r.id === formData.role);

    return (
        <div className="auth-page">
            {/* Tło z dekoracjami - VS */}
            <div className="auth-background">
                <div className="auth-shape auth-shape-1"></div>
                <div className="auth-shape auth-shape-2"></div>
            </div>

            {/* Panel boczny - VS */}
            <div className="auth-sidebar">
                <div className="sidebar-content">
                    <Link to="/" className="auth-logo">
                        <span className="logo-icon">🐾</span>
                        <span className="logo-text">{t('common.appName')}</span>
                    </Link>
                    <div className="sidebar-illustration">
                        <div className="illustration-pet">🐕</div>
                        <div className="illustration-pet illustration-pet-2">🐈</div>
                    </div>
                    <h2 className="sidebar-title">Witaj z powrotem!</h2>
                    <p className="sidebar-description">
                        Zaloguj się aby zarządzać wizytami, dokumentacją medyczną i pozostać w kontakcie z kliniką.
                    </p>
                </div>
            </div>

            {/* Formularz - VS */}
            <div className="auth-content">
                <div className="auth-header">
                    <button 
                        className="lang-toggle" 
                        onClick={toggleLanguage}
                        aria-label="Zmień język"
                    >
                        {languageInfo.flag} {languageInfo.code.toUpperCase()}
                    </button>
                </div>

                <div className="auth-form-container">
                    <div className="auth-form-header">
                        <h1 className="auth-title">{t('auth.login.title')}</h1>
                        <p className="auth-subtitle">{t('auth.login.subtitle')}</p>
                    </div>

                    {/* Wybór roli - VS */}
                    <div className="role-selector">
                        <label className="role-label">{t('auth.login.selectRole')}</label>
                        <button 
                            type="button"
                            className="role-trigger"
                            onClick={() => setShowRoleSelector(!showRoleSelector)}
                            style={{ borderColor: selectedRole.color }}
                        >
                            <span className="role-icon">{selectedRole.icon}</span>
                            <span className="role-name">{selectedRole.label}</span>
                            <svg className="role-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {showRoleSelector && (
                            <div className="role-dropdown">
                                {roles.map(role => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        className={`role-option ${formData.role === role.id ? 'active' : ''}`}
                                        onClick={() => handleRoleSelect(role.id)}
                                    >
                                        <span className="role-icon">{role.icon}</span>
                                        <span className="role-name">{role.label}</span>
                                        {formData.role === role.id && (
                                            <svg className="role-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <Input
                            type="email"
                            name="email"
                            label={t('auth.login.email')}
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            placeholder="twoj@email.pl"
                            required
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                            }
                        />

                        <Input
                            type="password"
                            name="password"
                            label={t('auth.login.password')}
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                            placeholder="••••••••"
                            required
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                            }
                        />

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input type="checkbox" name="rememberMe" />
                                <span className="checkbox-custom"></span>
                                {t('auth.login.rememberMe')}
                            </label>
                            <Link to="/forgot-password" className="forgot-link">
                                {t('auth.login.forgotPassword')}
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="large"
                            loading={isLoading}
                        >
                            {t('auth.login.submit')}
                        </Button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            {t('auth.login.noAccount')}{' '}
                            <Link to="/register">{t('auth.login.register')}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
