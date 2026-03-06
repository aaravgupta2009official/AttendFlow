// ============================================================
// pages/auth/AcceptInvite.jsx
// ============================================================

import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token    = params.get('token') || '';
  const { register: _r } = useAuth(); // We call acceptInvite via authApi directly

  const [form, setForm] = useState({ password: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [done,    setDone]    = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { authApi } = await import('../../services/api');
      const { data } = await authApi.acceptInvite({ token, ...form });
      localStorage.setItem('af_token', data.token);
      localStorage.setItem('af_user',  JSON.stringify(data.user));
      toast.success('Account created! Welcome.');
      setDone(true);
      setTimeout(() => window.location.href = '/employee/dashboard', 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept invite.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Invalid Link</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>This invite link is missing a token.</p>
          <Link to="/login" style={{ color: 'var(--accent)', fontSize: 13, marginTop: 16, display: 'inline-block' }}>← Back to login</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Account Created!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon" style={{ width: 40, height: 40, fontSize: 20 }}>⚡</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>AttendFlow</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Accept Invitation</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>Complete your account setup below.</p>

        {error && <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" className="form-input" value={form.firstName} onChange={set('firstName')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-input" value={form.lastName} onChange={set('lastName')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account →'}
          </button>
        </form>
      </div>
    </div>
  );
}
