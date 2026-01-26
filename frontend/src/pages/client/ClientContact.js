/**
 * PetCareApp - ClientContact
 * Strona kontaktowa z formularzem
 * @author VS
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useNotification } from '../../context/NotificationContext';
import '../dashboards/DashboardPages.css';
import './ClientPages.css';

function ClientContact() {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    
    const [formData, setFormData] = useState({ subject: '', category: 'general', message: '' });
    const [formErrors, setFormErrors] = useState({});
    const [sending, setSending] = useState(false);

    const menuItems = [
        { path: '/dashboard/client', label: t('dashboard.client.overview'), icon: '📊', exact: true },
        { path: '/dashboard/client/pets', label: t('dashboard.client.pets'), icon: '🐾' },
        { path: '/dashboard/client/appointments', label: t('dashboard.client.appointments'), icon: '📅' },
        { path: '/dashboard/client/notifications', label: t('dashboard.client.notifications'), icon: '🔔' },
        { path: '/dashboard/client/payments', label: t('dashboard.client.payments'), icon: '💳' },
        { path: '/dashboard/client/contact', label: t('dashboard.client.contact'), icon: '✉️' }
    ];

    const categories = [
        { value: 'general', label: 'Pytanie ogólne' },
        { value: 'appointment', label: 'Dotyczy wizyty' },
        { value: 'billing', label: 'Rozliczenia' },
        { value: 'complaint', label: 'Reklamacja' },
        { value: 'suggestion', label: 'Sugestia' }
    ];

    const validate = () => {
        const errors = {};
        if (!formData.subject.trim()) errors.subject = 'Temat jest wymagany';
        if (!formData.message.trim()) errors.message = 'Wiadomość jest wymagana';
        else if (formData.message.length < 10) errors.message = 'Wiadomość musi mieć min. 10 znaków';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        setSending(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Symulacja
            showNotification('Wiadomość wysłana! Odpowiemy w ciągu 24h.', 'success');
            setFormData({ subject: '', category: 'general', message: '' });
        } catch (error) {
            showNotification('Błąd wysyłania', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    return (
        <DashboardLayout menuItems={menuItems} title={t('contact.title')} roleColor="#2d7a5e">
            <div className="dashboard-page">
                <div className="contact-grid">
                    {/* Info kontaktowe - VS */}
                    <Card className="contact-info-card">
                        <h3 style={{ marginBottom: 'var(--space-6)' }}>Dane kontaktowe</h3>
                        
                        <div className="contact-item">
                            <div className="contact-item-icon">📍</div>
                            <div className="contact-item-content">
                                <h4>Adres</h4>
                                <p>ul. Weterynarzyjna 15<br/>00-001 Warszawa</p>
                            </div>
                        </div>
                        
                        <div className="contact-item">
                            <div className="contact-item-icon">📞</div>
                            <div className="contact-item-content">
                                <h4>Telefon</h4>
                                <p>+48 22 123 45 67<br/>Pon-Pt: 8:00-20:00, Sob: 9:00-14:00</p>
                            </div>
                        </div>
                        
                        <div className="contact-item">
                            <div className="contact-item-icon">📧</div>
                            <div className="contact-item-content">
                                <h4>Email</h4>
                                <p>kontakt@petcareapp.pl</p>
                            </div>
                        </div>
                        
                        <div className="contact-item">
                            <div className="contact-item-icon">🚨</div>
                            <div className="contact-item-content">
                                <h4>Nagłe przypadki 24/7</h4>
                                <p style={{ color: 'var(--error)', fontWeight: 600 }}>+48 22 999 99 99</p>
                            </div>
                        </div>
                        
                        <hr style={{ margin: 'var(--space-6) 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
                        
                        <h4 style={{ marginBottom: 'var(--space-3)' }}>Obserwuj nas</h4>
                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            {['📘 Facebook', '📸 Instagram', '🐦 Twitter'].map(social => (
                                <Button key={social} variant="ghost" size="small">{social}</Button>
                            ))}
                        </div>
                    </Card>

                    {/* Formularz - VS */}
                    <Card className="contact-form-card">
                        <h3 style={{ marginBottom: 'var(--space-6)' }}>Wyślij wiadomość</h3>
                        
                        <form onSubmit={handleSubmit} className="contact-form">
                            <div className="form-group">
                                <label>Kategoria</label>
                                <select name="category" value={formData.category} onChange={handleChange}>
                                    {categories.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <Input
                                label="Temat"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                error={formErrors.subject}
                                placeholder="Wpisz temat wiadomości"
                            />
                            
                            <div className="form-group">
                                <label>Wiadomość</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={6}
                                    placeholder="Opisz szczegółowo swoje pytanie lub problem..."
                                    className={formErrors.message ? 'error' : ''}
                                />
                                {formErrors.message && <span className="error-text">{formErrors.message}</span>}
                            </div>
                            
                            <Button type="submit" fullWidth disabled={sending}>
                                {sending ? '⏳ Wysyłanie...' : '✉️ Wyślij wiadomość'}
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* FAQ - VS */}
                <Card style={{ marginTop: 'var(--space-6)' }}>
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>❓ Często zadawane pytania</h3>
                    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                        {[
                            { q: 'Jak umówić wizytę?', a: 'Wizyty możesz umówić przez zakładkę "Wizyty" lub dzwoniąc pod numer recepcji.' },
                            { q: 'Jak anulować wizytę?', a: 'Wizytę możesz anulować w zakładce "Wizyty" lub telefonicznie min. 24h przed terminem.' },
                            { q: 'Jakie formy płatności akceptujecie?', a: 'Akceptujemy karty płatnicze, BLIK, przelewy oraz gotówkę w klinice.' },
                            { q: 'Czy oferujecie wizyty domowe?', a: 'Tak, oferujemy wizyty domowe w promieniu 30km. Skontaktuj się z nami po szczegóły.' }
                        ].map((faq, idx) => (
                            <div key={idx} style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                <strong>{faq.q}</strong>
                                <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--text-secondary)' }}>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default ClientContact;
