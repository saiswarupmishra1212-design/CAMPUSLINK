const bcrypt = require('bcryptjs');
const { db, initSchema } = require('./database');
const { MASTER_SKILLS } = require('../ai/skillsDictionary');
const { calculateSkillMatch } = require('../ai/matcher');
const { sendNotification } = require('../services/notificationService');

async function seed() {
  console.log('🌱 Starting CAMPUSLINK seed process...');

  // Reset all tables
  db.exec(`
    DROP TABLE IF EXISTS audit_log;
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS notification;
    DROP TABLE IF EXISTS offer;
    DROP TABLE IF EXISTS round_result;
    DROP TABLE IF EXISTS application;
    DROP TABLE IF EXISTS vacancy;
    DROP TABLE IF EXISTS company;
    DROP TABLE IF EXISTS student_profile;
    DROP TABLE IF EXISTS student_master;
  `);

  initSchema();

  const defaultPasswordHash = bcrypt.hashSync('password123', 8);
  const adminPasswordHash = bcrypt.hashSync('admin123', 8);
  const recruiterPasswordHash = bcrypt.hashSync('recruiter123', 8);

  // 1. Seed Settings
  const insertSettings = db.prepare(`
    INSERT INTO settings (id, min_match_percent, master_skills, offer_rule)
    VALUES (1, 60.0, ?, 'OneAcceptedOffer')
  `);
  insertSettings.run(JSON.stringify(MASTER_SKILLS));

  // 2. Seed Placement Cell Admin Notification
  sendNotification(
    { type: 'single', recipientId: 'admin@campuslink.edu' },
    {
      eventType: 'broadcast',
      eventKey: 'sys_init_001',
      title: 'Placement Season 2026-27 Active',
      message: 'Welcome to CAMPUSLINK. 5 corporate recruiters have registered campus drives.',
      channel: 'both',
      senderId: 'Placement Cell <placements@campuslink.edu>'
    }
  );

  // 3. Seed 5 Companies
  const companiesData = [
    {
      name: 'Apex Innovations',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      website: 'https://apexinnovations.tech',
      description: 'Global enterprise software leader building cloud-native SaaS and fintech platforms.',
      hrContact: 'Siddharth Mehta (Head of University Talent)',
      email: 'careers@apexinnovations.com',
      approvalStatus: 'Approved'
    },
    {
      name: 'CloudScale Systems',
      logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80',
      website: 'https://cloudscale.io',
      description: 'Pioneers in high-performance cloud infrastructure, DevOps pipelines, and distributed Kubernetes clusters.',
      hrContact: 'Elena Rostova (Campus Relations Lead)',
      email: 'hiring@cloudscale.io',
      approvalStatus: 'Approved'
    },
    {
      name: 'Nexus AI Labs',
      logo: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=150&auto=format&fit=crop&q=80',
      website: 'https://nexusailabs.com',
      description: 'Cutting-edge AI research and product studio developing LLMs, computer vision, and predictive analytics engines.',
      hrContact: 'Dr. Arvind Swaminathan (Director of AI Talent)',
      email: 'talent@nexusailabs.com',
      approvalStatus: 'Approved'
    },
    {
      name: 'ByteCraft Digital',
      logo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150&auto=format&fit=crop&q=80',
      website: 'https://bytecraft.dev',
      description: 'Full-stack engineering & creative digital product consultancy partnering with Fortune 500 brands.',
      hrContact: 'Meera Nambiar (Technical Recruiter)',
      email: 'hr@bytecraft.dev',
      approvalStatus: 'Approved'
    },
    {
      name: 'DataVortex Corp',
      logo: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=150&auto=format&fit=crop&q=80',
      website: 'https://datavortex.com',
      description: 'Enterprise big data analytics and stream processing infrastructure company handling petabytes of daily data.',
      hrContact: 'Rohan Deshpande (Senior Talent Acquisition Partner)',
      email: 'campus@datavortex.com',
      approvalStatus: 'Approved'
    }
  ];

  const insertCompany = db.prepare(`
    INSERT INTO company (name, logo, website, description, hr_contact, email, password_hash, approval_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const companyMap = {};
  for (const c of companiesData) {
    const res = insertCompany.run(
      c.name, c.logo, c.website, c.description, c.hrContact, c.email, recruiterPasswordHash, c.approvalStatus
    );
    companyMap[c.name] = Number(res.lastInsertRowid);
  }

  // 4. Seed Vacancies with Multi-Rounds & Distinct Virtual Dates
  const vacanciesData = [
    {
      companyId: companyMap['Apex Innovations'],
      role: 'Full Stack Software Developer',
      description: 'Join our core platform engineering team building scalable microservices and responsive React web applications.',
      requiredSkills: ['React', 'Node.js', 'TypeScript', 'SQL', 'Git', 'REST API'],
      allowedBranches: ['CSE', 'IT', 'ECE'],
      minCgpa: 7.0,
      backlogRule: 'NotAllowed',
      maxBacklogs: 0,
      ctc: '14.5 LPA',
      openings: 12,
      openDate: '2026-09-20',
      closeDate: '2026-10-10',
      rounds: [
        { roundIndex: 0, name: 'Round 1: Online Coding Assessment', date: '2026-10-15', time: '10:00 AM', mode: 'Online', venue: 'Hackerearth Platform' },
        { roundIndex: 1, name: 'Round 2: Technical System Design', date: '2026-10-18', time: '02:00 PM', mode: 'Offline', venue: 'Campus Placement Lab 1' },
        { roundIndex: 2, name: 'Round 3: Leadership & HR Fit', date: '2026-10-21', time: '11:00 AM', mode: 'Offline', venue: 'Placement Boardroom A' }
      ],
      status: 'Open',
      virtualDate: '2026-10-16' // Day after Round 1 exam (2026-10-15) -> Decisions are OPEN!
    },
    {
      companyId: companyMap['Apex Innovations'],
      role: 'Python & Data Analyst',
      description: 'Analyze telemetry data, construct interactive Power BI reporting dashboards, and write Python automated ETL scripts.',
      requiredSkills: ['Python', 'SQL', 'Data Analysis', 'Power BI'],
      allowedBranches: ['CSE', 'IT', 'ECE', 'EEE', 'MECH'],
      minCgpa: 6.8,
      backlogRule: 'AllowedUpToN',
      maxBacklogs: 1,
      ctc: '10.0 LPA',
      openings: 8,
      openDate: '2026-09-22',
      closeDate: '2026-10-12',
      rounds: [
        { roundIndex: 0, name: 'Round 1: Python & SQL Test', date: '2026-10-16', time: '11:00 AM', mode: 'Online', venue: 'CodeSignal' },
        { roundIndex: 1, name: 'Round 2: Business Case Study & HR', date: '2026-10-19', time: '03:00 PM', mode: 'Offline', venue: 'Seminar Hall 1' }
      ],
      status: 'Open',
      virtualDate: '2026-10-14'
    },
    {
      companyId: companyMap['CloudScale Systems'],
      role: 'Cloud & DevOps Engineer',
      description: 'Build robust CI/CD deployment pipelines, manage Docker containers and Kubernetes clusters on AWS infrastructure.',
      requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Python'],
      allowedBranches: ['CSE', 'IT', 'ECE'],
      minCgpa: 7.5,
      backlogRule: 'NotAllowed',
      maxBacklogs: 0,
      ctc: '16.0 LPA',
      openings: 6,
      openDate: '2026-09-18',
      closeDate: '2026-10-08',
      rounds: [
        { roundIndex: 0, name: 'Round 1: Cloud & Linux Screening', date: '2026-10-15', time: '10:00 AM', mode: 'Offline', venue: 'Campus Placement Lab 1' },
        { roundIndex: 1, name: 'Round 2: Architecture Interview & HR', date: '2026-10-17', time: '02:30 PM', mode: 'Offline', venue: 'Placement Boardroom B' }
      ],
      status: 'Open',
      virtualDate: '2026-10-05' // Before close date (2026-10-08) -> Applications LOCKED!
    },
    {
      companyId: companyMap['Nexus AI Labs'],
      role: 'Machine Learning Research Engineer',
      description: 'Design state-of-the-art Deep Learning models, fine-tune neural networks with PyTorch, and evaluate NLP algorithms.',
      requiredSkills: ['Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'Data Structures & Algorithms'],
      allowedBranches: ['CSE', 'IT'],
      minCgpa: 8.0,
      backlogRule: 'NotAllowed',
      maxBacklogs: 0,
      ctc: '22.0 LPA',
      openings: 4,
      openDate: '2026-09-25',
      closeDate: '2026-10-15',
      rounds: [
        { roundIndex: 0, name: 'Round 1: ML Fundamentals & DSA', date: '2026-10-20', time: '09:30 AM', mode: 'Online', venue: 'Kaggle Benchmark Suite' },
        { roundIndex: 1, name: 'Round 2: Research Paper Defense & Partner Round', date: '2026-10-23', time: '03:00 PM', mode: 'Offline', venue: 'Main Auditorium' }
      ],
      status: 'Open',
      virtualDate: '2026-10-11'
    },
    {
      companyId: companyMap['ByteCraft Digital'],
      role: 'Frontend UI/UX Engineer',
      description: 'Craft pixel-perfect user interfaces, develop responsive web applications in React/TypeScript, and build design systems in Figma.',
      requiredSkills: ['React', 'JavaScript', 'HTML/CSS', 'TypeScript', 'UI/UX Design'],
      allowedBranches: ['CSE', 'IT', 'ECE', 'EEE', 'MECH'],
      minCgpa: 6.5,
      backlogRule: 'AllowedUpToN',
      maxBacklogs: 2,
      ctc: '11.5 LPA',
      openings: 10,
      openDate: '2026-09-15',
      closeDate: '2026-10-05',
      rounds: [
        { roundIndex: 0, name: 'Round 1: Frontend Machine Coding', date: '2026-10-14', time: '10:00 AM', mode: 'Online', venue: 'Codesandbox Live' },
        { roundIndex: 1, name: 'Round 2: UI Design Review & Portfolio', date: '2026-10-17', time: '11:30 AM', mode: 'Offline', venue: 'Design Studio Lab' },
        { roundIndex: 2, name: 'Round 3: Final Director Round', date: '2026-10-19', time: '04:00 PM', mode: 'Offline', venue: 'Executive Lounge' }
      ],
      status: 'Open',
      virtualDate: '2026-10-20'
    },
    {
      companyId: companyMap['DataVortex Corp'],
      role: 'Big Data Pipeline Engineer',
      description: 'Engineer high-throughput streaming systems using Spark, Python, SQL, and enterprise cloud data lakes.',
      requiredSkills: ['Data Engineering', 'Python', 'SQL', 'AWS', 'Docker'],
      allowedBranches: ['CSE', 'IT', 'ECE'],
      minCgpa: 7.2,
      backlogRule: 'NotAllowed',
      maxBacklogs: 0,
      ctc: '18.5 LPA',
      openings: 5,
      openDate: '2026-09-20',
      closeDate: '2026-10-11',
      rounds: [
        { roundIndex: 0, name: 'Round 1: Data Analytics & SQL Challenge', date: '2026-10-16', time: '10:00 AM', mode: 'Online', venue: 'HackerRank' },
        { roundIndex: 1, name: 'Round 2: Distributed Systems Deep Dive', date: '2026-10-18', time: '02:00 PM', mode: 'Offline', venue: 'Seminar Hall 2' },
        { roundIndex: 2, name: 'Round 3: Live Debugging Test', date: '2026-10-21', time: '10:30 AM', mode: 'Offline', venue: 'Placement Lab 2' },
        { roundIndex: 3, name: 'Round 4: VP Engineering Interview', date: '2026-10-24', time: '03:30 PM', mode: 'Offline', venue: 'Placement Boardroom A' }
      ],
      status: 'Open',
      virtualDate: '2026-10-12'
    }
  ];

  const insertVacancy = db.prepare(`
    INSERT INTO vacancy (
      company_id, role, description, required_skills, allowed_branches,
      min_cgpa, backlog_rule, max_backlogs, ctc, openings, open_date, close_date, rounds, status, virtual_date, demo_now
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const vacancyMap = {};
  for (const v of vacanciesData) {
    const res = insertVacancy.run(
      v.companyId, v.role, v.description, JSON.stringify(v.requiredSkills),
      JSON.stringify(v.allowedBranches), v.minCgpa, v.backlogRule, v.maxBacklogs,
      v.ctc, v.openings, v.openDate, v.closeDate, JSON.stringify(v.rounds), v.status, v.virtualDate, v.virtualDate
    );
    vacancyMap[v.role] = Number(res.lastInsertRowid);
  }

  // 5. Seed 6 Specific Story Students + 94 realistic students (100 total)
  const branches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH'];
  const firstNames = [
    'Priya', 'Rahul', 'Ananya', 'Vikram', 'Aarav', 'Mohit', 'Tanvi', 'Aditya', 'Pooja',
    'Arjun', 'Divya', 'Karan', 'Ishita', 'Manish', 'Neha', 'Varun', 'Kavya', 'Siddharth', 'Meera',
    'Nikhil', 'Rhea', 'Abhinav', 'Shreya', 'Gaurav', 'Tara', 'Deepak', 'Anushka', 'Harsh', 'Simran',
    'Akash', 'Shruti', 'Yash', 'Bhavna', 'Pranav', 'Nandini', 'Rajesh', 'Sanjana', 'Amit', 'Payal',
    'Swati', 'Alok', 'Preeti', 'Suresh', 'Komal', 'Vishal', 'Geeta', 'Sachin', 'Jyoti'
  ];

  const lastNames = [
    'Sharma', 'Verma', 'Deshmukh', 'Singh', 'Patel', 'Gupta', 'Reddy', 'Iyer', 'Chopra', 'Nair',
    'Bose', 'Menon', 'Joshi', 'Kulkarni', 'Malhotra', 'Rao', 'Bhat', 'Shetty', 'Pillai', 'Saxena'
  ];

  const studentSkillSets = [
    ['React', 'Node.js', 'TypeScript', 'SQL', 'Git', 'REST API', 'HTML/CSS'],
    ['Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'Data Analysis', 'SQL', 'Git'],
    ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Python', 'SQL'],
    ['React', 'JavaScript', 'HTML/CSS', 'UI/UX Design', 'Git'],
    ['Data Engineering', 'Python', 'SQL', 'AWS', 'Docker', 'Git'],
    ['Java', 'SQL', 'Data Structures & Algorithms', 'REST API', 'Git'],
    ['Python', 'SQL', 'Data Analysis', 'Power BI', 'Tableau'],
    ['Testing / QA', 'Python', 'SQL', 'Git', 'CI/CD'],
    ['Cyber Security', 'Python', 'AWS', 'Docker', 'Git'],
    ['HTML/CSS', 'JavaScript']
  ];

  const insertStudentMaster = db.prepare(`
    INSERT INTO student_master (
      reg_no, name, branch, year, passout_batch, cgpa, backlog_count, email, password_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertStudentProfile = db.prepare(`
    INSERT INTO student_profile (
      student_master_id, photo_url, linkedin, github, phone, cv_file_name, cv_text, confirmed_skills, projects, certifications
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const studentMasterIds = [];

  // Seed the 6 Defined Story Students
  const storyStudents = [
    {
      // STORY 1: Full Success (Offer Released & Accepted)
      regNo: '2023CSE042',
      name: 'Priya Sharma',
      branch: 'CSE',
      year: 4,
      passoutBatch: 2026,
      cgpa: 8.92,
      backlogCount: 0,
      email: 'priya.sharma@college.edu',
      skills: ['React', 'Node.js', 'TypeScript', 'SQL', 'Git', 'REST API', 'HTML/CSS', 'Docker'],
      projects: ['Campus Placement Portal', 'AI Resume Parser Microservice'],
      certifications: ['AWS Certified Cloud Practitioner', 'Meta Frontend Developer']
    },
    {
      // STORY 2: Rejected at Round 1 (Archived on Recruiter side, Better luck message)
      regNo: '2024ECE015',
      name: 'Ananya Deshmukh',
      branch: 'ECE',
      year: 4,
      passoutBatch: 2026,
      cgpa: 7.80,
      backlogCount: 0,
      email: 'ananya.deshmukh@college.edu',
      skills: ['React', 'Node.js', 'JavaScript', 'HTML/CSS', 'SQL', 'Git'],
      projects: ['Smart IoT Health Monitor', 'Mobile UI Design Kit'],
      certifications: ['Google UX Design Professional']
    },
    {
      // STORY 3: Rejected at Round 2 (Archived on Recruiter side, Better luck message)
      regNo: '2023CSE019',
      name: 'Tanvi Gupta',
      branch: 'CSE',
      year: 4,
      passoutBatch: 2026,
      cgpa: 8.10,
      backlogCount: 0,
      email: 'tanvi.gupta@college.edu',
      skills: ['React', 'Node.js', 'TypeScript', 'SQL', 'Git', 'REST API'],
      projects: ['E-Commerce Microservices Engine'],
      certifications: ['Oracle Certified Associate - SQL']
    },
    {
      // STORY 4: Clash Demo Student (Scheduled in 2 drives at same date/time)
      regNo: '2023CSE011',
      name: 'Aarav Patel',
      branch: 'CSE',
      year: 4,
      passoutBatch: 2026,
      cgpa: 8.65,
      backlogCount: 0,
      email: 'aarav.patel@college.edu',
      skills: ['React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Python'],
      projects: ['Kubernetes Multi-Cloud Orchestrator', 'Real-time WebSocket Chat'],
      certifications: ['Certified Kubernetes Application Developer (CKAD)']
    },
    {
      // STORY 5: Backlog-Blocked Student (3 backlogs, blocked by backlog rule)
      regNo: '2023MECH071',
      name: 'Vikram Singh',
      branch: 'MECH',
      year: 4,
      passoutBatch: 2026,
      cgpa: 6.40,
      backlogCount: 3,
      email: 'vikram.singh@college.edu',
      skills: ['Python', 'Data Analysis', 'HTML/CSS'],
      projects: ['Automated Inventory Tracker'],
      certifications: []
    },
    {
      // STORY 6: Offer Declined Student
      regNo: '2023IT044',
      name: 'Mohit Sharma',
      branch: 'IT',
      year: 4,
      passoutBatch: 2026,
      cgpa: 8.35,
      backlogCount: 0,
      email: 'mohit.sharma@college.edu',
      skills: ['React', 'JavaScript', 'HTML/CSS', 'TypeScript', 'UI/UX Design', 'Git'],
      projects: ['Interactive Design System', 'Analytics Dashboard UI'],
      certifications: ['Meta Advanced React']
    }
  ];

  for (const s of storyStudents) {
    const masterRes = insertStudentMaster.run(
      s.regNo, s.name, s.branch, s.year, s.passoutBatch, s.cgpa, s.backlogCount, s.email, defaultPasswordHash
    );
    const masterId = Number(masterRes.lastInsertRowid);
    studentMasterIds.push({ id: masterId, ...s });

    insertStudentProfile.run(
      masterId,
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`,
      `https://linkedin.com/in/${s.name.toLowerCase().replace(/\s+/g, '')}`,
      `https://github.com/${s.name.toLowerCase().replace(/\s+/g, '')}`,
      '+91 98765 43210',
      `${s.name.replace(/\s+/g, '_')}_Resume.pdf`,
      `Resume for ${s.name}. Proficient in ${s.skills.join(', ')}. Passionate about building robust software solutions.`,
      JSON.stringify(s.skills),
      JSON.stringify(s.projects),
      JSON.stringify(s.certifications)
    );
  }

  // Generate 94 additional realistic students to reach 100 total
  for (let i = 6; i < 100; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[(i * 3) % lastNames.length];
    const name = `${fName} ${lName}`;
    const branch = branches[i % branches.length];
    const year = (i % 3 === 0) ? 3 : 4;
    const passoutBatch = year === 4 ? 2026 : 2027;
    const regNo = `202${year === 4 ? '3' : '4'}${branch}${String(i + 10).padStart(3, '0')}`;
    const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@college.edu`;
    const cgpa = Math.round((6.3 + (Math.random() * 3.5)) * 100) / 100;
    const backlogCount = (i % 8 === 0) ? 2 : (i % 5 === 0) ? 1 : 0;
    const skills = studentSkillSets[i % studentSkillSets.length];

    const masterRes = insertStudentMaster.run(
      regNo, name, branch, year, passoutBatch, cgpa, backlogCount, email, defaultPasswordHash
    );
    const masterId = Number(masterRes.lastInsertRowid);
    studentMasterIds.push({ id: masterId, regNo, name, branch, year, cgpa, backlogCount, email, skills });

    insertStudentProfile.run(
      masterId,
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      `https://linkedin.com/in/${fName.toLowerCase()}${lName.toLowerCase()}`,
      `https://github.com/${fName.toLowerCase()}${lName.toLowerCase()}`,
      `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`,
      `${name.replace(/\s+/g, '_')}_Resume.pdf`,
      `Professional profile for ${name}. Technical skills: ${skills.join(', ')}. CGPA: ${cgpa}.`,
      JSON.stringify(skills),
      JSON.stringify([`${skills[0] || 'Software'} Capstone Project`]),
      JSON.stringify([`Certified in ${skills[1] || 'Web Technologies'}`])
    );
  }

  // 6. Seed Story Applications & Pipeline
  const insertApp = db.prepare(`
    INSERT INTO application (
      student_master_id, vacancy_id, match_percent, matched_skills, missing_skills, readiness_level, status, rejection_reason, recruiter_remark, is_archived
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRoundResult = db.prepare(`
    INSERT INTO round_result (application_id, round_index, result, feedback, private_remark, notified)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertOffer = db.prepare(`
    INSERT INTO offer (application_id, ctc, joining_date, status, documents)
    VALUES (?, ?, ?, ?, ?)
  `);

  const apexDevId = vacancyMap['Full Stack Software Developer'];
  const cloudDevOpsId = vacancyMap['Cloud & DevOps Engineer'];
  const apexDataId = vacancyMap['Python & Data Analyst'];
  const byteCraftUiId = vacancyMap['Frontend UI/UX Engineer'];

  // STORY 1: Priya Sharma - Full Success -> Offer Released & Accepted
  const priyaMatch = calculateSkillMatch(storyStudents[0].skills, vacanciesData[0].requiredSkills);
  const priyaAppRes = insertApp.run(
    studentMasterIds[0].id,
    apexDevId,
    priyaMatch.matchPercent,
    JSON.stringify(priyaMatch.matchedSkills),
    JSON.stringify(priyaMatch.missingSkills),
    priyaMatch.readinessLevel,
    'Offer Accepted',
    null,
    'Top candidate across all technical and leadership rounds.',
    0
  );
  const priyaAppId = Number(priyaAppRes.lastInsertRowid);
  insertRoundResult.run(priyaAppId, 0, 'Pass', '', 'Cleared coding test with 98% percentile', 1);
  insertRoundResult.run(priyaAppId, 1, 'Pass', '', 'Strong system design architecture fundamentals', 1);
  insertRoundResult.run(priyaAppId, 2, 'Pass', '', 'Excellent culture fit and communication', 1);
  insertOffer.run(priyaAppId, '14.5 LPA', '2026-07-15', 'Accepted', JSON.stringify(['Offer_Letter_Priya_Sharma.pdf']));

  // STORY 2: Ananya Deshmukh - Rejected at Round 1 -> Archived on recruiter side
  const ananyaMatch = calculateSkillMatch(storyStudents[1].skills, vacanciesData[0].requiredSkills);
  const ananyaAppRes = insertApp.run(
    studentMasterIds[1].id,
    apexDevId,
    ananyaMatch.matchPercent,
    JSON.stringify(ananyaMatch.matchedSkills),
    JSON.stringify(ananyaMatch.missingSkills),
    ananyaMatch.readinessLevel,
    'Rejected',
    'Did not advance past Round 1 online coding benchmark.',
    'Candidate struggled with SQL join complexities.',
    1 // ARCHIVED
  );
  const ananyaAppId = Number(ananyaAppRes.lastInsertRowid);
  insertRoundResult.run(ananyaAppId, 0, 'Fail', '', 'Did not meet benchmark for coding round', 1);

  // STORY 3: Tanvi Gupta - Rejected at Round 2 -> Archived on recruiter side
  const tanviMatch = calculateSkillMatch(storyStudents[2].skills, vacanciesData[0].requiredSkills);
  const tanviAppRes = insertApp.run(
    studentMasterIds[2].id,
    apexDevId,
    tanviMatch.matchPercent,
    JSON.stringify(tanviMatch.matchedSkills),
    JSON.stringify(tanviMatch.missingSkills),
    tanviMatch.readinessLevel,
    'Rejected',
    'Did not advance past Round 2 technical system design interview.',
    'System design lacked caching and database partition strategy.',
    1 // ARCHIVED
  );
  const tanviAppId = Number(tanviAppRes.lastInsertRowid);
  insertRoundResult.run(tanviAppId, 0, 'Pass', '', 'Strong score in Round 1 coding', 1);
  insertRoundResult.run(tanviAppId, 1, 'Fail', '', 'Needs improvement in scalable backend architecture', 1);

  // STORY 4: Aarav Patel - Clash Demo Student (Scheduled in 2 drives at overlapping times)
  const aaravMatch1 = calculateSkillMatch(storyStudents[3].skills, vacanciesData[0].requiredSkills);
  const aaravApp1 = insertApp.run(
    studentMasterIds[3].id,
    apexDevId,
    aaravMatch1.matchPercent,
    JSON.stringify(aaravMatch1.matchedSkills),
    JSON.stringify(aaravMatch1.missingSkills),
    aaravMatch1.readinessLevel,
    'Round 1',
    null,
    'Scheduled for Round 1 assessment on 2026-10-15 10:00 AM',
    0
  );
  insertRoundResult.run(Number(aaravApp1.lastInsertRowid), 0, 'Pending', '', 'Pending exam attendance', 1);

  const aaravMatch2 = calculateSkillMatch(storyStudents[3].skills, vacanciesData[2].requiredSkills);
  const aaravApp2 = insertApp.run(
    studentMasterIds[3].id,
    cloudDevOpsId,
    aaravMatch2.matchPercent,
    JSON.stringify(aaravMatch2.matchedSkills),
    JSON.stringify(aaravMatch2.missingSkills),
    aaravMatch2.readinessLevel,
    'Round 1',
    null,
    'Scheduled for Round 1 assessment on 2026-10-15 10:00 AM',
    0
  );
  insertRoundResult.run(Number(aaravApp2.lastInsertRowid), 0, 'Pending', '', 'Pending exam attendance', 1);

  // STORY 6: Mohit Sharma - Offer Declined Student
  const mohitMatch = calculateSkillMatch(storyStudents[5].skills, vacanciesData[4].requiredSkills);
  const mohitAppRes = insertApp.run(
    studentMasterIds[5].id,
    byteCraftUiId,
    mohitMatch.matchPercent,
    JSON.stringify(mohitMatch.matchedSkills),
    JSON.stringify(mohitMatch.missingSkills),
    mohitMatch.readinessLevel,
    'Offer Declined',
    null,
    'Candidate declined offer to pursue higher studies.',
    0
  );
  const mohitAppId = Number(mohitAppRes.lastInsertRowid);
  insertRoundResult.run(mohitAppId, 0, 'Pass', '', 'Cleared UI machine coding', 1);
  insertRoundResult.run(mohitAppId, 1, 'Pass', '', 'Excellent design system review', 1);
  insertRoundResult.run(mohitAppId, 2, 'Pass', '', 'Director round cleared', 1);
  insertOffer.run(mohitAppId, '11.5 LPA', '2026-07-01', 'Declined', JSON.stringify(['Offer_Letter_Mohit.pdf']));

  // Seed active applicants for Apex Dev so decisions can be evaluated interactively
  for (let i = 6; i < 25; i++) {
    const s = studentMasterIds[i];
    const match = calculateSkillMatch(s.skills, vacanciesData[0].requiredSkills);
    if (match.matchPercent >= 60) {
      const appRes = insertApp.run(
        s.id,
        apexDevId,
        match.matchPercent,
        JSON.stringify(match.matchedSkills),
        JSON.stringify(match.missingSkills),
        match.readinessLevel,
        'Round 1',
        null,
        null,
        0
      );
      insertRoundResult.run(Number(appRes.lastInsertRowid), 0, 'Pending', '', '', 1);
    }
  }

  // 7. Seed Sample Audit Log
  const insertAudit = db.prepare(`
    INSERT INTO audit_log (student_master_id, action, previous_value, new_value, changed_by, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run(
    studentMasterIds[4].id,
    'BACKLOG_UPDATED',
    '4 backlogs',
    '3 backlogs',
    'Placement Cell Officer (Prof. R. Sen)',
    'Cleared 1 backlog in re-evaluation.'
  );

  console.log('✅ CAMPUSLINK Database successfully seeded!');
  console.log(`- Students seeded: ${studentMasterIds.length}`);
  console.log(`- Companies seeded: ${companiesData.length}`);
  console.log(`- Vacancies seeded: ${vacanciesData.length}`);
  console.log('- Story 1: Priya Sharma (2023CSE042) -> Offer Accepted (14.5 LPA)');
  console.log('- Story 2: Ananya Deshmukh (2024ECE015) -> Rejected at Round 1 (Archived on Recruiter side)');
  console.log('- Story 3: Tanvi Gupta (2023CSE019) -> Rejected at Round 2 (Archived on Recruiter side)');
  console.log('- Story 4: Aarav Patel (2023CSE011) -> Clash Demo (2 drives on 2026-10-15 10:00 AM)');
  console.log('- Story 5: Vikram Singh (2023MECH071) -> Backlog Blocked (3 backlogs)');
  console.log('- Story 6: Mohit Sharma (2023IT044) -> Offer Declined (ByteCraft 11.5 LPA)');
  console.log('- Apex Dev Virtual Date: 2026-10-16 (Decisions OPEN)');
  console.log('- CloudScale DevOps Virtual Date: 2026-10-05 (Applications LOCKED)');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}

module.exports = { seed };

/*
MANUAL DEMO SCRIPT (6 steps)
1. Login as Apex recruiter → open "Full Stack Software Developer" → Rounds & Results → decisions UNLOCKED (demo_now 2026-10-16, day after exam).
2. Select Priya (Select) + Ananya (Reject) → confirm popup → submit → check Notifications bell.
3. Login as Priya → notification "You are selected for Round 2…"; status stepper shows Round 1 ✓.
4. Login as Ananya → notification "Better luck next time"; stepper shows "Not selected at Round 1"; recruiter gets 403 on her profile.
5. Login as CloudScale recruiter → open "Cloud & DevOps Engineer" → applications LOCKED banner (demo_now 2026-10-05, before close date).
6. Login as Placement Admin → Analytics → Round-Wise Funnel counts Ananya & Tanvi in archived pipeline; Priya shows Selected.
*/
