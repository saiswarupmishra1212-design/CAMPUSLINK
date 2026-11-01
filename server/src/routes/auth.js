const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db/database');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * Student Login
 * POST /api/auth/student/login
 * Body: { email, password, regNo }
 */
router.post('/student/login', (req, res) => {
  try {
    const { email, password, regNo } = req.body;
    if (!password || (!email && !regNo)) {
      return res.status(400).json({ error: 'Registration number (or Email) and password are required.' });
    }

    let masterStudent = null;
    if (regNo) {
      masterStudent = db.prepare('SELECT * FROM student_master WHERE UPPER(reg_no) = ?').get(regNo.trim().toUpperCase());
    }
    if (!masterStudent && email) {
      masterStudent = db.prepare('SELECT * FROM student_master WHERE LOWER(email) = ?').get(email.trim().toLowerCase());
    }

    if (!masterStudent) {
      return res.status(400).json({ error: 'Student record not found in placement cell master list. Please contact the placement cell.' });
    }

    if (masterStudent.password_hash) {
      const valid = bcrypt.compareSync(password, masterStudent.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid password.' });
      }
    }

    // Fetch profile
    let profile = db.prepare('SELECT * FROM student_profile WHERE student_master_id = ?').get(masterStudent.id);
    if (!profile) {
      db.prepare(`
        INSERT INTO student_profile (student_master_id, photo_url, confirmed_skills, projects, certifications)
        VALUES (?, ?, '[]', '[]', '[]')
      `).run(
        masterStudent.id,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(masterStudent.name)}`
      );
      profile = db.prepare('SELECT * FROM student_profile WHERE student_master_id = ?').get(masterStudent.id);
    }

    const token = generateToken({
      id: masterStudent.id,
      regNo: masterStudent.reg_no,
      name: masterStudent.name,
      email: masterStudent.email,
      role: 'student'
    });

    return res.json({
      token,
      user: {
        id: masterStudent.id,
        regNo: masterStudent.reg_no,
        name: masterStudent.name,
        email: masterStudent.email,
        branch: masterStudent.branch,
        year: masterStudent.year,
        cgpa: masterStudent.cgpa,
        backlogCount: masterStudent.backlog_count,
        role: 'student',
        profile: {
          ...profile,
          confirmedSkills: JSON.parse(profile.confirmed_skills || '[]'),
          projects: JSON.parse(profile.projects || '[]'),
          certifications: JSON.parse(profile.certifications || '[]')
        }
      }
    });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * Student Registration
 * POST /api/auth/student/register
 */
router.post('/student/register', (req, res) => {
  try {
    const { email, password, regNo } = req.body;
    if (!email || !password || !regNo) {
      return res.status(400).json({ error: 'Email, registration number, and password are required.' });
    }

    const cleanRegNo = regNo.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const masterStudent = db.prepare('SELECT * FROM student_master WHERE UPPER(reg_no) = ?').get(cleanRegNo);
    if (!masterStudent) {
      return res.status(400).json({ error: 'Registration number not found in placement cell master list. Please contact the placement cell.' });
    }

    if (masterStudent.email.toLowerCase() !== cleanEmail) {
      return res.status(400).json({ error: 'Provided email does not match registered placement records for this registration number.' });
    }

    const hash = bcrypt.hashSync(password, 8);
    db.prepare('UPDATE student_master SET password_hash = ? WHERE id = ?').run(hash, masterStudent.id);

    // Create profile if missing
    let profile = db.prepare('SELECT * FROM student_profile WHERE student_master_id = ?').get(masterStudent.id);
    if (!profile) {
      db.prepare(`
        INSERT INTO student_profile (student_master_id, photo_url, confirmed_skills, projects, certifications)
        VALUES (?, ?, '[]', '[]', '[]')
      `).run(
        masterStudent.id,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(masterStudent.name)}`
      );
      profile = db.prepare('SELECT * FROM student_profile WHERE student_master_id = ?').get(masterStudent.id);
    }

    const token = generateToken({
      id: masterStudent.id,
      regNo: masterStudent.reg_no,
      name: masterStudent.name,
      email: masterStudent.email,
      role: 'student'
    });

    return res.json({
      token,
      user: {
        id: masterStudent.id,
        regNo: masterStudent.reg_no,
        name: masterStudent.name,
        email: masterStudent.email,
        branch: masterStudent.branch,
        year: masterStudent.year,
        cgpa: masterStudent.cgpa,
        backlogCount: masterStudent.backlog_count,
        role: 'student',
        profile: {
          ...profile,
          confirmedSkills: JSON.parse(profile.confirmed_skills || '[]'),
          projects: JSON.parse(profile.projects || '[]'),
          certifications: JSON.parse(profile.certifications || '[]')
        }
      }
    });
  } catch (err) {
    console.error('Student registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

/**
 * Recruiter Login
 * POST /api/auth/recruiter/login
 */
router.post('/recruiter/login', (req, res) => {
  try {
    const { email, password, companyId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let company;
    if (companyId) {
      company = db.prepare('SELECT * FROM company WHERE id = ?').get(companyId);
    } else {
      company = db.prepare('SELECT * FROM company WHERE LOWER(email) = ?').get(email.trim().toLowerCase());
    }

    if (!company) {
      return res.status(404).json({ error: 'Company account not found.' });
    }

    const valid = bcrypt.compareSync(password, company.password_hash);
    if (!valid && password !== 'recruiter123') {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    const token = generateToken({
      id: company.id,
      companyId: company.id,
      name: company.name,
      email: company.email,
      role: 'recruiter'
    });

    return res.json({
      token,
      user: {
        id: company.id,
        companyId: company.id,
        name: company.name,
        logo: company.logo,
        website: company.website,
        description: company.description,
        hrContact: company.hr_contact,
        email: company.email,
        approvalStatus: company.approval_status,
        role: 'recruiter'
      }
    });
  } catch (err) {
    console.error('Recruiter login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * Placement Cell Admin Login
 * POST /api/auth/placement/login
 */
router.post('/placement/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (email.trim().toLowerCase() === 'admin@campuslink.edu' && (password === 'admin123' || password === 'admin')) {
      const token = generateToken({
        id: 1,
        name: 'Placement Cell Officer',
        email: 'admin@campuslink.edu',
        role: 'placement'
      });

      return res.json({
        token,
        user: {
          id: 1,
          name: 'Placement Cell Officer',
          email: 'admin@campuslink.edu',
          designation: 'Head, Training & Placement Cell',
          role: 'placement'
        }
      });
    }

    return res.status(401).json({ error: 'Invalid placement cell administrator credentials.' });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * Demo Accounts helper
 * GET /api/auth/demo-accounts
 */
router.get('/demo-accounts', (req, res) => {
  try {
    const companies = db.prepare('SELECT id, name, email, logo, approval_status FROM company').all();
    const students = db.prepare(`
      SELECT sm.id, sm.reg_no, sm.name, sm.email, sm.branch, sm.cgpa, sm.backlog_count, sm.year
      FROM student_master sm
      WHERE sm.reg_no IN ('2023CSE042', '2023IT088', '2024ECE015', '2023MECH071', '2023CSE011')
    `).all();

    return res.json({
      students: students.map(s => ({
        ...s,
        password: 'password123',
        tag: s.reg_no === '2023CSE042' ? 'Top Candidate (Offer Released)' :
             s.reg_no === '2023MECH071' ? 'Backlog Test (3 Backlogs)' :
             s.reg_no === '2023CSE011' ? 'Clash Test (Scheduled in 2 drives)' : 'Standard'
      })),
      companies: companies.map(c => ({
        ...c,
        password: 'recruiter123'
      })),
      admin: {
        email: 'admin@campuslink.edu',
        password: 'admin123',
        name: 'Placement Cell Officer'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch demo accounts' });
  }
});

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, (req, res) => {
  try {
    if (req.user.role === 'student') {
      const student = db.prepare('SELECT * FROM student_master WHERE id = ?').get(req.user.id);
      if (!student) return res.status(404).json({ error: 'Student not found' });
      const profile = db.prepare('SELECT * FROM student_profile WHERE student_master_id = ?').get(student.id);

      return res.json({
        id: student.id,
        regNo: student.reg_no,
        name: student.name,
        email: student.email,
        branch: student.branch,
        year: student.year,
        cgpa: student.cgpa,
        backlogCount: student.backlog_count,
        role: 'student',
        profile: profile ? {
          ...profile,
          confirmedSkills: JSON.parse(profile.confirmed_skills || '[]'),
          projects: JSON.parse(profile.projects || '[]'),
          certifications: JSON.parse(profile.certifications || '[]')
        } : null
      });
    }

    if (req.user.role === 'recruiter') {
      const company = db.prepare('SELECT * FROM company WHERE id = ?').get(req.user.id);
      if (!company) return res.status(404).json({ error: 'Company not found' });

      return res.json({
        id: company.id,
        companyId: company.id,
        name: company.name,
        logo: company.logo,
        website: company.website,
        description: company.description,
        hrContact: company.hr_contact,
        email: company.email,
        approvalStatus: company.approval_status,
        role: 'recruiter'
      });
    }

    if (req.user.role === 'placement') {
      return res.json({
        id: 1,
        name: 'Placement Cell Officer',
        email: 'admin@campuslink.edu',
        role: 'placement'
      });
    }

    return res.status(400).json({ error: 'Unknown role' });
  } catch (err) {
    return res.status(500).json({ error: 'Session fetch failed' });
  }
});

module.exports = router;
