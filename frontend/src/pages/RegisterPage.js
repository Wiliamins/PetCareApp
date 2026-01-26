/**
 * PetCareApp - Strona rejestracji
 * Formularz rejestracji nowego klienta
 * @author VS
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './AuthPages.css';

/**
 * Komponent strony rejestracji
 */
function RegisterPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { register } = useAuth();
    const { showError, showSuccess } = useNotification();
    const { toggleLanguage, languageInfo } = useLanguage();

    // Stan formularza - VS
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // Obsługa zmiany pól - VS
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Walidacja formularza - VS
    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'Imię jest wymagane';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Nazwisko jest wymagane';
        }

        if (!formData.email) {
            newErrors.email = t('auth.errors.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Nieprawidłowy format adresu e-mail';
        }

        if (!formData.phone) {
            newErrors.phone = 'Numer telefonu jest wymagany';
        } else if (!/^[+]?[\d\s-]{9,}$/.test(formData.phone)) {
            newErrors.phone = 'Nieprawidłowy format numeru telefonu';
        }

        if (!formData.password) {
            newErrors.password = t('auth.errors.passwordRequired');
        } else if (formData.password.length < 8) {
            newErrors.password = t('auth.errors.weakPassword');
        } else if (!/(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = t('auth.errors.weakPassword');
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t('auth.errors.passwordMismatch');
        }

        if (!formData.acceptTerms) {
            newErrors.acceptTerms = t('auth.errors.termsRequired');
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
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });

            showSuccess(t('auth.register.success'));
            navigate('/login', { state: { registered: true } });
        } catch (error) {
            if (error.message.includes('exists')) {
                showError(t('auth.errors.emailExists'));
            } else {
                showError(error.message || 'Wystąpił błąd podczas rejestracji');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Siła hasła - VS
    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return { level: 0, label: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const levels = [
            { level: 0, label: '' },
            { level: 1, label: 'Bardzo słabe', color: '#dc3545' },
            { level: 2, label: 'Słabe', color: '#fd7e14' },
            { level: 3, label: 'Średnie', color: '#ffc107' },
            { level: 4, label: 'Dobre', color: '#20c997' },
            { level: 5, label: 'Bardzo dobre', color: '#28a745' }
        ];

        return levels[strength];
    };

    const passwordStrength = getPasswordStrength();

    return (
        <div className="auth-page">
            {/* Tło z dekoracjami - VS */}
            <div className="auth-background">
                <div className="auth-shape auth-shape-1"></div>
                <div className="auth-shape auth-shape-2"></div>
            </div>

            {/* Panel boczny - VS */}
            <div className="auth-sidebar auth-sidebar-register">
                <div className="sidebar-content">
                    <Link to="/" className="auth-logo">
                        <span className="logo-icon">🐾</span>
                        <span className="logo-text">{t('common.appName')}</span>
                    </Link>
                    <div className="sidebar-illustration">
                        <div className="illustration-pet">🐕</div>
                        <div className="illustration-pet illustration-pet-2">🐈</div>
                        <div className="illustration-pet illustration-pet-3">🐰</div>
                    </div>
                    <h2 className="sidebar-title">Dołącz do nas!</h2>
                    <p className="sidebar-description">
                        Zarejestruj się i zacznij korzystać z pełnych możliwości systemu opieki weterynaryjnej.
                    </p>
                    <ul className="sidebar-features">
                        <li>✓ Rezerwacja wizyt online 24/7</li>
                        <li>✓ Pełna historia medyczna</li>
                        <li>✓ Przypomnienia o szczepieniach</li>
                        <li>✓ Bezpieczne płatności</li>
                    </ul>
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

                <div className="auth-form-container auth-form-register">
                    <div className="auth-form-header">
                        <h1 className="auth-title">{t('auth.register.title')}</h1>
                        <p className="auth-subtitle">{t('auth.register.subtitle')}</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <Input
                                type="text"
                                name="firstName"
                                label={t('auth.register.firstName')}
                                value={formData.firstName}
                                onChange={handleChange}
                                error={errors.firstName}
                                placeholder="Jan"
                                required
                            />
                            <Input
                                type="text"
                                name="lastName"
                                label={t('auth.register.lastName')}
                                value={formData.lastName}
                                onChange={handleChange}
                                error={errors.lastName}
                                placeholder="Kowalski"
                                required
                            />
                        </div>

                        <Input
                            type="email"
                            name="email"
                            label={t('auth.register.email')}
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            placeholder="jan.kowalski@email.pl"
                            required
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                            }
                        />

                        <Input
                            type="tel"
                            name="phone"
                            label={t('auth.register.phone')}
                            value={formData.phone}
                            onChange={handleChange}
                            error={errors.phone}
                            placeholder="+48 123 456 789"
                            required
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                            }
                        />

                        <div className="password-field-wrapper">
                            <Input
                                type="password"
                                name="password"
                                label={t('auth.register.password')}
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password}
                                placeholder="Minimum 8 znaków"
                                required
                                icon={
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                }
                            />
                            {formData.password && (
                                <div className="password-strength">
                                    <div className="strength-bars">
                                        {[1, 2, 3, 4, 5].map(level => (
                                            <div
                                                key={level}
                                                className={`strength-bar ${level <= passwordStrength.level ? 'active' : ''}`}
                                                style={{ backgroundColor: level <= passwordStrength.level ? passwordStrength.color : undefined }}
                                            />
                                        ))}
                                    </div>
                                    <span className="strength-label" style={{ color: passwordStrength.color }}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                            )}
                        </div>

                        <Input
                            type="password"
                            name="confirmPassword"
                            label={t('auth.register.confirmPassword')}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={errors.confirmPassword}
                            placeholder="Powtórz hasło"
                            required
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                            }
                        />

                        <div className="form-options">
                            <label className={`checkbox-label ${errors.acceptTerms ? 'has-error' : ''}`}>
                                <input
                                    type="checkbox"
                                    name="acceptTerms"
                                    checked={formData.acceptTerms}
                                    onChange={handleChange}
                                />
                                <span className="checkbox-custom"></span>
                                {t('auth.register.terms')}
                            </label>
                            {errors.acceptTerms && (
                                <span className="checkbox-error">{errors.acceptTerms}</span>
                            )}
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="large"
                            loading={isLoading}
                        >
                            {t('auth.register.submit')}
                        </Button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            {t('auth.register.hasAccount')}{' '}
                            <Link to="/login">{t('auth.register.login')}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
