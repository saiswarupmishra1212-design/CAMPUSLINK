import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Award, CheckCircle2, XCircle, Clock, FileText, Download,
  Building2, Sparkles, AlertCircle, ArrowRight, ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';

export const StudentOffers: React.FC = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [modalOffer, setModalOffer] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<'Accept' | 'Decline' | 'Defer' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentOffers();
      setOffers(data || []);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleRespond = async (offerId: number, action: 'Accept' | 'Decline' | 'Defer') => {
    setActionLoading(offerId);
    try {
      const res = await api.respondToOffer(offerId, action);
      if (action === 'Accept') {
        triggerConfetti();
        setToastMessage('🎉 Congratulations! You have accepted the job offer. Other pending offers have been closed per Placement Policy.');
      } else if (action === 'Decline') {
        setToastMessage('Offer declined successfully.');
      } else {
        setToastMessage('Offer deferred for review.');
      }
      setModalOffer(null);
      setConfirmAction(null);
      fetchOffers();
    } catch (err: any) {
      setToastMessage(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-indigo-500/50 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">&times;</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Campus Placement Offers & Letters
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Official recruitment offers released by corporate partners. Placement Cell policy applies.
        </p>
      </div>

      {/* Policy Reminder Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Placement Cell One-Offer Rule: </span>
          When you accept a job offer, your candidacy will be finalized and any other pending applications or released offers will be automatically closed to give fair opportunities to peers.
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Award className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No offers released yet</h3>
          <p className="text-xs text-slate-500">
            Offers will appear here once you successfully clear all interview rounds with a recruiter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map(offer => {
            const isAccepted = offer.status === 'Accepted';
            const isReleased = offer.status === 'Released';
            const isDeclined = offer.status === 'Declined';
            const isDeferred = offer.status === 'Deferred';

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-3xl p-6 sm:p-7 border shadow-xl flex flex-col justify-between space-y-6 transition ${
                  isAccepted
                    ? 'bg-gradient-to-br from-emerald-50 to-white dark:from-slate-900 dark:to-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-emerald-500/10'
                    : isReleased
                    ? 'bg-gradient-to-br from-violet-50/70 to-white dark:from-slate-900 dark:to-violet-950/20 border-violet-300 dark:border-violet-800 shadow-violet-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Offer Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={offer.company_logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                        alt={offer.company_name}
                        className="w-12 h-12 rounded-2xl object-cover bg-white p-1 border border-slate-200 shadow-xs shrink-0"
                      />
                      <div>
                        <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">
                          {offer.company_name}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {offer.job_role}
                        </h3>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      isAccepted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      isReleased ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 animate-pulse' :
                      isDeclined ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {offer.status}
                    </span>
                  </div>

                  {/* Compensation & Joining Date */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Offered CTC</span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                        {offer.ctc}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Expected Joining</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono block mt-1">
                        {offer.joining_date}
                      </span>
                    </div>
                  </div>

                  {/* Documents & Offer Letters */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Enclosed Documents
                    </span>
                    <div className="space-y-1.5">
                      {offer.documents?.map((doc: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-violet-600 shrink-0" />
                            <span className="truncate font-medium">{doc}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => alert(`Simulated Download for ${doc}`)}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  {isReleased ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setModalOffer(offer);
                          setConfirmAction('Accept');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Offer</span>
                      </button>

                      <button
                        onClick={() => {
                          setModalOffer(offer);
                          setConfirmAction('Defer');
                        }}
                        className="px-3 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-xs transition"
                      >
                        Defer
                      </button>

                      <button
                        onClick={() => {
                          setModalOffer(offer);
                          setConfirmAction('Decline');
                        }}
                        className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs transition"
                      >
                        Decline
                      </button>
                    </div>
                  ) : isAccepted ? (
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Offer Formally Accepted</span>
                    </div>
                  ) : isDeclined ? (
                    <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 text-xs font-bold text-center">
                      Offer Declined
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-xs font-bold text-center">
                      Offer Deferred for Review
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {modalOffer && confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setModalOffer(null)} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Confirm: {confirmAction} Job Offer
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to <strong>{confirmAction.toLowerCase()}</strong> the offer of{' '}
                <strong>{modalOffer.ctc}</strong> for the <strong>{modalOffer.job_role}</strong> role at{' '}
                <strong>{modalOffer.company_name}</strong>?
              </p>

              {confirmAction === 'Accept' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200">
                  ⚠️ Note: Accepting this offer will auto-close all other pending placement applications under the Placement Cell One-Offer policy.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOffer(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRespond(modalOffer.id, confirmAction)}
                  disabled={actionLoading !== null}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md ${
                    confirmAction === 'Accept' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    confirmAction === 'Decline' ? 'bg-rose-600 hover:bg-rose-700' :
                    'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {actionLoading ? 'Processing...' : `Yes, ${confirmAction}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
