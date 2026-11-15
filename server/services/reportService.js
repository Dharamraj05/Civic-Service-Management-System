const pool = require('../config/db');

async function buildReport() {
  const [byCategory] = await pool.query(
    `SELECT sc.category_id, sc.category_name, COUNT(c.complaint_id) AS total,
            SUM(c.status = 'COMPLETED') AS completed,
            SUM(c.status = 'WAITING') AS waiting
     FROM service_categories sc
     LEFT JOIN complaints c ON c.category_id = sc.category_id
     GROUP BY sc.category_id, sc.category_name
     ORDER BY total DESC, sc.category_name ASC`
  );

  const [byPriority] = await pool.query(
    `SELECT priority, COUNT(*) AS total
     FROM complaints
     GROUP BY priority
     ORDER BY priority ASC`
  );

  const [byStatus] = await pool.query(
    `SELECT status, COUNT(*) AS total
     FROM complaints
     GROUP BY status
     ORDER BY total DESC`
  );

  const [resourceUtilization] = await pool.query(
    `SELECT resource_type, status, COUNT(*) AS total
     FROM resources
     GROUP BY resource_type, status
     ORDER BY resource_type ASC, status ASC`
  );

  const [responseRow] = await pool.query(
    `SELECT ROUND(AVG(response_minutes), 1) AS avg_response_minutes
     FROM (
       SELECT TIMESTAMPDIFF(MINUTE, c.created_at, MIN(a.allocated_at)) AS response_minutes
       FROM complaints c
       JOIN resource_allocations a ON a.complaint_id = c.complaint_id
       WHERE a.allocation_status <> 'CANCELLED'
       GROUP BY c.complaint_id, c.created_at
     ) response_times`
  );

  const [completionRow] = await pool.query(
    `SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, c.created_at, a.completed_at)), 1) AS avg_completion_minutes,
            COUNT(*) AS completed_allocations
     FROM resource_allocations a
     JOIN complaints c ON c.complaint_id = a.complaint_id
     WHERE a.allocation_status = 'COMPLETED' AND a.completed_at IS NOT NULL`
  );

  const [recentCompleted] = await pool.query(
    `SELECT complaint_id, complaint_title, category_name, citizen_name, priority,
            allocated_at, completed_at, resource_name, registration_or_identifier,
            response_minutes, service_minutes
     FROM allocation_report_view
     WHERE allocation_status = 'COMPLETED'
     ORDER BY completed_at DESC
     LIMIT 12`
  );

  return {
    by_category: byCategory.map(numberize),
    by_priority: byPriority.map(numberize),
    by_status: byStatus.map(numberize),
    resource_utilization: resourceUtilization.map(numberize),
    avg_response_minutes: responseRow[0].avg_response_minutes === null
      ? null
      : Number(responseRow[0].avg_response_minutes),
    avg_completion_minutes: completionRow[0].avg_completion_minutes === null
      ? null
      : Number(completionRow[0].avg_completion_minutes),
    completed_allocations: Number(completionRow[0].completed_allocations || 0),
    recent_completed: recentCompleted
  };
}

function numberize(row) {
  const copy = { ...row };
  ['total', 'completed', 'waiting'].forEach((key) => {
    if (copy[key] !== undefined && copy[key] !== null) {
      copy[key] = Number(copy[key]);
    }
  });
  return copy;
}

module.exports = { buildReport };
