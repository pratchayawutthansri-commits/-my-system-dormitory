import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { generatePromptPayPayload, DEMO_PROMPTPAY_ID } from '../../utils/promptpay';

// Image Compression Utility
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const TenantDashboard = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [maintenanceRequests, setMaintenanceRequests] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
    const [slipImage, setSlipImage] = useState(null);
    const [maintenanceForm, setMaintenanceForm] = useState({
        title: '',
        description: '',
        imageData: null
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [invoicesRes, maintenanceRes, announcementsRes, settingsRes] = await Promise.all([
                api.get('/invoices'),
                api.get('/maintenance'),
                api.get('/announcements/active'),
                api.get('/settings')
            ]);
            setInvoices(invoicesRes.data);
            setMaintenanceRequests(maintenanceRes.data);
            setAnnouncements(announcementsRes.data);
            setSettings(settingsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            PENDING: { style: { background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)', border: '1px solid rgba(244, 63, 94, 0.2)' }, label: '🔴 รอชำระ' },
            PAID: { style: { background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)' }, label: '🟢 ชำระแล้ว' },
            OVERDUE: { style: { background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)' }, label: '⚠️ เกินกำหนด' }
        };
        const badge = badges[status] || badges.PENDING;
        return <span style={{ ...badge.style, borderRadius: '99px', padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>{badge.label}</span>;
    };

    const getMaintenanceStatusBadge = (status) => {
        const badges = {
            PENDING: { style: { background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }, label: '🕐 รอรับเรื่อง' },
            IN_PROGRESS: { style: { background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }, label: '🔧 กำลังซ่อม' },
            COMPLETED: { style: { background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }, label: '✅ เสร็จสิ้น' }
        };
        const badge = badges[status] || badges.PENDING;
        return <span style={{ ...badge.style, fontSize: '0.75rem', fontWeight: '700', padding: '0.35rem 0.75rem', borderRadius: '6px' }}>{badge.label}</span>;
    };

    const handleSubmitMaintenance = async (e) => {
        e.preventDefault();
        if (!maintenanceForm.title.trim() || !maintenanceForm.description.trim()) {
            toast.error('กรุณากรอกหัวข้อและรายละเอียด');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/maintenance', maintenanceForm);
            toast.success('ส่งแจ้งซ่อมเรียบร้อยแล้ว');
            setShowMaintenanceModal(false);
            setMaintenanceForm({ title: '', description: '', imageData: null });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmPayment = async (invoiceId) => {
        if (!slipImage) {
            toast.error('กรุณาแนบสลิปการโอนเงิน');
            return;
        }
        try {
            await api.put(`/invoices/${invoiceId}/slip`, { slipImage });
            toast.success('ส่งหลักฐานสำเร็จ! กรุณารอแอดมินตรวจสอบ');
            setSlipImage(null);
            setSelectedInvoiceForPayment(null);
            setShowQRModal(false);
            fetchData();
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการส่งข้อมูล');
        }
    };

    const handleDownloadPDF = async (invoice) => {
        try {
            const response = await api.get(`/invoices/${invoice.id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${user?.room?.roomNumber}-${invoice.month}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Download PDF error:', error);
            toast.error('ไม่สามารถดาวน์โหลด PDF ได้');
        }
    };

    const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING');
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
    const activeMaintenance = maintenanceRequests.filter(m => m.status !== 'COMPLETED');

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>

            {/* Header Area */}
            <header className="animate-enter" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Dashboard.
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>สวัสดีคุณ {user?.firstName}, ยินดีต้อนรับกลับบ้านครับ 👋</p>
                </div>
                <button
                    onClick={() => setShowMaintenanceModal(true)}
                    className="btn btn-primary"
                    style={{ borderRadius: '99px', padding: '0.75rem 1.5rem' }}
                >
                    <span style={{ fontSize: '1.2rem' }}>🔧</span> แจ้งซ่อมออนไลน์
                </button>
            </header>

            {/* Stats Grid */}
            <div className="animate-enter delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>

                {/* Room Card */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Room</p>
                        <h3 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, marginTop: '0.5rem' }}>{user?.room?.roomNumber || '-'}</h3>
                    </div>
                    <div style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🏠</div>
                </div>

                {/* Bill Card */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden' }}>
                    <div className="brand-pattern" style={{ opacity: 0.1 }}></div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Bills</p>
                        <h3 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, marginTop: '0.5rem', color: totalPending > 0 ? 'var(--accent)' : 'var(--text-main)' }}>
                            {formatCurrency(totalPending)}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: totalPending > 0 ? 'var(--accent)' : 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 500 }}>
                            {pendingInvoices.length} รายการที่ต้องชำระ
                        </p>
                    </div>
                </div>

                {/* Maintenance Card */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Maintenance</p>
                        <h3 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, marginTop: '0.5rem' }}>{activeMaintenance.length}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>คำร้องที่กำลังดำเนินการ</p>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🔨</div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="animate-enter delay-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '2rem', alignItems: 'start' }}>

                {/* Left Column: Bills & History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Active Bill Alert */}
                    {pendingInvoices.length > 0 ? (
                        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(244, 63, 94, 0.3)', background: 'linear-gradient(to bottom right, rgba(244, 63, 94, 0.1), rgba(15, 23, 42, 0.4))' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    <span style={{ background: 'var(--accent)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Important</span>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.75rem' }}>บิลประจำเดือน {formatDate(pendingInvoices[0].billingMonth)}</h2>
                                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>ครบกำหนดชำระ: {new Date(pendingInvoices[0].dueDate).toLocaleDateString('th-TH')}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{formatCurrency(pendingInvoices[0].totalAmount)}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>ยอดสุทธิ</div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedInvoiceForPayment(pendingInvoices[0]);
                                    setShowQRModal(true);
                                }}
                                className="btn btn-primary"
                                style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent) 0%, #BE123C 100%)', boxShadow: '0 4px 20px rgba(244, 63, 94, 0.4)' }}
                            >
                                ชำระเงินทันที 💳
                            </button>
                        </div>
                    ) : (
                        <div className="glass-panel" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>✨</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>ไม่มียอดค้างชำระ</h3>
                            <p style={{ color: 'var(--text-muted)' }}>ขอบคุณที่ชำระค่าบริการตรงเวลาครับ</p>
                        </div>
                    )}

                    {/* Invoice History */}
                    <div className="glass-panel" style={{ padding: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>ประวัติการชำระเงิน</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>รอบบิล</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>ยอดเงิน</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>สถานะ</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(inv => (
                                        <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: 500 }}>{formatDate(inv.billingMonth)}</td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>{formatCurrency(inv.totalAmount)}</td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>{getStatusBadge(inv.status)}</td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => { setSelectedInvoiceForPayment(inv); setShowQRModal(true); }}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginRight: '1rem', fontSize: '0.9rem', fontWeight: 500 }}
                                                >
                                                    ดูบิล
                                                </button>
                                                {inv.status === 'PAID' && (
                                                    <button
                                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                                                        onClick={() => handleDownloadPDF(inv)}
                                                    >
                                                        PDF
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Right Column: Announcements & Support */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Announcements */}
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--accent)' }}>📢</span> ข่าวสารล่าสุด
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {announcements.length > 0 ? announcements.map(ann => (
                                <div key={ann.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: ann.importance === 'URGENT' ? 'var(--accent)' : 'var(--primary)', fontWeight: 700, background: ann.importance === 'URGENT' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(79, 70, 229, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                            {ann.importance === 'URGENT' ? 'ด่วน' : 'ทั่วไป'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ann.createdAt).toLocaleDateString('th-TH')}</span>
                                    </div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>{ann.title}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{ann.content}</p>
                                </div>
                            )) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>ไม่มีประกาศใหม่</p>
                            )}
                        </div>
                    </div>

                    {/* Support Card */}
                    <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #312E81 100%)', padding: '2rem', borderRadius: 'var(--radius-lg)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>ต้องการความช่วยเหลือ?</h3>
                            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1.5rem' }}>ติดต่อนิติบุคคลได้ตลอด 24 ชม.</p>
                            <button className="btn" style={{ background: 'white', color: 'var(--primary)', fontWeight: 700, width: '100%', borderRadius: 'var(--radius-md)' }}>
                                ติดต่อเรา
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Maintenance Modal */}
            {showMaintenanceModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: 'var(--radius-lg)', margin: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>แจ้งซ่อมออนไลน์ 🔧</h2>
                        <form onSubmit={handleSubmitMaintenance}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>หัวข้อแจ้งซ่อม</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="เช่น ไฟห้องน้ำดับ, ท่อน้ำรั่ว"
                                    value={maintenanceForm.title}
                                    onChange={e => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>รายละเอียด</label>
                                <textarea
                                    className="glass-input"
                                    rows="4"
                                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                                    value={maintenanceForm.description}
                                    onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                                    required
                                    style={{ resize: 'none' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>รูปภาพประกอบ (ถ้ามี)</label>
                                <label className="glass-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)' }}>
                                    <div style={{ width: '100%', textAlign: 'center' }}>
                                        {maintenanceForm.imageData ? (
                                            <div style={{ position: 'relative', width: '100%', maxHeight: '200px', overflow: 'hidden', borderRadius: '8px' }}>
                                                <img src={maintenanceForm.imageData} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="hover:opacity-100">
                                                    <span style={{ color: 'white', fontWeight: 600 }}>เปลี่ยนรูปภาพ</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span>📷 คลิกเพื่อแนบรูปภาพ</span>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    try {
                                                        const compressed = await compressImage(file);
                                                        setMaintenanceForm({ ...maintenanceForm, imageData: compressed });
                                                        toast.success('แนบรูปภาพสำเร็จ');
                                                    } catch (err) {
                                                        console.error(err);
                                                        toast.error('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowMaintenanceModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>ยกเลิก</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? 'กำลังส่ง...' : 'ส่งแจ้งซ่อม'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Payment Modal */}
            {showQRModal && selectedInvoiceForPayment && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                    <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', background: 'var(--primary)', textAlign: 'center' }}>
                            <h3 style={{ color: 'white', margin: 0, fontWeight: 700 }}>สแกนจ่ายเงิน</h3>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>ห้อง {user?.room?.roomNumber}</p>
                        </div>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
                                <QRCodeSVG
                                    value={generatePromptPayPayload(DEMO_PROMPTPAY_ID, selectedInvoiceForPayment.totalAmount)}
                                    size={180}
                                    level="L"
                                />
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{formatCurrency(selectedInvoiceForPayment.totalAmount)}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>PromptPay</p>

                            {selectedInvoiceForPayment.status === 'PENDING' && (
                                <div style={{ marginTop: '2rem' }}>
                                    <label className="btn btn-ghost" style={{ border: '1px dashed var(--glass-border)', width: '100%', marginBottom: '1rem', cursor: 'pointer', padding: slipImage ? '0.5rem' : '1rem', height: 'auto' }}>
                                        {slipImage ? (
                                            <div style={{ width: '100%' }}>
                                                <img src={slipImage} alt="Payment Slip" style={{ width: '100%', borderRadius: '8px', marginBottom: '0.5rem' }} />
                                                <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>เปลี่ยนสลิป</span>
                                            </div>
                                        ) : (
                                            <span>📎 แนบสลิปโอนเงิน</span>
                                        )}
                                        <input type="file" accept="image/*" hidden onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                try {
                                                    const compressed = await compressImage(file);
                                                    setSlipImage(compressed);
                                                    toast.success('แนบสลิปสำเร็จ');
                                                } catch (err) {
                                                    toast.error('ไม่สามารถอ่านรูปภาพได้');
                                                }
                                            }
                                        }} />
                                    </label>
                                    <button
                                        onClick={() => handleConfirmPayment(selectedInvoiceForPayment.id)}
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        disabled={!slipImage}
                                    >
                                        ยืนยันการชำระเงิน
                                    </button>
                                </div>
                            )}
                            <button onClick={() => setShowQRModal(false)} className="btn btn-ghost" style={{ marginTop: '1rem', width: '100%' }}>ปิดหน้าต่าง</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TenantDashboard;
