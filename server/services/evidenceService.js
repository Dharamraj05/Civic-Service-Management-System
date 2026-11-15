const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const { ALLOWED_MIME, MAX_BYTES, detectImageMime } = require('../utils/fileSignature');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'evidence');

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function listByComplaint(complaintId) {
  return pool.query(
    `SELECT e.evidence_id, e.complaint_id, e.original_filename, e.mime_type, e.file_size,
            e.uploaded_by, e.uploaded_at, u.full_name AS uploaded_by_name
     FROM complaint_evidence e
     JOIN users u ON u.user_id = e.uploaded_by
     WHERE e.complaint_id = ?
     ORDER BY e.uploaded_at DESC`,
    [complaintId]
  ).then(([rows]) => rows);
}

async function findOwned(evidenceId) {
  const [rows] = await pool.query(
    `SELECT e.*, c.citizen_id
     FROM complaint_evidence e
     JOIN complaints c ON c.complaint_id = e.complaint_id
     WHERE e.evidence_id = ?`,
    [evidenceId]
  );
  return rows[0] || null;
}

async function saveUpload({ complaintId, userId, file }) {
  if (!file) {
    throw new ApiError(400, 'Choose or capture a photo before uploading.');
  }
  if (file.size > MAX_BYTES) {
    throw new ApiError(400, 'Photo must be 5 MB or smaller.');
  }

  const buffer = file.buffer || fs.readFileSync(file.path);
  const detected = detectImageMime(buffer);
  if (!detected || !ALLOWED_MIME.includes(detected)) {
    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw new ApiError(400, 'Use a JPEG, PNG, or WEBP image. The file contents must match the type.');
  }

  ensureUploadDir();
  const ext = detected === 'image/png' ? 'png' : detected === 'image/webp' ? 'webp' : 'jpg';
  const storedFilename = `${complaintId}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const dest = path.join(UPLOAD_DIR, storedFilename);
  fs.writeFileSync(dest, buffer);
  if (file.path && fs.existsSync(file.path) && path.resolve(file.path) !== dest) {
    fs.unlinkSync(file.path);
  }

  const [result] = await pool.query(
    `INSERT INTO complaint_evidence
      (complaint_id, stored_filename, original_filename, mime_type, file_size, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      complaintId,
      storedFilename,
      file.originalname || `evidence.${ext}`,
      detected,
      buffer.length,
      userId
    ]
  );

  const [rows] = await pool.query(
    `SELECT evidence_id, complaint_id, original_filename, mime_type, file_size, uploaded_at
     FROM complaint_evidence WHERE evidence_id = ?`,
    [result.insertId]
  );
  return rows[0];
}

function absolutePath(storedFilename) {
  return path.join(UPLOAD_DIR, storedFilename);
}

module.exports = {
  UPLOAD_DIR,
  listByComplaint,
  findOwned,
  saveUpload,
  absolutePath
};
