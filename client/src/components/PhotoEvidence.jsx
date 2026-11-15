import { useEffect, useRef, useState } from 'react';

export default function PhotoEvidence({ file, onFile, error }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [mode, setMode] = useState('idle');
  const [facing, setFacing] = useState('environment');
  const [cameraError, setCameraError] = useState('');
  const preview = file ? URL.createObjectURL(file) : '';

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => () => stopCamera(), []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function startCamera(nextFacing = facing) {
    setCameraError('');
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser does not expose a camera. Use Choose from gallery instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacing } },
        audio: false
      });
      streamRef.current = stream;
      setMode('camera');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError('Camera permission was denied or no camera is available. You can still choose a file.');
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const captured = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onFile(captured);
      stopCamera();
      setMode('preview');
    }, 'image/jpeg', 0.9);
  }

  function onPick(event) {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (picked) {
      stopCamera();
      onFile(picked);
      setMode('preview');
    }
  }

  function remove() {
    onFile(null);
    setMode('idle');
  }

  return (
    <fieldset className="span-2 evidence-box">
      <legend>Add photo evidence</legend>
      <p className="form-note">Optional. JPEG, PNG, or WEBP, up to 5 MB. The photo is stored on the server with the complaint, not as a browser path.</p>
      {(error || cameraError) && <p className="field-error">{error || cameraError}</p>}

      {!file && mode !== 'camera' && (
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={() => startCamera('environment')}>Take photo (back camera)</button>
          <button type="button" className="btn btn-secondary" onClick={() => startCamera('user')}>Take photo (front camera)</button>
          <label className="btn btn-ghost file-btn">
            Choose from gallery
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} hidden />
          </label>
        </div>
      )}

      {mode === 'camera' && (
        <div className="camera-wrap">
          <video ref={videoRef} autoPlay playsInline muted />
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={capture}>Use this photo</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const next = facing === 'environment' ? 'user' : 'environment';
                setFacing(next);
                startCamera(next);
              }}
            >
              Switch camera
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { stopCamera(); setMode('idle'); }}>Cancel</button>
          </div>
        </div>
      )}

      {file && (
        <div className="preview-wrap">
          <img src={preview} alt="Selected complaint evidence" />
          <p className="form-note">{file.name} · {Math.round(file.size / 1024)} KB</p>
          <div className="page-actions">
            <button type="button" className="btn btn-secondary" onClick={() => startCamera(facing)}>Retake</button>
            <label className="btn btn-ghost file-btn">
              Choose another
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} hidden />
            </label>
            <button type="button" className="btn btn-danger" onClick={remove}>Delete</button>
          </div>
        </div>
      )}
    </fieldset>
  );
}
