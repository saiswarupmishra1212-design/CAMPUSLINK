import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, CheckCircle2, Clock, Send, FileText, Plus,
  AlertCircle, Building2, Sparkles, BellRing
} from 'lucide-react';
import { api } from '../../services/api';

export const RecruiterOffers: React.FC = () => {
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Release Offer Modal State
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [offerCtc, setOfferCtc] = useState('');
  const [joiningDate, setJoiningDate] = useState('2026-07-15');
  const [releasing, setReleasing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      const data = await api.getRecruiterVacancies();
      setVacancies(data || []);
      if (data && data.length > 0) setSelectedVacancyId(data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacancies();
  }, []);

  const loadCandidates = async () => {
    if (!selectedVacancyId) return;
    try {
      setLoading(true);
      const data = await api.getVacancyApplications(selectedVacancyId);
      const apps = data.applicants || [];
      // Show candidates who are Selected or have Offers
      const eligible = apps.filter((a: any) =>
        a.status === 'Selected' || a.status.startsWith('Offer')
      );
      setCandidates(eligible);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [selectedVacancyId]);

  const openReleaseModal = (app: any) => {
    setSelectedApp(app);
    const currentVac = vacancies.find(v => v.id === selectedVacancyId);
    setOfferCtc(currentVac?.ctc || '14.0 LPA');
    setShowReleaseModal(true);
  };

  const handleReleaseOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setReleasing(true);
    try {
      await api.releaseOffer({
        applicationId: selectedApp.id,
        ctc: offerCtc,
        joiningDate,
        documents: [`Offer_Letter_${selectedApp.name.replace(/\s+/g, '_')}.pdf`, 'Company_Terms_2026.pdf']
      });

      setToastMsg(`Offer successfully released to ${selectedApp.name}!`);
      setTimeout(() => setToastMsg(null), 4000);
      setShowReleaseModal(false);
      loadCandidates();
    } catch (err: any) {
      alert(err.message || 'Failed to release offer');
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            6. Offers & Final Selections
          </h1>
          <p className="text-xs text-slate-500">
            Release official offer letters to candidates who cleared final rounds and track acceptance.
          </p>
        </div>

        <select
          value={selectedVacancyId || ''}
          onChange={(e) => setSelectedVacancyId(parseInt(e.target.value, 10))}
          className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
        >
          {vacancies.map(v => (
            <option key={v.id} value={v.id}>{v.role}</option>
          ))}
        </select>
      </div>

      {toastMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </motion.div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Award className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No candidates selected yet</h3>
          <p className="text-xs text-slate-500">
            Candidates who clear the final interview round in &ldquo;Rounds & Results&rdquo; will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((cand) => {
            const isSelected = cand.status === 'Selected';
            const isReleased = cand.status === 'Offer Released';
            const isAccepted = cand.status === 'Offer Accepted';
            const isDeclined = cand.status === 'Offer Declined';
            const isDeferred = cand.status === 'Offer Deferred';

            return (
              <div
                key={cand.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={cand.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cand.name)}`}
                        alt={cand.name}
                        className="w-12 h-12 rounded-2xl object-cover bg-slate-100 shrink-0"
                      />
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {cand.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                          {cand.regNo} &bull; {cand.branch}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isAccepted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      isReleased ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 animate-pulse' :
                      isDeclined ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      isDeferred ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                    }`}>
                      {cand.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">CGPA</span>
                      <span className="font-bold text-emerald-600">{cand.cgpa}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">AI Match</span>
                      <span className="font-bold text-teal-600">{cand.matchPercent}%</span>
                    </div>
                  </div>

                  {/* Follow-up reminder for pending offers */}
                  {isReleased && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-200">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Awaiting Student Response</span>
                      </div>
                      <button
                        onClick={() => alert(`Follow-up reminder dispatched to ${cand.email}`)}
                        className="font-bold underline hover:text-amber-950"
                      >
                        Send Follow-up
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  {isSelected ? (
                    <button
                      onClick={() => openReleaseModal(cand)}
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Release Official Offer Letter</span>
                    </button>
                  ) : (
                    <div className="text-xs text-center text-slate-500 font-semibold py-1">
                      Offer Status: <strong>{cand.status}</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Release Offer Modal */}
      <AnimatePresence>
        {showReleaseModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowReleaseModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Release Job Offer
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedApp.name} ({selectedApp.regNo})
                  </p>
                </div>
              </div>

              <form onSubmit={handleReleaseOffer} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Offered Compensation (CTC)</label>
                  <input
                    type="text"
                    required
                    value={offerCtc}
                    onChange={(e) => setOfferCtc(e.target.value)}
                    placeholder="e.g. 14.5 LPA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Joining Date</label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  📄 Includes: <code>Offer_Letter_{selectedApp.name.replace(/\s+/g, '_')}.pdf</code> & corporate agreement documents.
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReleaseModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={releasing}
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md flex items-center justify-center gap-1.5"
                  >
                    {releasing ? 'Releasing...' : 'Release Offer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
