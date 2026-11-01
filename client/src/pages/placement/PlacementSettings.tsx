import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sliders, Save, CheckCircle2, ShieldCheck, Plus, X } from 'lucide-react';
import { api } from '../../services/api';

export const PlacementSettings: React.FC = () => {
  const [minMatchPercent, setMinMatchPercent] = useState<number>(60.0);
  const [masterSkills, setMasterSkills] = useState<any[]>([]);
  const [offerRule, setOfferRule] = useState<string>('OneAcceptedOffer');
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Skill Input
  const [newSkillName, setNewSkillName] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newSynonyms, setNewSynonyms] = useState('');

  useEffect(() => {
    api.getPlacementSettings()
      .then(data => {
        if (data.minMatchPercent !== undefined) setMinMatchPercent(data.minMatchPercent);
        if (data.masterSkills) setMasterSkills(data.masterSkills);
        if (data.offerRule) setOfferRule(data.offerRule);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updatePlacementSettings({
        minMatchPercent: parseFloat(minMatchPercent.toString()),
        masterSkills,
        offerRule
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update settings');
    }
  };

  const handleAddMasterSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const synList = newSynonyms
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0);

    setMasterSkills([
      ...masterSkills,
      {
        name: newSkillName.trim(),
        category: newCategory,
        synonyms: synList
      }
    ]);

    setNewSkillName('');
    setNewSynonyms('');
  };

  const handleRemoveSkill = (index: number) => {
    setMasterSkills(masterSkills.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          System Settings & Matching Rules
        </h1>
        <p className="text-xs text-slate-500">
          Configure campus-wide minimum skill match thresholds, dictionary synonyms, and offer policies.
        </p>
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Placement Cell settings updated successfully!</span>
        </motion.div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Match Threshold & Policy Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Eligibility & Offer Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Minimum AI Skill Match Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={minMatchPercent}
                onChange={(e) => setMinMatchPercent(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono font-bold text-sm outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Students below this threshold cannot submit job applications (Default: 60%).
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campus Offer Policy
              </label>
              <select
                value={offerRule}
                onChange={(e) => setOfferRule(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
              >
                <option value="OneAcceptedOffer">One Accepted Offer per Student (Standard)</option>
                <option value="DreamOfferAllowed">Dream Company Multiple Offers Allowed</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                When a student accepts an offer, all other active/pending offers auto-close.
              </p>
            </div>
          </div>
        </div>

        {/* Master Skills Dictionary Editor */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Master Skills Dictionary & Synonyms ({masterSkills.length} Skills)
              </h3>
              <p className="text-[11px] text-slate-500">
                Used by the offline NLP tokenizer for resume keyword parsing.
              </p>
            </div>
          </div>

          {/* Add Skill Form */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Add New Master Skill</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Canonical Skill Name (e.g. Kotlin)"
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
              />
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category (e.g. Mobile)"
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
              />
              <input
                type="text"
                value={newSynonyms}
                onChange={(e) => setNewSynonyms(e.target.value)}
                placeholder="Synonyms comma-separated (e.g. kt, android)"
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddMasterSkill}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Dictionary</span>
            </button>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
            {masterSkills.map((skill, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{skill.name}</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-semibold">{skill.category}</span>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
                    Synonyms: {skill.synonyms?.join(', ') || 'None'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3 rounded-2xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Placement Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
