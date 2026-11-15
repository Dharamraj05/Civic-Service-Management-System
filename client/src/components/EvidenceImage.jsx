import { useEffect, useState } from 'react';
import api from '../api';

export default function EvidenceImage({ complaintId, evidenceId, alt }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl = '';
    let active = true;
    api.get(`/complaints/${complaintId}/evidence/${evidenceId}/file`, { responseType: 'blob' })
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data);
        if (active) setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [complaintId, evidenceId]);

  if (failed) return <p className="form-note">The image could not be loaded.</p>;
  if (!url) return <p className="form-note">Loading photo…</p>;
  return <img className="evidence-img" src={url} alt={alt || 'Complaint evidence'} />;
}
