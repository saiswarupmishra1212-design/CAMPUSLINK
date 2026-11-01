import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusCircle, Trash2, Calendar, Clock, MapPin, CheckCircle2,
  AlertTriangle, Sparkles, Building2, Layers, Check
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Round } from '../../types';

export const PostVacancy: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [masterSkills, setMasterSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [allowedBranches, setAllowedBranches] = useState<string[]>(['CSE', 'IT', 'ECE']);
  const [minCgpa, setMinCgpa] = useState<number>(7.0);
  const [backlogRule, setBacklogRule] = useState<'NotAllowed' | 'AllowedUpToN'>('NotAllowed');
  const [maxBacklogs, setMaxBacklogs] = useState<number>(0);
  const [ctc, setCtc] = useState('14.0 LPA');
  const [openings, setOpenings] = useState<number>(5);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 14);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  const [openDate, setOpenDate] = useState(todayStr);
  const [closeDate, setCloseDate] = useState(nextMonthStr);

  // Multi-Rounds Builder
  const [rounds, setRounds] = useState<Round[]>([
    { roundIndex: 0, name: 'Round 1: Online Technical Assessment', date: nextMonthStr, time: '10:00 AM', mode: 'Online', venue: 'Virtual Platform' },
    { roundIndex: 1, name: 'Round 2: System Architecture & Coding', date: nextMonthStr, time: '02:00 PM', mode: 'Offline', venue: 'Placement Lab 1' },
    { roundIndex: 2, name: 'Round 3: Leadership & Culture Fit', date: nextMonthStr, time: '04:30 PM', mode: 'Offline', venue: 'Executive Boardroom' }
  ]);

  useEffect(() => {
    api.getMasterSkills()
      .then(data => setMasterSkills(data || []))
      .catch(err => console.error('Failed to load master skills:', err));
  }, []);

  const toggleSkill = (skillName: string) => {
    if (requiredSkills.includes(skillName)) {
      setRequiredSkills(requiredSkills.filter(s => s !== skillName));
    } else {
      setRequiredSkills([...requiredSkills, skillName]);
    }
  };

  const toggleBranch = (branch: string) => {
    if (allowedBranches.includes(branch)) {
      setAllowedBranches(allowedBranches.filter(b => b !== branch));
    } else {
      setAllowedBranches([...allowedBranches, branch]);
    }
  };

  const handleAddRound = () => {
    const newIdx = rounds.length;
    setRounds([
      ...rounds,
      {
        roundIndex: newIdx,
        name: `Round ${newIdx + 1}: Technical Interview`,
        date: closeDate,
        time: '11:00 AM',
        mode: 'Offline',
        venue: 'Campus Placement Lab'
      }
    ]);
  };

  const handleRemoveRound = (idx: number) => {
    if (rounds.length <= 1) return;
    const updated = rounds.filter((_, i) => i !== idx).map((r, i) => ({ ...r, roundIndex: i }));
    setRounds(updated);
  };

  const handleRoundChange = (index: number, field: keyof Round, value: any) => {
    const updated = [...rounds];
    updated[index] = { ...updated[index], [field]: value };
    setRounds(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (requiredSkills.length === 0) {
      setErrorMessage('Please select at least 2 required skills from the master skills tags.');
      return;
    }

    if (allowedBranches.length === 0) {
      setErrorMessage('Please select at least one eligible engineering branch.');
      return;
    }

    setLoading(true);
    try {
      await api.postVacancy({
        role,
        description,
        requiredSkills,
        allowedBranches,
        minCgpa,
        backlogRule,
        maxBacklogs: backlogRule === 'AllowedUpToN' ? maxBacklogs : 0,
        ctc,
        openings,
        openDate,
        closeDate,
        rounds
      });

      navigate('/recruiter/vacancies');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to post vacancy');
    } finally {
      setLoading(false);
    }
  };

  if (user?.approvalStatus !== 'Approved') {
    return (
      <div className="p-8 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 max-w-2xl mx-auto text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200">Company Approval Required</h2>
        <p className="text-xs text-amber-800 dark:text-amber-300">
          Your company registration is currently in &ldquo;{user?.approvalStatus || 'RequestSent'}&rdquo; status. The Placement Cell Administrator must approve your affiliation before you can publish campus vacancies.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          3. Post Campus Job Vacancy
        </h1>
        <p className="text-xs text-slate-500">
          Create a role specification with master skill tags, academic criteria, and multi-round schedules.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Role & Package Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 pb-2 border-b border-slate-100 dark:border-slate-800">
            Role Details & Compensation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Role Title *</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Software Developer, Cloud Architect"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Offered CTC Package *</label>
              <input
                type="text"
                required
                value={ctc}
                onChange={(e) => setCtc(e.target.value)}
                placeholder="e.g. 14.5 LPA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Openings *</label>
              <input
                type="number"
                min="1"
                required
                value={openings}
                onChange={(e) => setOpenings(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Open Date *</label>
              <input
                type="date"
                required
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Application Close Date *</label>
              <input
                type="date"
                required
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Description & Requirements</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe key responsibilities and expectations..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Master Skills Tag Selector */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Required Technical Skills (Master Dictionary Tags)
              </h3>
              <p className="text-[11px] text-slate-500">
                Pick skills from the standardized placement dictionary for explainable AI matching.
              </p>
            </div>
            <span className="text-xs font-bold text-teal-600 font-mono">
              {requiredSkills.length} Selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
            {masterSkills.map(skill => {
              const isSelected = requiredSkills.includes(skill.name);
              return (
                <button
                  key={skill.name}
                  type="button"
                  onClick={() => toggleSkill(skill.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  <span>{skill.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Eligibility Criteria */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 pb-2 border-b border-slate-100 dark:border-slate-800">
            Academic & Backlog Eligibility Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Minimum CGPA</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={minCgpa}
                onChange={(e) => setMinCgpa(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Backlog Policy</label>
              <select
                value={backlogRule}
                onChange={(e) => setBacklogRule(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
              >
                <option value="NotAllowed">Zero Backlogs Allowed</option>
                <option value="AllowedUpToN">Allowed Up To N Backlogs</option>
              </select>
            </div>

            {backlogRule === 'AllowedUpToN' && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Allowed Backlogs</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxBacklogs}
                  onChange={(e) => setMaxBacklogs(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none font-mono"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Eligible Engineering Branches</label>
            <div className="flex flex-wrap gap-2">
              {['CSE', 'IT', 'ECE', 'EEE', 'MECH'].map(b => {
                const isSelected = allowedBranches.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBranch(b)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold border transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Multi-Round Interview Builder */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Interview Rounds Builder ({rounds.length} Rounds)
              </h3>
              <p className="text-[11px] text-slate-500">
                Define the sequence of rounds. Candidates progress round-by-round upon recruiter evaluation.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddRound}
              className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold hover:bg-teal-100 transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Round</span>
            </button>
          </div>

          <div className="space-y-3">
            {rounds.map((round, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    Round #{idx + 1} Configuration
                  </span>

                  {rounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRound(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                      title="Delete round"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Round Name</label>
                    <input
                      type="text"
                      required
                      value={round.name}
                      onChange={(e) => handleRoundChange(idx, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={round.date}
                      onChange={(e) => handleRoundChange(idx, 'date', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Time Slot</label>
                    <input
                      type="text"
                      required
                      value={round.time}
                      onChange={(e) => handleRoundChange(idx, 'time', e.target.value)}
                      placeholder="e.g. 10:00 AM"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Mode & Venue</label>
                    <div className="flex gap-1.5">
                      <select
                        value={round.mode}
                        onChange={(e) => handleRoundChange(idx, 'mode', e.target.value as any)}
                        className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                      </select>
                      <input
                        type="text"
                        value={round.venue}
                        onChange={(e) => handleRoundChange(idx, 'venue', e.target.value)}
                        placeholder="Lab 1 / Hackerearth"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xl shadow-teal-500/25 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Publish Campus Vacancy</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
