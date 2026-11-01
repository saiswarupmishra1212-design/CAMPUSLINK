import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, X, Send, Inbox, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { SimulatedEmail } from '../types';

interface EmailOutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailOutboxModal: React.FC<EmailOutboxModalProps> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getEmailOutbox()
        .then(data => {
          setEmails(data || []);
          if (data && data.length > 0) setSelectedEmail(data[0]);
        })
        .catch(err => console.error('Failed to fetch simulated email outbox:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                Simulated Corporate Email Dispatcher
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                  Live Dispatch Simulation
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Inspect simulated official interview invites, offer letters, and campus broadcasts delivered to inboxes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Email List */}
          <div className="w-2/5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : emails.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                No simulated emails sent yet.
              </div>
            ) : (
              emails.map(e => (
                <div
                  key={e.id}
                  onClick={() => setSelectedEmail(e)}
                  className={`p-3.5 transition cursor-pointer ${
                    selectedEmail?.id === e.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                      {e.recipient_email}
                    </span>
                    <span>{new Date(e.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {e.subject}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {e.body_text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Right Email Preview */}
          <div className="w-3/5 p-6 overflow-y-auto bg-white dark:bg-slate-900 flex flex-col">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">From:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmail.sender}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">To:</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">{selectedEmail.recipient_email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="text-slate-600 dark:text-slate-400">{new Date(selectedEmail.sent_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedEmail.subject}
                  </h2>
                  <div className="mt-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                    {selectedEmail.body_text}
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-slate-500 text-[11px]">
                      CAMPUSLINK Automated Campus Placement Messaging Service &bull; NIET Placement Cell
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Inbox className="w-8 h-8 mb-2 stroke-1" />
                Select an email to view full content
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
