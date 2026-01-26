/**
 * PetCareApp - Dashboard IT
 * Panel monitoringu i zarządzania infrastrukturą
 * @author VS
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import './DashboardPages.css';

function ITDashboard() {
    const { t } = useTranslation();
    const { user } = useAuth();

    // Menu sidebara - VS
    const menuItems = [
        { path: '/dashboard/it', label: t('dashboard.it.overview'), icon: '📊', exact: true },
        { path: '/dashboard/it/status', label: t('dashboard.it.systemStatus'), icon: '🖥️' },
        { path: '/dashboard/it/logs', label: t('dashboard.it.logs'), icon: '📜' },
        { path: '/dashboard/it/monitoring', label: t('dashboard.it.monitoring'), icon: '📈' },
        { path: '/dashboard/it/security', label: t('dashboard.it.security'), icon: '🔒' },
        { path: '/dashboard/it/infrastructure', label: t('dashboard.it.infrastructure'), icon: '🏗️' }
    ];

    // Status mikroserwisów - VS
    const [services] = useState([
        { name: 'Auth Service', status: 'healthy', uptime: '99.99%', latency: '12ms', port: 8001 },
        { name: 'User Service', status: 'healthy', uptime: '99.98%', latency: '15ms', port: 8002 },
        { name: 'Medical Records', status: 'healthy', uptime: '99.97%', latency: '18ms', port: 8003 },
        { name: 'Appointment Service', status: 'healthy', uptime: '99.99%', latency: '14ms', port: 8004 },
        { name: 'Notification Service', status: 'warning', uptime: '99.85%', latency: '45ms', port: 8005 },
        { name: 'Payment Service', status: 'healthy', uptime: '99.99%', latency: '22ms', port: 8006 },
        { name: 'Report Service', status: 'healthy', uptime: '99.96%', latency: '35ms', port: 8007 },
        { name: 'Analytics Service', status: 'healthy', uptime: '99.94%', latency: '28ms', port: 8008 },
        { name: 'Audit Service', status: 'healthy', uptime: '99.99%', latency: '10ms', port: 8009 },
        { name: 'Drug Info Service', status: 'healthy', uptime: '99.92%', latency: '55ms', port: 8010 },
        { name: 'Disease Alert (PIW)', status: 'healthy', uptime: '99.88%', latency: '120ms', port: 8011 }
    ]);

    // Metryki systemowe - VS
    const [systemMetrics] = useState({
        cpu: 35,
        memory: 62,
        disk: 45,
        network: 28
    });

    // Ostatnie logi - VS
    const [recentLogs] = useState([
        { time: '14:32:15', level: 'INFO', service: 'Auth Service', message: 'User login successful: user@example.com' },
        { time: '14:31:58', level: 'WARN', service: 'Notification', message: 'Email queue delay detected: 2.5s' },
        { time: '14:31:45', level: 'INFO', service: 'Appointment', message: 'New appointment created: #APT-2024-1234' },
        { time: '14:31:22', level: 'ERROR', service: 'Payment', message: 'Payment gateway timeout - retry scheduled' },
        { time: '14:31:10', level: 'INFO', service: 'Medical Records', message: 'Record updated: PET-5678' }
    ]);

    // Alerty - VS
    const [alerts] = useState([
        { id: 1, type: 'warning', message: 'Notification Service: Increased latency detected', time: '10 min ago' },
        { id: 2, type: 'info', message: 'Scheduled backup completed successfully', time: '1 hour ago' }
    ]);

    // Infrastruktura - VS
    const [infrastructure] = useState({
        containers: 15,
        running: 14,
        databases: 2,
        cacheHitRate: 94.5
    });

    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const warningServices = services.filter(s => s.status === 'warning').length;

    return (
        <DashboardLayout 
            menuItems={menuItems} 
            title={t('dashboard.it.welcome')}
            roleColor="#e74c3c"
        >
            <div className="dashboard-page it-dashboard">
                {/* Status ogólny - VS */}
                <div className="stats-cards">
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#e8f5e9', color: '#388e3c' }}>✅</div>
                        <div className="stat-content">
                            <span className="stat-value">{healthyServices}/{services.length}</span>
                            <span className="stat-label">Serwisy OK</span>
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#fff3e0', color: '#f57c00' }}>⚠️</div>
                        <div className="stat-content">
                            <span className="stat-value">{warningServices}</span>
                            <span className="stat-label">Ostrzeżenia</span>
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}>🐳</div>
                        <div className="stat-content">
                            <span className="stat-value">{infrastructure.running}/{infrastructure.containers}</span>
                            <span className="stat-label">Kontenery</span>
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card">
                        <div className="stat-icon" style={{ background: '#f3e5f5', color: '#7b1fa2' }}>💾</div>
                        <div className="stat-content">
                            <span className="stat-value">{infrastructure.cacheHitRate}%</span>
                            <span className="stat-label">Cache Hit Rate</span>
                        </div>
                    </Card>
                </div>

                <div className="dashboard-grid it-grid">
                    {/* Status mikroserwisów - VS */}
                    <Card 
                        title="Mikroserwisy" 
                        icon={<span>🖥️</span>}
                        actions={
                            <Link to="/dashboard/it/status">
                                <Button variant="ghost" size="small">Szczegóły</Button>
                            </Link>
                        }
                        className="services-card"
                    >
                        <div className="services-grid">
                            {services.map((service, index) => (
                                <div key={index} className={`service-item status-${service.status}`}>
                                    <div className="service-status-dot"></div>
                                    <div className="service-info">
                                        <span className="service-name">{service.name}</span>
                                        <span className="service-meta">:{service.port} • {service.latency}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Metryki systemowe - VS */}
                    <Card title="Zasoby systemowe" icon={<span>📊</span>}>
                        <div className="metrics-grid">
                            <div className="metric-item">
                                <div className="metric-header">
                                    <span className="metric-label">CPU</span>
                                    <span className="metric-value">{systemMetrics.cpu}%</span>
                                </div>
                                <div className="metric-bar">
                                    <div 
                                        className="metric-fill cpu"
                                        style={{ width: `${systemMetrics.cpu}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="metric-item">
                                <div className="metric-header">
                                    <span className="metric-label">Memory</span>
                                    <span className="metric-value">{systemMetrics.memory}%</span>
                                </div>
                                <div className="metric-bar">
                                    <div 
                                        className="metric-fill memory"
                                        style={{ width: `${systemMetrics.memory}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="metric-item">
                                <div className="metric-header">
                                    <span className="metric-label">Disk</span>
                                    <span className="metric-value">{systemMetrics.disk}%</span>
                                </div>
                                <div className="metric-bar">
                                    <div 
                                        className="metric-fill disk"
                                        style={{ width: `${systemMetrics.disk}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="metric-item">
                                <div className="metric-header">
                                    <span className="metric-label">Network</span>
                                    <span className="metric-value">{systemMetrics.network}%</span>
                                </div>
                                <div className="metric-bar">
                                    <div 
                                        className="metric-fill network"
                                        style={{ width: `${systemMetrics.network}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Alerty - VS */}
                    <Card title="Alerty" icon={<span>🔔</span>}>
                        <div className="alerts-list">
                            {alerts.length > 0 ? alerts.map(alert => (
                                <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                                    <span className="alert-icon">
                                        {alert.type === 'warning' && '⚠️'}
                                        {alert.type === 'error' && '❌'}
                                        {alert.type === 'info' && 'ℹ️'}
                                    </span>
                                    <div className="alert-content">
                                        <p className="alert-message">{alert.message}</p>
                                        <span className="alert-time">{alert.time}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="empty-state">
                                    <span className="empty-icon">✅</span>
                                    <p>Brak aktywnych alertów</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Ostatnie logi - VS */}
                    <Card 
                        title="Ostatnie logi" 
                        icon={<span>📜</span>}
                        actions={
                            <Link to="/dashboard/it/logs">
                                <Button variant="ghost" size="small">Wszystkie logi</Button>
                            </Link>
                        }
                        className="logs-card"
                    >
                        <div className="logs-list">
                            {recentLogs.map((log, index) => (
                                <div key={index} className={`log-item log-${log.level.toLowerCase()}`}>
                                    <span className="log-time">{log.time}</span>
                                    <span className={`log-level level-${log.level.toLowerCase()}`}>{log.level}</span>
                                    <span className="log-service">{log.service}</span>
                                    <span className="log-message">{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default ITDashboard;
