import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState({ totalExpenses: 0, totalIncome: 0, netProfit: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'GENERAL',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [expensesRes, summaryRes] = await Promise.all([
                api.get('/expenses'),
                api.get('/expenses/summary')
            ]);
            setExpenses(expensesRes.data);
            setSummary(summaryRes.data);
        } catch (error) {
            toast.error('ไม่สามารถโหลดข้อมูลรายจ่ายได้');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/expenses', formData);
            toast.success('บันทึกรายจ่ายสำเร็จ');
            setShowModal(false);
            setFormData({
                title: '',
                amount: '',
                category: 'GENERAL',
                date: new Date().toISOString().split('T')[0],
                description: ''
            });
            fetchData();
        } catch (error) {
            toast.error('เกิดข้อผิดพลาด');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('ยืนยันการลบรายการนี้?')) return;
        try {
            await api.delete(`/expenses/${id}`);
            toast.success('ลบรายการสำเร็จ');
            fetchData();
        } catch (error) {
            toast.error('ลบรายการไม่สำเร็จ');
        }
    };

    const categories = [
        { id: 'GENERAL', label: 'ทั่วไป', color: '#94A3B8' },
        { id: 'UTILITIES', label: 'สาธารณูปโภค (น้ำ/ไฟ)', color: '#3B82F6' },
        { id: 'MAINTENANCE', label: 'ซ่อมแซม/บำรุงรักษา', color: '#F59E0B' },
        { id: 'SUPPLIES', label: 'วัสดุสิ้นเปลือง', color: '#10B981' },
        { id: 'SALARY', label: 'เงินเดือนพนักงาน', color: '#8B5CF6' }
    ];

    const getCategoryLabel = (id) => categories.find(c => c.id === id)?.label || id;
    const getCategoryColor = (id) => categories.find(c => c.id === id)?.color || '#94A3B8';

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        </div>
    );

    return (
        <div className="animate-enter" style={{ paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', background: 'var(--text-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Expenses
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        บันทึกและจัดการรายจ่ายของหอพัก
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <span>＋</span> บันทึกรายจ่าย
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ color: '#10B981', marginBottom: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>💰</span> รายรับรวม (Income)
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981' }}>฿{parseFloat(summary.totalIncome).toLocaleString()}</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0.05) 100%)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                    <div style={{ color: '#F43F5E', marginBottom: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>💸</span> รายจ่ายรวม (Expenses)
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F43F5E' }}>฿{parseFloat(summary.totalExpenses).toLocaleString()}</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ color: '#3B82F6', marginBottom: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📊</span> กำไรสุทธิ (Net Profit)
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: summary.netProfit >= 0 ? '#3B82F6' : '#F43F5E' }}>
                        ฿{parseFloat(summary.netProfit).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>ประวัติรายจ่ายล่าสุด</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem 1.5rem' }}>วันที่</th>
                                <th style={{ padding: '1rem' }}>รายการ</th>
                                <th style={{ padding: '1rem' }}>หมวดหมู่</th>
                                <th style={{ padding: '1rem' }}>จำนวนเงิน</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length > 0 ? expenses.map((expense) => (
                                <tr key={expense.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="hover:bg-white/5">
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>
                                        {new Date(expense.date).toLocaleDateString('th-TH')}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600 }}>{expense.title}</div>
                                        {expense.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{expense.description}</div>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            background: `${getCategoryColor(expense.category)}22`,
                                            color: getCategoryColor(expense.category),
                                            border: `1px solid ${getCategoryColor(expense.category)}44`
                                        }}>
                                            {getCategoryLabel(expense.category)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: '#F43F5E' }}>
                                        - ฿{parseFloat(expense.amount).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="btn btn-ghost btn-sm"
                                            style={{ color: '#F43F5E', width: '32px', padding: 0, justifyContent: 'center' }}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        ไม่มีรายการรายจ่าย
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Expense Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '420px', padding: '2rem', borderRadius: '16px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>บันทึกรายจ่ายใหม่</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="form-label">หัวข้อรายการ</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="form-label">จำนวนเงิน (บาท)</label>
                                <input
                                    type="number"
                                    className="glass-input"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="form-label">หมวดหมู่</label>
                                <select
                                    className="glass-input"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="form-label">วันที่</label>
                                <input
                                    type="date"
                                    className="glass-input"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label className="form-label">รายละเอียดเพิ่มเติม (ถ้ามี)</label>
                                <textarea
                                    className="glass-input"
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>ยกเลิก</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
