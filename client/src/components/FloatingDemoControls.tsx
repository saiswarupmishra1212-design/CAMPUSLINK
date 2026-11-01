import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, ChevronDown, ChevronUp, FastForward, CheckCircle,
  RotateCcw, Sparkles, UserCheck, Building2, ShieldCheck, Play, Calendar,
  Clock, Briefcase, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface FloatingDemoControlsProps {
  onRefresh?: () => void;
}

export const FloatingDemoControls: React.FC<FloatingDemoControlsProps> = ({ onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [demoJobs, setDemoJobs] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const { loginStudent, loginRecruiter, loginPlacement } = useAuth();

  const loadJobs = async () => {
    try {
      const jobs = await api.getDemoClockJobs();
      setDemoJobs(jobs || []);
      if (jobs && jobs.length > 0) {
        if (!selectedCompanyId) {
          setSelectedCompanyId(jobs[0].companyId);
          setSelectedJobId(jobs[0].id);
        } else if (!selectedJobId) {
          const matching = jobs.find((j: any) => j.companyId === selectedCompanyId);
          if (matching) setSelectedJobId(matching.id);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      loadJobs();
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAction = async (actionName: string, fn: () => Promise<any>) => {
    try {
      setLoadingAction(actionName);
      const res = await fn();
      showToast(res.message || 'Action executed successfully!');
      await loadJobs();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Action failed');
    } finally {
      setLoadingAction(null);
    }
  };

  // Group unique companies
  const companies = Array.from(
    new Map(demoJobs.map(j => [j.companyId, { id: j.companyId, name: j.companyName }])).values()
  );

  const companyJobs = demoJobs.filter(j => j.companyId === selectedCompanyId);
  const selectedJob = demoJobs.find(j => j.id === selectedJobId) || companyJobs[0];

  const handleCompanyChange = (cId: number) => {
    setSelectedCompanyId(cId);
    const firstJob = demoJobs.find(j => j.companyId === cId);
    if (firstJob) {
      setSelectedJobId(firstJob.id);
    } else {
      setSelectedJobId('');
    }
  };

  const quickLogin = async (type: 'priya' | 'vikram' | 'aarav' | 'apex' | 'cloud' | 'admin') => {
    try {
      setLoadingAction(`login_${type}`);
      if (type === 'priya') {
        await loginStudent('2023CSE042', 'priya.sharma@college.edu', 'password123');
        showToast('Logged in as Priya Sharma (CSE - Top Candidate)');
      } else if (type === 'vikram') {
        await loginStudent('2023MECH071', 'vikram.singh@college.edu', 'password123');
        showToast('Logged in as Vikram Singh (MECH - 3 Backlogs Demo)');
      } else if (type === 'aarav') {
        await loginStudent('2023CSE011', 'aarav.patel@college.edu', 'password123');
        showToast('Logged in as Aarav Patel (CSE - Clash Demo)');
      } else if (type === 'apex') {
        await loginRecruiter('careers@apexinnovations.com', 'recruiter123', 1);
        showToast('Logged in as Apex Innovations Recruiter');
      } else if (type === 'cloud') {
        await loginRecruiter('hiring@cloudscale.io', 'recruiter123', 2);
        showToast('Logged in as CloudScale Systems Recruiter');
      } else if (type === 'admin') {
        await loginPlacement('admin123');
        showToast('Logged in as Placement Cell Admin');
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Quick login failed');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 max-w-sm p-4 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-indigo-500/50 backdrop-blur-md flex items-center gap-3 text-xs"
          >
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-spin" />
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Widget */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="mb-3 w-84 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              {/* Header */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-bold tracking-wide uppercase">Hackathon Demo Controls</span>
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                  Per-Job Demo Clock
                </span>
              </div>

              {/* Action Buttons & Per-Job Clock */}
              <div className="p-4 space-y-3.5 max-h-[65vh] overflow-y-auto">
                {/* Per-Job Clock Controls */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Per-Job Virtual Clock
                    </span>
                    <button
                      onClick={loadJobs}
                      title="Refresh job clocks"
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Pick Company then Job */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Company
                      </label>
                      <select
                        value={selectedCompanyId}
                        onChange={(e) => handleCompanyChange(Number(e.target.value))}
                        className="w-full text-xs p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Job Role
                      </label>
                      <select
                        value={selectedJob ? selectedJob.id : selectedJobId}
                        onChange={(e) => setSelectedJobId(Number(e.target.value))}
                        className="w-full text-xs p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {companyJobs.map(j => (
                          <option key={j.id} value={j.id}>{j.role}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Virtual Date Banner */}
                  {selectedJob && (
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-indigo-500 dark:text-indigo-300 font-medium">Virtual date:</div>
                        <div className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">
                          {selectedJob.virtualDate || 'System Date'}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${selectedJob.isVirtual ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {selectedJob.isVirtual ? 'Virtual' : 'System'}
                      </span>
                    </div>
                  )}

                  {/* 5 Clock Control Buttons */}
                  {selectedJob && (
                    <div className="grid grid-cols-2 gap-1.5 text-xs pt-1">
                      <button
                        onClick={() => handleAction('add_day', () => api.advanceJobDay(selectedJob.id, 1))}
                        disabled={loadingAction !== null}
                        className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-center transition disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <FastForward className="w-3.5 h-3.5" />
                        <span>+1 day</span>
                      </button>

                      <button
                        onClick={() => handleAction('jump_close', () => api.jumpJobClose(selectedJob.id))}
                        disabled={loadingAction !== null}
                        className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-center transition disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Jump to close date</span>
                      </button>

                      <button
                        onClick={() => handleAction('jump_exam', () => api.jumpJobExam(selectedJob.id, 0))}
                        disabled={loadingAction !== null}
                        className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-center transition disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Jump to exam day</span>
                      </button>

                      <button
                        onClick={() => handleAction('jump_day_after_exam', () => api.jumpJobDayAfterExam(selectedJob.id, 0))}
                        disabled={loadingAction !== null}
                        className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-center transition disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Jump to day after exam</span>
                      </button>

                      <button
                        onClick={() => handleAction('reset_job', () => api.resetJobClock(selectedJob.id))}
                        disabled={loadingAction !== null}
                        className="col-span-2 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-medium text-center transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Reset this job</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Global DB Reset */}
                <div>
                  <button
                    onClick={() => handleAction('reset_db', api.resetDemoData)}
                    disabled={loadingAction !== null}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-between text-xs font-medium transition disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset all demo data (Seed)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Pristine State</span>
                  </button>
                </div>

                {/* 1-Click Persona Switcher */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                    1-Click Persona Switcher
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      onClick={() => quickLogin('priya')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-950 text-slate-800 dark:text-slate-200 text-left transition flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-violet-600" />
                      <span className="truncate">Priya (Offer)</span>
                    </button>
                    <button
                      onClick={() => quickLogin('aarav')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-950 text-slate-800 dark:text-slate-200 text-left transition flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-violet-600" />
                      <span className="truncate">Aarav (Clash)</span>
                    </button>
                    <button
                      onClick={() => quickLogin('vikram')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-800 dark:text-slate-200 text-left transition flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-rose-600" />
                      <span className="truncate">Vikram (Backlog)</span>
                    </button>
                    <button
                      onClick={() => quickLogin('apex')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-950 text-slate-800 dark:text-slate-200 text-left transition flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      <span className="truncate">Apex (Recruiter)</span>
                    </button>
                    <button
                      onClick={() => quickLogin('cloud')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-950 text-slate-800 dark:text-slate-200 text-left transition flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      <span className="truncate">CloudScale</span>
                    </button>
                    <button
                      onClick={() => quickLogin('admin')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-left transition flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                      <span className="truncate">Placement Admin</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white font-bold text-xs shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
        >
          <Wand2 className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>Demo Controls</span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
};
