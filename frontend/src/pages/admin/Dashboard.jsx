import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

// Custom Tooltip for Bar Chart
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-panel" style={{ padding: '0.75rem', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</p>
                <p style={{ margin: '0.25rem 0 0', fontWeight: 700, fontSize: '1rem', color: '#10B981' }}>
                    {formatCurrency(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

// Donut Chart Colors
const ROOM_STATUS_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#F43F5E'];

// Helper: Time ago
const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    return date.toLocaleDateString('th-TH');
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Close notification when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showNotifications && !e.target.closest('.notification-wrapper')) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showNotifications]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [reportRes, expensesRes] = await Promise.all([
                api.get('/reports/income-summary'),
                api.get('/expenses/summary')
            ]);
            setData({ ...reportRes.data, expensesSummary: expensesRes.data });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle notification click - navigate to relevant page
    const handleNotificationClick = (activity) => {
        setShowNotifications(false);
        switch (activity.type) {
            case 'MAINTENANCE':
                navigate('/admin/maintenance');
                break;
            case 'INVOICE':
            case 'PAYMENT':
                navigate('/admin/billing');
                break;
            case 'ROOM':
                navigate('/admin/rooms');
                break;
            default:
                navigate('/admin');
        }
    };

    if (loading) {
        return (
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
            </div>
        );
    }

    // Prepare Room Status Data for Donut Chart
    const roomStatusData = [
        { name: 'ว่าง', value: data?.rooms?.available || 0 },
        { name: 'มีผู้เช่า', value: data?.rooms?.occupied || 0 },
        { name: 'ซ่อมบำรุง', value: data?.rooms?.maintenance || 0 }
    ].filter(item => item.value > 0);

    const totalRooms = (data?.rooms?.available || 0) + (data?.rooms?.occupied || 0) + (data?.rooms?.maintenance || 0);
    const occupancyRate = totalRooms > 0 ? Math.round((data?.rooms?.occupied / totalRooms) * 100) : 0;
    const availableRate = totalRooms > 0 ? Math.round((data?.rooms?.available / totalRooms) * 100) : 0;

    // Count unread notifications
    const notificationCount = (data?.latestActivities?.length || 0) + (data?.verificationQueue || 0);

    return (
        <div className="animate-enter" style={{ paddingBottom: '2rem' }}>
            {/* Header with Notification Bell */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>ภาพรวมระบบจองห้องพัก</p>
                </div>

                {/* Notification Bell */}
                <div className="notification-wrapper" style={{ position: 'relative' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowNotifications(!showNotifications);
                        }}
                        className="glass-panel"
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            border: showNotifications ? '2px solid var(--primary)' : 'var(--glass-border)',
                            background: showNotifications ? 'rgba(79, 70, 229, 0.1)' : 'var(--bg-panel)'
                        }}
                    >
                        <span style={{ fontSize: '1.25rem' }}>🔔</span>

                        {/* Badge */}
                        {notificationCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                minWidth: '22px',
                                height: '22px',
                                background: '#F43F5E',
                                borderRadius: '11px',
                                border: '3px solid var(--bg-app)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                color: 'white'
                            }}>
                                {notificationCount > 9 ? '9+' : notificationCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div
                            className="glass-panel animate-enter"
                            style={{
                                position: 'absolute',
                                top: '56px',
                                right: 0,
                                width: '360px',
                                background: 'var(--bg-panel)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '16px',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                                zIndex: 1000,
                                overflow: 'hidden'
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: '1rem 1.25rem',
                                borderBottom: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1rem' }}>🔔</span>
                                    <h4 style={{ margin: 0, fontWeight: 700 }}>การแจ้งเตือน</h4>
                                    {notificationCount > 0 && (
                                        <span className="badge badge-danger">{notificationCount} ใหม่</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowNotifications(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.25rem' }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Notification List */}
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {/* Verification Queue Alert */}
                                {data?.verificationQueue > 0 && (
                                    <div
                                        onClick={() => {
                                            setShowNotifications(false);
                                            navigate('/admin/billing');
                                        }}
                                        style={{
                                            padding: '1rem 1.25rem',
                                            borderBottom: '1px solid var(--glass-border)',
                                            display: 'flex',
                                            gap: '1rem',
                                            cursor: 'pointer',
                                            background: 'rgba(244, 63, 94, 0.05)',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.05)'}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'rgba(244, 63, 94, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.1rem',
                                            flexShrink: 0
                                        }}>
                                            📑
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>
                                                รอตรวจสอบสลิป
                                            </p>
                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {data.verificationQueue} รายการรอการยืนยัน
                                            </p>
                                            <span className="badge badge-danger" style={{ marginTop: '0.5rem' }}>ดำเนินการ →</span>
                                        </div>
                                    </div>
                                )}

                                {/* Activity Items */}
                                {data?.latestActivities?.length > 0 ? (
                                    data.latestActivities.slice(0, 5).map((activity, index) => (
                                        <div
                                            key={activity.id || index}
                                            onClick={() => handleNotificationClick(activity)}
                                            style={{
                                                padding: '1rem 1.25rem',
                                                borderBottom: index < 4 ? '1px solid var(--glass-border)' : 'none',
                                                display: 'flex',
                                                gap: '1rem',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: activity.type === 'MAINTENANCE'
                                                    ? 'rgba(244, 63, 94, 0.1)'
                                                    : activity.type === 'INVOICE' || activity.type === 'PAYMENT'
                                                        ? 'rgba(16, 185, 129, 0.1)'
                                                        : 'rgba(79, 70, 229, 0.1)',
                                                color: activity.type === 'MAINTENANCE'
                                                    ? '#F43F5E'
                                                    : activity.type === 'INVOICE' || activity.type === 'PAYMENT'
                                                        ? '#10B981'
                                                        : 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.1rem',
                                                flexShrink: 0
                                            }}>
                                                {activity.type === 'MAINTENANCE' ? '🔧' :
                                                    activity.type === 'INVOICE' || activity.type === 'PAYMENT' ? '💰' : '📝'}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {activity.message}
                                                    </p>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                                        {getTimeAgo(activity.time)}
                                                    </span>
                                                </div>
                                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {activity.subtext}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    !data?.verificationQueue && (
                                        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <div style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: '0.5rem' }}>🔔</div>
                                            <p style={{ margin: 0, fontWeight: 600 }}>ไม่มีการแจ้งเตือนใหม่</p>
                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>เราจะแจ้งเตือนเมื่อมีกิจกรรมใหม่</p>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Footer */}
                            {(data?.latestActivities?.length > 0 || data?.verificationQueue > 0) && (
                                <div style={{ padding: '0.75rem', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
                                    <button
                                        onClick={() => {
                                            setShowNotifications(false);
                                            navigate('/admin/billing');
                                        }}
                                        className="btn btn-ghost"
                                        style={{ width: '100%', fontSize: '0.85rem', color: 'var(--primary)' }}
                                    >
                                        ดูทั้งหมด →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 4 Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>

                {/* Card 1: ห้องว่าง */}
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#10B981' }}>🛏️</div>
                    <div className="stat-content">
                        <p className="stat-label">ห้องว่าง</p>
                        <h2 className="stat-value">{data?.rooms?.available || 0}</h2>
                        <p className="stat-sub">จากทั้งหมด {totalRooms}</p>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${availableRate}%`, background: '#10B981' }}></div>
                        </div>
                        <span className="stat-trend positive">อัตราส่วน {availableRate}%</span>
                    </div>
                </div>

                {/* Card 2: ห้องไม่ว่าง */}
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#3B82F6' }}>🔑</div>
                    <div className="stat-content">
                        <p className="stat-label">ห้องไม่ว่าง</p>
                        <h2 className="stat-value">{data?.rooms?.occupied || 0}</h2>
                        <p className="stat-sub">จากทั้งหมด {totalRooms}</p>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${occupancyRate}%`, background: '#3B82F6' }}></div>
                        </div>
                        <span className="stat-trend positive">อัตราส่วน {occupancyRate}%</span>
                    </div>
                </div>

                {/* Card 3: รายได้เดือนนี้ */}
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#F59E0B' }}>💰</div>
                    <div className="stat-content">
                        <p className="stat-label">รายได้เดือนนี้</p>
                        <h2 className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(data?.currentMonth?.paidAmount || 0)}</h2>
                        <span className="stat-trend positive">▲ +{data?.currentMonth?.collectionRate || 0}% อัตราเก็บเงิน</span>
                    </div>
                </div>

                {/* Card 4: รอตรวจสอบ */}
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#8B5CF6' }}>📋</div>
                    <div className="stat-content">
                        <p className="stat-label">รอตรวจสอบสลิป</p>
                        <h2 className="stat-value" style={{ color: data?.verificationQueue > 0 ? '#F43F5E' : 'inherit' }}>
                            {data?.verificationQueue || 0}
                        </h2>
                        <span className="stat-trend" style={{ color: 'var(--text-muted)' }}>รายการรอดำเนินการ</span>
                    </div>
                </div>

            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>

                {/* Bar Chart: รายได้รายเดือน */}
                <div className="chart-container">
                    <h3 className="chart-title">📊 รายได้รายเดือน</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.monthlyChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                                <XAxis
                                    dataKey="label"
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                                <Bar
                                    dataKey="income"
                                    fill="#10B981"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={45}
                                    animationDuration={1000}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart: สถานะห้องพัก */}
                <div className="chart-container">
                    <h3 className="chart-title">🏠 สถานะห้องพัก</h3>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {roomStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roomStatusData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        dataKey="value"
                                        animationDuration={800}
                                    >
                                        {roomStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={ROOM_STATUS_COLORS[index % ROOM_STATUS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend
                                        verticalAlign="bottom"
                                        formatter={(value, entry) => (
                                            <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
                                                {value} ({entry.payload.value})
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '2.5rem', opacity: 0.5, marginBottom: '0.5rem' }}>🏠</div>
                                <p>ยังไม่มีข้อมูลห้องพัก</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Quick Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
                <div className="stat-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>💵</div>
                    <div>
                        <p className="stat-label">รายรับรวม</p>
                        <p style={{ fontWeight: 700, color: '#10B981' }}>{formatCurrency(data?.currentMonth?.paidAmount || 0)}</p>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>💸</div>
                    <div>
                        <p className="stat-label">รายจ่ายรวม</p>
                        <p style={{ fontWeight: 700, color: '#F43F5E' }}>{formatCurrency(data?.expensesSummary?.totalExpenses || 0)}</p>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>📈</div>
                    <div>
                        <p className="stat-label">กำไรสุทธิ</p>
                        <p style={{ fontWeight: 700, color: (data?.currentMonth?.paidAmount - (data?.expensesSummary?.totalExpenses || 0)) >= 0 ? '#3B82F6' : '#F43F5E' }}>
                            {formatCurrency((data?.currentMonth?.paidAmount || 0) - (data?.expensesSummary?.totalExpenses || 0))}
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
