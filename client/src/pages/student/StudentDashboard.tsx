import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, CheckCircle2, Clock, Award, ArrowRight, Sparkles,
  TrendingUp, FileText, AlertTriangle, Layers, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MatchScoreRing } from '../../components/MatchScoreRing';
import { Vacancy, Application } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any | null>(null);
  const [jobs, setJobs] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [pRes, jRes, aRes] = await Promise.all([
        api.getStudentProfile(),
        api.getStudentJobs(),
        api.getStudentApplications()
      ]);
      setProfileData(pRes);
      setJobs(jRes || []);
      setApplications(aRes || []);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalOffers = applications.filter(a => a.status.startsWith('Offer')).length;
  const activeDrives = applications.filter(a => a.status.startsWith('Round') || a.status === 'Applied').length;
  const topMatchJob = [...jobs].sort((a, b) => (b.aiMatch?.matchPercent || 0) - (a.aiMatch?.matchPercent || 0))[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-violet-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Campus Placement Portal 2026-27</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-violet-100 text-xs sm:text-sm max-w-xl leading-relaxed font-mono">
            {user?.regNo} &bull; {user?.branch} &bull; CGPA: {user?.cgpa} &bull; {user?.backlogCount === 0 ? '0 Active Backlogs' : `${user?.backlogCount} Active Backlog(s)`}
          </p>
        </div>

        {/* Profile Completeness Pill */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[220px] text-xs space-y-2">
          <div className="flex justify-between font-semibold">
            <span>Profile Completeness</span>
            <span className="font-mono">{profileData?.completeness || 60}%</span>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-300 h-full rounded-full transition-all duration-1000"
              style={{ width: `${profileData?.completeness || 60}%` }}
            />
          </div>
          <Link
            to="/student/profile"
            className="text-[11px] text-amber-300 font-bold hover:underline flex items-center gap-1 pt-1"
          >
            <span>Update CV & Skills</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Eligible Jobs</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {jobs.filter(j => j.eligibility?.isEligible).length}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Applications</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {applications.length}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interview Rounds</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {activeDrives}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Placement Offers</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {totalOffers}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Top AI Match Spotlight & Recommended Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top AI Match Spotlight or Upload CV Prompt */}
        {topMatchJob && (topMatchJob.aiMatch?.matchPercent || 0) >= 40 ? (
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900/60 shadow-xl shadow-violet-500/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                  Top AI Match Recommendation
                </span>
                <span className="text-xs font-semibold text-slate-500 font-mono">{topMatchJob.ctc}</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {topMatchJob.role}
                </h3>
                <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold">
                  {topMatchJob.companyName}
                </p>
              </div>

              <div className="py-2 flex justify-center">
                <MatchScoreRing
                  score={topMatchJob.aiMatch?.matchPercent || 0}
                  readinessLevel={topMatchJob.aiMatch?.readinessLevel || 'Developing'}
                  size={130}
                />
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                {topMatchJob.aiMatch?.explanation}
              </p>
            </div>

            <Link
              to={`/student/jobs/${topMatchJob.id}`}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-violet-500/25 transition"
            >
              <span>View Job & Apply</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 flex flex-col justify-between text-center items-center">
            <div className="space-y-3 my-auto py-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Upload your CV to get personalised job matches
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Our offline explainable AI engine extracts technical skills, matches open vacancies, and ranks readiness scores.
              </p>
            </div>

            <Link
              to="/student/profile"
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-violet-500/25 transition"
            >
              <FileText className="w-4 h-4" />
              <span>Go to CV & Profile</span>
            </Link>
          </div>
        )}

        {/* Right: Available Recruitment Drives */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Active Corporate Drives
              </h2>
              <p className="text-xs text-slate-500">
                Opportunities approved by the Placement Cell.
              </p>
            </div>
            <Link
              to="/student/jobs"
              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              <span>View All ({jobs.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {jobs.slice(0, 4).map(job => (
              <div
                key={job.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={job.companyLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                    alt={job.companyName}
                    className="w-10 h-10 rounded-xl object-cover bg-white p-0.5 border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {job.role}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {job.companyName} &bull; <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{job.ctc}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono block">
                      {job.aiMatch?.matchPercent}%
                    </span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                      job.aiMatch?.readinessLevel === 'Highly Employable' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      job.aiMatch?.readinessLevel === 'Ready' ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {job.aiMatch?.readinessLevel}
                    </span>
                  </div>

                  <Link
                    to={`/student/jobs/${job.id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 transition"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
