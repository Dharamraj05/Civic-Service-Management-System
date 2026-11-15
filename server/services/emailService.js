const fs = require('fs');
const path = require('path');

const FLAG_LABELS = {
  WRONG_PHOTO: 'Wrong photo evidence',
  WRONG_INFORMATION: 'Wrong information provided',
  INSUFFICIENT_EVIDENCE: 'Insufficient evidence',
  OTHER: 'Other review finding'
};

function isSmtpConfigured() {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
}

function buildWarningEmail({ complaint, flagType, reason, flaggedAt }) {
  const subject = `CSMS notice for complaint #${complaint.complaint_id}`;
  const text = [
    'Civic Service Management System (CivicConnect)',
    '',
    `Complaint ID: #${complaint.complaint_id}`,
    `Service: ${complaint.category_name}`,
    `Review finding: ${FLAG_LABELS[flagType] || flagType}`,
    `Date: ${flaggedAt}`,
    '',
    'Your complaint has been reviewed and the submitted evidence/information was found to be inconsistent with the service request.',
    '',
    `Reviewer note: ${reason}`,
    '',
    'Please provide accurate information and valid evidence for this request or for future requests.',
    '',
    'This is an administrative notice from the civic service desk. It is not an emergency dispatch message.'
  ].join('\n');
  return { subject, text };
}

async function sendWarningEmail({ to, subject, text }) {
  if (isSmtpConfigured()) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: String(process.env.EMAIL_PORT) === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text
    });
    return { status: 'SENT', messageId: info.messageId };
  }

  const logDir = path.join(__dirname, '..', 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, 'email-warnings.log');
  const entry = [
    `--- ${new Date().toISOString()} ---`,
    `To: ${to}`,
    `Subject: ${subject}`,
    text,
    ''
  ].join('\n');
  fs.appendFileSync(logFile, `${entry}\n`);
  return { status: 'LOGGED', messageId: null };
}

module.exports = {
  FLAG_LABELS,
  isSmtpConfigured,
  buildWarningEmail,
  sendWarningEmail
};
