import { useState } from 'react';
import api, { getErrorMessage } from '../../api';
import Alert from '../../components/Alert';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user.full_name,
    phone: user.phone
  });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      const response = await api.put('/auth/profile', profile);
      setUser(response.data.data.user);
      setMessage('Profile updated.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update the profile.'));
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await api.put('/auth/password', passwords);
      setPasswords({ current_password: '', new_password: '' });
      setMessage('Password updated.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not change the password.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" subtitle="Your sign-in email and role cannot be changed here." />
      <Alert type="success" message={message} />
      <Alert type="error" message={error} />
      <div className="split">
        <form className="card form-grid" onSubmit={saveProfile}>
          <h2 className="span-2">Contact details</h2>
          <label className="span-2">
            Full name
            <input value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} required />
          </label>
          <label className="span-2">
            Phone
            <input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} required pattern="[0-9]{10,15}" />
          </label>
          <p className="span-2 form-note">Email: {user.email}<br />Role: {user.role}</p>
          <div className="span-2">
            <button className="btn btn-primary" type="submit" disabled={saving}>Save profile</button>
          </div>
        </form>
        <form className="card form-grid" onSubmit={savePassword}>
          <h2 className="span-2">Password</h2>
          <label className="span-2">
            Current password
            <input type="password" autoComplete="current-password" value={passwords.current_password} onChange={(event) => setPasswords({ ...passwords, current_password: event.target.value })} required />
          </label>
          <label className="span-2">
            New password
            <input type="password" autoComplete="new-password" minLength={8} value={passwords.new_password} onChange={(event) => setPasswords({ ...passwords, new_password: event.target.value })} required />
          </label>
          <div className="span-2">
            <button className="btn btn-secondary" type="submit" disabled={saving}>Change password</button>
          </div>
        </form>
      </div>
    </>
  );
}
