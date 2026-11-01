const { db } = require('../db/database');

/**
 * Format a Date object to YYYY-MM-DD in local time
 * @param {Date} d
 * @returns {string}
 */
function formatDateToYYYYMMDD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the current effective date for a vacancy (Per-job Demo Clock)
 * @param {number|Object} vacancyId
 * @returns {Date}
 */
function getNow(vacancyId) {
  const isDemoMode = process.env.DEMO_MODE !== 'false';
  if (isDemoMode && vacancyId) {
    try {
      let vacancy = null;
      if (typeof vacancyId === 'object' && vacancyId !== null) {
        vacancy = vacancyId;
      } else {
        const id = parseInt(vacancyId, 10);
        if (id) {
          vacancy = db.prepare('SELECT id, demo_now, virtual_date FROM vacancy WHERE id = ?').get(id);
        }
      }
      const demoVal = vacancy?.demo_now || vacancy?.virtual_date;
      if (demoVal && demoVal.trim()) {
        const d = new Date(`${demoVal.trim()}T12:00:00`);
        if (!isNaN(d.getTime())) {
          return d;
        }
      }
    } catch {}
  }
  return new Date();
}

/**
 * Get the current effective date and metadata for a vacancy
 * @param {number|Object} vacancyOrId
 * @returns {{ date: Date, dateStr: string, isVirtual: boolean, vacancyId: number }}
 */
function getJobNow(vacancyOrId) {
  let vacancy = null;
  let vacancyId = 0;

  if (typeof vacancyOrId === 'object' && vacancyOrId !== null) {
    vacancy = vacancyOrId;
    vacancyId = vacancy.id;
  } else if (vacancyOrId) {
    vacancyId = parseInt(vacancyOrId, 10);
    try {
      vacancy = db.prepare('SELECT id, open_date, close_date, rounds, demo_now, virtual_date FROM vacancy WHERE id = ?').get(vacancyId);
    } catch {
      vacancy = null;
    }
  }

  const isDemoMode = process.env.DEMO_MODE !== 'false';
  const hasDemoDate = Boolean(vacancy && ((vacancy.demo_now && vacancy.demo_now.trim()) || (vacancy.virtual_date && vacancy.virtual_date.trim())));
  const isVirtual = isDemoMode && hasDemoDate;
  const now = getNow(vacancy || vacancyId);
  const dateStr = formatDateToYYYYMMDD(now);

  return {
    date: now,
    dateStr,
    isVirtual,
    vacancyId
  };
}

/**
 * Set the virtual date for a specific vacancy
 * @param {number} vacancyId
 * @param {string} dateStr - e.g. "2026-10-15"
 */
function setJobVirtualDate(vacancyId, dateStr) {
  db.prepare('UPDATE vacancy SET demo_now = ?, virtual_date = ? WHERE id = ?').run(dateStr, dateStr, vacancyId);
  return getJobNow(vacancyId);
}

/**
 * Add days to a job's virtual date
 * @param {number} vacancyId
 * @param {number} days
 */
function advanceJobVirtualDate(vacancyId, days = 1) {
  const current = getJobNow(vacancyId);
  const nextDate = new Date(current.date);
  nextDate.setDate(nextDate.getDate() + days);
  const nextDateStr = formatDateToYYYYMMDD(nextDate);
  return setJobVirtualDate(vacancyId, nextDateStr);
}

/**
 * Jump job's clock to its application close date
 * @param {number} vacancyId
 */
function jumpJobToCloseDate(vacancyId) {
  const vacancy = db.prepare('SELECT close_date FROM vacancy WHERE id = ?').get(vacancyId);
  if (!vacancy || !vacancy.close_date) throw new Error('Vacancy close date not found');
  return setJobVirtualDate(vacancyId, vacancy.close_date);
}

/**
 * Jump job's clock to a specific round exam date
 * @param {number} vacancyId
 * @param {number} roundIndex
 */
function jumpJobToExamDate(vacancyId, roundIndex = 0) {
  const vacancy = db.prepare('SELECT rounds FROM vacancy WHERE id = ?').get(vacancyId);
  if (!vacancy) throw new Error('Vacancy not found');
  let rounds = [];
  try { rounds = JSON.parse(vacancy.rounds || '[]'); } catch {}
  const targetRound = rounds[roundIndex] || rounds[0];
  if (!targetRound || !targetRound.date) throw new Error('Round date not found');
  return setJobVirtualDate(vacancyId, targetRound.date);
}

/**
 * Jump job's clock to the day AFTER a specific round exam date
 * @param {number} vacancyId
 * @param {number} roundIndex
 */
function jumpJobToDayAfterExam(vacancyId, roundIndex = 0) {
  const vacancy = db.prepare('SELECT rounds FROM vacancy WHERE id = ?').get(vacancyId);
  if (!vacancy) throw new Error('Vacancy not found');
  let rounds = [];
  try { rounds = JSON.parse(vacancy.rounds || '[]'); } catch {}
  const targetRound = rounds[roundIndex] || rounds[0];
  if (!targetRound || !targetRound.date) throw new Error('Round date not found');
  
  const examDate = new Date(`${targetRound.date}T12:00:00`);
  examDate.setDate(examDate.getDate() + 1);
  const dayAfterStr = formatDateToYYYYMMDD(examDate);
  return setJobVirtualDate(vacancyId, dayAfterStr);
}

/**
 * Reset job's clock to null (clearing per-job demo clock)
 * @param {number} vacancyId
 */
function resetJobClock(vacancyId) {
  db.prepare('UPDATE vacancy SET demo_now = NULL, virtual_date = NULL WHERE id = ?').run(vacancyId);
  return getJobNow(vacancyId);
}

/**
 * Sync all vacancies to a single virtual date
 * @param {string} dateStr
 */
function syncAllJobs(dateStr) {
  db.prepare('UPDATE vacancy SET demo_now = ?, virtual_date = ?').run(dateStr, dateStr);
  return { dateStr, syncedCount: db.prepare('SELECT COUNT(*) as count FROM vacancy').get().count };
}

module.exports = {
  formatDateToYYYYMMDD,
  getNow,
  getJobNow,
  setJobVirtualDate,
  advanceJobVirtualDate,
  jumpJobToCloseDate,
  jumpJobToExamDate,
  jumpJobToDayAfterExam,
  resetJobClock,
  syncAllJobs
};
