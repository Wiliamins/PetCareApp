/**
* PetCareApp - IT Infrastructure Page
* @author VS
*/

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './ITPages.css';

const ITInfrastructure = () => {
const { t } = useTranslation();
const [loading, setLoading] = useState(true);
const [infrastructure, setInfrastructure] = useState(null);

useEffect(() => {
// Симуляция загрузки
setTimeout(() => {
setInfrastructure({
ec2: {
instanceType: 't3.medium',
region: 'eu-central-1',
status: 'running',
publicIp: '18.185.xxx.xxx',
privateIp: '172.31.xxx.xxx'
},
containers: [
{ name: 'nginx', status: 'running', port: '80, 443' },
{ name: 'auth-service', status: 'running', port: '8001' },
{ name: 'user-service', status: 'running', port: '8002' },
{ name: 'pet-service', status: 'running', port: '8003' },
{ name: 'medical-service', status: 'running', port: '8004' },
{ name: 'appointment-service', status: 'running', port: '8005' },
{ name: 'payment-service', status: 'running', port: '8006' },
{ name: 'report-service', status: 'running', port: '8007' },
{ name: 'analytics-service', status: 'running', port: '8008' },
{ name: 'audit-service', status: 'running', port: '8009' },
{ name: 'drug-info-service', status: 'running', port: '8010' },
{ name: 'disease-alert-service', status: 'running', port: '8011' },
{ name: 'notification-service', status: 'running', port: '8012' },
{ name: 'drug-service', status: 'running', port: '8013' }
]
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
<DashboardLayout title="Infrastruktura" menuItems={menuItems}>
<LoadingSpinner />
</DashboardLayout>
);
}

return (
<DashboardLayout title="Infrastruktura" menuItems={menuItems}>
<div className="infrastructure">
<Card>
<h3>🖥️ Serwer EC2</h3>
<table className="it-table">
<tbody>
<tr><td>Typ instancji</td><td><code>{infrastructure?.ec2?.instanceType}</code></td></tr>
<tr><td>Region</td><td>{infrastructure?.ec2?.region}</td></tr>
<tr><td>Status</td><td className="text-success">● {infrastructure?.ec2?.status}</td></tr>
<tr><td>Public IP</td><td><code>{infrastructure?.ec2?.publicIp}</code></td></tr>
<tr><td>Private IP</td><td><code>{infrastructure?.ec2?.privateIp}</code></td></tr>
</tbody>
</table>
</Card>

<Card>
<h3>🐳 Kontenery Docker</h3>
<table className="it-table">
<thead>
<tr><th>Kontener</th><th>Status</th><th>Port</th></tr>
</thead>
<tbody>
{infrastructure?.containers?.map((container, index) => (
<tr key={index}>
<td>{container.name}</td>
<td className="text-success">● {container.status}</td>
<td><code>{container.port}</code></td>
</tr>
))}
</tbody>
</table>
</Card>

<Card>
<h3>☁️ Usługi AWS</h3>
<table className="it-table">
<thead>
<tr><th>Usługa</th><th>Zasób</th><th>Region</th></tr>
</thead>
<tbody>
<tr><td>Cognito</td><td>petcareapp-users</td><td>eu-central-1</td></tr>
<tr><td>DynamoDB</td><td>7 tabel</td><td>eu-central-1</td></tr>
<tr><td>S3</td><td>petcareapp-files</td><td>eu-central-1</td></tr>
<tr><td>SES</td><td>Email sending</td><td>eu-central-1</td></tr>
<tr><td>Amplify</td><td>Frontend hosting</td><td>Global</td></tr>
</tbody>
</table>
</Card>
</div>
</DashboardLayout>
);
};

export default ITInfrastructure;