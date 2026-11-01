import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Upload, Search, Filter, History,
  Edit2, CheckCircle2, AlertCircle, Sparkles, KeyRound, Download
} from 'lucide-react';
import { api } from '../../services/api';

export const PlacementStudents: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 4th Year (2026 Batch) vs 3rd Year (2027 Batch)
  const [selectedYear, setSelectedYear] = useState<number>(4);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Student Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    regNo: '',
    branch: 'CSE',
    year: 4,
    passoutBatch: 2026,
    cgpa: 7.5,
    backlogCount: 0,
    email: ''
  });

  // Edit Backlog Modal (with mandatory Audit Reason!)
  const [editBacklogStudent, setEditBacklogStudent] = useState<any | null>(null);
  const [newBacklogCount, setNewBacklogCount] = useState<number>(0);
  const [auditReason, setAuditReason] = useState('');
  const [savingBacklog, setSavingBacklog] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api.getPlacementStudents({
        year: selectedYear,
        branch: selectedBranch,
        search: searchTerm
      });
      setStudents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedYear, selectedBranch, searchTerm]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addStudentMaster(addForm);
      setShowAddModal(false);
      setToastMsg(`Student ${addForm.name} (${addForm.regNo}) added to Master List.`);
      setTimeout(() => setToastMsg(null), 4000);
      setAddForm({
        name: '',
        regNo: '',
        branch: 'CSE',
        year: selectedYear,
        passoutBatch: selectedYear === 4 ? 2026 : 2027,
        cgpa: 7.5,
        backlogCount: 0,
        email: ''
      });
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to add student');
    }
  };

  const openBacklogEditor = (student: any) => {
    setEditBacklogStudent(student);
    setNewBacklogCount(student.backlog_count);
    setAuditReason('University grade sheet re-evaluation clearance verified.');
  };

  const handleSaveBacklog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBacklogStudent) return;

    setSavingBacklog(true);
    try {
      await api.updateStudentBacklog(editBacklogStudent.id, {
        newBacklogCount,
        reason: auditReason,
        changedBy: 'Placement Cell Officer (Prof. R. Sen)'
      });

      setToastMsg(`Backlog updated for ${editBacklogStudent.name} and logged in Audit Trail.`);
      setTimeout(() => setToastMsg(null), 4000);
      setEditBacklogStudent(null);
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to update backlog');
    } finally {
      setSavingBacklog(false);
    }
  };

  const handleSimulateCsvUpload = async () => {
    const mockCsv = [
      { regNo: `202${selectedYear === 4 ? '3' : '4'}CSE901`, name: 'Kunal Kapoor', branch: 'CSE', year: selectedYear, passoutBatch: selectedYear === 4 ? 2026 : 2027, cgpa: 8.4, backlogCount: 0, email: `kunal.k${Date.now()}@college.edu` },
      { regNo: `202${selectedYear === 4 ? '3' : '4'}IT902`, name: 'Diya Sen', branch: 'IT', year: selectedYear, passoutBatch: selectedYear === 4 ? 2026 : 2027, cgpa: 7.8, backlogCount: 1, email: `diya.s${Date.now()}@college.edu` }
    ];

    try {
      const res = await api.importStudentsCsv(mockCsv);
      setToastMsg(res.message);
      setTimeout(() => setToastMsg(null), 4000);
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'CSV upload failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-700 text-xs font-semibold flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)}>&times;</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Student Master Registry
          </h1>
          <p className="text-xs text-slate-500">
            Institutional master list for 3rd and 4th year candidates. Backlog changes trigger audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulateCsvUpload}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Year Tabs */}
      <div className="flex p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-md">
        <button
          onClick={() => setSelectedYear(4)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            selectedYear === 4
              ? 'bg-slate-900 text-white dark:bg-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          4th Year (Graduating Batch 2026)
        </button>

        <button
          onClick={() => setSelectedYear(3)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            selectedYear === 3
              ? 'bg-slate-900 text-white dark:bg-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          3rd Year (Pre-Final Batch 2027)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, reg no, or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 font-semibold shrink-0">Branch:</span>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                <tr>
                  <th className="p-4">Reg No</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4">CGPA</th>
                  <th className="p-4">Active Backlogs</th>
                  <th className="p-4">CV Uploaded</th>
                  <th className="p-4">Skills Confirmed</th>
                  <th className="p-4">Applications</th>
                  <th className="p-4">Placement Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No students found for current filter.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {s.reg_no}
                      </td>

                      <td className="p-4">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-400">{s.email}</span>
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                        {s.branch}
                      </td>

                      <td className="p-4 font-mono font-bold text-emerald-600">
                        {s.cgpa}
                      </td>

                      <td className="p-4">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                          s.backlog_count > 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {s.backlog_count}
                        </span>
                      </td>

                      <td className="p-4">
                        {s.cvUploaded ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <AlertCircle className="w-3 h-3" /> No
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {s.skillsConfirmed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Yes ({s.confirmedSkills?.length || 0})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            No
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-mono">
                        {s.total_applications} Drives
                      </td>

                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          s.placement_status ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}>
                          {s.placement_status || 'Unplaced'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => openBacklogEditor(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Backlog</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 space-y-4 text-xs"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                Add Student to Master List
              </h3>

              <form onSubmit={handleAddStudent} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. Aniket Roy"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Registration No *</label>
                    <input
                      type="text"
                      required
                      value={addForm.regNo}
                      onChange={(e) => setAddForm({ ...addForm, regNo: e.target.value.toUpperCase() })}
                      placeholder="2023CSE120"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Branch *</label>
                    <select
                      value={addForm.branch}
                      onChange={(e) => setAddForm({ ...addForm, branch: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    >
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">College Email *</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="aniket.roy@college.edu"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CGPA *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      required
                      value={addForm.cgpa}
                      onChange={(e) => setAddForm({ ...addForm, cgpa: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Backlog Count</label>
                    <input
                      type="number"
                      min="0"
                      value={addForm.backlogCount}
                      onChange={(e) => setAddForm({ ...addForm, backlogCount: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 text-white font-bold shadow-md"
                  >
                    Save Student
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Backlog Modal (Mandatory Audit Reason) */}
      <AnimatePresence>
        {editBacklogStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setEditBacklogStudent(null)} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 space-y-4 text-xs"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <History className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Backlog (Audit-Tracked)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editBacklogStudent.name} ({editBacklogStudent.reg_no})
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveBacklog} className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between font-mono">
                  <span className="text-slate-500">Current Backlog Count:</span>
                  <span className="font-bold text-rose-600">{editBacklogStudent.backlog_count}</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Backlog Count *</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    required
                    value={newBacklogCount}
                    onChange={(e) => setNewBacklogCount(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono font-bold text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mandatory Audit Reason *</label>
                  <textarea
                    rows={3}
                    required
                    value={auditReason}
                    onChange={(e) => setAuditReason(e.target.value)}
                    placeholder="e.g. Official university supplementary result cleared Semester 4 subject."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Timestamp and officer ID will be permanently recorded in the immutable Audit Log.
                  </p>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditBacklogStudent(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBacklog}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                  >
                    {savingBacklog ? 'Recording...' : 'Update & Audit Log'}
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
