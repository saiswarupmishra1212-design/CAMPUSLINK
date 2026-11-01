import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, XCircle, Clock, Send, Globe, Mail, Plus } from 'lucide-react';
import { api } from '../../services/api';

export const PlacementCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await api.getPlacementCompanies();
      setCompanies(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleStatusChange = async (id: number, status: 'Approved' | 'Declined' | 'RequestSent') => {
    setActionLoading(id);
    try {
      await api.updateCompanyStatus(id, status);
      fetchCompanies();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Company Affiliation & Drive Approvals
          </h1>
          <p className="text-xs text-slate-500">
            Track corporate recruiter registration requests, approval status, and job postings.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((c) => {
            const isApproved = c.approval_status === 'Approved';
            const isDeclined = c.approval_status === 'Declined';
            const isPending = c.approval_status === 'RequestSent';

            return (
              <div
                key={c.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.logo}
                        alt={c.name}
                        className="w-12 h-12 rounded-2xl object-cover bg-white p-1 border border-slate-200 shrink-0"
                      />
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </h3>
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Globe className="w-3 h-3" />
                          <span>{c.website?.replace('https://', '')}</span>
                        </a>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isApproved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      isDeclined ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {c.approval_status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  <div className="text-xs text-slate-500 font-mono space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <div>HR Contact: <strong>{c.hr_contact || 'Campus Talent Team'}</strong></div>
                    <div>Account Email: <strong>{c.email}</strong></div>
                    <div className="pt-1 text-slate-700 dark:text-slate-300 font-bold flex justify-between">
                      <span>Total Vacancies: {c.total_vacancies || 0}</span>
                      <span>Total Applicants: {c.total_applicants || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(c.id, 'Approved')}
                    disabled={isApproved || actionLoading === c.id}
                    className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(c.id, 'RequestSent')}
                    disabled={isPending || actionLoading === c.id}
                    className={`px-3 py-2 rounded-xl font-semibold transition ${
                      isPending
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Set Pending
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(c.id, 'Declined')}
                    disabled={isDeclined || actionLoading === c.id}
                    className={`px-3 py-2 rounded-xl font-semibold transition ${
                      isDeclined
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60'
                        : 'bg-slate-100 dark:bg-slate-800 text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
