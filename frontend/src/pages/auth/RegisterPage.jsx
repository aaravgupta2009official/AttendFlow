import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ── Defined OUTSIDE RegisterPage so React doesn't recreate it on every render
const Field = ({ name, label, type = 'text', placeholder, value, onChange, error }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input
      type={type}
      className="form-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
    />
    {error && <div className="form-error">{error}</div>}
  </div>
);

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', companyName: '' });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      toast.success('Company registered! Welcome to AttendFlow.');
    } catch (err) {
      const data = err.response?.data;
      if (data?.details) {
        const errs = {};
        data.details.forEach(({ field, message }) => { errs[field] = message; });
        setErrors(errs);
      } else {
        setErrors({ general: data?.error || 'Registration failed.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon" style={{ width: 40, height: 40, fontSize: 20 }}>⚡</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>AttendFlow</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Start free trial
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>
          Register your company — no credit card required.
        </p>

        {errors.general && (
          <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field name="companyName" label="Company Name" placeholder="Acme Corp"
            value={form.companyName} onChange={set('companyName')} error={errors.companyName} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field name="firstName" label="First Name" placeholder="Sarah"
              value={form.firstName} onChange={set('firstName')} error={errors.firstName} />
            <Field name="lastName" label="Last Name" placeholder="Chen"
              value={form.lastName} onChange={set('lastName')} error={errors.lastName} />
          </div>

          <Field name="email" label="Work Email" type="email" placeholder="sarah@acme.com"
            value={form.email} onChange={set('email')} error={errors.email} />
          <Field name="password" label="Password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={form.password} onChange={set('password')} error={errors.password} />

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Company →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
