import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MaintenanceManagement = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/maintenance');
            setRequests(res.data);
        } catch (error) {
            toast.error('ไม่สามารถดึงข้อมูลได้');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/maintenance/${id}/status`, {
                status: newStatus,
                adminNote: adminNote
            });
            toast.success('อัพเดทสถานะเรียบร้อย');
            setShowModal(false);
            setAdminNote('');
            fetchData();
        } catch (error) {
            toast.error('เกิดข้อผิดพลาด');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('ยืนยันการลบรายการนี้?')) return;
        try {
            await api.delete(`/maintenance/${id}`);
            toast.success('ลบรายการสำเร็จ');
            setShowModal(false);
            fetchData();
        } catch (error) {
            toast.error('เกิดข้อผิดพลาด');
        }
    };

    const openModal = (req) => {
        setSelectedRequest(req);
        setAdminNote(req.adminNote || '');
        setShowModal(true);
    };

    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const inProgressRequests = requests.filter(r => r.status === 'IN_PROGRESS');
    const completedRequests = requests.filter(r => r.status === 'COMPLETED');

    const formatDate = (date) => new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        </div>
    );

    return (
        <div className="animate-enter" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', background: 'var(--text-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Maintenance
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        ติดตามสถานะการแจ้งซ่อม ({requests.length} รายการ)
                    </p>
                </div>
            </div>

            {/* Kanban Board */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.5rem',
                flex: 1,
                overflow: 'hidden',
                paddingBottom: '1rem'
            }}>
                {/* Pending Column */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255, 255, 255, 0.03)' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F59E0B' }}>⏳ รอรับเรื่อง</h3>
                        <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>{pendingRequests.length}</span>
                    </div>
                    <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pendingRequests.map(req => (
                            <div key={req.id} onClick={() => openModal(req)} className="glass-panel hover:bg-white/5" style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid #F59E0B', transition: 'transform 0.2s', background: 'var(--bg-panel)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{req.room?.roomNumber}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(req.createdAt)}</span>
                                </div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{req.title}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <span>👤 {req.tenant?.firstName}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* In Progress Column */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255, 255, 255, 0.03)' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>🔧 กำลังดำเนินการ</h3>
                        <span style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>{inProgressRequests.length}</span>
                    </div>
                    <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {inProgressRequests.map(req => (
                            <div key={req.id} onClick={() => openModal(req)} className="glass-panel hover:bg-white/5" style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid var(--primary)', transition: 'transform 0.2s', background: 'var(--bg-panel)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{req.room?.roomNumber}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(req.createdAt)}</span>
                                </div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{req.title}</h4>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '6px' }}>
                                    📝 {req.adminNote || 'ไม่มีหมายเหตุ'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Completed Column */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255, 255, 255, 0.03)' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981' }}>✅ เสร็จสิ้น</h3>
                        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>{completedRequests.length}</span>
                    </div>
                    <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {completedRequests.map(req => (
                            <div key={req.id} onClick={() => openModal(req)} className="glass-panel hover:bg-white/5" style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid #10B981', opacity: 0.7, background: 'var(--bg-panel)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{req.room?.roomNumber}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(req.createdAt)}</span>
                                </div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{req.title}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && selectedRequest && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '600px', padding: '0', borderRadius: 'var(--radius-lg)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>ห้อง {selectedRequest.room?.roomNumber}</span>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', lineHeight: 1.2 }}>{selectedRequest.title}</h2>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                        </div>

                        <div style={{ padding: '2rem', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>ผู้แจ้ง</label>
                                    <div style={{ fontWeight: 600 }}>{selectedRequest.tenant?.firstName} {selectedRequest.tenant?.lastName}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{selectedRequest.tenant?.phone}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>วันที่แจ้ง</label>
                                    <div style={{ fontWeight: 600 }}>{formatDate(selectedRequest.createdAt)}</div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>รายละเอียดปัญหา</label>
                                <p style={{ lineHeight: 1.6 }}>{selectedRequest.description}</p>
                            </div>

                            {(selectedRequest.image || selectedRequest.imageData) && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>รูปภาพประกอบ</label>
                                    <div style={{ borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                                        <img
                                            src={selectedRequest.image || selectedRequest.imageData}
                                            alt="Report"
                                            style={{ width: '100%', display: 'block' }}
                                            onClick={() => window.open(selectedRequest.image || selectedRequest.imageData, '_blank')}
                                        />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>คลิกที่รูปเพื่อดูขนาดจริง</p>
                                </div>
                            )}

                            {/* Debug Info (Only in Dev) */}
                            {/* <div style={{marginTop: '2rem', padding: '1rem', background: '#000', color: '#0f0', fontSize: '0.7rem', borderRadius: '8px', overflow: 'auto', maxHeight: '200px'}}>
                                DEBUG: Has Image? {selectedRequest.image ? 'YES (image)' : (selectedRequest.imageData ? 'YES (imageData)' : 'NO')}
                                <br/>ID: {selectedRequest.id}
                            </div> */}

                            <div style={{ marginBottom: '2rem' }}>
                                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>บันทึกจากเจ้าหน้าที่ (Admin Note)</label>
                                <textarea
                                    className="glass-input"
                                    rows="3"
                                    placeholder="เช่น นัดช่างเข้าวันพรุ่งนี้..."
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                ></textarea>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem' }}>
                                <button onClick={() => handleStatusChange(selectedRequest.id, 'PENDING')} className={`btn ${selectedRequest.status === 'PENDING' ? '' : 'btn-ghost'}`} style={{ border: '1px solid #F59E0B', color: '#F59E0B', background: selectedRequest.status === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' : 'transparent' }}>รอรับเรื่อง</button>
                                <button onClick={() => handleStatusChange(selectedRequest.id, 'IN_PROGRESS')} className={`btn ${selectedRequest.status === 'IN_PROGRESS' ? '' : 'btn-ghost'}`} style={{ border: '1px solid var(--primary)', color: 'var(--primary)', background: selectedRequest.status === 'IN_PROGRESS' ? 'rgba(79, 70, 229, 0.1)' : 'transparent' }}>กำลังซ่อม</button>
                                <button onClick={() => handleStatusChange(selectedRequest.id, 'COMPLETED')} className={`btn ${selectedRequest.status === 'COMPLETED' ? '' : 'btn-ghost'}`} style={{ border: '1px solid #10B981', color: '#10B981', background: selectedRequest.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }}>เสร็จสิ้น</button>
                                <button onClick={() => handleDelete(selectedRequest.id)} className="btn btn-ghost" style={{ color: '#F43F5E' }}>🗑️</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceManagement;
