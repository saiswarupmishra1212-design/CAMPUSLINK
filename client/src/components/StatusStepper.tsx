import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, AlertCircle, Award, CheckCircle } from 'lucide-react';
import { Round } from '../types';

interface StatusStepperProps {
  status: string; // 'Applied', 'Shortlisted', 'Round 1', 'Round 2', 'Selected', 'Offer Released', 'Offer Accepted', 'Rejected'
  rounds?: Round[];
  rejectionReason?: string;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({
  status,
  rounds = [],
  rejectionReason
}) => {
  // Build dynamic step list based on vacancy rounds
  const steps: { key: string; label: string; date?: string }[] = [{ key: 'Applied', label: 'Applied' }];

  if (rounds && rounds.length > 0) {
    rounds.forEach((r, idx) => {
      steps.push({
        key: `Round ${idx + 1}`,
        label: r.date ? `Round ${idx + 1} (${r.date})` : `Round ${idx + 1}`,
        date: r.date
      });
    });
  } else {
    steps.push({ key: 'Round 1', label: 'Round 1' });
    steps.push({ key: 'Round 2', label: 'Round 2' });
  }

  steps.push({ key: 'Selected', label: 'Selected' });
  steps.push({ key: 'Offer Released', label: 'Offer Released' });

  // Terminal Offer step
  let offerStepLabel = 'Accepted';
  if (status === 'Offer Declined' || status === 'Declined') {
    offerStepLabel = 'Declined';
  } else if (status === 'Offer Deferred' || status === 'Deferred') {
    offerStepLabel = 'Deferred';
  }
  steps.push({ key: 'Offer Decision', label: offerStepLabel });

  // Determine active index
  const isRejected = status === 'Rejected' || status.startsWith('Not selected');
  let currentIndex = 0;

  if (status === 'Applied') currentIndex = 0;
  else if (status === 'Shortlisted') currentIndex = 0;
  else if (status.startsWith('Round')) {
    const rNum = parseInt(status.replace('Round', '').trim(), 10) || 1;
    currentIndex = rNum;
  } else if (status === 'Selected') {
    currentIndex = steps.findIndex(s => s.key === 'Selected');
  } else if (status === 'Offer Released') {
    currentIndex = steps.findIndex(s => s.key === 'Offer Released');
  } else if (status.startsWith('Offer ') || status === 'Accepted' || status === 'Declined' || status === 'Deferred') {
    currentIndex = steps.findIndex(s => s.key === 'Offer Decision');
  }

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Progress Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full z-0" />

        {/* Progress Fill Line */}
        <motion.div
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full z-0 ${
            isRejected ? 'bg-rose-500' : 'bg-gradient-to-r from-violet-600 to-emerald-500'
          }`}
          initial={{ width: 0 }}
          animate={{
            width: `${Math.min(100, Math.max(0, (currentIndex / (steps.length - 1)) * 100))}%`
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Steps */}
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex || (status === 'Offer Accepted' && idx === currentIndex);
          const isCurrent = idx === currentIndex && !isRejected;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                  boxShadow: isCurrent ? '0 0 15px rgba(139, 92, 246, 0.5)' : 'none'
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-violet-600 border-violet-600 text-white ring-4 ring-violet-200 dark:ring-violet-900/60 animate-pulse'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </motion.div>

              <span
                className={`mt-2 text-[11px] font-medium text-center max-w-[80px] truncate leading-tight ${
                  isCurrent
                    ? 'text-violet-600 dark:text-violet-400 font-bold'
                    : isCompleted
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-600'
                }`}
                title={step.label}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {isRejected && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">
              {status.startsWith('Not selected') ? status : 'Not selected for the next round'}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
