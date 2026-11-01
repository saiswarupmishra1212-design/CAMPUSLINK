const express = require('express');
const { extractSkills, parseResume } = require('../ai/skillExtractor');
const { calculateSkillMatch } = require('../ai/matcher');
const { runEvaluationBenchmark } = require('../ai/evaluationDataset');
const { MASTER_SKILLS } = require('../ai/skillsDictionary');

const router = express.Router();

/**
 * Extract Skills from Raw Text
 * POST /api/ai/extract-skills
 */
router.post('/extract-skills', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text input is required' });

    const skills = extractSkills(text);
    const parsed = parseResume(text);

    return res.json({
      extractedSkills: skills.map(s => s.name),
      skillDetails: skills,
      parsed
    });
  } catch (err) {
    return res.status(500).json({ error: 'Skill extraction failed' });
  }
});

/**
 * Calculate Match Score & Explanation between student skills and job skills
 * POST /api/ai/match
 */
router.post('/match', (req, res) => {
  try {
    const { studentSkills, jobRequiredSkills } = req.body;
    const match = calculateSkillMatch(studentSkills || [], jobRequiredSkills || []);
    return res.json(match);
  } catch (err) {
    return res.status(500).json({ error: 'Match calculation failed' });
  }
});

/**
 * Run Benchmark Evaluation for the AI Engine (Deliverable for Evaluation Page)
 * GET /api/ai/evaluation
 */
router.get('/evaluation', (req, res) => {
  try {
    const evaluation = runEvaluationBenchmark();
    return res.json(evaluation);
  } catch (err) {
    console.error('Benchmark evaluation error:', err);
    return res.status(500).json({ error: 'Evaluation benchmark failed' });
  }
});

/**
 * Get Master Skills List with categories
 * GET /api/ai/master-skills
 */
router.get('/master-skills', (req, res) => {
  return res.json(MASTER_SKILLS);
});

module.exports = router;
