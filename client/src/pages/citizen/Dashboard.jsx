import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import ComplaintsTable from '../../components/ComplaintsTable';
import { useFetch } from '../../hooks/useFetch';

export default function CitizenDashboard() {
  const { loading, error, data } = useFetch('/complaints/my');
  const summary = data?.summary || {};
  const recent = (data?.complaints || []).slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="Citizen desk"
        title="Your requests"
        subtitle="Track what you have filed and whether a city resource has been allocated."
        actions={<Link className="btn btn-primary" to="/citizen/complaints/new">Submit complaint</Link>}
      />
      {loading && <Spinner label="Loading your complaints" />}
      <Alert type="error" message={error} />
      {!loading && !error && (
        <>
          <section className="stat-grid">
            <Stat label="Total" value={summary.total} />
            <Stat label="Pending" value={summary.pending} />
            <Stat label="Assigned or in progress" value={summary.active} />
            <Stat label="Completed" value={summary.completed} />
          </section>
          <section className="card">
            <div className="card-head">
              <h2>Recent complaints</h2>
              <Link to="/citizen/complaints">View all</Link>
            </div>
            <ComplaintsTable
              rows={recent}
              basePath="/citizen/complaints"
              emptyTitle="No complaints yet"
              emptyText="Submit a request and it will appear here with its queue status."
            />
          </section>
        </>
      )}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
    </article>
  );
}
