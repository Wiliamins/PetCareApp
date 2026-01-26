/**
 * PetCareApp - Layout Dashboardu
 * Wspólny layout dla wszystkich dashboardów
 * @author VS
 */

import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import './DashboardLayout.css';

/**
 * Komponent layoutu dashboardu
 * @param {Object} props - Właściwości
 * @param {React.ReactNode} props.children - Zawartość dashboardu
 * @param {Array} props.menuItems - Elementy menu
 * @param {string} props.title - Tytuł dashboardu
 * @param {string} props.roleColor - Kolor roli
 */
function DashboardLayout({ children, menuItems, title, roleColor = 'var(--color-primary)' }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { unreadCount } = useNotification();
    const { toggleLanguage, languageInfo } = useLanguage();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // Wylogowanie - VS
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className={`dashboard-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
            {/* Sidebar - VS */}
            <aside className="dashboard-sidebar" style={{ '--role-color': roleColor }}>
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-logo">
                        <span className="logo-icon">🐾</span>
                        {sidebarOpen && <span className="logo-text">{t('common.appName')}</span>}
                    </Link>
                    <button 
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label={sidebarOpen ? 'Zwiń menu' : 'Rozwiń menu'}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {sidebarOpen ? (
                                <polyline points="11 17 6 12 11 7"/>
                            ) : (
                                <polyline points="9 17 14 12 9 7"/>
                            )}
                        </svg>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        {menuItems.map((item, index) => (
                            <li key={index} className="nav-item">
                                <NavLink 
                                    to={item.path} 
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                    end={item.exact}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    {sidebarOpen && (
                                        <>
                                            <span className="nav-label">{item.label}</span>
                                            {item.badge && (
                                                <span className="nav-badge">{item.badge}</span>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button 
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        {sidebarOpen && <span>{t('nav.logout')}</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content - VS */}
            <div className="dashboard-main">
                {/* Header - VS */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <button 
                            className="mobile-menu-btn"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12"/>
                                <line x1="3" y1="6" x2="21" y2="6"/>
                                <line x1="3" y1="18" x2="21" y2="18"/>
                            </svg>
                        </button>
                        <h1 className="header-title">{title}</h1>
                    </div>

                    <div className="header-right">
                        {/* Przełącznik języka - VS */}
                        <button 
                            className="header-btn lang-btn"
                            onClick={toggleLanguage}
                            aria-label="Zmień język"
                        >
                            {languageInfo.flag}
                        </button>

                        {/* Powiadomienia - VS */}
                        <button className="header-btn notification-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                            </svg>
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </button>

                        {/* Menu użytkownika - VS */}
                        <div className="user-menu-container">
                            <button 
                                className="user-menu-trigger"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <div className="user-avatar">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </div>
                                <div className="user-info">
                                    <span className="user-name">
                                        {user?.firstName} {user?.lastName}
                                    </span>
                                    <span className="user-role">
                                        {t(`auth.login.roles.${user?.role}`)}
                                    </span>
                                </div>
                                <svg className="user-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </button>

                            {userMenuOpen && (
                                <div className="user-menu-dropdown">
                                    <button className="dropdown-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        Mój profil
                                    </button>
                                    <button className="dropdown-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="3"/>
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                                        </svg>
                                        Ustawienia
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item logout" onClick={handleLogout}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                            <polyline points="16 17 21 12 16 7"/>
                                            <line x1="21" y1="12" x2="9" y2="12"/>
                                        </svg>
                                        {t('nav.logout')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content - VS */}
                <main className="dashboard-content">
                    {children}
                </main>
            </div>

            {/* Mobile overlay - VS */}
            {sidebarOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}

export default DashboardLayout;
