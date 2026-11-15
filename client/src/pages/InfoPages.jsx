import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeForRole } from '../utils/labels';

export function Forbidden() {
  const { user } = useAuth();
  const back = user ? homeForRole(user.role) : '/login';

  return (
    <section className="narrow-page">
      <p className="eyebrow">Restricted</p>
      <h1>This area is not available for your role</h1>
      <p>Citizen accounts cannot open administration pages, and administrator tools are not part of the citizen desk.</p>
      <Link className="btn btn-primary" to={back}>{user ? 'Back to your desk' : 'Log in'}</Link>
    </section>
  );
}

export function NotFound() {
  return (
    <section className="narrow-page">
      <h1>Page not found</h1>
      <p>That address is not part of the civic desk.</p>
      <Link className="btn btn-primary" to="/">Go to the home page</Link>
    </section>
  );
}
