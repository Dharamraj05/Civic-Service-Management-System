const pool = require('../config/db');

async function list() {
  const [rows] = await pool.query(
    `SELECT d.department_id, d.department_name, d.description, d.created_at,
            (SELECT COUNT(*) FROM resources r WHERE r.department_id = d.department_id) AS resource_count,
            (SELECT COUNT(*) FROM service_categories sc WHERE sc.department_id = d.department_id) AS category_count
     FROM departments d
     ORDER BY d.department_name ASC`
  );
  return rows;
}

async function findById(departmentId) {
  const [rows] = await pool.query(
    `SELECT department_id, department_name, description, created_at
     FROM departments WHERE department_id = ?`,
    [departmentId]
  );
  return rows[0] || null;
}

async function create({ departmentName, description }) {
  const [result] = await pool.query(
    `INSERT INTO departments (department_name, description) VALUES (?, ?)`,
    [departmentName, description || null]
  );
  return findById(result.insertId);
}

async function update(departmentId, { departmentName, description }) {
  await pool.query(
    `UPDATE departments SET department_name = ?, description = ? WHERE department_id = ?`,
    [departmentName, description || null, departmentId]
  );
  return findById(departmentId);
}

async function remove(departmentId) {
  const [result] = await pool.query(
    `DELETE FROM departments WHERE department_id = ?`,
    [departmentId]
  );
  return result.affectedRows > 0;
}

module.exports = { list, findById, create, update, remove };
