import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Clock, Calendar, Building2,
  Sparkles, ArrowRight, ShieldCheck, MapPin, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { ClashItem } from '../../types';

export const PlacementClashes: React.FC = () => {
  const [clashes, setClashes] = useState<ClashItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClashes = async () => {
    try {
      setLoading(true);
      const data = await api.getPlacementClashes();
      setClashes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClashes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-semibold mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Proactive Conflict Engine Active</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Schedule Clash & Venue Double-Booking Center
          </h1>
          <p className="text-xs text-slate-500">
            Real-time heuristic conflict detection across candidate interview timelines and physical campus venues.
          </p>
        </div>

        <button
          onClick={fetchClashes}
          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Scan Clashes</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clashes.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No scheduling clashes detected</h3>
          <p className="text-xs text-slate-500">
            All active student interviews and physical placement halls have zero overlaps.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {clashes.map((clash, idx) => {
            const isStudentClash = clash.type === 'STUDENT_SCHEDULE_CLASH';

            return (
              <motion.div
                key={clash.id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-200 dark:border-rose-900/60 shadow-xl shadow-rose-500/5 space-y-5"
              >
                {/* Clash Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-rose-100 dark:border-rose-900/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          {clash.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wider">
                          {clash.severity}
                        </span>
                      </div>
                      <p className="text-xs text-rose-700 dark:text-rose-300 font-medium mt-1 leading-relaxed">
                        {clash.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conflicting Drives Timeline Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Drive 1 */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                      Drive 1 Conflict Slot
                    </span>
                    <div className="font-bold text-slate-900 dark:text-white font-sans text-sm">
                      {clash.drive1.company} &bull; {clash.drive1.role}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-xs">
                      Round: <strong>{clash.drive1.round}</strong>
                    </div>
                    <div className="text-rose-600 font-bold">
                      Date & Time: {clash.drive1.date} at {clash.drive1.time || '10:00 AM'}
                    </div>
                    {clash.drive1.venue && (
                      <div className="text-slate-500">
                        Venue: {clash.drive1.venue}
                      </div>
                    )}
                  </div>

                  {/* Drive 2 */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                      Drive 2 Conflict Slot
                    </span>
                    <div className="font-bold text-slate-900 dark:text-white font-sans text-sm">
                      {clash.drive2.company} &bull; {clash.drive2.role}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-xs">
                      Round: <strong>{clash.drive2.round}</strong>
                    </div>
                    <div className="text-rose-600 font-bold">
                      Date & Time: {clash.drive2.date || clash.drive1.date} at {clash.drive2.time || clash.drive1.time || '10:00 AM'}
                    </div>
                    {clash.drive2.venue && (
                      <div className="text-slate-500">
                        Venue: {clash.drive2.venue}
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggested AI Resolution */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3 text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">Suggested Placement Cell Resolution:</span>
                    <p className="text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed font-medium">
                      {clash.resolution}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
