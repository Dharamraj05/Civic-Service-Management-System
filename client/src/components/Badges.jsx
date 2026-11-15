import { COMPLAINT_STATUS } from '../utils/labels';

export function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase().replace('_', '-');
  return (
    <span className={`badge badge-${key}`}>
      {COMPLAINT_STATUS[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const labels = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };
  return (
    <span className={`badge badge-p${priority}`}>
      P{priority} {labels[priority] || ''}
    </span>
  );
}

export function ResourceBadge({ status }) {
  const key = String(status || '').toLowerCase();
  return <span className={`badge badge-${key}`}>{status}</span>;
}
