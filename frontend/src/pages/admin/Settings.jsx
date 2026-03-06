// ============================================================
// pages/admin/Settings.jsx
// ============================================================

import { useState, useEffect } from 'react';
import { companyApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [form,    setForm]    = useState({ name: '', timezone: 'UTC', workdayHours: 8 });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    Promise.all([companyApi.get(), companyApi.getInvites()])
      .then(([compRes, invRes]) => {
        const c = compRes.data.company;
        setForm({ name: c.name, timezone: c.timezone, workdayHours: c.workdayHours });
        setInvites(invRes.data.invites);
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await companyApi.update(form);
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const revokeInvite = async (id) => {
    try {
      await companyApi.revokeInvite(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      toast.success('Invite revoked');
    } catch {
      toast.error('Failed to revoke invite');
    }
  };

  if (loading) return <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your company configuration</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Company settings */}
        <div className="card" style={{ overflow: 'visible' }}>
          <div className="card-header"><div className="card-title">Company Settings</div></div>
          <form onSubmit={handleSave} style={{ padding: 20 }}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-input form-select" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}>
                {['UTC','America/New_York','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo','Asia/Dubai','Australia/Sydney'].map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Workday Target (hours)</label>
              <input type="number" className="form-input" min={1} max={24} value={form.workdayHours} onChange={(e) => setForm((p) => ({ ...p, workdayHours: parseInt(e.target.value) }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Plan info */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title">Current Plan</div></div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span className={`badge ${(user?.company?.plan || 'FREE').toLowerCase()}`} style={{ fontSize: 14, padding: '6px 14px' }}>
                  {user?.company?.plan || 'FREE'}
                </span>
              </div>
              <button className="btn btn-primary" onClick={() => toast('Contact us to upgrade!', { icon: '⭐' })}>
                ⭐ Upgrade Plan
              </button>
            </div>
          </div>

          {/* Pending invites */}
          <div className="card">
            <div className="card-header"><div className="card-title">Pending Invites</div></div>
            {invites.filter((i) => !i.usedAt).length === 0 ? (
              <div style={{ padding: '24px 20px', color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center' }}>No pending invites</div>
            ) : invites.filter((i) => !i.usedAt).map((inv) => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{inv.email}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}</div>
                </div>
                <button className="mini-btn" style={{ color: 'var(--red)' }} onClick={() => revokeInvite(inv.id)}>Revoke</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
