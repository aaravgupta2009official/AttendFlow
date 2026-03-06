import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import LandingPage   from './pages/LandingPage';
import LoginPage     from './pages/auth/LoginPage';
import RegisterPage  from './pages/auth/RegisterPage';
import AcceptInvite  from './pages/auth/AcceptInvite';
import AppLayout     from './layouts/AppLayout';

import AdminDashboard    from './pages/admin/Dashboard';
import EmployeesPage     from './pages/admin/Employees';
import SessionsPage      from './pages/admin/Sessions';
import ReportsPage       from './pages/admin/Reports';
import AuditPage         from './pages/admin/AuditLog';
import SettingsPage      from './pages/admin/Settings';

import EmployeeDashboard from './pages/employee/Dashboard';
import MySessionsPage    from './pages/employee/MySessions';
import CheckInPage       from './pages/employee/CheckIn';

import SuperDashboard    from './pages/superadmin/Dashboard';
import CompaniesPage     from './pages/superadmin/Companies';
import AllUsersPage      from './pages/superadmin/AllUsers';

// Redirects logged-in users to their dashboard, else shows the page
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0b' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'SUPER_ADMIN') return <Navigate to="/super/companies" replace />;
    if (user.role === 'ADMIN')       return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/employee/dashboard" replace />;
  }
  return children;
}

// Redirects logged-in users away from public pages to their dashboard
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === 'SUPER_ADMIN') return <Navigate to="/super/companies" replace />;
    if (user.role === 'ADMIN')       return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/employee/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <>
      <div className="bg-mesh" />
      <Routes>
        {/* ── Landing page ── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── Auth routes ── */}
        <Route path="/login"         element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register"      element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/accept-invite" element={<AcceptInvite />} />

        {/* ── Admin routes ── */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout role="admin" /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="sessions"  element={<SessionsPage />} />
          <Route path="reports"   element={<ReportsPage />} />
          <Route path="audit"     element={<AuditPage />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>

        {/* ── Employee routes ── */}
        <Route path="/employee" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><AppLayout role="employee" /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="sessions"  element={<MySessionsPage />} />
          <Route path="checkin"   element={<CheckInPage />} />
        </Route>

        {/* ── Super Admin routes ── */}
        <Route path="/super" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AppLayout role="super" /></ProtectedRoute>}>
          <Route index element={<Navigate to="companies" replace />} />
          <Route path="dashboard" element={<SuperDashboard />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="users"     element={<AllUsersPage />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
