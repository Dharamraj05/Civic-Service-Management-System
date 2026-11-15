import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeForRole } from '../utils/labels';
import Brand from './Brand';

export default function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="public-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <Brand />
        <nav className="topnav" aria-label="Public">
          <a href="/#services">Services</a>
          <a href="/#scheduling">How requests are served</a>
          {user ? (
            <Link className="btn btn-primary" to={homeForRole(user.role)}>Open desk</Link>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link className="btn btn-primary" to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <Brand compact />
        <p>City operations desk for emergency and civic service requests.</p>
        <p className="fine">Demonstration system for a college project. Do not use for a real emergency dispatch.</p>
      </footer>
    </div>
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = user?.role === 'ADMIN'
    ? [
      ['/admin', 'Dashboard', true],
      ['/admin/queue', 'Priority queue', false],
      ['/admin/os', 'OS scheduling', false],
      ['/admin/dbms', 'DBMS implementation', false],
      ['/admin/complaints', 'Complaints', false],
      ['/admin/resources', 'Resources', false],
      ['/admin/departments', 'Departments', false],
      ['/admin/allocations', 'Allocations', false],
      ['/admin/reports', 'Reports', false]
    ]
    : [
      ['/citizen', 'Dashboard', true],
      ['/citizen/complaints/new', 'Submit complaint', false],
      ['/citizen/complaints', 'My complaints', false],
      ['/citizen/profile', 'Profile', false]
    ];

  return (
    <div className="desk-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <Brand light />
        <p className="side-role">{user?.role === 'ADMIN' ? 'Administration' : 'Citizen desk'}</p>
        <nav aria-label="Dashboard">
          {items.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)}>{label}</NavLink>
          ))}
        </nav>
      </aside>
      <div className="desk-main">
        <header className="desk-bar">
          <button type="button" className="menu-btn" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? 'Close' : 'Menu'}
          </button>
          <div>
            <strong>{user?.full_name}</strong>
            <span>{user?.email}</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={logout}>Log out</button>
        </header>
        <main id="main" className="desk-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
