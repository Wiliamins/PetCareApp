/**
 * PetCareApp - AdminServices - Zarządzanie usługami i cennikiem
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
import './AdminPages.css';

function AdminServices() {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: '', duration: '30', category: 'consultation', active: true });

    const menuItems = [
        { path: '/dashboard/admin', label: t('dashboard.admin.overview'), icon: '📊', exact: true },
        { path: '/dashboard/admin/users', label: t('dashboard.admin.users'), icon: '👥' },
        { path: '/dashboard/admin/appointments', label: t('dashboard.admin.appointments'), icon: '📅' },
        { path: '/dashboard/admin/services', label: t('dashboard.admin.services'), icon: '💼' },
        { path: '/dashboard/admin/content', label: t('dashboard.admin.content'), icon: '📝' },
        { path: '/dashboard/admin/reports', label: t('dashboard.admin.reports'), icon: '📈' }
    ];

    const categories = [
        { value: 'consultation', label: '💬 Konsultacja' },
        { value: 'vaccination', label: '💉 Szczepienie' },
        { value: 'surgery', label: '⚕️ Zabieg' },
        { value: 'diagnostic', label: '🔬 Diagnostyka' },
        { value: 'grooming', label: '✂️ Pielęgnacja' }
    ];

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setServices([
                { id: '1', name: 'Konsultacja weterynaryjna', description: 'Podstawowa konsultacja z badaniem', price: 100, duration: 30, category: 'consultation', active: true },
                { id: '2', name: 'Szczepienie podstawowe', description: 'Szczepienie profilaktyczne', price: 80, duration: 20, category: 'vaccination', active: true },
                { id: '3', name: 'Badanie USG', description: 'Ultrasonografia jamy brzusznej', price: 200, duration: 45, category: 'diagnostic', active: true },
                { id: '4', name: 'Kastracja psa', description: 'Zabieg kastracji z narkozą', price: 500, duration: 120, category: 'surgery', active: true },
                { id: '5', name: 'Strzyżenie psa', description: 'Profesjonalna pielęgnacja sierści', price: 80, duration: 60, category: 'grooming', active: true },
                { id: '6', name: 'RTG', description: 'Zdjęcie rentgenowskie', price: 150, duration: 30, category: 'diagnostic', active: false }
            ]);
            setLoading(false);
        }, 500);
    }, []);

    const handleSave = () => {
        if (!formData.name || !formData.price) { showNotification('Uzupełnij wymagane pola', 'error'); return; }
        if (editingService) {
            setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...formData, price: parseFloat(formData.price) } : s));
            showNotification('Usługa zaktualizowana', 'success');
        } else {
            setServices(prev => [...prev, { id: Date.now().toString(), ...formData, price: parseFloat(formData.price) }]);
            showNotification('Usługa dodana', 'success');
        }
        closeModal();
    };

    const openModal = (service = null) => {
        setEditingService(service);
        setFormData(service || { name: '', description: '', price: '', duration: '30', category: 'consultation', active: true });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingService(null); };
    const toggleActive = (id) => setServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    const getCategoryLabel = (cat) => categories.find(c => c.value === cat)?.label || cat;

    if (loading) return <DashboardLayout menuItems={menuItems} title="Usługi" roleColor="#9b59b6"><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout menuItems={menuItems} title="Cennik usług" roleColor="#9b59b6">
            <div className="dashboard-page">
                <div className="page-header">
                    <div><strong>{services.filter(s => s.active).length}</strong> aktywnych usług</div>
                    <Button onClick={() => openModal()}>+ Dodaj usługę</Button>
                </div>

                <div className="services-grid">
                    {services.map(service => (
                        <Card key={service.id} className={`service-card ${!service.active ? 'inactive' : ''}`} style={{ opacity: service.active ? 1 : 0.6 }}>
                            <div className="service-header">
                                <div className="service-name">{service.name}</div>
                                <div className="service-price">{service.price} zł</div>
                            </div>
                            <div className="service-description">{service.description}</div>
                            <div className="service-meta">
                                <span>⏱️ {service.duration} min</span>
                                <span>{getCategoryLabel(service.category)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                                <Button variant="ghost" size="small" onClick={() => openModal(service)}>✏️ Edytuj</Button>
                                <Button variant="ghost" size="small" onClick={() => toggleActive(service.id)}>{service.active ? '🔒' : '🔓'}</Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header"><h2>{editingService ? 'Edytuj usługę' : 'Nowa usługa'}</h2><button className="modal-close" onClick={closeModal}>×</button></div>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <Input label="Nazwa *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                                    <Input label="Cena (zł) *" type="number" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} />
                                    <Input label="Czas (min)" type="number" value={formData.duration} onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))} />
                                    <div className="form-group">
                                        <label>Kategoria</label>
                                        <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                                            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                                    <label>Opis</label>
                                    <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} />
                                </div>
                            </div>
                            <div className="modal-footer"><Button variant="ghost" onClick={closeModal}>Anuluj</Button><Button onClick={handleSave}>Zapisz</Button></div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default AdminServices;
