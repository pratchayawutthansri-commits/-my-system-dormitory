import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await login(email, password);
            toast.success('ยินดีต้อนรับกลับมาครับ! 👋');
            navigate(data.user.role === 'ADMIN' ? '/admin' : '/tenant');
        } catch (error) {
            console.error('Login Error:', error);
            const errorMessage = error.response?.data?.error
                || error.message
                || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
            toast.error(`เข้าสู่ระบบไม่สำเร็จ: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout-split">
            {/* Left Side: Brand Imagery */}
            <div className="auth-brand-side">
                <div className="brand-pattern"></div>
                <div className="brand-image-overlay" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80)' }}></div>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'white' }}>
                        Welcome <br />
                        <span style={{ color: 'var(--accent)' }}>Back.</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.8, maxWidth: '400px' }}>
                        Manage your dormitory life with ease. Check bills, report issues, and stay updated.
                    </p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="auth-form-side">
                <div style={{ width: '100%', maxWidth: '420px' }}>
                    <div className="animate-enter">
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>เข้าสู่ระบบ</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
                            เข้าสู่ระบบเพื่อจัดการข้อมูลของคุณ
                        </p>

                        <form onSubmit={handleSubmit} autoComplete="off">
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label" htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>อีเมล</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="glass-input"
                                    placeholder="admin@dormitory.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label" htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>รหัสผ่าน</label>
                                <input
                                    id="password"
                                    type="password"
                                    className="glass-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>

                            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        style={{
                                            width: '1rem',
                                            height: '1rem',
                                            accentColor: 'var(--primary)',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <label htmlFor="remember" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>จดจำฉันไว้ในระบบ</label>
                                </div>
                                <a href="#" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>ลืมรหัสผ่าน?</a>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{ width: '100%', padding: '1.1rem', fontSize: '1.05rem' }}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '0.5rem' }}>
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        กำลังเข้าสู่ระบบ...
                                    </>
                                ) : (
                                    'เข้าสู่ระบบ'
                                )}
                            </button>

                        </form>

                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    ยังไม่มีบัญชีผู้ใช้?
                                    <Link to="/register" style={{ color: 'var(--primary)', marginLeft: '0.5rem', fontWeight: 600, textDecoration: 'none' }}>
                                        สมัครสมาชิกใหม่
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
