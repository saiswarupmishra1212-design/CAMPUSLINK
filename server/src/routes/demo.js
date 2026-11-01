const express = require('express');
const { db } = require('../db/database');
const { seed } = require('../db/seed');

const router = express.Router();

/**
 * Advance Date to After Close Date (Unlocks Recruiter Applications view)
 * POST /api/demo/advance-dates
 */
router.post('/advance-dates', (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    db.prepare(`UPDATE vacancy SET close_date = ? WHERE status != 'Draft'`).run(yesterdayStr);

    return res.json({
      message: `All vacancy close dates shifted to ${yesterdayStr}. Applications are now UNLOCKED for Recruiter candidate review!`,
      newCloseDate: yesterdayStr
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to advance dates' });
  }
});

/**
 * Open Applications (Extends close dates to future)
 * POST /api/demo/open-applications
 */
router.post('/open-applications', (req, res) => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    db.prepare(`UPDATE vacancy SET close_date = ?, status = 'Open'`).run(futureDateStr);

    return res.json({
      message: `All vacancy close dates extended to ${futureDateStr}. Students can now submit applications!`,
      newCloseDate: futureDateStr
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to open applications' });
  }
});

/**
 * Advance Current Round (Simulates round completion for active applications)
 * POST /api/demo/advance-round
 */
router.post('/advance-round', (req, res) => {
  try {
    // Find all applications in 'Applied' or 'Round 1'
    const round1Apps = db.prepare(`
      SELECT a.*, v.role, c.name as company_name, sm.email 
      FROM application a
      JOIN vacancy v ON a.vacancy_id = v.id
      JOIN company c ON v.company_id = c.id
      JOIN student_master sm ON a.student_master_id = sm.id
      WHERE a.status = 'Applied' OR a.status = 'Round 1'
    `).all();

    let count = 0;
    for (const app of round1Apps) {
      const nextStatus = app.status === 'Applied' ? 'Round 1' : 'Round 2';
      db.prepare('UPDATE application SET status = ? WHERE id = ?').run(nextStatus, app.id);
      db.prepare(`
        INSERT INTO notification (user_id, role, type, title, message, channel)
        VALUES (?, 'student', 'round_result', ?, ?, 'both')
      `).run(
        app.email,
        `Drive Update: ${app.role} - Advanced to ${nextStatus}`,
        `Congratulations! You have progressed to ${nextStatus} for ${app.role} at ${app.company_name}. Check your interview schedule.`
      );
      count++;
    }

    return res.json({ message: `Successfully advanced ${count} applications to the next interview round!` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to advance round' });
  }
});

/**
 * Auto-Generate Results (Simulates evaluation for un-graded applicants)
 * POST /api/demo/auto-generate-results
 */
router.post('/auto-generate-results', (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT a.*, v.role, c.name as company_name, sm.name as student_name, sm.email 
      FROM application a
      JOIN vacancy v ON a.vacancy_id = v.id
      JOIN company c ON v.company_id = c.id
      JOIN student_master sm ON a.student_master_id = sm.id
      WHERE a.status IN ('Applied', 'Round 1', 'Round 2')
    `).all();

    let passed = 0;
    let rejected = 0;

    for (const app of apps) {
      // Students with matchPercent >= 70 have higher chance of passing
      const pass = app.match_percent >= 65 || Math.random() > 0.4;
      if (pass) {
        passed++;
        db.prepare(`UPDATE application SET status = 'Selected' WHERE id = ?`).run(app.id);
        db.prepare(`
          INSERT INTO notification (user_id, role, type, title, message, channel)
          VALUES (?, 'student', 'round_result', ?, ?, 'both')
        `).run(
          app.email,
          `Selection Update: ${app.role} at ${app.company_name}`,
          `Heartiest congratulations ${app.student_name}! You have cleared all interview rounds for ${app.role} and have been Selected. Your official offer letter will be released shortly.`
        );
      } else {
        rejected++;
        db.prepare(`UPDATE application SET status = 'Rejected', rejection_reason = 'Candidate scored below cutoff in technical problem solving.' WHERE id = ?`).run(app.id);
      }
    }

    return res.json({
      message: `Auto-generated evaluation results: ${passed} candidates Selected, ${rejected} candidates Rejected.`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to auto-generate results' });
  }
});

/**
 * Reset Demo Data
 * POST /api/demo/reset
 */
router.post('/reset', async (req, res) => {
  try {
    await seed();
    return res.json({ message: 'Demo environment successfully reset to fresh default state!' });
  } catch (err) {
    console.error('Reset error:', err);
    return res.status(500).json({ error: 'Failed to reset demo data' });
  }
});

module.exports = router;
