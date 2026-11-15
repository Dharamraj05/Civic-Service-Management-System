import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import { PriorityBadge, ResourceBadge, StatusBadge } from '../../components/Badges';
import { useFetch } from '../../hooks/useFetch';
import { formatDate } from '../../utils/labels';

export default function DbmsConcepts() {
  const { loading, error, data } = useFetch('/admin/concepts');
  const counts = data?.table_counts || {};

  return (
    <>
      <PageHeader
        eyebrow="Viva — DBMS"
        title="DBMS implementation"
        subtitle="Live row counts, JOINs, views, and the allocation transaction. All figures come from MySQL, not from hardcoded text."
      />
      <ModuleBanner
        kind="dbms"
        title="This screen demonstrates DBMS"
        text="Relational tables, primary and foreign keys, JOINs, views, transactions, and referential integrity."
      />
      {loading && <Spinner label="Reading MySQL" />}
      <Alert type="error" message={error} />
      {data && (
        <>
          <section className="card">
            <h2>DBMS module 1 — Relational database</h2>
            <div className="mini-stats">
              {Object.entries(counts).map(([table, total]) => (
                <span key={table}>{table.replace(/_/g, ' ')} {total}</span>
              ))}
            </div>
          </section>
          <section className="card">
            <h2>DBMS module 2 — Keys and relationships</h2>
            <p className="rel-chain">USER → COMPLAINT → RESOURCE_ALLOCATION → RESOURCE</p>
            <p className="rel-chain">DEPARTMENT → RESOURCE &nbsp;·&nbsp; DEPARTMENT → SERVICE_CATEGORY → COMPLAINT</p>
            <p className="form-note">Primary keys are the *_id columns. Foreign keys keep a complaint tied to a real citizen and category. active_resource_lock is unique so one resource cannot have two open allocations.</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>user_id</th>
                    <th>complaint_id</th>
                    <th>department</th>
                    <th>allocation_id</th>
                    <th>resource</th>
                  </tr>
                </thead>
                <tbody>
                  {data.relationships.map((row) => (
                    <tr key={`${row.complaint_id}-${row.allocation_id || 0}`}>
                      <td data-label="user_id">{row.user_id} {row.full_name}</td>
                      <td data-label="complaint_id">#{row.complaint_id}<span className="cell-sub">{row.title}</span></td>
                      <td data-label="department">{row.department_name}</td>
                      <td data-label="allocation_id">{row.allocation_id || '—'}</td>
                      <td data-label="resource">{row.registration_or_identifier || '—'}<span className="cell-sub">{row.resource_status || ''}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="card">
            <h2>DBMS module 3 — Transactions, queries, views</h2>
            <ol className="tx-steps">
              <li>BEGIN TRANSACTION</li>
              <li>Lock the eligible WAITING complaint</li>
              <li>Lock an AVAILABLE resource of the required type</li>
              <li>INSERT resource_allocations</li>
              <li>UPDATE complaint → ASSIGNED</li>
              <li>UPDATE resource → BUSY</li>
              <li>COMMIT — or ROLLBACK if any step fails</li>
            </ol>
            <p className="form-note">Implemented in server/services/allocationService.js using InnoDB row locks. Allocation FKs use ON UPDATE RESTRICT / ON DELETE RESTRICT.</p>
          </section>
          <div className="split">
            <section className="card">
              <h2>View: priority_queue_view</h2>
              <QueueMini rows={data.views.priority_queue_view} />
            </section>
            <section className="card">
              <h2>View: available_resources_view</h2>
              {(data.views.available_resources_view || []).slice(0, 8).map((row) => (
                <p key={row.resource_id} className="plain-line">
                  {row.registration_or_identifier} · {row.resource_type} <ResourceBadge status={row.status} />
                </p>
              ))}
              {data.views.available_resources_view.length === 0 && <p>No AVAILABLE resources right now.</p>}
            </section>
          </div>
          <section className="card">
            <h2>View: allocation_report_view</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Allocation</th>
                    <th>Complaint</th>
                    <th>Resource</th>
                    <th>Status</th>
                    <th>Allocated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.views.allocation_report_view.map((row) => (
                    <tr key={row.allocation_id}>
                      <td data-label="Allocation">#{row.allocation_id}</td>
                      <td data-label="Complaint">#{row.complaint_id} {row.complaint_title}</td>
                      <td data-label="Resource">{row.registration_or_identifier}</td>
                      <td data-label="Status"><ResourceBadge status={row.allocation_status} /></td>
                      <td data-label="Allocated">{formatDate(row.allocated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="card">
            <h2>complaint_status_history</h2>
            <ol className="history">
              {data.status_history.map((item) => (
                <li key={item.history_id}>
                  <StatusBadge status={item.new_status} />
                  <div>
                    <strong>#{item.complaint_id} {item.remarks || item.new_status}</strong>
                    <span>{formatDate(item.changed_at)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </>
  );
}

function QueueMini({ rows }) {
  if (!rows.length) return <p>The waiting view is empty.</p>;
  return (
    <ol className="queue-preview">
      {rows.slice(0, 8).map((row) => (
        <li key={row.complaint_id}>
          <span className="pos">{row.queue_position}</span>
          <div>
            <strong>#{row.complaint_id} {row.category_name}</strong>
            <span>{formatDate(row.created_at)}</span>
          </div>
          <PriorityBadge priority={row.priority} />
        </li>
      ))}
    </ol>
  );
}
