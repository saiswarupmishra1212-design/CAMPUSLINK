import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Plus, Sparkles, AlertCircle, Search } from 'lucide-react';
import { api } from '../services/api';

interface SkillChipsProps {
  skills: string[];
  matchedSkills?: string[];
  missingSkills?: string[];
  isEditable?: boolean;
  onAddSkill?: (skill: string) => void;
  onRemoveSkill?: (skill: string) => void;
}

export const SkillChips: React.FC<SkillChipsProps> = ({
  skills = [],
  matchedSkills = [],
  missingSkills = [],
  isEditable = false,
  onAddSkill,
  onRemoveSkill
}) => {
  const [newSkillInput, setNewSkillInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [masterSkills, setMasterSkills] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditable) {
      api.getMasterSkills()
        .then(data => setMasterSkills(data || []))
        .catch(() => {
          // Fallback master skills
          setMasterSkills([
            { name: 'Python', synonyms: ['python', 'py', 'py3', 'python3'] },
            { name: 'Java', synonyms: ['java', 'core java', 'spring'] },
            { name: 'C++', synonyms: ['c++', 'cpp', 'c/c++'] },
            { name: 'JavaScript', synonyms: ['javascript', 'js', 'es6'] },
            { name: 'TypeScript', synonyms: ['typescript', 'ts'] },
            { name: 'React', synonyms: ['react', 'reactjs', 'nextjs'] },
            { name: 'Node.js', synonyms: ['node', 'nodejs', 'express'] },
            { name: 'HTML/CSS', synonyms: ['html', 'css', 'tailwind'] },
            { name: 'SQL', synonyms: ['sql', 'postgres', 'mysql'] },
            { name: 'MongoDB', synonyms: ['mongodb', 'mongo'] },
            { name: 'AWS', synonyms: ['aws', 'cloud', 's3', 'ec2'] },
            { name: 'Docker', synonyms: ['docker', 'containers'] },
            { name: 'Kubernetes', synonyms: ['kubernetes', 'k8s'] },
            { name: 'CI/CD', synonyms: ['ci/cd', 'github actions', 'jenkins'] },
            { name: 'Git', synonyms: ['git', 'github'] },
            { name: 'REST API', synonyms: ['rest api', 'restful'] },
            { name: 'Machine Learning', synonyms: ['machine learning', 'ml'] },
            { name: 'Deep Learning', synonyms: ['deep learning', 'dl'] },
            { name: 'PyTorch', synonyms: ['pytorch', 'torch'] },
            { name: 'TensorFlow', synonyms: ['tensorflow', 'tf'] },
            { name: 'Data Analysis', synonyms: ['data analysis', 'pandas'] },
            { name: 'Data Engineering', synonyms: ['data engineering', 'spark'] },
            { name: 'Power BI', synonyms: ['power bi', 'powerbi'] },
            { name: 'Tableau', synonyms: ['tableau'] },
            { name: 'UI/UX Design', synonyms: ['ui/ux', 'figma'] },
            { name: 'Cyber Security', synonyms: ['cybersecurity'] },
            { name: 'Testing / QA', synonyms: ['testing', 'qa', 'jest'] },
            { name: 'Data Structures & Algorithms', synonyms: ['dsa', 'algorithms'] }
          ]);
        });
    }
  }, [isEditable]);

  // Filter autocomplete suggestions based on user typing
  useEffect(() => {
    if (!newSkillInput.trim()) {
      setSuggestions([]);
      return;
    }
    const q = newSkillInput.trim().toLowerCase();
    const matches: string[] = [];

    for (const item of masterSkills) {
      const canonicalName = item.name;
      // Skip if already in confirmed skills
      if (skills.some(s => s.toLowerCase() === canonicalName.toLowerCase())) continue;

      const isNameMatch = canonicalName.toLowerCase().includes(q);
      const isSynonymMatch = (item.synonyms || []).some((syn: string) => syn.toLowerCase().includes(q));

      if (isNameMatch || isSynonymMatch) {
        if (!matches.includes(canonicalName)) {
          matches.push(canonicalName);
        }
      }
    }

    setSuggestions(matches.slice(0, 6));
  }, [newSkillInput, masterSkills, skills]);

  const handleSelectSkill = (canonicalSkill: string) => {
    if (onAddSkill) {
      onAddSkill(canonicalSkill);
      setNewSkillInput('');
      setShowInput(false);
      setSuggestions([]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;

    // Check if input matches canonical name or synonym
    const q = newSkillInput.trim().toLowerCase();
    let matchedCanonical: string | null = null;

    for (const item of masterSkills) {
      if (item.name.toLowerCase() === q) {
        matchedCanonical = item.name;
        break;
      }
      if ((item.synonyms || []).some((syn: string) => syn.toLowerCase() === q)) {
        matchedCanonical = item.name;
        break;
      }
    }

    if (!matchedCanonical && suggestions.length > 0) {
      matchedCanonical = suggestions[0];
    }

    if (matchedCanonical) {
      handleSelectSkill(matchedCanonical);
    } else {
      // Alert that skill must be from master list
      alert(`"${newSkillInput}" is not in the placement master skills list. Please select from the autocomplete suggestions.`);
    }
  };

  const isMatched = (skill: string) => matchedSkills.some(s => s.toLowerCase() === skill.toLowerCase());
  const isMissing = (skill: string) => missingSkills.some(s => s.toLowerCase() === skill.toLowerCase());

  return (
    <div className="flex flex-wrap items-center gap-2 relative">
      <AnimatePresence>
        {skills.map((skill, index) => {
          const matched = isMatched(skill);
          const missing = isMissing(skill);

          let chipClass = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
          let chipAnimation: any = { scale: [0.8, 1], opacity: [0, 1] };

          if (matched) {
            chipClass = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
            chipAnimation = { scale: [0.7, 1.08, 1], opacity: [0, 1] };
          } else if (missing) {
            chipClass = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
            chipAnimation = { x: [-3, 3, -2, 2, 0], opacity: [0, 1] };
          }

          return (
            <motion.span
              key={`${skill}-${index}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={chipAnimation}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.25, delay: index * 0.02 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border shadow-xs ${chipClass}`}
            >
              {matched && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />}
              {missing && <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
              <span>{skill}</span>
              {isEditable && onRemoveSkill && (
                <button
                  type="button"
                  onClick={() => onRemoveSkill(skill)}
                  title={`Remove ${skill}`}
                  className="ml-1 p-0.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.span>
          );
        })}
      </AnimatePresence>

      {/* Editable Add Button with Autocomplete */}
      {isEditable && onAddSkill && (
        <div className="relative inline-block">
          {showInput ? (
            <div className="relative">
              <form onSubmit={handleFormSubmit} className="inline-flex items-center gap-1">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    autoFocus
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Search master skills (e.g. Python, Docker, React)..."
                    className="w-56 px-2.5 py-1.5 text-xs rounded-xl border border-violet-400 dark:border-violet-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  title="Add Skill"
                  className="p-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Cancel"
                  onClick={() => {
                    setShowInput(false);
                    setNewSkillInput('');
                    setSuggestions([]);
                  }}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Autocomplete Dropdown List */}
              {suggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-violet-200 dark:border-violet-800 z-50 overflow-hidden py-1 divide-y divide-slate-100 dark:divide-slate-800"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/60">
                    Master Skills Catalog ({suggestions.length})
                  </div>
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSelectSkill(item)}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/60 hover:text-violet-600 dark:hover:text-violet-400 transition font-medium flex items-center justify-between"
                    >
                      <span>{item}</span>
                      <Plus className="w-3 h-3 text-violet-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border border-dashed border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:text-white hover:bg-violet-600 dark:hover:bg-violet-600 transition-colors shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>Add Master Skill</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
