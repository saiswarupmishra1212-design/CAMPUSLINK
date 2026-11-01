import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, UserCheck, Mail, Send, CheckCircle2,
  Sparkles, ShieldAlert, BookOpen, User, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

export const PlacementAtRisk: React.FC = () => {
  const [atRiskList, setAtRiskList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchAtRisk = async () => {
    try {
      setLoading(true);
      const data = await api.getPlacementAtRisk();
      setAtRiskList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtRisk();
  }, []);

  const handleNotifyMentor = async (studentId: number, studentName: string) => {
    setActionLoading(studentId);
    try {
      const res = await api.notifyMentor(studentId);
      setToastMsg(`Mentorship counseling request dispatched for ${studentName}!`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to notify mentor');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-700 text-xs font-semibold flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)}>&times;</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>AI Risk-Factor Heuristics Active</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            At-Risk Students & Mentorship Intervention
          </h1>
          <p className="text-xs text-slate-500">
            Identifies graduating students needing urgent intervention due to zero applications, high backlogs, or repeated interview rejections.
          </p>
        </div>

        <button
          onClick={fetchAtRisk}
          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-evaluate Risk Flags</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : atRiskList.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero critical at-risk students</h3>
          <p className="text-xs text-slate-500">
            All graduating candidates are actively applying, maintaining eligibility, and clearing placement benchmarks.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {atRiskList.map((item) => {
            const isHighRisk = item.severity === 'HIGH';

            return (
              <motion.div
                key={item.studentId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 sm:p-7 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-start justify-between gap-6 transition ${
                  isHighRisk
                    ? 'bg-rose-50/40 dark:bg-slate-900 border-rose-300 dark:border-rose-900/60 shadow-rose-500/5'
                    : 'bg-amber-50/40 dark:bg-slate-900 border-amber-300 dark:border-amber-900/60 shadow-amber-500/5'
                }`}
              >
                {/* Student Info & Heuristics */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      ({item.regNo} &bull; {item.branch} &bull; {item.year}th Year)
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isHighRisk
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-amber-500 text-white shadow-xs'
                    }`}>
                      {item.severity} RISK ({item.riskScore}%)
                    </span>
                  </div>

                  {/* Academic Snapshot */}
                  <div className="flex flex-wrap gap-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                    <span>CGPA: <strong>{item.cgpa}</strong></span>
                    <span>&bull;</span>
                    <span className={item.backlogCount > 0 ? 'text-rose-600 font-bold' : ''}>
                      Backlogs: {item.backlogCount}
                    </span>
                    <span>&bull;</span>
                    <span>Applications: {item.totalApplications}</span>
                    <span>&bull;</span>
                    <span>Rejections: {item.rejectedCount}</span>
                  </div>

                  {/* Detected Risk Flags */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Explainable Heuristic Flags
                    </span>
                    <div className="space-y-1 text-xs">
                      {item.flags.map((flag: any, fIdx: number) => (
                        <div
                          key={fIdx}
                          className="flex items-start gap-2 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 leading-relaxed"
                        >
                          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            flag.severity === 'HIGH' ? 'text-rose-600' : 'text-amber-500'
                          }`} />
                          <span>{flag.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Intervention */}
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                    🎯 <strong>Action Plan: </strong> {item.recommendedAction}
                  </div>
                </div>

                {/* Right Action: Notify Mentor */}
                <div className="shrink-0 flex flex-col items-start md:items-end justify-center border-t md:border-t-0 pt-4 md:pt-0 border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => handleNotifyMentor(item.studentId, item.name)}
                    disabled={actionLoading === item.studentId}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{actionLoading === item.studentId ? 'Dispatching...' : 'Notify Mentor'}</span>
                  </button>
                  <span className="text-[10px] text-slate-400 mt-1.5">
                    Sends counseling alert & calendar booking
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
