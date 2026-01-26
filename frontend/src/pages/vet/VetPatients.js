/**
 * PetCareApp - VetPatients
 * Zarządzanie pacjentami weterynarza
 * @author VS
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../dashboards/DashboardPages.css';
import './VetPages.css';

function VetPatients() {
    const { t } = useTranslation();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [filter, setFilter] = useState('all');

    const menuItems = [
        { path: '/dashboard/vet', label: t('dashboard.vet.overview'), icon: '📊', exact: true },
        { path: '/dashboard/vet/patients', label: t('dashboard.vet.patients'), icon: '🐾' },
        { path: '/dashboard/vet/records', label: t('dashboard.vet.records'), icon: '📋' },
        { path: '/dashboard/vet/schedule', label: t('dashboard.vet.schedule'), icon: '📅' },
        { path: '/dashboard/vet/stats', label: t('dashboard.vet.stats'), icon: '📈' }
    ];

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            // Demo data - VS
            setPatients([
                { id: '1', name: 'Burek', species: 'dog', breed: 'Labrador', age: '3 lata', owner: 'Jan Kowalski', ownerPhone: '+48 123 456 789', lastVisit: '2024-12-15', status: 'healthy', weight: '32kg', microchip: '123456789012345', notes: 'Alergia na kurczaka' },
                { id: '2', name: 'Mruczka', species: 'cat', breed: 'Perski', age: '5 lat', owner: 'Anna Nowak', ownerPhone: '+48 987 654 321', lastVisit: '2024-12-10', status: 'treatment', weight: '4.5kg', microchip: '987654321098765', notes: 'W trakcie leczenia antybiotykiem' },
                { id: '3', name: 'Rex', species: 'dog', breed: 'Owczarek', age: '7 lat', owner: 'Piotr Wiśniewski', ownerPhone: '+48 555 666 777', lastVisit: '2024-12-08', status: 'recovery', weight: '38kg', microchip: '', notes: 'Rekonwalescencja po zabiegu' },
                { id: '4', name: 'Luna', species: 'cat', breed: 'Maine Coon', age: '2 lata', owner: 'Maria Kowalczyk', ownerPhone: '+48 111 222 333', lastVisit: '2024-11-20', status: 'healthy', weight: '6kg', microchip: '456789012345678', notes: '' },
                { id: '5', name: 'Max', species: 'dog', breed: 'Golden Retriever', age: '4 lata', owner: 'Tomasz Zieliński', ownerPhone: '+48 444 555 666', lastVisit: '2024-11-15', status: 'healthy', weight: '35kg', microchip: '789012345678901', notes: 'Szczepienia aktualne do 06/2025' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getSpeciesIcon = (species) => species === 'dog' ? '🐕' : species === 'cat' ? '🐱' : '🐾';
    
    const getStatusBadge = (status) => ({
        healthy: { label: 'Zdrowy', class: 'success' },
        treatment: { label: 'W leczeniu', class: 'warning' },
        recovery: { label: 'Rekonwalescencja', class: 'info' },
        critical: { label: 'Krytyczny', class: 'danger' }
    }[status] || { label: status, class: '' });

    const filtered = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             p.breed.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || p.status === filter;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <DashboardLayout menuItems={menuItems} title="Pacjenci" roleColor="#3498db"><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout menuItems={menuItems} title="Pacjenci" roleColor="#3498db">
            <div className="dashboard-page">
                <div className="page-header">
                    <div className="search-filter-row">
                        <Input type="text" placeholder="Szukaj pacjenta lub właściciela..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} icon="🔍" className="search-input" style={{ minWidth: '300px' }} />
                        <div className="filter-buttons">
                            {['all', 'healthy', 'treatment', 'recovery'].map(f => (
                                <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                                    {f === 'all' ? 'Wszyscy' : getStatusBadge(f).label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="patients-table">
                    <div className="table-header-row">
                        <span>Pacjent</span>
                        <span>Właściciel</span>
                        <span>Ostatnia wizyta</span>
                        <span>Status</span>
                        <span>Akcje</span>
                    </div>
                    {filtered.map(patient => {
                        const status = getStatusBadge(patient.status);
                        return (
                            <div key={patient.id} className="table-data-row" onClick={() => setSelectedPatient(patient)}>
                                <div className="patient-cell">
                                    <span className="patient-avatar">{getSpeciesIcon(patient.species)}</span>
                                    <div>
                                        <div className="patient-name">{patient.name}</div>
                                        <div className="patient-breed">{patient.breed} • {patient.age}</div>
                                    </div>
                                </div>
                                <div className="owner-cell">
                                    <div>{patient.owner}</div>
                                    <div className="owner-phone">{patient.ownerPhone}</div>
                                </div>
                                <div>{patient.lastVisit}</div>
                                <div><span className={`status-badge-vet ${status.class}`}>{status.label}</span></div>
                                <div className="actions-cell">
                                    <Button variant="ghost" size="small" onClick={e => { e.stopPropagation(); setSelectedPatient(patient); }}>📋 Kartoteka</Button>
                                    <Button variant="ghost" size="small">📅 Wizyta</Button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selectedPatient && (
                    <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
                        <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{getSpeciesIcon(selectedPatient.species)} {selectedPatient.name}</h2>
                                <button className="modal-close" onClick={() => setSelectedPatient(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="patient-detail-grid">
                                    <Card variant="flat">
                                        <h4>Dane pacjenta</h4>
                                        <div className="detail-list">
                                            <div><span>Gatunek:</span><span>{selectedPatient.species === 'dog' ? 'Pies' : 'Kot'}</span></div>
                                            <div><span>Rasa:</span><span>{selectedPatient.breed}</span></div>
                                            <div><span>Wiek:</span><span>{selectedPatient.age}</span></div>
                                            <div><span>Waga:</span><span>{selectedPatient.weight}</span></div>
                                            <div><span>Mikrochip:</span><span>{selectedPatient.microchip || 'Brak'}</span></div>
                                        </div>
                                    </Card>
                                    <Card variant="flat">
                                        <h4>Właściciel</h4>
                                        <div className="detail-list">
                                            <div><span>Imię i nazwisko:</span><span>{selectedPatient.owner}</span></div>
                                            <div><span>Telefon:</span><span>{selectedPatient.ownerPhone}</span></div>
                                            <div><span>Ostatnia wizyta:</span><span>{selectedPatient.lastVisit}</span></div>
                                        </div>
                                    </Card>
                                </div>
                                {selectedPatient.notes && (
                                    <Card variant="flat" style={{ marginTop: 'var(--space-4)', background: '#fff3cd' }}>
                                        <h4>⚠️ Uwagi</h4>
                                        <p>{selectedPatient.notes}</p>
                                    </Card>
                                )}
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost">📋 Historia medyczna</Button>
                                <Button variant="ghost">💉 Szczepienia</Button>
                                <Button>+ Nowy wpis</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default VetPatients;
