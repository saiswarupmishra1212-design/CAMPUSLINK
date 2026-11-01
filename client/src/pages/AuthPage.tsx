import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Building2, ShieldCheck, Mail, Lock, KeyRound,
  CheckCircle2, Sparkles, AlertCircle, ArrowRight, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserRole } from '../types';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as UserRole) || 'student';

  const [activeTab, setActiveTab] = useState<UserRole>(initialRole);
  const [isStudentRegister, setIsStudentRegister] = useState(false);

  // Student Form State
  const [studentEmail, setStudentEmail] = useState('');
  const [studentRegNo, setStudentRegNo] = useState('');
  const [studentPassword, setStudentPassword] = useState('password123');

  // Recruiter Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(1);
  const [recruiterEmail, setRecruiterEmail] = useState('careers@apexinnovations.com');
  const [recruiterPassword, setRecruiterPassword] = useState('recruiter123');
  const [companies, setCompanies] = useState<any[]>([]);

  // Placement Cell Form State
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Helpers & Demo State
  const [demoAccounts, setDemoAccounts] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { loginStudent, registerStudent, loginRecruiter, loginPlacement } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getDemoAccounts()
      .then(data => {
        setDemoAccounts(data);
        if (data.companies) {
          setCompanies(data.companies);
          if (data.companies.length > 0) {
            setSelectedCompanyId(data.companies[0].id);
            setRecruiterEmail(data.companies[0].email);
          }
        }
      })
      .catch(err => console.error('Failed to load demo accounts:', err));
  }, []);

  const handleCompanySelect = (comp: any) => {
    setSelectedCompanyId(comp.id);
    setRecruiterEmail(comp.email);
    setErrorMessage(null);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      if (isStudentRegister) {
        await registerStudent(studentRegNo, studentEmail, studentPassword);
      } else {
        await loginStudent(studentRegNo, studentEmail, studentPassword);
      }
      navigate('/student');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRecruiterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      await loginRecruiter(recruiterEmail, recruiterPassword, selectedCompanyId);
      navigate('/recruiter');
    } catch (err: any) {
      setErrorMessage(err.message || 'Recruiter login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePlacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      await loginPlacement(adminPassword);
      navigate('/placement');
    } catch (err: any) {
      setErrorMessage(err.message || 'Placement login failed');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemoStudent = (s: any) => {
    setStudentRegNo(s.reg_no);
    setStudentEmail(s.email);
    setStudentPassword('password123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Main Auth Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
          {/* Role Tabs */}
          <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-6">
            <button
              onClick={() => { setActiveTab('student'); setErrorMessage(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>

            <button
              onClick={() => { setActiveTab('recruiter'); setErrorMessage(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'recruiter'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Recruiter</span>
            </button>

            <button
              onClick={() => { setActiveTab('placement'); setErrorMessage(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'placement'
                  ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Placement Cell</span>
            </button>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 1: STUDENT AUTH */}
          {activeTab === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isStudentRegister ? 'Student Registration' : 'Student Sign In'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Registration Number is verified against the Placement Cell Master List.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsStudentRegister(!isStudentRegister); setErrorMessage(null); }}
                  className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  {isStudentRegister ? 'Have an account? Sign In' : 'New student? Register'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Registration Number (Reg No) *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={studentRegNo}
                    onChange={(e) => setStudentRegNo(e.target.value.toUpperCase())}
                    placeholder="e.g. 2023CSE042"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  College Gmail Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="e.g. priya.sharma@college.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-lg shadow-violet-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isStudentRegister ? 'Complete Master Registration' : 'Sign In as Student'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: RECRUITER AUTH (5 Company Cards) */}
          {activeTab === 'recruiter' && (
            <form onSubmit={handleRecruiterSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Corporate Recruiter Portal
                </h2>
                <p className="text-xs text-slate-500">
                  Select your company card below, then authenticate with your HR account.
                </p>
              </div>

              {/* 5 Company Cards */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select Registered Company
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {companies.map((comp) => {
                    const isSelected = selectedCompanyId === comp.id;
                    return (
                      <div
                        key={comp.id}
                        onClick={() => handleCompanySelect(comp)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 ring-2 ring-teal-400/30'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-teal-300'
                        }`}
                      >
                        <img
                          src={comp.logo}
                          alt={comp.name}
                          className="w-9 h-9 rounded-xl object-cover bg-white p-0.5 border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {comp.name}
                          </h4>
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono truncate block">
                            {comp.email}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Recruiter Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={recruiterEmail}
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={recruiterPassword}
                    onChange={(e) => setRecruiterPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Company Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: PLACEMENT CELL ADMIN AUTH */}
          {activeTab === 'placement' && (
            <form onSubmit={handlePlacementSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Placement Cell Administrator
                </h2>
                <p className="text-xs text-slate-500">
                  Institutional access for Student Master records, company management, and drive analytics.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value="admin@campuslink.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="admin123"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-slate-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Placement Administration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right / Demo Accounts Helper Widget */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Demo Accounts Helper</h3>
              <p className="text-[11px] text-slate-500">1-click autofill for instant evaluation</p>
            </div>
          </div>

          {/* Student Presets */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Demo Students
            </span>
            <div className="space-y-1.5">
              {demoAccounts?.students?.map((s: any) => (
                <div
                  key={s.reg_no}
                  onClick={() => {
                    setActiveTab('student');
                    autofillDemoStudent(s);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 transition cursor-pointer text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {s.name}
                      <span className="text-[10px] font-mono text-slate-500">({s.reg_no})</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      CGPA: {s.cgpa} &bull; Backlogs: {s.backlog_count} &bull; {s.branch}
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    s.backlog_count > 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                    s.tag.includes('Offer') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}>
                    {s.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiter Presets */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Demo Recruiters
            </span>
            <div className="space-y-1.5">
              {demoAccounts?.companies?.slice(0, 3).map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveTab('recruiter');
                    handleCompanySelect(c);
                  }}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition cursor-pointer text-xs flex items-center gap-2.5"
                >
                  <img src={c.logo} alt={c.name} className="w-6 h-6 rounded-lg object-cover" />
                  <div className="truncate">
                    <span className="font-semibold text-slate-900 dark:text-white block truncate">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{c.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Preset */}
          <div className="pt-2">
            <div
              onClick={() => {
                setActiveTab('placement');
                setAdminPassword('admin123');
              }}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span className="font-bold text-slate-900 dark:text-white">Placement Admin</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">admin@campuslink.edu</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
