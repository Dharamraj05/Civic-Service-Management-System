const pool = require('../config/db');

const RESOURCE_SELECT = `
  SELECT r.resource_id, r.department_id, r.resource_name, r.resource_type,
         r.registration_or_identifier, r.status, r.current_location, r.created_at,
         d.department_name
  FROM resources r
  JOIN departments d ON d.department_id = r.department_id
`;

async function list({ status, resourceType, departmentId } = {}) {
  const clauses = [];
  const params = [];

  if (status) {
    clauses.push('r.status = ?');
    params.push(status);
  }
  if (resourceType) {
    clauses.push('r.resource_type = ?');
    params.push(resourceType);
  }
  if (departmentId) {
    clauses.push('r.department_id = ?');
    params.push(departmentId);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `${RESOURCE_SELECT} ${where} ORDER BY r.resource_type ASC, r.resource_name ASC`,
    params
  );
  return rows;
}

async function findById(resourceId) {
  const [rows] = await pool.query(
    `${RESOURCE_SELECT} WHERE r.resource_id = ?`,
    [resourceId]
  );
  return rows[0] || null;
}

async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO resources
      (department_id, resource_name, resource_type, registration_or_identifier, status, current_location)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.departmentId,
      data.resourceName,
      data.resourceType,
      data.registrationOrIdentifier,
      data.status || 'AVAILABLE',
      data.currentLocation || null
    ]
  );
  return findById(result.insertId);
}

async function update(resourceId, data) {
  await pool.query(
    `UPDATE resources
     SET department_id = ?, resource_name = ?, resource_type = ?,
         registration_or_identifier = ?, status = ?, current_location = ?
     WHERE resource_id = ?`,
    [
      data.departmentId,
      data.resourceName,
      data.resourceType,
      data.registrationOrIdentifier,
      data.status,
      data.currentLocation || null,
      resourceId
    ]
  );
  return findById(resourceId);
}

async function updateStatus(resourceId, status) {
  await pool.query(
    `UPDATE resources SET status = ? WHERE resource_id = ?`,
    [status, resourceId]
  );
  return findById(resourceId);
}

async function countAllocations(resourceId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM resource_allocations WHERE resource_id = ?`,
    [resourceId]
  );
  return rows[0].total;
}

async function remove(resourceId) {
  const [result] = await pool.query(
    `DELETE FROM resources WHERE resource_id = ?`,
    [resourceId]
  );
  return result.affectedRows > 0;
}

async function countByStatus() {
  const [rows] = await pool.query(
    `SELECT status, COUNT(*) AS total FROM resources GROUP BY status`
  );
  return rows;
}

module.exports = {
  list,
  findById,
  create,
  update,
  updateStatus,
  countAllocations,
  remove,
  countByStatus
};
