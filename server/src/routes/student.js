const express = require('express');
const multer = require('multer');
const { db } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { extractSkills, parseResume } = require('../ai/skillExtractor');
const { calculateSkillMatch, evaluateEligibility } = require('../ai/matcher');
const { parseFileText } = require('../utils/fileParser');
const { sendNotification } = require('../services/notificationService');
const { getJobNow, getNow, formatDateToYYYYMMDD } = require('../utils/demoClock');

const router = express.Router();
router.use(authMiddleware);
router.use(requireRole('student'));

// Configure Multer for in-memory file uploads with limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  }
});

/**
 * Helper to compute student profile completeness percentage
 */
function calculateProfileCompleteness(student, profile) {
  let score = 20; // Base: Registered with Master record
  if (profile.photo_url) score += 10;
  if (profile.linkedin) score += 10;
  if (profile.github) score += 10;
  if (profile.phone) score += 10;
  if (profile.cv_file_name) score += 15;

  let skills = [];
  try { skills = JSON.parse(profile.confirmed_skills || '[]'); } catch {}
  if (skills.length >= 5) score += 15;
  else if (skills.length > 0) score += 8;

  let projects = [];
  try { projects = JSON.parse(profile.projects || '[]'); } catch {}
  if (projects.length > 0) score += 5;

  let certs = [];
  try { certs = JSON.parse(profile.certifications || '[]'); } catch {}
  if (certs.length > 0) score += 5;

  return Math.min(100, score);
}

/**
 * Get Student Profile
 * GET /api/student/profile
 */
router.get('/profile', (req, res) => {
  try {
    const student = db.prepare('SELECT * FROM student_master WHERE id = ?').get(req.user.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    let profile = db.prepare('SELECT * FROM student_profile WHERE student_master_id = ?').get(student.id);
    if (!profile) {
      db.prepare(`
        INSERT INTO student_profile (student_master_id, photo_url, confirmed_skills, projects, certifications, internships)
        VALUES (?, ?, '[]', '[]', '[]', '[]')
      `).run(student.id, `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`);
      profile = db.prepare('SELECT * FROM student_profile WHERE student_master_id = ?').get(student.id);
    }

    const completeness = calculateProfileCompleteness(student, profile);

    return res.json({
      student: {
        id: student.id,
        regNo: student.reg_no,
        name: student.name,
        email: student.email,
        branch: student.branch,
        discipline: student.discipline || 'Engineering & Technology',
        college: student.college || 'Apex Institute of Technology',
        year: student.year,
        passoutBatch: student.passout_batch,
        cgpa: student.cgpa,
        backlogCount: student.backlog_count
      },
      profile: {
        ...profile,
        photoUrl: profile.photo_url,
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        phone: profile.phone || '',
        cvFileName: profile.cv_file_name || '',
        cvText: profile.cv_text || '',
        confirmedSkills: JSON.parse(profile.confirmed_skills || '[]'),
        projects: JSON.parse(profile.projects || '[]'),
        certifications: JSON.parse(profile.certifications || '[]'),
        internships: JSON.parse(profile.internships || '[]')
      },
      completeness
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    return res.status(500).json({ error: 'Failed to fetch student profile' });
  }
});

/**
 * Upload Photo (Max 2 MB, Image Types Only)
 * POST /api/student/upload-photo
 */
router.post('/upload-photo', upload.single('photo'), (req, res) => {
  try {
    if (!req.file && !req.body.photoData) {
      return res.status(400).json({ error: 'No photo file provided.' });
    }

    let photoUrl = '';

    if (req.file) {
      // Validate file size (2 MB)
      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(400).json({ error: 'Photo size exceeds 2 MB limit.' });
      }

      // Validate image mime type
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Only image files (JPEG, PNG, WEBP, GIF, SVG) are allowed.' });
      }

      const base64 = req.file.buffer.toString('base64');
      photoUrl = `data:${req.file.mimetype};base64,${base64}`;
    } else if (req.body.photoData) {
      photoUrl = req.body.photoData;
    }

    db.prepare(`
      UPDATE student_profile 
      SET photo_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE student_master_id = ?
    `).run(photoUrl, req.user.id);

    return res.json({
      message: 'Profile photo updated successfully!',
      photoUrl
    });
  } catch (err) {
    console.error('Upload photo error:', err);
    return res.status(500).json({ error: 'Failed to upload photo.' });
  }
});

/**
 * Update Student Profile
 * PUT /api/student/profile
 */
router.put('/profile', (req, res) => {
  try {
    const { photoUrl, linkedin, github, phone, confirmedSkills, projects, certifications, internships } = req.body;
    
    // Validate URLs if provided
    if (linkedin && typeof linkedin === 'string' && linkedin.trim()) {
      const clean = linkedin.trim();
      if (!/^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(clean)) {
        return res.status(400).json({ error: 'Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/username).' });
      }
    }

    if (github && typeof github === 'string' && github.trim()) {
      const clean = github.trim();
      if (!/^https?:\/\/(www\.)?github\.com\/.+/i.test(clean)) {
        return res.status(400).json({ error: 'Please enter a valid GitHub URL (e.g. https://github.com/username).' });
      }
    }

    if (phone && typeof phone === 'string' && phone.trim()) {
      const clean = phone.trim();
      if (!/^[+]?[\d\s-]{7,18}$/.test(clean)) {
        return res.status(400).json({ error: 'Please enter a valid phone number (e.g. +91 9876543210).' });
      }
    }

    db.prepare(`
      UPDATE student_profile 
      SET 
        photo_url = COALESCE(?, photo_url),
        linkedin = ?,
        github = ?,
        phone = ?,
        confirmed_skills = ?,
        projects = ?,
        certifications = ?,
        internships = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE student_master_id = ?
    `).run(
      photoUrl || null,
      linkedin || null,
      github || null,
      phone || null,
      JSON.stringify(confirmedSkills || []),
      JSON.stringify(projects || []),
      JSON.stringify(certifications || []),
      JSON.stringify(internships || []),
      req.user.id
    );

    return res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Upload CV (Multipart file or JSON fallback) and run AI Extraction
 * POST /api/student/upload-cv
 */
router.post('/upload-cv', upload.single('cvFile'), (req, res) => {
  try {
    let cvText = '';
    let cvFileName = 'Uploaded_Resume.pdf';

    if (req.file) {
      cvFileName = req.file.originalname;

      // Validate file size (5 MB)
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size exceeds maximum allowed 5 MB.' });
      }

      // Parse text from buffer
      const parseResult = parseFileText(req.file.buffer, req.file.originalname, req.file.mimetype);
      if (!parseResult.success) {
        return res.status(400).json({
          error: parseResult.error || 'Could not parse text from this file. Please paste your CV text below.',
          fallbackRequired: true
        });
      }

      cvText = parseResult.text;
    } else if (req.body.cvText) {
      // JSON body fallback (paste text or presets)
      cvText = req.body.cvText.trim();
      cvFileName = req.body.cvFileName || 'Pasted_Resume_Text.txt';
    } else {
      return res.status(400).json({
        error: 'No file or CV text provided. Please select a PDF, DOCX, or TXT file.',
        fallbackRequired: true
      });
    }

    if (!cvText || cvText.length < 15) {
      return res.status(400).json({
        error: 'The uploaded file does not contain readable text. Please use the Paste CV fallback below.',
        fallbackRequired: true
      });
    }

    // Run AI Skill Extractor & NLP Profiler
    const extractedSkills = extractSkills(cvText);
    const parsed = parseResume(cvText);

    // Save CV text & file name to student profile
    db.prepare(`
      UPDATE student_profile 
      SET cv_file_name = ?, cv_text = ?, updated_at = CURRENT_TIMESTAMP
      WHERE student_master_id = ?
    `).run(cvFileName, cvText, req.user.id);

    return res.json({
      message: 'CV analyzed successfully by AI Engine',
      cvFileName,
      cvText,
      extractedSkills: extractedSkills.map(s => s.name),
      skillDetails: extractedSkills,
      parsedInfo: parsed
    });
  } catch (err) {
    console.error('CV upload error:', err);
    return res.status(500).json({
      error: `Failed to process CV: ${err.message}. Please use the Paste CV fallback.`,
      fallbackRequired: true
    });
  }
});

/**
 * Confirm Skills & Recompute AI Job Matches
 * POST /api/student/confirm-skills
 */
router.post('/confirm-skills', (req, res) => {
  try {
    const { confirmedSkills } = req.body;
    if (!Array.isArray(confirmedSkills)) {
      return res.status(400).json({ error: 'confirmedSkills must be an array of skill names' });
    }

    const student = db.prepare('SELECT * FROM student_master WHERE id = ?').get(req.user.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Save confirmed skills
    db.prepare(`
      UPDATE student_profile 
      SET confirmed_skills = ?, updated_at = CURRENT_TIMESTAMP
      WHERE student_master_id = ?
    `).run(JSON.stringify(confirmedSkills), student.id);

    // Count matching open vacancies
    const openVacancies = db.prepare(`
      SELECT v.* FROM vacancy v
      JOIN company c ON v.company_id = c.id
      WHERE v.status = 'Open' AND c.approval_status = 'Approved'
    `).all();

    let matchingCount = 0;
    for (const vac of openVacancies) {
      let reqSkills = [];
      try { reqSkills = JSON.parse(vac.required_skills || '[]'); } catch {}
      const match = calculateSkillMatch(confirmedSkills, reqSkills);
      if (match.matchPercent >= 60) {
        matchingCount++;
      }
    }

    // Insert In-App Notification
    sendNotification(
      { type: 'single', recipientId: student.email },
      {
        eventType: 'skills_confirmed',
        eventKey: `skills_${student.id}_${Date.now()}`,
        title: 'Profile Updated: AI Matches Refreshed',
        message: `Profile updated: ${matchingCount} job(s) currently match your confirmed skill profile.`,
        channel: 'both',
        senderId: 'Placement Cell <placements@campuslink.edu>'
      }
    );

    return res.json({
      message: 'Skills confirmed and AI job matches updated!',
      confirmedSkills,
      matchingJobCount: matchingCount
    });
  } catch (err) {
    console.error('Confirm skills error:', err);
    return res.status(500).json({ error: 'Failed to confirm skills' });
  }
});

/**
 * Get Available Approved Jobs with AI Matching and Status
 * GET /api/student/jobs
 */
router.get('/jobs', (req, res) => {
  try {
    const student = db.prepare('SELECT * FROM student_master WHERE id = ?').get(req.user.id);
    const profile = db.prepare('SELECT * FROM student_profile WHERE student_master_id = ?').get(req.user.id);
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() || { min_match_percent: 60.0 };

    const confirmedSkills = profile ? JSON.parse(profile.confirmed_skills || '[]') : [];

    // Fetch vacancies of approved companies
    const vacancies = db.prepare(`
      SELECT 
        v.*,
        c.name AS company_name,
        c.logo AS company_logo,
        c.website AS company_website,
        c.description AS company_description,
        (SELECT id FROM application WHERE student_master_id = ? AND vacancy_id = v.id) AS application_id,
        (SELECT status FROM application WHERE student_master_id = ? AND vacancy_id = v.id) AS application_status
      FROM vacancy v
      JOIN company c ON v.company_id = c.id
      WHERE c.approval_status = 'Approved'
      ORDER BY v.id DESC
    `).all(req.user.id, req.user.id);

    const enrichedVacancies = vacancies.map(v => {
      const clock = getJobNow(v);
      const reqSkills = JSON.parse(v.required_skills || '[]');
      const allowedBranches = JSON.parse(v.allowed_branches || '[]');
      const rounds = JSON.parse(v.rounds || '[]');

      // Calculate AI Match using ONLY confirmed skills
      const matchResult = calculateSkillMatch(confirmedSkills, reqSkills);

      // Evaluate Eligibility
      const eligibility = evaluateEligibility(
        {
          ...student,
          confirmed_skills: confirmedSkills
        },
        v,
        settings.min_match_percent
      );

      // Closing status tags according to Job Demo Clock
      const now = getNow(v.id);
      const nowStr = formatDateToYYYYMMDD(now);
      const closeDateObj = new Date(`${v.close_date}T23:59:59`);
      const diffDays = Math.ceil((closeDateObj - now) / (1000 * 60 * 60 * 24));
      
      let tag = 'Active';
      if (nowStr > v.close_date || v.status === 'Closed') {
        tag = 'Closed';
      } else if (diffDays <= 3) {
        tag = 'Closing soon';
      }

      return {
        id: v.id,
        companyId: v.company_id,
        companyName: v.company_name,
        companyLogo: v.company_logo,
        companyWebsite: v.company_website,
        companyDescription: v.company_description,
        role: v.role,
        description: v.description,
        requiredSkills: reqSkills,
        allowedBranches: allowedBranches,
        minCgpa: v.min_cgpa,
        backlogRule: v.backlog_rule,
        maxBacklogs: v.max_backlogs,
        ctc: v.ctc,
        openings: v.openings,
        openDate: v.open_date,
        closeDate: v.close_date,
        rounds: rounds,
        status: v.status,
        virtualDate: clock.dateStr,
        isVirtual: clock.isVirtual,
        tag,
        diffDays,
        aiMatch: matchResult,
        eligibility,
        hasApplied: Boolean(v.application_id),
        applicationId: v.application_id,
        applicationStatus: v.application_status
      };
    });

    return res.json(enrichedVacancies);
  } catch (err) {
    console.error('Fetch student jobs error:', err);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

/**
 * Get Specific Job Details with Detailed AI Match Breakdown
 * GET /api/student/jobs/:id
 */
router.get('/jobs/:id', (req, res) => {
  try {
    const student = db.prepare('SELECT * FROM student_master WHERE id = ?').get(req.user.id);
    const profile = db.prepare('SELECT * FROM student_profile WHERE student_master_id = ?').get(req.user.id);
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() || { min_match_percent: 60.0 };

    const confirmedSkills = profile ? JSON.parse(profile.confirmed_skills || '[]') : [];

    const vacancy = db.prepare(`
      SELECT 
        v.*,
        c.name AS company_name,
        c.logo AS company_logo,
        c.website AS company_website,
        c.description AS company_description,
        c.hr_contact AS company_hr_contact,
        (SELECT id FROM application WHERE student_master_id = ? AND vacancy_id = v.id) AS application_id,
        (SELECT status FROM application WHERE student_master_id = ? AND vacancy_id = v.id) AS application_status
      FROM vacancy v
      JOIN company c ON v.company_id = c.id
      WHERE v.id = ?
    `).get(req.user.id, req.user.id, req.params.id);

    if (!vacancy) return res.status(404).json({ error: 'Job not found' });

    const clock = getJobNow(vacancy);
    const reqSkills = JSON.parse(vacancy.required_skills || '[]');
    const allowedBranches = JSON.parse(vacancy.allowed_branches || '[]');
    const rounds = JSON.parse(vacancy.rounds || '[]');

    const matchResult = calculateSkillMatch(confirmedSkills, reqSkills);
    const eligibility = evaluateEligibility(
      { ...student, confirmed_skills: confirmedSkills },
      vacancy,
      settings.min_match_percent
    );

    const now = getNow(vacancy.id);
    const nowStr = formatDateToYYYYMMDD(now);
    const closeDateObj = new Date(`${vacancy.close_date}T23:59:59`);
    const diffDays = Math.ceil((closeDateObj - now) / (1000 * 60 * 60 * 24));
    let tag = 'Active';
    if (nowStr > vacancy.close_date || vacancy.status === 'Closed') {
      tag = 'Closed';
    } else if (diffDays <= 3) {
      tag = 'Closing soon';
    }

    return res.json({
      id: vacancy.id,
      companyId: vacancy.company_id,
      companyName: vacancy.company_name,
      companyLogo: vacancy.company_logo,
      companyWebsite: vacancy.company_website,
      companyDescription: vacancy.company_description,
      companyHrContact: vacancy.company_hr_contact,
      role: vacancy.role,
      description: vacancy.description,
      requiredSkills: reqSkills,
      allowedBranches: allowedBranches,
      minCgpa: vacancy.min_cgpa,
      backlogRule: vacancy.backlog_rule,
      maxBacklogs: vacancy.max_backlogs,
      ctc: vacancy.ctc,
      openings: vacancy.openings,
      openDate: vacancy.open_date,
      closeDate: vacancy.close_date,
      rounds: rounds,
      status: vacancy.status,
      virtualDate: clock.dateStr,
      isVirtual: clock.isVirtual,
      tag,
      diffDays,
      aiMatch: matchResult,
      eligibility,
      hasApplied: Boolean(vacancy.application_id),
      applicationId: vacancy.application_id,
      applicationStatus: vacancy.application_status
    });
  } catch (err) {
    console.error('Fetch job detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch job detail' });
  }
});

/**
 * Apply to Job with Strict Ordered Rule Enforcement
 * POST /api/student/apply
 * Body: { vacancyId, regNo, phone, email, consentAccepted }
 */
router.post('/apply', (req, res) => {
  try {
    const { vacancyId, regNo, phone, email, consentAccepted } = req.body;

    if (!vacancyId) {
      return res.status(400).json({ error: 'Vacancy ID is required' });
    }

    if (!consentAccepted) {
      return res.status(400).json({ error: 'You must check the confirmation and consent box to submit your application.' });
    }

    // Pull student records directly from DB for verified security
    const student = db.prepare('SELECT * FROM student_master WHERE id = ?').get(req.user.id);
    const profile = db.prepare('SELECT * FROM student_profile WHERE student_master_id = ?').get(req.user.id);
    const vacancy = db.prepare('SELECT * FROM vacancy WHERE id = ?').get(vacancyId);
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() || { min_match_percent: 60.0 };

    if (!vacancy) {
      return res.status(404).json({ error: 'Job vacancy not found.' });
    }

    // 0. Check Close Date by Job Demo Clock
    const now = getNow(vacancy.id);
    const nowStr = formatDateToYYYYMMDD(now);
    if (nowStr > vacancy.close_date || vacancy.status === 'Closed') {
      return res.status(400).json({
        error: `Applications for this job closed on ${vacancy.close_date}. (Current Job Virtual Date: ${nowStr}).`
      });
    }

    // 0. Check Duplicate Application
    const existing = db.prepare('SELECT * FROM application WHERE student_master_id = ? AND vacancy_id = ?').get(student.id, vacancy.id);
    if (existing) {
      return res.status(400).json({ error: 'You have already applied for this job.' });
    }

    const confirmedSkills = profile ? JSON.parse(profile.confirmed_skills || '[]') : [];
    const reqSkills = JSON.parse(vacancy.required_skills || '[]');

    // Rule A: Match % check (must be >= minMatchPercent, default 60%)
    const matchResult = calculateSkillMatch(confirmedSkills, reqSkills);
    if (matchResult.matchPercent < settings.min_match_percent) {
      return res.status(400).json({
        error: `Skill match score (${matchResult.matchPercent}%) is below the minimum required threshold of ${settings.min_match_percent}%. Missing skills: ${matchResult.missingSkills.join(', ')}.`,
        aiMatch: matchResult
      });
    }

    // Rule B: Identity verification (Typed Reg No must match placement master record)
    if (!regNo || regNo.trim().toUpperCase() !== student.reg_no.toUpperCase()) {
      return res.status(400).json({ error: 'Provided registration number does not match your authenticated placement cell record.' });
    }

    // Rule C: Backlog rule check
    if (vacancy.backlog_rule === 'NotAllowed' && student.backlog_count > 0) {
      return res.status(400).json({
        error: `You have ${student.backlog_count} active backlog(s). This job does not allow backlogs.`
      });
    }

    if (vacancy.backlog_rule === 'AllowedUpToN' && student.backlog_count > vacancy.max_backlogs) {
      return res.status(400).json({
        error: `You have ${student.backlog_count} backlogs, exceeding the job maximum limit of ${vacancy.max_backlogs}.`
      });
    }

    // Rule D: CGPA and Branch check
    if (student.cgpa < vacancy.min_cgpa) {
      return res.status(400).json({
        error: `Your CGPA (${student.cgpa.toFixed(2)}) is below the job minimum requirement (${vacancy.min_cgpa.toFixed(2)}).`
      });
    }

    const allowedBranches = JSON.parse(vacancy.allowed_branches || '[]');
    if (allowedBranches.length > 0 && !allowedBranches.includes(student.branch)) {
      return res.status(400).json({
        error: `Your branch (${student.branch}) is not eligible for this role.`
      });
    }

    // Update phone/email in profile if provided
    if (phone) {
      db.prepare('UPDATE student_profile SET phone = ? WHERE student_master_id = ?').run(phone, student.id);
    }

    // Create Application with AI match snapshot attached
    const insertApp = db.prepare(`
      INSERT INTO application (
        student_master_id, vacancy_id, match_percent, matched_skills, missing_skills, readiness_level, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'Applied')
    `);

    const result = insertApp.run(
      student.id,
      vacancy.id,
      matchResult.matchPercent,
      JSON.stringify(matchResult.matchedSkills),
      JSON.stringify(matchResult.missingSkills),
      matchResult.readinessLevel
    );

    const applicationId = Number(result.lastInsertRowid);

    // Create Notification
    const company = db.prepare('SELECT name FROM company WHERE id = ?').get(vacancy.company_id);
    sendNotification(
      { type: 'single', recipientId: student.email },
      {
        eventType: 'application_submitted',
        eventKey: `app_${applicationId}`,
        title: `Application Submitted: ${vacancy.role}`,
        message: `Your application for ${vacancy.role} at ${company.name} has been successfully submitted with an AI Match Score of ${matchResult.matchPercent}%.`,
        vacancyId: vacancy.id,
        applicationId: applicationId,
        channel: 'both',
        senderId: 'Placement Cell <placements@campuslink.edu>'
      }
    );

    return res.json({
      message: 'Application submitted successfully!',
      applicationId,
      aiMatch: matchResult
    });
  } catch (err) {
    console.error('Application submission error:', err);
    return res.status(500).json({ error: 'Failed to submit application.' });
  }
});

/**
 * Get Applied Jobs with Animated Status Tracker Data
 * GET /api/student/applications
 */
router.get('/applications', (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT 
        a.*,
        v.role AS job_role,
        v.ctc,
        v.rounds AS vacancy_rounds,
        v.close_date,
        c.id AS company_id,
        c.name AS company_name,
        c.logo AS company_logo,
        o.id AS offer_id,
        o.status AS offer_status,
        o.ctc AS offer_ctc,
        o.joining_date AS offer_joining_date,
        o.documents AS offer_documents
      FROM application a
      JOIN vacancy v ON a.vacancy_id = v.id
      JOIN company c ON v.company_id = c.id
      LEFT JOIN offer o ON a.id = o.application_id
      WHERE a.student_master_id = ?
      ORDER BY a.applied_at DESC
    `).all(req.user.id);

    const enriched = apps.map(app => {
      const clock = getJobNow(app.vacancy_id);
      const rounds = JSON.parse(app.vacancy_rounds || '[]');
      const roundResults = db.prepare('SELECT id, round_index, result, evaluated_at FROM round_result WHERE application_id = ? ORDER BY round_index ASC').all(app.id);

      return {
        id: app.id,
        vacancyId: app.vacancy_id,
        companyId: app.company_id,
        companyName: app.company_name,
        companyLogo: app.company_logo,
        jobRole: app.job_role,
        ctc: app.ctc,
        matchPercent: app.match_percent,
        matchedSkills: JSON.parse(app.matched_skills || '[]'),
        missingSkills: JSON.parse(app.missing_skills || '[]'),
        readinessLevel: app.readiness_level,
        status: app.status,
        rejectionReason: app.rejection_reason,
        appliedAt: app.applied_at,
        virtualDate: clock.dateStr,
        isVirtual: clock.isVirtual,
        rounds,
        roundResults,
        offer: app.offer_id ? {
          id: app.offer_id,
          status: app.offer_status,
          ctc: app.offer_ctc,
          joiningDate: app.offer_joining_date,
          documents: JSON.parse(app.offer_documents || '[]')
        } : null
      };
    });

    return res.json(enriched);
  } catch (err) {
    console.error('Fetch applications error:', err);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * Get Student Offers
 * GET /api/student/offers
 */
router.get('/offers', (req, res) => {
  try {
    const offers = db.prepare(`
      SELECT 
        o.*,
        a.id AS application_id,
        v.role AS job_role,
        c.name AS company_name,
        c.logo AS company_logo
      FROM offer o
      JOIN application a ON o.application_id = a.id
      JOIN vacancy v ON a.vacancy_id = v.id
      JOIN company c ON v.company_id = c.id
      WHERE a.student_master_id = ?
    `).all(req.user.id);

    return res.json(offers.map(o => ({
      ...o,
      documents: JSON.parse(o.documents || '[]')
    })));
  } catch (err) {
    console.error('Fetch offers error:', err);
    return res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

/**
 * Respond to Offer (Accept, Decline, Defer)
 * POST /api/student/offers/:id/respond
 * Body: { action: 'Accept' | 'Decline' | 'Defer' }
 */
router.post('/offers/:id/respond', (req, res) => {
  try {
    const { action } = req.body;
    const offerId = req.params.id;

    if (!['Accept', 'Decline', 'Defer'].includes(action)) {
      return res.status(400).json({ error: 'Action must be Accept, Decline, or Defer' });
    }

    const offer = db.prepare(`
      SELECT o.*, a.student_master_id, v.role, c.name as company_name
      FROM offer o
      JOIN application a ON o.application_id = a.id
      JOIN vacancy v ON a.vacancy_id = v.id
      JOIN company c ON v.company_id = c.id
      WHERE o.id = ? AND a.student_master_id = ?
    `).get(offerId, req.user.id);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const targetStatus = action === 'Accept' ? 'Accepted' : action === 'Decline' ? 'Declined' : 'Deferred';

    db.prepare('UPDATE offer SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?').run(targetStatus, offerId);
    db.prepare(`UPDATE application SET status = ? WHERE id = ?`).run(`Offer ${targetStatus}`, offer.application_id);

    // If Accepted and offerRule is 'OneAcceptedOffer', auto-close all other pending applications/offers
    if (action === 'Accept') {
      const otherApps = db.prepare(`
        SELECT id FROM application 
        WHERE student_master_id = ? AND id != ? AND status NOT IN ('Offer Accepted', 'Rejected', 'Offer Declined')
      `).all(req.user.id, offer.application_id);

      for (const other of otherApps) {
        db.prepare(`UPDATE application SET status = 'Offer Declined', rejection_reason = 'Candidate accepted an offer at another company under One-Offer policy.' WHERE id = ?`).run(other.id);
        db.prepare(`UPDATE offer SET status = 'Declined' WHERE application_id = ?`).run(other.id);
      }

      // Notify Placement Cell & Student
      const student = db.prepare('SELECT name, email FROM student_master WHERE id = ?').get(req.user.id);
      sendNotification(
        { type: 'single', recipientId: student.email },
        {
          eventType: 'offer_accepted',
          eventKey: `offer_acc_${offer.id}`,
          title: `Congratulations on accepting offer from ${offer.company_name}!`,
          message: `You have successfully accepted the offer of ${offer.ctc} for the ${offer.role} role at ${offer.company_name}. Joining Date: ${offer.joining_date}.`,
          channel: 'both',
          senderId: 'Placement Cell <placements@campuslink.edu>'
        }
      );
    }

    return res.json({
      message: `Offer successfully marked as ${targetStatus}!`,
      offerStatus: targetStatus
    });
  } catch (err) {
    console.error('Respond offer error:', err);
    return res.status(500).json({ error: 'Failed to update offer status' });
  }
});

module.exports = router;
