/**
 * PetCareApp - VetStats
 * Statystyki i raporty weterynarza
 * @author VS
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../dashboards/DashboardPages.css';
import './VetPages.css';

function VetStats() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [stats, setStats] = useState({});

    const menuItems = [
        { path: '/dashboard/vet', label: t('dashboard.vet.overview'), icon: '📊', exact: true },
        { path: '/dashboard/vet/patients', label: t('dashboard.vet.patients'), icon: '🐾' },
        { path: '/dashboard/vet/records', label: t('dashboard.vet.records'), icon: '📋' },
        { path: '/dashboard/vet/schedule', label: t('dashboard.vet.schedule'), icon: '📅' },
        { path: '/dashboard/vet/stats', label: t('dashboard.vet.stats'), icon: '📈' }
    ];

    useEffect(() => { fetchStats(); }, [period]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            // Demo data - VS
            setStats({
                appointments: { total: period === 'month' ? 156 : period === 'week' ? 38 : 8, trend: 12 },
                patients: { total: period === 'month' ? 89 : period === 'week' ? 24 : 6, trend: 8 },
                surgeries: { total: period === 'month' ? 12 : period === 'week' ? 3 : 1, trend: 5 },
                vaccinations: { total: period === 'month' ? 45 : period === 'week' ? 11 : 3, trend: -3 },
                byType: [
                    { type: 'Konsultacja', count: 45, color: '#3498db' },
                    { type: 'Szczepienie', count: 38, color: '#2ecc71' },
                    { type: 'Badanie', count: 32, color: '#f39c12' },
                    { type: 'Zabieg', count: 18, color: '#e74c3c' },
                    { type: 'Inne', count: 23, color: '#9b59b6' }
                ],
                bySpecies: [
                    { species: 'Psy', count: 98, icon: '🐕' },
                    { species: 'Koty', count: 52, icon: '🐱' },
                    { species: 'Inne', count: 6, icon: '🐾' }
                ],
                weeklyTrend: [
                    { day: 'Pn', value: 8 },
                    { day: 'Wt', value: 12 },
                    { day: 'Śr', value: 10 },
                    { day: 'Cz', value: 15 },
                    { day: 'Pt', value: 11 },
                    { day: 'Sb', value: 5 },
                    { day: 'Nd', value: 0 }
                ],
                topDiagnoses: [
                    { diagnosis: 'Szczepienie profilaktyczne', count: 45 },
                    { diagnosis: 'Zapalenie ucha', count: 12 },
                    { diagnosis: 'Problemy skórne', count: 10 },
                    { diagnosis: 'Problemy trawienne', count: 8 },
                    { diagnosis: 'Badanie kontrolne', count: 25 }
                ]
            });
        } finally { setLoading(false); }
    };

    const maxWeeklyValue = Math.max(...(stats.weeklyTrend || []).map(d => d.value));
    const totalByType = (stats.byType || []).reduce((sum, t) => sum + t.count, 0);

    if (loading) return <DashboardLayout menuItems={menuItems} title="Statystyki" roleColor="#3498db"><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout menuItems={menuItems} title="Statystyki" roleColor="#3498db">
            <div className="dashboard-page">
                {/* Wybór okresu - VS */}
                <div className="page-header">
                    <div className="filter-buttons">
                        <button className={`filter-btn ${period === 'day' ? 'active' : ''}`} onClick={() => setPeriod('day')}>Dziś</button>
                        <button className={`filter-btn ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>Tydzień</button>
                        <button className={`filter-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Miesiąc</button>
                    </div>
                    <Button variant="ghost">📥 Eksportuj raport</Button>
                </div>

                {/* Główne statystyki - VS */}
                <div className="stats-overview">
                    <Card variant="flat" className="stat-card-large">
                        <div className="stat-number" style={{ color: 'var(--primary)' }}>{stats.appointments?.total}</div>
                        <div className="stat-label">Wizyt</div>
                        <div className={`stat-trend ${stats.appointments?.trend >= 0 ? 'positive' : 'negative'}`}>
                            {stats.appointments?.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.appointments?.trend)}%
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card-large">
                        <div className="stat-number" style={{ color: '#2ecc71' }}>{stats.patients?.total}</div>
                        <div className="stat-label">Pacjentów</div>
                        <div className={`stat-trend ${stats.patients?.trend >= 0 ? 'positive' : 'negative'}`}>
                            {stats.patients?.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.patients?.trend)}%
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card-large">
                        <div className="stat-number" style={{ color: '#e74c3c' }}>{stats.surgeries?.total}</div>
                        <div className="stat-label">Zabiegów</div>
                        <div className={`stat-trend ${stats.surgeries?.trend >= 0 ? 'positive' : 'negative'}`}>
                            {stats.surgeries?.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.surgeries?.trend)}%
                        </div>
                    </Card>
                    <Card variant="flat" className="stat-card-large">
                        <div className="stat-number" style={{ color: '#f39c12' }}>{stats.vaccinations?.total}</div>
                        <div className="stat-label">Szczepień</div>
                        <div className={`stat-trend ${stats.vaccinations?.trend >= 0 ? 'positive' : 'negative'}`}>
                            {stats.vaccinations?.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.vaccinations?.trend)}%
                        </div>
                    </Card>
                </div>

                <div className="dashboard-grid">
                    {/* Wykres tygodniowy - VS */}
                    <Card title="📈 Wizyty w tygodniu" className="chart-card">
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '200px', padding: 'var(--space-4)' }}>
                            {stats.weeklyTrend?.map((day, idx) => (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{day.value}</span>
                                    <div style={{
                                        width: '40px',
                                        height: `${(day.value / maxWeeklyValue) * 150}px`,
                                        background: 'var(--primary)',
                                        borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                                        minHeight: '4px'
                                    }} />
                                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{day.day}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Podział według typu - VS */}
                    <Card title="📊 Wizyty według typu">
                        <div style={{ padding: 'var(--space-4)' }}>
                            {stats.byType?.map((item, idx) => (
                                <div key={idx} style={{ marginBottom: 'var(--space-3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                                        <span>{item.type}</span>
                                        <span style={{ fontWeight: 500 }}>{item.count} ({Math.round(item.count / totalByType * 100)}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)' }}>
                                        <div style={{
                                            width: `${(item.count / totalByType) * 100}%`,
                                            height: '100%',
                                            background: item.color,
                                            borderRadius: 'var(--radius-full)'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Podział według gatunku - VS */}
                    <Card title="🐾 Pacjenci według gatunku">
                        <div style={{ display: 'flex', justifyContent: 'space-around', padding: 'var(--space-6)' }}>
                            {stats.bySpecies?.map((item, idx) => (
                                <div key={idx} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>{item.icon}</div>
                                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{item.count}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{item.species}</div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Top diagnozy - VS */}
                    <Card title="🏆 Najczęstsze diagnozy">
                        <div style={{ padding: 'var(--space-4)' }}>
                            {stats.topDiagnoses?.map((item, idx) => (
                                <div key={idx} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    padding: 'var(--space-2) 0',
                                    borderBottom: idx < stats.topDiagnoses.length - 1 ? '1px solid var(--border-color)' : 'none'
                                }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <span style={{ 
                                            width: '24px', 
                                            height: '24px', 
                                            background: idx < 3 ? 'var(--primary)' : 'var(--bg-secondary)',
                                            color: idx < 3 ? 'white' : 'var(--text-muted)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: 600
                                        }}>{idx + 1}</span>
                                        {item.diagnosis}
                                    </span>
                                    <span style={{ fontWeight: 500 }}>{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default VetStats;
