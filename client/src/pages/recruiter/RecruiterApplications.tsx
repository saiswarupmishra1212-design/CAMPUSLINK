import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Lock, Unlock, Download, Search, Filter,
  CheckCircle2, XCircle, AlertTriangle, Eye, ShieldCheck,
  Building2, Sparkles, UserCheck, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { CandidateDrawer } from '../../components/CandidateDrawer';

export const RecruiterApplications: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVacancyId = searchParams.get('vacancyId');

  const [vacancies, setVacancies] = useState<any[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(
    initialVacancyId ? parseInt(initialVacancyId, 10) : null
  );
  const [applicationsData, setApplicationsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected applicants for batch actions
  const [selectedAppIds, setSelectedAppIds] = useState<number[]>([]);
  const [actionReason, setActionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Drawer state
  const [drawerStudentId, setDrawerStudentId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [minMatch, setMinMatch] = useState<number>(0);
  const [minCgpa, setMinCgpa] = useState<number>(0);

  // Load Vacancies list
  useEffect(() => {
    api.getRecruiterVacancies()
      .then(data => {
        setVacancies(data || []);
        if (data && data.length > 0 && !selectedVacancyId) {
          setSelectedVacancyId(data[0].id);
        }
      })
      .catch(err => console.error('Failed to load vacancies:', err));
  }, []);

  // Load applications for selected vacancy
  const loadApplications = async (vId: number) => {
    try {
      setLoading(true);
      const data = await api.getVacancyApplications(vId);
      setApplicationsData(data);
      setSelectedAppIds([]);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVacancyId) {
      loadApplications(selectedVacancyId);
      setSearchParams({ vacancyId: selectedVacancyId.toString() });
    }
  }, [selectedVacancyId]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, filteredList: any[]) => {
    if (e.target.checked) {
      setSelectedAppIds(filteredList.map(a => a.id));
    } else {
      setSelectedAppIds([]);
    }
  };

  const toggleSelectApp = (id: number) => {
    if (selectedAppIds.includes(id)) {
      setSelectedAppIds(selectedAppIds.filter(item => item !== id));
    } else {
      setSelectedAppIds([...selectedAppIds, id]);
    }
  };

  const handleBatchShortlist = async () => {
    if (selectedAppIds.length === 0) return;
    setActionLoading(true);
    try {
      await api.submitRoundResults({
        vacancyId: selectedVacancyId,
        roundIndex: 0,
        evaluatedCandidates: selectedAppIds.map(appId => ({
          applicationId: appId,
          result: 'Pass',
          feedback: 'Shortlisted for Round 1 technical evaluation.'
        }))
      });
      if (selectedVacancyId) loadApplications(selectedVacancyId);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedAppIds.length === 0) return;
    setActionLoading(true);
    try {
      await api.submitRoundResults({
        vacancyId: selectedVacancyId,
        roundIndex: 0,
        evaluatedCandidates: selectedAppIds.map(appId => ({
          applicationId: appId,
          result: 'Fail',
          rejectionReason: actionReason || 'Did not meet initial recruiter screening benchmarks.'
        }))
      });
      setShowRejectModal(false);
      setActionReason('');
      if (selectedVacancyId) loadApplications(selectedVacancyId);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!applicationsData || !applicationsData.applicants) return;
    const header = ['Rank', 'Name', 'RegNo', 'Branch', 'Year', 'CGPA', 'Backlogs', 'MatchPercent', 'Readiness', 'Status', 'Email'];
    const rows = applicationsData.applicants.map((a: any) => [
      a.rank,
      `"${a.name}"`,
      a.regNo,
      a.branch,
      a.year,
      a.cgpa,
      a.backlogCount,
      `${a.matchPercent}%`,
      `"${a.readinessLevel}"`,
      `"${a.status}"`,
      a.email
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${applicationsData.vacancy.role}_Applicants_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openStudentDrawer = (studentId: number) => {
    setDrawerStudentId(studentId);
    setIsDrawerOpen(true);
  };

  // Filtered applicants
  const allApplicants = applicationsData?.applicants || [];
  const filteredApplicants = allApplicants.filter((a: any) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = a.name.toLowerCase().includes(q) || a.regNo.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedBranch !== 'ALL' && a.branch !== selectedBranch) return false;
    if (selectedStatus !== 'ALL' && a.status !== selectedStatus) return false;
    if (minMatch > 0 && a.matchPercent < minMatch) return false;
    if (minCgpa > 0 && a.cgpa < minCgpa) return false;
    return true;
  });

  const isLocked = applicationsData?.isLocked;

  return (
    <div className="space-y-6">
      {/* Header & Vacancy Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            4. Applications & Candidate Review
          </h1>
          <p className="text-xs text-slate-500">
            Ranked applicant evaluations with AI match scores and verified credentials.
          </p>
        </div>

        {/* Vacancy Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Select Vacancy:</span>
          <select
            value={selectedVacancyId || ''}
            onChange={(e) => setSelectedVacancyId(parseInt(e.target.value, 10))}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold outline-none"
          >
            {vacancies.map(v => (
              <option key={v.id} value={v.id}>{v.role} ({v.status})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isLocked ? (
        /* LOCKED STATE (Before Close Date) */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center max-w-2xl mx-auto space-y-4"
        >
          <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Applications In Progress (Drive Active)
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {applicationsData?.message}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              To guarantee fairness for all student applicants, candidate profiles and AI rankings unlock immediately after the application close date ({applicationsData?.vacancy?.closeDate}).
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Applied So Far</span>
              <span className="text-xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
                {applicationsData?.appliedCount || 0} Students
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400">
            💡 Tip: In hackathon demo, use the floating <strong>Demo Controls &rarr; "Advance date to after close date"</strong> to unlock immediately!
          </div>
        </motion.div>
      ) : (
        /* UNLOCKED STATE (After Close Date) */
        <div className="space-y-6">
          {/* Vacancy Top Overview Banner */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 font-mono">
                  {applicationsData?.collegeName || 'National Institute of Engineering & Technology'}
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {applicationsData?.vacancy?.role} &bull; Ranked Candidate Registry
                </h2>
              </div>

              <button
                onClick={handleDownloadCsv}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>Export Candidates (CSV)</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-500">
              <span>Total Applicants: <strong className="text-slate-900 dark:text-white">{applicationsData?.totalApplicants}</strong></span>
              <span>&bull;</span>
              <span>Closed Date: <strong className="text-slate-900 dark:text-white">{applicationsData?.closedDate}</strong></span>
              <span>&bull;</span>
              <span>Rounds: <strong className="text-slate-900 dark:text-white">{applicationsData?.vacancy?.rounds?.length || 0}</strong></span>
            </div>
          </div>

          {/* Filter & Action Toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4 text-xs">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidate name, reg no, or email..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
              />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
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

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Round 1">Round 1</option>
                <option value="Round 2">Round 2</option>
                <option value="Selected">Selected</option>
                <option value="Offer Released">Offer Released</option>
                <option value="Offer Accepted">Offer Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={minMatch}
                onChange={(e) => setMinMatch(parseInt(e.target.value, 10))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none font-mono"
              >
                <option value={0}>Min Match: Any</option>
                <option value={60}>Match &ge; 60%</option>
                <option value={80}>Match &ge; 80%</option>
              </select>
            </div>
          </div>

          {/* Batch Actions Bar (when candidates are checked) */}
          {selectedAppIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 flex items-center justify-between text-xs"
            >
              <span className="font-bold text-teal-900 dark:text-teal-200">
                {selectedAppIds.length} candidate(s) selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchShortlist}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Shortlist Selected</span>
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Selected</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Ranked Candidates Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedAppIds.length > 0 && selectedAppIds.length === filteredApplicants.length}
                        onChange={(e) => handleSelectAll(e, filteredApplicants)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                    </th>
                    <th className="p-4">Rank</th>
                    <th className="p-4">Candidate Name & Reg No</th>
                    <th className="p-4">Branch</th>
                    <th className="p-4">CGPA</th>
                    <th className="p-4">Backlogs</th>
                    <th className="p-4">AI Match Score</th>
                    <th className="p-4">Readiness Level</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        No applicants match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredApplicants.map((app: any) => {
                      const isSelected = selectedAppIds.includes(app.id);

                      return (
                        <tr
                          key={app.id}
                          className={`transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                            isSelected ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                          }`}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectApp(app.id)}
                              className="rounded text-teal-600 focus:ring-teal-500"
                            />
                          </td>

                          <td className="p-4 font-mono font-bold text-slate-400">
                            #{app.rank}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={app.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(app.name)}`}
                                alt={app.name}
                                className="w-8 h-8 rounded-xl object-cover bg-slate-100 shrink-0"
                              />
                              <div>
                                <span
                                  onClick={() => openStudentDrawer(app.studentId)}
                                  className="font-bold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer block"
                                >
                                  {app.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {app.regNo} &bull; {app.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                            {app.branch}
                          </td>

                          <td className="p-4 font-mono font-bold text-emerald-600">
                            {app.cgpa}
                          </td>

                          <td className="p-4">
                            <span className={`font-mono font-semibold ${
                              app.backlogCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'
                            }`}>
                              {app.backlogCount}
                            </span>
                          </td>

                          <td className="p-4 font-mono font-extrabold text-teal-600 dark:text-teal-400 text-sm">
                            {app.matchPercent}%
                          </td>

                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              app.readinessLevel === 'Highly Employable' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              app.readinessLevel === 'Ready' ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300' :
                              app.readinessLevel === 'Developing' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {app.readinessLevel}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {app.status}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => openStudentDrawer(app.studentId)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Profile Drawer */}
      <CandidateDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        studentId={drawerStudentId}
        jobRequiredSkills={applicationsData?.vacancy?.requiredSkills || []}
      />

      {/* Batch Reject Reason Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowRejectModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 z-10 space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reject {selectedAppIds.length} Candidate(s)
              </h3>
              <p className="text-xs text-slate-500">
                Please provide rejection feedback for student notification logs.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rejection Reason / Feedback</label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Core skill gap in backend distributed systems."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBatchReject}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
