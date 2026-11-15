import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { homeForRole } from '../utils/labels';

const initial = { full_name: '', email: '', phone: '', password: '' };

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
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
      await register(form);
      navigate('/citizen');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-copy">
        <p className="eyebrow">Citizen registration</p>
        <h1>Create a citizen account</h1>
        <p>Registration is only for citizens. Administrator accounts are issued by the city desk and cannot be created from this form.</p>
      </div>
      <form className="card form-card" onSubmit={onSubmit}>
        <h2>Register</h2>
        <Alert type="error" message={error} />
        <label>
          Full name
          <input name="full_name" autoComplete="name" required minLength={2} value={form.full_name} onChange={update} />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
        </label>
        <label>
          Phone
          <input name="phone" inputMode="numeric" autoComplete="tel" required pattern="[0-9]{10,15}" value={form.phone} onChange={update} />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={update} />
        </label>
        <p className="form-note">Use at least 8 characters with a letter and a number.</p>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
        <p className="form-note">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </section>
  );
}
