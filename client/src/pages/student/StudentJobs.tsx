import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Filter, Briefcase, Calendar, Clock, CheckCircle2,
  AlertTriangle, ArrowRight, Sparkles, Building2, Check, X
} from 'lucide-react';
import { api } from '../../services/api';
import { Vacancy } from '../../types';
import { MatchScoreRing } from '../../components/MatchScoreRing';
import { SkillChips } from '../../components/SkillChips';

export const StudentJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Vacancy[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [minMatchFilter, setMinMatchFilter] = useState<number>(0);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentJobs();
      setJobs(data || []);
      setFilteredJobs(data || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    let result = [...jobs];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(j =>
        j.role.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.requiredSkills.some(s => s.toLowerCase().includes(q))
      );
    }

    if (selectedBranch !== 'ALL') {
      result = result.filter(j => j.allowedBranches.length === 0 || j.allowedBranches.includes(selectedBranch));
    }

    if (selectedTag !== 'ALL') {
      result = result.filter(j => j.tag === selectedTag);
    }

    if (minMatchFilter > 0) {
      result = result.filter(j => (j.aiMatch?.matchPercent || 0) >= minMatchFilter);
    }

    setFilteredJobs(result);
  }, [searchTerm, selectedBranch, selectedTag, minMatchFilter, jobs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>AI Job Readiness Scoring Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Campus Placement Opportunities
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Approved company drives with personalized skill matching and gap analysis.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-center gap-4 text-xs">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by role, company, or required skill (e.g. React, Python)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <span className="text-slate-500 font-semibold shrink-0">Branch:</span>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
          </select>
        </div>

        {/* Tag Filter */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <span className="text-slate-500 font-semibold shrink-0">Status:</span>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Closing soon">Closing Soon (&le;3 days)</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Min Match % Filter */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <span className="text-slate-500 font-semibold shrink-0">Min AI Match:</span>
          <select
            value={minMatchFilter}
            onChange={(e) => setMinMatchFilter(parseInt(e.target.value, 10))}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none font-mono"
          >
            <option value={0}>All Scores (0%+)</option>
            <option value={60}>Eligible (&ge;60%)</option>
            <option value={80}>Highly Employable (&ge;80%)</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 mt-3 font-semibold">Calculating AI match analytics...</span>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No matching jobs found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search query or reset filter settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job, idx) => {
            const matchScore = job.aiMatch?.matchPercent || 0;
            const readiness = job.aiMatch?.readinessLevel || 'Developing';
            const isEligible = job.eligibility?.isEligible;

            let tagStyle = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            if (job.tag === 'Closing soon') {
              tagStyle = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse';
            } else if (job.tag === 'Closed') {
              tagStyle = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
            } else if (job.tag === 'Active') {
              tagStyle = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
            }

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 flex flex-col justify-between transition group space-y-5"
              >
                {/* Card Top */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={job.companyLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                        alt={job.companyName}
                        className="w-12 h-12 rounded-2xl object-cover bg-white p-1 border border-slate-200 shrink-0 shadow-xs"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 truncate block">
                          {job.companyName}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                          {job.role}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${tagStyle}`}>
                        {job.tag}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        {job.ctc}
                      </span>
                    </div>
                  </div>

                  {/* AI Match Overview */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          AI Readiness Fit
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {job.aiMatch?.explanation}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <MatchScoreRing
                        score={matchScore}
                        readinessLevel={readiness}
                        size={64}
                        strokeWidth={6}
                        showDetails={false}
                      />
                    </div>
                  </div>

                  {/* Required Skills Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Required Skills
                    </span>
                    <SkillChips
                      skills={job.requiredSkills}
                      matchedSkills={job.aiMatch?.matchedSkills}
                      missingSkills={job.aiMatch?.missingSkills}
                    />
                  </div>

                  {/* Criteria info */}
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 font-mono pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      Min CGPA: {job.minCgpa}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      {job.backlogRule === 'NotAllowed' ? 'Zero Backlogs' : `Backlogs &le; ${job.maxBacklogs}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      {job.openings} Openings
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      Closes: {job.closeDate}
                    </span>
                  </div>
                </div>

                {/* Card Bottom / Action */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    {job.hasApplied ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Applied ({job.applicationStatus})</span>
                      </span>
                    ) : isEligible ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Eligible to Apply</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Criteria Gap Detected</span>
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/student/jobs/${job.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-violet-600 dark:bg-slate-800 dark:hover:bg-violet-600 text-white text-xs font-bold transition flex items-center gap-1.5 group-hover:shadow-md"
                  >
                    <span>View & Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
