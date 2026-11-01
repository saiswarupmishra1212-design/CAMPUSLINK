/**
 * Synthetic Labelled Dataset & Benchmark Evaluation Engine
 */

const { extractSkills } = require('./skillExtractor');
const { calculateSkillMatch } = require('./matcher');

// Ground truth synthetic benchmark samples
const BENCHMARK_SAMPLES = [
  {
    id: 'BENCH-001',
    role: 'Full Stack Engineer',
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'SQL', 'Git', 'Docker'],
    resumeText: 'Passionate developer with expertise in React, Node.js, and TypeScript. Experience building REST APIs with PostgreSQL (SQL) and version control using Git. Basic knowledge of Docker containers.',
    groundTruthSkills: ['React', 'Node.js', 'TypeScript', 'SQL', 'Git', 'Docker'],
    groundTruthClass: 'Highly Employable' // 6/6 -> 100%
  },
  {
    id: 'BENCH-002',
    role: 'Data Scientist',
    requiredSkills: ['Python', 'Machine Learning', 'Deep Learning', 'SQL', 'Data Analysis', 'PyTorch'],
    resumeText: 'Final year CSE student focusing on Python and Data Analysis with Pandas/Numpy. Built ML models using scikit-learn and neural networks with PyTorch. Proficient in SQL query optimization.',
    groundTruthSkills: ['Python', 'Machine Learning', 'Data Analysis', 'PyTorch', 'SQL'],
    groundTruthClass: 'Highly Employable' // 5/6 -> 83.3%
  },
  {
    id: 'BENCH-003',
    role: 'Cloud DevOps Engineer',
    requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Python'],
    resumeText: 'Cloud enthusiast with hands-on AWS EC2/S3 experience and Docker containerization. Managed CI/CD pipelines using GitHub Actions and Git. Familiar with Python scripting.',
    groundTruthSkills: ['AWS', 'Docker', 'CI/CD', 'Git', 'Python'],
    groundTruthClass: 'Highly Employable' // 5/6 -> 83.3%
  },
  {
    id: 'BENCH-004',
    role: 'Frontend Developer',
    requiredSkills: ['React', 'JavaScript', 'HTML/CSS', 'TypeScript', 'UI/UX Design'],
    resumeText: 'Frontend engineer proficient in ReactJS, Vanilla JS, and modern HTML5/CSS3. Designed wireframes in Figma (UI/UX). Exploring TypeScript.',
    groundTruthSkills: ['React', 'JavaScript', 'HTML/CSS', 'UI/UX Design', 'TypeScript'],
    groundTruthClass: 'Highly Employable' // 5/5 -> 100%
  },
  {
    id: 'BENCH-005',
    role: 'Backend Java Developer',
    requiredSkills: ['Java', 'SQL', 'REST API', 'Docker', 'Data Structures & Algorithms'],
    resumeText: 'Core Java developer with Spring Boot experience. Built REST APIs and worked with MySQL databases. Solved 300+ LeetCode DSA problems.',
    groundTruthSkills: ['Java', 'REST API', 'SQL', 'Data Structures & Algorithms'],
    groundTruthClass: 'Ready' // 4/5 -> 80% (Ready/Highly Employable boundary)
  },
  {
    id: 'BENCH-006',
    role: 'QA Automation Engineer',
    requiredSkills: ['Testing / QA', 'Python', 'Git', 'CI/CD', 'SQL'],
    resumeText: 'Software test engineer with Selenium automation, Jest unit testing, and Python scripting. Knowledge of Git for test suites.',
    groundTruthSkills: ['Testing / QA', 'Python', 'Git'],
    groundTruthClass: 'Ready' // 3/5 -> 60%
  },
  {
    id: 'BENCH-007',
    role: 'Cyber Security Analyst',
    requiredSkills: ['Cyber Security', 'Python', 'AWS', 'Docker'],
    resumeText: 'Security student with hands-on ethical hacking and network security labs. Basic Python scripts for automation.',
    groundTruthSkills: ['Cyber Security', 'Python'],
    groundTruthClass: 'Developing' // 2/4 -> 50%
  },
  {
    id: 'BENCH-008',
    role: 'Business Intelligence Analyst',
    requiredSkills: ['Power BI', 'SQL', 'Data Analysis', 'Tableau', 'Python'],
    resumeText: 'Data analyst skilled in PowerBI reporting, DAX queries, and SQL database management. Strong in exploratory data analysis (EDA).',
    groundTruthSkills: ['Power BI', 'SQL', 'Data Analysis'],
    groundTruthClass: 'Ready' // 3/5 -> 60%
  },
  {
    id: 'BENCH-009',
    role: 'Mobile App Developer',
    requiredSkills: ['React', 'JavaScript', 'REST API', 'Git', 'UI/UX Design'],
    resumeText: 'Cross-platform app developer with React Native and JavaScript. Created responsive mobile UI designs in Figma.',
    groundTruthSkills: ['React', 'JavaScript', 'UI/UX Design'],
    groundTruthClass: 'Ready' // 3/5 -> 60%
  },
  {
    id: 'BENCH-010',
    role: 'Big Data Engineer',
    requiredSkills: ['Data Engineering', 'Python', 'SQL', 'AWS', 'Docker'],
    resumeText: 'Student with basic Python and relational SQL knowledge. Interested in big data architectures.',
    groundTruthSkills: ['Python', 'SQL'],
    groundTruthClass: 'Developing' // 2/5 -> 40%
  },
  {
    id: 'BENCH-011',
    role: 'Machine Learning Engineer',
    requiredSkills: ['Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Docker'],
    resumeText: 'Web developer who built standard HTML/CSS websites and knows basic Java. Little exposure to ML.',
    groundTruthSkills: [],
    groundTruthClass: 'Not Ready' // 0/6 -> 0%
  },
  {
    id: 'BENCH-012',
    role: 'DevOps & Site Reliability Engineer',
    requiredSkills: ['Kubernetes', 'Docker', 'AWS', 'CI/CD', 'Python', 'Git'],
    resumeText: 'Junior programmer with knowledge of HTML, CSS, and basic JavaScript. No cloud or container experience.',
    groundTruthSkills: [],
    groundTruthClass: 'Not Ready' // 0/6 -> 0%
  }
];

// Dynamically generate expanded 50-sample benchmark dataset for robust statistical testing
function getExpandedBenchmark() {
  const dataset = [...BENCHMARK_SAMPLES];
  
  const skillPool = [
    'Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'React', 'Node.js',
    'HTML/CSS', 'SQL', 'MongoDB', 'Data Structures & Algorithms', 'Machine Learning',
    'Deep Learning', 'PyTorch', 'TensorFlow', 'Data Analysis', 'Power BI',
    'Tableau', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'REST API',
    'Testing / QA', 'Data Engineering', 'UI/UX Design', 'Cyber Security'
  ];

  const roles = [
    { role: 'Cloud Platform Engineer', req: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Python'] },
    { role: 'Full Stack MERN Developer', req: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'REST API', 'Git'] },
    { role: 'AI / NLP Specialist', req: ['Python', 'Deep Learning', 'PyTorch', 'Machine Learning', 'Data Analysis'] },
    { role: 'Enterprise Java Architect', req: ['Java', 'SQL', 'Docker', 'Data Structures & Algorithms', 'CI/CD'] },
    { role: 'BI & Analytics Consultant', req: ['Power BI', 'Tableau', 'SQL', 'Data Analysis', 'Python'] },
    { role: 'Security & Penetration Tester', req: ['Cyber Security', 'Python', 'AWS', 'Docker'] }
  ];

  for (let i = 13; i <= 50; i++) {
    const roleDef = roles[i % roles.length];
    const subsetCount = (i % 5); // 0 to 4 skills matched
    const presentSkills = roleDef.req.slice(0, subsetCount);
    
    // Add 1-2 random other skills
    if (i % 2 === 0) presentSkills.push('Git');
    if (i % 3 === 0) presentSkills.push('HTML/CSS');

    const uniqueSkills = Array.from(new Set(presentSkills));
    const resume = `Candidate profile for student ${i}. Certified and experienced in ${uniqueSkills.join(', ')}. Actively seeking opportunities in software engineering and technology.`;
    
    // Calculate ground truth
    const matchedInJob = uniqueSkills.filter(s => roleDef.req.includes(s));
    const ratio = matchedInJob.length / roleDef.req.length;
    let groundClass = 'Not Ready';
    if (ratio >= 0.8) groundClass = 'Highly Employable';
    else if (ratio >= 0.6) groundClass = 'Ready';
    else if (ratio >= 0.4) groundClass = 'Developing';

    dataset.push({
      id: `BENCH-${String(i).padStart(3, '0')}`,
      role: roleDef.role,
      requiredSkills: roleDef.req,
      resumeText: resume,
      groundTruthSkills: uniqueSkills,
      groundTruthClass: groundClass
    });
  }

  return dataset;
}

/**
 * Runs full AI evaluation over benchmark dataset and returns metrics + confusion matrix
 */
function runEvaluationBenchmark() {
  const samples = getExpandedBenchmark();
  const results = [];

  const classes = ['Highly Employable', 'Ready', 'Developing', 'Not Ready'];
  
  // Initialize 4x4 Confusion Matrix
  const confusionMatrix = {};
  classes.forEach(actual => {
    confusionMatrix[actual] = {};
    classes.forEach(pred => {
      confusionMatrix[actual][pred] = 0;
    });
  });

  let totalCorrect = 0;
  let skillExtractionAccuracies = [];

  for (const sample of samples) {
    // 1. Skill extraction prediction
    const extracted = extractSkills(sample.resumeText);
    const extractedNames = extracted.map(e => e.name);

    // Skill extraction precision/recall
    const truePositives = extractedNames.filter(s => sample.groundTruthSkills.includes(s)).length;
    const extractionPrecision = extractedNames.length > 0 ? truePositives / extractedNames.length : 1.0;
    const extractionRecall = sample.groundTruthSkills.length > 0 ? truePositives / sample.groundTruthSkills.length : 1.0;
    const extractionF1 = (extractionPrecision + extractionRecall > 0)
      ? (2 * extractionPrecision * extractionRecall) / (extractionPrecision + extractionRecall)
      : 1.0;

    skillExtractionAccuracies.push(extractionF1);

    // 2. Match prediction using extracted skills
    const matchAnalysis = calculateSkillMatch(extractedNames, sample.requiredSkills);
    const predictedClass = matchAnalysis.readinessLevel;
    const actualClass = sample.groundTruthClass;

    // Update confusion matrix
    if (confusionMatrix[actualClass] && confusionMatrix[actualClass][predictedClass] !== undefined) {
      confusionMatrix[actualClass][predictedClass]++;
    }

    const isCorrect = predictedClass === actualClass;
    if (isCorrect) totalCorrect++;

    results.push({
      id: sample.id,
      role: sample.role,
      requiredSkills: sample.requiredSkills,
      groundTruthSkills: sample.groundTruthSkills,
      extractedSkills: extractedNames,
      matchPercent: matchAnalysis.matchPercent,
      actualClass,
      predictedClass,
      isCorrect,
      explanation: matchAnalysis.explanation
    });
  }

  const totalSamples = samples.length;
  const accuracy = (totalCorrect / totalSamples) * 100;

  // Compute per-class Precision, Recall, F1
  const perClassMetrics = classes.map(cls => {
    let tp = confusionMatrix[cls][cls];
    let fp = 0;
    let fn = 0;

    classes.forEach(other => {
      if (other !== cls) {
        fp += confusionMatrix[other][cls];
        fn += confusionMatrix[cls][other];
      }
    });

    const precision = (tp + fp > 0) ? (tp / (tp + fp)) * 100 : 100;
    const recall = (tp + fn > 0) ? (tp / (tp + fn)) * 100 : 100;
    const f1 = (precision + recall > 0) ? (2 * precision * recall) / (precision + recall) : 100;

    return {
      className: cls,
      truePositive: tp,
      falsePositive: fp,
      falseNegative: fn,
      precision: Math.round(precision * 10) / 10,
      recall: Math.round(recall * 10) / 10,
      f1Score: Math.round(f1 * 10) / 10,
      support: tp + fn
    };
  });

  // Macro-averaged metrics
  const macroPrecision = perClassMetrics.reduce((acc, m) => acc + m.precision, 0) / classes.length;
  const macroRecall = perClassMetrics.reduce((acc, m) => acc + m.recall, 0) / classes.length;
  const macroF1 = perClassMetrics.reduce((acc, m) => acc + m.f1Score, 0) / classes.length;
  const avgSkillExtractionF1 = (skillExtractionAccuracies.reduce((a, b) => a + b, 0) / totalSamples) * 100;

  return {
    summary: {
      totalSamples,
      totalCorrect,
      accuracy: Math.round(accuracy * 10) / 10,
      precision: Math.round(macroPrecision * 10) / 10,
      recall: Math.round(macroRecall * 10) / 10,
      f1Score: Math.round(macroF1 * 10) / 10,
      skillExtractionF1: Math.round(avgSkillExtractionF1 * 10) / 10,
      evaluationTimestamp: new Date().toISOString()
    },
    classes,
    confusionMatrix,
    perClassMetrics,
    sampleResults: results
  };
}

module.exports = {
  runEvaluationBenchmark
};
