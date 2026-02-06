import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
    const [settings, setSettings] = useState({
        dormName: '',
        address: '',
        waterRate: '',
        electricRate: '',
        promptPayID: '',
        promptPayName: '',
        promptPayName: '',
        lineNotifyToken: '',
        dormRules: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setSettings({
                dormName: response.data.dormName || '',
                address: response.data.address || '',
                waterRate: response.data.waterRate || '',
                electricRate: response.data.electricRate || '',
                promptPayID: response.data.promptPayID || '',
                promptPayName: response.data.promptPayName || '',
                promptPayName: response.data.promptPayName || '',
                lineNotifyToken: response.data.lineNotifyToken || '',
                dormRules: response.data.dormRules || ''
            });
        } catch (error) {
            toast.error('ไม่สามารถโหลดการตั้งค่าได้');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/settings', settings);
            toast.success('บันทึกการตั้งค่าสำเร็จ');
        } catch (error) {
            toast.error('ไม่สามารถบันทึกการตั้งค่าได้');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        </div>
    );

    return (
        <div className="animate-enter" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', background: 'var(--text-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Settings
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                    ตั้งค่าข้อมูลหอพักและระบบการเงิน
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* General Info */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        🏨 ข้อมูลทั่วไป
                    </h2>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ชื่อหอพัก</label>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="เช่น หอพักสุขสันต์"
                                value={settings.dormName}
                                onChange={(e) => setSettings({ ...settings, dormName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ที่อยู่</label>
                            <textarea
                                className="glass-input"
                                placeholder="ที่อยู่หอพัก..."
                                rows={3}
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Rates */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        📊 อัตราค่าน้ำ-ค่าไฟ
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--info)' }}>💧 ค่าน้ำ (บาท/หน่วย)</label>
                            <input
                                type="number"
                                className="glass-input"
                                placeholder="18"
                                value={settings.waterRate}
                                onChange={(e) => setSettings({ ...settings, waterRate: e.target.value })}
                                style={{ fontSize: '1.1rem', fontWeight: 600 }}
                            />
                        </div>
                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--warning)' }}>⚡ ค่าไฟ (บาท/หน่วย)</label>
                            <input
                                type="number"
                                className="glass-input"
                                placeholder="8"
                                value={settings.electricRate}
                                onChange={(e) => setSettings({ ...settings, electricRate: e.target.value })}
                                style={{ fontSize: '1.1rem', fontWeight: 600 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Payment */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        💳 ตั้งค่ารับเงิน (PromptPay)
                    </h2>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>เบอร์โทรศัพท์ / เลขบัตรประชาชน</label>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="08x-xxx-xxxx"
                                value={settings.promptPayID}
                                onChange={(e) => setSettings({ ...settings, promptPayID: e.target.value })}
                                style={{ fontSize: '1.1rem', fontFamily: 'monospace' }}
                            />
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                * ระบบจะนำเลขนี้ไปสร้าง QR Code ให้ผู้เช่าสแกนจ่ายเงินอัตโนมัติ
                            </p>
                        </div>
                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ชื่อบัญชี</label>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="ชื่อ-นามสกุล เจ้าของบัญชี"
                                value={settings.promptPayName}
                                onChange={(e) => setSettings({ ...settings, promptPayName: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        🔔 การแจ้งเตือน (LINE Notify)
                    </h2>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>LINE Notify Token</label>
                            <input
                                type="password"
                                className="glass-input"
                                placeholder="วาง Token ที่ได้จาก https://notify-bot.line.me/"
                                value={settings.lineNotifyToken || ''}
                                onChange={(e) => setSettings({ ...settings, lineNotifyToken: e.target.value })}
                            />
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                * จะมีการแจ้งเตือนเมื่อมีบิลใหม่, แจ้งซ่อม หรือส่งสลิปโอนเงิน
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rules & Contract */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        📜 กฎระเบียบและสัญญา
                    </h2>
                    <div>
                        <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>กฎระเบียบหอพัก</label>
                        <textarea
                            className="glass-input"
                            placeholder="ใส่กฎระเบียบที่ต้องการให้แสดงในสัญญาเช่า (ขึ้นบรรทัดใหม่ได้)..."
                            rows={8}
                            value={settings.dormRules || ''}
                            onChange={(e) => setSettings({ ...settings, dormRules: e.target.value })}
                            style={{ lineHeight: '1.6' }}
                        />
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            * ข้อความนี้จะถูกนำไปแสดงในส่วน "กฎระเบียบ" ของใบสัญญาเช่า
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                        style={{ padding: '1rem 3rem', fontSize: '1.1rem', boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)' }}
                    >
                        {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default Settings;
