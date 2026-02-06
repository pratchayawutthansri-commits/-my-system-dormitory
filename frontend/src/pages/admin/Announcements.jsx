import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        id: null,
        title: '',
        content: '',
        importance: 'NORMAL',
        isActive: true
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res.data);
        } catch (error) {
            toast.error('โหลดข้อมูลประกาศไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ id: null, title: '', content: '', importance: 'NORMAL', isActive: true });
        setIsEditing(false);
    };

    const handleEdit = (announcement) => {
        setFormData(announcement);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('ยืนยันที่จะลบประกาศนี้?')) return;
        try {
            await api.delete(`/announcements/${id}`);
            toast.success('ลบประกาศเรียบร้อย');
            fetchAnnouncements();
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการลบ');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/announcements/${formData.id}`, formData);
                toast.success('แก้ไขประกาศสำเร็จ');
            } else {
                await api.post('/announcements', formData);
                toast.success('สร้างประกาศสำเร็จ');
            }
            fetchAnnouncements();
            resetForm();
        } catch (error) {
            console.error('Submit error:', error);
            toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด');
        }
    };

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        </div>
    );

    return (
        <div className="animate-enter" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', background: 'var(--text-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Announcements
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        จัดการข่าวสารและประกาศถึงผู้เช่า
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

                {/* List Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {announcements.length === 0 ? (
                        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📢</div>
                            <p>ยังไม่มีประกาศในระบบ</p>
                        </div>
                    ) : (
                        announcements.map(item => (
                            <div key={item.id} className="glass-panel" style={{
                                padding: '2rem',
                                borderLeft: `6px solid ${item.importance === 'URGENT' ? '#F43F5E' : '#10B981'}`,
                                opacity: item.isActive ? 1 : 0.6,
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {item.importance === 'URGENT' && <span className="animate-pulse">🔥</span>}
                                        {item.title}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        {!item.isActive && (
                                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Hidden</span>
                                        )}
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(item.createdAt).toLocaleDateString('th-TH')}
                                        </span>
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-main)', lineHeight: '1.7', whiteSpace: 'pre-line', marginBottom: '1.5rem', fontSize: '1rem' }}>{item.content}</p>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <button onClick={() => handleEdit(item)} className="btn btn-ghost btn-sm">แก้ไข</button>
                                    <button onClick={() => handleDelete(item.id)} className="btn btn-ghost btn-sm" style={{ color: '#F43F5E' }}>ลบ</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Form Section (Sticky) */}
                <div className="glass-panel" style={{ padding: '2rem', position: 'sticky', top: '2rem', borderRadius: 'var(--radius-lg)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {isEditing ? '✏️ แก้ไขประกาศ' : '✍️ สร้างประกาศใหม่'}
                    </h2>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>หัวข้อเรื่อง</label>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="เช่น แจ้งปิดปรับปรุงระบบน้ำ"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>เนื้อหาประกาศ</label>
                            <textarea
                                className="glass-input"
                                rows="8"
                                placeholder="รายละเอียด..."
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                required
                                style={{ resize: 'vertical' }}
                            ></textarea>
                        </div>

                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ประเภทความสำคัญ</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div
                                    onClick={() => setFormData({ ...formData, importance: 'NORMAL' })}
                                    style={{
                                        padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem',
                                        background: formData.importance === 'NORMAL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                        border: formData.importance === 'NORMAL' ? '1px solid #10B981' : '1px solid transparent',
                                        color: formData.importance === 'NORMAL' ? '#10B981' : 'var(--text-muted)'
                                    }}
                                >
                                    ทั่วไป
                                </div>
                                <div
                                    onClick={() => setFormData({ ...formData, importance: 'URGENT' })}
                                    style={{
                                        padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem',
                                        background: formData.importance === 'URGENT' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                                        border: formData.importance === 'URGENT' ? '1px solid #F43F5E' : '1px solid transparent',
                                        color: formData.importance === 'URGENT' ? '#F43F5E' : 'var(--text-muted)'
                                    }}
                                >
                                    ด่วนมาก
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }}
                                />
                                <label htmlFor="isActive" style={{ cursor: 'pointer', flex: 1 }}>แสดงผลบนหน้าเว็บ</label>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            {isEditing && (
                                <button type="button" onClick={resetForm} className="btn btn-ghost" style={{ flex: 1 }}>ยกเลิก</button>
                            )}
                            <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.875rem' }}>
                                {isEditing ? 'บันทึกการแก้ไข' : 'โพสต์ประกาศ'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Announcements;
