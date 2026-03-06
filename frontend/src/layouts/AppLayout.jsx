import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = {
  admin: [
    { label: 'Overview',    to: '/admin/dashboard', icon: '📊' },
    { label: 'Employees',   to: '/admin/employees', icon: '👥' },
    { label: 'Sessions',    to: '/admin/sessions',  icon: '🕐' },
    { label: 'Reports',     to: '/admin/reports',   icon: '📈' },
    { label: 'Audit Log',   to: '/admin/audit',     icon: '📋' },
    { label: 'Settings',    to: '/admin/settings',  icon: '⚙️' },
  ],
  employee: [
    { label: 'Dashboard',    to: '/employee/dashboard', icon: '🏠' },
    { label: 'My Sessions',  to: '/employee/sessions',  icon: '🕐' },
    { label: 'Check In/Out', to: '/employee/checkin',   icon: '⚡' },
  ],
  super: [
    { label: 'Companies',      to: '/super/companies', icon: '🏢' },
    { label: 'Platform Stats', to: '/super/dashboard', icon: '📊' },
    { label: 'All Users',      to: '/super/users',     icon: '👤' },
  ],
};

const DASHBOARD = {
  admin:    '/admin/dashboard',
  employee: '/employee/dashboard',
  super:    '/super/companies',
};

export default function AppLayout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = NAV[role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Logo click → go to dashboard for current role
  const handleLogoClick = () => {
    navigate(DASHBOARD[role] || '/');
  };

  const initials = user?.employee
    ? `${user.employee.firstName[0]}${user.employee.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || '?';

  const displayName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user?.email;

  const planLabel = user?.company?.plan || 'FREE';

  return (
    <div className="app-shell">
      {/* ── Topbar ─────────────────────────────────────── */}
      <header className="topbar">
        <div
          className="logo"
          onClick={handleLogoClick}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title="Go to Dashboard"
        >
          <div className="logo-icon">⚡</div>
          AttendFlow
        </div>

        {user?.company && (
          <div className="topbar-pill">
            🏢 {user.company.name}
          </div>
        )}

        <div className="topbar-pill">
          <div className="live-dot" />
          Live
        </div>

        <div
          className="avatar"
          title={`${displayName} — Click to logout`}
          onClick={handleLogout}
          style={{ background: user?.employee?.avatarColor
            ? `linear-gradient(135deg, ${user.employee.avatarColor}, ${user.employee.avatarColor}aa)`
            : undefined }}
        >
          {initials}
        </div>
      </header>

      {/* ── Sidebar ────────────────────────────────────── */}
      <aside className="sidebar">
        {role === 'super' && (
          <div className="sidebar-section">Platform</div>
        )}

        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-footer">
          {user?.company ? (
            <div className="plan-badge" onClick={() => toast('Upgrade at billing settings', { icon: '⭐' })}>
              <div>
                <div className="plan-name">{planLabel} Plan</div>
                <div className="plan-sub">{user.company.name}</div>
              </div>
              <span style={{ color: 'var(--accent)', fontSize: 12 }}>↗</span>
            </div>
          ) : (
            <div className="plan-badge">
              <div>
                <div className="plan-name">Super Admin</div>
                <div className="plan-sub">AttendFlow Platform</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────── */}
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
