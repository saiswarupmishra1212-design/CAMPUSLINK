import React, { useEffect, useState } from 'react';
import { Eye, Building2, Briefcase, Users, Calendar, Award, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export const PlacementMonitoring: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPlacementMonitoring()
      .then(data => setMonitoringData(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Recruitment Drive Monitoring (View-Only)
        </h1>
        <p className="text-xs text-slate-500">
          Independent, cross-company surveillance of ongoing campus recruitment drives, round progression, and notifications.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {monitoringData.map((comp) => (
            <div
              key={comp.companyId}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4"
            >
              {/* Company Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={comp.companyLogo}
                    alt={comp.companyName}
                    className="w-10 h-10 rounded-xl object-cover p-0.5 bg-white border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {comp.companyName}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {comp.jobs.length} Active Vacancies
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {comp.approvalStatus}
                </span>
              </div>

              {/* Jobs List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {comp.jobs.map((j: any) => (
                  <div
                    key={j.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {j.role}
                        </h4>
                        <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {j.ctc} &bull; {j.openings} Openings
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[10px] font-bold">
                        {j.totalApplied} Applied
                      </span>
                    </div>

                    {/* Rounds Schedule Summary */}
                    <div className="space-y-1 text-[11px] text-slate-500 font-mono">
                      {j.rounds.map((r: any, rIdx: number) => (
                        <div key={rIdx} className="flex justify-between">
                          <span>{r.name}:</span>
                          <span className="text-slate-700 dark:text-slate-300">{r.date} ({r.mode})</span>
                        </div>
                      ))}
                    </div>

                    {/* Offers Pipeline */}
                    {j.offers && j.offers.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>{j.offers.length} Placement Offer(s) Released</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
