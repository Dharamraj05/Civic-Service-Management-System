import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api';
import Alert from '../../components/Alert';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { useFetch } from '../../hooks/useFetch';
import { formatDate } from '../../utils/labels';

export default function QueuePage() {
  const { loading, error, data, reload } = useFetch('/admin/complaints/queue');
  const [banner, setBanner] = useState({ type: 'info', message: '' });
  const [working, setWorking] = useState(false);

  async function allocate(body) {
    setWorking(true);
    setBanner({ type: '', message: '' });
    try {
      const response = await api.post('/allocations/auto', body);
      setBanner({ type: response.data.data.allocated ? 'success' : 'info', message: response.data.message });
      await reload();
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err, 'Allocation failed.') });
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Scheduler"
        title="Priority queue"
        subtitle="Sorted by priority ascending, then by request time. Priority 1 is served before priority 2. Equal priority uses FCFS."
        actions={(
          <>
            <button type="button" className="btn btn-secondary" disabled={working} onClick={() => allocate({ mode: 'next' })}>
              Allocate next
            </button>
            <button type="button" className="btn btn-primary" disabled={working} onClick={() => allocate({ mode: 'pass' })}>
              Run allocation pass
            </button>
          </>
        )}
      />
      <div className="callout">
        <p><strong>Allocate next</strong> serves only the single highest waiting complaint. If its resource type is busy, it stays waiting and later requests are not skipped.</p>
        <p><strong>Run allocation pass</strong> walks the queue in the same order. A blocked service type stays waiting, and a different service with a free resource can still be served.</p>
      </div>
      <Alert type={banner.message ? (banner.type || 'info') : 'error'} message={banner.message || error} />
      {loading && <Spinner label="Loading the queue" />}
      {!loading && data && (
        <section className="card">
          {data.queue.length === 0 ? (
            <p>No complaints are waiting. New requests appear here until a resource is allocated.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Complaint</th>
                    <th>Citizen</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Request time</th>
                    <th>Status</th>
                    <th>Compatible resources</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.queue.map((row) => (
                    <tr key={row.complaint_id}>
                      <td data-label="Position">{row.queue_position}</td>
                      <td data-label="Complaint"><strong>#{row.complaint_id}</strong><span className="cell-sub">{row.title}</span></td>
                      <td data-label="Citizen">{row.citizen_name}</td>
                      <td data-label="Category">{row.category_name}<span className="cell-sub">{row.required_resource_type}</span></td>
                      <td data-label="Priority"><PriorityBadge priority={row.priority} /></td>
                      <td data-label="Request time">{formatDate(row.created_at)}</td>
                      <td data-label="Status"><StatusBadge status={row.status} /></td>
                      <td data-label="Compatible resources">
                        {row.available_resource_count > 0
                          ? `${row.available_resource_count} available`
                          : 'None available'}
                      </td>
                      <td data-label="">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={working}
                          onClick={() => allocate({ complaint_id: row.complaint_id })}
                        >
                          Allocate
                        </button>
                        <Link className="text-link" to={`/admin/complaints/${row.complaint_id}`}>Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
