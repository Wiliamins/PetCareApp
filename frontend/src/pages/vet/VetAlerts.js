/**
 * PetCareApp - VetAlerts
 * Disease alerts with external API integration (WOAH, ADNS, GIW, EFSA)
 * @author VS
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { diseaseAlertService } from '../../services/diseaseAlertService';
import '../dashboards/DashboardPages.css';

function VetAlerts() {
    const { t } = useTranslation();
    const [alerts, setAlerts] = useState(null);
    const [sources, setSources] = useState([]);
    const [diseases, setDiseases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sources');
    const [selectedSource, setSelectedSource] = useState(null);

    const menuItems = [
        { path: '/dashboard/vet', label: t('dashboard.vet.overview'), icon: '📊', exact: true },
        { path: '/dashboard/vet/patients', label: t('dashboard.vet.patients'), icon: '🐾' },
        { path: '/dashboard/vet/records', label: t('dashboard.vet.records'), icon: '📋' },
        { path: '/dashboard/vet/schedule', label: t('dashboard.vet.schedule'), icon: '📅' },
        { path: '/dashboard/vet/drugs', label: 'Baza leków', icon: '💊' },
        { path: '/dashboard/vet/alerts', label: 'Alerty PIW', icon: '⚠️' },
        { path: '/dashboard/vet/stats', label: t('dashboard.vet.stats'), icon: '📈' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sourcesData, diseasesData, alertsData] = await Promise.all([
                diseaseAlertService.getSources(),
                diseaseAlertService.getDiseases(),
                diseaseAlertService.getAlerts()
            ]);
            setSources(sourcesData);
            setDiseases(diseasesData);
            setAlerts(alertsData);
        } catch (e) {
            console.error('Load error:', e);
            // Fallback data
            setSources([
                { id: 'WOAH', name: 'World Organisation for Animal Health', url: 'https://wahis.woah.org', type: 'Global', api: true },
                { id: 'ADIS', name: 'EU Animal Disease Information System', url: 'https://ec.europa.eu/food/animals/animal-diseases_en', type: 'EU', api: false },
                { id: 'GIW', name: 'Główny Inspektorat Weterynarii', url: 'https://www.wetgiw.gov.pl', type: 'Poland', api: false },
                { id: 'EFSA', name: 'European Food Safety Authority', url: 'https://www.efsa.europa.eu', type: 'EU', api: false }
            ]);
            setDiseases([
                { id: 'asf', name: 'ASF', name_en: 'African Swine Fever', notifiable: true, species: ['świnie', 'dziki'] },
                { id: 'hpai', name: 'HPAI', name_en: 'Avian Influenza', notifiable: true, species: ['drób'] },
                { id: 'rabies', name: 'Wścieklizna', name_en: 'Rabies', notifiable: true, zoonotic: true, species: ['ssaki'] }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type) => ({
        'Global': '#3b82f6',
        'EU': '#8b5cf6',
        'Poland': '#ef4444'
    }[type] || '#6b7280');

    if (loading) {
        return (
            <DashboardLayout menuItems={menuItems} title="Alerty epidemiologiczne" roleColor="#3498db">
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
                    <LoadingSpinner />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout menuItems={menuItems} title="Alerty epidemiologiczne" roleColor="#3498db">
            <div className="dashboard-page">
                {/* Header z info */}
                <Card style={{ marginBottom: 'var(--space-6)', background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 var(--space-3) 0' }}>🌍 Oficjalne źródła alertów epidemiologicznych</h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>
                        Dane z międzynarodowych i krajowych systemów nadzoru weterynaryjnego. 
                        Kliknij w źródło, aby przejść do oficjalnego portalu.
                    </p>
                </Card>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                    <Button variant={activeTab === 'sources' ? 'primary' : 'outline'} onClick={() => setActiveTab('sources')}>
                        🔗 Źródła danych
                    </Button>
                    <Button variant={activeTab === 'diseases' ? 'primary' : 'outline'} onClick={() => setActiveTab('diseases')}>
                        🦠 Choroby monitorowane
                    </Button>
                    <Button variant={activeTab === 'maps' ? 'primary' : 'outline'} onClick={() => setActiveTab('maps')}>
                        🗺️ Mapy interaktywne
                    </Button>
                </div>

                {/* Źródła danych */}
                {activeTab === 'sources' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-4)' }}>
                        {sources.map(src => (
                            <Card key={src.id} className="source-card" style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                                    <div>
                                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            {src.id === 'WOAH' && '🌐'}
                                            {src.id === 'ADIS' && '🇪🇺'}
                                            {src.id === 'GIW' && '🇵🇱'}
                                            {src.id === 'EFSA' && '🔬'}
                                            {src.name}
                                        </h3>
                                        {src.alt_name && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({src.alt_name})</div>}
                                    </div>
                                    <span style={{ 
                                        padding: '4px 10px', 
                                        background: getTypeColor(src.type), 
                                        color: 'white', 
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '12px'
                                    }}>
                                        {src.type}
                                    </span>
                                </div>
                                
                                <p style={{ margin: '0 0 var(--space-3) 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    {src.description}
                                </p>
                                
                                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                                    {src.api ? (
                                        <span style={{ padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-sm)', fontSize: '11px' }}>
                                            ✅ API dostępne
                                        </span>
                                    ) : (
                                        <span style={{ padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 'var(--radius-sm)', fontSize: '11px' }}>
                                            📥 Dane do pobrania
                                        </span>
                                    )}
                                </div>
                                
                                <a href={src.url} target="_blank" rel="noopener noreferrer" 
                                   style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--primary)' }}>
                                    🔗 {src.url.replace('https://', '')}
                                </a>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Choroby monitorowane */}
                {activeTab === 'diseases' && (
                    <Card>
                        <h3 style={{ margin: '0 0 var(--space-4) 0' }}>Choroby podlegające obowiązkowi zgłaszania</h3>
                        <table className="admin-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Choroba</th>
                                    <th>Nazwa angielska</th>
                                    <th>Gatunki</th>
                                    <th>Zgłaszanie</th>
                                    <th>Zoonoza</th>
                                </tr>
                            </thead>
                            <tbody>
                                {diseases.map(disease => (
                                    <tr key={disease.id}>
                                        <td><strong>{disease.name}</strong></td>
                                        <td>{disease.name_en}</td>
                                        <td>{disease.species?.join(', ')}</td>
                                        <td>
                                            {disease.notifiable ? (
                                                <span style={{ color: '#ef4444' }}>📋 Obowiązkowe</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                                            )}
                                        </td>
                                        <td>
                                            {disease.zoonotic ? (
                                                <span style={{ color: '#ef4444' }}>⚠️ Tak</span>
                                            ) : (
                                                <span style={{ color: '#22c55e' }}>✅ Nie</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}

                {/* Mapy interaktywne */}
                {activeTab === 'maps' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                        <Card>
                            <h3 style={{ margin: '0 0 var(--space-3) 0' }}>🗺️ WAHIS Map (WOAH)</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                                Interaktywna mapa światowa z aktualnymi ogniskami chorób.
                            </p>
                            <a href="https://wahis.woah.org/#/home" target="_blank" rel="noopener noreferrer">
                                <Button fullWidth>Otwórz mapę WAHIS →</Button>
                            </a>
                        </Card>
                        
                        <Card>
                            <h3 style={{ margin: '0 0 var(--space-3) 0' }}>🇵🇱 Mapa ASF (GIW)</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                                Strefy ASF w Polsce - aktualizowana na bieżąco.
                            </p>
                            <a href="https://www.wetgiw.gov.pl/nadzor-weterynaryjny/asf-mapa" target="_blank" rel="noopener noreferrer">
                                <Button fullWidth>Otwórz mapę ASF →</Button>
                            </a>
                        </Card>
                        
                        <Card>
                            <h3 style={{ margin: '0 0 var(--space-3) 0' }}>🐔 Mapa HPAI (GIW)</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                                Ogniska ptasiej grypy w Polsce.
                            </p>
                            <a href="https://www.wetgiw.gov.pl/nadzor-weterynaryjny/hpai-mapa" target="_blank" rel="noopener noreferrer">
                                <Button fullWidth>Otwórz mapę HPAI →</Button>
                            </a>
                        </Card>
                        
                        <Card>
                            <h3 style={{ margin: '0 0 var(--space-3) 0' }}>📍 System BFRW</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                                Interaktywna mapa Bazy Funkcjonalnej Rejestracji Weterynaryjnej.
                            </p>
                            <a href="https://bfrw.mapserver.centerum.pl/" target="_blank" rel="noopener noreferrer">
                                <Button fullWidth>Otwórz BFRW →</Button>
                            </a>
                        </Card>
                        
                        <Card>
                            <h3 style={{ margin: '0 0 var(--space-3) 0' }}>🇪🇺 EU ADIS Dashboard</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                                Europejski system informacji o chorobach zwierząt.
                            </p>
                            <a href="https://ec.europa.eu/food/animals/animal-diseases_en" target="_blank" rel="noopener noreferrer">
                                <Button fullWidth>Otwórz ADIS →</Button>
                            </a>
                        </Card>
                        
                        <Card>
                            <h3 style={{ margin: '0 0 var(--space-3) 0' }}>🔬 EFSA Dashboard</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                                Raporty i oceny ryzyka EFSA.
                            </p>
                            <a href="https://www.efsa.europa.eu/en/topics/topic/animal-health" target="_blank" rel="noopener noreferrer">
                                <Button fullWidth>Otwórz EFSA →</Button>
                            </a>
                        </Card>
                    </div>
                )}

                {/* Footer info */}
                <Card style={{ marginTop: 'var(--space-6)', background: 'var(--bg-secondary)' }}>
                    <h4>ℹ️ Informacja</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Dane epidemiologiczne pobierane są z oficjalnych źródeł międzynarodowych (WOAH/OIE) oraz krajowych (GIW). 
                        W przypadku podejrzenia choroby zakaźnej należy niezwłocznie powiadomić Powiatowego Lekarza Weterynarii.
                        <br/><br/>
                        <strong>Telefon alarmowy GIW:</strong> +48 22 623 10 10
                    </p>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default VetAlerts;
