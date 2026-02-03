/**
* PetCareApp - IT Monitoring Page
* Strona monitoringu systemu dla pracowników IT
* @author VS
*/

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './ITPages.css';

const ITMonitoring = () => {
const { t } = useTranslation();
const [loading, setLoading] = useState(true);
const [services, setServices] = useState([]);
const [metrics, setMetrics] = useState(null);
const [autoRefresh, setAutoRefresh] = useState(true);
const [lastUpdate, setLastUpdate] = useState(null);

const API_URL = process.env.REACT_APP_API_URL || '';

// Lista wszystkich mikroserwisów - VS
const servicesList = [
{ name: 'auth-service', port: 8001, description: 'Autoryzacja i tokeny JWT' },
{ name: 'user-service', port: 8002, description: 'Zarządzanie użytkownikami' },
{ name: 'pet-service', port: 8012, description: 'Profile zwierząt' },
{ name: 'medical-service', port: 8003, description: 'Dokumentacja medyczna' },
{ name: 'appointment-service', port: 8004, description: 'Rezerwacja wizyt' },
{ name: 'payment-service', port: 8006, description: 'Płatności Stripe' },
{ name: 'report-service', port: 8007, description: 'Generowanie raportów' },
{ name: 'analytics-service', port: 8008, description: 'Metryki systemowe' },
{ name: 'audit-service', port: 8009, description: 'Logi audytu' },
{ name: 'drug-info-service', port: 8013, description: 'Baza leków' },
{ name: 'disease-alert-service', port: 8011, description: 'Alerty epidemiologiczne' },
{ name: 'notification-service', port: 8005, description: 'Powiadomienia email/push' },
{ name: 'drug-service', port: 8010, description: 'Recepty' },
];

// Pobierz status serwisów - VS
const fetchServicesStatus = useCallback(async () => {
try {
const response = await fetch(`${API_URL}/api/v1/system/services`);
if (response.ok) {
const data = await response.json();
setServices(data.services || servicesList.map(s => ({ ...s, status: 'healthy' })));
} else {
// Demo data
setServices(servicesList.map(s => ({
...s,
status: Math.random() > 0.1 ? 'healthy' : 'unhealthy'
})));
}
setLastUpdate(new Date());
} catch (error) {
console.error('Error fetching services:', error);
setServices(servicesList.map(s => ({ ...s, status: 'healthy' })));
}
}, [API_URL]);

// Pobierz metryki systemowe - VS
const fetchMetrics = useCallback(async () => {
try {
const response = await fetch(`${API_URL}/api/v1/system/metrics`);
if (response.ok) {
const data = await response.json();
setMetrics(data);
} else {
// Demo data
setMetrics({
cpu: { usage: 23.5, cores: 2 },
memory: { used: 1.8, total: 4.0, percent: 45 },
disk: { used: 12.5, total: 30.0, percent: 42 },
uptime: 864000
});
}
} catch (error) {
console.error('Error fetching metrics:', error);
setMetrics({
cpu: { usage: 23.5, cores: 2 },
memory: { used: 1.8, total: 4.0, percent: 45 },
disk: { used: 12.5, total: 30.0, percent: 42 },
uptime: 864000
});
}
}, [API_URL]);

useEffect(() => {
const loadData = async () => {
setLoading(true);
await Promise.all([fetchServicesStatus(), fetchMetrics()]);
setLoading(false);
};

loadData();

let interval;
if (autoRefresh) {
interval = setInterval(() => {
fetchServicesStatus();
fetchMetrics();
}, 30000);
}

return () => {
if (interval) clearInterval(interval);
};
}, [autoRefresh, fetchServicesStatus, fetchMetrics]);

const formatUptime = (seconds) => {
const days = Math.floor(seconds / 86400);
const hours = Math.floor((seconds % 86400) / 3600);
const minutes = Math.floor((seconds % 3600) / 60);
return `${days}d ${hours}h ${minutes}m`;
};

const StatusBadge = ({ status }) => {
const colors = {
healthy: { bg: '#d1fae5', color: '#059669', text: 'Healthy' },
unhealthy: { bg: '#fef3c7', color: '#d97706', text: 'Unhealthy' },
offline: { bg: '#fee2e2', color: '#dc2626', text: 'Offline' }
};
const style = colors[status] || colors.offline;

return (
<span style={{
padding: '4px 12px',
borderRadius: '9999px',
fontSize: '12px',
fontWeight: '600',
backgroundColor: style.bg,
color: style.color
}}>
{style.text}
</span>
);
};

const menuItems = [
{ path: '/dashboard/it', label: t('dashboard'), icon: '📊' },
{ path: '/dashboard/it/monitoring', label: 'Monitoring', icon: '📡' },
{ path: '/dashboard/it/logs', label: 'Logi', icon: '📋' },
{ path: '/dashboard/it/infrastructure', label: t('infrastructure'), icon: '🖥️' },
{ path: '/dashboard/it/security', label: t('security'), icon: '🔒' },
];

if (loading) {
return (
<DashboardLayout title="IT Monitoring" menuItems={menuItems}>
<LoadingSpinner />
</DashboardLayout>
);
}

const healthyCount = services.filter(s => s.status === 'healthy').length;
const totalCount = services.length;

return (
<DashboardLayout title="IT Monitoring" menuItems={menuItems}>
<div className="it-monitoring">
<div className="monitoring-header">
<div className="monitoring-status-summary">
<span className="status-icon">
{healthyCount === totalCount ? '✅' : healthyCount > totalCount / 2 ? '⚠️' : '❌'}
</span>
<span>{healthyCount}/{totalCount} serwisów działa poprawnie</span>
</div>
<div className="monitoring-controls">
<label className="auto-refresh-toggle">
<input
type="checkbox"
checked={autoRefresh}
onChange={(e) => setAutoRefresh(e.target.checked)}
/>
Auto-refresh (30s)
</label>
<button className="refresh-btn" onClick={() => { fetchServicesStatus(); fetchMetrics(); }}>
🔄 Odśwież
</button>
</div>
</div>

{lastUpdate && (
<p className="last-update">Ostatnia aktualizacja: {lastUpdate.toLocaleTimeString('pl-PL')}</p>
)}

{metrics && (
<div className="metrics-grid">
<Card className="metric-card">
<div className="metric-icon">💻</div>
<div className="metric-info">
<div className="metric-label">CPU</div>
<div className="metric-value">{metrics.cpu?.usage?.toFixed(1)}%</div>
<div className="metric-detail">{metrics.cpu?.cores} rdzeni</div>
</div>
<div className="metric-bar">
<div className="metric-bar-fill" style={{
width: `${metrics.cpu?.usage || 0}%`,
backgroundColor: metrics.cpu?.usage > 80 ? '#dc2626' : '#2563eb'
}}/>
</div>
</Card>

<Card className="metric-card">
<div className="metric-icon">🧠</div>
<div className="metric-info">
<div className="metric-label">RAM</div>
<div className="metric-value">{metrics.memory?.percent?.toFixed(1)}%</div>
<div className="metric-detail">{metrics.memory?.used?.toFixed(1)} / {metrics.memory?.total?.toFixed(1)} GB</div>
</div>
<div className="metric-bar">
<div className="metric-bar-fill" style={{
width: `${metrics.memory?.percent || 0}%`,
backgroundColor: metrics.memory?.percent > 80 ? '#dc2626' : '#059669'
}}/>
</div>
</Card>

<Card className="metric-card">
<div className="metric-icon">💾</div>
<div className="metric-info">
<div className="metric-label">Dysk</div>
<div className="metric-value">{metrics.disk?.percent?.toFixed(1)}%</div>
<div className="metric-detail">{metrics.disk?.used?.toFixed(1)} / {metrics.disk?.total?.toFixed(1)} GB</div>
</div>
<div className="metric-bar">
<div className="metric-bar-fill" style={{
width: `${metrics.disk?.percent || 0}%`,
backgroundColor: metrics.disk?.percent > 80 ? '#dc2626' : '#f59e0b'
}}/>
</div>
</Card>

<Card className="metric-card">
<div className="metric-icon">⏱️</div>
<div className="metric-info">
<div className="metric-label">Uptime</div>
<div className="metric-value">{formatUptime(metrics.uptime || 0)}</div>
</div>
</Card>
</div>
)}

<Card className="services-card">
<h3>Status mikroserwisów</h3>
<div className="services-table">
<table>
<thead>
<tr>
<th>Serwis</th>
<th>Port</th>
<th>Opis</th>
<th>Status</th>
</tr>
</thead>
<tbody>
{services.map((service) => (
<tr key={service.name} className={`status-${service.status}`}>
<td className="service-name">{service.name}</td>
<td className="service-port">{service.port}</td>
<td className="service-desc">{service.description}</td>
<td><StatusBadge status={service.status} /></td>
</tr>
))}
</tbody>
</table>
</div>
</Card>
</div>
</DashboardLayout>
);
};

export default ITMonitoring;