// ============================================================
// pages/admin/Dashboard.jsx — Real-time attendance overview
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sessionApi, employeeApi } from '../../services/api';
import { getSocket } from '../../services/socket';
import toast from 'react-hot-toast';
import InviteModal from '../../components/InviteModal';

const AUDIT_ICONS = {
  CHECK_IN:          '✅',
  CHECK_OUT:         '🔴',
  EMPLOYEE_INVITED:  '📧',
  EMPLOYEE_REMOVED:  '🗑️',
  SETTINGS_UPDATED:  '⚙️',
  LOGIN:             '🔑',
  REPORT_EXPORTED:   '📊',
};

const locationBadge = (loc) => {
  if (!loc) return null;
  const map = { OFFICE: 'office', WFH: 'wfh', OTHER: 'office', active: 'checked-in' };
  const labels = { OFFICE: 'Office', WFH: 'WFH', OTHER: 'Other', active: 'Active' };
  return <span className={`badge ${map[loc] || 'office'}`}><span className="badge-dot" style={{ background: 'currentColor' }} />{labels[loc] || loc}</span>;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats,     setStats]     = useState(null);
  const [employees, setEmployees] = useState([]);
  const [feed,      setFeed]      = useState([]);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');
  const [loading,   setLoading]   = useState(true);
  const [showInvite,setShowInvite]= useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, empRes] = await Promise.all([
        sessionApi.todayStats(),
        employeeApi.list({ limit: 50, status: 'active' }),
      ]);
      setStats(statsRes.data.stats);
      setEmployees(empRes.data.employees);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Real-time socket events ──────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    const handleCheckIn = (payload) => {
      const msg = `${payload.employee.firstName} ${payload.employee.lastName} checked in from ${payload.location}`;
      setFeed((prev) => [{ icon: '✅', text: msg, time: 'Just now' }, ...prev].slice(0, 10));
      toast.success(msg, { icon: '✅' });
      loadData(); // refresh stats
    };

    const handleCheckOut = (payload) => {
      const mins = payload.durationMins || 0;
      const hrs  = Math.floor(mins / 60);
      const min  = mins % 60;
      const dur  = hrs > 0 ? `${hrs}h ${String(min).padStart(2,'0')}m` : `${min}m`;
      const msg  = `${payload.employee.firstName} checked out after ${dur}`;
      setFeed((prev) => [{ icon: '🔴', text: msg, time: 'Just now' }, ...prev].slice(0, 10));
      loadData();
    };

    socket.on('session:checkin',  handleCheckIn);
    socket.on('session:checkout', handleCheckOut);

    return () => {
      socket.off('session:checkin',  handleCheckIn);
      socket.off('session:checkout', handleCheckOut);
    };
  }, [loadData]);

  // ── Filtered employees ───────────────────────────────────
  const filtered = employees.filter((emp) => {
    const q  = search.toLowerCase();
    const nm = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchSearch = !q || nm.includes(q) || emp.jobTitle?.toLowerCase().includes(q);
    const matchFilter =
      filter === 'all'  ? true :
      filter === 'in'   ? emp.todayStatus === 'active' :
      filter === 'wfh'  ? emp.todayStatus === 'wfh' :
      filter === 'out'  ? emp.todayStatus === 'absent' : true;
    return matchSearch && matchFilter;
  });

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton" style={{ height: 32, width: 280, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 400 }} />
        </div>
        <div className="stats-grid">
          {[0,1,2,3].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ height: 60, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">
              Good morning, {user?.employee?.firstName || 'Admin'} 👋
            </h1>
            <p className="page-subtitle">
              Here's what's happening at {user?.company?.name} today · {today}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="realtime-indicator">
              <div className="pulse-ring" />
              LIVE
            </div>
            <button className="mini-btn primary" onClick={() => setShowInvite(true)}>
              + Invite Employee
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card amber">
          <div className="stat-card-glow" />
          <div className="stat-header">
            <span className="stat-label">Checked In Today</span>
            <div className="stat-icon amber">✅</div>
          </div>
          <div className="stat-value">{stats?.checkedIn ?? '–'}</div>
          <span className="stat-change up">↑ of {stats?.totalEmployees} total</span>
        </div>

        <div className="stat-card cyan" style={{ animationDelay: '0.1s' }}>
          <div className="stat-card-glow" />
          <div className="stat-header">
            <span className="stat-label">Work From Home</span>
            <div className="stat-icon cyan">🏠</div>
          </div>
          <div className="stat-value">{stats?.wfh ?? '–'}</div>
          <span className="stat-change neutral">→ Of checked-in</span>
        </div>

        <div className="stat-card green" style={{ animationDelay: '0.15s' }}>
          <div className="stat-card-glow" />
          <div className="stat-header">
            <span className="stat-label">Avg Hours Today</span>
            <div className="stat-icon green">⏱️</div>
          </div>
          <div className="stat-value">{stats?.avgHours ?? '–'}h</div>
          <span className="stat-change up">↑ Active sessions</span>
        </div>

        <div className="stat-card red" style={{ animationDelay: '0.2s' }}>
          <div className="stat-card-glow" />
          <div className="stat-header">
            <span className="stat-label">Not Checked In</span>
            <div className="stat-icon red">⚠️</div>
          </div>
          <div className="stat-value">{stats?.absent ?? '–'}</div>
          <span className="stat-change down">↓ vs yesterday</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">
        {/* Left: Employee Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="filter-bar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {['all','in','wfh','out'].map((f) => (
              <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'in' ? 'Checked In' : f === 'wfh' ? 'WFH' : 'Absent'}
              </button>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Live Employee Status</div>
                <div className="card-subtitle">Real-time updates via Socket.io</div>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Check In</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-tertiary)' }}>
                        No employees found
                      </td>
                    </tr>
                  ) : filtered.map((emp) => {
                    const initials = `${emp.firstName[0]}${emp.lastName[0]}`;
                    const isActive = emp.todayStatus === 'active';
                    const isWFH    = emp.todayStatus === 'wfh';
                    const isOffice = emp.todayStatus === 'office';
                    const checkInTime = emp.todaySession?.checkIn
                      ? new Date(emp.todaySession.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '–';

                    return (
                      <tr key={emp.id}>
                        <td>
                          <div className="employee-cell">
                            <div className="mini-avatar" style={{ background: `linear-gradient(135deg, ${emp.avatarColor}, ${emp.avatarColor}88)` }}>
                              {initials}
                            </div>
                            <div>
                              <div className="emp-name">{emp.firstName} {emp.lastName}</div>
                              <div className="emp-role">{emp.jobTitle}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {isActive || isWFH || isOffice ? (
                            <span className="badge checked-in"><span className="badge-dot" style={{ background: 'var(--green)' }} />Active</span>
                          ) : (
                            <span className="badge absent"><span className="badge-dot" style={{ background: 'var(--red)' }} />Absent</span>
                          )}
                        </td>
                        <td>{locationBadge(emp.todaySession?.location)}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{checkInTime}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{emp.department || '–'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Activity Feed */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Live Activity Feed</div>
              <div className="live-dot" />
            </div>
            <div>
              {feed.length === 0 ? (
                <div style={{ padding: '24px 20px', color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center' }}>
                  Activity will appear here as employees check in/out
                </div>
              ) : feed.map((item, i) => (
                <div key={i} className="audit-item">
                  <span className="audit-icon">{item.icon}</span>
                  <div>
                    <div className="audit-text">{item.text}</div>
                    <div className="audit-time">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats mini card */}
          {stats && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header">
                <div className="card-title">Today's Breakdown</div>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'In Office',    value: stats.office, color: 'var(--accent)' },
                  { label: 'Work From Home', value: stats.wfh,  color: 'var(--accent-2)' },
                  { label: 'Not In Yet',   value: stats.absent, color: 'var(--red)' },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.value}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${stats.totalEmployees ? Math.round(row.value / stats.totalEmployees * 100) : 0}%`,
                        background: row.color,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}
