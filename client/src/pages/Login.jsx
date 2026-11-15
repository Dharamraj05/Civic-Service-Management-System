import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { homeForRole } from '../utils/labels';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homeForRole(user.role)} replace />;

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const account = await login(form.email, form.password);
      navigate(homeForRole(account.role));
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-copy">
        <p className="eyebrow">Secure sign in</p>
        <h1>Open your desk</h1>
        <p>Citizens and administrators use the same login. The account role decides which pages you can open.</p>
        <div className="demo-box">
          <h2>Demo accounts</h2>
          <p><strong>Administrator</strong><br />admin@csms.gov.in<br />Admin@12345</p>
          <p><strong>Citizen</strong><br />ravi.kumar@example.com<br />Citizen@123</p>
        </div>
      </div>
      <form className="card form-card" onSubmit={onSubmit}>
        <h2>Log in</h2>
        <Alert type="error" message={error} />
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required value={form.password} onChange={update} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Log in'}
        </button>
        <p className="form-note">New citizen? <Link to="/register">Create an account</Link></p>
      </form>
    </section>
  );
}
