/**
 * At-Risk Student Evaluator (Explainable Heuristic Intelligence)
 */

function evaluateAtRiskStudents(db) {
  // Fetch all students with master, profile, applications, and results
  const students = db.prepare(`
    SELECT 
      sm.id,
      sm.reg_no,
      sm.name,
      sm.branch,
      sm.year,
      sm.passout_batch,
      sm.cgpa,
      sm.backlog_count,
      sm.email,
      sp.confirmed_skills,
      sp.cv_file_name,
      COUNT(DISTINCT a.id) as total_applications,
      SUM(CASE WHEN a.status = 'Offer Accepted' THEN 1 ELSE 0 END) as placed_count,
      SUM(CASE WHEN a.status = 'Rejected' THEN 1 ELSE 0 END) as rejected_count
    FROM student_master sm
    LEFT JOIN student_profile sp ON sm.id = sp.student_master_id
    LEFT JOIN application a ON sm.id = a.student_master_id
    GROUP BY sm.id
  `).all();

  const vacancies = db.prepare(`
    SELECT id, role, required_skills, min_cgpa, backlog_rule, max_backlogs, status 
    FROM vacancy 
    WHERE status = 'Open'
  `).all();

  const atRiskList = [];

  for (const student of students) {
    // If student is already placed, they are not at risk
    if (student.placed_count > 0) continue;

    const flags = [];
    let riskScore = 0; // 0 - 100

    // Factor 1: 4th-year graduating student with 0 applications
    if (student.year === 4 && student.total_applications === 0) {
      flags.push({
        type: 'UNAPPLIED_FINAL_YEAR',
        severity: 'HIGH',
        message: 'Final year student who has not submitted any campus placement applications.'
      });
      riskScore += 45;
    }

    // Factor 2: High backlogs blocking recruitment criteria
    if (student.backlog_count >= 2) {
      flags.push({
        type: 'MULTIPLE_BACKLOGS',
        severity: 'HIGH',
        message: `Currently has ${student.backlog_count} active backlogs, rendering them ineligible for ~70% of companies.`
      });
      riskScore += 35;
    } else if (student.backlog_count === 1) {
      flags.push({
        type: 'SINGLE_BACKLOG',
        severity: 'MEDIUM',
        message: 'Has 1 active backlog; blocked by strict zero-backlog enterprise recruiters.'
      });
      riskScore += 15;
    }

    // Factor 3: Multiple rejections in interview rounds
    if (student.rejected_count >= 2) {
      flags.push({
        type: 'MULTIPLE_REJECTIONS',
        severity: 'HIGH',
        message: `Faced rejections in ${student.rejected_count} recruitment drives. Candidate needs interview and soft-skills coaching.`
      });
      riskScore += 30;
    }

    // Factor 4: Low average skill readiness across available vacancies
    let skills = [];
    try {
      skills = JSON.parse(student.confirmed_skills || '[]');
    } catch {
      skills = [];
    }

    if (skills.length === 0) {
      flags.push({
        type: 'NO_CONFIRMED_SKILLS',
        severity: 'MEDIUM',
        message: 'No verified technical skills in student profile. AI matching cannot calculate high fit.'
      });
      riskScore += 20;
    } else if (vacancies.length > 0) {
      let totalMatch = 0;
      for (const v of vacancies) {
        let reqSkills = [];
        try {
          reqSkills = JSON.parse(v.required_skills || '[]');
        } catch {
          reqSkills = [];
        }
        if (reqSkills.length > 0) {
          const matched = reqSkills.filter(s => skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase()));
          totalMatch += (matched.length / reqSkills.length) * 100;
        }
      }
      const avgMatch = totalMatch / vacancies.length;
      if (avgMatch < 40) {
        flags.push({
          type: 'CRITICAL_SKILL_GAP',
          severity: 'HIGH',
          message: `Average skill match score is only ${avgMatch.toFixed(1)}% across current industry job profiles.`
        });
        riskScore += 25;
      }
    }

    // Factor 5: Low CGPA
    if (student.cgpa < 6.5) {
      flags.push({
        type: 'LOW_ACADEMIC_CGPA',
        severity: 'MEDIUM',
        message: `CGPA is ${student.cgpa.toFixed(2)}, which is below corporate cut-offs (typically 7.0+).`
      });
      riskScore += 20;
    }

    // Factor 6: No CV Uploaded
    if (!student.cv_file_name) {
      flags.push({
        type: 'NO_CV_UPLOADED',
        severity: 'MEDIUM',
        message: 'No CV or resume uploaded to placement registry. Student is invisible to automated AI screening.'
      });
      riskScore += 25;
    }

    if (flags.length > 0) {
      let severity = 'LOW';
      if (riskScore >= 50) severity = 'HIGH';
      else if (riskScore >= 25) severity = 'MEDIUM';

      atRiskList.push({
        studentId: student.id,
        regNo: student.reg_no,
        name: student.name,
        branch: student.branch,
        year: student.year,
        cgpa: student.cgpa,
        backlogCount: student.backlog_count,
        email: student.email,
        totalApplications: student.total_applications,
        rejectedCount: student.rejected_count,
        riskScore: Math.min(100, riskScore),
        severity,
        flags,
        recommendedAction: severity === 'HIGH' 
          ? 'Assign 1-on-1 Placement Cell Mentor, schedule mock interview & skill bootcamp.' 
          : 'Send automated resume improvement reminders & targeted skill badges.'
      });
    }
  }

  // Sort descending by risk score
  atRiskList.sort((a, b) => b.riskScore - a.riskScore);
  return atRiskList;
}

module.exports = {
  evaluateAtRiskStudents
};
