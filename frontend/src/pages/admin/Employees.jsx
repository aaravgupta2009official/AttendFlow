// ============================================================
// pages/admin/Employees.jsx — Full employee management
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { employeeApi } from '../../services/api';
import toast from 'react-hot-toast';
import InviteModal from '../../components/InviteModal';

export default function EmployeesPage() {
  const [employees,  setEmployees]  = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('active');
  const [dept,       setDept]       = useState('');
  const [depts,      setDepts]      = useState([]);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await employeeApi.list({ search, status, dept, page, limit: 20 });
      setEmployees(data.employees);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [search, status, dept, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    employeeApi.departments().then(({ data }) => setDepts(data.departments)).catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [search, status, dept]);

  const handleDeactivate = async (emp) => {
    if (!confirm(`Deactivate ${emp.firstName} ${emp.lastName}? They will lose access.`)) return;
    try {
      await employeeApi.deactivate(emp.id);
      toast.success(`${emp.firstName} deactivated`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Employees</h1>
            <p className="page-subtitle">{pagination.total} total employees</p>
          </div>
          <button className="mini-btn primary" onClick={() => setShowInvite(true)}>+ Invite Employee</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search by name, title, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {['active','inactive','all'].map((s) => (
          <button key={s} className={`filter-btn${status === s ? ' active' : ''}`} onClick={() => setStatus(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        {depts.length > 0 && (
          <select className="filter-btn" style={{ cursor: 'pointer' }} value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">All Depts</option>
            {depts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Today's Status</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0,1,2,3,4].map((i) => (
                  <tr key={i}>
                    {[0,1,2,3,4,5].map((j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-tertiary)' }}>No employees found</td></tr>
              ) : employees.map((emp) => {
                const initials = `${emp.firstName[0]}${emp.lastName[0]}`;
                const statusMap = {
                  active:  { label: 'Checked In', cls: 'checked-in' },
                  office:  { label: 'Office',     cls: 'office' },
                  wfh:     { label: 'WFH',        cls: 'wfh' },
                  absent:  { label: 'Absent',     cls: 'absent' },
                };
                const s = statusMap[emp.todayStatus] || statusMap.absent;

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
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{emp.department || '–'}</td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{emp.user?.email || '–'}</td>
                    <td><span className="badge free">{emp.user?.role || 'EMPLOYEE'}</span></td>
                    <td>
                      <button
                        className="mini-btn"
                        style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.2)' }}
                        onClick={() => handleDeactivate(emp)}
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={page === pagination.pages}>›</button>
          </div>
        )}
      </div>

      {showInvite && <InviteModal onClose={() => { setShowInvite(false); load(); }} />}
    </div>
  );
}
