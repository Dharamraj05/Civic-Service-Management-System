const pool = require('../config/db');

const LIST_SELECT = `
  SELECT c.complaint_id, c.citizen_id, c.category_id, c.title, c.description,
         c.address, c.latitude, c.longitude, c.priority, c.status,
         c.created_at, c.updated_at,
         u.full_name AS citizen_name, u.phone AS citizen_phone, u.email AS citizen_email,
         sc.category_name, sc.required_resource_type, d.department_name,
         a.allocation_id, a.allocation_status, a.allocated_at,
         r.resource_id, r.resource_name, r.registration_or_identifier, r.resource_type
  FROM complaints c
  JOIN users u ON u.user_id = c.citizen_id
  JOIN service_categories sc ON sc.category_id = c.category_id
  JOIN departments d ON d.department_id = sc.department_id
  LEFT JOIN resource_allocations a
    ON a.allocation_id = (
      SELECT a2.allocation_id
      FROM resource_allocations a2
      WHERE a2.complaint_id = c.complaint_id
        AND a2.allocation_status IN ('ALLOCATED', 'IN_PROGRESS', 'COMPLETED')
      ORDER BY a2.allocated_at DESC, a2.allocation_id DESC
      LIMIT 1
    )
  LEFT JOIN resources r ON r.resource_id = a.resource_id
`;

async function list({ citizenId, status, categoryId, priority, order } = {}) {
  const clauses = [];
  const params = [];

  if (citizenId) {
    clauses.push('c.citizen_id = ?');
    params.push(citizenId);
  }
  if (status) {
    clauses.push('c.status = ?');
    params.push(status);
  }
  if (categoryId) {
    clauses.push('c.category_id = ?');
    params.push(categoryId);
  }
  if (priority) {
    clauses.push('c.priority = ?');
    params.push(priority);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const orderBy = order === 'priority'
    ? 'c.priority ASC, c.created_at ASC, c.complaint_id ASC'
    : 'c.created_at DESC';
  const [rows] = await pool.query(
    `${LIST_SELECT} ${where}
     ORDER BY ${orderBy}
     LIMIT 500`,
    params
  );
  return rows;
}

async function findById(complaintId) {
  const [rows] = await pool.query(
    `${LIST_SELECT} WHERE c.complaint_id = ?`,
    [complaintId]
  );
  return rows[0] || null;
}

async function getHistory(complaintId) {
  const [rows] = await pool.query(
    `SELECT h.history_id, h.complaint_id, h.old_status, h.new_status,
            h.changed_by, h.remarks, h.changed_at, u.full_name AS changed_by_name
     FROM complaint_status_history h
     LEFT JOIN users u ON u.user_id = h.changed_by
     WHERE h.complaint_id = ?
     ORDER BY h.changed_at ASC, h.history_id ASC`,
    [complaintId]
  );
  return rows;
}

async function getAllocations(complaintId) {
  const [rows] = await pool.query(
    `SELECT a.allocation_id, a.complaint_id, a.resource_id, a.allocated_at,
            a.started_at, a.completed_at, a.allocation_status, a.remarks,
            r.resource_name, r.resource_type, r.registration_or_identifier, r.current_location
     FROM resource_allocations a
     JOIN resources r ON r.resource_id = a.resource_id
     WHERE a.complaint_id = ?
     ORDER BY a.allocated_at DESC`,
    [complaintId]
  );
  return rows;
}

async function queuePosition(complaint) {
  const [overall] = await pool.query(
    `SELECT COUNT(*) AS ahead
     FROM complaints
     WHERE status = 'WAITING'
       AND (
         priority < ?
         OR (priority = ? AND created_at < ?)
         OR (priority = ? AND created_at = ? AND complaint_id < ?)
       )`,
    [
      complaint.priority,
      complaint.priority,
      complaint.created_at,
      complaint.priority,
      complaint.created_at,
      complaint.complaint_id
    ]
  );

  const [typed] = await pool.query(
    `SELECT COUNT(*) AS ahead
     FROM complaints c
     JOIN service_categories sc ON sc.category_id = c.category_id
     WHERE c.status = 'WAITING'
       AND sc.required_resource_type = ?
       AND (
         c.priority < ?
         OR (c.priority = ? AND c.created_at < ?)
         OR (c.priority = ? AND c.created_at = ? AND c.complaint_id < ?)
       )`,
    [
      complaint.required_resource_type,
      complaint.priority,
      complaint.priority,
      complaint.created_at,
      complaint.priority,
      complaint.created_at,
      complaint.complaint_id
    ]
  );

  return {
    overall: overall[0].ahead + 1,
    for_resource_type: typed[0].ahead + 1
  };
}

async function summaryForCitizen(citizenId) {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(status IN ('NEW', 'WAITING')) AS pending,
       SUM(status IN ('ASSIGNED', 'IN_PROGRESS')) AS active,
       SUM(status = 'COMPLETED') AS completed,
       SUM(status = 'CANCELLED') AS cancelled
     FROM complaints
     WHERE citizen_id = ?`,
    [citizenId]
  );
  return normalizeCounts(rows[0]);
}

async function adminStats() {
  const [complaintRows] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'WAITING') AS waiting,
       SUM(status = 'ASSIGNED') AS assigned,
       SUM(status = 'IN_PROGRESS') AS in_progress,
       SUM(status = 'COMPLETED') AS completed,
       SUM(status = 'CANCELLED') AS cancelled,
       SUM(priority = 1 AND status IN ('NEW', 'WAITING', 'ASSIGNED', 'IN_PROGRESS')) AS critical_open
     FROM complaints`
  );
  const [resourceRows] = await pool.query(
    `SELECT
       SUM(status = 'AVAILABLE') AS available,
       SUM(status = 'BUSY') AS busy,
       SUM(status = 'MAINTENANCE') AS maintenance,
       SUM(status = 'OFFLINE') AS offline,
       COUNT(*) AS total
     FROM resources`
  );
  return {
    complaints: normalizeCounts(complaintRows[0]),
    resources: normalizeCounts(resourceRows[0])
  };
}

function normalizeCounts(row) {
  const output = {};
  Object.keys(row || {}).forEach((key) => {
    output[key] = Number(row[key] || 0);
  });
  return output;
}

async function insertHistory(connection, { complaintId, oldStatus, newStatus, changedBy, remarks }) {
  await connection.query(
    `INSERT INTO complaint_status_history
      (complaint_id, old_status, new_status, changed_by, remarks)
     VALUES (?, ?, ?, ?, ?)`,
    [complaintId, oldStatus, newStatus, changedBy || null, remarks || null]
  );
}

module.exports = {
  list,
  findById,
  getHistory,
  getAllocations,
  queuePosition,
  summaryForCitizen,
  adminStats,
  insertHistory
};
