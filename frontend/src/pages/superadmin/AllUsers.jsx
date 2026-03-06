// ============================================================
// pages/superadmin/AllUsers.jsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { superAdminApi } from '../../services/api';
import toast from 'react-hot-toast';

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ROLE_COLORS = {
  SUPER_ADMIN: { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
  ADMIN:       { bg: 'var(--accent-dim)',     color: 'var(--accent)', border: 'rgba(245,158,11,0.2)' },
  EMPLOYEE:    { bg: 'var(--bg-elevated)',    color: 'var(--text-secondary)', border: 'var(--border)' },
};

export default function AllUsersPage() {
  const [users,      setUsers]      = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search,     setSearch]     = useState('');
  const [role,       setRole]       = useState('all');
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await superAdminApi.users({ search, role, page, limit: 25 });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, role, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, role]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">All Users</h1>
        <p className="page-subtitle">{pagination.total} total users across all companies</p>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search by email or name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {['all', 'SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'].map((r) => (
          <button key={r} className={`filter-btn${role === r ? ' active' : ''}`} onClick={() => setRole(r)}>
            {r === 'all' ? 'All' : r.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Company</th>
                <th>Plan</th>
                <th>Last Login</th>
                <th>Joined</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0,1,2,3,4].map((i) => (
                  <tr key={i}>{[0,1,2,3,4,5,6].map((j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14 }} /></td>
                  ))}</tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-tertiary)' }}>No users found</td></tr>
              ) : users.map((u) => {
                const rc = ROLE_COLORS[u.role] || ROLE_COLORS.EMPLOYEE;
                const name = u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : null;

                return (
                  <tr key={u.id}>
                    <td>
                      <div>
                        {name && <div className="emp-name">{name}</div>}
                        <div className="emp-role" style={{ color: name ? 'var(--text-tertiary)' : 'var(--text-primary)', fontSize: name ? 11 : 13 }}>
                          {u.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.company?.name || '—'}</td>
                    <td>
                      {u.company?.plan ? (
                        <span className={`badge ${u.company.plan.toLowerCase()}`}>{u.company.plan}</span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{timeAgo(u.lastLoginAt)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: u.isActive ? 'var(--green)' : 'var(--red)',
                        boxShadow: u.isActive ? '0 0 6px var(--green)' : 'none',
                      }} />
                    </td>
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
