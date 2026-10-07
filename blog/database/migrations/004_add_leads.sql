-- Adds the leads table: emails (and results) left in the website's toolkit
-- calculators, saved by lead.php and listed in admin/leads.php. Needed once
-- on an existing database — a fresh install via schema.sql already has it.

USE core9_blog;

CREATE TABLE IF NOT EXISTS leads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  first_name VARCHAR(80) NULL,
  last_name VARCHAR(80) NULL,
  company VARCHAR(160) NULL,
  phone VARCHAR(40) NULL,
  tool VARCHAR(80) NOT NULL,
  action VARCHAR(80) NOT NULL,
  details TEXT NULL,
  page_url VARCHAR(255) NULL,
  ip_hash CHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_leads_created (created_at),
  INDEX idx_leads_ip (ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
