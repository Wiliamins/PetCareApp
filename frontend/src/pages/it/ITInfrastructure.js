/**
 * PetCareApp - ITInfrastructure - Infrastruktura
 * @author VS
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import '../dashboards/DashboardPages.css';
import './ITPages.css';

function ITInfrastructure() {
    const { t } = useTranslation();

    const menuItems = [
        { path: '/dashboard/it', label: t('dashboard.it.overview'), icon: '📊', exact: true },
        { path: '/dashboard/it/status', label: t('dashboard.it.status'), icon: '🖥️' },
        { path: '/dashboard/it/logs', label: t('dashboard.it.logs'), icon: '📋' },
        { path: '/dashboard/it/monitoring', label: t('dashboard.it.monitoring'), icon: '📈' },
        { path: '/dashboard/it/security', label: t('dashboard.it.security'), icon: '🔒' },
        { path: '/dashboard/it/infrastructure', label: t('dashboard.it.infrastructure'), icon: '🏗️' }
    ];

    const awsServices = [
        { name: 'AWS Cognito', icon: '🔐', status: 'active', region: 'eu-central-1', detail: 'User Pool: petcareapp-users' },
        { name: 'DynamoDB', icon: '🗄️', status: 'active', region: 'eu-central-1', detail: '9 tables, On-demand capacity' },
        { name: 'S3 Bucket', icon: '📦', status: 'active', region: 'eu-central-1', detail: 'petcareapp-files, 2.5 GB used' },
        { name: 'EC2 Instance', icon: '🖥️', status: 'active', region: 'eu-central-1', detail: 't3.medium, Ubuntu 22.04' },
        { name: 'CloudWatch', icon: '📊', status: 'active', region: 'eu-central-1', detail: 'Logs and metrics configured' }
    ];

    const containers = [
        { name: 'frontend', image: 'petcareapp-frontend:latest', status: 'running', port: '3000' },
        { name: 'nginx', image: 'nginx:alpine', status: 'running', port: '80, 443' },
        { name: 'auth-service', image: 'petcareapp-auth:latest', status: 'running', port: '8001' },
        { name: 'user-service', image: 'petcareapp-user:latest', status: 'running', port: '8002' },
        { name: 'dynamodb-local', image: 'amazon/dynamodb-local', status: 'running', port: '8000' },
        { name: 'redis', image: 'redis:alpine', status: 'running', port: '6379' },
        { name: 'kafka', image: 'confluentinc/cp-kafka', status: 'running', port: '9092' },
        { name: 'prometheus', image: 'prom/prometheus', status: 'running', port: '9090' },
        { name: 'grafana', image: 'grafana/grafana', status: 'running', port: '3001' }
    ];

    return (
        <DashboardLayout menuItems={menuItems} title="Infrastruktura" roleColor="#e67e22">
            <div className="dashboard-page">
                <div className="system-overview">
                    <Card variant="flat" className="overview-card"><div className="overview-number">5</div><div className="overview-label">AWS Services</div></Card>
                    <Card variant="flat" className="overview-card success"><div className="overview-number">{containers.length}</div><div className="overview-label">Containers</div></Card>
                    <Card variant="flat" className="overview-card"><div className="overview-number">11</div><div className="overview-label">Microservices</div></Card>
                    <Card variant="flat" className="overview-card"><div className="overview-number">eu-central-1</div><div className="overview-label">AWS Region</div></Card>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <Card title="☁️ AWS Services">
                        {awsServices.map((service, idx) => (
                            <div key={idx} className="security-item">
                                <div className="security-icon">{service.icon}</div>
                                <div className="security-info">
                                    <div className="security-title">{service.name}</div>
                                    <div className="security-status">{service.detail}</div>
                                </div>
                                <span className="status-badge success">✅ Active</span>
                            </div>
                        ))}
                    </Card>

                    <Card title="🐳 Docker Containers">
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="it-table">
                                <thead><tr><th>Container</th><th>Port</th><th>Status</th></tr></thead>
                                <tbody>
                                    {containers.map((container, idx) => (
                                        <tr key={idx}>
                                            <td><strong>{container.name}</strong><br/><span className="text-muted" style={{ fontSize: '11px' }}>{container.image}</span></td>
                                            <td><code>:{container.port}</code></td>
                                            <td><span className="status-badge success">Running</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <Card title="🔧 Quick Actions" style={{ marginTop: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        <Button variant="outline">🔄 Restart All Services</Button>
                        <Button variant="outline">📦 Deploy Update</Button>
                        <Button variant="outline">💾 Create Backup</Button>
                        <Button variant="outline">📊 View CloudWatch</Button>
                        <Button variant="outline">🗄️ DynamoDB Console</Button>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default ITInfrastructure;
