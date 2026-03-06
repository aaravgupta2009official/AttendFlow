// ============================================================
// pages/admin/Reports.jsx — Attendance analytics + CSV export
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { reportApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [data,    setData]    = useState(null);
  const [from,    setFrom]    = useState(() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); });
  const [to,      setTo]      = useState(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await reportApi.attendance({ from, to });
      setData(res);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: blob } = await reportApi.exportCsv({ from, to });
      const url      = URL.createObjectURL(new Blob([blob]));
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = `attendflow-report-${from}-to-${to}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const maxTotal = data?.dailyBreakdown?.length
    ? Math.max(...data.dailyBreakdown.map((d) => d.total), 1)
    : 1;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="page-subtitle">Attendance analytics for your team</p>
          </div>
          <button className="mini-btn primary" onClick={handleExport} disabled={exporting}>
            {exporting ? <span className="spinner" /> : '⬇ Export CSV'}
          </button>
        </div>
      </div>

      {/* Date range */}
      <div className="filter-bar" style={{ marginBottom: 24 }}>
        <input type="date" className="form-input" style={{ width: 'auto' }} value={from} onChange={(e) => setFrom(e.target.value)} />
        <span style={{ color: 'var(--text-tertiary)' }}>to</span>
        <input type="date" className="form-input" style={{ width: 'auto' }} value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="mini-btn primary" onClick={load}>Apply</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
            <div className="stat-card amber">
              <div className="stat-card-glow" />
              <div className="stat-header"><span className="stat-label">Total Sessions</span><div className="stat-icon amber">📊</div></div>
              <div className="stat-value">{data?.meta?.totalSessions ?? 0}</div>
              <span className="stat-change neutral">{from} — {to}</span>
            </div>
            <div className="stat-card green">
              <div className="stat-card-glow" />
              <div className="stat-header"><span className="stat-label">Employees Tracked</span><div className="stat-icon green">👥</div></div>
              <div className="stat-value">{data?.employeeSummary?.length ?? 0}</div>
              <span className="stat-change up">Active employees</span>
            </div>
            <div className="stat-card cyan">
              <div className="stat-card-glow" />
              <div className="stat-header"><span className="stat-label">Avg Hours / Day</span><div className="stat-icon cyan">⏱️</div></div>
              <div className="stat-value">
                {data?.employeeSummary?.length
                  ? (data.employeeSummary.reduce((s, e) => s + e.avgHoursPerDay, 0) / data.employeeSummary.length).toFixed(1)
                  : '–'}h
              </div>
              <span className="stat-change up">Across all employees</span>
            </div>
          </div>

          {/* Daily attendance chart */}
          {data?.dailyBreakdown?.length > 0 && (
            <div className="card" style={{ marginBottom: 20, padding: '20px 24px' }}>
              <div className="card-title" style={{ marginBottom: 20 }}>Daily Attendance</div>
              <div className="activity-chart" style={{ height: 80, gap: 3 }}>
                {data.dailyBreakdown.map((day, i) => {
                  const height = Math.round((day.total / maxTotal) * 100);
                  const isToday = day.date === new Date().toISOString().slice(0,10);
                  return (
                    <div
                      key={day.date}
                      className={`activity-bar${isToday ? ' today' : ''}`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${day.date}: ${day.total} sessions (Office: ${day.office}, WFH: ${day.wfh})`}
                    />
                  );
                })}
              </div>
              <div className="chart-labels">
                <span>{data.dailyBreakdown[0]?.date}</span>
                <span>{data.dailyBreakdown[Math.floor(data.dailyBreakdown.length/2)]?.date}</span>
                <span>{data.dailyBreakdown[data.dailyBreakdown.length-1]?.date}</span>
              </div>
            </div>
          )}

          {/* Per-employee table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Employee Breakdown</div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Days Present</th>
                    <th>Total Sessions</th>
                    <th>Total Hours</th>
                    <th>Avg Hours / Day</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.employeeSummary || []).sort((a, b) => b.totalHours - a.totalHours).map((emp) => (
                    <tr key={emp.employeeId}>
                      <td><div className="emp-name">{emp.name}</div></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{emp.department || '–'}</td>
                      <td style={{ fontSize: 13 }}>{emp.daysPresent}</td>
                      <td style={{ fontSize: 13 }}>{emp.sessions}</td>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)' }}>{emp.totalHours}h</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{emp.avgHoursPerDay}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
