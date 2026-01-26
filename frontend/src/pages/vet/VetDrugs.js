/**
 * PetCareApp - VetDrugs
 * Drug database with external API integration (URPL, FDA, EMA)
 * @author VS
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { drugService } from '../../services/drugService';
import '../dashboards/DashboardPages.css';

function VetDrugs() {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState(null);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [activeSource, setActiveSource] = useState('all');

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
        loadSources();
    }, []);

    const loadSources = async () => {
        try {
            const data = await drugService.getSources();
            setSources(data);
        } catch (e) {
            setSources([
                { id: 'URPL', name: 'URPL (Polska)', country: 'PL', api: true, url: 'https://pub.rejestrymedyczne.csioz.gov.pl' },
                { id: 'FDA', name: 'FDA openFDA (USA)', country: 'US', api: true, url: 'https://open.fda.gov' },
                { id: 'EMA', name: 'EMA (UE)', country: 'EU', api: false, url: 'https://www.ema.europa.eu' }
            ]);
        }
    };

    const handleSearch = async () => {
        if (searchQuery.length < 2) return;
        
        setLoading(true);
        setResults(null);
        
        try {
            const data = await drugService.searchDrugs(searchQuery, activeSource);
            setResults(data);
        } catch (e) {
            console.error('Search error:', e);
            setResults({ error: 'Błąd wyszukiwania. Spróbuj ponownie.', drugs: [] });
        } finally {
            setLoading(false);
        }
    };

    const getSourceFlag = (source) => {
        const flags = { 'URPL': '🇵🇱', 'FDA': '🇺🇸', 'EMA': '🇪🇺', 'GIW': '🇵🇱' };
        return flags[source] || '🌐';
    };

    return (
        <DashboardLayout menuItems={menuItems} title="Baza leków weterynaryjnych" roleColor="#3498db">
            <div className="dashboard-page">
                {/* Info o źródłach */}
                <Card style={{ marginBottom: 'var(--space-6)', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 var(--space-3) 0' }}>🔗 Zewnętrzne bazy danych</h3>
                    <p style={{ margin: '0 0 var(--space-3) 0', opacity: 0.9 }}>
                        Wyszukiwanie w czasie rzeczywistym z oficjalnych rejestrów leków weterynaryjnych:
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                        {sources.map(src => (
                            <a key={src.id} href={src.url} target="_blank" rel="noopener noreferrer"
                               style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', 
                                        background: 'rgba(255,255,255,0.2)', padding: 'var(--space-2) var(--space-3)',
                                        borderRadius: 'var(--radius-md)', color: 'white', textDecoration: 'none' }}>
                                {getSourceFlag(src.id)} {src.name}
                                {src.api && <span style={{ fontSize: '10px', background: '#4ade80', color: '#000', padding: '2px 6px', borderRadius: '10px' }}>API</span>}
                            </a>
                        ))}
                    </div>
                </Card>

                {/* Wyszukiwarka */}
                <Card style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ margin: '0 0 var(--space-4) 0' }}>🔍 Wyszukaj lek</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        <Input 
                            type="text"
                            placeholder="Nazwa leku lub substancja czynna (np. amoxicillin, meloxicam)..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSearch()}
                            style={{ flex: 1, minWidth: '300px' }}
                        />
                        <select 
                            value={activeSource} 
                            onChange={e => setActiveSource(e.target.value)}
                            style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                        >
                            <option value="all">🌐 Wszystkie źródła</option>
                            <option value="URPL">🇵🇱 URPL (Polska)</option>
                            <option value="FDA">🇺🇸 FDA (USA)</option>
                            <option value="EMA">🇪🇺 EMA (UE)</option>
                        </select>
                        <Button onClick={handleSearch} disabled={loading || searchQuery.length < 2}>
                            {loading ? '⏳ Szukam...' : '🔍 Szukaj'}
                        </Button>
                    </div>
                    <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Wpisz minimum 2 znaki. Wyniki pobierane w czasie rzeczywistym z zewnętrznych API.
                    </p>
                </Card>

                {/* Loading */}
                {loading && (
                    <Card style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                        <LoadingSpinner />
                        <p style={{ marginTop: 'var(--space-4)' }}>Przeszukuję bazy danych...</p>
                    </Card>
                )}

                {/* Wyniki */}
                {results && !loading && (
                    <div>
                        {/* Podsumowanie źródeł */}
                        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                            {results.sources?.map(src => (
                                <div key={src.id} style={{ 
                                    padding: 'var(--space-2) var(--space-3)', 
                                    background: src.error ? '#fee2e2' : '#dcfce7',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '13px'
                                }}>
                                    {getSourceFlag(src.id)} {src.name}: {src.error ? `❌ ${src.error}` : `✅ ${src.count} wyników`}
                                </div>
                            ))}
                        </div>

                        {/* Lista wyników */}
                        {results.drugs?.length > 0 ? (
                            <Card>
                                <h4 style={{ margin: '0 0 var(--space-4) 0' }}>
                                    Znaleziono {results.total || results.drugs.length} leków
                                    {results.cached && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>(z cache)</span>}
                                </h4>
                                <table className="admin-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Źródło</th>
                                            <th>Nazwa</th>
                                            <th>Substancja czynna</th>
                                            <th>Postać</th>
                                            <th>Producent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.drugs.map((drug, idx) => (
                                            <tr key={drug.id || idx} onClick={() => setSelectedDrug(drug)} style={{ cursor: 'pointer' }}>
                                                <td>
                                                    <span style={{ fontSize: '20px' }}>{getSourceFlag(drug.source)}</span>
                                                </td>
                                                <td>
                                                    <strong>{drug.name}</strong>
                                                    {drug.registrationNumber && (
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                            Nr: {drug.registrationNumber}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>{drug.activeSubstance || '-'}</td>
                                                <td>{drug.form || '-'}</td>
                                                <td>{drug.manufacturer || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        ) : (
                            <Card style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                                <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🔍</div>
                                <h3>Brak wyników</h3>
                                <p>Nie znaleziono leków dla zapytania "{results.query}"</p>
                            </Card>
                        )}
                    </div>
                )}

                {/* Modal szczegółów */}
                {selectedDrug && (
                    <div className="modal-overlay" onClick={() => setSelectedDrug(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{getSourceFlag(selectedDrug.source)} {selectedDrug.name}</h2>
                                <button className="modal-close" onClick={() => setSelectedDrug(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                    <div><strong>Źródło:</strong> {selectedDrug.source}</div>
                                    <div><strong>Nr rejestracji:</strong> {selectedDrug.registrationNumber || '-'}</div>
                                    <div><strong>Substancja czynna:</strong> {selectedDrug.activeSubstance || '-'}</div>
                                    <div><strong>Postać:</strong> {selectedDrug.form || '-'}</div>
                                    <div><strong>Producent:</strong> {selectedDrug.manufacturer || '-'}</div>
                                    <div><strong>ATC:</strong> {selectedDrug.atcCode || '-'}</div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost" onClick={() => setSelectedDrug(null)}>Zamknij</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sekcja pomocy */}
                {!results && !loading && (
                    <Card style={{ background: 'var(--bg-secondary)' }}>
                        <h4>💡 Wskazówki</h4>
                        <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
                            <li><strong>URPL</strong> - Polski rejestr z pełnymi danymi rejestracyjnymi</li>
                            <li><strong>FDA</strong> - Amerykańska baza z danymi o działaniach niepożądanych</li>
                            <li><strong>EMA</strong> - Europejska baza (dane do pobrania, brak API)</li>
                        </ul>
                        <p style={{ marginTop: 'var(--space-3)', fontSize: '13px', color: 'var(--text-muted)' }}>
                            Przykładowe wyszukiwania: amoxicillin, meloxicam, fipronil, ivermectin
                        </p>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}

export default VetDrugs;
