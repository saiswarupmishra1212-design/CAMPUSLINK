import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Mail, Phone, BookOpen, Award, FileText, CheckCircle2, AlertCircle, Briefcase } from 'lucide-react';
import { api } from '../services/api';
import { SkillChips } from './SkillChips';

interface CandidateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number | null;
  jobRequiredSkills?: string[];
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  isOpen,
  onClose,
  studentId,
  jobRequiredSkills = []
}) => {
  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      setLoading(true);
      api.getCandidateProfile(studentId)
        .then(data => setCandidate(data))
        .catch(err => console.error('Failed to load candidate:', err))
        .finally(() => setLoading(false));
    } else {
      setCandidate(null);
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const matchedSkills = (candidate?.confirmedSkills || []).filter((s: string) =>
    jobRequiredSkills.some(req => req.toLowerCase() === s.toLowerCase())
  );
  const missingSkills = jobRequiredSkills.filter(req =>
    !(candidate?.confirmedSkills || []).some((s: string) => s.toLowerCase() === req.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl z-10 flex flex-col border-l border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Candidate Profile
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {candidate?.name || 'Loading...'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : candidate ? (
              <>
                {/* Profile Overview Card */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <img
                    src={candidate.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(candidate.name)}`}
                    alt={candidate.name}
                    className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                      {candidate.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {candidate.regNo} &bull; {candidate.branch} ({candidate.year}th Year)
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        CGPA: {candidate.cgpa}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                        candidate.backlogCount === 0
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        Backlogs: {candidate.backlogCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Links */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                  {candidate.phone && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.linkedin && (
                    <a
                      href={candidate.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition"
                    >
                      <span className="font-medium">LinkedIn Profile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {candidate.github && (
                    <a
                      href={candidate.github}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-between text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition"
                    >
                      <span className="font-medium">GitHub Repository</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Skill Match Breakdown for this Vacancy */}
                {jobRequiredSkills.length > 0 && (
                  <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      AI Job-Skill Match Breakdown
                    </h4>
                    <div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">
                        Matched Skills ({matchedSkills.length}/{jobRequiredSkills.length})
                      </span>
                      <SkillChips skills={matchedSkills} matchedSkills={matchedSkills} />
                    </div>
                    {missingSkills.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5 block">
                          Missing Required Skills ({missingSkills.length})
                        </span>
                        <SkillChips skills={missingSkills} missingSkills={missingSkills} />
                      </div>
                    )}
                  </div>
                )}

                {/* All Confirmed Skills */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    All Verified Technical Skills
                  </h4>
                  <SkillChips skills={candidate.confirmedSkills || []} />
                </div>

                {/* Projects */}
                {candidate.projects && candidate.projects.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      Projects Portfolio
                    </h4>
                    <ul className="space-y-1.5">
                      {candidate.projects.map((p: string, idx: number) => (
                        <li key={idx} className="text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Certifications */}
                {candidate.certifications && candidate.certifications.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-500" />
                      Certifications
                    </h4>
                    <ul className="space-y-1.5">
                      {candidate.certifications.map((c: string, idx: number) => (
                        <li key={idx} className="text-xs p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Internships & Experience */}
                {candidate.internships && candidate.internships.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      Internships & Experience
                    </h4>
                    <ul className="space-y-1.5">
                      {candidate.internships.map((item: string, idx: number) => (
                        <li key={idx} className="text-xs p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-900/60">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CV Summary & View/Download */}
                {candidate.cvText && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        CV Content ({candidate.cvFileName || 'Resume.pdf'})
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([candidate.cvText], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = candidate.cvFileName || `${candidate.name}_Resume.txt`;
                          a.click();
                        }}
                        className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                      >
                        <span>Download CV Text</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 leading-relaxed">
                      {candidate.cvText}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-500 text-sm text-center py-10">Candidate details could not be retrieved.</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              Close Drawer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
