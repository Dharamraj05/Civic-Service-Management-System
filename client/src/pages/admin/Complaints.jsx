import { useMemo, useState } from 'react';
import Alert from '../../components/Alert';
import ComplaintsTable from '../../components/ComplaintsTable';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { useFetch } from '../../hooks/useFetch';

export default function AdminComplaints() {
  const categories = useFetch('/categories');
  const [filters, setFilters] = useState({ status: '', category_id: '', priority: '' });
  const [applied, setApplied] = useState(filters);

  const path = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(applied).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    return `/admin/complaints${query ? `?${query}` : ''}`;
  }, [applied]);

  const complaints = useFetch(path);

  function update(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <>
      <PageHeader
        eyebrow="Records"
        title="All complaints"
        subtitle="Filter by status, service, or priority. Scheduling order is on the priority queue page."
      />
      <form
        className="card filter-bar"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(filters);
        }}
      >
        <label>
          Status
          <select name="status" value={filters.status} onChange={update}>
            <option value="">All</option>
            {['NEW', 'WAITING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select name="category_id" value={filters.category_id} onChange={update}>
            <option value="">All</option>
            {(categories.data?.categories || []).map((category) => (
              <option key={category.category_id} value={category.category_id}>{category.category_name}</option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select name="priority" value={filters.priority} onChange={update}>
            <option value="">All</option>
            <option value="1">1 Critical</option>
            <option value="2">2 High</option>
            <option value="3">3 Medium</option>
            <option value="4">4 Low</option>
          </select>
        </label>
        <button className="btn btn-primary" type="submit">Apply</button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => {
            const cleared = { status: '', category_id: '', priority: '' };
            setFilters(cleared);
            setApplied(cleared);
          }}
        >
          Clear
        </button>
      </form>
      {complaints.loading && <Spinner label="Loading complaints" />}
      <Alert type="error" message={complaints.error} />
      {!complaints.loading && !complaints.error && (
        <section className="card">
          <ComplaintsTable
            rows={complaints.data.complaints}
            basePath="/admin/complaints"
            emptyTitle="No complaints match these filters"
          />
        </section>
      )}
    </>
  );
}
