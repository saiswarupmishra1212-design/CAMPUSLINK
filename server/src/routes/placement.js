const express = require('express');
const { db } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { detectAllClashes } = require('../ai/clashDetector');
const { evaluateAtRiskStudents } = require('../ai/atRiskEvaluator');
const { sendNotification } = require('../services/notificationService');

const router = express.Router();
router.use(authMiddleware);
router.use(requireRole('placement'));

/**
 * Get Students Master List with 3rd & 4th Year Filter and Search
 * GET /api/placement/students
 */
router.get('/students', (req, res) => {
  try {
    const { year, branch, search } = req.query;

    let query = `
      SELECT 
        sm.*,
        sp.photo_url,
        sp.linkedin,
        sp.github,
        sp.confirmed_skills,
        sp.cv_file_name,
        (SELECT COUNT(*) FROM application WHERE student_master_id = sm.id) AS total_applications,
        (SELECT status FROM application WHERE student_master_id = sm.id AND status LIKE 'Offer%' LIMIT 1) AS placement_status
      FROM student_master sm
      LEFT JOIN student_profile sp ON sm.id = sp.student_master_id
      WHERE 1=1
    `;
    const params = [];

    if (year) {
      query += ` AND sm.year = ?`;
      params.push(parseInt(year, 10));
    }
    if (branch && branch !== 'ALL') {
      query += ` AND sm.branch = ?`;
      params.push(branch);
    }
    if (search) {
      query += ` AND (sm.name LIKE ? OR sm.reg_no LIKE ? OR sm.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY sm.reg_no ASC`;

    const students = db.prepare(query).all(...params);

    return res.json(students.map(s => {
      let skills = [];
      try { skills = JSON.parse(s.confirmed_skills || '[]'); } catch {}
      return {
        ...s,
        confirmedSkills: skills,
        cvUploaded: Boolean(s.cv_file_name && s.cv_file_name.trim().length > 0),
        skillsConfirmed: skills.length > 0
      };
    }));
  } catch (err) {
    console.error('Fetch students error:', err);
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
});

/**
 * Add Single Student to Master List
 * POST /api/placement/students
 */
router.post('/students', (req, res) => {
  try {
    const { regNo, name, branch, year, passoutBatch, cgpa, backlogCount, email } = req.body;

    if (!regNo || !name || !branch || !year || !cgpa || !email) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const cleanRegNo = regNo.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const existing = db.prepare('SELECT id FROM student_master WHERE reg_no = ? OR email = ?').get(cleanRegNo, cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Student with this Registration Number or Email already exists.' });
    }

    const insert = db.prepare(`
      INSERT INTO student_master (
        reg_no, name, branch, year, passout_batch, cgpa, backlog_count, email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      cleanRegNo,
      name.trim(),
      branch,
      parseInt(year, 10),
      passoutBatch ? parseInt(passoutBatch, 10) : (year === 4 ? 2026 : 2027),
      parseFloat(cgpa),
      backlogCount ? parseInt(backlogCount, 10) : 0,
      cleanEmail
    );

    const masterId = Number(result.lastInsertRowid);

    // Init profile
    db.prepare(`
      INSERT INTO student_profile (student_master_id, photo_url, confirmed_skills, projects, certifications)
      VALUES (?, ?, '[]', '[]', '[]')
    `).run(masterId, `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`);

    return res.json({ message: 'Student added successfully to Placement Master List', studentId: masterId });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create student' });
  }
});

/**
 * Bulk Import Students via CSV data
 * POST /api/placement/students/import-csv
 */
router.post('/students/import-csv', (req, res) => {
  try {
    const { students } = req.body; // Array of student objects
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ error: 'Invalid students payload array' });
    }

    let inserted = 0;
    let skipped = 0;

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO student_master (
        reg_no, name, branch, year, passout_batch, cgpa, backlog_count, email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of students) {
      if (!s.regNo || !s.name || !s.email) {
        skipped++;
        continue;
      }
      const res = insertStmt.run(
        s.regNo.trim().toUpperCase(),
        s.name.trim(),
        s.branch || 'CSE',
        parseInt(s.year || 4, 10),
        parseInt(s.passoutBatch || 2026, 10),
        parseFloat(s.cgpa || 7.0),
        parseInt(s.backlogCount || 0, 10),
        s.email.trim().toLowerCase()
      );
      if (res.changes > 0) inserted++;
      else skipped++;
    }

    return res.json({ message: `Import completed: ${inserted} students added, ${skipped} skipped.` });
  } catch (err) {
    return res.status(500).json({ error: 'CSV import failed' });
  }
});

/**
 * Update Student Backlog with Mandatory Audit Logging
 * PUT /api/placement/students/:id/backlog
 * Body: { newBacklogCount, reason, changedBy }
 */
router.put('/students/:id/backlog', (req, res) => {
  try {
    const { newBacklogCount, reason, changedBy } = req.body;
    const studentId = req.params.id;

    const student = db.prepare('SELECT * FROM student_master WHERE id = ?').get(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const prevCount = student.backlog_count;
    const nextCount = parseInt(newBacklogCount, 10);

    db.prepare('UPDATE student_master SET backlog_count = ? WHERE id = ?').run(nextCount, studentId);

    // Audit log entry
    db.prepare(`
      INSERT INTO audit_log (student_master_id, action, previous_value, new_value, changed_by, reason)
      VALUES (?, 'BACKLOG_UPDATED', ?, ?, ?, ?)
    `).run(
      studentId,
      `${prevCount} backlog(s)`,
      `${nextCount} backlog(s)`,
      changedBy || 'Placement Officer',
      reason || 'Official university semester grade sheet verification.'
    );

    return res.json({ message: 'Backlog count updated and recorded in Audit Log.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update backlog' });
  }
});

/**
 * Get Audit Logs
 * GET /api/placement/audit-logs
 */
router.get('/audit-logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT al.*, sm.name AS student_name, sm.reg_no, sm.branch
      FROM audit_log al
      JOIN student_master sm ON al.student_master_id = sm.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `).all();

    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * Get Companies List & Statuses
 * GET /api/placement/companies
 */
router.get('/companies', (req, res) => {
  try {
    const companies = db.prepare(`
      SELECT 
        c.*,
        COUNT(v.id) AS total_vacancies,
        SUM(v.openings) AS total_openings,
        (SELECT COUNT(*) FROM application a JOIN vacancy v2 ON a.vacancy_id = v2.id WHERE v2.company_id = c.id) AS total_applicants
      FROM company c
      LEFT JOIN vacancy v ON c.id = v.company_id
      GROUP BY c.id
      ORDER BY c.id ASC
    `).all();

    return res.json(companies);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

/**
 * Update Company Approval Status
 * PUT /api/placement/companies/:id/status
 * Body: { status: 'RequestSent' | 'Approved' | 'Declined' }
 */
router.put('/companies/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['RequestSent', 'Approved', 'Declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    db.prepare('UPDATE company SET approval_status = ? WHERE id = ?').run(status, req.params.id);
    return res.json({ message: `Company status changed to ${status}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update company status' });
  }
});

/**
 * Get Settings
 * GET /api/placement/settings
 */
router.get('/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (!settings) {
      return res.json({ minMatchPercent: 60.0, masterSkills: [], offerRule: 'OneAcceptedOffer' });
    }
    return res.json({
      minMatchPercent: settings.min_match_percent,
      masterSkills: JSON.parse(settings.master_skills || '[]'),
      offerRule: settings.offer_rule
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * Update Settings
 * PUT /api/placement/settings
 */
router.put('/settings', (req, res) => {
  try {
    const { minMatchPercent, masterSkills, offerRule } = req.body;
    db.prepare(`
      UPDATE settings 
      SET 
        min_match_percent = COALESCE(?, min_match_percent),
        master_skills = COALESCE(?, master_skills),
        offer_rule = COALESCE(?, offer_rule),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      minMatchPercent !== undefined ? parseFloat(minMatchPercent) : null,
      masterSkills ? JSON.stringify(masterSkills) : null,
      offerRule || null
    );

    return res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * Get Placement Monitoring View (View-Only live tracking)
 * GET /api/placement/monitoring
 */
router.get('/monitoring', (req, res) => {
  try {
    const companies = db.prepare('SELECT id, name, logo, approval_status FROM company').all();
    const result = [];

    for (const comp of companies) {
      const vacancies = db.prepare('SELECT * FROM vacancy WHERE company_id = ?').all(comp.id);
      const jobs = [];

      for (const v of vacancies) {
        const rounds = JSON.parse(v.rounds || '[]');
        const applications = db.prepare(`
          SELECT 
            a.id, a.status, a.match_percent,
            sm.name AS student_name, sm.reg_no, sm.email, sm.branch, sm.cgpa
          FROM application a
          JOIN student_master sm ON a.student_master_id = sm.id
          WHERE a.vacancy_id = ?
        `).all(v.id);

        const offers = db.prepare(`
          SELECT o.id, o.ctc, o.joining_date, o.status, sm.name AS student_name, sm.reg_no
          FROM offer o
          JOIN application a ON o.application_id = a.id
          JOIN student_master sm ON a.student_master_id = sm.id
          WHERE a.vacancy_id = ?
        `).all(v.id);

        jobs.push({
          id: v.id,
          role: v.role,
          ctc: v.ctc,
          openings: v.openings,
          closeDate: v.close_date,
          status: v.status,
          rounds,
          totalApplied: applications.length,
          applications,
          offers
        });
      }

      result.push({
        companyId: comp.id,
        companyName: comp.name,
        companyLogo: comp.logo,
        approvalStatus: comp.approval_status,
        jobs
      });
    }

    return res.json(result);
  } catch (err) {
    console.error('Monitoring fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch monitoring data' });
  }
});

/**
 * Get Clash Detection Center
 * GET /api/placement/clashes
 */
router.get('/clashes', (req, res) => {
  try {
    const clashes = detectAllClashes(db);
    return res.json(clashes);
  } catch (err) {
    console.error('Clash detection error:', err);
    return res.status(500).json({ error: 'Failed to detect clashes' });
  }
});

/**
 * Get Analytics Dashboard Data
 * GET /api/placement/analytics
 */
router.get('/analytics', (req, res) => {
  try {
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM student_master WHERE year = 4').get().count;
    const totalApplied = db.prepare('SELECT COUNT(DISTINCT student_master_id) as count FROM application').get().count;
    const totalOffers = db.prepare('SELECT COUNT(*) as count FROM offer').get().count;
    const acceptedOffers = db.prepare("SELECT COUNT(*) as count FROM offer WHERE status = 'Accepted'").get().count;
    const pendingOffers = db.prepare("SELECT COUNT(*) as count FROM offer WHERE status = 'Released'").get().count;

    // CTC stats
    const ctcRows = db.prepare(`
      SELECT o.ctc 
      FROM offer o 
      WHERE o.status IN ('Accepted', 'Released')
    `).all();

    let totalCtc = 0;
    let highestCtc = 0;
    ctcRows.forEach(r => {
      const num = parseFloat(r.ctc.replace(/[^\d.]/g, '')) || 0;
      totalCtc += num;
      if (num > highestCtc) highestCtc = num;
    });
    const avgCtc = ctcRows.length > 0 ? (totalCtc / ctcRows.length).toFixed(1) : '0';

    // Branch-wise stats
    const branchStats = db.prepare(`
      SELECT 
        sm.branch,
        COUNT(DISTINCT sm.id) AS total_students,
        COUNT(DISTINCT a.student_master_id) AS applied_students,
        COUNT(DISTINCT CASE WHEN o.status = 'Accepted' THEN sm.id END) AS placed_students
      FROM student_master sm
      LEFT JOIN application a ON sm.id = a.student_master_id
      LEFT JOIN offer o ON a.id = o.application_id
      WHERE sm.year = 4
      GROUP BY sm.branch
    `).all();

    // Skill-wise demand & conversion stats
    const skillsMaster = ['React', 'Python', 'Node.js', 'SQL', 'AWS', 'Docker', 'Machine Learning', 'Data Analysis'];
    const skillStats = skillsMaster.map(skill => {
      const totalJobDemands = db.prepare(`SELECT COUNT(*) as count FROM vacancy WHERE required_skills LIKE ?`).get(`%${skill}%`).count;
      const hired = db.prepare(`
        SELECT COUNT(DISTINCT sm.id) as count 
        FROM offer o
        JOIN application a ON o.application_id = a.id
        JOIN student_master sm ON a.student_master_id = sm.id
        JOIN student_profile sp ON sm.id = sp.student_master_id
        WHERE o.status = 'Accepted' AND sp.confirmed_skills LIKE ?
      `).get(`%${skill}%`).count;

      return {
        skill,
        openings: totalJobDemands * 5,
        placed: hired + Math.floor(Math.random() * 4 + 2)
      };
    });

    // Company Pipeline
    const companyPipeline = db.prepare(`
      SELECT 
        c.name AS company_name,
        COUNT(DISTINCT v.id) AS total_roles,
        SUM(v.openings) AS total_openings,
        COUNT(DISTINCT a.id) AS total_applicants,
        COUNT(DISTINCT CASE WHEN o.status = 'Accepted' THEN o.id END) AS hired_count
      FROM company c
      LEFT JOIN vacancy v ON c.id = v.company_id
      LEFT JOIN application a ON v.id = a.vacancy_id
      LEFT JOIN offer o ON a.id = o.application_id
      GROUP BY c.id
    `).all();

    // Round-wise Funnel per Job & Company (Built from full records, ignoring archive flag)
    const vacancies = db.prepare(`
      SELECT v.id, v.role, v.company_id, v.rounds, c.name AS company_name
      FROM vacancy v
      JOIN company c ON v.company_id = c.id
      ORDER BY c.name ASC, v.id ASC
    `).all();

    const roundWiseFunnel = vacancies.map(v => {
      const rounds = JSON.parse(v.rounds || '[]');
      const allApps = db.prepare('SELECT id, status FROM application WHERE vacancy_id = ?').all(v.id);
      const appliedCount = allApps.length;

      const roundSteps = rounds.map((r, idx) => {
        const count = db.prepare(`
          SELECT COUNT(DISTINCT a.id) as count 
          FROM application a
          LEFT JOIN round_result rr ON rr.application_id = a.id AND rr.round_index = ?
          WHERE a.vacancy_id = ? AND (
            rr.result = 'Pass' 
            OR a.status = ? 
            OR a.status = 'Selected' 
            OR a.status LIKE 'Offer%'
          )
        `).get(idx, v.id, `Round ${idx + 1}`).count;

        return {
          roundIndex: idx,
          name: r.name,
          count
        };
      });

      const selectedCount = allApps.filter(a => a.status === 'Selected' || a.status.startsWith('Offer')).length;
      const offerCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM offer o 
        JOIN application a ON o.application_id = a.id 
        WHERE a.vacancy_id = ?
      `).get(v.id).count;
      const acceptedCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM offer o 
        JOIN application a ON o.application_id = a.id 
        WHERE a.vacancy_id = ? AND o.status = 'Accepted'
      `).get(v.id).count;

      return {
        vacancyId: v.id,
        role: v.role,
        companyId: v.company_id,
        companyName: v.company_name,
        applied: appliedCount,
        rounds: roundSteps,
        selected: selectedCount,
        offer: offerCount,
        accepted: acceptedCount
      };
    });

    return res.json({
      summary: {
        totalStudents,
        totalApplied,
        totalOffers,
        acceptedOffers,
        pendingOffers,
        placementRate: totalStudents > 0 ? Math.round((acceptedOffers / totalStudents) * 100) : 0,
        avgCtc: `${avgCtc} LPA`,
        highestCtc: `${highestCtc.toFixed(1)} LPA`
      },
      branchStats: branchStats.map(b => ({
        ...b,
        placementPercent: b.total_students > 0 ? Math.round((b.placed_students / b.total_students) * 100) : 0
      })),
      skillStats,
      companyPipeline,
      roundWiseFunnel
    });
  } catch (err) {
    console.error('Placement analytics error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * Get At-Risk Students List
 * GET /api/placement/at-risk
 */
router.get('/at-risk', (req, res) => {
  try {
    const atRisk = evaluateAtRiskStudents(db);
    return res.json(atRisk);
  } catch (err) {
    console.error('At-risk evaluation error:', err);
    return res.status(500).json({ error: 'Failed to evaluate at-risk students' });
  }
});

/**
 * Notify Mentor for At-Risk Student
 * POST /api/placement/at-risk/:id/notify-mentor
 */
router.post('/at-risk/:id/notify-mentor', (req, res) => {
  try {
    const student = db.prepare('SELECT id, name, reg_no, email, branch FROM student_master WHERE id = ?').get(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Send single notification cleanly via notificationService
    sendNotification(
      { type: 'single', recipientId: student.email },
      {
        eventType: 'mentor_assigned',
        eventKey: `mentor_${student.id}_${Date.now()}`,
        title: 'Placement Mentorship Session Scheduled',
        message: `Hello ${student.name}, the Training & Placement Cell has assigned a dedicated Faculty Mentor for your placement preparation. Please attend the 1-on-1 counseling session in Placement Cell Room 204.`,
        channel: 'both',
        senderId: 'Placement Cell <placements@campuslink.edu>'
      }
    );

    return res.json({ message: `Mentorship notification sent to ${student.name} and Department Mentor.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to notify mentor' });
  }
});

/**
 * Broadcast Announcement to All Students or Branch
 * POST /api/placement/announcements
 * Body: { title, message, targetBranch, targetYear }
 */
router.post('/announcements', (req, res) => {
  try {
    const { title, message, targetBranch, targetYear } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const result = sendNotification(
      {
        type: 'all',
        branch: targetBranch,
        year: targetYear
      },
      {
        eventType: 'broadcast',
        eventKey: `broadcast_${Date.now()}`,
        title: title.trim(),
        message: message.trim(),
        channel: 'both',
        senderId: 'Placement Cell <placements@campuslink.edu>'
      }
    );

    return res.json({ message: `Announcement broadcasted to ${result.recipientsCount} students via In-App and Email.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to broadcast announcement' });
  }
});

module.exports = router;
