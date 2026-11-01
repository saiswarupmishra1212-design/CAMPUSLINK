import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, CheckCircle2, Clock, Award, AlertTriangle,
  Calendar, FileText, ArrowRight, ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';
import { Application } from '../../types';
import { StatusStepper } from '../../components/StatusStepper';
import { SkillChips } from '../../components/SkillChips';

export const StudentApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentApplications();
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          My Applied Jobs & Recruitment Pipeline
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Track stage-by-stage interview progress, schedule dates, and round feedback.
        </p>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No applications submitted yet</h3>
          <p className="text-xs text-slate-500">Browse active corporate drives and apply based on your AI match score.</p>
          <Link
            to="/student/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs shadow-md"
          >
            <span>Explore Jobs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app, idx) => {
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6"
              >
                {/* Application Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <img
                      src={app.companyLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                      alt={app.companyName}
                      className="w-14 h-14 rounded-2xl object-cover bg-white p-1 border border-slate-200 shadow-xs shrink-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">
                        {app.companyName}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {app.jobRole}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{app.ctc}</span>
                        <span>&bull;</span>
                        <span>Applied on {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">AI Match Score:</span>
                      <span className="text-sm font-black font-mono text-violet-600 dark:text-violet-400">
                        {app.matchPercent}%
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                      app.status === 'Offer Accepted' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      app.status === 'Offer Released' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 animate-pulse' :
                      app.status === 'Selected' ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' :
                      app.status === 'Rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}>
                      Current Status: {app.status}
                    </span>
                  </div>
                </div>

                {/* Animated Status Stepper */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <StatusStepper
                    status={app.status}
                    rounds={app.rounds}
                    rejectionReason={app.rejectionReason}
                  />
                </div>

                {/* Offer Action Banner if Offer Released */}
                {app.status === 'Offer Released' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Award className="w-8 h-8 text-amber-300 shrink-0 animate-bounce" />
                      <div>
                        <h4 className="font-extrabold text-sm">Official Job Offer Released!</h4>
                        <p className="text-xs text-emerald-100">
                          {app.companyName} has offered compensation of {app.ctc}. View offer details to accept or decline.
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/student/offers"
                      className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 shadow-md shrink-0 transition"
                    >
                      View & Respond to Offer
                    </Link>
                  </div>
                )}

                {/* Round Results Timeline */}
                {app.roundResults && app.roundResults.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Evaluated Rounds Log
                    </span>
                    <div className="space-y-2">
                      {app.roundResults.map((r, rIdx) => (
                        <div
                          key={r.id || rIdx}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                                r.result === 'Pass' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                r.result === 'Fail' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                                'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                Round {r.round_index + 1}: {r.result === 'Pass' ? 'Selected' : 'Not Selected'}
                              </span>
                              <span>{app.rounds[r.round_index]?.name || `Round ${r.round_index + 1}`}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {new Date(r.evaluated_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
