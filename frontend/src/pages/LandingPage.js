/**
 * PetCareApp - Landing Page
 * Publiczna strona główna aplikacji
 * @author VS
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/common/Button';
import './LandingPage.css';

/**
 * Komponent strony głównej
 */
function LandingPage() {
    const { t } = useTranslation();
    const { toggleLanguage, languageInfo } = useLanguage();

    // Dane statystyk - VS
    const stats = [
        { value: '5000+', label: t('landing.stats.clients') },
        { value: '12000+', label: t('landing.stats.pets') },
        { value: '25', label: t('landing.stats.vets') },
        { value: '15', label: t('landing.stats.years') }
    ];

    // Funkcje aplikacji - VS
    const features = [
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
            ),
            title: t('landing.features.appointments.title'),
            description: t('landing.features.appointments.description')
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>
            ),
            title: t('landing.features.records.title'),
            description: t('landing.features.records.description')
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
            ),
            title: t('landing.features.notifications.title'),
            description: t('landing.features.notifications.description')
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
            ),
            title: t('landing.features.payments.title'),
            description: t('landing.features.payments.description')
        }
    ];

    // Opinie klientów - VS
    const testimonials = [
        {
            name: 'Anna Kowalska',
            pet: 'właścicielka kota Mruczka',
            text: 'Dzięki PetCareApp mogę łatwo umawiać wizyty i mam dostęp do pełnej historii leczenia mojego pupila.',
            avatar: '🐱'
        },
        {
            name: 'Piotr Nowak',
            pet: 'właściciel psa Reksia',
            text: 'Świetna aplikacja! Przypomnienia o szczepieniach są bardzo pomocne.',
            avatar: '🐕'
        },
        {
            name: 'Maria Wiśniewska',
            pet: 'właścicielka królika Puszka',
            text: 'Płatności online oszczędzają czas, a kontakt z weterynarzem jest bardzo prosty.',
            avatar: '🐰'
        }
    ];

    return (
        <div className="landing-page">
            {/* Nawigacja - VS */}
            <nav className="landing-nav">
                <div className="container">
                    <div className="nav-content">
                        <Link to="/" className="nav-logo">
                            <span className="logo-icon">🐾</span>
                            <span className="logo-text">{t('common.appName')}</span>
                        </Link>

                        <div className="nav-links">
                            <a href="#features" className="nav-link">{t('nav.services')}</a>
                            <a href="#about" className="nav-link">{t('nav.about')}</a>
                            <a href="#faq" className="nav-link">{t('nav.faq')}</a>
                            <a href="#contact" className="nav-link">{t('nav.contact')}</a>
                        </div>

                        <div className="nav-actions">
                            <button 
                                className="lang-toggle" 
                                onClick={toggleLanguage}
                                aria-label="Zmień język"
                            >
                                {languageInfo.flag} {languageInfo.code.toUpperCase()}
                            </button>
                            <Link to="/login">
                                <Button variant="outline" size="small">{t('nav.login')}</Button>
                            </Link>
                            <Link to="/register">
                                <Button size="small">{t('nav.register')}</Button>
                            </Link>
                        </div>

                        <button className="mobile-menu-toggle" aria-label="Menu">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section - VS */}
            <section className="hero-section">
                <div className="hero-background">
                    <div className="hero-shape hero-shape-1"></div>
                    <div className="hero-shape hero-shape-2"></div>
                    <div className="hero-shape hero-shape-3"></div>
                </div>
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1 className="hero-title">
                                {t('landing.hero.title')}
                                <span className="hero-title-accent">{t('landing.hero.subtitle')}</span>
                            </h1>
                            <p className="hero-description">
                                {t('landing.hero.description')}
                            </p>
                            <div className="hero-buttons">
                                <Link to="/register">
                                    <Button size="large">{t('landing.hero.cta')}</Button>
                                </Link>
                                <a href="#features">
                                    <Button variant="outline" size="large">
                                        {t('landing.hero.learnMore')}
                                    </Button>
                                </a>
                            </div>
                        </div>
                        <div className="hero-image">
                            <div className="hero-card hero-card-1">
                                <span className="card-icon">📅</span>
                                <span className="card-text">Wizyta: 14:00</span>
                            </div>
                            <div className="hero-card hero-card-2">
                                <span className="card-icon">💉</span>
                                <span className="card-text">Szczepienie za 7 dni</span>
                            </div>
                            <div className="hero-card hero-card-3">
                                <span className="card-icon">✅</span>
                                <span className="card-text">Zdrowy pupil!</span>
                            </div>
                            <div className="hero-pet-illustration">
                                🐕‍🦺
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statystyki - VS */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-item">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Funkcje - VS */}
            <section id="features" className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">{t('landing.features.title')}</h2>
                        <p className="section-subtitle">{t('landing.features.subtitle')}</p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">{feature.icon}</div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Opinie - VS */}
            <section className="testimonials-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">{t('landing.testimonials.title')}</h2>
                        <p className="section-subtitle">{t('landing.testimonials.subtitle')}</p>
                    </div>
                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="testimonial-card">
                                <div className="testimonial-avatar">{testimonial.avatar}</div>
                                <p className="testimonial-text">"{testimonial.text}"</p>
                                <div className="testimonial-author">
                                    <span className="author-name">{testimonial.name}</span>
                                    <span className="author-pet">{testimonial.pet}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section - VS */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">{t('landing.cta.title')}</h2>
                        <p className="cta-description">{t('landing.cta.description')}</p>
                        <Link to="/register">
                            <Button size="large" variant="secondary">
                                {t('landing.cta.button')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer - VS */}
            <footer id="contact" className="landing-footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div className="footer-logo">
                                <span className="logo-icon">🐾</span>
                                <span className="logo-text">{t('common.appName')}</span>
                            </div>
                            <p className="footer-description">
                                {t('landing.footer.description')}
                            </p>
                        </div>

                        <div className="footer-links">
                            <h4 className="footer-heading">{t('landing.footer.quickLinks')}</h4>
                            <ul>
                                <li><a href="#features">{t('nav.services')}</a></li>
                                <li><a href="#about">{t('nav.about')}</a></li>
                                <li><a href="#faq">{t('nav.faq')}</a></li>
                                <li><Link to="/login">{t('nav.login')}</Link></li>
                            </ul>
                        </div>

                        <div className="footer-contact">
                            <h4 className="footer-heading">{t('landing.footer.contact')}</h4>
                            <ul>
                                <li>📍 {t('landing.footer.address')}</li>
                                <li>📞 {t('landing.footer.phone')}</li>
                                <li>✉️ {t('landing.footer.email')}</li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>© 2026 {t('common.appName')}. {t('landing.footer.rights')}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
