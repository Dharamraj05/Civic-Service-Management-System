import { useState } from 'react';
import api, { getErrorMessage } from '../../api';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { useFetch } from '../../hooks/useFetch';

const empty = { department_name: '', description: '' };

export default function DepartmentsPage() {
  const { loading, error, data, reload } = useFetch('/departments');
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [banner, setBanner] = useState('');
  const [bannerType, setBannerType] = useState('success');
  const [saving, setSaving] = useState(false);

  function beginCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function beginEdit(department) {
    setEditing(department);
    setForm({
      department_name: department.department_name,
      description: department.description || ''
    });
    setOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/departments/${editing.department_id}`, form);
        setBanner('Department updated.');
      } else {
        await api.post('/departments', form);
        setBanner('Department created.');
      }
      setBannerType('success');
      setOpen(false);
      await reload();
    } catch (err) {
      setBannerType('error');
      setBanner(getErrorMessage(err, 'Could not save the department.'));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api.delete(`/departments/${pendingDelete.department_id}`);
      setBannerType('success');
      setBanner('Department deleted.');
      setPendingDelete(null);
      await reload();
    } catch (err) {
      setBannerType('error');
      setBanner(getErrorMessage(err, 'Could not delete the department.'));
      setPendingDelete(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Departments"
        subtitle="A department owns service categories and the resources that answer them."
        actions={<button type="button" className="btn btn-primary" onClick={beginCreate}>Add department</button>}
      />
      <Alert type={bannerType} message={banner} />
      <Alert type="error" message={error} />
      {loading && <Spinner label="Loading departments" />}
      {data && (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Description</th>
                  <th>Categories</th>
                  <th>Resources</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.departments.map((department) => (
                  <tr key={department.department_id}>
                    <td data-label="Department"><strong>{department.department_name}</strong></td>
                    <td data-label="Description">{department.description || '—'}</td>
                    <td data-label="Categories">{department.category_count}</td>
                    <td data-label="Resources">{department.resource_count}</td>
                    <td data-label="">
                      <div className="row-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => beginEdit(department)}>Edit</button>
                        <button type="button" className="btn btn-danger" onClick={() => setPendingDelete(department)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal
        title={editing ? 'Edit department' : 'Add department'}
        open={open}
        onClose={() => setOpen(false)}
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="department-form" className="btn btn-primary" disabled={saving}>Save</button>
          </>
        )}
      >
        <form id="department-form" className="form-grid" onSubmit={save}>
          <label className="span-2">
            Name
            <input required value={form.department_name} onChange={(event) => setForm({ ...form, department_name: event.target.value })} />
          </label>
          <label className="span-2">
            Description
            <textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
        </form>
      </Modal>

      <Modal
        title="Delete this department?"
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setPendingDelete(null)}>Keep it</button>
            <button type="button" className="btn btn-danger" onClick={remove}>Delete</button>
          </>
        )}
      >
        <p>Deletion is refused while categories or resources still belong to this department.</p>
      </Modal>
    </>
  );
}
