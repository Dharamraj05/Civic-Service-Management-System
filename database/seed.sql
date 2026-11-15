
USE csms_db;

INSERT INTO users (user_id, full_name, email, phone, password_hash, role, created_at) VALUES
  (1, 'Ananya Kulkarni', 'admin@csms.gov.in', '9000000001', '$2b$10$fOyGXCFt3Pma.BIRTjHyuOjmmzEDqyVKpNlBZwjlK9GWeZYonLX36', 'ADMIN', '2026-09-01 09:00:00'),
  (2, 'Ravi Kumar', 'ravi.kumar@example.com', '9000000002', '$2b$10$ppmXaQwiIaw1YIXzQ6zUd.XgPea4RmNORjnmCi0c.vB9i2uCumZDe', 'CITIZEN', '2026-09-12 10:15:00'),
  (3, 'Anita Desai', 'anita.desai@example.com', '9000000003', '$2b$10$ppmXaQwiIaw1YIXzQ6zUd.XgPea4RmNORjnmCi0c.vB9i2uCumZDe', 'CITIZEN', '2026-09-18 14:40:00'),
  (4, 'Mohammed Irfan', 'mohammed.irfan@example.com', '9000000004', '$2b$10$ppmXaQwiIaw1YIXzQ6zUd.XgPea4RmNORjnmCi0c.vB9i2uCumZDe', 'CITIZEN', '2026-09-20 08:05:00'),
  (5, 'Priya Nair', 'priya.nair@example.com', '9000000005', '$2b$10$ppmXaQwiIaw1YIXzQ6zUd.XgPea4RmNORjnmCi0c.vB9i2uCumZDe', 'CITIZEN', '2026-09-22 16:20:00'),
  (6, 'Suresh Patil', 'suresh.patil@example.com', '9000000006', '$2b$10$ppmXaQwiIaw1YIXzQ6zUd.XgPea4RmNORjnmCi0c.vB9i2uCumZDe', 'CITIZEN', '2026-09-25 11:10:00'),
  (7, 'Lakshmi Iyer', 'lakshmi.iyer@example.com', '9000000007', '$2b$10$ppmXaQwiIaw1YIXzQ6zUd.XgPea4RmNORjnmCi0c.vB9i2uCumZDe', 'CITIZEN', '2026-10-01 09:45:00');

INSERT INTO departments (department_id, department_name, description) VALUES
  (1, 'Health and Emergency Medical Services', 'Ambulance response for medical emergencies.'),
  (2, 'Water Supply Department', 'Tanker support and drinking-water complaints.'),
  (3, 'Solid Waste Management', 'Garbage collection and debris clearance.'),
  (4, 'Electricity Maintenance', 'Line faults, outages, and street-light repairs.'),
  (5, 'Police and Public Safety', 'Patrol response for civic safety incidents.');

INSERT INTO service_categories (category_id, category_name, department_id, required_resource_type, description) VALUES
  (1, 'Medical Emergency', 1, 'Ambulance', 'Critical and non-critical medical transport.'),
  (2, 'Water Supply', 2, 'Water Tanker', 'Tanker supply when municipal water fails.'),
  (3, 'Garbage Collection', 3, 'Garbage Truck', 'Missed pickup, overflow, and illegal dumping.'),
  (4, 'Electricity Repair', 4, 'Electricity Repair Team', 'Power failure and unsafe electrical faults.'),
  (5, 'Police Assistance', 5, 'Police Patrol Vehicle', 'Public safety incidents that need a patrol vehicle.');

INSERT INTO resources
  (resource_id, department_id, resource_name, resource_type, registration_or_identifier, status, current_location, created_at)
VALUES
  (1, 1, 'City Ambulance 1', 'Ambulance', 'AMB-101', 'AVAILABLE', 'Hadapsar Depot', '2026-09-01 09:00:00'),
  (2, 1, 'City Ambulance 2', 'Ambulance', 'AMB-102', 'AVAILABLE', 'Kothrud Depot', '2026-09-01 09:00:00'),
  (3, 1, 'City Ambulance 3', 'Ambulance', 'AMB-103', 'BUSY', 'Shivajinagar Clinic', '2026-09-01 09:00:00'),
  (4, 2, 'Tanker Narmada', 'Water Tanker', 'WT-201', 'AVAILABLE', 'Kothrud Filling Station', '2026-09-01 09:00:00'),
  (5, 2, 'Tanker Godavari', 'Water Tanker', 'WT-202', 'MAINTENANCE', 'Pimpri Workshop', '2026-09-01 09:00:00'),
  (6, 2, 'Tanker Krishna', 'Water Tanker', 'WT-203', 'AVAILABLE', 'Baner Filling Station', '2026-09-01 09:00:00'),
  (7, 3, 'Compactor 1', 'Garbage Truck', 'GT-301', 'AVAILABLE', 'Deccan Yard', '2026-09-01 09:00:00'),
  (8, 3, 'Compactor 2', 'Garbage Truck', 'GT-302', 'OFFLINE', 'Hadapsar Yard', '2026-09-01 09:00:00'),
  (9, 3, 'Compactor 3', 'Garbage Truck', 'GT-303', 'AVAILABLE', 'Kothrud Yard', '2026-09-01 09:00:00'),
  (10, 4, 'Line Crew A', 'Electricity Repair Team', 'ET-401', 'BUSY', 'Camp — MG Road', '2026-09-01 09:00:00'),
  (11, 4, 'Line Crew B', 'Electricity Repair Team', 'ET-402', 'AVAILABLE', 'Substation A, Shivajinagar', '2026-09-01 09:00:00'),
  (12, 4, 'Line Crew C', 'Electricity Repair Team', 'ET-403', 'AVAILABLE', 'Substation B, Hadapsar', '2026-09-01 09:00:00'),
  (13, 5, 'Patrol Van 1', 'Police Patrol Vehicle', 'PV-501', 'AVAILABLE', 'Police Headquarters', '2026-09-01 09:00:00'),
  (14, 5, 'Patrol Van 2', 'Police Patrol Vehicle', 'PV-502', 'AVAILABLE', 'Kothrud Chowki', '2026-09-01 09:00:00'),
  (15, 5, 'Patrol Van 3', 'Police Patrol Vehicle', 'PV-503', 'MAINTENANCE', 'Police Workshop', '2026-09-01 09:00:00');

INSERT INTO complaints
  (complaint_id, citizen_id, category_id, title, description, address, latitude, longitude, priority, status, created_at, updated_at)
VALUES
  (1, 2, 1, 'Road accident victim needs an ambulance',
    'A two-wheeler rider is injured near the signal and is conscious but unable to stand.',
    'JM Road signal, Shivajinagar', 18.5236000, 73.8478000, 1, 'WAITING', '2026-10-14 08:05:00', '2026-10-14 08:05:01'),
  (2, 3, 1, 'Severe breathing difficulty at home',
    'Elderly resident has sudden breathing trouble. Family has requested urgent medical transport.',
    'Flat 12, Baner Residency, Baner', 18.5590000, 73.7868000, 1, 'WAITING', '2026-10-14 08:20:00', '2026-10-14 08:20:01'),
  (3, 2, 5, 'Chain snatching near the market',
    'A patrol vehicle is requested. The incident happened minutes ago and the injured person is with a shopkeeper.',
    'Tulshibaug market lane, Budhwar Peth', 18.5142000, 73.8567000, 1, 'WAITING', '2026-10-14 09:10:00', '2026-10-14 09:10:01'),
  (4, 4, 2, 'No municipal water since last night',
    'The society sump is empty and there is no supply for drinking or toilets.',
    'Green Park Society, Kothrud', 18.5074000, 73.8077000, 2, 'WAITING', '2026-10-14 07:40:00', '2026-10-14 07:40:01'),
  (5, 5, 2, 'Low pressure in the overhead line',
    'Only the ground floor receives a trickle of water. Upper floors have none.',
    'Lane 4, Hadapsar Gaon', 18.5018000, 73.9256000, 2, 'WAITING', '2026-10-14 10:15:00', '2026-10-14 10:15:01'),
  (6, 6, 3, 'Garbage not collected for four days',
    'Community bins are overflowing onto the footpath.',
    'Sahakar Nagar, lane 7', 18.4872000, 73.8489000, 3, 'WAITING', '2026-10-13 16:00:00', '2026-10-13 16:00:01'),
  (7, 4, 1, 'Minor injury, non-critical medical help',
    'A worker has a cut that needs transport, but the person is stable and seated.',
    'Warehouse 3, Bhosari MIDC', 18.6201000, 73.8402000, 3, 'WAITING', '2026-10-14 11:00:00', '2026-10-14 11:00:01'),
  (8, 7, 4, 'Street light out on the school road',
    'Two poles have been dark for a week. This is not an active electrical hazard.',
    'School Road, Aundh', 18.5589000, 73.8073000, 4, 'WAITING', '2026-10-12 09:00:00', '2026-10-12 09:00:01'),
  (9, 3, 1, 'Clinic transfer for a stabilised patient',
    'A nursing home has asked for an ambulance to move a patient who is stable.',
    'Shivajinagar Nursing Home', 18.5307000, 73.8470000, 2, 'ASSIGNED', '2026-10-14 06:30:00', '2026-10-14 06:45:00'),
  (10, 4, 4, 'Live wire down after the storm',
    'A snapped conductor is on the footpath. Residents have been asked to stay clear.',
    'MG Road, near Camp post office', 18.5163000, 73.8762000, 1, 'IN_PROGRESS', '2026-10-14 05:00:00', '2026-10-14 05:25:00'),
  (11, 5, 3, 'Overflowing community bin',
    'The bin at the corner of the lane was cleared by the assigned truck.',
    'Deccan Gymkhana, lane 2', 18.5168000, 73.8409000, 3, 'COMPLETED', '2026-10-13 08:00:00', '2026-10-13 11:30:00'),
  (12, 6, 2, 'Society sump is empty',
    'A tanker was sent and the sump was filled.',
    'Prabhat Road society gate', 18.5136000, 73.8304000, 2, 'COMPLETED', '2026-10-12 11:00:00', '2026-10-12 13:00:00'),
  (13, 7, 5, 'Noise complaint withdrawn',
    'The citizen cancelled this request before a patrol vehicle was assigned.',
    'Model Colony, lane 5', 18.5312000, 73.8445000, 4, 'CANCELLED', '2026-10-11 14:00:00', '2026-10-11 15:10:00'),
  (14, 2, 3, 'Construction debris blocking the lane',
    'A heap of debris is blocking a narrow lane used by ambulances and school vans.',
    'Kasba Peth, lane behind the post office', 18.5188000, 73.8561000, 2, 'WAITING', '2026-10-14 12:30:00', '2026-10-14 12:30:01');

INSERT INTO resource_allocations
  (allocation_id, complaint_id, resource_id, allocated_at, started_at, completed_at, allocation_status, allocated_by, remarks)
VALUES
  (1, 9, 3, '2026-10-14 06:45:00', NULL, NULL, 'ALLOCATED', 1, 'Manual allocation by administrator'),
  (2, 10, 10, '2026-10-14 05:10:00', '2026-10-14 05:25:00', NULL, 'IN_PROGRESS', 1, 'Automatic priority scheduling'),
  (3, 11, 7, '2026-10-13 08:40:00', '2026-10-13 09:00:00', '2026-10-13 11:30:00', 'COMPLETED', 1, 'Service completed. Resource released.'),
  (4, 12, 4, '2026-10-12 11:20:00', '2026-10-12 11:30:00', '2026-10-12 13:00:00', 'COMPLETED', 1, 'Service completed. Resource released.');

INSERT INTO complaint_status_history
  (complaint_id, old_status, new_status, changed_by, remarks, changed_at)
VALUES
  (1, NULL, 'NEW', 2, 'Complaint submitted', '2026-10-14 08:05:00'),
  (1, 'NEW', 'WAITING', 2, 'Entered the priority queue', '2026-10-14 08:05:01'),
  (2, NULL, 'NEW', 3, 'Complaint submitted', '2026-10-14 08:20:00'),
  (2, 'NEW', 'WAITING', 3, 'Entered the priority queue', '2026-10-14 08:20:01'),
  (3, NULL, 'NEW', 2, 'Complaint submitted', '2026-10-14 09:10:00'),
  (3, 'NEW', 'WAITING', 2, 'Entered the priority queue', '2026-10-14 09:10:01'),
  (4, NULL, 'NEW', 4, 'Complaint submitted', '2026-10-14 07:40:00'),
  (4, 'NEW', 'WAITING', 4, 'Entered the priority queue', '2026-10-14 07:40:01'),
  (5, NULL, 'NEW', 5, 'Complaint submitted', '2026-10-14 10:15:00'),
  (5, 'NEW', 'WAITING', 5, 'Entered the priority queue', '2026-10-14 10:15:01'),
  (6, NULL, 'NEW', 6, 'Complaint submitted', '2026-10-13 16:00:00'),
  (6, 'NEW', 'WAITING', 6, 'Entered the priority queue', '2026-10-13 16:00:01'),
  (7, NULL, 'NEW', 4, 'Complaint submitted', '2026-10-14 11:00:00'),
  (7, 'NEW', 'WAITING', 4, 'Entered the priority queue', '2026-10-14 11:00:01'),
  (8, NULL, 'NEW', 7, 'Complaint submitted', '2026-10-12 09:00:00'),
  (8, 'NEW', 'WAITING', 7, 'Entered the priority queue', '2026-10-12 09:00:01'),
  (9, NULL, 'NEW', 3, 'Complaint submitted', '2026-10-14 06:30:00'),
  (9, 'NEW', 'WAITING', 3, 'Entered the priority queue', '2026-10-14 06:30:01'),
  (9, 'WAITING', 'ASSIGNED', 1, 'Resource AMB-103 allocated', '2026-10-14 06:45:00'),
  (10, NULL, 'NEW', 4, 'Complaint submitted', '2026-10-14 05:00:00'),
  (10, 'NEW', 'WAITING', 4, 'Entered the priority queue', '2026-10-14 05:00:01'),
  (10, 'WAITING', 'ASSIGNED', 1, 'Resource ET-401 allocated', '2026-10-14 05:10:00'),
  (10, 'ASSIGNED', 'IN_PROGRESS', 1, 'Service started', '2026-10-14 05:25:00'),
  (11, NULL, 'NEW', 5, 'Complaint submitted', '2026-10-13 08:00:00'),
  (11, 'NEW', 'WAITING', 5, 'Entered the priority queue', '2026-10-13 08:00:01'),
  (11, 'WAITING', 'ASSIGNED', 1, 'Resource GT-301 allocated', '2026-10-13 08:40:00'),
  (11, 'ASSIGNED', 'IN_PROGRESS', 1, 'Service started', '2026-10-13 09:00:00'),
  (11, 'IN_PROGRESS', 'COMPLETED', 1, 'Service completed. Resource released and marked AVAILABLE.', '2026-10-13 11:30:00'),
  (12, NULL, 'NEW', 6, 'Complaint submitted', '2026-10-12 11:00:00'),
  (12, 'NEW', 'WAITING', 6, 'Entered the priority queue', '2026-10-12 11:00:01'),
  (12, 'WAITING', 'ASSIGNED', 1, 'Resource WT-201 allocated', '2026-10-12 11:20:00'),
  (12, 'ASSIGNED', 'IN_PROGRESS', 1, 'Service started', '2026-10-12 11:30:00'),
  (12, 'IN_PROGRESS', 'COMPLETED', 1, 'Service completed. Resource released and marked AVAILABLE.', '2026-10-12 13:00:00'),
  (13, NULL, 'NEW', 7, 'Complaint submitted', '2026-10-11 14:00:00'),
  (13, 'NEW', 'WAITING', 7, 'Entered the priority queue', '2026-10-11 14:00:01'),
  (13, 'WAITING', 'CANCELLED', 7, 'Complaint cancelled', '2026-10-11 15:10:00'),
  (14, NULL, 'NEW', 2, 'Complaint submitted', '2026-10-14 12:30:00'),
  (14, 'NEW', 'WAITING', 2, 'Entered the priority queue', '2026-10-14 12:30:01');

ALTER TABLE users AUTO_INCREMENT = 8;
ALTER TABLE departments AUTO_INCREMENT = 6;
ALTER TABLE service_categories AUTO_INCREMENT = 6;
ALTER TABLE resources AUTO_INCREMENT = 16;
ALTER TABLE complaints AUTO_INCREMENT = 15;
ALTER TABLE resource_allocations AUTO_INCREMENT = 5;
ALTER TABLE complaint_status_history AUTO_INCREMENT = 100;
