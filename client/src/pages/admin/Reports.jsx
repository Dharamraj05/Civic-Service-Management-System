import Alert from '../../components/Alert';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { useFetch } from '../../hooks/useFetch';
import { PRIORITY, formatDate, formatMinutes } from '../../utils/labels';

export default function ReportsPage() {
  const { loading, error, data } = useFetch('/admin/reports');

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Service reports"
        subtitle="Counts by category, priority, and status, plus how long requests waited for a resource."
      />
      {loading && <Spinner label="Building the report" />}
      <Alert type="error" message={error} />
      {data && (
        <>
          <section className="stat-grid">
            <article className="stat">
              <span>Average time to allocation</span>
              <strong>{formatMinutes(data.avg_response_minutes)}</strong>
            </article>
            <article className="stat">
              <span>Average time to completion</span>
              <strong>{formatMinutes(data.avg_completion_minutes)}</strong>
            </article>
            <article className="stat">
              <span>Completed allocations</span>
              <strong>{data.completed_allocations}</strong>
            </article>
          </section>
          <div className="split">
            <section className="card">
              <h2>Complaints by category</h2>
              <Bars
                items={data.by_category}
                labelKey="category_name"
                valueKey="total"
              />
            </section>
            <section className="card">
              <h2>Complaints by priority</h2>
              <Bars
                items={data.by_priority.map((row) => ({
                  ...row,
                  label: `${row.priority} · ${PRIORITY[row.priority] || ''}`
                }))}
                labelKey="label"
                valueKey="total"
              />
            </section>
          </div>
          <div className="split">
            <section className="card">
              <h2>Complaints by status</h2>
              <Bars items={data.by_status} labelKey="status" valueKey="total" />
            </section>
            <section className="card">
              <h2>Resource utilization</h2>
              <Utilization rows={data.resource_utilization} />
            </section>
          </div>
          <section className="card">
            <h2>Completed requests</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Complaint</th>
                    <th>Category</th>
                    <th>Resource</th>
                    <th>Completed</th>
                    <th>Response</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_completed.map((row) => (
                    <tr key={`${row.complaint_id}-${row.completed_at}`}>
                      <td data-label="Complaint">#{row.complaint_id} {row.complaint_title}</td>
                      <td data-label="Category">{row.category_name}</td>
                      <td data-label="Resource">{row.registration_or_identifier}</td>
                      <td data-label="Completed">{formatDate(row.completed_at)}</td>
                      <td data-label="Response">{formatMinutes(row.response_minutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Bars({ items, labelKey, valueKey }) {
  const max = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);
  if (!items.length) return <p>No data yet.</p>;
  return (
    <div className="bars">
      {items.map((item) => (
        <div className="bar-row" key={String(item[labelKey])}>
          <span>{item[labelKey]}</span>
          <div className="bar-track" aria-hidden="true">
            <div className="bar-fill" style={{ width: `${(Number(item[valueKey]) / max) * 100}%` }} />
          </div>
          <strong>{item[valueKey]}</strong>
        </div>
      ))}
    </div>
  );
}

function Utilization({ rows }) {
  const grouped = {};
  rows.forEach((row) => {
    if (!grouped[row.resource_type]) {
      grouped[row.resource_type] = { AVAILABLE: 0, BUSY: 0, MAINTENANCE: 0, OFFLINE: 0 };
    }
    grouped[row.resource_type][row.status] = row.total;
  });
  const entries = Object.entries(grouped);
  if (!entries.length) return <p>No resources recorded.</p>;
  return (
    <ul className="plain-list">
      {entries.map(([type, counts]) => {
        const total = counts.AVAILABLE + counts.BUSY + counts.MAINTENANCE + counts.OFFLINE;
        return (
          <li key={type}>
            <div>
              <strong>{type}</strong>
              <span>{counts.BUSY} busy of {total}</span>
            </div>
            <span>{counts.AVAILABLE} free</span>
          </li>
        );
      })}
    </ul>
  );
}
