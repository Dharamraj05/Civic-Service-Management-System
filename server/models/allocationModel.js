const pool = require('../config/db');

async function list() {
  const [rows] = await pool.query(
    `SELECT * FROM allocation_report_view
     ORDER BY allocated_at DESC
     LIMIT 300`
  );
  return rows;
}

async function findById(allocationId, connection) {
  const db = connection || pool;
  const [rows] = await db.query(
    `SELECT a.allocation_id, a.complaint_id, a.resource_id, a.allocated_at,
            a.started_at, a.completed_at, a.allocation_status, a.allocated_by, a.remarks,
            c.status AS complaint_status, c.citizen_id, c.priority,
            sc.required_resource_type,
            r.status AS resource_status, r.resource_type, r.resource_name,
            r.registration_or_identifier
     FROM resource_allocations a
     JOIN complaints c ON c.complaint_id = a.complaint_id
     JOIN service_categories sc ON sc.category_id = c.category_id
     JOIN resources r ON r.resource_id = a.resource_id
     WHERE a.allocation_id = ?`,
    [allocationId]
  );
  return rows[0] || null;
}

module.exports = { list, findById };
