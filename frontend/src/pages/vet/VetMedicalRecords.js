/**
 * PetCareApp - VetMedicalRecords
 * Dokumentacja medyczna pacjentów
 * @author VS
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../context/NotificationContext';
import '../dashboards/DashboardPages.css';
import './VetPages.css';

function VetMedicalRecords() {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showNewRecordModal, setShowNewRecordModal] = useState(false);
    const [newRecord, setNewRecord] = useState({
        patientId: '', type: 'examination', diagnosis: '', treatment: '', medications: '', notes: '', followUp: ''
    });

    const menuItems = [
        { path: '/dashboard/vet', label: t('dashboard.vet.overview'), icon: '📊', exact: true },
        { path: '/dashboard/vet/patients', label: t('dashboard.vet.patients'), icon: '🐾' },
        { path: '/dashboard/vet/records', label: t('dashboard.vet.records'), icon: '📋' },
        { path: '/dashboard/vet/schedule', label: t('dashboard.vet.schedule'), icon: '📅' },
        { path: '/dashboard/vet/stats', label: t('dashboard.vet.stats'), icon: '📈' }
    ];

    const recordTypes = [
        { value: 'examination', label: 'Badanie', icon: '🩺' },
        { value: 'vaccination', label: 'Szczepienie', icon: '💉' },
        { value: 'surgery', label: 'Zabieg', icon: '⚕️' },
        { value: 'prescription', label: 'Recepta', icon: '💊' },
        { value: 'lab', label: 'Badania lab.', icon: '🔬' }
    ];

    useEffect(() => { fetchRecords(); }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            setRecords([
                { id: '1', date: '2024-12-15', type: 'examination', patient: 'Burek', owner: 'Jan Kowalski', diagnosis: 'Zapalenie ucha', treatment: 'Krople uszne 2x dziennie', medications: 'Otibact', notes: 'Kontrola za tydzień', vet: 'dr Anna Kowalska' },
                { id: '2', date: '2024-12-14', type: 'vaccination', patient: 'Mruczka', owner: 'Anna Nowak', diagnosis: 'Szczepienie roczne', treatment: 'Nobivac Tricat', medications: '-', notes: 'Następne za rok', vet: 'dr Anna Kowalska' },
                { id: '3', date: '2024-12-12', type: 'surgery', patient: 'Rex', owner: 'Piotr Wiśniewski', diagnosis: 'Guz skóry', treatment: 'Usunięcie chirurgiczne', medications: 'Antybiotyk 7 dni', notes: 'Zdjęcie szwów 10.01', vet: 'dr Anna Kowalska' },
                { id: '4', date: '2024-12-10', type: 'lab', patient: 'Luna', owner: 'Maria Kowalczyk', diagnosis: 'Morfologia krwi', treatment: 'Wyniki w normie', medications: '-', notes: '', vet: 'dr Anna Kowalska' },
                { id: '5', date: '2024-12-08', type: 'prescription', patient: 'Max', owner: 'Tomasz Zieliński', diagnosis: 'Alergia skórna', treatment: 'Dieta hipoalergiczna', medications: 'Apoquel 16mg', notes: 'Kontrola za miesiąc', vet: 'dr Anna Kowalska' }
            ]);
        } finally { setLoading(false); }
    };

    const handleSaveRecord = () => {
        if (!newRecord.patientId || !newRecord.diagnosis) {
            showNotification('Uzupełnij wymagane pola', 'error');
            return;
        }
        const record = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            ...newRecord,
            patient: 'Nowy pacjent', // W rzeczywistości z wyboru
            owner: 'Właściciel',
            vet: 'dr Anna Kowalska'
        };
        setRecords(prev => [record, ...prev]);
        showNotification('Zapisano rekord', 'success');
        setShowNewRecordModal(false);
        setNewRecord({ patientId: '', type: 'examination', diagnosis: '', treatment: '', medications: '', notes: '', followUp: '' });
    };

    const getTypeInfo = (type) => recordTypes.find(t => t.value === type) || { label: type, icon: '📋' };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return { day: date.getDate(), month: date.toLocaleString('pl', { month: 'short' }) };
    };

    const filtered = records.filter(r => {
        const matchesSearch = r.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             r.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || r.type === filter;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <DashboardLayout menuItems={menuItems} title="Dokumentacja medyczna" roleColor="#3498db"><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout menuItems={menuItems} title="Dokumentacja medyczna" roleColor="#3498db">
            <div className="dashboard-page">
                <div className="page-header">
                    <div className="search-filter-row">
                        <Input type="text" placeholder="Szukaj pacjenta lub diagnozy..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} icon="🔍" className="search-input" />
                        <div className="filter-buttons">
                            <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Wszystkie</button>
                            {recordTypes.map(type => (
                                <button key={type.value} className={`filter-btn ${filter === type.value ? 'active' : ''}`} onClick={() => setFilter(type.value)}>
                                    {type.icon} {type.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button onClick={() => setShowNewRecordModal(true)}>+ Nowy wpis</Button>
                </div>

                <div className="records-list">
                    {filtered.map(record => {
                        const dateInfo = formatDate(record.date);
                        const typeInfo = getTypeInfo(record.type);
                        return (
                            <div key={record.id} className="record-item" onClick={() => setSelectedRecord(record)}>
                                <div className="record-date-box">
                                    <div className="day">{dateInfo.day}</div>
                                    <div className="month">{dateInfo.month}</div>
                                </div>
                                <div className="record-content">
                                    <div className="record-type">{typeInfo.icon} {typeInfo.label}</div>
                                    <div className="record-patient">🐾 {record.patient} • {record.owner}</div>
                                    <div className="record-summary">{record.diagnosis}</div>
                                </div>
                                <Button variant="ghost" size="small">Zobacz</Button>
                            </div>
                        );
                    })}
                </div>

                {/* Modal szczegółów */}
                {selectedRecord && (
                    <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
                        <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{getTypeInfo(selectedRecord.type).icon} Wpis medyczny - {selectedRecord.patient}</h2>
                                <button className="modal-close" onClick={() => setSelectedRecord(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="patient-detail-grid">
                                    <Card variant="flat">
                                        <h4>Informacje</h4>
                                        <div className="detail-list">
                                            <div><span>Data:</span><span>{selectedRecord.date}</span></div>
                                            <div><span>Typ:</span><span>{getTypeInfo(selectedRecord.type).label}</span></div>
                                            <div><span>Pacjent:</span><span>{selectedRecord.patient}</span></div>
                                            <div><span>Właściciel:</span><span>{selectedRecord.owner}</span></div>
                                            <div><span>Lekarz:</span><span>{selectedRecord.vet}</span></div>
                                        </div>
                                    </Card>
                                    <Card variant="flat">
                                        <h4>Diagnoza i leczenie</h4>
                                        <div className="detail-list">
                                            <div><span>Diagnoza:</span><span>{selectedRecord.diagnosis}</span></div>
                                            <div><span>Leczenie:</span><span>{selectedRecord.treatment}</span></div>
                                            <div><span>Leki:</span><span>{selectedRecord.medications}</span></div>
                                        </div>
                                    </Card>
                                </div>
                                {selectedRecord.notes && (
                                    <Card variant="flat" style={{ marginTop: 'var(--space-4)' }}>
                                        <h4>Uwagi</h4>
                                        <p>{selectedRecord.notes}</p>
                                    </Card>
                                )}
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost">🖨️ Drukuj</Button>
                                <Button variant="ghost">✏️ Edytuj</Button>
                                <Button onClick={() => setSelectedRecord(null)}>Zamknij</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal nowego wpisu */}
                {showNewRecordModal && (
                    <div className="modal-overlay" onClick={() => setShowNewRecordModal(false)}>
                        <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Nowy wpis medyczny</h2>
                                <button className="modal-close" onClick={() => setShowNewRecordModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="record-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Pacjent *</label>
                                            <select value={newRecord.patientId} onChange={e => setNewRecord(p => ({ ...p, patientId: e.target.value }))}>
                                                <option value="">Wybierz pacjenta...</option>
                                                <option value="1">🐕 Burek - Jan Kowalski</option>
                                                <option value="2">🐱 Mruczka - Anna Nowak</option>
                                                <option value="3">🐕 Rex - Piotr Wiśniewski</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Typ wpisu</label>
                                            <select value={newRecord.type} onChange={e => setNewRecord(p => ({ ...p, type: e.target.value }))}>
                                                {recordTypes.map(type => (
                                                    <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <Input label="Diagnoza *" value={newRecord.diagnosis} onChange={e => setNewRecord(p => ({ ...p, diagnosis: e.target.value }))} placeholder="Wpisz diagnozę..." />
                                    <Input label="Leczenie" value={newRecord.treatment} onChange={e => setNewRecord(p => ({ ...p, treatment: e.target.value }))} placeholder="Zalecone leczenie..." />
                                    <Input label="Leki" value={newRecord.medications} onChange={e => setNewRecord(p => ({ ...p, medications: e.target.value }))} placeholder="Przepisane leki..." />
                                    <div className="form-group">
                                        <label>Uwagi</label>
                                        <textarea value={newRecord.notes} onChange={e => setNewRecord(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Dodatkowe uwagi..." />
                                    </div>
                                    <Input label="Termin kontroli" type="date" value={newRecord.followUp} onChange={e => setNewRecord(p => ({ ...p, followUp: e.target.value }))} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost" onClick={() => setShowNewRecordModal(false)}>Anuluj</Button>
                                <Button onClick={handleSaveRecord}>Zapisz wpis</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default VetMedicalRecords;
