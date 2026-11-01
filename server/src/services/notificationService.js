const { db } = require('../db/database');

/**
 * Resolve audience to a unique array of recipient user IDs (emails)
 * @param {Object} audience
 * @returns {Array<string>} Unique list of recipient emails
 */
function resolveAudience(audience) {
  const recipients = new Set();

  if (!audience || !audience.type) {
    return [];
  }

  switch (audience.type) {
    case 'single': {
      if (audience.recipientId) {
        recipients.add(audience.recipientId.trim().toLowerCase());
      } else if (audience.studentEmail) {
        recipients.add(audience.studentEmail.trim().toLowerCase());
      } else if (audience.studentId) {
        const student = db.prepare('SELECT email FROM student_master WHERE id = ?').get(audience.studentId);
        if (student && student.email) recipients.add(student.email.trim().toLowerCase());
      } else if (audience.regNo) {
        const student = db.prepare('SELECT email FROM student_master WHERE UPPER(reg_no) = ?').get(audience.regNo.trim().toUpperCase());
        if (student && student.email) recipients.add(student.email.trim().toLowerCase());
      }
      break;
    }

    case 'list': {
      if (Array.isArray(audience.recipientIds)) {
        audience.recipientIds.forEach(id => {
          if (id) recipients.add(String(id).trim().toLowerCase());
        });
      }
      if (Array.isArray(audience.studentEmails)) {
        audience.studentEmails.forEach(email => {
          if (email) recipients.add(String(email).trim().toLowerCase());
        });
      }
      if (Array.isArray(audience.studentIds) && audience.studentIds.length > 0) {
        const placeholders = audience.studentIds.map(() => '?').join(',');
        const rows = db.prepare(`SELECT email FROM student_master WHERE id IN (${placeholders})`).all(...audience.studentIds);
        rows.forEach(r => {
          if (r.email) recipients.add(r.email.trim().toLowerCase());
        });
      }
      break;
    }

    case 'applicants': {
      if (audience.vacancyId) {
        const rows = db.prepare(`
          SELECT DISTINCT sm.email 
          FROM application a
          JOIN student_master sm ON a.student_master_id = sm.id
          WHERE a.vacancy_id = ?
        `).all(audience.vacancyId);
        rows.forEach(r => {
          if (r.email) recipients.add(r.email.trim().toLowerCase());
        });
      }
      break;
    }

    case 'round_selected': {
      if (audience.vacancyId !== undefined && audience.roundIndex !== undefined) {
        const rows = db.prepare(`
          SELECT DISTINCT sm.email 
          FROM round_result rr
          JOIN application a ON rr.application_id = a.id
          JOIN student_master sm ON a.student_master_id = sm.id
          WHERE a.vacancy_id = ? AND rr.round_index = ? AND rr.result = 'Pass'
        `).all(audience.vacancyId, audience.roundIndex);
        rows.forEach(r => {
          if (r.email) recipients.add(r.email.trim().toLowerCase());
        });
      }
      break;
    }

    case 'round_rejected': {
      if (audience.vacancyId !== undefined && audience.roundIndex !== undefined) {
        const rows = db.prepare(`
          SELECT DISTINCT sm.email 
          FROM round_result rr
          JOIN application a ON rr.application_id = a.id
          JOIN student_master sm ON a.student_master_id = sm.id
          WHERE a.vacancy_id = ? AND rr.round_index = ? AND rr.result = 'Fail'
        `).all(audience.vacancyId, audience.roundIndex);
        rows.forEach(r => {
          if (r.email) recipients.add(r.email.trim().toLowerCase());
        });
      }
      break;
    }

    case 'all': {
      let query = 'SELECT email FROM student_master WHERE 1=1';
      const params = [];
      if (audience.branch && audience.branch !== 'ALL') {
        query += ' AND branch = ?';
        params.push(audience.branch);
      }
      if (audience.year && audience.year !== 'ALL') {
        query += ' AND year = ?';
        params.push(parseInt(audience.year, 10));
      }
      const rows = db.prepare(query).all(...params);
      rows.forEach(r => {
        if (r.email) recipients.add(r.email.trim().toLowerCase());
      });
      break;
    }

    default:
      break;
  }

  return Array.from(recipients);
}

/**
 * Send Notification to Resolved Audience (Idempotent & Unique)
 * @param {Object} audience - Filter criteria for target recipients
 * @param {Object} payload - Notification data
 * @returns {{ success: boolean, recipientsCount: number, insertedCount: number, eventKey: string }}
 */
function sendNotification(audience, payload) {
  if (!payload || !payload.title || !payload.message) {
    throw new Error('Notification payload requires title and message');
  }

  const recipients = resolveAudience(audience);
  if (recipients.length === 0) {
    return { success: true, recipientsCount: 0, insertedCount: 0, eventKey: payload.eventKey || '' };
  }

  const eventType = payload.eventType || 'broadcast';
  const eventKeyBase = payload.eventKey || `${eventType}_${payload.vacancyId || ''}_${payload.roundIndex || ''}_${payload.applicationId || ''}_${Date.now()}`;
  const senderId = payload.senderId || 'placements@campuslink.edu';
  const channel = payload.channel || 'both';
  const vacancyId = payload.vacancyId || null;
  const applicationId = payload.applicationId || null;
  const roundIndex = payload.roundIndex !== undefined ? payload.roundIndex : null;

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO notification (
      recipient_user_id,
      sender_id,
      event_type,
      event_key,
      title,
      message,
      vacancy_id,
      application_id,
      round_index,
      channel,
      created_at,
      read_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, NULL)
  `);

  let insertedCount = 0;

  for (const recipient of recipients) {
    // Unique key per recipient so same event can never be inserted twice for same user
    const userEventKey = `${eventKeyBase}_${recipient}`;
    const result = insertStmt.run(
      recipient,
      senderId,
      eventType,
      userEventKey,
      payload.title,
      payload.message,
      vacancyId,
      applicationId,
      roundIndex,
      channel
    );

    if (result.changes > 0) {
      insertedCount++;
    }
  }

  return {
    success: true,
    recipientsCount: recipients.length,
    insertedCount,
    eventKey: eventKeyBase
  };
}

module.exports = {
  resolveAudience,
  sendNotification
};
