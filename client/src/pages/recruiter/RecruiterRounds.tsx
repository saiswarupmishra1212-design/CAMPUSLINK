import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, CheckCircle2, XCircle, AlertTriangle, Users,
  Send, Sparkles, Clock, Check, ArrowRight, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { api } from '../../services/api';

export const RecruiterRounds: React.FC = () => {
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(null);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<Record<number, { result: 'Pass' | 'Fail', feedback: string }>>({});
  const [roundDecisionStatuses, setRoundDecisionStatuses] = useState<any[]>([]);
  const [virtualDate, setVirtualDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any | null>(null);

  // Load Vacancies
  useEffect(() => {
    api.getRecruiterVacancies()
      .then(data => {
        setVacancies(data || []);
        if (data && data.length > 0) {
          setSelectedVacancyId(data[0].id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Load candidates for current round
  const loadCandidates = async () => {
    if (!selectedVacancyId) return;
    try {
      setLoading(true);
      const data = await api.getVacancyApplications(selectedVacancyId);
      setRoundDecisionStatuses(data.roundDecisionStatuses || []);
      setVirtualDate(data.virtualDate || '');
      const apps = data.applicants || [];

      // Filter candidates in current round or shortlisted
      const targetStatus = selectedRoundIndex === 0 ? ['Applied', 'Shortlisted', 'Round 1'] : [`Round ${selectedRoundIndex + 1}`];
      const roundCandidates = apps.filter((a: any) => targetStatus.includes(a.status));

      setCandidates(roundCandidates);

      // Prepopulate default evaluations
      const initialEval: Record<number, { result: 'Pass' | 'Fail', feedback: string }> = {};
      roundCandidates.forEach((c: any) => {
        initialEval[c.id] = {
          result: c.matchPercent >= 65 ? 'Pass' : 'Fail',
          feedback: ''
        };
      });
      setEvaluations(initialEval);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [selectedVacancyId, selectedRoundIndex]);

  const currentVacancy = vacancies.find(v => v.id === selectedVacancyId);
  const rounds = currentVacancy?.rounds || [];
  const currentRound = rounds[selectedRoundIndex] || { name: `Round ${selectedRoundIndex + 1}` };
  const currentRoundStatus = roundDecisionStatuses.find((r: any) => r.roundIndex === selectedRoundIndex);
  const isLocked = currentRoundStatus ? currentRoundStatus.isDecisionLocked : false;
  const decisionOpensOn = currentRoundStatus?.decisionOpensOn;

  const handleResultToggle = (appId: number, result: 'Pass' | 'Fail') => {
    if (isLocked) return;
    setEvaluations(prev => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        result
      }
    }));
  };

  // Quick batch select all or reject all
  const setAllResults = (result: 'Pass' | 'Fail') => {
    if (isLocked) return;
    const updated: Record<number, { result: 'Pass' | 'Fail', feedback: string }> = {};
    candidates.forEach(c => {
      updated[c.id] = {
        result,
        feedback: ''
      };
    });
    setEvaluations(updated);
  };

  const passedCount = Object.values(evaluations).filter(e => e.result === 'Pass').length;
  const rejectedCount = Object.values(evaluations).filter(e => e.result === 'Fail').length;

  const handleSubmitResults = async () => {
    setSubmitting(true);
    try {
      const payload = candidates.map(c => ({
        applicationId: c.id,
        result: evaluations[c.id]?.result || 'Pass',
        privateRemark: evaluations[c.id]?.feedback || ''
      }));

      const res = await api.submitRoundResults({
        vacancyId: selectedVacancyId,
        roundIndex: selectedRoundIndex,
        evaluatedCandidates: payload
      });

      setSubmitResult(res);
      setShowConfirmModal(false);
      loadCandidates();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            5. Rounds & Results Evaluation Grader
          </h1>
          <p className="text-xs text-slate-500">
            Grade candidates per round with automated in-app notifications and simulated email delivery.
          </p>
        </div>

        {/* Vacancy Selector */}
        <select
          value={selectedVacancyId || ''}
          onChange={(e) => setSelectedVacancyId(parseInt(e.target.value, 10))}
          className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
        >
          {vacancies.map(v => (
            <option key={v.id} value={v.id}>{v.role}</option>
          ))}
        </select>
      </div>

      {/* Round Selection Tabs */}
      {rounds.length > 0 && (
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          {rounds.map((r: any, idx: number) => {
            const isSelected = selectedRoundIndex === idx;
            const rStatus = roundDecisionStatuses.find((s: any) => s.roundIndex === idx);
            const rLocked = rStatus?.isDecisionLocked;
            return (
              <button
                key={idx}
                onClick={() => setSelectedRoundIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>Round {idx + 1}: {r.name}</span>
                <span className="text-[10px] font-mono opacity-80">({r.date})</span>
                {rLocked && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Locked</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Decision Lock Alert Banner */}
      {isLocked && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3 shadow-xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold block text-sm">
              Decisions open on {decisionOpensOn}
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-300">
              Decisions for {currentRound.name} are locked until the day after the exam date ({currentRound.date}). Advance the per-job demo clock to unlock grading.
            </span>
          </div>
        </div>
      )}

      {/* Success/Warning Notification after Submit */}
      {submitResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-900 dark:text-emerald-200 text-xs space-y-2"
        >
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{submitResult.message}</span>
          </div>

          {submitResult.warnings && submitResult.warnings.length > 0 && (
            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 space-y-1">
              <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Clash Warnings Detected During Advancement:
              </span>
              {submitResult.warnings.map((w: string, i: number) => (
                <div key={i} className="text-amber-800 dark:text-amber-200 text-[11px] pl-5 font-mono">
                  &bull; {w}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Candidate Evaluation Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              Evaluating {candidates.length} Candidates for {currentRound.name}
            </span>
            <span className="text-slate-500 block text-[11px]">
              Scheduled: {currentRound.date} at {currentRound.time || '10:00 AM'} ({currentRound.venue})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setAllResults('Pass')}
              className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark All Select
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setAllResults('Fail')}
              className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold hover:bg-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark All Reject
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No active candidates currently scheduled for this round. Candidates must be shortlisted or pass prior rounds first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                <tr>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4">CGPA</th>
                  <th className="p-4">AI Match</th>
                  <th className="p-4">Decision</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {candidates.map((cand) => {
                  const evalState = evaluations[cand.id] || { result: 'Pass', feedback: '' };

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={cand.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cand.name)}`}
                            alt={cand.name}
                            className="w-8 h-8 rounded-xl object-cover"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {cand.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {cand.regNo}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                        {cand.branch}
                      </td>

                      <td className="p-4 font-mono font-bold text-emerald-600">
                        {cand.cgpa}
                      </td>

                      <td className="p-4 font-mono font-extrabold text-teal-600">
                        {cand.matchPercent}%
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleResultToggle(cand.id, 'Pass')}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                              evalState.result === 'Pass'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Select</span>
                          </button>

                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleResultToggle(cand.id, 'Fail')}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                              evalState.result === 'Fail'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Submit */}
        {candidates.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
            <div className="font-semibold text-slate-600 dark:text-slate-300 font-mono">
              Selected: <span className="text-emerald-600 font-bold">{passedCount}</span> &bull; Rejected: <span className="text-rose-600 font-bold">{rejectedCount}</span>
            </div>

            <button
              type="button"
              disabled={isLocked}
              onClick={() => setShowConfirmModal(true)}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isLocked ? `Decisions open on ${decisionOpensOn}` : 'Submit Decisions & Dispatch Notifications'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Popup Modal (Section 7 requirement: "Show a confirmation popup before submitting ('35 move forward, 55 rejected. Confirm?')") */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowConfirmModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Confirm Round Evaluation
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentRound.name} &bull; {currentVacancy?.role}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-600 dark:text-slate-300">Advancing to next stage:</span>
                  <span className="text-emerald-600 font-mono text-sm">{passedCount} Candidates</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-600 dark:text-slate-300">Rejected / Not moving forward:</span>
                  <span className="text-rose-600 font-mono text-sm">{rejectedCount} Candidates</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Confirming will automatically advance selected students into the next round, check for date clashes, and dispatch simulated emails and in-app notifications.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitResults}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md"
                >
                  {submitting ? 'Submitting...' : `${passedCount} Move Forward, ${rejectedCount} Rejected. Confirm?`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
