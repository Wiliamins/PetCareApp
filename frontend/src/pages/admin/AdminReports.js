/**
 * PetCareApp - AdminReports - Raporty i analizy
 * @author VS
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';
import '../dashboards/DashboardPages.css';
import './AdminPages.css';

function AdminReports() {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    const [generating, setGenerating] = useState(null);

    const menuItems = [
        { path: '/dashboard/admin', label: t('dashboard.admin.overview'), icon: '📊', exact: true },
        { path: '/dashboard/admin/users', label: t('dashboard.admin.users'), icon: '👥' },
        { path: '/dashboard/admin/appointments', label: t('dashboard.admin.appointments'), icon: '📅' },
        { path: '/dashboard/admin/services', label: t('dashboard.admin.services'), icon: '💼' },
        { path: '/dashboard/admin/content', label: t('dashboard.admin.content'), icon: '📝' },
        { path: '/dashboard/admin/reports', label: t('dashboard.admin.reports'), icon: '📈' }
    ];

    const reports = [
        { id: 'revenue', icon: '💰', title: 'Raport przychodów', description: 'Szczegółowe zestawienie przychodów' },
        { id: 'appointments', icon: '📅', title: 'Raport wizyt', description: 'Statystyki wizyt i anulacji' },
        { id: 'patients', icon: '🐾', title: 'Raport pacjentów', description: 'Nowi pacjenci i aktywność' },
        { id: 'services', icon: '📋', title: 'Raport usług', description: 'Najpopularniejsze usługi' },
        { id: 'vets', icon: '👨‍⚕️', title: 'Raport weterynarzy', description: 'Wydajność i obłożenie' },
        { id: 'clients', icon: '👥', title: 'Raport klientów', description: 'Aktywność i lojalność' }
    ];

    const generateReport = (reportId) => {
        setGenerating(reportId);
        setTimeout(() => {
            setGenerating(null);
            showNotification('Raport wygenerowany i gotowy do pobrania', 'success');
        }, 2000);
    };

    return (
        <DashboardLayout menuItems={menuItems} title="Raporty" roleColor="#9b59b6">
            <div className="dashboard-page">
                <div className="page-header">
                    <h3>Generuj raporty</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <select style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            <option>Ostatni miesiąc</option>
                            <option>Ostatni kwartał</option>
                            <option>Ostatni rok</option>
                            <option>Własny zakres</option>
                        </select>
                    </div>
                </div>

                <div className="reports-grid">
                    {reports.map(report => (
                        <Card key={report.id} className="report-card" hoverable onClick={() => generateReport(report.id)}>
                            <div className="report-icon">{report.icon}</div>
                            <div className="report-title">{report.title}</div>
                            <div className="report-description">{report.description}</div>
                            <Button variant="outline" size="small" style={{ marginTop: 'var(--space-3)' }} disabled={generating === report.id}>
                                {generating === report.id ? '⏳ Generowanie...' : '📥 Generuj'}
                            </Button>
                        </Card>
                    ))}
                </div>

                <Card title="📊 Szybkie statystyki" style={{ marginTop: 'var(--space-6)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--primary)' }}>1,250</div><div style={{ color: 'var(--text-muted)' }}>Klientów</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#2ecc71' }}>2,340</div><div style={{ color: 'var(--text-muted)' }}>Zwierząt</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#f39c12' }}>156</div><div style={{ color: 'var(--text-muted)' }}>Wizyt w tym mies.</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#e74c3c' }}>85k zł</div><div style={{ color: 'var(--text-muted)' }}>Przychód</div></div>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default AdminReports;
