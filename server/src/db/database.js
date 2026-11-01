const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbPath = path.resolve(__dirname, '../../campuslink.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high reliability
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reg_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      branch TEXT NOT NULL,
      discipline TEXT DEFAULT 'Engineering & Technology',
      college TEXT DEFAULT 'Apex Institute of Technology',
      year INTEGER NOT NULL,
      passout_batch INTEGER NOT NULL,
      cgpa REAL NOT NULL,
      backlog_count INTEGER NOT NULL DEFAULT 0,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_master_id INTEGER UNIQUE NOT NULL,
      photo_url TEXT,
      linkedin TEXT,
      github TEXT,
      phone TEXT,
      cv_file_name TEXT,
      cv_text TEXT,
      confirmed_skills TEXT DEFAULT '[]',
      projects TEXT DEFAULT '[]',
      certifications TEXT DEFAULT '[]',
      internships TEXT DEFAULT '[]',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_master_id) REFERENCES student_master(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS company (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo TEXT,
      website TEXT,
      description TEXT,
      hr_contact TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'RequestSent', -- 'RequestSent', 'Approved', 'Declined'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vacancy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      description TEXT,
      required_skills TEXT NOT NULL DEFAULT '[]', -- JSON array of skill names
      allowed_branches TEXT NOT NULL DEFAULT '[]', -- JSON array
      min_cgpa REAL NOT NULL DEFAULT 6.0,
      backlog_rule TEXT NOT NULL DEFAULT 'NotAllowed', -- 'NotAllowed', 'AllowedUpToN'
      max_backlogs INTEGER NOT NULL DEFAULT 0,
      ctc TEXT NOT NULL,
      openings INTEGER NOT NULL DEFAULT 1,
      open_date TEXT NOT NULL,
      close_date TEXT NOT NULL,
      rounds TEXT NOT NULL DEFAULT '[]', -- JSON array of { name, date, time, mode, venue }
      status TEXT NOT NULL DEFAULT 'Open', -- 'Draft', 'Open', 'Closed'
      virtual_date TEXT, -- Per-job demo clock date (YYYY-MM-DD)
      demo_now TEXT, -- Nullable per-job demo clock (YYYY-MM-DD)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS application (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_master_id INTEGER NOT NULL,
      vacancy_id INTEGER NOT NULL,
      match_percent REAL NOT NULL DEFAULT 0,
      matched_skills TEXT NOT NULL DEFAULT '[]',
      missing_skills TEXT NOT NULL DEFAULT '[]',
      readiness_level TEXT NOT NULL DEFAULT 'Not Ready',
      status TEXT NOT NULL DEFAULT 'Applied', -- 'Applied', 'Shortlisted', 'Round 1', 'Round 2', 'Round 3', 'Selected', 'Offer Released', 'Offer Accepted', 'Offer Declined', 'Offer Deferred', 'Rejected'
      rejection_reason TEXT,
      recruiter_remark TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_master_id, vacancy_id),
      FOREIGN KEY (student_master_id) REFERENCES student_master(id) ON DELETE CASCADE,
      FOREIGN KEY (vacancy_id) REFERENCES vacancy(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS round_result (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      round_index INTEGER NOT NULL,
      result TEXT NOT NULL DEFAULT 'Pending', -- 'Pass', 'Fail', 'Pending'
      feedback TEXT,
      private_remark TEXT,
      notified INTEGER NOT NULL DEFAULT 0,
      evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES application(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS offer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER UNIQUE NOT NULL,
      ctc TEXT NOT NULL,
      joining_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Released', -- 'Released', 'Accepted', 'Declined', 'Deferred'
      documents TEXT DEFAULT '[]',
      released_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      responded_at DATETIME,
      FOREIGN KEY (application_id) REFERENCES application(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notification (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_user_id TEXT NOT NULL,
      sender_id TEXT,
      event_type TEXT NOT NULL,
      event_key TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      vacancy_id INTEGER,
      application_id INTEGER,
      round_index INTEGER,
      channel TEXT NOT NULL DEFAULT 'both',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      UNIQUE(recipient_user_id, event_key)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      min_match_percent REAL NOT NULL DEFAULT 60.0,
      master_skills TEXT NOT NULL DEFAULT '[]',
      offer_rule TEXT NOT NULL DEFAULT 'OneAcceptedOffer',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_master_id INTEGER,
      action TEXT NOT NULL,
      previous_value TEXT,
      new_value TEXT,
      changed_by TEXT NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate columns for existing tables
  try {
    db.exec(`ALTER TABLE vacancy ADD COLUMN virtual_date TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE vacancy ADD COLUMN demo_now TEXT;`);
  } catch {}
  try {
    db.exec(`UPDATE vacancy SET demo_now = virtual_date WHERE demo_now IS NULL AND virtual_date IS NOT NULL;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE application ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE application ADD COLUMN recruiter_remark TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE round_result ADD COLUMN private_remark TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE student_profile ADD COLUMN internships TEXT DEFAULT '[]';`);
  } catch {}
  try {
    db.exec(`ALTER TABLE student_master ADD COLUMN discipline TEXT DEFAULT 'Engineering & Technology';`);
  } catch {}
  try {
    db.exec(`ALTER TABLE student_master ADD COLUMN college TEXT DEFAULT 'Apex Institute of Technology';`);
  } catch {}
}

initSchema();

module.exports = {
  db,
  initSchema
};
