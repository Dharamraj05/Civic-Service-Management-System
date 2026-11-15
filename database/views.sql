

USE csms_db;

CREATE OR REPLACE VIEW active_complaints_view AS
SELECT
  c.complaint_id,
  c.title,
  c.priority,
  c.status,
  c.address,
  c.created_at,
  u.full_name AS citizen_name,
  u.phone AS citizen_phone,
  sc.category_name,
  sc.required_resource_type,
  d.department_name
FROM complaints c
JOIN users u ON u.user_id = c.citizen_id
JOIN service_categories sc ON sc.category_id = c.category_id
JOIN departments d ON d.department_id = sc.department_id
WHERE c.status IN ('NEW', 'WAITING', 'ASSIGNED', 'IN_PROGRESS');

CREATE OR REPLACE VIEW available_resources_view AS
SELECT
  r.resource_id,
  r.resource_name,
  r.resource_type,
  r.registration_or_identifier,
  r.current_location,
  r.status,
  d.department_id,
  d.department_name
FROM resources r
JOIN departments d ON d.department_id = r.department_id
WHERE r.status = 'AVAILABLE';

CREATE OR REPLACE VIEW allocation_report_view AS
SELECT
  a.allocation_id,
  a.allocation_status,
  a.allocated_at,
  a.started_at,
  a.completed_at,
  c.complaint_id,
  c.title AS complaint_title,
  c.priority,
  c.status AS complaint_status,
  c.created_at AS complaint_created_at,
  r.resource_id,
  r.resource_name,
  r.resource_type,
  r.registration_or_identifier,
  u.full_name AS citizen_name,
  sc.category_name,
  TIMESTAMPDIFF(MINUTE, c.created_at, a.allocated_at) AS response_minutes,
  TIMESTAMPDIFF(MINUTE, a.allocated_at, a.completed_at) AS service_minutes
FROM resource_allocations a
JOIN complaints c ON c.complaint_id = a.complaint_id
JOIN resources r ON r.resource_id = a.resource_id
JOIN users u ON u.user_id = c.citizen_id
JOIN service_categories sc ON sc.category_id = c.category_id;

-- Same ordering rule as the allocation engine:
-- smaller priority number first, then earlier created_at (FCFS), then smaller id.
CREATE OR REPLACE VIEW priority_queue_view AS
SELECT
  c.complaint_id,
  c.title,
  c.priority,
  c.status,
  c.created_at,
  u.full_name AS citizen_name,
  sc.category_name,
  sc.required_resource_type,
  (
    SELECT COUNT(*)
    FROM resources r
    WHERE r.resource_type = sc.required_resource_type
      AND r.status = 'AVAILABLE'
  ) AS available_resource_count
FROM complaints c
JOIN users u ON u.user_id = c.citizen_id
JOIN service_categories sc ON sc.category_id = c.category_id
WHERE c.status = 'WAITING'
ORDER BY c.priority ASC, c.created_at ASC, c.complaint_id ASC
LIMIT 100000;
