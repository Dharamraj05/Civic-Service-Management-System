

CREATE DATABASE IF NOT EXISTS csms_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE csms_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP VIEW IF EXISTS priority_queue_view;
DROP VIEW IF EXISTS allocation_report_view;
DROP VIEW IF EXISTS available_resources_view;
DROP VIEW IF EXISTS active_complaints_view;
DROP TABLE IF EXISTS complaint_flags;
DROP TABLE IF EXISTS complaint_evidence;
DROP TABLE IF EXISTS complaint_status_history;
DROP TABLE IF EXISTS resource_allocations;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS service_categories;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('CITIZEN', 'ADMIN') NOT NULL DEFAULT 'CITIZEN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_phone UNIQUE (phone),
  CONSTRAINT chk_users_role CHECK (role IN ('CITIZEN', 'ADMIN'))
) ENGINE=InnoDB;

CREATE TABLE departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_departments_name UNIQUE (department_name)
) ENGINE=InnoDB;

CREATE TABLE service_categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(120) NOT NULL,
  department_id INT NOT NULL,
  required_resource_type VARCHAR(80) NOT NULL,
  description VARCHAR(500) NULL,
  CONSTRAINT uq_categories_name UNIQUE (category_name),
  CONSTRAINT fk_categories_department
    FOREIGN KEY (department_id) REFERENCES departments (department_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE complaints (
  complaint_id INT AUTO_INCREMENT PRIMARY KEY,
  citizen_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  priority TINYINT NOT NULL,
  status ENUM(
    'NEW',
    'WAITING',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'NEW',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_complaints_priority CHECK (priority BETWEEN 1 AND 4),
  CONSTRAINT chk_complaints_latitude CHECK (
    latitude IS NULL OR (latitude BETWEEN -90 AND 90)
  ),
  CONSTRAINT chk_complaints_longitude CHECK (
    longitude IS NULL OR (longitude BETWEEN -180 AND 180)
  ),
  CONSTRAINT fk_complaints_citizen
    FOREIGN KEY (citizen_id) REFERENCES users (user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_complaints_category
    FOREIGN KEY (category_id) REFERENCES service_categories (category_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_complaints_queue ON complaints (status, priority, created_at, complaint_id);
CREATE INDEX idx_complaints_citizen ON complaints (citizen_id);
CREATE INDEX idx_complaints_category ON complaints (category_id);

CREATE TABLE resources (
  resource_id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  resource_name VARCHAR(120) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  registration_or_identifier VARCHAR(60) NOT NULL,
  status ENUM('AVAILABLE', 'BUSY', 'MAINTENANCE', 'OFFLINE') NOT NULL DEFAULT 'AVAILABLE',
  current_location VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_resources_identifier UNIQUE (registration_or_identifier),
  CONSTRAINT fk_resources_department
    FOREIGN KEY (department_id) REFERENCES departments (department_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_resources_lookup ON resources (resource_type, status);

CREATE TABLE resource_allocations (
  allocation_id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  resource_id INT NOT NULL,
  allocated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  allocation_status ENUM(
    'ALLOCATED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'REASSIGNED'
  ) NOT NULL DEFAULT 'ALLOCATED',
  allocated_by INT NULL,
  remarks VARCHAR(255) NULL,
 
  active_resource_lock INT GENERATED ALWAYS AS (
    CASE
      WHEN allocation_status IN ('ALLOCATED', 'IN_PROGRESS') THEN resource_id
      ELSE NULL
    END
  ) STORED,
  active_complaint_lock INT GENERATED ALWAYS AS (
    CASE
      WHEN allocation_status IN ('ALLOCATED', 'IN_PROGRESS') THEN complaint_id
      ELSE NULL
    END
  ) STORED,
  CONSTRAINT uq_one_active_resource UNIQUE (active_resource_lock),
  CONSTRAINT uq_one_active_complaint UNIQUE (active_complaint_lock),
  CONSTRAINT fk_alloc_complaint
    FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  CONSTRAINT fk_alloc_resource
    FOREIGN KEY (resource_id) REFERENCES resources (resource_id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  CONSTRAINT fk_alloc_user
    FOREIGN KEY (allocated_by) REFERENCES users (user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_alloc_complaint ON resource_allocations (complaint_id);
CREATE INDEX idx_alloc_resource ON resource_allocations (resource_id);
CREATE INDEX idx_alloc_status ON resource_allocations (allocation_status);

CREATE TABLE complaint_status_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  old_status ENUM(
    'NEW',
    'WAITING',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  ) NULL,
  new_status ENUM(
    'NEW',
    'WAITING',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  ) NOT NULL,
  changed_by INT NULL,
  remarks VARCHAR(255) NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_complaint
    FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_history_user
    FOREIGN KEY (changed_by) REFERENCES users (user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_history_complaint ON complaint_status_history (complaint_id, changed_at);

CREATE TABLE complaint_evidence (
  evidence_id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(80) NOT NULL,
  file_size INT NOT NULL,
  uploaded_by INT NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evidence_complaint
    FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_evidence_user
    FOREIGN KEY (uploaded_by) REFERENCES users (user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_evidence_complaint ON complaint_evidence (complaint_id, uploaded_at);

CREATE TABLE complaint_flags (
  flag_id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  flagged_by INT NOT NULL,
  flag_type ENUM(
    'WRONG_PHOTO',
    'WRONG_INFORMATION',
    'INSUFFICIENT_EVIDENCE',
    'OTHER'
  ) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  citizen_email VARCHAR(150) NOT NULL,
  email_status ENUM('SENT', 'LOGGED', 'NOT_CONFIGURED', 'FAILED') NOT NULL,
  email_subject VARCHAR(200) NOT NULL,
  email_preview TEXT NULL,
  flagged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_flags_complaint
    FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_flags_user
    FOREIGN KEY (flagged_by) REFERENCES users (user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_flags_complaint ON complaint_flags (complaint_id, flagged_at);
