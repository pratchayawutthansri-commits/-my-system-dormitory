import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';
import { Printer } from 'lucide-react';
import ContractDocument from '../../components/documents/ContractDocument';
import MoveOutNoticeDocument from '../../components/documents/MoveOutNoticeDocument';

const RoomManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [settings, setSettings] = useState(null);

    // Printing Refs
    const contractRef = useRef();
    const moveOutRef = useRef();
    const [printData, setPrintData] = useState({ room: null, tenant: null, type: null });

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showMoveOutModal, setShowMoveOutModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [formData, setFormData] = useState({
        roomNumber: '',
        baseRent: '',
        floor: '1'
    });
    const [moveOutData, setMoveOutData] = useState({ cleaningFee: 500, damagesFee: 0 });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await api.get('/rooms');
            setRooms(response.data);
        } catch (error) {
            toast.error('ไม่สามารถโหลดข้อมูลห้องได้');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableTenants = async () => {
        try {
            const response = await api.get('/rooms/available-tenants');
            setTenants(response.data);
        } catch (error) {
            toast.error('ไม่สามารถโหลดรายชื่อผู้เช่าได้');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedRoom) {
                await api.put(`/rooms/${selectedRoom.id}`, formData);
                toast.success('อัปเดตห้องสำเร็จ');
            } else {
                await api.post('/rooms', formData);
                toast.success('เพิ่มห้องสำเร็จ');
            }
            setShowModal(false);
            setSelectedRoom(null);
            setFormData({ roomNumber: '', baseRent: '', floor: '1' });
            fetchRooms();
        } catch (error) {
            toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด');
        }
    };

    const handleEdit = (room) => {
        setSelectedRoom(room);
        setFormData({
            roomNumber: room.roomNumber,
            baseRent: room.baseRent,
            floor: room.floor.toString()
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('ยืนยันการลบห้องนี้?')) return;
        try {
            await api.delete(`/rooms/${id}`);
            toast.success('ลบห้องสำเร็จ');
            fetchRooms();
        } catch (error) {
            toast.error('ไม่สามารถลบห้องได้');
        }
    };

    const handleAssign = async (room) => {
        setSelectedRoom(room);
        await fetchAvailableTenants();
        setShowAssignModal(true);
    };

    const assignTenant = async (tenantId) => {
        try {
            await api.post(`/rooms/${selectedRoom.id}/assign`, {
                tenantId,
                depositAmount: formData.depositAmount,
                contractDuration: formData.contractDuration
            });
            toast.success('มอบหมายผู้เช่าเรียบร้อย');
            setShowAssignModal(false);
            setFormData({ ...formData, selectedTenantId: null, depositAmount: '', contractDuration: '12' });
            fetchRooms();
        } catch (error) {
            toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด');
        }
    };

    const handleMoveOutClick = async (room) => {
        try {
            const response = await api.get(`/rooms/${room.id}`);
            setSelectedRoom(response.data);
            setMoveOutData({ cleaningFee: 500, damagesFee: 0 });
            setShowMoveOutModal(true);
        } catch (error) {
            toast.error('ไม่สามารถดึงข้อมูลห้องได้');
        }
    };

    const removeTenant = async (roomId) => {
        try {
            await api.post(`/rooms/${roomId}/remove-tenant`);
            toast.success('ย้ายผู้เช่าออกสำเร็จ');
            setShowMoveOutModal(false);
            fetchRooms();
        } catch (error) {
            toast.error('เกิดข้อผิดพลาด');
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

    const handlePrintContract = useReactToPrint({
        contentRef: contractRef,
        documentTitle: `สัญญาเช่า_${printData.room?.roomNumber}`,
        onAfterPrint: () => setPrintData({ room: null, tenant: null, type: null })
    });

    const handlePrintMoveOut = useReactToPrint({
        contentRef: moveOutRef,
        documentTitle: `ใบแจ้งย้ายออก_${printData.room?.roomNumber}`,
        onAfterPrint: () => setPrintData({ room: null, tenant: null, type: null })
    });

    // Trigger print when printData is ready
    useEffect(() => {
        if (printData.type === 'CONTRACT' && printData.room && printData.tenant) {
            const timer = setTimeout(() => handlePrintContract(), 100);
            return () => clearTimeout(timer);
        }
        if (printData.type === 'MOVEOUT' && printData.room && printData.tenant) {
            const timer = setTimeout(() => handlePrintMoveOut(), 100);
            return () => clearTimeout(timer);
        }
    }, [printData, handlePrintContract, handlePrintMoveOut]);

    const preparePrintContract = (room) => {
        if (!room.tenant) return;
        setPrintData({
            room: room,
            tenant: room.tenant,
            type: 'CONTRACT'
        });
    };

    const preparePrintMoveOut = () => {
        if (!selectedRoom || !selectedRoom.tenant) return;
        setPrintData({
            room: selectedRoom,
            tenant: selectedRoom.tenant,
            type: 'MOVEOUT'
        });
    };

    // Natural sort function (1, 2, 3... not 1, 10, 11...)
    const naturalSort = (a, b) => {
        return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: 'base' });
    };

    // Filter, Search & Sort
    const filteredRooms = rooms
        .filter(room => {
            const matchSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (room.tenant && (room.tenant.firstName + room.tenant.lastName).toLowerCase().includes(searchTerm.toLowerCase()));
            const matchStatus = filterStatus === 'ALL' || room.status === filterStatus;
            return matchSearch && matchStatus;
        })
        .sort(naturalSort);

    // Stats
    const stats = {
        total: rooms.length,
        available: rooms.filter(r => r.status === 'AVAILABLE').length,
        occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
        maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length
    };

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        </div>
    );

    return (
        <div className="animate-enter" style={{ paddingBottom: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>จัดการห้องพัก</h1>
                    <p style={{ color: 'var(--text-muted)' }}>ทั้งหมด {stats.total} ห้อง</p>
                </div>
                <button
                    onClick={() => { setSelectedRoom(null); setFormData({ roomNumber: '', baseRent: '', floor: '1' }); setShowModal(true); }}
                    className="btn btn-primary"
                >
                    + เพิ่มห้องใหม่
                </button>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div
                    onClick={() => setFilterStatus('ALL')}
                    className="stat-card"
                    style={{ padding: '1rem', cursor: 'pointer', border: filterStatus === 'ALL' ? '2px solid var(--primary)' : 'var(--glass-border)' }}
                >
                    <div style={{ fontSize: '1.5rem' }}>🏠</div>
                    <div>
                        <p className="stat-label">ทั้งหมด</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total}</p>
                    </div>
                </div>
                <div
                    onClick={() => setFilterStatus('AVAILABLE')}
                    className="stat-card"
                    style={{ padding: '1rem', cursor: 'pointer', border: filterStatus === 'AVAILABLE' ? '2px solid #10B981' : 'var(--glass-border)' }}
                >
                    <div style={{ fontSize: '1.5rem' }}>🟢</div>
                    <div>
                        <p className="stat-label">ว่าง</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>{stats.available}</p>
                    </div>
                </div>
                <div
                    onClick={() => setFilterStatus('OCCUPIED')}
                    className="stat-card"
                    style={{ padding: '1rem', cursor: 'pointer', border: filterStatus === 'OCCUPIED' ? '2px solid #3B82F6' : 'var(--glass-border)' }}
                >
                    <div style={{ fontSize: '1.5rem' }}>🔵</div>
                    <div>
                        <p className="stat-label">มีผู้เช่า</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3B82F6' }}>{stats.occupied}</p>
                    </div>
                </div>
                <div
                    onClick={() => setFilterStatus('MAINTENANCE')}
                    className="stat-card"
                    style={{ padding: '1rem', cursor: 'pointer', border: filterStatus === 'MAINTENANCE' ? '2px solid #F59E0B' : 'var(--glass-border)' }}
                >
                    <div style={{ fontSize: '1.5rem' }}>🟡</div>
                    <div>
                        <p className="stat-label">ซ่อมบำรุง</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>{stats.maintenance}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="🔍 ค้นหาห้อง หรือชื่อผู้เช่า..."
                    className="glass-input"
                    style={{ maxWidth: '400px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Room Grid - Compact Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {filteredRooms.map((room) => {
                    const isOccupied = room.status === 'OCCUPIED';
                    const isAvailable = room.status === 'AVAILABLE';
                    const statusColor = isOccupied ? '#3B82F6' : isAvailable ? '#10B981' : '#F59E0B';

                    return (
                        <div
                            key={room.id}
                            className="glass-panel"
                            style={{
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: `4px solid ${statusColor}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {/* Room Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{room.roomNumber}</h3>
                                <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    background: `${statusColor}20`,
                                    color: statusColor
                                }}>
                                    {isOccupied ? 'มีผู้เช่า' : isAvailable ? 'ว่าง' : 'ซ่อม'}
                                </span>
                            </div>

                            {/* Room Info */}
                            <div style={{ marginBottom: '0.75rem' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ชั้น {room.floor} • {formatCurrency(room.baseRent)}</p>
                                {isOccupied && room.tenant && (
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.25rem' }}>
                                        👤 {room.tenant.firstName} {room.tenant.lastName?.charAt(0)}.
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'grid', gridTemplateColumns: isOccupied ? '1fr auto' : '1fr', gap: '0.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                    {isAvailable ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAssign(room); }}
                                            className="btn btn-sm"
                                            style={{ background: '#10B98120', color: '#10B981', border: 'none', padding: '0.4rem', fontSize: '0.9rem', width: '100%', height: '32px' }}
                                        >
                                            + เข้าอยู่
                                        </button>
                                    ) : isOccupied ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleMoveOutClick(room); }}
                                            className="btn btn-sm"
                                            style={{ background: '#F43F5E20', color: '#F43F5E', border: 'none', padding: '0.4rem', fontSize: '0.9rem', width: '100%', height: '32px' }}
                                        >
                                            แจ้งออก
                                        </button>
                                    ) : (
                                        <button disabled className="btn btn-sm" style={{ opacity: 0.5, padding: '0.4rem', fontSize: '0.9rem', width: '100%', height: '32px' }}>
                                            ซ่อมอยู่
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    {isOccupied && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); preparePrintContract(room); }}
                                            className="btn btn-sm btn-ghost"
                                            style={{ padding: '0', color: 'var(--primary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', borderRadius: '6px' }}
                                            title="พิมพ์สัญญา"
                                        >
                                            <Printer size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(room); }}
                                        className="btn btn-sm btn-ghost"
                                        style={{ padding: '0', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', borderRadius: '6px' }}
                                        title="แก้ไข"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(room.id); }}
                                        className="btn btn-sm btn-ghost"
                                        style={{ padding: '0', color: '#F43F5E', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', borderRadius: '6px' }}
                                        title="ลบ"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredRooms.length === 0 && (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', marginTop: '2rem' }}>
                    <div style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '1rem' }}>🏠</div>
                    <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>ไม่พบห้องพัก</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'คลิก "เพิ่มห้องใหม่" เพื่อเริ่มต้น'}
                    </p>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '380px', padding: '1.5rem', borderRadius: 'var(--radius-lg)', margin: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                            {selectedRoom ? '✏️ แก้ไขห้อง' : '🏠 เพิ่มห้องใหม่'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>หมายเลขห้อง</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="เช่น 101"
                                    value={formData.roomNumber}
                                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>ค่าเช่า (บาท)</label>
                                    <input
                                        type="number"
                                        className="glass-input"
                                        placeholder="3500"
                                        value={formData.baseRent}
                                        onChange={(e) => setFormData({ ...formData, baseRent: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>ชั้น</label>
                                    <input
                                        type="number"
                                        className="glass-input"
                                        placeholder="1"
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>ยกเลิก</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Tenant Modal */}
            {showAssignModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '420px', padding: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden', margin: '1rem' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                {formData.selectedTenantId ? '📝 รายละเอียดสัญญา' : `เช็คอินห้อง ${selectedRoom?.roomNumber}`}
                            </h3>
                        </div>

                        {!formData.selectedTenantId ? (
                            <>
                                <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '0.75rem' }}>
                                    {tenants.length > 0 ? tenants.map(tenant => (
                                        <div key={tenant.id} style={{
                                            padding: '0.75rem',
                                            marginBottom: '0.5rem',
                                            borderRadius: '8px',
                                            background: 'var(--bg-hover)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                                                    {tenant.firstName[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tenant.firstName} {tenant.lastName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tenant.email}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => setFormData({ ...formData, selectedTenantId: tenant.id })} className="btn btn-sm btn-primary">เลือก</button>
                                        </div>
                                    )) : (
                                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่พบผู้เช่าที่ว่างอยู่</div>
                                    )}
                                </div>
                                <div style={{ padding: '0.75rem', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
                                    <button onClick={() => setShowAssignModal(false)} className="btn btn-ghost btn-sm">ปิด</button>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '1.25rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>เงินประกัน (บาท)</label>
                                    <input
                                        type="number"
                                        className="glass-input"
                                        placeholder="5000"
                                        value={formData.depositAmount || ''}
                                        onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>ระยะสัญญา</label>
                                    <select
                                        className="glass-input"
                                        value={formData.contractDuration || '12'}
                                        onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value })}
                                    >
                                        <option value="1">1 เดือน</option>
                                        <option value="6">6 เดือน</option>
                                        <option value="12">1 ปี</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button onClick={() => setFormData({ ...formData, selectedTenantId: null })} className="btn btn-ghost" style={{ flex: 1 }}>ย้อนกลับ</button>
                                    <button onClick={() => assignTenant(formData.selectedTenantId)} className="btn btn-primary" style={{ flex: 1 }}>ยืนยัน</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Move Out Modal */}
            {showMoveOutModal && selectedRoom && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="glass-panel animate-enter" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#F43F5E' }}>
                            ⚠️ ย้ายออก - ห้อง {selectedRoom.roomNumber}
                        </h3>

                        <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>ผู้เช่า</span>
                                <span style={{ fontWeight: 600 }}>{selectedRoom.tenant?.firstName} {selectedRoom.tenant?.lastName}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>เงินประกัน</span>
                                <span style={{ fontWeight: 700, color: '#10B981' }}>{formatCurrency(selectedRoom.tenant?.depositAmount || 0)}</span>
                            </div>
                        </div>

                        {selectedRoom.invoices?.filter(inv => inv.status !== 'PAID').length > 0 && (
                            <div style={{ background: '#F43F5E10', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #F43F5E30' }}>
                                <p style={{ fontSize: '0.85rem', color: '#F43F5E', fontWeight: 600 }}>
                                    ⚠️ ค้างชำระ {selectedRoom.invoices.filter(inv => inv.status !== 'PAID').length} บิล
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ค่าทำความสะอาด</label>
                                <input
                                    type="number"
                                    className="glass-input"
                                    value={moveOutData.cleaningFee}
                                    onChange={(e) => setMoveOutData({ ...moveOutData, cleaningFee: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ค่าเสียหาย</label>
                                <input
                                    type="number"
                                    className="glass-input"
                                    value={moveOutData.damagesFee}
                                    onChange={(e) => setMoveOutData({ ...moveOutData, damagesFee: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div style={{ background: '#10B98120', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ยอดคืนเงินประกัน</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>
                                {formatCurrency(
                                    (parseFloat(selectedRoom.tenant?.depositAmount || 0)) -
                                    (selectedRoom.invoices?.filter(inv => inv.status !== 'PAID').reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0) || 0) -
                                    moveOutData.cleaningFee -
                                    moveOutData.damagesFee
                                )}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setShowMoveOutModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>ยกเลิก</button>
                            <button
                                onClick={preparePrintMoveOut}
                                className="btn btn-ghost"
                                style={{ flex: 1, border: '1px solid var(--glass-border)' }}
                            >
                                <Printer size={16} /> ใบแจ้ง
                            </button>
                            <button onClick={() => removeTenant(selectedRoom.id)} className="btn" style={{ flex: 1, background: '#F43F5E', color: 'white', border: 'none' }}>ยืนยันย้ายออก</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Components */}
            <div style={{ overflow: 'hidden', height: 0, width: 0, position: 'absolute', top: '-10000px', left: '-10000px' }}>
                <ContractDocument
                    ref={contractRef}
                    settings={settings}
                    room={printData.room}
                    tenant={printData.tenant}
                    startDate={printData.tenant?.contractStartDate}
                    endDate={printData.tenant?.contractEndDate}
                    deposit={printData.tenant?.depositAmount}
                />
                <MoveOutNoticeDocument
                    ref={moveOutRef}
                    settings={settings}
                    room={printData.room}
                    tenant={printData.tenant}
                    moveOutDate={new Date()}
                    refundAmount={
                        (parseFloat(printData.tenant?.depositAmount || 0)) -
                        (printData.room?.invoices?.filter(inv => inv.status !== 'PAID').reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0) || 0) -
                        moveOutData.cleaningFee -
                        moveOutData.damagesFee
                    }
                    deductions={[
                        ...printData.room?.invoices?.filter(inv => inv.status !== 'PAID').map(inv => ({ note: `ค้างชำระเดือน ${new Date(inv.billingMonth).toLocaleDateString('th-TH', { month: 'long' })}`, amount: inv.totalAmount })) || [],
                        moveOutData.cleaningFee > 0 && { note: 'ค่าทำความสะอาด', amount: moveOutData.cleaningFee },
                        moveOutData.damagesFee > 0 && { note: 'ค่าเสียหาย', amount: moveOutData.damagesFee }
                    ].filter(Boolean)}
                />
            </div>
        </div>
    );
};

export default RoomManagement;
