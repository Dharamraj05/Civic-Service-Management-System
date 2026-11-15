import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api';
import Alert from '../../components/Alert';
import { ResourceBadge } from '../../components/Badges';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { useFetch } from '../../hooks/useFetch';

const emptyForm = {
  resource_name: '',
  resource_type: '',
  department_id: '',
  registration_or_identifier: '',
  current_location: '',
  status: 'AVAILABLE'
};

export default function ResourcesPage() {
  const { loading, error, data, reload } = useFetch('/resources');
  const departments = useFetch('/departments');
  const types = useFetch('/categories/resource-types');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [banner, setBanner] = useState('');
  const [bannerType, setBannerType] = useState('success');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setEditing(null);
  }, [open]);

  function beginCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function beginEdit(resource) {
    setEditing(resource);
    setForm({
      resource_name: resource.resource_name,
      resource_type: resource.resource_type,
      department_id: String(resource.department_id),
      registration_or_identifier: resource.registration_or_identifier,
      current_location: resource.current_location || '',
      status: resource.status === 'BUSY' ? 'AVAILABLE' : resource.status
    });
    setOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setBanner('');
    const payload = {
      ...form,
      department_id: Number(form.department_id)
    };
    try {
      if (editing) {
        await api.put(`/resources/${editing.resource_id}`, payload);
        setBanner('Resource updated.');
      } else {
        await api.post('/resources', payload);
        setBanner('Resource added.');
      }
      setBannerType('success');
      setOpen(false);
      await reload();
    } catch (err) {
      setBannerType('error');
      setBanner(getErrorMessage(err, 'Could not save the resource.'));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(resource, status) {
    setBanner('');
    try {
      await api.patch(`/resources/${resource.resource_id}/status`, { status });
      setBannerType('success');
      setBanner(`${resource.registration_or_identifier} is now ${status}.`);
      await reload();
    } catch (err) {
      setBannerType('error');
      setBanner(getErrorMessage(err, 'Could not change the status.'));
    }
  }

  async function remove() {
    try {
      await api.delete(`/resources/${pendingDelete.resource_id}`);
      setBannerType('success');
      setBanner('Resource deleted.');
      setPendingDelete(null);
      await reload();
    } catch (err) {
      setBannerType('error');
      setBanner(getErrorMessage(err, 'Could not delete the resource.'));
      setPendingDelete(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Fleet"
        title="Resources"
        subtitle="Ambulances, tankers, trucks, repair teams, and patrol vehicles. Busy is set only when a complaint is allocated."
        actions={<button type="button" className="btn btn-primary" onClick={beginCreate}>Add resource</button>}
      />
      <Alert type={bannerType} message={banner} />
      <Alert type="error" message={error} />
      {loading && <Spinner label="Loading resources" />}
      {data && (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.resources.map((resource) => (
                  <tr key={resource.resource_id}>
                    <td data-label="ID">{resource.registration_or_identifier}</td>
                    <td data-label="Name">{resource.resource_name}</td>
                    <td data-label="Type">{resource.resource_type}</td>
                    <td data-label="Department">{resource.department_name}</td>
                    <td data-label="Status"><ResourceBadge status={resource.status} /></td>
                    <td data-label="Location">{resource.current_location || '—'}</td>
                    <td data-label="">
                      {resource.status === 'BUSY' ? (
                        <span className="form-note">Release by completing the complaint</span>
                      ) : (
                        <div className="row-actions">
                          <select
                            aria-label={`Status for ${resource.resource_name}`}
                            value={resource.status}
                            onChange={(event) => changeStatus(resource, event.target.value)}
                          >
                            <option value="AVAILABLE">AVAILABLE</option>
                            <option value="MAINTENANCE">MAINTENANCE</option>
                            <option value="OFFLINE">OFFLINE</option>
                          </select>
                          <button type="button" className="btn btn-secondary" onClick={() => beginEdit(resource)}>Edit</button>
                          <button type="button" className="btn btn-danger" onClick={() => setPendingDelete(resource)}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal
        title={editing ? 'Edit resource' : 'Add resource'}
        open={open}
        onClose={() => setOpen(false)}
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="resource-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        )}
      >
        <form id="resource-form" className="form-grid" onSubmit={save}>
          <label>
            Name
            <input required value={form.resource_name} onChange={(event) => setForm({ ...form, resource_name: event.target.value })} />
          </label>
          <label>
            Identifier
            <input required value={form.registration_or_identifier} onChange={(event) => setForm({ ...form, registration_or_identifier: event.target.value })} />
          </label>
          <label>
            Type
            <select required value={form.resource_type} onChange={(event) => setForm({ ...form, resource_type: event.target.value })}>
              <option value="">Select type</option>
              {(types.data?.resource_types || []).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Department
            <select required value={form.department_id} onChange={(event) => setForm({ ...form, department_id: event.target.value })}>
              <option value="">Select department</option>
              {(departments.data?.departments || []).map((department) => (
                <option key={department.department_id} value={department.department_id}>{department.department_name}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="OFFLINE">OFFLINE</option>
            </select>
          </label>
          <label>
            Current location
            <input value={form.current_location} onChange={(event) => setForm({ ...form, current_location: event.target.value })} />
          </label>
        </form>
      </Modal>

      <Modal
        title="Delete this resource?"
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setPendingDelete(null)}>Keep it</button>
            <button type="button" className="btn btn-danger" onClick={remove}>Delete</button>
          </>
        )}
      >
        <p>
          {pendingDelete
            ? `${pendingDelete.resource_name} can be deleted only when it has never been allocated. Otherwise set it offline.`
            : ''}
        </p>
      </Modal>
    </>
  );
}
