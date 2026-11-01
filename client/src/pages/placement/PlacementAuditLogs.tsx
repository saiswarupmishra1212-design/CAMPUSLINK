import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, User, Clock, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export const PlacementAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs()
      .then(data => setLogs(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Backlog & Eligibility Audit Log
        </h1>
        <p className="text-xs text-slate-500">
          Immutable audit trail recording all administrative changes to student backlog counts and academic eligibility.
        </p>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No audit log entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Previous Value</th>
                  <th className="p-4">New Value</th>
                  <th className="p-4">Authorized By</th>
                  <th className="p-4">Justification / Reason</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-4 text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="p-4 font-sans">
                      <span className="font-bold text-slate-900 dark:text-white block">{log.student_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.reg_no} ({log.branch})</span>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 text-rose-600 font-semibold">
                      {log.previous_value}
                    </td>

                    <td className="p-4 text-emerald-600 font-semibold">
                      {log.new_value}
                    </td>

                    <td className="p-4 font-sans text-slate-700 dark:text-slate-300 font-medium">
                      {log.changed_by}
                    </td>

                    <td className="p-4 font-sans text-slate-600 dark:text-slate-400 max-w-xs truncate" title={log.reason}>
                      {log.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
