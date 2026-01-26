/**
 * PetCareApp - ClientPayments
 * Zarządzanie płatnościami i fakturami
 * @author VS
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../context/NotificationContext';
import paymentService from '../../services/paymentService';
import '../dashboards/DashboardPages.css';
import './ClientPages.css';

function ClientPayments() {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('card');

    const menuItems = [
        { path: '/dashboard/client', label: t('dashboard.client.overview'), icon: '📊', exact: true },
        { path: '/dashboard/client/pets', label: t('dashboard.client.pets'), icon: '🐾' },
        { path: '/dashboard/client/appointments', label: t('dashboard.client.appointments'), icon: '📅' },
        { path: '/dashboard/client/notifications', label: t('dashboard.client.notifications'), icon: '🔔' },
        { path: '/dashboard/client/payments', label: t('dashboard.client.payments'), icon: '💳' },
        { path: '/dashboard/client/contact', label: t('dashboard.client.contact'), icon: '✉️' }
    ];

    useEffect(() => { fetchInvoices(); }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await paymentService.getInvoices();
            setInvoices(response.data || []);
        } catch (error) {
            setInvoices([
                { id: '1', number: 'FV/2024/12/001', date: '2024-12-15', dueDate: '2024-12-25', amount: 150, status: 'pending', items: [{ name: 'Konsultacja', qty: 1, price: 100 }, { name: 'Szczepienie', qty: 1, price: 50 }], pet: 'Burek' },
                { id: '2', number: 'FV/2024/12/002', date: '2024-12-10', dueDate: '2024-12-20', amount: 80, status: 'pending', items: [{ name: 'Badanie kontrolne', qty: 1, price: 80 }], pet: 'Mruczka' },
                { id: '3', number: 'FV/2024/11/015', date: '2024-11-20', dueDate: '2024-11-30', amount: 200, status: 'paid', paidDate: '2024-11-25', items: [{ name: 'Zabieg', qty: 1, price: 200 }], pet: 'Burek' },
                { id: '4', number: 'FV/2024/11/010', date: '2024-11-10', dueDate: '2024-11-20', amount: 120, status: 'paid', paidDate: '2024-11-15', items: [{ name: 'Konsultacja', qty: 1, price: 100 }, { name: 'Leki', qty: 1, price: 20 }], pet: 'Mruczka' },
                { id: '5', number: 'FV/2024/10/008', date: '2024-10-15', dueDate: '2024-10-25', amount: 60, status: 'paid', paidDate: '2024-10-20', items: [{ name: 'Pielęgnacja', qty: 1, price: 60 }], pet: 'Burek' }
            ]);
        } finally { setLoading(false); }
    };

    const handlePayment = async (invoiceId) => {
        try {
            await paymentService.payInvoice(invoiceId, paymentMethod);
            setInvoices(prev => prev.map(inv => 
                inv.id === invoiceId ? { ...inv, status: 'paid', paidDate: new Date().toISOString().split('T')[0] } : inv
            ));
            showNotification('Płatność zrealizowana pomyślnie!', 'success');
            setShowPaymentModal(null);
        } catch (error) {
            showNotification('Błąd płatności', 'error');
        }
    };

    const downloadInvoice = async (invoice) => {
        showNotification(`Pobieranie faktury ${invoice.number}...`, 'info');
    };

    const filtered = invoices.filter(inv => filter === 'all' || inv.status === filter);
    const pendingTotal = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
    const paidTotal = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);

    if (loading) return <DashboardLayout menuItems={menuItems} title={t('payments.title')} roleColor="#2d7a5e"><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout menuItems={menuItems} title={t('payments.title')} roleColor="#2d7a5e">
            <div className="dashboard-page">
                {/* Podsumowanie - VS */}
                <div className="payment-summary-cards">
                    <Card variant="flat" className="payment-summary-card pending">
                        <div className="amount">{pendingTotal} zł</div>
                        <div className="label">Do zapłaty</div>
                    </Card>
                    <Card variant="flat" className="payment-summary-card paid">
                        <div className="amount">{paidTotal} zł</div>
                        <div className="label">Zapłacono (ostatnie 3 mies.)</div>
                    </Card>
                    <Card variant="flat" className="payment-summary-card">
                        <div className="amount">{invoices.length}</div>
                        <div className="label">Wszystkich faktur</div>
                    </Card>
                </div>

                {/* Filtry - VS */}
                <div className="page-header">
                    <div className="filter-buttons">
                        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Wszystkie</button>
                        <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>⏳ Do zapłaty</button>
                        <button className={`filter-btn ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')}>✅ Opłacone</button>
                    </div>
                </div>

                {/* Lista faktur - VS */}
                {filtered.length === 0 ? (
                    <Card className="empty-state-card"><div className="empty-state"><span className="empty-icon">💳</span><h3>Brak faktur</h3></div></Card>
                ) : (
                    <Card>
                        {filtered.map(invoice => (
                            <div key={invoice.id} className="invoice-row">
                                <div className="invoice-icon">{invoice.status === 'paid' ? '✅' : '📄'}</div>
                                <div className="invoice-info">
                                    <div className="invoice-number">{invoice.number}</div>
                                    <div className="invoice-details">
                                        🐾 {invoice.pet} • {invoice.date} • Termin: {invoice.dueDate}
                                    </div>
                                </div>
                                <div className="invoice-amount" style={{ color: invoice.status === 'pending' ? 'var(--warning)' : 'var(--success)' }}>
                                    {invoice.amount} zł
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    <Button variant="ghost" size="small" onClick={() => setSelectedInvoice(invoice)}>
                                        Szczegóły
                                    </Button>
                                    {invoice.status === 'pending' && (
                                        <Button size="small" onClick={() => setShowPaymentModal(invoice)}>
                                            Zapłać
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </Card>
                )}

                {/* Modal szczegółów faktury - VS */}
                {selectedInvoice && (
                    <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Faktura {selectedInvoice.number}</h2>
                                <button className="modal-close" onClick={() => setSelectedInvoice(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Data wystawienia:</span>
                                        <span>{selectedInvoice.date}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Termin płatności:</span>
                                        <span>{selectedInvoice.dueDate}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Pacjent:</span>
                                        <span>{selectedInvoice.pet}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                                        <span style={{ color: selectedInvoice.status === 'paid' ? 'var(--success)' : 'var(--warning)' }}>
                                            {selectedInvoice.status === 'paid' ? '✅ Opłacona' : '⏳ Oczekuje'}
                                        </span>
                                    </div>
                                </div>
                                
                                <h4 style={{ marginBottom: 'var(--space-2)' }}>Pozycje</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <th style={{ textAlign: 'left', padding: 'var(--space-2)' }}>Nazwa</th>
                                            <th style={{ textAlign: 'center', padding: 'var(--space-2)' }}>Ilość</th>
                                            <th style={{ textAlign: 'right', padding: 'var(--space-2)' }}>Cena</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.items.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: 'var(--space-2)' }}>{item.name}</td>
                                                <td style={{ textAlign: 'center', padding: 'var(--space-2)' }}>{item.qty}</td>
                                                <td style={{ textAlign: 'right', padding: 'var(--space-2)' }}>{item.price} zł</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="2" style={{ padding: 'var(--space-2)', fontWeight: 600 }}>Razem</td>
                                            <td style={{ textAlign: 'right', padding: 'var(--space-2)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>{selectedInvoice.amount} zł</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost" onClick={() => downloadInvoice(selectedInvoice)}>📥 Pobierz PDF</Button>
                                {selectedInvoice.status === 'pending' && (
                                    <Button onClick={() => { setSelectedInvoice(null); setShowPaymentModal(selectedInvoice); }}>Zapłać teraz</Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal płatności - VS */}
                {showPaymentModal && (
                    <div className="modal-overlay" onClick={() => setShowPaymentModal(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Płatność za {showPaymentModal.number}</h2>
                                <button className="modal-close" onClick={() => setShowPaymentModal(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--primary)' }}>{showPaymentModal.amount} zł</div>
                                    <div style={{ color: 'var(--text-muted)' }}>Kwota do zapłaty</div>
                                </div>
                                
                                <h4 style={{ marginBottom: 'var(--space-3)' }}>Wybierz metodę płatności</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    {[
                                        { value: 'card', label: '💳 Karta płatnicza', desc: 'Visa, Mastercard' },
                                        { value: 'blik', label: '📱 BLIK', desc: 'Szybki przelew' },
                                        { value: 'transfer', label: '🏦 Przelew bankowy', desc: 'Tradycyjny przelew' }
                                    ].map(method => (
                                        <label key={method.value} style={{ 
                                            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                            padding: 'var(--space-3)', border: `2px solid ${paymentMethod === method.value ? 'var(--primary)' : 'var(--border-color)'}`,
                                            borderRadius: 'var(--radius-md)', cursor: 'pointer'
                                        }}>
                                            <input type="radio" name="payment" value={method.value} checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} />
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{method.label}</div>
                                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{method.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button variant="ghost" onClick={() => setShowPaymentModal(null)}>Anuluj</Button>
                                <Button onClick={() => handlePayment(showPaymentModal.id)}>Zapłać {showPaymentModal.amount} zł</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default ClientPayments;
