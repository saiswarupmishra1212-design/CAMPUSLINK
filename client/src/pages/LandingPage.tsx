import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, BrainCircuit, Users, Building2, ShieldCheck, ArrowRight,
  CheckCircle2, Zap, BarChart3, Clock, AlertTriangle, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user, role } = useAuth();

  const portalCards = [
    {
      role: 'Student Portal',
      description: 'Profile auto-verification, offline AI CV skill extraction, explainable readiness match score, real-time clash warning, and offer tracking.',
      icon: Users,
      color: 'from-violet-500 to-indigo-600',
      badge: 'Violet Theme',
      badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
      to: '/auth?role=student'
    },
    {
      role: 'Recruiter Portal',
      description: 'Multi-round vacancy posting with master skill tags, date-locked applicant review, round evaluation grader, and offer letter release.',
      icon: Building2,
      color: 'from-teal-500 to-emerald-600',
      badge: 'Teal Theme',
      badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
      to: '/auth?role=recruiter'
    },
    {
      role: 'Placement Cell Admin',
      description: 'Student master data management, backlog change audit logging, company invite gating, clash center, and mentor-assigned at-risk analytics.',
      icon: ShieldCheck,
      color: 'from-slate-700 to-slate-900',
      badge: 'Slate Theme',
      badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
      to: '/auth?role=placement'
    }
  ];

  const highlights = [
    {
      title: 'Offline Explainable AI Matching',
      desc: 'Tokenized NLP skill extraction with synonyms dictionary. Computes exact skill match %, readiness levels, and human-readable advice.',
      icon: BrainCircuit
    },
    {
      title: 'Drive Clash & Double-Booking Guard',
      desc: 'Proactively detects when candidates are scheduled for two interview rounds simultaneously or same venue is double-booked.',
      icon: AlertTriangle
    },
    {
      title: 'End-to-End Recruitment Lifecycle',
      desc: 'Profiling -> Matching -> Round Scheduling -> Notifications & Simulated Emails -> One-Offer Rule -> Placement Analytics.',
      icon: Zap
    },
    {
      title: 'AI Benchmark & Confusion Matrix',
      desc: 'Live evaluation page evaluating predicted vs ground-truth candidate fit with Precision, Recall, F1, and Confusion Matrix.',
      icon: BarChart3
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
            <span>AI-Powered Campus-to-Corporate Placement Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]"
          >
            Bridge Campus Talent with{' '}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
              Explainable AI Intelligence
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto"
          >
            An enterprise-grade campus placement ecosystem orchestrating master validation, offline resume parsing, round-by-round candidate pipelines, clash detection, and institutional analytics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Link
              to={user ? (role === 'student' ? '/student' : role === 'recruiter' ? '/recruiter' : '/placement') : '/auth'}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 flex items-center gap-2 group transition"
            >
              <span>{user ? 'Enter Platform Dashboard' : 'Launch Demo Portal'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/ai-evaluation"
              className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm flex items-center gap-2 transition"
            >
              <BrainCircuit className="w-4 h-4 text-indigo-500" />
              <span>Inspect AI Benchmark</span>
            </Link>
          </motion.div>
        </div>

        {/* 3 Main Role Portals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {portalCards.map((p, idx) => (
            <motion.div
              key={p.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="rounded-3xl p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${p.color} flex items-center justify-center text-white shadow-md`}>
                    {React.createElement(p.icon, { className: 'w-6 h-6' })}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {p.role}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="pt-6">
                <Link
                  to={p.to}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between transition group-hover:shadow-md"
                >
                  <span>Open {p.role}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key Features Grid */}
        <div className="rounded-3xl bg-slate-100/70 dark:bg-slate-900/60 p-8 sm:p-10 border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Platform Architecture Highlights
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Designed with strict role-based isolation, offline AI explainability, and multi-tenant scaling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((h, i) => (
              <div
                key={h.title}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-xs"
              >
                <div className="p-2 w-fit rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {React.createElement(h.icon, { className: 'w-5 h-5' })}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {h.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        CAMPUSLINK Platform &bull; Built for Hackathon Demo &bull; 100% Offline AI Matching Engine
      </footer>
    </div>
  );
};
