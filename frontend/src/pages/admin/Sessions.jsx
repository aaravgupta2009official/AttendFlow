// ============================================================
// pages/admin/Sessions.jsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { sessionApi } from '../../services/api';
import toast from 'react-hot-toast';

function formatDuration(mins) {
  if (!mins) return 'Active';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2,'0')}m` : `${m}m`;
}

export default function SessionsPage() {
  const [sessions,   setSessions]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [from,       setFrom]       = useState(() => { const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().slice(0,10); });
  const [to,         setTo]         = useState(() => new Date().toISOString().slice(0,10));
  const [location,   setLocation]   = useState('all');
  const [status,     setStatus]     = useState('all');
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await sessionApi.list({ from, to, location, status, page, limit: 25 });
      setSessions(data.sessions);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [from, to, location, status, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sessions</h1>
        <p className="page-subtitle">{pagination.total} sessions in selected range</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input type="date" className="form-input" style={{ width: 'auto' }} value={from} onChange={(e) => setFrom(e.target.value)} />
        <span style={{ color: 'var(--text-tertiary)' }}>to</span>
        <input type="date" className="form-input" style={{ width: 'auto' }} value={to} onChange={(e) => setTo(e.target.value)} />

        <select className="filter-btn" style={{ cursor: 'pointer' }} value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="all">All Locations</option>
          <option value="OFFICE">Office</option>
          <option value="WFH">WFH</option>
          <option value="OTHER">Other</option>
        </select>

        <select className="filter-btn" style={{ cursor: 'pointer' }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Sessions</option>
          <option value="open">Active (Open)</option>
          <option value="closed">Completed</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Duration</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0,1,2,3,4].map((i) => (
                  <tr key={i}>{[0,1,2,3,4,5].map((j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14 }} /></td>
                  ))}</tr>
                ))
              ) : sessions.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-tertiary)' }}>No sessions found</td></tr>
              ) : sessions.map((s) => {
                const checkIn  = new Date(s.checkIn);
                const initials = s.employee ? `${s.employee.firstName[0]}${s.employee.lastName[0]}` : '?';
                const locCls   = { OFFICE: 'office', WFH: 'wfh', OTHER: 'office' }[s.location] || 'office';

                return (
                  <tr key={s.id}>
                    <td>
                      <div className="employee-cell">
                        <div className="mini-avatar" style={{ background: `linear-gradient(135deg, ${s.employee?.avatarColor || '#f59e0b'}, ${s.employee?.avatarColor || '#f59e0b'}88)` }}>
                          {initials}
                        </div>
                        <div>
                          <div className="emp-name">{s.employee?.firstName} {s.employee?.lastName}</div>
                          <div className="emp-role">{s.employee?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {s.checkOut ? new Date(s.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : (
                        <span className="badge checked-in" style={{ fontSize: 11 }}>Active</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: s.durationMins ? 'var(--text-primary)' : 'var(--green)' }}>
                      {formatDuration(s.durationMins)}
                    </td>
                    <td><span className={`badge ${locCls}`}>{s.location}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Page {page} of {pagination.pages}</span>
            <button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={page === pagination.pages}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
