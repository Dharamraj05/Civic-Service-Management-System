-- Queries to open in MySQL Workbench during the viva.
-- They match the rules used by server/services/allocationService.js.

USE csms_db;

-- 1. Priority queue: priority scheduling, then FCFS.
SELECT *
FROM priority_queue_view;

-- 2. Active complaints with the department that owns the service (JOIN).
SELECT *
FROM active_complaints_view
ORDER BY priority ASC, created_at ASC;

-- 3. Free resources only.
SELECT *
FROM available_resources_view
ORDER BY resource_type, resource_id;

-- 4. Allocation report, including response time in minutes.
SELECT *
FROM allocation_report_view
ORDER BY allocated_at DESC;

-- 5. Complaints by category (aggregation).
SELECT sc.category_name, COUNT(c.complaint_id) AS total
FROM service_categories sc
LEFT JOIN complaints c ON c.category_id = sc.category_id
GROUP BY sc.category_id, sc.category_name
ORDER BY total DESC;

-- 6. Show that a busy resource has exactly one open allocation.
SELECT r.registration_or_identifier, r.status, a.allocation_id, a.allocation_status, a.complaint_id
FROM resources r
LEFT JOIN resource_allocations a
  ON a.resource_id = r.resource_id
 AND a.allocation_status IN ('ALLOCATED', 'IN_PROGRESS')
ORDER BY r.resource_id;
