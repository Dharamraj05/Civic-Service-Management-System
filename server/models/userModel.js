const pool = require('../config/db');

const PUBLIC_COLUMNS = 'user_id, full_name, email, phone, role, created_at';

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT user_id, full_name, email, phone, password_hash, role, created_at
     FROM users WHERE email = ?`,
    [email]
  );
  return rows[0] || null;
}

async function findByPhone(phone) {
  const [rows] = await pool.query(
    `SELECT user_id, phone FROM users WHERE phone = ?`,
    [phone]
  );
  return rows[0] || null;
}

async function findById(userId) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE user_id = ?`,
    [userId]
  );
  return rows[0] || null;
}

async function findPasswordHash(userId) {
  const [rows] = await pool.query(
    `SELECT password_hash FROM users WHERE user_id = ?`,
    [userId]
  );
  return rows[0] ? rows[0].password_hash : null;
}

async function createCitizen({ fullName, email, phone, passwordHash }) {
  const [result] = await pool.query(
    `INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES (?, ?, ?, ?, 'CITIZEN')`,
    [fullName, email, phone, passwordHash]
  );
  return findById(result.insertId);
}

async function updateProfile(userId, { fullName, phone }) {
  await pool.query(
    `UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?`,
    [fullName, phone, userId]
  );
  return findById(userId);
}

async function updatePassword(userId, passwordHash) {
  await pool.query(
    `UPDATE users SET password_hash = ? WHERE user_id = ?`,
    [passwordHash, userId]
  );
}

module.exports = {
  findByEmail,
  findByPhone,
  findById,
  findPasswordHash,
  createCitizen,
  updateProfile,
  updatePassword
};
