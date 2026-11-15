import { Link } from 'react-router-dom';
import { formatDate } from '../utils/labels';
import { PriorityBadge, StatusBadge } from './Badges';
import EmptyState from './EmptyState';

export default function ComplaintsTable({ rows, basePath, emptyTitle, emptyText }) {
  if (!rows?.length) {
    return <EmptyState title={emptyTitle || 'No complaints'} text={emptyText} />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Complaint</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Filed</th>
            <th>Resource</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.complaint_id}>
              <td data-label="ID">#{row.complaint_id}</td>
              <td data-label="Complaint">
                <strong>{row.title}</strong>
                {row.citizen_name && <span className="cell-sub">{row.citizen_name}</span>}
              </td>
              <td data-label="Category">{row.category_name}</td>
              <td data-label="Priority"><PriorityBadge priority={row.priority} /></td>
              <td data-label="Status"><StatusBadge status={row.status} /></td>
              <td data-label="Filed">{formatDate(row.created_at)}</td>
              <td data-label="Resource">{row.registration_or_identifier || '—'}</td>
              <td data-label="">
                <Link className="text-link" to={`${basePath}/${row.complaint_id}`}>Open</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
