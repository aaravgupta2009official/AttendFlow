// ============================================================
// pages/employee/CheckIn.jsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { sessionApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function CheckInPage() {
  const { user }   = useAuth();
  const [time,     setTime]     = useState(new Date());
  const [status,   setStatus]   = useState(null);
  const [location, setLocation] = useState('OFFICE');
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(false);

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
      toast.error('Failed to load status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCheckIn = async () => {
    setActing(true);
    try {
      await sessionApi.checkIn({ location });
      toast.success(`Checked in from ${location}! 🎉`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    } finally {
      setActing(false);
    }
  };

  const handleCheckOut = async () => {
    setActing(true);
    try {
      await sessionApi.checkOut({});
      toast.success('Checked out successfully! Session saved. 🔴');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-out failed');
    } finally {
      setActing(false);
    }
  };

  const isCheckedIn = status?.isCheckedIn;
  const target      = (user?.company?.workdayHours || 8) * 60;
  const doneMins    = status?.totalMinsToday || 0;
  const pct         = Math.min(Math.round((doneMins / target) * 100), 100);

  // Elapsed time for active session
  const elapsedMins = isCheckedIn && status?.openSession
    ? Math.floor((Date.now() - new Date(status.openSession.checkIn).getTime()) / 60000)
    : 0;
  const elH = Math.floor(elapsedMins / 60);
  const elM = elapsedMins % 60;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Check In / Out</h1>
        <p className="page-subtitle">Record your attendance for today</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 800 }}>

        {/* ── Check-in card ── */}
        <div className="checkin-card">
          {/* Live clock */}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            Current Time
          </div>
          <div className="time-display" style={{ marginBottom: 24 }}>
            <div className="time-value">
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="time-date">
              {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Location selector (only when not checked in) */}
          {!isCheckedIn && (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Work Location
              </div>
              <div className="location-selector">
                {[
                  { value: 'OFFICE', icon: '🏢', label: 'Office' },
                  { value: 'WFH',    icon: '🏠', label: 'WFH' },
                  { value: 'OTHER',  icon: '📍', label: 'Other' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    className={`loc-option${location === opt.value ? ' selected' : ''}`}
                    onClick={() => setLocation(opt.value)}
                  >
                    <span className="loc-emoji">{opt.icon}</span>
                    {opt.label}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Action button */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
              <div className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : !isCheckedIn ? (
            <button className="btn btn-checkin" onClick={handleCheckIn} disabled={acting}>
              {acting ? <span className="spinner" /> : '⚡ Check In Now'}
            </button>
          ) : (
            <>
              <button className="btn btn-danger" style={{ width: '100%', padding: 14, fontSize: 15 }} onClick={handleCheckOut} disabled={acting}>
                {acting ? <span className="spinner" /> : '🔴 Check Out'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
                Session started at{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {new Date(status.openSession.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </strong>
                {' · '}
                <strong style={{ color: 'var(--green)' }}>
                  {elH > 0 ? `${elH}h ` : ''}{String(elM).padStart(2, '0')}m elapsed
                </strong>
              </div>
            </>
          )}
        </div>

        {/* ── Progress card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status badge */}
          <div className="checkin-card" style={{
            borderColor: isCheckedIn ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)',
            background:  isCheckedIn ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: isCheckedIn ? 'var(--green)' : 'var(--red)',
                boxShadow:  isCheckedIn ? '0 0 8px var(--green)' : 'none',
                animation:  isCheckedIn ? 'live-pulse 2s infinite' : 'none',
              }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: isCheckedIn ? 'var(--green)' : 'var(--red)' }}>
                {isCheckedIn ? 'You are checked in' : 'Not checked in'}
              </span>
            </div>
            {isCheckedIn && status?.openSession && (
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Location: <strong style={{ color: 'var(--text-primary)' }}>{status.openSession.location}</strong>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="checkin-card">
            <div className="hour-tracker">
              <div className="hour-track-header">
                <span className="hour-label">Daily Progress</span>
                <span className="hour-value">{(doneMins / 60).toFixed(1)} / {user?.company?.workdayHours || 8}h</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                {pct >= 100
                  ? '🎉 Target reached!'
                  : `${pct}% complete`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
