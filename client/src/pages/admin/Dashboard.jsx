import { Link } from 'react-router-dom';
import Alert from '../../components/Alert';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { useFetch } from '../../hooks/useFetch';
import { formatDate } from '../../utils/labels';

export default function AdminDashboard() {
  const { loading, error, data } = useFetch('/admin/dashboard');

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="City desk"
        subtitle="Open complaints, the priority queue, and resources currently in the field."
        actions={(
          <>
            <Link className="btn btn-secondary" to="/admin/os">OS scheduling</Link>
            <Link className="btn btn-secondary" to="/admin/dbms">DBMS implementation</Link>
            <Link className="btn btn-primary" to="/admin/queue">Open priority queue</Link>
          </>
        )}
      />
      {loading && <Spinner label="Loading the desk" />}
      <Alert type="error" message={error} />
      {data && (
        <>
          <div className="module-pair">
            <aside className="module-banner module-os">
              <p className="module-kicker">Operating system</p>
              <h2>Priority queue, FCFS, process states</h2>
              <p>Open OS scheduling to allocate the next waiting process.</p>
            </aside>
            <aside className="module-banner module-dbms">
              <p className="module-kicker">Database management system</p>
              <h2>Tables, keys, views, transactions</h2>
              <p>Open DBMS implementation for live MySQL counts and JOINs.</p>
            </aside>
          </div>
          <section className="stat-grid">
            <article className="stat"><span>Total complaints</span><strong>{data.stats.complaints.total}</strong></article>
            <article className="stat"><span>Waiting</span><strong>{data.stats.complaints.waiting}</strong></article>
            <article className="stat"><span>Critical and open</span><strong>{data.stats.complaints.critical_open}</strong></article>
            <article className="stat"><span>Available resources</span><strong>{data.stats.resources.available}</strong></article>
            <article className="stat"><span>Busy resources</span><strong>{data.stats.resources.busy}</strong></article>
            <article className="stat"><span>Completed</span><strong>{data.stats.complaints.completed}</strong></article>
          </section>
          <div className="split">
            <section className="card">
              <div className="card-head">
                <h2>Priority queue</h2>
                <Link to="/admin/queue">Full queue</Link>
              </div>
              <QueuePreview rows={data.queue} />
            </section>
            <section className="card">
              <div className="card-head">
                <h2>Recent complaints</h2>
                <Link to="/admin/complaints">All complaints</Link>
              </div>
              <ul className="plain-list">
                {data.recent.map((row) => (
                  <li key={row.complaint_id}>
                    <div>
                      <Link to={`/admin/complaints/${row.complaint_id}`}><strong>#{row.complaint_id} {row.title}</strong></Link>
                      <span>{row.citizen_name} · {formatDate(row.created_at)}</span>
                    </div>
                    <StatusBadge status={row.status} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <section className="card">
            <h2>Resource overview</h2>
            <div className="mini-stats">
              <span>Available {data.stats.resources.available}</span>
              <span>Busy {data.stats.resources.busy}</span>
              <span>Maintenance {data.stats.resources.maintenance}</span>
              <span>Offline {data.stats.resources.offline}</span>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function QueuePreview({ rows }) {
  if (!rows.length) return <p>The waiting queue is empty.</p>;
  return (
    <ol className="queue-preview">
      {rows.map((row) => (
        <li key={row.complaint_id}>
          <span className="pos">{row.queue_position}</span>
          <div>
            <strong>#{row.complaint_id} {row.title}</strong>
            <span>{row.category_name} · {formatDate(row.created_at)}</span>
          </div>
          <PriorityBadge priority={row.priority} />
        </li>
      ))}
    </ol>
  );
}
