import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    LayoutDashboard,
    BedDouble,
    Receipt,
    Wrench,
    Megaphone,
    FileText,
    Wallet,
    Settings,
    LogOut,
    Menu,
    X,
    Moon,
    Sun,
    User
} from 'lucide-react';

const Layout = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const handleLogout = () => {
        logout();
        toast.success('ออกจากระบบเรียบร้อยแล้ว');
        navigate('/login');
    };

    const adminLinks = [
        { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/admin/rooms', label: 'จัดการห้องพัก', icon: <BedDouble size={20} /> },
        { path: '/admin/billing', label: 'ค่าเช่า/บิล', icon: <Receipt size={20} /> },
        { path: '/admin/maintenance', label: 'แจ้งซ่อม', icon: <Wrench size={20} /> },
        { path: '/admin/announcements', label: 'ประกาศ', icon: <Megaphone size={20} /> },
        { path: '/admin/reports', label: 'รายงาน', icon: <FileText size={20} /> },
        { path: '/admin/expenses', label: 'รายจ่าย', icon: <Wallet size={20} /> },
        { path: '/admin/settings', label: 'ตั้งค่า', icon: <Settings size={20} /> }
    ];

    const tenantLinks = [
        { path: '/tenant', label: 'หน้าหลัก', icon: <LayoutDashboard size={20} /> }
    ];

    const links = isAdmin ? adminLinks : tenantLinks;

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            maxWidth: '100vw',
            overflow: 'hidden',
            background: 'var(--bg-app)'
        }}>

            {/* Sidebar */}
            <aside style={{
                width: isSidebarOpen ? '260px' : '0',
                background: '#0f172a', // Dark Navy/Slate for Premium Look
                color: '#e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 50,
                transition: 'width 0.3s ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
            }}>
                {/* Brand */}
                <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'white' }}>DormManager</h1>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Management System</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                    {links.map((link) => {
                        // Check if active (handle exact match for root /admin)
                        const isActive = link.path === '/admin' || link.path === '/tenant'
                            ? location.pathname === link.path
                            : location.pathname.startsWith(link.path);

                        return (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.85rem 1rem',
                                    color: isActive ? 'white' : '#94a3b8',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    background: isActive ? 'var(--primary)' : 'transparent', // Indigo Primary
                                    transition: 'all 0.2s ease',
                                    fontWeight: isActive ? 600 : 500,
                                }}
                            >
                                {link.icon}
                                <span style={{ fontSize: '0.95rem' }}>{link.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User Profile (Bottom) */}
                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: '#1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '36px', height: '36px',
                            borderRadius: '50%',
                            background: '#334155',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#e2e8f0',
                            border: '2px solid #10B981'
                        }}>
                            <User size={18} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>{user?.firstName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{isAdmin ? 'Administrator' : 'Tenant'}</div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#F43F5E',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            justifyContent: 'center',
                            borderRadius: '6px',
                        }}
                        className="hover:bg-red-500/10"
                    >
                        <LogOut size={16} /> ออกจากระบบ
                    </button>

                    <button
                        onClick={toggleTheme}
                        style={{
                            marginTop: '0.5rem',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        {isDarkMode ? <Sun size={14} /> : <Moon size={14} />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                marginLeft: isSidebarOpen ? '260px' : '0',
                transition: 'margin 0.3s ease',
                minHeight: '100vh',
                position: 'relative'
            }}>
                {/* Mobile Toggle Button (Visible only when sidebar is closed or on mobile) */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 40, padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-panel)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                    >
                        <Menu size={20} />
                    </button>
                )}

                <div style={{ padding: '2rem 3rem', maxWidth: '1600px', margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
