import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import {
  Users, Award, TrendingUp, DollarSign, Building2,
  Sparkles, CheckCircle2, BarChart2, Layers
} from 'lucide-react';
import { api } from '../../services/api';

export const PlacementAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPlacementAnalytics()
      .then(data => setAnalytics(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const branchStats = analytics?.branchStats || [];
  const skillStats = analytics?.skillStats || [];
  const companyPipeline = analytics?.companyPipeline || [];

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Institutional Placement Intelligence & Conversion Rates</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Campus Placement Analytics & Institutional Metrics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Executive metrics on cohort placement rates, CTC distribution, branch performance, and skill-demand alignment.
        </p>
      </div>

      {/* Top 4 Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Cohort (4th Year)</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
            {summary.totalStudents || 0}
          </div>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold block">
            {summary.totalApplied || 0} Active in Drives
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Offers Made</span>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {summary.totalOffers || 0}
          </div>
          <span className="text-xs text-slate-500 block">
            {summary.acceptedOffers || 0} Formally Accepted
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Average CTC Package</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {summary.avgCtc || '0 LPA'}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">
            Highest: {summary.highestCtc || '0 LPA'}
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Placement Rate</span>
          <div className="text-3xl font-black text-teal-600 dark:text-teal-400 font-mono">
            {summary.placementRate || 0}%
          </div>
          <span className="text-xs text-teal-600 font-semibold block">
            {summary.acceptedOffers || 0} of {summary.totalStudents || 0} Placed
          </span>
        </div>
      </div>

      {/* Branch-wise Conversion Chart & Skill Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Branch Conversion Bar Chart */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Branch-Wise Placement Conversion Rate (%)
              </h3>
              <p className="text-xs text-slate-500">
                Percentage of registered students placed by engineering discipline.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchStats} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(val: any) => [`${val}%`, 'Placement Rate']}
                />
                <Bar dataKey="placementPercent" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill-wise Demand vs Conversion */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Skill Demand & Placements
              </h3>
              <p className="text-xs text-slate-500">
                Job openings vs placed candidate competencies.
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {skillStats.map((s: any) => (
              <div
                key={s.skill}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{s.skill}</span>
                  <span className="text-[10px] text-slate-500">{s.openings} industry openings</span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-emerald-600 block">{s.placed} Placed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Company Pipeline Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Corporate Recruitment Pipeline & Repeat Hiring
            </h3>
            <p className="text-xs text-slate-500">
              Campus partner performance, total roles, applicants, and accepted offers.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-500">
              <tr>
                <th className="p-3.5">Company Partner</th>
                <th className="p-3.5">Active Roles</th>
                <th className="p-3.5">Total Openings</th>
                <th className="p-3.5">Total Applicants</th>
                <th className="p-3.5">Offers Accepted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {companyPipeline.map((c: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-sans font-bold text-slate-900 dark:text-white">
                    {c.company_name}
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300">
                    {c.total_roles}
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300">
                    {c.total_openings}
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300">
                    {c.total_applicants}
                  </td>
                  <td className="p-3.5 font-bold text-emerald-600">
                    {c.hired_count} Hired
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Round-Wise Recruitment Funnel per Job & Company (Built from Full Records, Ignoring Archive) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Round-Wise Candidate Pipeline & Stage Funnels
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Complete applicant progression per job and company (Applied &rarr; Round Stages &rarr; Selected &rarr; Offer &rarr; Accepted). Full records retained.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {(analytics?.roundWiseFunnel || []).map((funnel: any) => (
            <div
              key={funnel.vacancyId}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {funnel.companyName} &mdash; {funnel.role}
                  </span>
                  <span className="text-xs text-slate-500 block font-mono">
                    Total Applicants: {funnel.applied}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold font-mono">
                    {funnel.accepted} Offers Accepted
                  </span>
                </div>
              </div>

              {/* Stage Funnel Stepper Blocks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">1. Applied</span>
                  <span className="font-bold text-slate-900 dark:text-white text-base">{funnel.applied}</span>
                </div>

                {funnel.rounds?.map((r: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[10px] text-indigo-500 uppercase block truncate" title={r.name}>
                      {idx + 2}. {r.name || `Round ${idx + 1}`}
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-base">{r.count}</span>
                  </div>
                ))}

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-teal-500 uppercase block">Selected</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400 text-base">{funnel.selected}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-purple-500 uppercase block">Offer Out</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 text-base">{funnel.offer}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-emerald-500 uppercase block">Accepted</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{funnel.accepted}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
