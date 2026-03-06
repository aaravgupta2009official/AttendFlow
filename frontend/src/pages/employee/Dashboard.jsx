// ============================================================
// pages/employee/Dashboard.jsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { sessionApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [time,    setTime]    = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await sessionApi.myStatus();
      setStatus(data);
    } catch {
      toast.error('Failed to load your status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const target   = (user?.company?.workdayHours || 8) * 60;
  const doneMins = status?.totalMinsToday || 0;
  const pct      = Math.min(Math.round((doneMins / target) * 100), 100);
  const remaining = Math.max(target - doneMins, 0);
  const remH     = Math.floor(remaining / 60);
  const remM     = remaining % 60;

  // Build this-week attendance dots (Mon–Fri)
  const weekDots = ['M','T','W','T','F'].map((label, i) => {
    const dow = i + 1; // 1=Mon … 5=Fri
    const todayDow = new Date().getDay();
    const isPast    = dow < todayDow;
    const isToday   = dow === todayDow;
    return { label, isPast, isToday };
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          Good {time.getHours() < 12 ? 'morning' : time.getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          {user?.employee?.firstName} 👋
        </h1>
        <p className="page-subtitle">
          {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* ── Left column ─────────────────────────────── */}
        <div>
          {/* Stats row */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
            <div className="stat-card amber">
              <div className="stat-card-glow" />
              <div className="stat-header">
                <span className="stat-label">Today's Hours</span>
                <div className="stat-icon amber">⏱️</div>
              </div>
              <div className="stat-value">{loading ? '–' : (doneMins / 60).toFixed(1)}h</div>
              <span className="stat-change up">of {user?.company?.workdayHours || 8}h target</span>
            </div>

            <div className="stat-card green">
              <div className="stat-card-glow" />
              <div className="stat-header">
                <span className="stat-label">Streak</span>
                <div className="stat-icon green">🔥</div>
              </div>
              <div className="stat-value">{loading ? '–' : (status?.streak ?? 0)}</div>
              <span className="stat-change up">consecutive days</span>
            </div>

            <div className="stat-card cyan">
              <div className="stat-card-glow" />
              <div className="stat-header">
                <span className="stat-label">Status</span>
                <div className="stat-icon cyan">⚡</div>
              </div>
              <div className="stat-value" style={{ fontSize: 20, lineHeight: 1.8 }}>
                {loading ? '–' : status?.isCheckedIn ? 'Active' : 'Not In'}
              </div>
              <span className={`stat-change ${status?.isCheckedIn ? 'up' : 'neutral'}`}>
                {status?.isCheckedIn ? '↑ Checked in' : '→ Not checked in'}
              </span>
            </div>
          </div>

          {/* Daily progress */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Daily Progress</div>
              <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{pct}%</span>
            </div>
            <div style={{ padding: 20 }}>
              <div className="hour-tracker">
                <div className="hour-track-header">
                  <span className="hour-label">Hours Worked</span>
                  <span className="hour-value">
                    {(doneMins / 60).toFixed(1)} / {user?.company?.workdayHours || 8}h
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                  {pct >= 100
                    ? '🎉 Daily target reached! Great work.'
                    : `Remaining: ${remH > 0 ? `${remH}h ` : ''}${String(remM).padStart(2, '0')}m to reach daily target`}
                </div>
              </div>
            </div>
          </div>

          {/* Week dots */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">This Week's Streak</div>
              {(status?.streak || 0) > 0 && (
                <span style={{ fontSize: 12, color: 'var(--green)' }}>🔥 {status.streak}-day streak!</span>
              )}
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {weekDots.map((dot, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: '100%', aspectRatio: '1', borderRadius: 8,
                      background: dot.isToday
                        ? (status?.isCheckedIn ? 'var(--green)' : 'var(--accent)')
                        : dot.isPast ? 'var(--green)' : 'var(--bg-elevated)',
                      border: '1px solid ' + (dot.isToday ? 'transparent' : 'var(--border)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14,
                      boxShadow: dot.isPast || dot.isToday ? '0 0 10px rgba(16,185,129,0.3)' : 'none',
                    }}>
                      {(dot.isPast || (dot.isToday && status?.isCheckedIn)) ? '✓' : dot.isToday ? '⚡' : ''}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{dot.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Quick actions */}
          <div className="checkin-card">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              Quick Actions
            </div>

            <Link to="/employee/checkin" className="btn btn-checkin" style={{ display: 'flex', textDecoration: 'none', marginBottom: 10 }}>
              ⚡ {status?.isCheckedIn ? 'Manage Check-In' : 'Check In Now'}
            </Link>

            <Link to="/employee/sessions" className="btn btn-secondary" style={{ display: 'flex', textDecoration: 'none', justifyContent: 'center' }}>
              📋 View My Sessions
            </Link>
          </div>

          {/* Current session info */}
          {status?.isCheckedIn && status.openSession && (
            <div className="checkin-card" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                ● Active Session
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <div>Started: <strong style={{ color: 'var(--text-primary)' }}>
                  {new Date(status.openSession.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </strong></div>
                <div>Location: <strong style={{ color: 'var(--text-primary)' }}>
                  {status.openSession.location}
                </strong></div>
              </div>
            </div>
          )}

          {/* Profile card */}
          <div className="checkin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar" style={{
                width: 48, height: 48, fontSize: 18,
                background: user?.employee?.avatarColor
                  ? `linear-gradient(135deg, ${user.employee.avatarColor}, ${user.employee.avatarColor}88)`
                  : undefined,
              }}>
                {user?.employee ? `${user.employee.firstName[0]}${user.employee.lastName[0]}` : '?'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {user?.employee?.firstName} {user?.employee?.lastName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {user?.employee?.jobTitle || user?.email}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {user?.employee?.department}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
