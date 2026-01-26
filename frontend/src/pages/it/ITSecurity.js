/**
 * PetCareApp - ITSecurity - Bezpieczeństwo
 * @author VS
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import '../dashboards/DashboardPages.css';
import './ITPages.css';

function ITSecurity() {
    const { t } = useTranslation();

    const menuItems = [
        { path: '/dashboard/it', label: t('dashboard.it.overview'), icon: '📊', exact: true },
        { path: '/dashboard/it/status', label: t('dashboard.it.status'), icon: '🖥️' },
        { path: '/dashboard/it/logs', label: t('dashboard.it.logs'), icon: '📋' },
        { path: '/dashboard/it/monitoring', label: t('dashboard.it.monitoring'), icon: '📈' },
        { path: '/dashboard/it/security', label: t('dashboard.it.security'), icon: '🔒' },
        { path: '/dashboard/it/infrastructure', label: t('dashboard.it.infrastructure'), icon: '🏗️' }
    ];

    const securityChecks = [
        { icon: '🔒', title: 'SSL/TLS', status: 'pass', detail: 'Certificate valid until 2025-06-15' },
        { icon: '🔑', title: 'JWT Tokens', status: 'pass', detail: 'Properly signed and validated' },
        { icon: '🛡️', title: 'CORS Policy', status: 'pass', detail: 'Configured for allowed origins' },
        { icon: '🔐', title: 'Database Encryption', status: 'pass', detail: 'AES-256 encryption active' },
        { icon: '📝', title: 'Audit Logging', status: 'pass', detail: 'All actions logged' },
        { icon: '⚠️', title: 'Rate Limiting', status: 'warning', detail: 'Consider increasing limits' }
    ];

    const recentEvents = [
        { time: '14:30', event: 'Failed login attempt', ip: '192.168.1.100', severity: 'warning' },
        { time: '14:25', event: 'Password changed', ip: '10.0.0.50', severity: 'info' },
        { time: '14:20', event: 'New user registered', ip: '172.16.0.25', severity: 'info' },
        { time: '14:15', event: 'API rate limit reached', ip: '192.168.1.200', severity: 'warning' }
    ];

    return (
        <DashboardLayout menuItems={menuItems} title="Bezpieczeństwo" roleColor="#e67e22">
            <div className="dashboard-page">
                <div className="system-overview">
                    <Card variant="flat" className="overview-card success"><div className="overview-number">5</div><div className="overview-label">Checks Passed</div></Card>
                    <Card variant="flat" className="overview-card warning"><div className="overview-number">1</div><div className="overview-label">Warnings</div></Card>
                    <Card variant="flat" className="overview-card"><div className="overview-number">0</div><div className="overview-label">Critical Issues</div></Card>
                    <Card variant="flat" className="overview-card"><div className="overview-number">24</div><div className="overview-label">Events Today</div></Card>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <Card title="🔒 Security Checks">
                        {securityChecks.map((check, idx) => (
                            <div key={idx} className="security-item">
                                <div className="security-icon">{check.icon}</div>
                                <div className="security-info">
                                    <div className="security-title">{check.title}</div>
                                    <div className="security-status">{check.detail}</div>
                                </div>
                                <span className={`status-badge ${check.status === 'pass' ? 'success' : 'warning'}`}>
                                    {check.status === 'pass' ? '✅ Pass' : '⚠️ Warning'}
                                </span>
                            </div>
                        ))}
                    </Card>

                    <Card title="📋 Recent Security Events">
                        {recentEvents.map((event, idx) => (
                            <div key={idx} className="security-item">
                                <span className="log-time">{event.time}</span>
                                <div className="security-info">
                                    <div className="security-title">{event.event}</div>
                                    <div className="security-status">IP: {event.ip}</div>
                                </div>
                                <span className={`status-badge ${event.severity === 'warning' ? 'warning' : 'success'}`}>
                                    {event.severity}
                                </span>
                            </div>
                        ))}
                        <Button variant="ghost" fullWidth style={{ marginTop: 'var(--space-3)' }}>View All Events</Button>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default ITSecurity;
