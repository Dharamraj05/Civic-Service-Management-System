import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api';
import Alert from '../../components/Alert';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import { useFetch } from '../../hooks/useFetch';
import PhotoEvidence from '../../components/PhotoEvidence';

const initial = {
  title: '',
  category_id: '',
  priority: '2',
  description: '',
  address: '',
  latitude: '',
  longitude: ''
};

export default function SubmitComplaint() {
  const categories = useFetch('/categories');
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [photo, setPhoto] = useState(null);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      let response;
      if (photo) {
        const payload = new FormData();
        payload.append('title', form.title);
        payload.append('description', form.description);
        payload.append('address', form.address);
        payload.append('category_id', form.category_id);
        payload.append('priority', form.priority);
        if (form.latitude) payload.append('latitude', form.latitude);
        if (form.longitude) payload.append('longitude', form.longitude);
        payload.append('evidence', photo);
        response = await api.post('/complaints', payload);
      } else {
        response = await api.post('/complaints', {
          ...form,
          category_id: Number(form.category_id),
          priority: Number(form.priority),
          latitude: form.latitude,
          longitude: form.longitude
        });
      }
      setResult(response.data);
      setForm(initial);
      setPhoto(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit the complaint.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const complaint = result.data.complaint;
    const allocation = result.data.allocation;
    return (
      <>
        <PageHeader eyebrow="Complaint filed" title={`Request #${complaint.complaint_id}`} />
        <section className="card receipt">
          <Alert type="success" message={result.message} />
          <dl className="facts">
            <div><dt>Status</dt><dd><StatusBadge status={complaint.status} /></dd></div>
            <div><dt>Priority</dt><dd><PriorityBadge priority={complaint.priority} /></dd></div>
            <div><dt>Category</dt><dd>{complaint.category_name}</dd></div>
            <div><dt>Resource</dt><dd>{allocation.resource?.registration_or_identifier || 'Not allocated yet'}</dd></div>
            {result.data.evidence && (
              <div><dt>Evidence</dt><dd>{result.data.evidence.original_filename}</dd></div>
            )}
          </dl>
          <div className="page-actions">
            <Link className="btn btn-primary" to={`/citizen/complaints/${complaint.complaint_id}`}>Track this complaint</Link>
            <button type="button" className="btn btn-secondary" onClick={() => setResult(null)}>File another</button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="New request"
        title="Submit a complaint"
        subtitle="Required fields are marked. Latitude and longitude are optional."
      />
      {categories.loading && <Spinner label="Loading service categories" />}
      <Alert type="error" message={categories.error || error} />
      {!categories.loading && (
        <form className="card form-grid" onSubmit={onSubmit}>
          <label className="span-2">
            Complaint title
            <input name="title" required minLength={5} value={form.title} onChange={update} />
          </label>
          <label>
            Service category
            <select name="category_id" required value={form.category_id} onChange={update}>
              <option value="">Select a service</option>
              {(categories.data?.categories || []).map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name} · {category.required_resource_type}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select name="priority" required value={form.priority} onChange={update}>
              <option value="1">1 — Critical</option>
              <option value="2">2 — High</option>
              <option value="3">3 — Medium</option>
              <option value="4">4 — Low</option>
            </select>
          </label>
          <label className="span-2">
            Description
            <textarea name="description" required minLength={10} rows={5} value={form.description} onChange={update} />
          </label>
          <label className="span-2">
            Address / location
            <input name="address" required minLength={5} value={form.address} onChange={update} />
          </label>
          <label>
            Latitude <span className="optional">optional</span>
            <input name="latitude" inputMode="decimal" value={form.latitude} onChange={update} />
          </label>
          <label>
            Longitude <span className="optional">optional</span>
            <input name="longitude" inputMode="decimal" value={form.longitude} onChange={update} />
          </label>
          <PhotoEvidence file={photo} onFile={setPhoto} />
          <div className="span-2">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit complaint'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
