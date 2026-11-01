import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, AreaChart, Area
} from 'recharts';
import {
  Users, Briefcase, Award, TrendingUp, CheckCircle2,
  Clock, AlertCircle, ArrowRight, Building2, Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

export const RecruiterDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRecruiterDashboard()
      .then(data => setDashboardData(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {};
  const funnel = dashboardData?.funnel || [];
  const pendingActions = dashboardData?.pendingActions || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Live Recruitment Pipeline Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          7. Corporate Hiring Analytics & Funnel
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Conversion funnel analytics from candidate applications to offer acceptances.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Applied</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {metrics.totalApplied || 0}
          </div>
          <span className="text-[11px] text-teal-600 font-semibold mt-1 block">
            Across {metrics.totalVacancies || 0} Vacancies
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Target Openings</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {metrics.totalOpenings || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
            Engineering Roles
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Offers Released</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">
            {metrics.offerReleased || 0}
          </div>
          <span className="text-[11px] text-purple-600 font-semibold mt-1 block">
            Selected Finalists
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Offers Accepted</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {metrics.offerAccepted || 0}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {metrics.conversionRate || 0}% Conversion Rate
          </span>
        </div>
      </div>

      {/* Recruitment Funnel Chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recruitment Conversion Funnel
            </h3>
            <p className="text-xs text-slate-500">
              Applied &rarr; Shortlisted &rarr; Round 1 &rarr; Round 2 &rarr; Selected &rarr; Offer Accepted
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-teal-600">
            Stage Yield Metrics
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="step" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {funnel.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || '#0d9488'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Recruiter Actions */}
      {pendingActions.length > 0 && (
        <div className="p-6 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Recommended Recruiter Next Steps
          </h3>
          <div className="space-y-2">
            {pendingActions.map((action: any) => (
              <div
                key={action.id}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{action.title}</span>
                  <span className="text-slate-500">{action.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
