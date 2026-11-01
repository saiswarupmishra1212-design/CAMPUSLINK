/**
 * AI Matching Engine for Student-Job Fit
 */

/**
 * Calculates skill match percentage, gap analysis, readiness level, and plain-English explanation
 * @param {Array<string>} studentSkills - Array of student's confirmed skills
 * @param {Array<string>} jobRequiredSkills - Array of job's required skills
 * @returns {Object} Match analytics object
 */
function calculateSkillMatch(studentSkills = [], jobRequiredSkills = []) {
  if (!jobRequiredSkills || jobRequiredSkills.length === 0) {
    return {
      matchPercent: 100,
      matchedSkills: studentSkills || [],
      missingSkills: [],
      readinessLevel: 'Highly Employable',
      totalRequired: 0,
      matchedCount: 0,
      explanation: 'No specific prerequisite skills required for this job.'
    };
  }

  const normalizedStudentSkills = new Set(
    (studentSkills || []).map(s => (typeof s === 'string' ? s.trim().toLowerCase() : ''))
  );

  const matchedSkills = [];
  const missingSkills = [];

  for (const reqSkill of jobRequiredSkills) {
    const cleanReqSkill = typeof reqSkill === 'string' ? reqSkill.trim() : '';
    if (normalizedStudentSkills.has(cleanReqSkill.toLowerCase())) {
      matchedSkills.push(cleanReqSkill);
    } else {
      missingSkills.push(cleanReqSkill);
    }
  }

  const totalRequired = jobRequiredSkills.length;
  const matchedCount = matchedSkills.length;
  const rawMatch = (matchedCount / totalRequired) * 100;
  const matchPercent = Math.round(rawMatch * 10) / 10;

  let readinessLevel = 'Not Ready';
  if (matchPercent >= 80) {
    readinessLevel = 'Highly Employable';
  } else if (matchPercent >= 60) {
    readinessLevel = 'Ready';
  } else if (matchPercent >= 40) {
    readinessLevel = 'Developing';
  } else {
    readinessLevel = 'Not Ready';
  }

  // Plain-English Explainability Generator
  let explanation = '';
  if (matchPercent === 100) {
    explanation = `Outstanding fit! You possess all ${totalRequired} of the required skills (${matchedSkills.join(', ')}). Your profile is categorized as Highly Employable for this role.`;
  } else if (matchPercent >= 80) {
    explanation = `Strong match! You match ${matchedCount} of ${totalRequired} required skills. Matched: ${matchedSkills.join(', ')}. Missing: ${missingSkills.join(', ')}. Your readiness level is Highly Employable.`;
  } else if (matchPercent >= 60) {
    explanation = `Good match! You match ${matchedCount} of ${totalRequired} required skills. Matched: ${matchedSkills.join(', ')}. Missing: ${missingSkills.join(', ')}. Learn ${missingSkills.slice(0, 2).join(' & ')} to reach Highly Employable.`;
  } else if (matchPercent >= 40) {
    explanation = `Developing profile. You match ${matchedCount} of ${totalRequired} required skills. Matched: ${matchedSkills.length > 0 ? matchedSkills.join(', ') : 'None'}. Missing: ${missingSkills.join(', ')}. Upskilling in ${missingSkills.slice(0, 3).join(', ')} will bring you to Ready status.`;
  } else {
    explanation = `Not ready yet. You match ${matchedCount} of ${totalRequired} required skills. Key gaps: ${missingSkills.join(', ')}. Prioritize building hands-on projects with ${missingSkills.slice(0, 2).join(' and ')}.`;
  }

  return {
    matchPercent,
    matchedSkills,
    missingSkills,
    readinessLevel,
    totalRequired,
    matchedCount,
    explanation
  };
}

/**
 * Checks eligibility rules independently from skill match percentage
 * @param {Object} student - { cgpa, backlogCount, branch, confirmedSkills }
 * @param {Object} job - { minCgpa, allowedBranches, backlogRule, maxBacklogs, requiredSkills }
 * @param {number} minMatchPercentSetting - Configured threshold from placement settings (default 60)
 */
function evaluateEligibility(student, job, minMatchPercentSetting = 60.0) {
  const reasons = [];
  let isEligible = true;

  // 1. Skill Match threshold check
  const studentSkills = typeof student.confirmed_skills === 'string' 
    ? JSON.parse(student.confirmed_skills || '[]') 
    : (student.confirmed_skills || student.confirmedSkills || []);
    
  const jobSkills = typeof job.required_skills === 'string'
    ? JSON.parse(job.required_skills || '[]')
    : (job.required_skills || job.requiredSkills || []);

  const matchData = calculateSkillMatch(studentSkills, jobSkills);
  const meetsMatch = matchData.matchPercent >= minMatchPercentSetting;

  if (!meetsMatch) {
    isEligible = false;
    reasons.push(`Skill match (${matchData.matchPercent}%) is below the required ${minMatchPercentSetting}% threshold.`);
  }

  // 2. CGPA rule
  const studentCgpa = parseFloat(student.cgpa || 0);
  const minCgpa = parseFloat(job.min_cgpa ?? job.minCgpa ?? 0);
  const meetsCgpa = studentCgpa >= minCgpa;
  if (!meetsCgpa) {
    isEligible = false;
    reasons.push(`CGPA (${studentCgpa.toFixed(2)}) is below the required minimum (${minCgpa.toFixed(2)}).`);
  }

  // 3. Branch rule
  const allowedBranches = typeof job.allowed_branches === 'string'
    ? JSON.parse(job.allowed_branches || '[]')
    : (job.allowed_branches || job.allowedBranches || []);
    
  let meetsBranch = true;
  if (allowedBranches.length > 0) {
    meetsBranch = allowedBranches.includes(student.branch);
    if (!meetsBranch) {
      isEligible = false;
      reasons.push(`Branch '${student.branch}' is not in the eligible branches: ${allowedBranches.join(', ')}.`);
    }
  }

  // 4. Backlog rule
  const backlogCount = parseInt(student.backlog_count ?? student.backlogCount ?? 0, 10);
  const backlogRule = job.backlog_rule || job.backlogRule || 'NotAllowed';
  const maxBacklogs = parseInt(job.max_backlogs ?? job.maxBacklogs ?? 0, 10);
  let meetsBacklog = true;

  if (backlogRule === 'NotAllowed' && backlogCount > 0) {
    meetsBacklog = false;
    isEligible = false;
    reasons.push(`You have ${backlogCount} active backlog(s). This job does not allow backlogs.`);
  } else if (backlogRule === 'AllowedUpToN' && backlogCount > maxBacklogs) {
    meetsBacklog = false;
    isEligible = false;
    reasons.push(`You have ${backlogCount} active backlogs, exceeding the allowed maximum of ${maxBacklogs}.`);
  }

  return {
    isEligible,
    meetsMatch,
    meetsCgpa,
    meetsBranch,
    meetsBacklog,
    reasons,
    matchData,
    minMatchPercentRequired: minMatchPercentSetting
  };
}

module.exports = {
  calculateSkillMatch,
  evaluateEligibility
};
