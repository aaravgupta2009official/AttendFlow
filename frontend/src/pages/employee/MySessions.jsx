// ============================================================
// pages/employee/MySessions.jsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { sessionApi } from '../../services/api';
import toast from 'react-hot-toast';

function formatDuration(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

const LOC_LABELS = { OFFICE: { label: 'Office', cls: 'office', icon: '🏢' }, WFH: { label: 'WFH', cls: 'wfh', icon: '🏠' }, OTHER: { label: 'Other', cls: 'office', icon: '📍' } };

export default function MySessionsPage() {
  const [sessions,   setSessions]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await sessionApi.list({ page, limit: 20 });
      setSessions(data.sessions);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  // Group sessions by date
  const grouped = sessions.reduce((acc, s) => {
    const key = new Date(s.checkIn).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Sessions</h1>
        <p className="page-subtitle">{pagination.total} total sessions recorded</p>
      </div>

      <div style={{ maxWidth: 720 }}>
        {loading ? (
          <div className="card">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '40%' }} />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🕐</div>
              <h3>No sessions yet</h3>
              <p>Your sessions will appear here after you check in.</p>
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([date, daySessions]) => {
            const dayMins = daySessions.reduce((s, x) => s + (x.durationMins || 0), 0);
            return (
              <div key={date} style={{ marginBottom: 20 }}>
                {/* Date header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {date}
                  </span>
                  {dayMins > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                      {formatDuration(dayMins)} total
                    </span>
                  )}
                </div>

                <div className="card">
                  {daySessions.map((s, idx) => {
                    const loc     = LOC_LABELS[s.location] || LOC_LABELS.OFFICE;
                    const isOpen  = !s.checkOut;
                    const checkIn = new Date(s.checkIn);
                    const checkOut = s.checkOut ? new Date(s.checkOut) : null;

                    return (
                      <div key={s.id} style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '16px 20px',
                        borderBottom: idx < daySessions.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        {/* Timeline dot */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 12 }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: isOpen ? 'var(--green)' : 'var(--accent)',
                            boxShadow: isOpen ? '0 0 8px var(--green)' : 'none',
                          }} />
                        </div>

                        {/* Times */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            {' → '}
                            {checkOut
                              ? checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                              : <span style={{ color: 'var(--green)' }}>Active</span>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>
                            {loc.icon} {loc.label}
                            {s.durationMins ? ` · ${formatDuration(s.durationMins)}` : ''}
                          </div>
                        </div>

                        {/* Status badge */}
                        <span className={`badge ${isOpen ? 'checked-in' : loc.cls}`}>
                          {isOpen ? 'Active' : formatDuration(s.durationMins) || loc.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination" style={{ justifyContent: 'flex-start', padding: '12px 0' }}>
            <button className="page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹ Prev</button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '0 8px' }}>
              Page {page} of {pagination.pages}
            </span>
            <button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={page === pagination.pages}>Next ›</button>
          </div>
        )}
      </div>
    </div>
  );
}
