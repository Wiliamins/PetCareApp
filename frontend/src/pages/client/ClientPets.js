/**
 * PetCareApp - ClientPets
 * Pełne zarządzanie zwierzętami klienta z formularzami CRUD
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
import petService from '../../services/petService';
import '../dashboards/DashboardPages.css';
import './ClientPages.css';

function ClientPets() {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    
    // Stan komponentu - VS
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPet, setEditingPet] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Formularz - VS
    const [formData, setFormData] = useState({
        name: '',
        species: 'dog',
        breed: '',
        birthDate: '',
        gender: 'male',
        weight: '',
        color: '',
        microchipNumber: '',
        notes: ''
    });
    const [formErrors, setFormErrors] = useState({});

    // Menu sidebara - VS
    const menuItems = [
        { path: '/dashboard/client', label: t('dashboard.client.overview'), icon: '📊', exact: true },
        { path: '/dashboard/client/pets', label: t('dashboard.client.pets'), icon: '🐾' },
        { path: '/dashboard/client/appointments', label: t('dashboard.client.appointments'), icon: '📅' },
        { path: '/dashboard/client/notifications', label: t('dashboard.client.notifications'), icon: '🔔' },
        { path: '/dashboard/client/payments', label: t('dashboard.client.payments'), icon: '💳' },
        { path: '/dashboard/client/contact', label: t('dashboard.client.contact'), icon: '✉️' }
    ];

    // Pobierz zwierzęta - VS
    useEffect(() => {
        fetchPets();
    }, []);

    const fetchPets = async () => {
        try {
            setLoading(true);
            const response = await petService.getMyPets();
            setPets(response.data || []);
        } catch (error) {
            console.error('Error fetching pets:', error);
            // Demo dane dla development - VS
            setPets([
                { id: '1', name: 'Burek', species: 'dog', breed: 'Labrador', birthDate: '2021-03-15', gender: 'male', weight: 32, color: 'Złoty', microchipNumber: '123456789012345', notes: 'Bardzo przyjazny' },
                { id: '2', name: 'Mruczka', species: 'cat', breed: 'Perski', birthDate: '2019-07-20', gender: 'female', weight: 4.5, color: 'Biały', microchipNumber: '987654321098765', notes: 'Lubi spać' },
                { id: '3', name: 'Reksio', species: 'dog', breed: 'Owczarek niemiecki', birthDate: '2020-01-10', gender: 'male', weight: 38, color: 'Czarno-brązowy', microchipNumber: '', notes: '' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Walidacja formularza - VS
    const validateForm = () => {
        const errors = {};
        
        if (!formData.name.trim()) {
            errors.name = t('validation.required');
        } else if (formData.name.length < 2) {
            errors.name = t('validation.minLength', { min: 2 });
        }
        
        if (!formData.species) {
            errors.species = t('validation.required');
        }
        
        if (!formData.breed.trim()) {
            errors.breed = t('validation.required');
        }
        
        if (!formData.birthDate) {
            errors.birthDate = t('validation.required');
        } else {
            const birthDate = new Date(formData.birthDate);
            const today = new Date();
            if (birthDate > today) {
                errors.birthDate = t('validation.futureDateNotAllowed');
            }
        }
        
        if (formData.weight && (isNaN(formData.weight) || parseFloat(formData.weight) <= 0)) {
            errors.weight = t('validation.positiveNumber');
        }
        
        if (formData.microchipNumber && !/^\d{15}$/.test(formData.microchipNumber)) {
            errors.microchipNumber = t('validation.microchipFormat');
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Obsługa formularza - VS
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Wyczyść błąd pola przy edycji - VS
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            showNotification(t('validation.checkForm'), 'error');
            return;
        }
        
        try {
            if (editingPet) {
                await petService.updatePet(editingPet.id, formData);
                setPets(prev => prev.map(p => p.id === editingPet.id ? { ...p, ...formData } : p));
                showNotification(t('pets.updated'), 'success');
            } else {
                const response = await petService.createPet(formData);
                const newPet = response.data || { id: Date.now().toString(), ...formData };
                setPets(prev => [...prev, newPet]);
                showNotification(t('pets.added'), 'success');
            }
            closeModal();
        } catch (error) {
            showNotification(t('common.error'), 'error');
        }
    };

    const handleDelete = async (petId) => {
        try {
            await petService.deletePet(petId);
            setPets(prev => prev.filter(p => p.id !== petId));
            showNotification(t('pets.deleted'), 'success');
            setShowDeleteConfirm(null);
        } catch (error) {
            showNotification(t('common.error'), 'error');
        }
    };

    const openAddModal = () => {
        setEditingPet(null);
        setFormData({
            name: '', species: 'dog', breed: '', birthDate: '',
            gender: 'male', weight: '', color: '', microchipNumber: '', notes: ''
        });
        setFormErrors({});
        setShowModal(true);
    };

    const openEditModal = (pet) => {
        setEditingPet(pet);
        setFormData({
            name: pet.name || '',
            species: pet.species || 'dog',
            breed: pet.breed || '',
            birthDate: pet.birthDate || '',
            gender: pet.gender || 'male',
            weight: pet.weight?.toString() || '',
            color: pet.color || '',
            microchipNumber: pet.microchipNumber || '',
            notes: pet.notes || ''
        });
        setFormErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingPet(null);
        setFormErrors({});
    };

    // Filtrowanie zwierząt - VS
    const filteredPets = pets.filter(pet => {
        const matchesFilter = filter === 'all' || pet.species === filter;
        const matchesSearch = pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             pet.breed.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Oblicz wiek zwierzęcia - VS
    const calculateAge = (birthDate) => {
        if (!birthDate) return '-';
        const birth = new Date(birthDate);
        const today = new Date();
        const years = today.getFullYear() - birth.getFullYear();
        const months = today.getMonth() - birth.getMonth();
        
        if (years === 0) {
            return `${months} mies.`;
        } else if (years === 1) {
            return '1 rok';
        } else if (years < 5) {
            return `${years} lata`;
        } else {
            return `${years} lat`;
        }
    };

    // Ikona gatunku - VS
    const getSpeciesIcon = (species) => {
        const icons = {
            dog: '🐕',
            cat: '🐱',
            bird: '🐦',
            rabbit: '🐰',
            hamster: '🐹',
            fish: '🐟',
            other: '🐾'
        };
        return icons[species] || '🐾';
    };

    if (loading) {
        return (
            <DashboardLayout menuItems={menuItems} title={t('pets.title')} roleColor="#2d7a5e">
                <LoadingSpinner />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout menuItems={menuItems} title={t('pets.title')} roleColor="#2d7a5e">
            <div className="dashboard-page">
                {/* Nagłówek z filtrowaniem - VS */}
                <div className="page-header">
                    <div className="search-filter-row">
                        <Input
                            type="text"
                            placeholder={t('common.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon="🔍"
                            className="search-input"
                        />
                        <div className="filter-buttons">
                            <button 
                                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                Wszystkie
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'dog' ? 'active' : ''}`}
                                onClick={() => setFilter('dog')}
                            >
                                🐕 Psy
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'cat' ? 'active' : ''}`}
                                onClick={() => setFilter('cat')}
                            >
                                🐱 Koty
                            </button>
                        </div>
                    </div>
                    <Button onClick={openAddModal}>
                        + {t('pets.addPet')}
                    </Button>
                </div>

                {/* Lista zwierząt - VS */}
                {filteredPets.length === 0 ? (
                    <Card className="empty-state-card">
                        <div className="empty-state">
                            <span className="empty-icon">🐾</span>
                            <h3>{t('pets.noPets')}</h3>
                            <p>{t('pets.addFirstPet')}</p>
                            <Button onClick={openAddModal}>{t('pets.addPet')}</Button>
                        </div>
                    </Card>
                ) : (
                    <div className="pets-grid">
                        {filteredPets.map(pet => (
                            <Card key={pet.id} className="pet-card" hoverable>
                                <div className="pet-card-header">
                                    <div className="pet-avatar-large">
                                        {getSpeciesIcon(pet.species)}
                                    </div>
                                    <div className="pet-header-info">
                                        <h3 className="pet-name">{pet.name}</h3>
                                        <p className="pet-breed">{pet.breed}</p>
                                    </div>
                                    <div className="pet-actions-dropdown">
                                        <button className="dropdown-trigger">⋮</button>
                                        <div className="dropdown-menu">
                                            <button onClick={() => openEditModal(pet)}>
                                                ✏️ {t('common.edit')}
                                            </button>
                                            <button 
                                                className="danger"
                                                onClick={() => setShowDeleteConfirm(pet.id)}
                                            >
                                                🗑️ {t('common.delete')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pet-details-grid">
                                    <div className="pet-detail">
                                        <span className="detail-label">{t('pets.age')}</span>
                                        <span className="detail-value">{calculateAge(pet.birthDate)}</span>
                                    </div>
                                    <div className="pet-detail">
                                        <span className="detail-label">{t('pets.gender')}</span>
                                        <span className="detail-value">
                                            {pet.gender === 'male' ? '♂️ Samiec' : '♀️ Samica'}
                                        </span>
                                    </div>
                                    <div className="pet-detail">
                                        <span className="detail-label">{t('pets.weight')}</span>
                                        <span className="detail-value">{pet.weight ? `${pet.weight} kg` : '-'}</span>
                                    </div>
                                    <div className="pet-detail">
                                        <span className="detail-label">{t('pets.color')}</span>
                                        <span className="detail-value">{pet.color || '-'}</span>
                                    </div>
                                </div>
                                
                                {pet.microchipNumber && (
                                    <div className="pet-microchip">
                                        <span className="microchip-icon">📟</span>
                                        <span className="microchip-number">{pet.microchipNumber}</span>
                                    </div>
                                )}
                                
                                <div className="pet-card-footer">
                                    <Button variant="outline" size="small">
                                        📋 Historia medyczna
                                    </Button>
                                    <Button variant="ghost" size="small">
                                        📅 Umów wizytę
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Modal dodawania/edycji - VS */}
                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingPet ? t('pets.editPet') : t('pets.addPet')}</h2>
                                <button className="modal-close" onClick={closeModal}>×</button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="pet-form">
                                <div className="form-grid">
                                    <Input
                                        label={t('pets.name')}
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        error={formErrors.name}
                                        required
                                    />
                                    
                                    <div className="form-group">
                                        <label>{t('pets.species')} *</label>
                                        <select 
                                            name="species" 
                                            value={formData.species}
                                            onChange={handleInputChange}
                                            className={formErrors.species ? 'error' : ''}
                                        >
                                            <option value="dog">🐕 Pies</option>
                                            <option value="cat">🐱 Kot</option>
                                            <option value="bird">🐦 Ptak</option>
                                            <option value="rabbit">🐰 Królik</option>
                                            <option value="hamster">🐹 Chomik</option>
                                            <option value="fish">🐟 Ryba</option>
                                            <option value="other">🐾 Inny</option>
                                        </select>
                                        {formErrors.species && <span className="error-text">{formErrors.species}</span>}
                                    </div>
                                    
                                    <Input
                                        label={t('pets.breed')}
                                        name="breed"
                                        value={formData.breed}
                                        onChange={handleInputChange}
                                        error={formErrors.breed}
                                        required
                                    />
                                    
                                    <Input
                                        label={t('pets.birthDate')}
                                        name="birthDate"
                                        type="date"
                                        value={formData.birthDate}
                                        onChange={handleInputChange}
                                        error={formErrors.birthDate}
                                        required
                                    />
                                    
                                    <div className="form-group">
                                        <label>{t('pets.gender')}</label>
                                        <select 
                                            name="gender" 
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                        >
                                            <option value="male">♂️ Samiec</option>
                                            <option value="female">♀️ Samica</option>
                                        </select>
                                    </div>
                                    
                                    <Input
                                        label={t('pets.weight')}
                                        name="weight"
                                        type="number"
                                        step="0.1"
                                        value={formData.weight}
                                        onChange={handleInputChange}
                                        error={formErrors.weight}
                                        placeholder="kg"
                                    />
                                    
                                    <Input
                                        label={t('pets.color')}
                                        name="color"
                                        value={formData.color}
                                        onChange={handleInputChange}
                                    />
                                    
                                    <Input
                                        label={t('pets.microchip')}
                                        name="microchipNumber"
                                        value={formData.microchipNumber}
                                        onChange={handleInputChange}
                                        error={formErrors.microchipNumber}
                                        placeholder="15 cyfr"
                                    />
                                </div>
                                
                                <div className="form-group full-width">
                                    <label>{t('pets.notes')}</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows={3}
                                        placeholder={t('pets.notesPlaceholder')}
                                    />
                                </div>
                                
                                <div className="modal-footer">
                                    <Button variant="ghost" type="button" onClick={closeModal}>
                                        {t('common.cancel')}
                                    </Button>
                                    <Button type="submit">
                                        {editingPet ? t('common.save') : t('pets.addPet')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal potwierdzenia usunięcia - VS */}
                {showDeleteConfirm && (
                    <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                        <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{t('pets.deleteConfirm')}</h2>
                            </div>
                            <div className="modal-body">
                                <p>{t('pets.deleteWarning')}</p>
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)}>
                                    {t('common.delete')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default ClientPets;
