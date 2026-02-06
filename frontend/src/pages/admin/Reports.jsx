import { useState, useEffect } from 'react';
import api from '../../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';
import PaymentQRModal from '../../components/PaymentQRModal';

const Reports = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => {
        fetchReport();
    }, [selectedMonth]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-');
            const response = await api.get(`/reports/monthly?year=${year}&month=${month}`);
            setReport(response.data);
        } catch (error) {
            console.error('Error fetching report:', error);
            toast.error('ไม่สามารถดึงข้อมูลรายงานได้');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteInvoice = async (id) => {
        if (!confirm('คุณต้องการลบบิลนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้')) return;
        try {
            await api.delete(`/invoices/${id}`);
            toast.success('ลบบิลเรียบร้อยแล้ว');
            fetchReport();
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการลบบิล');
        }
    };

    const formatCurrency = (value) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(value || 0);

    const pieData = [
        { name: 'ชำระแล้ว (Paid)', value: report?.summary?.paidCount || 0, color: '#10B981' },
        { name: 'รอชำระ (Pending)', value: report?.summary?.pendingCount || 0, color: '#F59E0B' }
    ].filter(item => item.value > 0);

    return (
        <div className="animate-enter" style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', background: 'var(--text-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Monthly Reports
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        วิเคราะห์รายได้และสรุปสถานะการเงิน
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📅</span>
                    <input
                        type="month"
                        style={{
                            background: 'transparent', border: 'none', color: 'var(--text-primary)',
                            fontSize: '1rem', fontWeight: 600, outline: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-body)'
                        }}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(79, 70, 229, 0.05))', borderColor: 'rgba(79, 70, 229, 0.3)' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>รายได้สุทธิ (Net Income)</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(report?.summary?.totalIncome)}</h3>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>ค่าเช่าห้อง (Rent)</p>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{formatCurrency(report?.summary?.totalRent)}</h3>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>ค่าน้ำ (Water)</p>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--info)' }}>{formatCurrency(report?.summary?.totalWater)}</h3>
                        </div>
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>ค่าไฟ (Electric)</p>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(report?.summary?.totalElectric)}</h3>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem', marginBottom: '3rem', alignItems: 'start' }}>

                        {/* Transaction Table */}
                        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>รายละเอียดบิล ({report?.invoices?.length || 0} รายการ)</h3>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                            <th style={{ padding: '1rem 1.5rem' }}>ห้อง</th>
                                            <th style={{ padding: '1rem' }}>ผู้เช่า</th>
                                            <th style={{ padding: '1rem', textAlign: 'right' }}>ยอดรวม</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>สถานะ</th>
                                            <th style={{ padding: '1rem', textAlign: 'right' }}>จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report?.invoices?.map((invoice) => (
                                            <tr key={invoice.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover:bg-white/5">
                                                <td style={{ padding: '1rem 1.5rem', fontWeight: 800 }}>{invoice.room?.roomNumber}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{invoice.tenant?.firstName}</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(invoice.totalAmount)}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700,
                                                        background: invoice.status === 'PAID' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: invoice.status === 'PAID' ? '#10B981' : '#F59E0B'
                                                    }}>
                                                        {invoice.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <button onClick={() => handleDeleteInvoice(invoice.id)} className="btn btn-ghost btn-sm" style={{ color: '#F43F5E' }}>🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Charts */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="glass-panel" style={{ padding: '2rem', minHeight: '340px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>Payment Status</h3>
                                <div style={{ height: '250px' }}>
                                    {pieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Data</div>
                                    )}
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📈 Summary</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>ชำระแล้ว</span>
                                    <span style={{ fontWeight: 600, color: '#10B981' }}>{report?.summary?.paidCount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>รอชำระ</span>
                                    <span style={{ fontWeight: 600, color: '#F59E0B' }}>{report?.summary?.pendingCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
