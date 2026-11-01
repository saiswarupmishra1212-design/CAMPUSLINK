/**
 * Drive Clash & Venue Double-Booking Detector
 */

/**
 * Checks if two date/time strings overlap or represent the same calendar slot
 * @param {string} date1 - e.g. "2026-10-15"
 * @param {string} time1 - e.g. "10:00 AM" or "10:00"
 * @param {string} date2 - e.g. "2026-10-15"
 * @param {string} time2 - e.g. "10:00 AM" or "10:30 AM"
 * @returns {boolean}
 */
function isTimeOverlapping(date1, time1, date2, time2) {
  if (!date1 || !date2 || date1 !== date2) {
    return false;
  }
  
  if (!time1 || !time2) {
    return true; // same date, unspecified time is a potential clash
  }

  // Normalize times: convert "10:00 AM" to 24h minutes
  const parseToMinutes = (tStr) => {
    const clean = tStr.trim().toUpperCase();
    const match = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return 0;
    let [_, hours, mins, meridian] = match;
    let h = parseInt(hours, 10);
    const m = parseInt(mins, 10);
    if (meridian === 'PM' && h < 12) h += 12;
    if (meridian === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const m1 = parseToMinutes(time1);
  const m2 = parseToMinutes(time2);

  // Consider an interview round to take at least 60 minutes
  const diff = Math.abs(m1 - m2);
  return diff < 60;
}

/**
 * Scans all active applications and scheduled rounds in database for clashes
 * @param {Object} db - DatabaseSync instance
 * @returns {Array<Object>} List of detected clashes with recommendations
 */
function detectAllClashes(db) {
  const clashes = [];

  // 1. Student Double-Booking Clashes
  // Fetch all applications in active interview rounds
  const activeAppsQuery = `
    SELECT 
      a.id AS application_id,
      a.student_master_id,
      sm.name AS student_name,
      sm.reg_no,
      sm.email,
      sm.branch,
      a.status AS application_status,
      v.id AS vacancy_id,
      v.role AS job_role,
      v.rounds AS vacancy_rounds,
      c.id AS company_id,
      c.name AS company_name
    FROM application a
    JOIN student_master sm ON a.student_master_id = sm.id
    JOIN vacancy v ON a.vacancy_id = v.id
    JOIN company c ON v.company_id = c.id
    WHERE a.status LIKE 'Round %' OR a.status = 'Shortlisted'
  `;

  let apps = [];
  try {
    apps = db.prepare(activeAppsQuery).all();
  } catch (err) {
    console.error('Error querying active applications for clash detection:', err);
    return [];
  }

  // Expand each application to its current scheduled round
  const scheduledSlots = [];

  for (const app of apps) {
    let rounds = [];
    try {
      rounds = JSON.parse(app.vacancy_rounds || '[]');
    } catch {
      rounds = [];
    }

    // Determine current round index from status (e.g. "Round 1" -> 0, "Round 2" -> 1)
    let roundIndex = 0;
    const match = (app.application_status || '').match(/Round\s+(\d+)/i);
    if (match) {
      roundIndex = parseInt(match[1], 10) - 1;
    }

    const currentRound = rounds[roundIndex];
    if (currentRound && currentRound.date) {
      scheduledSlots.push({
        applicationId: app.application_id,
        studentId: app.student_master_id,
        studentName: app.student_name,
        regNo: app.reg_no,
        email: app.email,
        branch: app.branch,
        companyId: app.company_id,
        companyName: app.company_name,
        jobRole: app.job_role,
        roundName: currentRound.name || `Round ${roundIndex + 1}`,
        date: currentRound.date,
        time: currentRound.time || '10:00 AM',
        mode: currentRound.mode || 'Offline',
        venue: currentRound.venue || 'Campus Auditorium'
      });
    }
  }

  // Compare each pair of scheduled slots for student double-booking
  for (let i = 0; i < scheduledSlots.length; i++) {
    for (let j = i + 1; j < scheduledSlots.length; j++) {
      const slotA = scheduledSlots[i];
      const slotB = scheduledSlots[j];

      // Condition 1: Same student in two different company rounds at the same date/time
      if (slotA.studentId === slotB.studentId && slotA.companyId !== slotB.companyId) {
        if (isTimeOverlapping(slotA.date, slotA.time, slotB.date, slotB.time)) {
          clashes.push({
            id: `student-${slotA.studentId}-${slotA.companyId}-${slotB.companyId}`,
            type: 'STUDENT_SCHEDULE_CLASH',
            severity: 'HIGH',
            title: `Student Schedule Clash: ${slotA.studentName} (${slotA.regNo})`,
            description: `${slotA.studentName} is concurrently scheduled for '${slotA.companyName} - ${slotA.jobRole} (${slotA.roundName})' and '${slotB.companyName} - ${slotB.jobRole} (${slotB.roundName})' on ${slotA.date} at ${slotA.time}.`,
            studentId: slotA.studentId,
            studentName: slotA.studentName,
            regNo: slotA.regNo,
            drive1: {
              company: slotA.companyName,
              role: slotA.jobRole,
              round: slotA.roundName,
              date: slotA.date,
              time: slotA.time,
              venue: slotA.venue,
              applicationId: slotA.applicationId
            },
            drive2: {
              company: slotB.companyName,
              role: slotB.jobRole,
              round: slotB.roundName,
              date: slotB.date,
              time: slotB.time,
              venue: slotB.venue,
              applicationId: slotB.applicationId
            },
            resolution: `Coordinate with ${slotB.companyName} recruiter to reschedule ${slotA.studentName}'s slot by +2 hours, or shift ${slotA.companyName} interview to online mode.`
          });
        }
      }

      // Condition 2: Same physical venue double-booked across different drives
      if (
        slotA.companyId !== slotB.companyId &&
        slotA.venue &&
        slotB.venue &&
        slotA.venue.trim().toLowerCase() === slotB.venue.trim().toLowerCase() &&
        slotA.mode !== 'Online' &&
        slotB.mode !== 'Online'
      ) {
        if (isTimeOverlapping(slotA.date, slotA.time, slotB.date, slotB.time)) {
          const venueClashId = `venue-${slotA.date}-${slotA.venue.replace(/\s+/g, '_')}`;
          if (!clashes.some(c => c.id === venueClashId)) {
            clashes.push({
              id: venueClashId,
              type: 'VENUE_DOUBLE_BOOKED',
              severity: 'CRITICAL',
              title: `Venue Double-Booking at '${slotA.venue}'`,
              description: `Venue '${slotA.venue}' is booked by both ${slotA.companyName} (${slotA.jobRole}) and ${slotB.companyName} (${slotB.jobRole}) on ${slotA.date} around ${slotA.time}.`,
              venue: slotA.venue,
              date: slotA.date,
              time: slotA.time,
              drive1: { company: slotA.companyName, role: slotA.jobRole, round: slotA.roundName },
              drive2: { company: slotB.companyName, role: slotB.jobRole, round: slotB.roundName },
              resolution: `Assign Lab 3 or Seminar Hall B to ${slotB.companyName} to avoid physical space conflict.`
            });
          }
        }
      }
    }
  }

  return clashes;
}

module.exports = {
  isTimeOverlapping,
  detectAllClashes
};
