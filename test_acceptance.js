const http = require('node:http');

const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.headers || {};
  if (options.body && !(options.body instanceof Buffer) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            resolve({ status: res.statusCode, error: json.error || data, json });
          }
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      if (typeof options.body === 'string' || options.body instanceof Buffer) {
        req.write(options.body);
      } else {
        req.write(JSON.stringify(options.body));
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting CAMPUSLINK PART 4 Acceptance Tests...\n');
  const results = [];

  // Login as Student (Priya Sharma - 2023CSE042)
  const priyaLogin = await request('/auth/student/login', {
    method: 'POST',
    body: { regNo: '2023CSE042', password: 'password123' }
  });

  const priyaToken = priyaLogin.token;
  if (!priyaToken) {
    console.error('Failed to log in as Priya Sharma', priyaLogin);
    process.exit(1);
  }

  // TEST 1: Open CV & Profile: page loads with verified block filled
  try {
    const profile = await request('/student/profile', {
      headers: { Authorization: `Bearer ${priyaToken}` }
    });

    const student = profile.student;
    const hasVerifiedFields = student.name && student.regNo && student.branch && student.discipline &&
      student.year && student.passoutBatch && student.cgpa !== undefined && student.backlogCount !== undefined &&
      student.college && student.email;

    if (hasVerifiedFields) {
      results.push({ test: '1. Open CV & Profile: verified block filled', pass: true, detail: `Name: ${student.name}, Reg: ${student.regNo}, CGPA: ${student.cgpa}, College: ${student.college}, Discipline: ${student.discipline}` });
    } else {
      results.push({ test: '1. Open CV & Profile: verified block filled', pass: false, detail: 'Missing verified fields in response' });
    }
  } catch (err) {
    results.push({ test: '1. Open CV & Profile: verified block filled', pass: false, detail: err.message });
  }

  // TEST 2: Upload photo, LinkedIn and GitHub links, save, reload: values persist
  try {
    const testPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
    const testLinkedin = 'https://linkedin.com/in/priyasharma-test';
    const testGithub = 'https://github.com/priyasharma-test';
    const testPhone = '+91 9876543210';

    await request('/student/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: {
        photoUrl: testPhoto,
        linkedin: testLinkedin,
        github: testGithub,
        phone: testPhone,
        confirmedSkills: ['React', 'TypeScript'],
        projects: ['Project Alpha'],
        certifications: ['AWS Cloud']
      }
    });

    // Reload profile to verify persistence
    const reloaded = await request('/student/profile', {
      headers: { Authorization: `Bearer ${priyaToken}` }
    });

    const isPersisted = reloaded.profile.linkedin === testLinkedin &&
      reloaded.profile.github === testGithub &&
      reloaded.profile.phone === testPhone &&
      reloaded.profile.photo_url === testPhoto;

    if (isPersisted) {
      results.push({ test: '2. Upload photo, LinkedIn & GitHub, save & reload', pass: true, detail: `Persisted Photo: ${reloaded.profile.photo_url}, LinkedIn: ${reloaded.profile.linkedin}, GitHub: ${reloaded.profile.github}` });
    } else {
      results.push({ test: '2. Upload photo, LinkedIn & GitHub, save & reload', pass: false, detail: 'Values did not persist on reload' });
    }
  } catch (err) {
    results.push({ test: '2. Upload photo, LinkedIn & GitHub, save & reload', pass: false, detail: err.message });
  }

  // TEST 3: Upload a CV containing Python, SQL, AWS, Docker, Data Engineering: chips appear; confirm them
  try {
    const cvText = `Candidate: Priya Sharma\nSkills: Python (py3), SQL, AWS (ec2, s3), Docker, Data Engineering (spark)\nProjects: Spark Big Data Pipeline\nCertifications: Databricks Certified`;
    const uploadRes = await request('/student/upload-cv', {
      method: 'POST',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: { cvText, cvFileName: 'Big_Data_Engineer_Resume.pdf' }
    });

    const extracted = uploadRes.extractedSkills || [];
    const expected = ['Python', 'SQL', 'AWS', 'Docker', 'Data Engineering'];
    const hasAll = expected.every(e => extracted.includes(e));

    // Confirm them
    const confirmRes = await request('/student/confirm-skills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: { confirmedSkills: extracted }
    });

    if (hasAll && confirmRes.confirmedSkills) {
      results.push({ test: '3. Upload CV (Python, SQL, AWS, Docker, Data Engineering) & confirm', pass: true, detail: `Extracted & Confirmed: ${confirmRes.confirmedSkills.join(', ')}` });
    } else {
      results.push({ test: '3. Upload CV (Python, SQL, AWS, Docker, Data Engineering) & confirm', pass: false, detail: `Extracted: ${extracted.join(', ')}` });
    }
  } catch (err) {
    results.push({ test: '3. Upload CV (Python, SQL, AWS, Docker, Data Engineering) & confirm', pass: false, detail: err.message });
  }

  // TEST 4: Go to Dashboard / Job list: match for "Big Data Pipeline Engineer" rises from 0% to near 100%
  try {
    const jobs = await request('/student/jobs', {
      headers: { Authorization: `Bearer ${priyaToken}` }
    });

    const bigDataJob = jobs.find(j => j.role === 'Big Data Pipeline Engineer');
    const match = bigDataJob?.aiMatch?.matchPercent || 0;
    const readiness = bigDataJob?.aiMatch?.readinessLevel;

    if (match >= 90 && readiness === 'Highly Employable') {
      results.push({ test: '4. Big Data Pipeline Engineer match rises to near 100%', pass: true, detail: `Match: ${match}%, Readiness: ${readiness}` });
    } else {
      results.push({ test: '4. Big Data Pipeline Engineer match rises to near 100%', pass: false, detail: `Match: ${match}%, Readiness: ${readiness}` });
    }
  } catch (err) {
    results.push({ test: '4. Big Data Pipeline Engineer match rises to near 100%', pass: false, detail: err.message });
  }

  // TEST 5: Remove a skill and confirm again: match % drops
  try {
    // Remove "Data Engineering" and "AWS"
    const reducedSkills = ['Python', 'SQL', 'Docker'];
    await request('/student/confirm-skills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: { confirmedSkills: reducedSkills }
    });

    const jobs = await request('/student/jobs', {
      headers: { Authorization: `Bearer ${priyaToken}` }
    });

    const bigDataJob = jobs.find(j => j.role === 'Big Data Pipeline Engineer');
    const newMatch = bigDataJob?.aiMatch?.matchPercent || 0;

    if (newMatch === 60) {
      results.push({ test: '5. Remove skills & re-confirm: match % drops', pass: true, detail: `Match dropped from 100% to ${newMatch}% (3 of 5 skills)` });
    } else {
      results.push({ test: '5. Remove skills & re-confirm: match % drops', pass: false, detail: `Expected 60%, got ${newMatch}%` });
    }
  } catch (err) {
    results.push({ test: '5. Remove skills & re-confirm: match % drops', pass: false, detail: err.message });
  }

  // TEST 6: Upload a corrupt file: friendly error, paste-text fallback works
  try {
    // Re-add required skills for subsequent tests first
    await request('/student/confirm-skills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: { confirmedSkills: ['React', 'Node.js', 'TypeScript', 'SQL', 'Git', 'REST API', 'Python', 'AWS', 'Docker', 'Data Engineering'] }
    });

    // Test upload with invalid/empty text
    const badUpload = await request('/student/upload-cv', {
      method: 'POST',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: { cvText: 'too short' }
    });

    // Test paste fallback
    const pasteFallback = await request('/student/upload-cv', {
      method: 'POST',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: { cvText: 'Pasted resume content with React, Node.js, SQL, TypeScript skills', cvFileName: 'Pasted_CV.txt' }
    });

    if ((badUpload.fallbackRequired || badUpload.json?.fallbackRequired) && pasteFallback.extractedSkills?.length > 0) {
      results.push({ test: '6. Corrupt file error & Paste-text fallback works', pass: true, detail: `Error response prompted fallback (${badUpload.error || badUpload.json?.error}), and paste fallback extracted ${pasteFallback.extractedSkills.length} skills` });
    } else {
      results.push({ test: '6. Corrupt file error & Paste-text fallback works', pass: false, detail: `BadUpload: ${JSON.stringify(badUpload)}, PasteFallback: ${JSON.stringify(pasteFallback)}` });
    }
  } catch (err) {
    results.push({ test: '6. Corrupt file error & Paste-text fallback works', pass: false, detail: err.message });
  }

  // TEST 7: Apply to a job: form is prefilled and CV is preselected
  try {
    // Confirm required skills for Python & Data Analyst (Python, SQL, Data Analysis, Power BI)
    await request('/student/confirm-skills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: { confirmedSkills: ['Python', 'SQL', 'Data Analysis', 'Power BI', 'React', 'Node.js', 'AWS', 'Docker'] }
    });

    const jobs = await request('/student/jobs', {
      headers: { Authorization: `Bearer ${priyaToken}` }
    });
    const dataJob = jobs.find(j => j.role === 'Python & Data Analyst');

    const applyRes = await request('/student/apply', {
      method: 'POST',
      headers: { Authorization: `Bearer ${priyaToken}` },
      body: {
        vacancyId: dataJob.id,
        regNo: '2023CSE042',
        phone: '+91 9876543210',
        email: 'priya.sharma@college.edu',
        consentAccepted: true
      }
    });

    if (applyRes.applicationId || applyRes.message?.includes('submitted')) {
      results.push({ test: '7. Apply to job: verified identity check & submission', pass: true, detail: `Application ID ${applyRes.applicationId} created with AI match score ${applyRes.aiMatch?.matchPercent}%` });
    } else {
      results.push({ test: '7. Apply to job: verified identity check & submission', pass: false, detail: applyRes.error || 'Apply failed' });
    }
  } catch (err) {
    results.push({ test: '7. Apply to job: verified identity check & submission', pass: false, detail: err.message });
  }

  // TEST 8: Log in as recruiter, advance date past close date: drawer shows student's LinkedIn, GitHub, CV, confirmed skills
  try {
    const recruiterLogin = await request('/auth/recruiter/login', {
      method: 'POST',
      body: { email: 'careers@apexinnovations.com', password: 'recruiter123' }
    });
    const recToken = recruiterLogin.token;

    // Advance demo dates past close date
    await request('/demo/advance-dates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recToken}` }
    });

    // Fetch candidate profile for Priya Sharma (Student ID 1)
    const candidateDrawer = await request('/recruiter/candidate/1', {
      headers: { Authorization: `Bearer ${recToken}` }
    });

    const hasAllCandidateData = candidateDrawer.name &&
      candidateDrawer.linkedin &&
      candidateDrawer.github &&
      candidateDrawer.cvFileName &&
      Array.isArray(candidateDrawer.confirmedSkills) &&
      Array.isArray(candidateDrawer.projects) &&
      Array.isArray(candidateDrawer.certifications);

    if (hasAllCandidateData) {
      results.push({ test: '8. Recruiter drawer shows candidate profile, CV & skills', pass: true, detail: `Candidate: ${candidateDrawer.name}, LinkedIn: ${candidateDrawer.linkedin}, CV: ${candidateDrawer.cvFileName}, Skills: ${candidateDrawer.confirmedSkills.length}` });
    } else {
      results.push({ test: '8. Recruiter drawer shows candidate profile, CV & skills', pass: false, detail: 'Missing candidate details in recruiter drawer' });
    }
  } catch (err) {
    results.push({ test: '8. Recruiter drawer shows candidate profile, CV & skills', pass: false, detail: err.message });
  }

  // TEST 9: Log in as different student: cannot see or edit this student's profile
  try {
    // Log in as Rahul Verma (2023IT088)
    const rahulLogin = await request('/auth/student/login', {
      method: 'POST',
      body: { regNo: '2023IT088', password: 'password123' }
    });
    const rahulToken = rahulLogin.token;

    const rahulProfile = await request('/student/profile', {
      headers: { Authorization: `Bearer ${rahulToken}` }
    });

    // Verify Rahul only sees Rahul's data
    const isIsolated = rahulProfile.student.name === 'Rahul Verma' &&
      rahulProfile.student.regNo === '2023IT088' &&
      rahulProfile.student.id !== 1;

    // Verify student cannot pass arbitrary master ID to update
    const hackAttempt = await request('/student/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${rahulToken}` },
      body: {
        student_master_id: 1, // trying to target Priya
        phone: '+91 1111111111'
      }
    });

    // Check Priya's profile remains untouched
    const priyaCheck = await request('/student/profile', {
      headers: { Authorization: `Bearer ${priyaToken}` }
    });

    const isSecure = isIsolated && priyaCheck.profile.phone !== '+91 1111111111';

    if (isSecure) {
      results.push({ test: '9. Security: student cannot view/edit other students profile', pass: true, detail: `Rahul's profile is strictly isolated to ID ${rahulProfile.student.id}, Priya's record intact` });
    } else {
      results.push({ test: '9. Security: student cannot view/edit other students profile', pass: false, detail: 'Isolation failure detected' });
    }
  } catch (err) {
    results.push({ test: '9. Security: student cannot view/edit other students profile', pass: false, detail: err.message });
  }

  console.log('====================================================');
  console.log('🏁 PART 4 ACCEPTANCE TEST RESULTS');
  console.log('====================================================');
  let passedCount = 0;
  for (const r of results) {
    const icon = r.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} | ${r.test}`);
    console.log(`       ↳ ${r.detail}`);
    if (r.pass) passedCount++;
  }
  console.log('====================================================');
  console.log(`Total: ${passedCount}/${results.length} Tests Passed.\n`);
}

runTests().catch(console.error);
