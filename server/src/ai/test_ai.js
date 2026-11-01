const { extractSkills, parseResume } = require('./skillExtractor');
const { calculateSkillMatch, evaluateEligibility } = require('./matcher');
const { runEvaluationBenchmark } = require('./evaluationDataset');

console.log('=== TESTING AI SKILL EXTRACTOR ===');
const sampleCV = `
Priya Sharma - Computer Science Senior (2026)
Skills: Proficient in Python (py3), ReactJS, Node.js with Express, and SQL (PostgreSQL).
Hands-on experience with Docker containerization, AWS cloud, Git, and RESTful APIs.
`;

const extracted = extractSkills(sampleCV);
console.log('Extracted skills:', extracted.map(s => `${s.name} (${s.matchedSynonym})`));

console.log('\n=== TESTING AI MATCHER ===');
const jobSkills = ['Python', 'SQL', 'Docker', 'AWS', 'Kubernetes', 'CI/CD'];
const match = calculateSkillMatch(extracted.map(s => s.name), jobSkills);
console.log('Match Result:', {
  matchPercent: `${match.matchPercent}%`,
  readinessLevel: match.readinessLevel,
  matchedSkills: match.matchedSkills,
  missingSkills: match.missingSkills,
  explanation: match.explanation
});

console.log('\n=== RUNNING EVALUATION BENCHMARK ===');
const benchmark = runEvaluationBenchmark();
console.log('Benchmark Summary:', benchmark.summary);
console.log('Confusion Matrix:', benchmark.confusionMatrix);
console.log('Per-Class Metrics:', benchmark.perClassMetrics);
