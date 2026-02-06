import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PaymentQRModal from '../../components/PaymentQRModal';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import InvoiceDocument from '../../components/documents/InvoiceDocument';

const Billing = () => {
    const [rooms, setRooms] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);

    // Printing
    const invoiceRef = useRef();
    const [printInvoiceData, setPrintInvoiceData] = useState(null);

    // Modals
    const [showMeterModal, setShowMeterModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [meterData, setMeterData] = useState({ waterCurrent: '', electricCurrent: '' });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editInvoice, setEditInvoice] = useState(null);
    const [editFormData, setEditFormData] = useState({ totalAmount: '', status: 'PENDING' });

    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const [showSlipModal, setShowSlipModal] = useState(false);
    const [slipInvoice, setSlipInvoice] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [roomsRes, invoicesRes] = await Promise.all([
                api.get('/rooms'),
                api.get('/invoices')
            ]);
            // Filter only occupied rooms for billing
            setRooms(roomsRes.data.filter(r => r.status === 'OCCUPIED'));
            setInvoices(invoicesRes.data);
        } catch (error) {
            toast.error('ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setLoading(false);
        }
    };

    const openMeterModal = async (room) => {
        setSelectedRoom(room);
        try {
            const res = await api.get(`/billing/meter-readings/${room.id}`);
            const lastReading = res.data[0];
            setMeterData({
                waterCurrent: lastReading ? lastReading.waterCurrent.toString() : '',
                electricCurrent: lastReading ? lastReading.electricCurrent.toString() : ''
            });
        } catch (error) {
            setMeterData({ waterCurrent: '', electricCurrent: '' });
        }
        setShowMeterModal(true);
    };

    const recordMeter = async (e) => {
        e.preventDefault();
        try {
            await api.post('/billing/meter-reading', {
                roomId: selectedRoom.id,
                waterCurrent: parseInt(meterData.waterCurrent),
                electricCurrent: parseInt(meterData.electricCurrent)
            });
            toast.success('บันทึกค่ามิเตอร์สำเร็จ');
            setShowMeterModal(false);
        } catch (error) {
            toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด');
        }
    };

    const generateInvoice = async (roomId) => {
        try {
            await api.post('/billing/generate', { roomId });
            toast.success('สร้างบิลสำเร็จ');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'ไม่สามารถสร้างบิลได้');
        }
    };

    const generateAllInvoices = async () => {
        if (!confirm('ยืนยันการสร้างบิลทุกห้องที่พร้อม?')) return;
        try {
            const res = await api.post('/billing/generate-all');
            toast.success(res.data.message);
            fetchData();
        } catch (error) {
            toast.error('เกิดข้อผิดพลาด');
        }
    };



    const handleDeleteInvoice = async (id) => {
        if (!confirm('คุณต้องการลบบิลนี้ใช่หรือไม่?')) return;
        try {
            await api.delete(`/invoices/${id}`);
            toast.success('ลบบิลเรียบร้อยแล้ว');
            fetchData();
        } catch (error) {
            toast.error('ลบบิลไม่สำเร็จ');
        }
    };

    // --- Printing Logic ---
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings');
                setSettings(response.data);
            } catch (error) {
                console.error('Failed to fetch settings');
            }
        };
        fetchSettings();
    }, []);

    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: `Invoice_${printInvoiceData?.id || 'doc'}`,
        onAfterPrint: () => setPrintInvoiceData(null)
    });

    useEffect(() => {
        if (printInvoiceData) {
            // Small delay to ensure DOM is updated with new invoice data
            const timer = setTimeout(() => {
                handlePrint();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [printInvoiceData, handlePrint]);

    const handlePrintClick = (invoice) => {
        setPrintInvoiceData(invoice);
    };

    const handleDownloadPDF = async (invoice) => {
        try {
            const response = await api.get(`/invoices/${invoice.id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoice.room?.roomNumber}-${invoice.month}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Download PDF error:', error);
            toast.error('ไม่สามารถดาวน์โหลด PDF ได้');
        }
    };

    const formatCurrency = (value) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);

    // Group invoices by room ID for easier lookup
    const lastInvoiceByRoom = {};
    invoices.forEach(inv => {
        if (!lastInvoiceByRoom[inv.roomId]) {
            lastInvoiceByRoom[inv.roomId] = inv;
        }
    });

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        </div>
    );

    return (
        <div className="animate-enter" style={{ paddingBottom: '3rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', background: 'var(--text-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Billing System
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        ระบบคำนวณค่าเช่าและออกบิลอัตโนมัติ
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={generateAllInvoices}
                    style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)' }}
                >
                    <span style={{ fontSize: '1.2rem' }}>⚡</span> สร้างบิลอัตโนมัติ (Batch)
                </button>
            </div>

            {/* Quick Actions Grid */}
            <div style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }}></span>
                    ห้องพักที่มีผู้เช่า ({rooms.length})
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {rooms.map((room) => {
                        const hasRecentInvoice = lastInvoiceByRoom[room.id] && lastInvoiceByRoom[room.id].status === 'PENDING';
                        const recentInvoice = lastInvoiceByRoom[room.id];

                        return (
                            <div key={room.id} className="glass-panel" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
                                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                    <div>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{room.roomNumber}</span>
                                        <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ชั้น {room.floor}</span>
                                    </div>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        👤
                                    </div>
                                </div>

                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <button
                                            onClick={() => openMeterModal(room)}
                                            className="btn"
                                            style={{
                                                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                                color: 'white',
                                                border: 'none',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.75rem',
                                                height: 'auto', borderRadius: '12px',
                                                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.5rem' }}>📝</span>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>จดมิเตอร์</span>
                                        </button>

                                        {hasRecentInvoice ? (
                                            <button
                                                onClick={() => { setSelectedInvoice(recentInvoice); setShowQRModal(true); }}
                                                className="btn"
                                                style={{
                                                    background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.75rem',
                                                    height: 'auto', borderRadius: '12px',
                                                    boxShadow: '0 4px 10px rgba(168, 85, 247, 0.3)'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.5rem' }}>📱</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>รอชำระ</span>
                                            </button>
                                        ) : (lastInvoiceByRoom[room.id]?.status === 'VERIFYING') ? (
                                            <button
                                                onClick={() => { setSlipInvoice(lastInvoiceByRoom[room.id]); setShowSlipModal(true); }}
                                                className="btn"
                                                style={{
                                                    background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.75rem',
                                                    height: 'auto', borderRadius: '12px',
                                                    boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)',
                                                    animation: 'pulse 2s infinite'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.5rem' }}>🔎</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ตรวจสอบ</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => generateInvoice(room.id)}
                                                className="btn"
                                                style={{
                                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.75rem',
                                                    height: 'auto', borderRadius: '12px',
                                                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.5rem' }}>💰</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ออกบิล</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Invoices Table */}
            <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>ประวัติการออกบิลล่าสุด</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem 1.5rem' }}>ห้อง</th>
                                <th style={{ padding: '1rem' }}>ผู้เช่า</th>
                                <th style={{ padding: '1rem' }}>ยอดรวม</th>
                                <th style={{ padding: '1rem' }}>สถานะ</th>
                                <th style={{ padding: '1rem' }}>วันที่ครบกำหนด</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <tr key={inv.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover:bg-white/5">
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{inv.room?.roomNumber}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{inv.room?.tenant?.firstName || '-'}</td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{formatCurrency(inv.totalAmount)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                                            background: inv.status === 'PAID' ? 'rgba(16, 185, 129, 0.1)' : inv.status === 'OVERDUE' || inv.status === 'REJECTED' ? 'rgba(244, 63, 94, 0.1)' : inv.status === 'VERIFYING' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                            color: inv.status === 'PAID' ? '#10B981' : inv.status === 'OVERDUE' || inv.status === 'REJECTED' ? '#F43F5E' : inv.status === 'VERIFYING' ? '#F59E0B' : 'var(--primary)'
                                        }}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(inv.dueDate).toLocaleDateString('th-TH')}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button onClick={() => handlePrintClick(inv)} className="btn btn-ghost btn-sm" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-main)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Printer size={14} /> พิมพ์
                                            </button>

                                            {inv.slipImage && <button onClick={() => { setSlipInvoice(inv); setShowSlipModal(true); }} className="btn btn-ghost btn-sm" style={{ color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)' }}>สลิป</button>}
                                            <button onClick={() => handleDeleteInvoice(inv.id)} className="btn btn-ghost btn-sm" style={{ color: '#F43F5E', width: '32px', padding: 0, justifyContent: 'center' }} title="ลบรายการ">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Meter Modal */}
            {
                showMeterModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '380px', padding: '2rem', borderRadius: '16px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem' }}>จดมิเตอร์ห้อง {selectedRoom?.roomNumber}</h3>
                            <form onSubmit={recordMeter}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>💧 มิเตอร์น้ำ</label>
                                    <input type="number" className="glass-input" value={meterData.waterCurrent} onChange={(e) => setMeterData({ ...meterData, waterCurrent: e.target.value })} required style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '1px' }} />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>⚡ มิเตอร์ไฟ</label>
                                    <input type="number" className="glass-input" value={meterData.electricCurrent} onChange={(e) => setMeterData({ ...meterData, electricCurrent: e.target.value })} required style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '1px' }} />
                                </div>
                                <button type="submit" className="btn btn-primary btn-block">บันทึกข้อมูล</button>
                                <button type="button" onClick={() => setShowMeterModal(false)} className="btn btn-ghost btn-block" style={{ marginTop: '0.5rem' }}>ยกเลิก</button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Slip / Verification Modal */}
            {
                showSlipModal && slipInvoice && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }} onClick={() => setShowSlipModal(false)}>
                        <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '450px', padding: '0', borderRadius: '16px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                            <div style={{ padding: '1rem', background: 'var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontWeight: 700, margin: 0 }}>ตรวจสอบสลิปการโอน</h3>
                                <button onClick={() => setShowSlipModal(false)} className="btn btn-ghost btn-sm">✕</button>
                            </div>

                            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                                <img src={slipInvoice.slipImage} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} alt="Slip" />
                                <div style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>
                                    ยอดที่ต้องชำระ: {formatCurrency(slipInvoice.totalAmount)}
                                </div>
                            </div>

                            {slipInvoice.status === 'VERIFYING' && (
                                <div style={{ padding: '1.5rem', background: 'var(--bg-hover)', borderTop: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <button
                                        onClick={async () => {
                                            if (!confirm('ปฏิเสธการชำระเงิน?')) return;
                                            try {
                                                await api.put(`/invoices/${slipInvoice.id}`, { status: 'REJECTED' });
                                                toast.success('ปฏิเสธการชำระเงินแล้ว');
                                                setShowSlipModal(false);
                                                fetchData();
                                            } catch (err) { toast.error('เกิดข้อผิดพลาด'); }
                                        }}
                                        className="btn"
                                        style={{ background: '#F43F5E11', color: '#F43F5E', border: '1px solid #F43F5E33' }}
                                    >
                                        ❌ ปฏิเสธ (Reject)
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!confirm('ยืนยันยอดเงินถูกต้อง?')) return;
                                            try {
                                                await api.put(`/invoices/${slipInvoice.id}`, { status: 'PAID' });
                                                toast.success('อนุมัติการชำระเงินสำเร็จ');
                                                setShowSlipModal(false);
                                                fetchData();
                                            } catch (err) { toast.error('เกิดข้อผิดพลาด'); }
                                        }}
                                        className="btn btn-primary"
                                    >
                                        ✅ อนุมัติ (Approve)
                                    </button>
                                </div>
                            )}
                            {slipInvoice.status !== 'VERIFYING' && (
                                <div style={{ padding: '1rem' }}>
                                    <button className="btn btn-ghost btn-block" onClick={() => setShowSlipModal(false)}>ปิดหน้าต่าง</button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }



            <PaymentQRModal
                invoice={selectedInvoice}
                onClose={() => setShowQRModal(false)}
                onConfirmPayment={async (id) => {
                    try {
                        if (!confirm('ยืนยันว่าได้รับเงินแล้ว?')) return;
                        await api.put(`/invoices/${id}/pay`);
                        toast.success('บันทึกการชำระเงินสำเร็จ');
                        fetchData();
                        setShowQRModal(false);
                    } catch (error) { toast.error('เกิดข้อผิดพลาด'); }
                }}
            />

            {/* Hidden Print Component */}
            <div style={{ overflow: 'hidden', height: 0, width: 0, position: 'absolute', top: '-10000px', left: '-10000px' }}>
                <InvoiceDocument
                    ref={invoiceRef}
                    invoice={printInvoiceData}
                    settings={settings}
                />
            </div>
        </div>
    );
};

export default Billing;
