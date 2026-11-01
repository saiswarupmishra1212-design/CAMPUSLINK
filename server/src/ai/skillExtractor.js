const { MASTER_SKILLS } = require('./skillsDictionary');

/**
 * Normalizes text and extracts skills based on the master dictionary synonyms
 * @param {string} text - Raw text from CV or input
 * @param {Array} customSkillsDict - Optional overridden master skills list from settings
 * @returns {Array<{name: string, category: string, matchedSynonym: string, confidence: number}>}
 */
function extractSkills(text, customSkillsDict = null) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const dictionary = customSkillsDict || MASTER_SKILLS;
  const normalizedText = ' ' + text.toLowerCase().replace(/[\r\n\t]+/g, ' ') + ' ';
  const extractedMap = new Map();

  for (const skillObj of dictionary) {
    const { name, category, synonyms } = skillObj;
    const allTerms = [name.toLowerCase(), ...(synonyms || []).map(s => s.toLowerCase())];

    for (const term of allTerms) {
      // Escape regex special characters in term (e.g. c++, c/c++, .net, etc.)
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Match with word boundary or common punctuation delimiters
      const pattern = new RegExp(`(?:^|[^a-zA-Z0-9+#/.-])${escapedTerm}(?=[^a-zA-Z0-9+#/.-]|$)`, 'i');
      
      if (pattern.test(normalizedText)) {
        if (!extractedMap.has(name)) {
          extractedMap.set(name, {
            name,
            category: category || 'General',
            matchedSynonym: term,
            confidence: term === name.toLowerCase() ? 1.0 : 0.92
          });
        }
        break;
      }
    }
  }

  return Array.from(extractedMap.values());
}

/**
 * Extracts items from a specific section in the resume text
 */
function extractSectionItems(text, sectionKeywords) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items = [];
  let inSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeading = sectionKeywords.some(kw => new RegExp(`^#*\\s*${kw}[:]?\\s*$`, 'i').test(line) || new RegExp(`^${kw}\\b`, 'i').test(line));

    if (isHeading) {
      inSection = true;
      continue;
    }

    if (inSection) {
      // Check if next section heading begins
      if (/^(Education|Skills|Technical Skills|Certifications|Certificates|Projects|Experience|Internships|Work Experience|Summary|Profiles|Contact|Languages|Achievements)[:]?\s*$/i.test(line)) {
        break;
      }

      // Bullet points or list items
      const cleanItem = line.replace(/^[-*•\d.)\]]\s*/, '').trim();
      if (cleanItem.length >= 4 && cleanItem.length <= 150) {
        items.push(cleanItem);
      }
      if (items.length >= 5) break;
    }
  }

  return items;
}

/**
 * Extracts basic profile info from resume text (email, phone, github, linkedin, skills, projects, certifications, internships)
 * @param {string} text 
 */
function parseResume(text) {
  if (!text || typeof text !== 'string') {
    return {
      email: null,
      phone: null,
      linkedin: null,
      github: null,
      skills: [],
      skillDetails: [],
      projects: [],
      certifications: [],
      internships: []
    };
  }

  const skills = extractSkills(text);
  
  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : null;

  // Extract phone (Indian/International phone numbers)
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?[6-9]\d{9}/);
  const phone = phoneMatch ? phoneMatch[0] : null;

  // Extract LinkedIn
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  let linkedin = linkedinMatch ? linkedinMatch[0] : null;
  if (linkedin && !linkedin.startsWith('http')) linkedin = 'https://' + linkedin;

  // Extract GitHub
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  let github = githubMatch ? githubMatch[0] : null;
  if (github && !github.startsWith('http')) github = 'https://' + github;

  // Extract Projects, Certifications, Internships
  const projects = extractSectionItems(text, ['Projects', 'Technical Projects', 'Key Projects', 'Academic Projects']);
  const certifications = extractSectionItems(text, ['Certifications', 'Certificates', 'Licenses & Certifications', 'Certification']);
  const internships = extractSectionItems(text, ['Internships', 'Work Experience', 'Experience', 'Internship Experience', 'Employment']);

  return {
    email,
    phone,
    linkedin,
    github,
    skills: skills.map(s => s.name),
    skillDetails: skills,
    projects,
    certifications,
    internships
  };
}

module.exports = {
  extractSkills,
  parseResume
};
