import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BrainCircuit, CheckCircle2, XCircle, AlertTriangle, Sparkles,
  BarChart3, Layers, Terminal, RefreshCw, ArrowRight, Play, Check
} from 'lucide-react';
import { api } from '../../services/api';
import { SkillChips } from '../../components/SkillChips';

export const AiEvaluationPage: React.FC = () => {
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCorrect, setFilterCorrect] = useState<'ALL' | 'CORRECT' | 'INCORRECT'>('ALL');

  // Live Sandbox Interactive Tester
  const [sandboxResume, setSandboxResume] = useState(
    'Senior student with expertise in React, TypeScript, Node.js, and SQL databases. Basic experience with Docker containers and Git version control.'
  );
  const [sandboxRoleSkills, setSandboxRoleSkills] = useState('React, TypeScript, Node.js, SQL, Docker, Kubernetes, CI/CD');
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const data = await api.getAiEvaluation();
      setEvaluation(data);
    } catch (err) {
      console.error('Failed to load AI evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
  }, []);

  const handleRunSandbox = async () => {
    setSandboxLoading(true);
    try {
      // 1. Extract skills from sandbox resume
      const extractRes = await api.extractSkillsAi(sandboxResume);
      const extracted = extractRes.extractedSkills || [];

      // 2. Parse job required skills
      const reqList = sandboxRoleSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);

      // 3. Match
      const matchRes = await api.matchSkillsAi(extracted, reqList);

      setSandboxResult({
        extractedSkills: extracted,
        skillDetails: extractRes.skillDetails || [],
        matchData: matchRes
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSandboxLoading(false);
    }
  };

  const summary = evaluation?.summary || {};
  const classes = evaluation?.classes || ['Highly Employable', 'Ready', 'Developing', 'Not Ready'];
  const confusionMatrix = evaluation?.confusionMatrix || {};
  const perClassMetrics = evaluation?.perClassMetrics || [];
  const sampleResults = evaluation?.sampleResults || [];

  const filteredSamples = sampleResults.filter((s: any) => {
    if (filterCorrect === 'CORRECT') return s.isCorrect;
    if (filterCorrect === 'INCORRECT') return !s.isCorrect;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-semibold mb-2">
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
            <span>AI Verification & Model Validation Benchmark</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            AI Engine Evaluation & Benchmark Performance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Quantitative evaluation of the offline NLP skill extractor and explainable rule matching engine across 50 labelled synthetic benchmark profiles.
          </p>
        </div>

        <button
          onClick={fetchEvaluation}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Run Benchmark Tests</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Top Performance Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Overall Accuracy</span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {summary.accuracy}%
              </div>
              <span className="text-[10px] text-slate-500">
                {summary.totalCorrect} / {summary.totalSamples} correct classifications
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Macro Precision</span>
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {summary.precision}%
              </div>
              <span className="text-[10px] text-slate-500">
                Across 4 readiness classes
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Macro Recall</span>
              <div className="text-3xl font-black text-violet-600 dark:text-violet-400 font-mono">
                {summary.recall}%
              </div>
              <span className="text-[10px] text-slate-500">
                Ground-truth sensitivity
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Macro F1-Score</span>
              <div className="text-3xl font-black text-teal-600 dark:text-teal-400 font-mono">
                {summary.f1Score}%
              </div>
              <span className="text-[10px] text-slate-500">
                Harmonic mean metric
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-1 col-span-2 lg:col-span-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Skill Extraction F1</span>
              <div className="text-3xl font-black text-amber-500 font-mono">
                {summary.skillExtractionF1}%
              </div>
              <span className="text-[10px] text-slate-500">
                Synonym & alias detection
              </span>
            </div>
          </div>

          {/* Confusion Matrix & Per-Class Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 4x4 Confusion Matrix */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    4x4 Classification Confusion Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Predicted vs Ground-Truth Readiness Level Distribution
                  </p>
                </div>
              </div>

              {/* Matrix Heatmap */}
              <div className="overflow-x-auto pt-2">
                <div className="min-w-[400px]">
                  <div className="text-center text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                    &larr; Predicted Class &rarr;
                  </div>

                  <table className="w-full text-center text-xs font-mono">
                    <thead>
                      <tr className="text-[10px] text-slate-400 uppercase font-sans">
                        <th className="p-2 text-left">Actual Class</th>
                        {classes.map((c: string) => (
                          <th key={c} className="p-2 max-w-[80px] truncate" title={c}>
                            {c.split(' ')[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {classes.map((actual: string) => (
                        <tr key={actual}>
                          <td className="p-2.5 font-sans font-bold text-left text-slate-700 dark:text-slate-300 text-xs">
                            {actual}
                          </td>
                          {classes.map((pred: string) => {
                            const count = confusionMatrix[actual]?.[pred] || 0;
                            const isDiagonal = actual === pred;
                            let bg = 'bg-slate-50 dark:bg-slate-800 text-slate-400';

                            if (count > 0) {
                              if (isDiagonal) {
                                bg = 'bg-emerald-500 text-white font-bold text-sm shadow-xs';
                              } else {
                                bg = 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold';
                              }
                            }

                            return (
                              <td key={pred} className="p-2">
                                <div className={`w-12 h-10 rounded-xl flex items-center justify-center mx-auto ${bg}`}>
                                  {count}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Per-Class Detailed Metrics Table */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Per-Class Readiness Benchmark Metrics
                  </h3>
                  <p className="text-xs text-slate-500">
                    Precision, Recall, F1 Score & Sample Support
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    <tr>
                      <th className="p-3">Class</th>
                      <th className="p-3">Precision</th>
                      <th className="p-3">Recall</th>
                      <th className="p-3">F1-Score</th>
                      <th className="p-3">Support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                    {perClassMetrics.map((m: any) => (
                      <tr key={m.className} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">
                          {m.className}
                        </td>
                        <td className="p-3 font-bold text-indigo-600">{m.precision}%</td>
                        <td className="p-3 font-bold text-violet-600">{m.recall}%</td>
                        <td className="p-3 font-bold text-teal-600">{m.f1Score}%</td>
                        <td className="p-3 text-slate-400">{m.support} samples</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Interactive Live Sandbox Predictor */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/40 dark:from-slate-900 dark:to-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 shadow-xl space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-indigo-100 dark:border-indigo-900/40">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Live AI Engine Playground & Custom Predictor
                </h3>
                <p className="text-xs text-slate-500">
                  Paste any CV text and target job skill prerequisites to test offline tokenization and explainable matching live.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Resume Text (Input)</label>
                <textarea
                  rows={4}
                  value={sandboxResume}
                  onChange={(e) => setSandboxResume(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Job Required Skills (Comma-separated)</label>
                <textarea
                  rows={4}
                  value={sandboxRoleSkills}
                  onChange={(e) => setSandboxRoleSkills(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none leading-relaxed font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRunSandbox}
                disabled={sandboxLoading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{sandboxLoading ? 'Analyzing...' : 'Execute Live AI Prediction'}</span>
              </button>
            </div>

            {/* Sandbox Results Display */}
            {sandboxResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-4 shadow-sm text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Predicted Match Score:</span>
                    <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {sandboxResult.matchData.matchPercent}%
                    </span>
                  </div>

                  <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                    sandboxResult.matchData.readinessLevel === 'Highly Employable' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    sandboxResult.matchData.readinessLevel === 'Ready' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                    sandboxResult.matchData.readinessLevel === 'Developing' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {sandboxResult.matchData.readinessLevel}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Extracted Skills</span>
                  <SkillChips skills={sandboxResult.extractedSkills} />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong>AI Explanation: </strong> {sandboxResult.matchData.explanation}
                </div>
              </motion.div>
            )}
          </div>

          {/* Benchmark Labeled Samples Inspection Table */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Synthetic Labeled Benchmark Test Cases ({filteredSamples.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Inspect candidate test cases, ground-truth labels vs AI predictions.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setFilterCorrect('ALL')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    filterCorrect === 'ALL' ? 'bg-slate-900 text-white dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  All ({sampleResults.length})
                </button>
                <button
                  onClick={() => setFilterCorrect('CORRECT')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    filterCorrect === 'CORRECT' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  Correct ({sampleResults.filter((s: any) => s.isCorrect).length})
                </button>
                <button
                  onClick={() => setFilterCorrect('INCORRECT')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    filterCorrect === 'INCORRECT' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  Mismatched ({sampleResults.filter((s: any) => !s.isCorrect).length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Target Role</th>
                    <th className="p-3">Extracted Skills</th>
                    <th className="p-3">Match %</th>
                    <th className="p-3">Actual Class</th>
                    <th className="p-3">AI Prediction</th>
                    <th className="p-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {filteredSamples.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-500">{s.id}</td>
                      <td className="p-3 font-sans font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                        {s.role}
                      </td>
                      <td className="p-3 font-sans max-w-xs truncate" title={s.extractedSkills?.join(', ')}>
                        {s.extractedSkills?.join(', ') || 'None'}
                      </td>
                      <td className="p-3 font-bold text-indigo-600">{s.matchPercent}%</td>
                      <td className="p-3 font-sans font-semibold text-slate-700 dark:text-slate-300">
                        {s.actualClass}
                      </td>
                      <td className="p-3 font-sans font-semibold text-indigo-600 dark:text-indigo-400">
                        {s.predictedClass}
                      </td>
                      <td className="p-3 text-right">
                        {s.isCorrect ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Match</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Gap</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
