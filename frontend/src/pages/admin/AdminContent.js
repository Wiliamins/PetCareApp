/**
 * PetCareApp - AdminContent - Zarządzanie treścią
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

function AdminContent() {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', type: 'news', excerpt: '', content: '', published: true });

    const menuItems = [
        { path: '/dashboard/admin', label: t('dashboard.admin.overview'), icon: '📊', exact: true },
        { path: '/dashboard/admin/users', label: t('dashboard.admin.users'), icon: '👥' },
        { path: '/dashboard/admin/appointments', label: t('dashboard.admin.appointments'), icon: '📅' },
        { path: '/dashboard/admin/services', label: t('dashboard.admin.services'), icon: '💼' },
        { path: '/dashboard/admin/content', label: t('dashboard.admin.content'), icon: '📝' },
        { path: '/dashboard/admin/reports', label: t('dashboard.admin.reports'), icon: '📈' }
    ];

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setContents([
                { id: '1', title: 'Nowe godziny otwarcia w okresie świątecznym', type: 'news', excerpt: 'Informujemy o zmianach w godzinach pracy...', date: '2024-12-15', published: true, icon: '📢' },
                { id: '2', title: 'Jak przygotować psa do wizyty u weterynarza', type: 'article', excerpt: 'Porady dla właścicieli przed wizytą...', date: '2024-12-10', published: true, icon: '📄' },
                { id: '3', title: 'Promocja na szczepienia', type: 'promotion', excerpt: '-20% na wszystkie szczepienia do końca roku', date: '2024-12-01', published: true, icon: '🎁' },
                { id: '4', title: 'Nowy weterynarz w zespole', type: 'news', excerpt: 'Z radością witamy dr Marię Wiśniewską...', date: '2024-11-20', published: true, icon: '📢' }
            ]);
            setLoading(false);
        }, 500);
    }, []);

    const handleSave = () => {
        if (!formData.title) { showNotification('Podaj tytuł', 'error'); return; }
        const icons = { news: '📢', article: '📄', promotion: '🎁', faq: '❓' };
        setContents(prev => [...prev, { id: Date.now().toString(), ...formData, date: new Date().toISOString().split('T')[0], icon: icons[formData.type] }]);
        showNotification('Treść dodana', 'success');
        setShowModal(false);
        setFormData({ title: '', type: 'news', excerpt: '', content: '', published: true });
    };

    const togglePublished = (id) => setContents(prev => prev.map(c => c.id === id ? { ...c, published: !c.published } : c));
    const deleteContent = (id) => { setContents(prev => prev.filter(c => c.id !== id)); showNotification('Usunięto', 'success'); };

    if (loading) return <DashboardLayout menuItems={menuItems} title="Treści" roleColor="#9b59b6"><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout menuItems={menuItems} title="Zarządzanie treścią" roleColor="#9b59b6">
            <div className="dashboard-page">
                <div className="page-header">
                    <div className="filter-buttons">
                        <button className="filter-btn active">Wszystkie</button>
                        <button className="filter-btn">📢 Aktualności</button>
                        <button className="filter-btn">📄 Artykuły</button>
                        <button className="filter-btn">🎁 Promocje</button>
                    </div>
                    <Button onClick={() => setShowModal(true)}>+ Dodaj treść</Button>
                </div>

                <Card>
                    <div className="content-list">
                        {contents.map(item => (
                            <div key={item.id} className="content-item" style={{ opacity: item.published ? 1 : 0.6 }}>
                                <div className="content-thumbnail">{item.icon}</div>
                                <div className="content-info">
                                    <div className="content-title">{item.title}</div>
                                    <div className="content-excerpt">{item.excerpt}</div>
                                    <div className="content-meta">{item.date} • {item.published ? '✅ Opublikowane' : '📝 Szkic'}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    <Button variant="ghost" size="small" onClick={() => togglePublished(item.id)}>{item.published ? '📝' : '✅'}</Button>
                                    <Button variant="ghost" size="small" onClick={() => deleteContent(item.id)}>🗑️</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
                            <div className="modal-header"><h2>Nowa treść</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <Input label="Tytuł *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
                                    <div className="form-group">
                                        <label>Typ</label>
                                        <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                                            <option value="news">📢 Aktualność</option>
                                            <option value="article">📄 Artykuł</option>
                                            <option value="promotion">🎁 Promocja</option>
                                            <option value="faq">❓ FAQ</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                                    <label>Zajawka</label>
                                    <textarea value={formData.excerpt} onChange={e => setFormData(p => ({ ...p, excerpt: e.target.value }))} rows={2} />
                                </div>
                                <div className="form-group">
                                    <label>Treść</label>
                                    <textarea value={formData.content} onChange={e => setFormData(p => ({ ...p, content: e.target.value }))} rows={6} />
                                </div>
                            </div>
                            <div className="modal-footer"><Button variant="ghost" onClick={() => setShowModal(false)}>Anuluj</Button><Button onClick={handleSave}>Publikuj</Button></div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default AdminContent;
