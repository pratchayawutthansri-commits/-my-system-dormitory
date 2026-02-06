import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/admin/Dashboard';
import RoomManagement from './pages/admin/RoomManagement';
import Billing from './pages/admin/Billing';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import MaintenanceManagement from './pages/admin/MaintenanceManagement';
import Announcements from './pages/admin/Announcements';
import Expenses from './pages/admin/Expenses';
import TenantDashboard from './pages/tenant/TenantDashboard';

// Components
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-container">
                <div className="text-center">กำลังโหลด...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (adminOnly && user.role !== 'ADMIN') {
        return <Navigate to="/tenant" />;
    }

    return children;
};

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-container">
                <div className="text-center">กำลังโหลด...</div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/tenant'} /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/tenant'} /> : <Register />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="rooms" element={<RoomManagement />} />
                <Route path="billing" element={<Billing />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="maintenance" element={<MaintenanceManagement />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="expenses" element={<Expenses />} />
            </Route>

            {/* Tenant Routes */}
            <Route path="/tenant" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<TenantDashboard />} />
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

export default App;
