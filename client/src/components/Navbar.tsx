import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Mail, Sun, Moon, LogOut, Sparkles, Building2, User,
  ShieldCheck, BrainCircuit, CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationModal } from './NotificationModal';
import { EmailOutboxModal } from './EmailOutboxModal';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  let roleColor = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
  let roleBorder = 'border-slate-300 dark:border-slate-700';
  let roleIcon = ShieldCheck;
  let roleTitle = 'Placement Cell';

  if (role === 'student') {
    roleColor = 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300';
    roleBorder = 'border-violet-300 dark:border-violet-800';
    roleIcon = User;
    roleTitle = 'Student Portal';
  } else if (role === 'recruiter') {
    roleColor = 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300';
    roleBorder = 'border-teal-300 dark:border-teal-800';
    roleIcon = Building2;
    roleTitle = 'Recruiter Portal';
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-4">
            <Link to={user ? (role === 'student' ? '/student' : role === 'recruiter' ? '/recruiter' : '/placement') : '/'} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  CAMPUSLINK
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                    AI 2.0
                  </span>
                </span>
                <span className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 -mt-1 font-medium">
                  Campus-to-Corporate Placement Platform
                </span>
              </div>
            </Link>

            {/* Role Badge */}
            {user && (
              <div className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleColor} ${roleBorder}`}>
                {React.createElement(roleIcon, { className: 'w-3.5 h-3.5' })}
                <span>{roleTitle}</span>
              </div>
            )}
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {user && role === 'student' && (
              <>
                <Link
                  to="/student"
                  className={`px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                    location.pathname === '/student' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/student/jobs"
                  className={`px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                    location.pathname.startsWith('/student/jobs') ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : ''
                  }`}
                >
                  My Jobs
                </Link>
                <Link
                  to="/student/applications"
                  className={`px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                    location.pathname === '/student/applications' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : ''
                  }`}
                >
                  Applied Jobs
                </Link>
                <Link
                  to="/student/offers"
                  className={`px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                    location.pathname === '/student/offers' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : ''
                  }`}
                >
                  Offers
                </Link>
                <Link
                  to="/student/profile"
                  className={`px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                    location.pathname === '/student/profile' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : ''
                  }`}
                >
                  CV & Profile
                </Link>
              </>
            )}

            {/* AI Benchmark Link */}
            <Link
              to="/ai-evaluation"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition font-bold ${
                location.pathname === '/ai-evaluation' ? 'bg-indigo-100 dark:bg-indigo-950' : ''
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>AI Evaluation Benchmark</span>
            </Link>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Email Outbox Button */}
            {user && (
              <button
                onClick={() => setIsEmailOpen(true)}
                title="View Simulated Email Outbox"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              >
                <Mail className="w-5 h-5" />
              </button>
            )}

            {/* Notifications Bell */}
            {user && (
              <button
                onClick={() => {
                  setIsNotifOpen(true);
                  setUnreadCount(0);
                }}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle Light / Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* User Profile / Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[120px]">
                    {user.regNo || user.email}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onOpenEmailOutbox={() => setIsEmailOpen(true)}
      />

      <EmailOutboxModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
      />
    </>
  );
};
