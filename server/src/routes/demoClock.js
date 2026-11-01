const express = require('express');
const { db } = require('../db/database');
const {
  getJobNow,
  setJobVirtualDate,
  advanceJobVirtualDate,
  jumpJobToCloseDate,
  jumpJobToExamDate,
  jumpJobToDayAfterExam,
  resetJobClock,
  syncAllJobs,
  formatDateToYYYYMMDD
} = require('../utils/demoClock');

const router = express.Router();

/**
 * Get Demo Clock Status for All Vacancies
 * GET /api/demo-clock/jobs
 */
router.get('/jobs', (req, res) => {
  try {
    const vacancies = db.prepare(`
      SELECT 
        v.id,
        v.company_id,
        c.name AS company_name,
        c.logo AS company_logo,
        v.role,
        v.open_date,
        v.close_date,
        v.rounds,
        v.virtual_date,
        v.status
      FROM vacancy v
      JOIN company c ON v.company_id = c.id
      ORDER BY c.name ASC, v.id ASC
    `).all();

    const result = vacancies.map(v => {
      const clock = getJobNow(v);
      const rounds = JSON.parse(v.rounds || '[]');
      return {
        id: v.id,
        companyId: v.company_id,
        companyName: v.company_name,
        companyLogo: v.company_logo,
        role: v.role,
        openDate: v.open_date,
        closeDate: v.close_date,
        rounds,
        status: v.status,
        virtualDate: clock.dateStr,
        isVirtual: clock.isVirtual
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('Fetch demo clock jobs error:', err);
    return res.status(500).json({ error: 'Failed to fetch demo clock jobs' });
  }
});

/**
 * Get Demo Clock Status for Single Job
 * GET /api/demo-clock/job/:id
 */
router.get('/job/:id', (req, res) => {
  try {
    const vacancy = db.prepare(`
      SELECT v.*, c.name AS company_name 
      FROM vacancy v 
      JOIN company c ON v.company_id = c.id 
      WHERE v.id = ?
    `).get(req.params.id);

    if (!vacancy) return res.status(404).json({ error: 'Vacancy not found' });

    const clock = getJobNow(vacancy);
    const rounds = JSON.parse(vacancy.rounds || '[]');

    return res.json({
      id: vacancy.id,
      companyName: vacancy.company_name,
      role: vacancy.role,
      openDate: vacancy.open_date,
      closeDate: vacancy.close_date,
      rounds,
      virtualDate: clock.dateStr,
      isVirtual: clock.isVirtual
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch job clock' });
  }
});

/**
 * Control Job's Demo Clock
 * POST /api/demo-clock/job/:id
 * Body: { action: 'add_day' | 'jump_close' | 'jump_exam' | 'jump_day_after_exam' | 'set_date' | 'reset', days?: number, roundIndex?: number, virtualDate?: string }
 */
router.post('/job/:id', (req, res) => {
  try {
    const vacancyId = parseInt(req.params.id, 10);
    const { action, days, roundIndex, virtualDate } = req.body;

    let updatedClock;

    switch (action) {
      case 'add_day':
        updatedClock = advanceJobVirtualDate(vacancyId, days || 1);
        break;
      case 'jump_close':
        updatedClock = jumpJobToCloseDate(vacancyId);
        break;
      case 'jump_exam':
        updatedClock = jumpJobToExamDate(vacancyId, roundIndex || 0);
        break;
      case 'jump_day_after_exam':
        updatedClock = jumpJobToDayAfterExam(vacancyId, roundIndex || 0);
        break;
      case 'set_date':
        if (!virtualDate) return res.status(400).json({ error: 'virtualDate is required' });
        updatedClock = setJobVirtualDate(vacancyId, virtualDate);
        break;
      case 'reset':
        updatedClock = resetJobClock(vacancyId);
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    return res.json({
      message: `Job clock updated successfully to ${updatedClock.dateStr}`,
      virtualDate: updatedClock.dateStr,
      isVirtual: updatedClock.isVirtual
    });
  } catch (err) {
    console.error('Update job clock error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update job clock' });
  }
});

router.post('/job/:id/add-day', (req, res) => {
  try {
    const vacancyId = parseInt(req.params.id, 10);
    const days = req.body?.days || 1;
    const updatedClock = advanceJobVirtualDate(vacancyId, days);
    return res.json({ message: `Job clock advanced by ${days} day(s) to ${updatedClock.dateStr}`, virtualDate: updatedClock.dateStr, isVirtual: updatedClock.isVirtual });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to advance job clock' });
  }
});

router.post('/job/:id/jump-close', (req, res) => {
  try {
    const vacancyId = parseInt(req.params.id, 10);
    const updatedClock = jumpJobToCloseDate(vacancyId);
    return res.json({ message: `Job clock jumped to close date: ${updatedClock.dateStr}`, virtualDate: updatedClock.dateStr, isVirtual: updatedClock.isVirtual });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to jump to close date' });
  }
});

router.post('/job/:id/jump-exam', (req, res) => {
  try {
    const vacancyId = parseInt(req.params.id, 10);
    const roundIndex = req.body?.roundIndex || 0;
    const updatedClock = jumpJobToExamDate(vacancyId, roundIndex);
    return res.json({ message: `Job clock jumped to exam date: ${updatedClock.dateStr}`, virtualDate: updatedClock.dateStr, isVirtual: updatedClock.isVirtual });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to jump to exam date' });
  }
});

router.post('/job/:id/jump-day-after-exam', (req, res) => {
  try {
    const vacancyId = parseInt(req.params.id, 10);
    const roundIndex = req.body?.roundIndex || 0;
    const updatedClock = jumpJobToDayAfterExam(vacancyId, roundIndex);
    return res.json({ message: `Job clock jumped to day after exam: ${updatedClock.dateStr}`, virtualDate: updatedClock.dateStr, isVirtual: updatedClock.isVirtual });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to jump to day after exam' });
  }
});

router.post('/job/:id/reset', (req, res) => {
  try {
    const vacancyId = parseInt(req.params.id, 10);
    const updatedClock = resetJobClock(vacancyId);
    return res.json({ message: `Job clock reset successfully. Effective date: ${updatedClock.dateStr}`, virtualDate: updatedClock.dateStr, isVirtual: updatedClock.isVirtual });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to reset job clock' });
  }
});

/**
 * Sync All Jobs to Single Date
 * POST /api/demo-clock/sync-all
 * Body: { virtualDate?: string, action?: 'reset' }
 */
router.post('/sync-all', (req, res) => {
  try {
    const { virtualDate, action } = req.body;
    const targetDate = action === 'reset'
      ? formatDateToYYYYMMDD(new Date())
      : (virtualDate || '2026-10-15');

    const result = syncAllJobs(targetDate);
    return res.json({
      message: `All ${result.syncedCount} jobs synced to ${targetDate}`,
      virtualDate: targetDate
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to sync all jobs' });
  }
});

module.exports = router;
