-- =====================================================================
-- Road Accident Reporting System - Database Schema (MySQL / MariaDB)
-- Owner: Leonardo, Vince (Database Designer)
--
-- HOW TO IMPORT (phpMyAdmin / XAMPP):
--   1. Create an empty database named  road_accident_db  (utf8mb4_general_ci)
--   2. Select it, open the Import tab, import this file
--   3. Then import seed.sql (sample accounts and reports)
--
-- This file has NO "CREATE DATABASE" / "USE" lines on purpose, so it also
-- imports on shared hosting where you can't create databases from SQL.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW  IF EXISTS official_accident_records;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS officer_remarks;
DROP TABLE IF EXISTS report_status_history;
DROP TABLE IF EXISTS report_photos;
DROP TABLE IF EXISTS report_vehicles;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS accident_types;
DROP TABLE IF EXISTS emergency_contacts;
DROP TABLE IF EXISTS api_tokens;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Users: one table, three roles (FR-01, FR-02, FR-13)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name      VARCHAR(120) NOT NULL,
  email          VARCHAR(150) NOT NULL,
  phone          VARCHAR(20)  NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('reporter','admin','officer') NOT NULL DEFAULT 'reporter',
  badge_no       VARCHAR(30)  NULL COMMENT 'Officers only',
  status         ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Login tokens (works for both the React web app and the Flutter app).
-- Only a SHA-256 hash of the token is stored, never the token itself.
-- ---------------------------------------------------------------------
CREATE TABLE api_tokens (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  token_hash    CHAR(64) NOT NULL,
  device        VARCHAR(20) NULL COMMENT 'web or mobile',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME NOT NULL,
  last_used_at  DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_token_hash (token_hash),
  KEY idx_tokens_user (user_id),
  CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Accident categories, managed by the admin
-- ---------------------------------------------------------------------
CREATE TABLE accident_types (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(60) NOT NULL,
  description  VARCHAR(255) NULL,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_type_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Accident reports (section 5 of the brief: every required field)
--
-- PUBLIC REPORT vs OFFICIAL RECORD:
--   Every row starts as a public-submitted report (status 'submitted').
--   It becomes an officially verified accident record only when an admin
--   verifies it: verified_by + verified_at are filled in.
--   Official statistics must use the view official_accident_records below.
-- ---------------------------------------------------------------------
CREATE TABLE reports (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_code          VARCHAR(20) NULL COMMENT 'e.g. RA-2026-000123, set right after insert',
  reporter_id          INT UNSIGNED NULL,
  reporter_name        VARCHAR(120) NULL,
  contact_info         VARCHAR(150) NULL,
  accident_date        DATE NOT NULL,
  accident_time        TIME NOT NULL,
  location_text        VARCHAR(255) NOT NULL COMMENT 'Road, street or landmark',
  barangay             VARCHAR(100) NULL,
  municipality         VARCHAR(100) NULL,
  latitude             DECIMAL(10,7) NULL,
  longitude            DECIMAL(10,7) NULL,
  accident_type_id     INT UNSIGNED NOT NULL,
  injury_status        ENUM('none','injuries','fatalities','unknown') NOT NULL DEFAULT 'unknown',
  description          TEXT NOT NULL,
  status               ENUM('submitted','under_review','info_required','verified',
                            'assigned','in_progress','resolved','rejected')
                       NOT NULL DEFAULT 'submitted',
  rejection_reason     VARCHAR(255) NULL,
  verified_by          INT UNSIGNED NULL,
  verified_at          DATETIME NULL,
  assigned_officer_id  INT UNSIGNED NULL,
  is_flagged           TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Possible duplicate or incomplete',
  flag_reason          VARCHAR(255) NULL,
  duplicate_of         INT UNSIGNED NULL,
  source               ENUM('web','mobile') NOT NULL DEFAULT 'web',
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date submitted',
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_report_code (report_code),
  KEY idx_reports_status (status),
  KEY idx_reports_date (accident_date),
  KEY idx_reports_type (accident_type_id),
  KEY idx_reports_municipality (municipality),
  KEY idx_reports_reporter (reporter_id),
  KEY idx_reports_officer (assigned_officer_id),
  CONSTRAINT fk_reports_reporter  FOREIGN KEY (reporter_id)         REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_type      FOREIGN KEY (accident_type_id)    REFERENCES accident_types(id),
  CONSTRAINT fk_reports_verifier  FOREIGN KEY (verified_by)         REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_officer   FOREIGN KEY (assigned_officer_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_duplicate FOREIGN KEY (duplicate_of)        REFERENCES reports(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vehicles involved: type and number of vehicles
CREATE TABLE report_vehicles (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id     INT UNSIGNED NOT NULL,
  vehicle_type  VARCHAR(40) NOT NULL COMMENT 'Car, Motorcycle, Jeepney, Tricycle, Truck, Bus, Bicycle, Other',
  quantity      TINYINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_vehicles_report (report_id),
  CONSTRAINT fk_vehicles_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Photo evidence (FR-05). Files live in api/uploads/, served only through the API.
CREATE TABLE report_photos (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id      INT UNSIGNED NOT NULL,
  file_path      VARCHAR(255) NOT NULL COMMENT 'Relative to api/uploads/',
  original_name  VARCHAR(255) NULL,
  mime_type      VARCHAR(50)  NOT NULL,
  size_bytes     INT UNSIGNED NOT NULL,
  uploaded_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_photos_report (report_id),
  CONSTRAINT fk_photos_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Every status change, shown as the tracking timeline (FR-06, FR-14)
CREATE TABLE report_status_history (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id    INT UNSIGNED NOT NULL,
  from_status  VARCHAR(20) NULL,
  to_status    VARCHAR(20) NOT NULL,
  changed_by   INT UNSIGNED NULL,
  note         VARCHAR(255) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_history_report (report_id),
  CONSTRAINT fk_history_report FOREIGN KEY (report_id)  REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user   FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Officer remarks, findings and actions taken (Traffic Officer role)
CREATE TABLE officer_remarks (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id    INT UNSIGNED NOT NULL,
  officer_id   INT UNSIGNED NULL,
  remark_type  ENUM('remark','finding','action') NOT NULL DEFAULT 'remark',
  content      TEXT NOT NULL,
  is_internal  TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = hidden from the reporter',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_remarks_report (report_id),
  CONSTRAINT fk_remarks_report  FOREIGN KEY (report_id)  REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_remarks_officer FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- In-app notifications (FR-09)
CREATE TABLE notifications (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  report_id   INT UNSIGNED NULL,
  title       VARCHAR(120) NOT NULL,
  message     VARCHAR(255) NOT NULL,
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_user (user_id, is_read),
  CONSTRAINT fk_notif_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_notif_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit trail of important actions (FR-14)
CREATE TABLE audit_logs (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NULL,
  action       VARCHAR(60) NOT NULL COMMENT 'e.g. report.create, report.status, user.update',
  entity_type  VARCHAR(30) NULL,
  entity_id    INT UNSIGNED NULL,
  details      TEXT NULL COMMENT 'JSON text',
  ip_address   VARCHAR(45) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_created (created_at),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Emergency contacts shown on the mobile home screen
CREATE TABLE emergency_contacts (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(30)  NOT NULL,
  category   VARCHAR(40)  NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- System settings (key/value), managed by the admin
CREATE TABLE settings (
  setting_key    VARCHAR(60) NOT NULL,
  setting_value  VARCHAR(255) NULL,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Officially verified accident records only (use this for statistics,
-- dashboard counts of "official" accidents, and accident-prone areas)
-- ---------------------------------------------------------------------
CREATE VIEW official_accident_records AS
SELECT r.*
FROM reports r
WHERE r.verified_at IS NOT NULL
  AND r.status IN ('verified','assigned','in_progress','resolved');
