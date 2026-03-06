// ============================================================
// components/InviteModal.jsx
// ============================================================

import { useState } from 'react';
import { employeeApi } from '../services/api';
import toast from 'react-hot-toast';

export default function InviteModal({ onClose }) {
  const [email,   setEmail]   = useState('');
  const [role,    setRole]    = useState('EMPLOYEE');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await employeeApi.invite({ email, role });
      toast.success(data.message || `Invite sent to ${email}`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="modal-title">Invite Employee</h2>
        <p className="modal-subtitle">They'll receive an invitation link to set up their account.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="employee@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex gap-2" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <span className="spinner" /> : '📧 Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
