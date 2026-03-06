// ============================================================
// pages/superadmin/Dashboard.jsx — Platform-wide stats
// ============================================================

import { useState, useEffect } from 'react';
import { superAdminApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function SuperDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminApi.stats()
      .then(({ data }) => setStats(data.stats))
      .catch(() => toast.error('Failed to load platform stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton" style={{ height: 32, width: 300, marginBottom: 8 }} />
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

  const planColors = { FREE: 'var(--text-tertiary)', PRO: 'var(--accent)', ENTERPRISE: '#a78bfa' };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Platform Overview</h1>
            <p className="page-subtitle">
              {stats?.totalCompanies} companies · {stats?.totalUsers?.toLocaleString()} active users · ${stats?.mrr?.toLocaleString()}/mo MRR
            </p>
          </div>
          <div className="realtime-indicator">
            <div className="pulse-ring" />
            All systems operational
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card amber">
          <div className="stat-card-glow" />
          <div className="stat-header"><span className="stat-label">Total Companies</span><div className="stat-icon amber">🏢</div></div>
          <div className="stat-value">{stats?.totalCompanies ?? '–'}</div>
          <span className="stat-change up">↑ Growing</span>
        </div>

        <div className="stat-card green">
          <div className="stat-card-glow" />
          <div className="stat-header"><span className="stat-label">MRR</span><div className="stat-icon green">💰</div></div>
          <div className="stat-value">${stats?.mrr ? (stats.mrr / 1000).toFixed(1) + 'k' : '–'}</div>
          <span className="stat-change up">↑ Monthly revenue</span>
        </div>

        <div className="stat-card cyan">
          <div className="stat-card-glow" />
          <div className="stat-header"><span className="stat-label">Active Users</span><div className="stat-icon cyan">👥</div></div>
          <div className="stat-value">
            {stats?.totalUsers ? (stats.totalUsers > 999 ? (stats.totalUsers / 1000).toFixed(1) + 'k' : stats.totalUsers) : '–'}
          </div>
          <span className="stat-change up">↑ All time</span>
        </div>

        <div className="stat-card red">
          <div className="stat-card-glow" />
          <div className="stat-header"><span className="stat-label">Total Sessions</span><div className="stat-icon red">📊</div></div>
          <div className="stat-value">
            {stats?.totalSessions ? (stats.totalSessions > 999 ? (stats.totalSessions / 1000).toFixed(1) + 'k' : stats.totalSessions) : '–'}
          </div>
          <span className="stat-change up">↑ All time</span>
        </div>
      </div>

      {/* Plan breakdown */}
      {stats?.planBreakdown && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="card-header">
            <div className="card-title">Plan Distribution</div>
          </div>
          <div style={{ padding: 20 }}>
            {Object.entries(stats.planBreakdown).map(([plan, count]) => {
              const total = stats.totalCompanies || 1;
              const pct   = Math.round((count / total) * 100);
              return (
                <div key={plan} style={{ marginBottom: 16 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${plan.toLowerCase()}`}>{plan}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: planColors[plan] || 'var(--text-primary)' }}>
                      {count} companies · {pct}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: planColors[plan] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
