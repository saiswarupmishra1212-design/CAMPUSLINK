import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

interface MatchScoreRingProps {
  score: number; // 0 to 100
  readinessLevel: string;
  size?: number;
  strokeWidth?: number;
  showDetails?: boolean;
}

export const MatchScoreRing: React.FC<MatchScoreRingProps> = ({
  score,
  readinessLevel,
  size = 140,
  strokeWidth = 10,
  showDetails = true
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(score);
    if (end === 0) {
      setAnimatedScore(0);
      return;
    }
    const duration = 1000;
    const stepTime = duration / end;
    const timer = setInterval(() => {
      start += 1;
      setAnimatedScore(start);
      if (start >= end) clearInterval(timer);
    }, Math.max(stepTime, 10));

    return () => clearInterval(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  let strokeColor = '#ef4444'; // Red (Not Ready)
  let badgeBg = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800';
  let Icon = XCircle;

  if (score >= 80) {
    strokeColor = '#10b981'; // Emerald
    badgeBg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    Icon = Sparkles;
  } else if (score >= 60) {
    strokeColor = '#8b5cf6'; // Violet
    badgeBg = 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border-violet-300 dark:border-violet-800';
    Icon = CheckCircle2;
  } else if (score >= 40) {
    strokeColor = '#f59e0b'; // Amber
    badgeBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    Icon = AlertTriangle;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-800"
            fill="transparent"
          />
          {/* Progress Ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
            {animatedScore}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            AI Match
          </span>
        </div>
      </div>

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeBg}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{readinessLevel}</span>
        </motion.div>
      )}
    </div>
  );
};
