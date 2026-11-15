-- Safe add-on for an existing csms_db. Does not drop tables or seed data.
-- Run once in MySQL Workbench after the original schema.
-- New installs already get these tables from schema.sql.

USE csms_db;

CREATE TABLE IF NOT EXISTS complaint_evidence (
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

CREATE TABLE IF NOT EXISTS complaint_flags (
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
