import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, PlusCircle, Users, Calendar, Clock,
  AlertCircle, CheckCircle2, Lock, ArrowRight, Eye
} from 'lucide-react';
import { api } from '../../services/api';
import { SkillChips } from '../../components/SkillChips';

export const RecruiterVacancies: React.FC = () => {
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      const data = await api.getRecruiterVacancies();
      setVacancies(data || []);
    } catch (err) {
      console.error('Failed to load vacancies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacancies();
  }, []);

  const handleCloseEarly = async (id: number) => {
    if (!window.confirm('Are you sure you want to close this vacancy early? Applications will close and applicants will be unlocked for review.')) {
      return;
    }
    setActionLoading(id);
    try {
      await api.closeVacancyEarly(id);
      fetchVacancies();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            2. My Job Vacancies
          </h1>
          <p className="text-xs text-slate-500">
            Monitor active vacancies, applicant counts, and close dates.
          </p>
        </div>

        <Link
          to="/recruiter/post-vacancy"
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Vacancy</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vacancies.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No vacancies posted yet</h3>
          <p className="text-xs text-slate-500">Create your first campus recruitment drive posting.</p>
          <Link
            to="/recruiter/post-vacancy"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Vacancy</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {vacancies.map((v) => {
            const isClosed = v.status === 'Closed';

            return (
              <div
                key={v.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-teal-400 transition"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                      {v.role}
                    </h3>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isClosed
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  {/* Criteria Info */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                    <span className="font-bold text-teal-600 dark:text-teal-400">{v.ctc}</span>
                    <span>&bull;</span>
                    <span>{v.openings} Openings</span>
                    <span>&bull;</span>
                    <span>Min CGPA: {v.min_cgpa}</span>
                    <span>&bull;</span>
                    <span>{v.backlog_rule === 'NotAllowed' ? 'Zero Backlogs' : `Backlogs &le; ${v.max_backlogs}`}</span>
                    <span>&bull;</span>
                    <span>Close Date: {v.close_date}</span>
                  </div>

                  {/* Required Skills */}
                  <div>
                    <SkillChips skills={v.requiredSkills || []} />
                  </div>
                </div>

                {/* Right Counts & Actions */}
                <div className="flex flex-col md:items-end gap-3 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900/60 text-teal-800 dark:text-teal-200 font-bold">
                      {v.applied_count || 0} Applied
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/60 text-purple-800 dark:text-purple-200 font-bold">
                      {v.selected_count || 0} Selected
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/recruiter/applications?vacancyId=${v.id}`}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Review Applicants</span>
                    </Link>

                    {!isClosed && (
                      <button
                        onClick={() => handleCloseEarly(v.id)}
                        disabled={actionLoading === v.id}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold transition"
                        title="Close vacancy early to unlock applications"
                      >
                        {actionLoading === v.id ? 'Closing...' : 'Close Early'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
