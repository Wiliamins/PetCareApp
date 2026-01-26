/**
 * PetCareApp - ITSystemStatus - Status systemu
 * @author VS
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../dashboards/DashboardPages.css';
import './ITPages.css';

function ITSystemStatus() {
    const { t } = useTranslation();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const menuItems = [
        { path: '/dashboard/it', label: t('dashboard.it.overview'), icon: '📊', exact: true },
        { path: '/dashboard/it/status', label: t('dashboard.it.status'), icon: '🖥️' },
        { path: '/dashboard/it/logs', label: t('dashboard.it.logs'), icon: '📋' },
        { path: '/dashboard/it/monitoring', label: t('dashboard.it.monitoring'), icon: '📈' },
        { path: '/dashboard/it/security', label: t('dashboard.it.security'), icon: '🔒' },
        { path: '/dashboard/it/infrastructure', label: t('dashboard.it.infrastructure'), icon: '🏗️' }
    ];

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setServices([
                { name: 'Auth Service', port: 8001, status: 'healthy', uptime: '99.9%', cpu: '12%', memory: '256MB', lastCheck: '10s ago' },
                { name: 'User Service', port: 8002, status: 'healthy', uptime: '99.8%', cpu: '8%', memory: '312MB', lastCheck: '10s ago' },
                { name: 'Medical Records', port: 8003, status: 'healthy', uptime: '99.9%', cpu: '15%', memory: '428MB', lastCheck: '10s ago' },
                { name: 'Appointment Service', port: 8004, status: 'healthy', uptime: '99.7%', cpu: '22%', memory: '384MB', lastCheck: '10s ago' },
                { name: 'Notification Service', port: 8005, status: 'warning', uptime: '98.5%', cpu: '45%', memory: '512MB', lastCheck: '10s ago' },
                { name: 'Payment Service', port: 8006, status: 'healthy', uptime: '99.9%', cpu: '5%', memory: '198MB', lastCheck: '10s ago' },
                { name: 'Report Service', port: 8007, status: 'healthy', uptime: '99.6%', cpu: '18%', memory: '356MB', lastCheck: '10s ago' },
                { name: 'Analytics Service', port: 8008, status: 'healthy', uptime: '99.4%', cpu: '35%', memory: '624MB', lastCheck: '10s ago' },
                { name: 'DynamoDB Local', port: 8000, status: 'healthy', uptime: '99.9%', cpu: '28%', memory: '1.2GB', lastCheck: '10s ago' },
                { name: 'Redis Cache', port: 6379, status: 'healthy', uptime: '99.9%', cpu: '3%', memory: '128MB', lastCheck: '10s ago' },
                { name: 'Kafka', port: 9092, status: 'healthy', uptime: '99.8%', cpu: '15%', memory: '768MB', lastCheck: '10s ago' }
            ]);
            setLoading(false);
        }, 500);
    }, []);

    const getStatusBadge = (status) => ({
        healthy: { label: '✅ Healthy', class: 'success' },
        warning: { label: '⚠️ Warning', class: 'warning' },
        error: { label: '❌ Error', class: 'danger' },
        offline: { label: '⬛ Offline', class: 'muted' }
    }[status] || { label: status, class: '' });

    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const warningCount = services.filter(s => s.status === 'warning').length;

    if (loading) return <DashboardLayout menuItems={menuItems} title="Status systemu" roleColor="#e67e22"><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout menuItems={menuItems} title="Status systemu" roleColor="#e67e22">
            <div className="dashboard-page">
                <div className="system-overview">
                    <Card variant="flat" className="overview-card success"><div className="overview-number">{healthyCount}</div><div className="overview-label">Healthy</div></Card>
                    <Card variant="flat" className="overview-card warning"><div className="overview-number">{warningCount}</div><div className="overview-label">Warning</div></Card>
                    <Card variant="flat" className="overview-card"><div className="overview-number">{services.length}</div><div className="overview-label">Total Services</div></Card>
                    <Card variant="flat" className="overview-card"><div className="overview-number">99.7%</div><div className="overview-label">Avg Uptime</div></Card>
                </div>

                <Card title="🖥️ Microservices Status">
                    <table className="it-table">
                        <thead><tr><th>Service</th><th>Port</th><th>Status</th><th>Uptime</th><th>CPU</th><th>Memory</th><th>Last Check</th></tr></thead>
                        <tbody>
                            {services.map(service => {
                                const status = getStatusBadge(service.status);
                                return (
                                    <tr key={service.name}>
                                        <td><strong>{service.name}</strong></td>
                                        <td><code>:{service.port}</code></td>
                                        <td><span className={`status-badge ${status.class}`}>{status.label}</span></td>
                                        <td>{service.uptime}</td>
                                        <td><span className={parseFloat(service.cpu) > 40 ? 'text-warning' : ''}>{service.cpu}</span></td>
                                        <td>{service.memory}</td>
                                        <td className="text-muted">{service.lastCheck}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default ITSystemStatus;
