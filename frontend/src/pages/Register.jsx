import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('รหัสผ่านไม่ตรงกัน');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...userData } = formData;
            await register(userData);
            toast.success('🎉 ลงทะเบียนสำเร็จ! ยินดีต้อนรับสู่ครอบครัวใหม่');
            navigate('/tenant');
        } catch (error) {
            toast.error(error.response?.data?.error || 'ลงทะเบียนไม่สำเร็จ ลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout-split">
            {/* Left Side: Brand & Atmosphere */}
            <div className="auth-brand-side">
                <div className="brand-pattern"></div>
                <div className="brand-image-overlay"></div>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'white' }}>
                        Join the <br />
                        <span style={{ color: 'var(--accent)' }}>Modern Living</span>.
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.8, maxWidth: '400px' }}>
                        Experience dormitory management focused on comfort, speed, and transparency.
                    </p>
                </div>
            </div>

            {/* Right Side: Action */}
            <div className="auth-form-side">
                <div style={{ width: '100%', maxWidth: '480px' }}>
                    <div className="animate-enter">
                        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: 500 }}>
                            ← กลับไปหน้าเข้าสู่ระบบ
                        </Link>

                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
                            เริ่มต้นใช้งานระบบหอพักออนไลน์ง่ายๆ เพียงไม่กี่ขั้นตอน
                        </p>

                        <form onSubmit={handleSubmit} autoComplete="off">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <label className="form-label" htmlFor="firstName" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>ชื่อจริง</label>
                                    <input
                                        id="firstName"
                                        type="text"
                                        name="firstName"
                                        className="glass-input"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        autoComplete="given-name"
                                    />
                                </div>
                                <div>
                                    <label className="form-label" htmlFor="lastName" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>นามสกุล</label>
                                    <input
                                        id="lastName"
                                        type="text"
                                        name="lastName"
                                        className="glass-input"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        autoComplete="family-name"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label className="form-label" htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>อีเมล</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    className="glass-input"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label className="form-label" htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>เบอร์โทรศัพท์ (ถ้ามี)</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    className="glass-input"
                                    placeholder="08X-XXX-XXXX"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    autoComplete="tel"
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label className="form-label" htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>รหัสผ่าน</label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    className="glass-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <label className="form-label" htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>ยืนยันรหัสผ่าน</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    name="confirmPassword"
                                    className="glass-input"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{ width: '100%', padding: '1.1rem' }}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        กำลังสร้างบัญชี...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                มีบัญชีผู้ใช้แล้ว?
                                <Link to="/login" style={{ color: 'var(--primary)', marginLeft: '0.5rem', fontWeight: 600, textDecoration: 'none' }}>
                                    เข้าสู่ระบบเลย
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
