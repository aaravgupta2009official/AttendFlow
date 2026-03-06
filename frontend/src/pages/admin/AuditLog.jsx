// ============================================================
// pages/admin/AuditLog.jsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { auditApi } from '../../services/api';
import toast from 'react-hot-toast';

const ACTION_ICONS = {
  CHECK_IN:         '✅',
  CHECK_OUT:        '🔴',
  EMPLOYEE_INVITED: '📧',
  EMPLOYEE_REMOVED: '🗑️',
  SETTINGS_UPDATED: '⚙️',
  LOGIN:            '🔑',
  LOGOUT:           '🚪',
  REPORT_EXPORTED:  '📊',
  PLAN_CHANGED:     '⭐',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AuditPage() {
  const [logs,       setLogs]       = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [action,     setAction]     = useState('all');
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await auditApi.list({ action, page, limit: 50 });
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [action, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Log</h1>
        <p className="page-subtitle">Full immutable event trail · {pagination.total} entries</p>
      </div>

      <div className="filter-bar">
        <select className="filter-btn" style={{ cursor: 'pointer' }} value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="all">All Actions</option>
          {Object.keys(ACTION_ICONS).map((a) => (
            <option key={a} value={a}>{a.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 32 }}>
            {[0,1,2,3,4].map((i) => (
              <div key={i} className="audit-item">
                <div className="skeleton" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 14, marginBottom: 6 }} /><div className="skeleton" style={{ height: 12, width: '30%' }} /></div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No audit entries</h3>
            <p>Actions will appear here as they happen.</p>
          </div>
        ) : logs.map((log) => (
          <div key={log.id} className="audit-item">
            <span className="audit-icon">{ACTION_ICONS[log.action] || '📌'}</span>
            <div style={{ flex: 1 }}>
              <div className="audit-text">
                <strong>{log.user?.email || 'System'}</strong>{' '}
                {log.action.replace(/_/g,' ').toLowerCase()}
                {log.targetType && <span style={{ color: 'var(--text-tertiary)' }}> · {log.targetType}</span>}
              </div>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {JSON.stringify(log.metadata).slice(0, 120)}
                </div>
              )}
            </div>
            <div className="audit-time">{timeAgo(log.createdAt)}</div>
          </div>
        ))}

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
