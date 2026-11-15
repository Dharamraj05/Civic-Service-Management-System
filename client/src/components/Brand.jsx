import { Link } from 'react-router-dom';

export default function Brand({ light = false, compact = false }) {
  return (
    <Link className={`brand ${light ? 'brand-light' : ''} ${compact ? 'brand-compact' : ''}`} to="/">
      <span className="mark" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <path d="M16 3 6 8v8c0 7 4.2 11 10 13 5.8-2 10-6 10-13V8L16 3z" />
          <path d="M16 11v10M11 16h10" />
        </svg>
      </span>
      <span>
        <strong>CSMS</strong>
        {!compact && <small>Civic Service Management</small>}
      </span>
    </Link>
  );
}
