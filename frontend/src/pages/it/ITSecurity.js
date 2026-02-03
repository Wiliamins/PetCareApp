/**
* PetCareApp - IT Security Page
* @author VS
*/

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './ITPages.css';

const ITSecurity = () => {
const { t } = useTranslation();
const [loading, setLoading] = useState(true);
const [securityData, setSecurityData] = useState(null);

useEffect(() => {
setTimeout(() => {
setSecurityData({
ssl: { status: 'valid', expiry: '2025-12-31', issuer: "Let's Encrypt" },
lastAudit: '2025-01-15',
failedLogins: 3,
blockedIps: 12,
securityScore: 92
});
setLoading(false);
}, 500);
}, []);

const menuItems = [
{ path: '/dashboard/it', label: t('dashboard'), icon: '📊' },
{ path: '/dashboard/it/monitoring', label: 'Monitoring', icon: '📡' },
{ path: '/dashboard/it/logs', label: 'Logi', icon: '📋' },
{ path: '/dashboard/it/infrastructure', label: t('infrastructure'), icon: '🖥️' },
{ path: '/dashboard/it/security', label: t('security'), icon: '🔒' },
];

if (loading) {
return (
<DashboardLayout title="Bezpieczeństwo" menuItems={menuItems}>
<LoadingSpinner />
</DashboardLayout>
);
}

return (
<DashboardLayout title="Bezpieczeństwo" menuItems={menuItems}>
<div className="security">
<div className="system-overview">
<Card className="overview-card success">
<div className="overview-number">{securityData?.securityScore}%</div>
<div className="overview-label">Security Score</div>
</Card>
<Card className="overview-card">
<div className="overview-number">{securityData?.failedLogins}</div>
<div className="overview-label">Nieudane logowania (24h)</div>
</Card>
<Card className="overview-card warning">
<div className="overview-number">{securityData?.blockedIps}</div>
<div className="overview-label">Zablokowane IP</div>
</Card>
<Card className="overview-card success">
<div className="overview-number">✓</div>
<div className="overview-label">SSL Aktywny</div>
</Card>
</div>

<Card>
<h3>🔒 Certyfikat SSL</h3>
<div className="security-item">
<div className="security-icon">🔐</div>
<div className="security-info">
<div className="security-title">Certyfikat SSL/TLS</div>
<div className="security-status">Wydawca: {securityData?.ssl?.issuer} | Ważny do: {securityData?.ssl?.expiry}</div>
</div>
<span className="text-success">● Aktywny</span>
</div>
</Card>

<Card>
<h3>🛡️ Zabezpieczenia</h3>
<div className="security-item">
<div className="security-icon">🔑</div>
<div className="security-info">
<div className="security-title">JWT Authentication</div>
<div className="security-status">Tokeny wygasają po 1 godzinie</div>
</div>
<span className="text-success">● Włączone</span>
</div>
<div className="security-item">
<div className="security-icon">👥</div>
<div className="security-info">
<div className="security-title">RBAC (Role-Based Access Control)</div>
<div className="security-status">4 role: admin, vet, client, it</div>
</div>
<span className="text-success">● Włączone</span>
</div>
<div className="security-item">
<div className="security-icon">🚫</div>
<div className="security-info">
<div className="security-title">Rate Limiting</div>
<div className="security-status">100 żądań/minutę na IP</div>
</div>
<span className="text-success">● Włączone</span>
</div>
<div className="security-item">
<div className="security-icon">📝</div>
<div className="security-info">
<div className="security-title">Audit Logging</div>
<div className="security-status">Wszystkie operacje są logowane</div>
</div>
<span className="text-success">● Włączone</span>
</div>
<div className="security-item">
<div className="security-icon">🔒</div>
<div className="security-info">
<div className="security-title">Szyfrowanie danych</div>
<div className="security-status">AES-256 dla danych wrażliwych</div>
</div>
<span className="text-success">● Włączone</span>
</div>
</Card>

<Card>
<h3>📋 Zgodność</h3>
<div className="security-item">
<div className="security-icon">🇪🇺</div>
<div className="security-info">
<div className="security-title">RODO / GDPR</div>
<div className="security-status">Zgodność z przepisami UE o ochronie danych</div>
</div>
<span className="text-success">● Zgodne</span>
</div>
<div className="security-item">
<div className="security-icon">💳</div>
<div className="security-info">
<div className="security-title">PCI DSS</div>
<div className="security-status">Płatności przez Stripe (Level 1)</div>
</div>
<span className="text-success">● Zgodne</span>
</div>
</Card>
</div>
</DashboardLayout>
);
};

export default ITSecurity;