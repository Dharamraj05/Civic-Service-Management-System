export const PRIORITY = {
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low'
};

export const COMPLAINT_STATUS = {
  NEW: 'Submitted',
  WAITING: 'Waiting',
  ASSIGNED: 'Resource assigned',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const FLOW = [
  { key: 'NEW', label: 'Submitted' },
  { key: 'WAITING', label: 'Waiting' },
  { key: 'ASSIGNED', label: 'Resource assigned' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'COMPLETED', label: 'Completed' }
];

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatMinutes(value) {
  if (value === null || value === undefined || value === '') return 'Not enough data';
  const minutes = Number(value);
  if (Number.isNaN(minutes)) return 'Not enough data';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return `${hours} h ${rest} min`;
}

export function homeForRole(role) {
  return role === 'ADMIN' ? '/admin' : '/citizen';
}
