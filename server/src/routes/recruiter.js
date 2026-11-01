const express = require('express');
const { db } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { isTimeOverlapping } = require('../ai/clashDetector');
const { sendNotification } = require('../services/notificationService');
const { getJobNow, getNow, formatDateToYYYYMMDD } = require('../utils/demoClock');

const router = express.Router();
router.use(authMiddleware);
router.use(requireRole('recruiter'));

/**
 * Get Company Profile
 * GET /api/recruiter/profile
 */
router.get('/profile', (req, res) => {
  try {
    const company = db.prepare('SELECT id, name, logo, website, description, hr_contact, email, approval_status FROM company WHERE id = ?').get(req.user.companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    return res.json(company);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch company profile' });
  }
});

/**
 * Update Company Profile
 * PUT /api/recruiter/profile
 */
router.put('/profile', (req, res) => {
  try {
    const { name, logo, website, description, hrContact } = req.body;
    db.prepare(`
      UPDATE company 
      SET 
        name = COALESCE(?, name),
        logo = COALESCE(?, logo),
        website = COALESCE(?, website),
        description = COALESCE(?, description),
        hr_contact = COALESCE(?, hr_contact)
      WHERE id = ?
    `).run(name || null, logo || null, website || null, description || null, hrContact || null, req.user.companyId);

    return res.json({ message: 'Company profile updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Get All Vacancies for Current Company
 * GET /api/recruiter/vacancies
 */
router.get('/vacancies', (req, res) => {
  try {
    const vacancies = db.prepare(`
      SELECT 
        v.*,
        COUNT(a.id) AS applied_count,
        SUM(CASE WHEN a.status = 'Selected' THEN 1 ELSE 0 END) AS selected_count,
        SUM(CASE WHEN a.status = 'Offer Accepted' THEN 1 ELSE 0 END) AS accepted_count
      FROM vacancy v
      LEFT JOIN application a ON v.id = a.vacancy_id
      WHERE v.company_id = ?
      GROUP BY v.id
      ORDER BY v.id DESC
    `).all(req.user.companyId);

    return res.json(vacancies.map(v => {
      const clock = getJobNow(v);
      return {
        ...v,
        requiredSkills: JSON.parse(v.required_skills || '[]'),
        allowedBranches: JSON.parse(v.allowed_branches || '[]'),
        rounds: JSON.parse(v.rounds || '[]'),
        virtualDate: clock.dateStr,
        isVirtual: clock.isVirtual
      };
    }));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch vacancies' });
  }
});

/**
 * Post Vacancy
 * POST /api/recruiter/vacancies
 */
router.post('/vacancies', (req, res) => {
  try {
    const company = db.prepare('SELECT approval_status FROM company WHERE id = ?').get(req.user.companyId);
    if (!company || company.approval_status !== 'Approved') {
      return res.status(403).json({ error: 'Company registration is pending approval by the Placement Cell. You cannot post vacancies yet.' });
    }

    const {
      role, description, requiredSkills, allowedBranches,
      minCgpa, backlogRule, maxBacklogs, ctc, openings, openDate, closeDate, rounds
    } = req.body;

    if (!role || !ctc || !openDate || !closeDate) {
      return res.status(400).json({ error: 'Role, CTC, Open Date, and Close Date are required fields.' });
    }

    const formattedRounds = (rounds && Array.isArray(rounds) && rounds.length > 0)
      ? rounds.map((r, idx) => ({
          roundIndex: idx,
          name: r.name || `Round ${idx + 1}`,
          date: r.date || closeDate,
          time: r.time || '10:00 AM',
          mode: r.mode || 'Online',
          venue: r.venue || 'Campus Placement Center'
        }))
      : [{ roundIndex: 0, name: 'Round 1: Screening Test', date: closeDate, time: '10:00 AM', mode: 'Online', venue: 'Virtual' }];

    const insert = db.prepare(`
      INSERT INTO vacancy (
        company_id, role, description, required_skills, allowed_branches,
        min_cgpa, backlog_rule, max_backlogs, ctc, openings, open_date, close_date, rounds, status, virtual_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?)
    `);

    const result = insert.run(
      req.user.companyId,
      role,
      description || '',
      JSON.stringify(requiredSkills || []),
      JSON.stringify(allowedBranches || []),
      minCgpa ? parseFloat(minCgpa) : 6.0,
      backlogRule || 'NotAllowed',
      maxBacklogs ? parseInt(maxBacklogs, 10) : 0,
      ctc,
      openings ? parseInt(openings, 10) : 1,
      openDate,
      closeDate,
      JSON.stringify(formattedRounds),
      openDate
    );

    return res.json({
      message: 'Vacancy posted successfully!',
      vacancyId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    console.error('Post vacancy error:', err);
    return res.status(500).json({ error: 'Failed to post vacancy' });
  }
});

/**
 * Edit Vacancy
 * PUT /api/recruiter/vacancies/:id
 */
router.put('/vacancies/:id', (req, res) => {
  try {
    const vacancy = db.prepare('SELECT * FROM vacancy WHERE id = ? AND company_id = ?').get(req.params.id, req.user.companyId);
    if (!vacancy) return res.status(404).json({ error: 'Vacancy not found' });

    const {
      role, description, requiredSkills, allowedBranches,
      minCgpa, backlogRule, maxBacklogs, ctc, openings, openDate, closeDate, rounds, status
    } = req.body;

    db.prepare(`
      UPDATE vacancy 
      SET 
        role = COALESCE(?, role),
        description = COALESCE(?, description),
        required_skills = COALESCE(?, required_skills),
        allowed_branches = COALESCE(?, allowed_branches),
        min_cgpa = COALESCE(?, min_cgpa),
        backlog_rule = COALESCE(?, backlog_rule),
        max_backlogs = COALESCE(?, max_backlogs),
        ctc = COALESCE(?, ctc),
        openings = COALESCE(?, openings),
        open_date = COALESCE(?, open_date),
        close_date = COALESCE(?, close_date),
        rounds = COALESCE(?, rounds),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      role || null,
      description || null,
      requiredSkills ? JSON.stringify(requiredSkills) : null,
      allowedBranches ? JSON.stringify(allowedBranches) : null,
      minCgpa ? parseFloat(minCgpa) : null,
      backlogRule || null,
      maxBacklogs !== undefined ? parseInt(maxBacklogs, 10) : null,
      ctc || null,
      openings ? parseInt(openings, 10) : null,
      openDate || null,
      closeDate || null,
      rounds ? JSON.stringify(rounds) : null,
      status || null,
      vacancy.id
    );

    return res.json({ message: 'Vacancy updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update vacancy' });
  }
});

/**
 * Close Vacancy Early
 * PUT /api/recruiter/vacancies/:id/close-early
 */
router.put('/vacancies/:id/close-early', (req, res) => {
  try {
    const vacancy = db.prepare('SELECT * FROM vacancy WHERE id = ? AND company_id = ?').get(req.params.id, req.user.companyId);
    if (!vacancy) return res.status(404).json({ error: 'Vacancy not found' });

    const now = getNow(vacancy.id);
    const nowStr = formatDateToYYYYMMDD(now);
    db.prepare('UPDATE vacancy SET status = ?, close_date = ? WHERE id = ?').run('Closed', nowStr, vacancy.id);

    return res.json({ message: 'Vacancy closed early successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to close vacancy' });
  }
});

/**
 * Get Applications for a Vacancy (Locked before close date by job clock, Unlocked after close date)
 * GET /api/recruiter/vacancies/:id/applications
 */
router.get('/vacancies/:id/applications', (req, res) => {
  try {
    const vacancy = db.prepare(`
      SELECT v.*, c.name AS company_name 
      FROM vacancy v 
      JOIN company c ON v.company_id = c.id
      WHERE v.id = ? AND v.company_id = ?
    `).get(req.params.id, req.user.companyId);

    if (!vacancy) return res.status(404).json({ error: 'Vacancy not found' });

    const clock = getJobNow(vacancy);
    const now = getNow(vacancy.id);
    const nowStr = formatDateToYYYYMMDD(now);
    const appliedCount = db.prepare('SELECT COUNT(*) as count FROM application WHERE vacancy_id = ?').get(vacancy.id).count;
    const archivedCount = db.prepare('SELECT COUNT(*) as count FROM application WHERE vacancy_id = ? AND is_archived = 1').get(vacancy.id).count;
    const rounds = JSON.parse(vacancy.rounds || '[]');

    // Check if application window is locked according to Job Clock
    const isLocked = (nowStr <= vacancy.close_date) && vacancy.status !== 'Closed';

    if (isLocked) {
      return res.json({
        isLocked: true,
        virtualDate: nowStr,
        isVirtual: clock.isVirtual,
        closeDate: vacancy.close_date,
        vacancy: {
          id: vacancy.id,
          role: vacancy.role,
          openDate: vacancy.open_date,
          closeDate: vacancy.close_date,
          status: vacancy.status,
          rounds
        },
        appliedCount,
        archivedCount: 0,
        message: `Applications unlock after ${vacancy.close_date}. (Job Virtual Date: ${nowStr}). Applied so far: ${appliedCount}`
      });
    }

    // Unlocked: Return active ranked applicant table (archived candidates hidden from active list)
    const applicants = db.prepare(`
      SELECT 
        a.id AS application_id,
        a.student_master_id,
        a.match_percent,
        a.matched_skills,
        a.missing_skills,
        a.readiness_level,
        a.status AS application_status,
        a.rejection_reason,
        a.recruiter_remark,
        a.is_archived,
        a.applied_at,
        sm.reg_no,
        sm.name AS student_name,
        sm.email AS student_email,
        sm.branch,
        sm.year,
        sm.cgpa,
        sm.backlog_count,
        sp.photo_url,
        sp.linkedin,
        sp.github,
        sp.cv_file_name,
        o.id AS offer_id,
        o.status AS offer_status
      FROM application a
      JOIN student_master sm ON a.student_master_id = sm.id
      LEFT JOIN student_profile sp ON sm.id = sp.student_master_id
      LEFT JOIN offer o ON a.id = o.application_id
      WHERE a.vacancy_id = ? AND a.is_archived = 0
      ORDER BY a.match_percent DESC, sm.cgpa DESC
    `).all(vacancy.id);

    const rankedApplicants = applicants.map((app, index) => ({
      rank: index + 1,
      id: app.application_id,
      studentId: app.student_master_id,
      name: app.student_name,
      regNo: app.reg_no,
      email: app.student_email,
      branch: app.branch,
      year: app.year,
      cgpa: app.cgpa,
      backlogCount: app.backlog_count,
      matchPercent: app.match_percent,
      matchedSkills: JSON.parse(app.matched_skills || '[]'),
      missingSkills: JSON.parse(app.missing_skills || '[]'),
      readinessLevel: app.readiness_level,
      status: app.application_status,
      rejectionReason: app.rejection_reason,
      recruiterRemark: app.recruiter_remark,
      appliedAt: app.applied_at,
      photoUrl: app.photo_url,
      linkedin: app.linkedin,
      github: app.github,
      cvFileName: app.cv_file_name,
      offerStatus: app.offer_status
    }));

    // Check round decision lock statuses
    const roundDecisionStatuses = rounds.map((r, idx) => {
      const examDate = r.date || vacancy.close_date;
      const examDateObj = new Date(`${examDate}T12:00:00`);
      examDateObj.setDate(examDateObj.getDate() + 1);
      const dayAfterExamStr = formatDateToYYYYMMDD(examDateObj);
      const isDecisionLocked = nowStr <= examDate;

      return {
        roundIndex: idx,
        roundName: r.name,
        examDate,
        dayAfterExam: dayAfterExamStr,
        isDecisionLocked,
        decisionOpensOn: dayAfterExamStr,
        statusMessage: isDecisionLocked
          ? `Decisions open on ${dayAfterExamStr} (the day after the exam).`
          : `Decisions are OPEN.`
      };
    });

    return res.json({
      isLocked: false,
      virtualDate: nowStr,
      isVirtual: clock.isVirtual,
      collegeName: 'National Institute of Engineering & Technology',
      vacancy: {
        id: vacancy.id,
        role: vacancy.role,
        openDate: vacancy.open_date,
        closeDate: vacancy.close_date,
        status: vacancy.status,
        rounds
      },
      totalApplicants: appliedCount,
      activeApplicantsCount: applicants.length,
      archivedCount,
      closedDate: vacancy.close_date,
      applicants: rankedApplicants,
      roundDecisionStatuses
    });
  } catch (err) {
    console.error('Fetch vacancy applicants error:', err);
    return res.status(500).json({ error: 'Failed to fetch applicants' });
  }
});

/**
 * Get Candidate Profile Drawer Details (Read-only for company; Revoked if candidate is archived)
 * GET /api/recruiter/candidate/:studentId
 */
router.get('/candidate/:studentId', (req, res) => {
  try {
    const student = db.prepare('SELECT * FROM student_master WHERE id = ?').get(req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Ensure student applied to at least one vacancy of this recruiter's company
    const application = db.prepare(`
      SELECT a.id, a.is_archived, a.status 
      FROM application a
      JOIN vacancy v ON a.vacancy_id = v.id
      WHERE a.student_master_id = ? AND v.company_id = ?
    `).get(student.id, req.user.companyId);

    if (!application) {
      return res.status(403).json({ error: 'Access denied. Candidate has not applied to your vacancies.' });
    }

    if (application.is_archived) {
      return res.status(403).json({
        error: 'Candidate profile access is revoked as candidate was not selected for this role.',
        isArchived: true
      });
    }

    const profile = db.prepare('SELECT * FROM student_profile WHERE student_master_id = ?').get(student.id);

    return res.json({
      id: student.id,
      name: student.name,
      regNo: student.reg_no,
      branch: student.branch,
      year: student.year,
      cgpa: student.cgpa,
      backlogCount: student.backlog_count,
      email: student.email,
      photoUrl: profile ? profile.photo_url : null,
      linkedin: profile ? profile.linkedin : null,
      github: profile ? profile.github : null,
      phone: profile ? profile.phone : null,
      cvFileName: profile ? profile.cv_file_name : null,
      cvText: profile ? profile.cv_text : null,
      confirmedSkills: profile ? JSON.parse(profile.confirmed_skills || '[]') : [],
      projects: profile ? JSON.parse(profile.projects || '[]') : [],
      certifications: profile ? JSON.parse(profile.certifications || '[]') : [],
      internships: profile ? JSON.parse(profile.internships || '[]') : []
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch candidate profile' });
  }
});

/**
 * Submit Rounds & Results (Pass / Fail / Shortlist Candidates)
 * Enforces Day-After-Exam Rule via Per-Job Demo Clock
 * POST /api/recruiter/rounds/results
 * Body: { vacancyId, roundIndex, evaluatedCandidates: [{ applicationId, result: 'Pass' | 'Fail', privateRemark, rejectionReason }] }
 */
router.post('/rounds/results', (req, res) => {
  try {
    const { vacancyId, roundIndex, evaluatedCandidates } = req.body;

    const vacancy = db.prepare(`
      SELECT v.*, c.name AS company_name 
      FROM vacancy v 
      JOIN company c ON v.company_id = c.id 
      WHERE v.id = ? AND v.company_id = ?
    `).get(vacancyId, req.user.companyId);

    if (!vacancy) return res.status(404).json({ error: 'Vacancy not found' });

    const clock = getJobNow(vacancy);
    const now = getNow(vacancy.id);
    const nowStr = formatDateToYYYYMMDD(now);
    const rounds = JSON.parse(vacancy.rounds || '[]');
    const rIdx = parseInt(roundIndex, 10) || 0;
    const currentRoundInfo = rounds[rIdx] || { name: `Round ${rIdx + 1}`, date: vacancy.close_date };
    const nextRoundInfo = rounds[rIdx + 1];
    const isLastRound = rIdx >= rounds.length - 1;

    // Rule: Decision screen is locked until the day AFTER the exam date
    const examDate = currentRoundInfo.date || vacancy.close_date;
    const examDateObj = new Date(`${examDate}T12:00:00`);
    examDateObj.setDate(examDateObj.getDate() + 1);
    const dayAfterExamStr = formatDateToYYYYMMDD(examDateObj);

    if (nowStr <= examDate) {
      return res.status(400).json({
        error: `Decisions for ${currentRoundInfo.name} are locked until the day after the exam (${dayAfterExamStr}). Current job virtual date: ${nowStr}. Use Demo Controls to advance time.`,
        decisionLocked: true,
        decisionOpensOn: dayAfterExamStr,
        virtualDate: nowStr
      });
    }

    let passedCount = 0;
    let rejectedCount = 0;
    const warnings = [];

    for (const item of evaluatedCandidates) {
      const { applicationId, result, privateRemark, rejectionReason } = item;

      // Save round result with private remark
      db.prepare(`
        INSERT INTO round_result (application_id, round_index, result, feedback, private_remark, notified)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(applicationId, rIdx, result, '', privateRemark || '', 1);

      const app = db.prepare(`
        SELECT a.*, sm.name, sm.email, sm.reg_no, sm.id AS student_id
        FROM application a
        JOIN student_master sm ON a.student_master_id = sm.id
        WHERE a.id = ?
      `).get(applicationId);

      if (!app) continue;

      if (result === 'Pass') {
        passedCount++;
        let nextStatus = '';

        if (isLastRound) {
          nextStatus = 'Selected';
        } else {
          nextStatus = `Round ${rIdx + 2}`;
        }

        // Clash detection check across other company drives
        if (nextRoundInfo && nextRoundInfo.date) {
          const otherScheduled = db.prepare(`
            SELECT a.id, v.role, c.name AS other_company, v.rounds
            FROM application a
            JOIN vacancy v ON a.vacancy_id = v.id
            JOIN company c ON v.company_id = c.id
            WHERE a.student_master_id = ? AND a.id != ? AND (a.status LIKE 'Round %' OR a.status = 'Shortlisted')
          `).all(app.student_id, applicationId);

          for (const other of otherScheduled) {
            let otherRounds = [];
            try { otherRounds = JSON.parse(other.rounds || '[]'); } catch {}
            for (const or of otherRounds) {
              if (isTimeOverlapping(nextRoundInfo.date, nextRoundInfo.time, or.date, or.time)) {
                warnings.push(`Scheduling Clash Warning: ${app.name} (${app.reg_no}) is also scheduled for '${other.other_company} - ${other.role}' on ${nextRoundInfo.date} at ${nextRoundInfo.time}.`);
              }
            }
          }
        }

        db.prepare('UPDATE application SET status = ?, recruiter_remark = ? WHERE id = ?').run(
          nextStatus,
          privateRemark || null,
          applicationId
        );

        // (a) Selected student notification + email
        const roundDetails = [nextRoundInfo?.date, nextRoundInfo?.time, nextRoundInfo?.mode, nextRoundInfo?.venue]
          .filter(Boolean)
          .join(', ');
        const selectedMsg = isLastRound
          ? `You are selected for ${vacancy.role} at ${vacancy.company_name}.`
          : `You are selected for ${nextRoundInfo.name} on ${roundDetails}.`;

        sendNotification(
          { type: 'single', recipientId: app.email },
          {
            eventType: 'round_result',
            eventKey: `round_pass_${applicationId}_${rIdx}`,
            title: `Selection Update: ${vacancy.role} - ${currentRoundInfo.name}`,
            message: selectedMsg,
            vacancyId: vacancy.id,
            applicationId: applicationId,
            roundIndex: rIdx,
            channel: 'both',
            senderId: req.user.email
          }
        );

      } else {
        // (b) Non-selected / Rejected candidate
        rejectedCount++;

        // Mark as ARCHIVED for recruiter (disappears from active recruiter view)
        db.prepare(`
          UPDATE application 
          SET status = 'Rejected', is_archived = 1, rejection_reason = NULL, recruiter_remark = ?
          WHERE id = ?
        `).run(
          privateRemark || null,
          applicationId
        );

        // (c) Exact specification message with NO scores or reason
        const rejectionMsg = `Thank you for taking part in ${currentRoundInfo.name}. You have not been selected for the next round. Better luck next time.`;

        sendNotification(
          { type: 'single', recipientId: app.email },
          {
            eventType: 'round_result',
            eventKey: `round_fail_${applicationId}_${rIdx}`,
            title: `Status Update: ${vacancy.role} - ${currentRoundInfo.name}`,
            message: rejectionMsg,
            vacancyId: vacancy.id,
            applicationId: applicationId,
            roundIndex: rIdx,
            channel: 'both',
            senderId: req.user.email
          }
        );
      }
    }

    return res.json({
      message: `Results submitted successfully. ${passedCount} candidates moved forward, ${rejectedCount} candidates not selected and archived.`,
      passedCount,
      rejectedCount,
      warnings
    });
  } catch (err) {
    console.error('Submit round results error:', err);
    return res.status(500).json({ error: 'Failed to submit round results' });
  }
});

/**
 * Bulk Upload Round Decisions via CSV / JSON
 * POST /api/recruiter/rounds/bulk-upload
 * Body: { vacancyId, roundIndex, records: [{ regNo, email, result: 'Pass' | 'Fail', remark }] }
 */
router.post('/rounds/bulk-upload', (req, res) => {
  try {
    const { vacancyId, roundIndex, records } = req.body;
    if (!vacancyId || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid bulk upload payload' });
    }

    const evaluatedCandidates = [];

    for (const rec of records) {
      let app = null;
      if (rec.regNo) {
        app = db.prepare(`
          SELECT a.id FROM application a
          JOIN student_master sm ON a.student_master_id = sm.id
          WHERE a.vacancy_id = ? AND UPPER(sm.reg_no) = ?
        `).get(vacancyId, rec.regNo.trim().toUpperCase());
      }
      if (!app && rec.email) {
        app = db.prepare(`
          SELECT a.id FROM application a
          JOIN student_master sm ON a.student_master_id = sm.id
          WHERE a.vacancy_id = ? AND LOWER(sm.email) = ?
        `).get(vacancyId, rec.email.trim().toLowerCase());
      }

      if (app) {
        evaluatedCandidates.push({
          applicationId: app.id,
          result: rec.result === 'Pass' || rec.result === 'Select' ? 'Pass' : 'Fail',
          privateRemark: rec.remark || ''
        });
      }
    }

    if (evaluatedCandidates.length === 0) {
      return res.status(400).json({ error: 'No matching applicants found in uploaded file for this vacancy.' });
    }

    // Forward to evaluation handler logic
    req.body.evaluatedCandidates = evaluatedCandidates;
    return router.handle(req, res);
  } catch (err) {
    return res.status(500).json({ error: 'Bulk upload processing failed' });
  }
});

/**
 * Targeted Notification Dispatch from Recruiter
 * POST /api/recruiter/vacancies/:id/broadcast-message
 * Body: { targetGroup: 'all' | 'selected' | 'rejected' | 'single' | 'list', studentEmails?: string[], subject, message }
 */
router.post('/vacancies/:id/broadcast-message', (req, res) => {
  try {
    const vacancyId = parseInt(req.params.id, 10);
    const { targetGroup, studentEmails, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required.' });
    }

    const vacancy = db.prepare('SELECT id, role, company_id FROM vacancy WHERE id = ? AND company_id = ?').get(vacancyId, req.user.companyId);
    if (!vacancy) return res.status(404).json({ error: 'Vacancy not found' });

    let audience = {};
    if (targetGroup === 'all') {
      audience = { type: 'applicants', vacancyId };
    } else if (targetGroup === 'selected') {
      const selectedApps = db.prepare(`
        SELECT DISTINCT sm.email FROM application a
        JOIN student_master sm ON a.student_master_id = sm.id
        WHERE a.vacancy_id = ? AND a.status IN ('Selected', 'Offer Released', 'Offer Accepted')
      `).all(vacancyId);
      audience = { type: 'list', studentEmails: selectedApps.map(s => s.email) };
    } else if (targetGroup === 'rejected') {
      const rejectedApps = db.prepare(`
        SELECT DISTINCT sm.email FROM application a
        JOIN student_master sm ON a.student_master_id = sm.id
        WHERE a.vacancy_id = ? AND a.status = 'Rejected'
      `).all(vacancyId);
      audience = { type: 'list', studentEmails: rejectedApps.map(s => s.email) };
    } else if (targetGroup === 'single' && studentEmails && studentEmails.length > 0) {
      audience = { type: 'single', recipientId: studentEmails[0] };
    } else if (targetGroup === 'list' && studentEmails) {
      audience = { type: 'list', studentEmails };
    } else {
      return res.status(400).json({ error: 'Invalid target group or student list' });
    }

    const result = sendNotification(audience, {
      eventType: 'broadcast',
      eventKey: `recruiter_msg_${vacancyId}_${Date.now()}`,
      title: subject.trim(),
      message: message.trim(),
      vacancyId,
      channel: 'both',
      senderId: req.user.email
    });

    return res.json({
      message: `Message sent successfully to ${result.recipientsCount} recipient(s).`,
      recipientsCount: result.recipientsCount
    });
  } catch (err) {
    console.error('Recruiter broadcast message error:', err);
    return res.status(500).json({ error: 'Failed to send targeted message' });
  }
});

/**
 * Release Offer to Selected Candidate
 * POST /api/recruiter/offers/release
 * Body: { applicationId, ctc, joiningDate, documents }
 */
router.post('/offers/release', (req, res) => {
  try {
    const { applicationId, ctc, joiningDate, documents } = req.body;
    if (!applicationId || !ctc || !joiningDate) {
      return res.status(400).json({ error: 'Application ID, CTC, and Joining Date are required.' });
    }

    const app = db.prepare(`
      SELECT a.*, v.role, c.name AS company_name, sm.name AS student_name, sm.email AS student_email
      FROM application a
      JOIN vacancy v ON a.vacancy_id = v.id
      JOIN company c ON v.company_id = c.id
      JOIN student_master sm ON a.student_master_id = sm.id
      WHERE a.id = ? AND v.company_id = ?
    `).get(applicationId, req.user.companyId);

    if (!app) return res.status(404).json({ error: 'Application not found' });

    // Insert or update offer
    const existingOffer = db.prepare('SELECT id FROM offer WHERE application_id = ?').get(applicationId);
    if (existingOffer) {
      db.prepare(`
        UPDATE offer 
        SET ctc = ?, joining_date = ?, status = 'Released', documents = ?, released_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(ctc, joiningDate, JSON.stringify(documents || ['Offer_Letter.pdf']), existingOffer.id);
    } else {
      db.prepare(`
        INSERT INTO offer (application_id, ctc, joining_date, status, documents)
        VALUES (?, ?, ?, 'Released', ?)
      `).run(applicationId, ctc, joiningDate, JSON.stringify(documents || ['Offer_Letter.pdf']));
    }

    db.prepare(`UPDATE application SET status = 'Offer Released' WHERE id = ?`).run(applicationId);

    // Send high-priority notification to student
    sendNotification(
      { type: 'single', recipientId: app.student_email },
      {
        eventType: 'offer_released',
        eventKey: `offer_rel_${applicationId}`,
        title: `🎉 Official Job Offer Released: ${app.company_name}`,
        message: `Congratulations ${app.student_name}! ${app.company_name} has released your official offer for ${app.role} with a compensation package of ${ctc}. Expected joining date: ${joiningDate}. Log in to view terms and accept.`,
        vacancyId: app.vacancy_id,
        applicationId: applicationId,
        channel: 'both',
        senderId: req.user.email
      }
    );

    return res.json({ message: 'Offer released successfully!' });
  } catch (err) {
    console.error('Offer release error:', err);
    return res.status(500).json({ error: 'Failed to release offer' });
  }
});

/**
 * Get Recruiter Hiring Dashboard Analytics & Funnel Chart
 * GET /api/recruiter/dashboard
 */
router.get('/dashboard', (req, res) => {
  try {
    const companyId = req.user.companyId;

    const vacancies = db.prepare('SELECT id, role, openings FROM vacancy WHERE company_id = ?').all(companyId);
    const totalVacancies = vacancies.length;
    const totalOpenings = vacancies.reduce((sum, v) => sum + (v.openings || 1), 0);

    const apps = db.prepare(`
      SELECT a.id, a.status, a.match_percent, a.vacancy_id, a.is_archived
      FROM application a
      JOIN vacancy v ON a.vacancy_id = v.id
      WHERE v.company_id = ?
    `).all(companyId);

    const totalApplied = apps.length;
    const totalShortlisted = apps.filter(a => a.status === 'Shortlisted' || a.status.startsWith('Round') || a.status === 'Selected' || a.status.startsWith('Offer')).length;
    const round1 = apps.filter(a => a.status.startsWith('Round') || a.status === 'Selected' || a.status.startsWith('Offer')).length;
    const round2 = apps.filter(a => a.status === 'Round 2' || a.status === 'Round 3' || a.status === 'Selected' || a.status.startsWith('Offer')).length;
    const selected = apps.filter(a => a.status === 'Selected' || a.status.startsWith('Offer')).length;
    const offerReleased = apps.filter(a => a.status.startsWith('Offer')).length;
    const offerAccepted = apps.filter(a => a.status === 'Offer Accepted').length;

    // Funnel data for charts
    const funnel = [
      { step: 'Applied', count: totalApplied, fill: '#0d9488' },
      { step: 'Shortlisted', count: totalShortlisted, fill: '#14b8a6' },
      { step: 'Round 1 (Coding)', count: round1, fill: '#2dd4bf' },
      { step: 'Round 2 (Tech)', count: round2, fill: '#5eead4' },
      { step: 'Selected', count: selected, fill: '#99f6e4' },
      { step: 'Offer Accepted', count: offerAccepted, fill: '#10b981' }
    ];

    // Pending actions
    const pendingActions = [];
    if (selected > offerReleased) {
      pendingActions.push({
        id: 1,
        title: 'Release Pending Offers',
        description: `${selected - offerReleased} candidate(s) cleared final interview and need offer letters.`
      });
    }

    return res.json({
      metrics: {
        totalVacancies,
        totalOpenings,
        totalApplied,
        selected,
        offerReleased,
        offerAccepted,
        conversionRate: totalApplied > 0 ? Math.round((offerAccepted / totalApplied) * 100) : 0
      },
      funnel,
      pendingActions
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch recruiter dashboard' });
  }
});

module.exports = router;
