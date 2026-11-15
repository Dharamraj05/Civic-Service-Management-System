const pool = require('../config/db');

async function list() {
  const [rows] = await pool.query(
    `SELECT sc.category_id, sc.category_name, sc.department_id, sc.required_resource_type,
            sc.description, d.department_name
     FROM service_categories sc
     JOIN departments d ON d.department_id = sc.department_id
     ORDER BY sc.category_name ASC`
  );
  return rows;
}

async function findById(categoryId, connection) {
  const db = connection || pool;
  const [rows] = await db.query(
    `SELECT sc.category_id, sc.category_name, sc.department_id, sc.required_resource_type,
            sc.description, d.department_name
     FROM service_categories sc
     JOIN departments d ON d.department_id = sc.department_id
     WHERE sc.category_id = ?`,
    [categoryId]
  );
  return rows[0] || null;
}

async function listResourceTypes() {
  const [rows] = await pool.query(
    `SELECT DISTINCT required_resource_type AS resource_type
     FROM service_categories
     ORDER BY required_resource_type ASC`
  );
  return rows.map((row) => row.resource_type);
}

module.exports = { list, findById, listResourceTypes };
