import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api';
import Alert from '../../components/Alert';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { useFetch } from '../../hooks/useFetch';
import { FLOW, formatDate } from '../../utils/labels';

export default function OsConcepts() {
  const { loading, error, data, reload } = useFetch('/admin/complaints/queue');
  const [banner, setBanner] = useState({ type: '', message: '' });
  const [working, setWorking] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);

  async function allocate() {
    setWorking(true);
    setBanner({ type: '', message: '' });
    try {
      const response = await api.post('/allocations/auto', { mode: 'next' });
      setBanner({
        type: response.data.data.allocated ? 'success' : 'info',
        message: response.data.message
      });
      await reload();
      if (selectedId) await openComplaint(selectedId);
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err, 'Allocation failed.') });
    } finally {
      setWorking(false);
    }
  }

  async function openComplaint(id) {
    setSelectedId(id);
    try {
      const response = await api.get(`/complaints/${id}`);
      setDetail(response.data.data);
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err, 'Could not load that complaint.') });
    }
  }

  const queue = data?.queue || [];
  const complaint = detail?.complaint;
  const allocation = (detail?.allocations || []).find((item) =>
    ['ALLOCATED', 'IN_PROGRESS'].includes(item.allocation_status)
  );

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Scheduling"
        subtitle="Waiting requests, ordered by priority and then by the time they were filed."
        actions={(
          <button type="button" className="btn btn-primary" disabled={working} onClick={allocate}>
            Allocate next
          </button>
        )}
      />
      <Alert type={banner.type || 'info'} message={banner.message || error} />
      {loading && <Spinner label="Loading the waiting queue" />}
      <section className="card">
        <div className="card-head">
          <h2>Waiting queue</h2>
        </div>
        {queue.length === 0 ? (
          <p>No WAITING processes. Reset seed data if you already allocated the demo queue.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Complaint ID</th>
                  <th>Service</th>
                  <th>Priority</th>
                  <th>Request time</th>
                  <th>Status</th>
                  <th>Required resource</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {queue.map((row) => (
                  <tr key={row.complaint_id} className={selectedId === row.complaint_id ? 'row-selected' : ''}>
                    <td data-label="Position">{row.queue_position}</td>
                    <td data-label="Complaint ID">#{row.complaint_id}</td>
                    <td data-label="Service">{row.category_name}</td>
                    <td data-label="Priority"><PriorityBadge priority={row.priority} /></td>
                    <td data-label="Request time">{formatDate(row.created_at)}</td>
                    <td data-label="Status"><StatusBadge status={row.status} /></td>
                    <td data-label="Required resource">{row.required_resource_type}<span className="cell-sub">{row.available_resource_count} free</span></td>
                    <td data-label="">
                      <button type="button" className="btn btn-secondary" onClick={() => openComplaint(row.complaint_id)}>Show process</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="card">
        <h2>Selected request</h2>
        {!complaint && <p>Select a waiting request to see its status and any allocated resource.</p>}
        {complaint && (
          <>
            <p><strong>#{complaint.complaint_id}</strong> {complaint.title}</p>
            <ol className="stepper">
              {FLOW.map((step) => {
                const index = FLOW.findIndex((item) => item.key === complaint.status);
                const stepIndex = FLOW.findIndex((item) => item.key === step.key);
                const state = stepIndex < index ? 'done' : stepIndex === index ? 'current' : 'todo';
                return <li key={step.key} className={state}>{step.label}</li>;
              })}
            </ol>
            <dl className="facts">
              <div><dt>Current state</dt><dd><StatusBadge status={complaint.status} /></dd></div>
              <div><dt>Resource</dt><dd>{allocation ? `${allocation.registration_or_identifier} (${allocation.allocation_status})` : 'None yet'}</dd></div>
            </dl>
            <Link className="text-link" to={`/admin/complaints/${complaint.complaint_id}`}>Open full complaint</Link>
          </>
        )}
      </section>
    </>
  );
}
