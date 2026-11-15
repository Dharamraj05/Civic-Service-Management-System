const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const complaintModel = require('../models/complaintModel');
const { buildWarningEmail, sendWarningEmail, FLAG_LABELS } = require('./emailService');

async function listByComplaint(complaintId) {
  const [rows] = await pool.query(
    `SELECT f.flag_id, f.complaint_id, f.flag_type, f.reason, f.citizen_email,
            f.email_status, f.email_subject, f.flagged_at, u.full_name AS flagged_by_name
     FROM complaint_flags f
     JOIN users u ON u.user_id = f.flagged_by
     WHERE f.complaint_id = ?
     ORDER BY f.flagged_at DESC`,
    [complaintId]
  );
  return rows;
}

async function flagComplaint({ complaintId, adminId, flagType, reason }) {
  if (!FLAG_LABELS[flagType]) {
    throw new ApiError(400, 'Select a valid review finding.');
  }
  const trimmed = String(reason || '').trim();
  if (trimmed.length < 10 || trimmed.length > 500) {
    throw new ApiError(400, 'Enter a reason between 10 and 500 characters.');
  }

  const complaint = await complaintModel.findById(complaintId);
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found.');
  }

  const [userRows] = await pool.query(
    `SELECT email, full_name FROM users WHERE user_id = ?`,
    [complaint.citizen_id]
  );
  const owner = userRows[0];
  if (!owner?.email) {
    throw new ApiError(409, 'This complaint has no registered citizen email.');
  }

  const flaggedAt = new Date().toLocaleString('en-IN');
  const { subject, text } = buildWarningEmail({
    complaint,
    flagType,
    reason: trimmed,
    flaggedAt
  });

  let delivery;
  try {
    delivery = await sendWarningEmail({ to: owner.email, subject, text });
  } catch (error) {
    delivery = { status: 'FAILED', messageId: null };
    console.error('Warning email failed:', error.message);
  }

  const [result] = await pool.query(
    `INSERT INTO complaint_flags
      (complaint_id, flagged_by, flag_type, reason, citizen_email, email_status, email_subject, email_preview)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      complaintId,
      adminId,
      flagType,
      trimmed,
      owner.email,
      delivery.status,
      subject,
      text
    ]
  );

  const statusNote = delivery.status === 'SENT'
    ? `A warning email was sent to the registered address ${owner.email}.`
    : delivery.status === 'FAILED'
      ? 'The warning was recorded, but sending the email failed.'
      : `The warning was recorded. Email is not configured, so the notice was written to the development log instead of being sent to ${owner.email}.`;

  return {
    flag_id: result.insertId,
    citizen_email: owner.email,
    email_status: delivery.status,
    message: statusNote
  };
}

module.exports = { listByComplaint, flagComplaint };
