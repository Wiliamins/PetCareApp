/**
* PetCareApp - IT Logs Page
* Strona logów systemowych dla pracowników IT
* @author VS
*/

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './ITPages.css';

const ITLogs = () => {
const { t } = useTranslation();
const [loading, setLoading] = useState(true);
const [logs, setLogs] = useState([]);
const [filteredLogs, setFilteredLogs] = useState([]);
const [filters, setFilters] = useState({
level: 'all',
service: 'all',
search: ''
});
const [autoRefresh, setAutoRefresh] = useState(false);
const [page, setPage] = useState(1);
const logsPerPage = 50;

const API_URL = process.env.REACT_APP_API_URL || '';

const servicesList = [
'auth-service', 'user-service', 'pet-service', 'medical-service',
'appointment-service', 'payment-service', 'report-service',
'analytics-service', 'audit-service', 'drug-info-service',
'disease-alert-service', 'notification-service', 'drug-service'
];

const logLevels = [
{ value: 'all', label: 'Wszystkie' },
{ value: 'error', label: 'Error' },
{ value: 'warning', label: 'Warning' },
{ value: 'info', label: 'Info' },
{ value: 'debug', label: 'Debug' }
];

const fetchLogs = useCallback(async () => {
try {
const response = await fetch(`${API_URL}/api/v1/logs?limit=500`);
if (response.ok) {
const data = await response.json();
setLogs(data.logs || data || []);
} else {
generateDemoLogs();
}
} catch (error) {
console.error('Error fetching logs:', error);
generateDemoLogs();
} finally {
setLoading(false);
}
}, [API_URL]);

const generateDemoLogs = () => {
const demoLogs = [];
const messages = {
info: ['User logged in', 'Appointment created', 'Payment processed', 'Email sent'],
warning: ['Slow query detected', 'High memory usage', 'Rate limit approaching'],
error: ['Database connection failed', 'Payment timeout', 'Invalid token'],
debug: ['Processing request', 'Cache hit', 'Query executed']
};

const now = new Date();
for (let i = 0; i < 200; i++) {
const level = ['info', 'info', 'info', 'warning', 'error', 'debug'][Math.floor(Math.random() * 6)];
const service = servicesList[Math.floor(Math.random() * servicesList.length)];
const messageList = messages[level];
const message = messageList[Math.floor(Math.random() * messageList.length)];
const timestamp = new Date(now - Math.random() * 24 * 60 * 60 * 1000);

demoLogs.push({
id: `log-${i}`,
timestamp: timestamp.toISOString(),
level,
service,
message,
userId: Math.random() > 0.7 ? `user-${Math.floor(Math.random() * 1000)}` : null,
ip: `192.168.1.${Math.floor(Math.random() * 255)}`
});
}

demoLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
setLogs(demoLogs);
};

useEffect(() => {
let result = [...logs];
if (filters.level !== 'all') result = result.filter(log => log.level === filters.level);
if (filters.service !== 'all') result = result.filter(log => log.service === filters.service);
if (filters.search) {
const searchLower = filters.search.toLowerCase();
result = result.filter(log =>
log.message.toLowerCase().includes(searchLower) ||
log.service.toLowerCase().includes(searchLower)
);
}
setFilteredLogs(result);
setPage(1);
}, [logs, filters]);

useEffect(() => {
fetchLogs();
let interval;
if (autoRefresh) interval = setInterval(fetchLogs, 10000);
return () => { if (interval) clearInterval(interval); };
}, [autoRefresh, fetchLogs]);

const formatTimestamp = (timestamp) => {
return new Date(timestamp).toLocaleString('pl-PL');
};

const LevelBadge = ({ level }) => {
const colors = {
error: { bg: '#fee2e2', color: '#dc2626' },
warning: { bg: '#fef3c7', color: '#d97706' },
info: { bg: '#dbeafe', color: '#2563eb' },
debug: { bg: '#f3f4f6', color: '#6b7280' }
};
const style = colors[level] || colors.info;

return (
<span style={{
padding: '2px 8px',
borderRadius: '4px',
fontSize: '11px',
fontWeight: '600',
textTransform: 'uppercase',
backgroundColor: style.bg,
color: style.color
}}>
{level}
</span>
);
};

const exportLogs = (format) => {
const dataToExport = filteredLogs.length > 0 ? filteredLogs : logs;

if (format === 'json') {
const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
a.click();
} else if (format === 'csv') {
const headers = ['Timestamp', 'Level', 'Service', 'Message', 'User ID', 'IP'];
const rows = dataToExport.map(log => [
log.timestamp, log.level, log.service,
`"${log.message.replace(/"/g, '""')}"`,
log.userId || '', log.ip || ''
]);
const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
a.click();
}
};

const paginatedLogs = filteredLogs.slice((page - 1) * logsPerPage, page * logsPerPage);
const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

const stats = {
total: filteredLogs.length,
errors: filteredLogs.filter(l => l.level === 'error').length,
warnings: filteredLogs.filter(l => l.level === 'warning').length,
info: filteredLogs.filter(l => l.level === 'info').length
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
<DashboardLayout title="Logi systemowe" menuItems={menuItems}>
<LoadingSpinner />
</DashboardLayout>
);
}

return (
<DashboardLayout title="Logi systemowe" menuItems={menuItems}>
<div className="it-logs">
<div className="logs-stats">
<div className="stat-item"><span className="stat-value">{stats.total}</span><span className="stat-label">Wszystkie</span></div>
<div className="stat-item stat-error"><span className="stat-value">{stats.errors}</span><span className="stat-label">Błędy</span></div>
<div className="stat-item stat-warning"><span className="stat-value">{stats.warnings}</span><span className="stat-label">Ostrzeżenia</span></div>
<div className="stat-item stat-info"><span className="stat-value">{stats.info}</span><span className="stat-label">Info</span></div>
</div>

<Card className="filters-card">
<div className="filters-grid">
<div className="filter-group">
<label>Poziom</label>
<select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}>
{logLevels.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
</select>
</div>
<div className="filter-group">
<label>Serwis</label>
<select value={filters.service} onChange={(e) => setFilters({ ...filters, service: e.target.value })}>
<option value="all">Wszystkie</option>
{servicesList.map(service => <option key={service} value={service}>{service}</option>)}
</select>
</div>
<div className="filter-group">
<label>Szukaj</label>
<input type="text" placeholder="Szukaj..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}/>
</div>
</div>
<div className="filters-actions">
<button className="btn-secondary" onClick={() => setFilters({ level: 'all', service: 'all', search: '' })}>Wyczyść</button>
<label className="auto-refresh-toggle">
<input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)}/>
Auto-refresh
</label>
<div className="export-buttons">
<button className="btn-export" onClick={() => exportLogs('json')}>📥 JSON</button>
<button className="btn-export" onClick={() => exportLogs('csv')}>📥 CSV</button>
</div>
</div>
</Card>

<Card className="logs-card">
<table className="logs-table">
<thead>
<tr><th>Czas</th><th>Poziom</th><th>Serwis</th><th>Wiadomość</th><th>Szczegóły</th></tr>
</thead>
<tbody>
{paginatedLogs.map((log) => (
<tr key={log.id} className={`log-row level-${log.level}`}>
<td className="log-timestamp">{formatTimestamp(log.timestamp)}</td>
<td><LevelBadge level={log.level} /></td>
<td className="log-service">{log.service}</td>
<td className="log-message">{log.message}</td>
<td className="log-details">
{log.userId && <span className="detail-tag">👤 {log.userId}</span>}
{log.ip && <span className="detail-tag">🌐 {log.ip}</span>}
</td>
</tr>
))}
</tbody>
</table>

{totalPages > 1 && (
<div className="pagination">
<button disabled={page === 1} onClick={() => setPage(page - 1)}>← Poprzednia</button>
<span>Strona {page} z {totalPages}</span>
<button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Następna →</button>
</div>
)}
</Card>
</div>
</DashboardLayout>
);
};

export default ITLogs;