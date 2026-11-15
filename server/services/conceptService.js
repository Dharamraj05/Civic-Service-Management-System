const pool = require('../config/db');
const allocationService = require('./allocationService');

async function getSnapshot() {
  const [[counts]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM departments) AS departments,
      (SELECT COUNT(*) FROM service_categories) AS service_categories,
      (SELECT COUNT(*) FROM complaints) AS complaints,
      (SELECT COUNT(*) FROM resources) AS resources,
      (SELECT COUNT(*) FROM resource_allocations) AS resource_allocations,
      (SELECT COUNT(*) FROM complaint_status_history) AS complaint_status_history,
      (SELECT COUNT(*) FROM complaint_evidence) AS complaint_evidence,
      (SELECT COUNT(*) FROM complaint_flags) AS complaint_flags
  `);

  const [relationships] = await pool.query(`
    SELECT
      u.user_id, u.full_name, u.email, u.role,
      c.complaint_id, c.title, c.priority, c.status, c.created_at,
      sc.category_name, sc.required_resource_type,
      d.department_id, d.department_name,
      a.allocation_id, a.allocation_status, a.allocated_at,
      r.resource_id, r.resource_name, r.registration_or_identifier, r.status AS resource_status
    FROM complaints c
    JOIN users u ON u.user_id = c.citizen_id
    JOIN service_categories sc ON sc.category_id = c.category_id
    JOIN departments d ON d.department_id = sc.department_id
    LEFT JOIN resource_allocations a
      ON a.allocation_id = (
        SELECT a2.allocation_id FROM resource_allocations a2
        WHERE a2.complaint_id = c.complaint_id
        ORDER BY a2.allocated_at DESC, a2.allocation_id DESC
        LIMIT 1
      )
    LEFT JOIN resources r ON r.resource_id = a.resource_id
    ORDER BY c.complaint_id DESC
    LIMIT 8
  `);

  const [queue] = await pool.query(`
    SELECT complaint_id, title, priority, status, created_at, citizen_name,
           category_name, required_resource_type, available_resource_count
    FROM priority_queue_view
    ORDER BY priority ASC, created_at ASC, complaint_id ASC
  `);

  const [available] = await pool.query(`
    SELECT resource_id, resource_name, resource_type, registration_or_identifier, status, department_name
    FROM available_resources_view
    ORDER BY resource_type, resource_id
    LIMIT 20
  `);

  const [allocations] = await pool.query(`
    SELECT allocation_id, complaint_id, complaint_title, priority, resource_name,
           registration_or_identifier, allocation_status, allocated_at, completed_at, citizen_name
    FROM allocation_report_view
    ORDER BY allocated_at DESC
    LIMIT 10
  `);

  const [history] = await pool.query(`
    SELECT history_id, complaint_id, old_status, new_status, remarks, changed_at
    FROM complaint_status_history
    ORDER BY changed_at DESC, history_id DESC
    LIMIT 12
  `);

  const queueWithPosition = queue.map((row, index) => ({
    ...row,
    queue_position: index + 1,
    available_resource_count: Number(row.available_resource_count)
  }));

  return {
    table_counts: Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number(value)])),
    relationships,
    views: {
      priority_queue_view: queueWithPosition,
      available_resources_view: available,
      allocation_report_view: allocations
    },
    status_history: history,
    queue: await allocationService.getPriorityQueue()
  };
}

module.exports = { getSnapshot };
