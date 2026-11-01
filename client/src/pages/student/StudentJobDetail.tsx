import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Building2, Globe, Mail, Phone, Calendar, Clock,
  CheckCircle2, AlertTriangle, AlertCircle, XCircle, Sparkles, FileText, Check,
  ShieldCheck, Lock, ArrowRight, User
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Vacancy } from '../../types';
import { MatchScoreRing } from '../../components/MatchScoreRing';
import { SkillChips } from '../../components/SkillChips';

export const StudentJobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);

  // Apply Modal & Form State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [typedRegNo, setTypedRegNo] = useState('');
  const [applicantPhone, setApplicantPhone] = useState(user?.profile?.phone || '+91 98765 43210');
  const [applicantEmail, setApplicantEmail] = useState(user?.email || '');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  const fetchJob = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getStudentJobDetail(parseInt(id, 10));
      setJob(data);
    } catch (err) {
      console.error('Failed to load job detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Job Not Found</h2>
        <Link to="/student/jobs" className="text-violet-600 font-bold hover:underline">
          &larr; Back to Job Listings
        </Link>
      </div>
    );
  }

  const matchScore = job.aiMatch?.matchPercent || 0;
  const minRequiredMatch = job.eligibility?.minMatchPercentRequired || 60;
  const isMatchSufficient = matchScore >= minRequiredMatch;

  // Backlog rule check
  const studentBacklogs = user?.backlogCount || 0;
  const isBacklogBlocked = (job.backlogRule === 'NotAllowed' && studentBacklogs > 0) ||
    (job.backlogRule === 'AllowedUpToN' && studentBacklogs > job.maxBacklogs);

  const isCgpaBlocked = (user?.cgpa || 0) < job.minCgpa;
  const isBranchBlocked = job.allowedBranches.length > 0 && !job.allowedBranches.includes(user?.branch || '');
  const isClosed = job.tag === 'Closed' || job.status === 'Closed';

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);

    // Strict Rule B verification: Typed Reg No must match authenticated placement master record
    if (!typedRegNo.trim() || typedRegNo.trim().toUpperCase() !== (user?.regNo || '').toUpperCase()) {
      setApplyError(`Registration Number mismatch. You typed '${typedRegNo}', which does not match your registered placement record '${user?.regNo}'.`);
      return;
    }

    if (!consentAccepted) {
      setApplyError('You must check the consent declaration checkbox to proceed.');
      return;
    }

    setApplying(true);
    try {
      await api.applyToJob({
        vacancyId: job.id,
        regNo: typedRegNo.trim().toUpperCase(),
        phone: applicantPhone,
        email: applicantEmail,
        consentAccepted: true
      });

      setApplySuccess(true);
      setTimeout(() => {
        setShowApplyModal(false);
        navigate('/student/applications');
      }, 2000);
    } catch (err: any) {
      setApplyError(err.message || 'Application submission failed.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          to="/student/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-violet-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Jobs</span>
        </Link>
      </div>

      {/* Main Job Hero Header */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={job.companyLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
              alt={job.companyName}
              className="w-16 h-16 rounded-2xl object-cover bg-white p-1 border border-slate-200 shadow-sm shrink-0"
            />
            <div>
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">
                {job.companyName}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {job.role}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                {job.companyWebsite && (
                  <a
                    href={job.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Company Website</span>
                  </a>
                )}
                <span>&bull;</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  Compensation: {job.ctc}
                </span>
                <span>&bull;</span>
                <span>Openings: {job.openings}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {job.tag}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Apply by: {job.closeDate}
            </span>
          </div>
        </div>

        {/* Company Description */}
        {job.companyDescription && (
          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 leading-relaxed">
            {job.companyDescription}
          </p>
        )}
      </div>

      {/* AI Readiness & Explainability Section */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-50/50 via-white to-indigo-50/30 dark:from-slate-900 dark:to-violet-950/20 border border-violet-200 dark:border-violet-900/60 p-6 sm:p-8 shadow-xl shadow-violet-500/5 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-violet-100 dark:border-violet-900/40">
          <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            AI Skill Match & Readiness Intelligence
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Match Score Ring */}
          <div className="md:col-span-4 flex justify-center py-2">
            <MatchScoreRing
              score={matchScore}
              readinessLevel={job.aiMatch?.readinessLevel || 'Developing'}
              size={150}
              strokeWidth={12}
            />
          </div>

          {/* Breakdown & Explanation */}
          <div className="md:col-span-8 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-2 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 block">
                Explainable AI Fit Analysis
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                {job.aiMatch?.explanation}
              </p>
            </div>

            {/* Matched vs Missing Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Matched Skills ({job.aiMatch?.matchedSkills.length}/{job.requiredSkills.length})
                </span>
                <SkillChips
                  skills={job.aiMatch?.matchedSkills || []}
                  matchedSkills={job.aiMatch?.matchedSkills}
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2">
                <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Skill Gap ({job.aiMatch?.missingSkills.length})
                </span>
                {job.aiMatch?.missingSkills.length ? (
                  <SkillChips
                    skills={job.aiMatch?.missingSkills || []}
                    missingSkills={job.aiMatch?.missingSkills}
                  />
                ) : (
                  <p className="text-[11px] text-emerald-600 font-semibold">Zero skill gaps detected!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Round Interview Schedule */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Interview Process & Rounds Schedule ({job.rounds.length} Rounds)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {job.rounds.map((round, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Round {idx + 1}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">{round.mode}</span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white truncate">{round.name}</h4>
              <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                <div>Date: {round.date} at {round.time}</div>
                <div>Venue: {round.venue}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STRICT 3-STEP APPLY RULES EVALUATION & ACTION BAR */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-violet-600" />
          Placement Cell Eligibility Verification
        </h2>

        {/* Evaluation Checklist */}
        <div className="space-y-3 text-xs">
          {/* Rule A: Skill Match >= 60% */}
          <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            isMatchSufficient
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-900 dark:text-rose-200'
          }`}>
            {isMatchSufficient ? <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />}
            <div>
              <span className="font-bold">Rule A (Skill Match Threshold): </span>
              {isMatchSufficient
                ? `Passed. Your match score (${matchScore}%) meets or exceeds the required ${minRequiredMatch}% threshold.`
                : `Blocked. Your match score is ${matchScore}%, which is below the mandatory ${minRequiredMatch}% minimum match rule. Check missing skills above to bridge the gap.`}
            </div>
          </div>

          {/* Rule B: Backlog Rule Check */}
          <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            !isBacklogBlocked
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-900 dark:text-rose-200'
          }`}>
            {!isBacklogBlocked ? <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />}
            <div>
              <span className="font-bold">Rule B (Corporate Backlog Policy): </span>
              {!isBacklogBlocked
                ? `Passed. Your backlog count (${studentBacklogs}) satisfies this company's policy (${job.backlogRule === 'NotAllowed' ? 'Zero Backlogs' : `Allowed up to ${job.maxBacklogs}`}).`
                : job.backlogRule === 'NotAllowed'
                ? `You have ${studentBacklogs} backlog(s). This job does not allow backlogs.`
                : `You have ${studentBacklogs} backlogs, exceeding the allowed limit of ${job.maxBacklogs}.`}
            </div>
          </div>

          {/* Rule C: CGPA & Branch */}
          <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            !isCgpaBlocked && !isBranchBlocked
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-900 dark:text-rose-200'
          }`}>
            {!isCgpaBlocked && !isBranchBlocked ? <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />}
            <div>
              <span className="font-bold">Rule C (Academic Cutoffs): </span>
              {!isCgpaBlocked && !isBranchBlocked
                ? `Passed. CGPA ${user?.cgpa} &ge; ${job.minCgpa}, Branch '${user?.branch}' is eligible.`
                : `Blocked by CGPA or Branch eligibility criteria.`}
            </div>
          </div>
        </div>

        {/* Action Button Section */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {job.hasApplied ? (
              <span className="font-bold text-emerald-600">You have already submitted an application for this vacancy.</span>
            ) : isClosed ? (
              <span className="font-bold text-rose-600">Recruitment drive is closed. Applications are no longer accepted.</span>
            ) : isMatchSufficient && !isBacklogBlocked && !isCgpaBlocked && !isBranchBlocked ? (
              <span className="text-slate-700 dark:text-slate-300">All placement criteria satisfied. You may submit your application.</span>
            ) : (
              <span className="text-rose-600 font-semibold">One or more mandatory eligibility rules are not met. Apply button is disabled.</span>
            )}
          </div>

          {job.hasApplied ? (
            <Link
              to="/student/applications"
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <span>Track Application Status</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              disabled={!isMatchSufficient || isBacklogBlocked || isCgpaBlocked || isBranchBlocked || isClosed}
              className="px-8 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xl shadow-violet-500/25 transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Apply for {job.role}</span>
            </button>
          )}
        </div>
      </div>

      {/* APPLY MODAL (Rule B & Form) */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowApplyModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 z-10 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Submit Job Application
                  </h3>
                  <p className="text-xs text-slate-500">{job.role} &bull; {job.companyName}</p>
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              </div>

              {applySuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Application Submitted!</h4>
                  <p className="text-xs text-slate-500">Redirecting to application timeline...</p>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
                  {applyError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-800 dark:text-rose-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{applyError}</span>
                    </div>
                  )}

                  {/* Auto-filled & Locked Fields */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Applicant Name (Locked)</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{user?.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Branch (Locked)</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{user?.branch}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">CGPA (Locked)</span>
                      <span className="font-bold text-emerald-600 font-mono block mt-0.5">{user?.cgpa}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">AI Match Score</span>
                      <span className="font-bold text-violet-600 font-mono block mt-0.5">{matchScore}%</span>
                    </div>
                  </div>

                  {/* Rule B: Identity Verification Input */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Verify Registration Number * (Type exact Reg No)
                    </label>
                    <input
                      type="text"
                      required
                      value={typedRegNo}
                      onChange={(e) => setTypedRegNo(e.target.value.toUpperCase())}
                      placeholder={`Type '${user?.regNo}' to confirm`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Must match authenticated master record ({user?.regNo}).
                    </p>
                  </div>

                  {/* Editable Email & Phone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
                      <input
                        type="email"
                        required
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Preselected CV */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-violet-600" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {user?.profile?.cv_file_name || `${user?.name || 'Resume'}.pdf`}
                      </span>
                    </div>
                    <Link to="/student/profile" className="text-[11px] text-violet-600 font-bold hover:underline">
                      Change CV
                    </Link>
                  </div>

                  {/* Consent Checkbox */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      className="mt-0.5 rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                      I confirm all uploaded academic, CV, and skill records are truthful. I understand this application will be ranked by corporate recruiters using AI match analytics.
                    </span>
                  </label>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={applying}
                      className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {applying ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Confirm & Submit</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
