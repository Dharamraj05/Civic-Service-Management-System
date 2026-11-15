import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import Alert from '../components/Alert';
import { PriorityBadge, ResourceBadge, StatusBadge } from '../components/Badges';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { FLOW, formatDate } from '../utils/labels';
import EvidenceImage from '../components/EvidenceImage';

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user.role === 'ADMIN';
  const base = isAdmin ? '/admin/complaints' : '/citizen/complaints';
  const { loading, error, data, reload } = useFetch(`/complaints/${id}`);
  const [banner, setBanner] = useState({ type: '', message: '' });
  const [working, setWorking] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [resourceId, setResourceId] = useState('');
  const [resources, setResources] = useState([]);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagType, setFlagType] = useState('WRONG_PHOTO');
  const [flagReason, setFlagReason] = useState('');

  const complaint = data?.complaint;
  async function loadResources(type) {
    try {
      const response = await api.get('/resources', { params: { status: 'AVAILABLE', type } });
      setResources(response.data.data.resources);
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err, 'Could not load available resources.') });
    }
  }

  async function run(action) {
    setBanner({ type: '', message: '' });
    setWorking(true);
    try {
      const payload = await action();
      const message = payload?.message || String(payload || 'Saved.');
      const type = payload?.data?.allocated === false ? 'info' : 'success';
      setBanner({ type, message });
      setConfirmCancel(false);
      setFlagOpen(false);
      setFlagReason('');
      setResourceId('');
      await reload();
    } catch (err) {
      setBanner({ type: 'error', message: getErrorMessage(err, 'The action could not be completed.') });
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <Spinner label="Loading complaint" />;
  if (error) return <Alert type="error" message={error} />;
  if (!complaint) return null;

  const activeAllocation = (data.allocations || []).find((item) =>
    ['ALLOCATED', 'IN_PROGRESS'].includes(item.allocation_status)
  );

  return (
    <>
      <PageHeader
        eyebrow={`Complaint #${complaint.complaint_id}`}
        title={complaint.title}
        subtitle={complaint.address}
        actions={<Link className="btn btn-secondary" to={base}>Back to list</Link>}
      />
      <Alert type={banner.type === 'error' ? 'error' : 'success'} message={banner.message} />

      <section className="detail-grid">
        <article className="card">
          <h2>Status</h2>
          <Stepper status={complaint.status} />
          {complaint.status === 'WAITING' && data.queue && (
            <div className="queue-note">
              <p>Overall queue position: <strong>{data.queue.overall}</strong></p>
              <p>Position for {complaint.required_resource_type}: <strong>{data.queue.for_resource_type}</strong></p>
              <p className="form-note">A free resource of another type does not skip a more urgent request that needs this same type.</p>
            </div>
          )}
          <dl className="facts">
            <div><dt>Category</dt><dd>{complaint.category_name}</dd></div>
            <div><dt>Department</dt><dd>{complaint.department_name}</dd></div>
            <div><dt>Priority</dt><dd><PriorityBadge priority={complaint.priority} /></dd></div>
            <div><dt>Process state</dt><dd><StatusBadge status={complaint.status} /></dd></div>
            <div><dt>Filed</dt><dd>{formatDate(complaint.created_at)}</dd></div>
            <div><dt>Updated</dt><dd>{formatDate(complaint.updated_at)}</dd></div>
            {isAdmin && (
              <div><dt>Citizen</dt><dd>{complaint.citizen_name}<br />{complaint.citizen_phone}</dd></div>
            )}
          </dl>
          <h3>Description</h3>
          <p>{complaint.description}</p>
          {(complaint.latitude || complaint.longitude) && (
            <p className="form-note">Coordinates: {complaint.latitude || '—'}, {complaint.longitude || '—'}</p>
          )}
        </article>

        <article className="card">
          <h2>Allocated resource</h2>
          {activeAllocation ? (
            <dl className="facts">
              <div><dt>Name</dt><dd>{activeAllocation.resource_name}</dd></div>
              <div><dt>Identifier</dt><dd>{activeAllocation.registration_or_identifier}</dd></div>
              <div><dt>Type</dt><dd>{activeAllocation.resource_type}</dd></div>
              <div><dt>Allocation</dt><dd>{activeAllocation.allocation_status}</dd></div>
              <div><dt>Allocated</dt><dd>{formatDate(activeAllocation.allocated_at)}</dd></div>
              <div><dt>Started</dt><dd>{formatDate(activeAllocation.started_at)}</dd></div>
            </dl>
          ) : (
            <p>No resource is currently assigned.</p>
          )}

          {isAdmin && (
            <div className="action-stack">
              {complaint.status === 'WAITING' && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={working}
                    onClick={() => run(async () => {
                      const response = await api.post('/allocations/auto', { complaint_id: complaint.complaint_id });
                      return response.data;
                    })}
                  >
                    Allocate if this request is next
                  </button>
                  <ResourcePicker
                    resources={resources}
                    resourceId={resourceId}
                    setResourceId={setResourceId}
                    onOpen={() => loadResources(complaint.required_resource_type)}
                    label="Manual override"
                    help="Manual assignment can pass an earlier request. It still refuses a busy or incompatible resource."
                    onSubmit={() => run(async () => {
                      const response = await api.post('/allocations/manual', {
                        complaint_id: complaint.complaint_id,
                        resource_id: Number(resourceId)
                      });
                      return response.data;
                    })}
                    disabled={working || !resourceId}
                  />
                </>
              )}
              {complaint.status === 'ASSIGNED' && activeAllocation && (
                <>
                  <button type="button" className="btn btn-primary" disabled={working} onClick={() => run(async () => {
                    const response = await api.patch(`/allocations/${activeAllocation.allocation_id}/start`);
                    return response.data;
                  })}>
                    Start service
                  </button>
                  <ResourcePicker
                    resources={resources}
                    resourceId={resourceId}
                    setResourceId={setResourceId}
                    onOpen={() => loadResources(complaint.required_resource_type)}
                    label="Reassign"
                    help="The current resource is released only after the new one is locked."
                    onSubmit={() => run(async () => {
                      const response = await api.patch(`/allocations/${activeAllocation.allocation_id}/reassign`, {
                        resource_id: Number(resourceId)
                      });
                      return response.data;
                    })}
                    disabled={working || !resourceId}
                  />
                </>
              )}
              {complaint.status === 'IN_PROGRESS' && activeAllocation && (
                <button type="button" className="btn btn-primary" disabled={working} onClick={() => run(async () => {
                  const response = await api.patch(`/allocations/${activeAllocation.allocation_id}/complete`);
                  return response.data;
                })}>
                  Mark completed and release resource
                </button>
              )}
              {['NEW', 'WAITING', 'ASSIGNED'].includes(complaint.status) && (
                <button type="button" className="btn btn-danger" disabled={working} onClick={() => setConfirmCancel(true)}>
                  Cancel complaint
                </button>
              )}
              <button type="button" className="btn btn-secondary" disabled={working} onClick={() => setFlagOpen(true)}>
                Flag complaint
              </button>
            </div>
          )}

          {!isAdmin && ['NEW', 'WAITING', 'ASSIGNED'].includes(complaint.status) && (
            <button type="button" className="btn btn-danger" disabled={working} onClick={() => setConfirmCancel(true)}>
              Cancel complaint
            </button>
          )}
        </article>
      </section>

      <section className="card">
        <h2>Photo evidence</h2>
        {(data.evidence || []).length === 0 && <p>No photo has been uploaded for this complaint.</p>}
        <div className="evidence-list">
          {(data.evidence || []).map((item) => (
            <figure key={item.evidence_id}>
              <EvidenceImage
                complaintId={complaint.complaint_id}
                evidenceId={item.evidence_id}
                alt={item.original_filename}
              />
              <figcaption>
                Complaint #{complaint.complaint_id} · {item.original_filename}<br />
                {formatDate(item.uploaded_at)} · {item.uploaded_by_name}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {(data.flags || []).length > 0 && (
        <section className="card">
          <h2>Review warnings</h2>
          <ul className="plain-list">
            {data.flags.map((item) => (
              <li key={item.flag_id}>
                <div>
                    <strong>{item.flag_type.replace(/_/g, ' ')}</strong>
                  <span>{item.reason}</span>
                  <span className="form-note">{formatDate(item.flagged_at)} · emailed {item.citizen_email} · {item.email_status}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Status history</h2>
        <ol className="history">
          {(data.history || []).map((item) => (
            <li key={item.history_id}>
              <StatusBadge status={item.new_status} />
              <div>
                <strong>{item.remarks || item.new_status}</strong>
                <span>{formatDate(item.changed_at)}{item.changed_by_name ? ` · ${item.changed_by_name}` : ''}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {(data.allocations || []).length > 0 && (
        <section className="card">
          <h2>Allocation history</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Status</th>
                  <th>Allocated</th>
                  <th>Started</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {data.allocations.map((item) => (
                  <tr key={item.allocation_id}>
                    <td data-label="Resource">{item.registration_or_identifier}<span className="cell-sub">{item.resource_name}</span></td>
                    <td data-label="Status"><ResourceBadge status={item.allocation_status} /></td>
                    <td data-label="Allocated">{formatDate(item.allocated_at)}</td>
                    <td data-label="Started">{formatDate(item.started_at)}</td>
                    <td data-label="Completed">{formatDate(item.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal
        title="Cancel this complaint?"
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmCancel(false)}>Keep it</button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={working}
              onClick={() => run(async () => {
                const response = await api.patch(`/complaints/${complaint.complaint_id}/cancel`);
                return response.data;
              })}
            >
              Cancel complaint
            </button>
          </>
        )}
      >
        <p>If a resource was assigned and the job has not started, that resource is released.</p>
      </Modal>

      <Modal
        title="Flag this complaint?"
        open={flagOpen}
        onClose={() => setFlagOpen(false)}
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setFlagOpen(false)}>Cancel</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={working}
              onClick={() => run(async () => {
                const response = await api.post(`/complaints/${complaint.complaint_id}/flags`, {
                  flag_type: flagType,
                  reason: flagReason
                });
                return response.data;
              })}
            >
              Record warning
            </button>
          </>
        )}
      >
        <p>The notice is sent only to the registered email on this complaint. You cannot type a different address.</p>
        <label>
          Finding
          <select value={flagType} onChange={(event) => setFlagType(event.target.value)}>
            <option value="WRONG_PHOTO">Wrong photo</option>
            <option value="WRONG_INFORMATION">Wrong information</option>
            <option value="INSUFFICIENT_EVIDENCE">Insufficient evidence</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>
          Reason (required)
          <textarea rows={4} value={flagReason} onChange={(event) => setFlagReason(event.target.value)} />
        </label>
      </Modal>
    </>
  );
}

function Stepper({ status }) {
  if (status === 'CANCELLED') {
    return <p className="cancelled-note">This request was cancelled before completion.</p>;
  }
  const index = FLOW.findIndex((step) => step.key === status);
  return (
    <ol className="stepper">
      {FLOW.map((step, stepIndex) => {
        const state = stepIndex < index ? 'done' : stepIndex === index ? 'current' : 'todo';
        return <li key={step.key} className={state}>{step.label}</li>;
      })}
    </ol>
  );
}

function ResourcePicker({ resources, resourceId, setResourceId, onOpen, label, help, onSubmit, disabled }) {
  return (
    <div className="picker">
      <p className="form-note">{help}</p>
      <label>
        {label}
        <select
          value={resourceId}
          onFocus={onOpen}
          onChange={(event) => setResourceId(event.target.value)}
        >
          <option value="">Select an available resource</option>
          {resources.map((resource) => (
            <option key={resource.resource_id} value={resource.resource_id}>
              {resource.registration_or_identifier} — {resource.resource_name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="btn btn-secondary" disabled={disabled} onClick={onSubmit}>
        Confirm {label.toLowerCase()}
      </button>
    </div>
  );
}
