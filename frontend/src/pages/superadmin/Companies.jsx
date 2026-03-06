// ============================================================
// pages/superadmin/Companies.jsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { superAdminApi } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  ACTIVE:    { bg: 'var(--green-dim)',    color: 'var(--green)',        border: 'rgba(16,185,129,0.2)' },
  TRIAL:     { bg: 'var(--accent-dim)',   color: 'var(--accent)',       border: 'rgba(245,158,11,0.2)' },
  SUSPENDED: { bg: 'var(--red-dim)',      color: 'var(--red)',          border: 'rgba(239,68,68,0.2)' },
};

const PLAN_BADGE = { FREE: 'free', PRO: 'pro', ENTERPRISE: 'enterprise' };

export default function CompaniesPage() {
  const [companies,  setCompanies]  = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search,     setSearch]     = useState('');
  const [plan,       setPlan]       = useState('all');
  const [status,     setStatus]     = useState('all');
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [updating,   setUpdating]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await superAdminApi.companies({ search, plan, status, page, limit: 20 });
      setCompanies(data.companies);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [search, plan, status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, plan, status]);

  const handleStatusChange = async (companyId, newStatus) => {
    setUpdating(companyId);
    try {
      await superAdminApi.updateCompanyStatus(companyId, newStatus);
      toast.success(`Company status updated to ${newStatus}`);
      load();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Companies</h1>
            <p className="page-subtitle">{pagination.total} total companies on the platform</p>
          </div>
          <div className="realtime-indicator" style={{ fontSize: 11, padding: '4px 10px' }}>
            <div className="pulse-ring" />
            Platform Live
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <select className="filter-btn" style={{ cursor: 'pointer' }} value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="all">All Plans</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>

        <select className="filter-btn" style={{ cursor: 'pointer' }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="TRIAL">Trial</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Employees</th>
                <th>Sessions</th>
                <th>MRR</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0,1,2,3,4].map((i) => (
                  <tr key={i}>{[0,1,2,3,4,5,6,7].map((j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14 }} /></td>
                  ))}</tr>
                ))
              ) : companies.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-tertiary)' }}>No companies found</td></tr>
              ) : companies.map((co) => {
                const sc    = STATUS_COLORS[co.status] || STATUS_COLORS.ACTIVE;
                const isUpdating = updating === co.id;

                return (
                  <tr key={co.id}>
                    <td>
                      <div>
                        <div className="emp-name">{co.name}</div>
                        <div className="emp-role">{co.slug}</div>
                      </div>
                    </td>
                    <td><span className={`badge ${PLAN_BADGE[co.plan] || 'free'}`}>{co.plan}</span></td>
                    <td>
                      <span className="badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {co.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{co._count?.employees ?? 0}</td>
                    <td style={{ fontSize: 13 }}>{co._count?.sessions ?? 0}</td>
                    <td style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--accent)' }}>
                      ${co.subscription?.priceMonthly ?? 0}/mo
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {new Date(co.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {isUpdating ? (
                        <div className="spinner" />
                      ) : (
                        <select
                          className="mini-btn"
                          style={{ cursor: 'pointer', paddingRight: 8 }}
                          value={co.status}
                          onChange={(e) => handleStatusChange(co.id, e.target.value)}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="TRIAL">Trial</option>
                          <option value="SUSPENDED">Suspend</option>
                        </select>
                      )}
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
