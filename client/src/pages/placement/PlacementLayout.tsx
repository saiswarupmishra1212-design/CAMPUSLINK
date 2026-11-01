import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Users, Building2, Sliders, BarChart3, AlertTriangle,
  History, Eye, Megaphone, ShieldCheck, Radio
} from 'lucide-react';
import { api } from '../../services/api';

export const PlacementLayout: React.FC = () => {
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetBranch, setTargetBranch] = useState('ALL');
  const [targetYear, setTargetYear] = useState('ALL');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const navItems = [
    { name: 'Student Master Records', to: '/placement/students', icon: Users },
    { name: 'Backlog Audit Log', to: '/placement/audit-logs', icon: History },
    { name: 'Company Management', to: '/placement/companies', icon: Building2 },
    { name: 'Drive Monitoring', to: '/placement/monitoring', icon: Eye },
    { name: 'Clash Center', to: '/placement/clashes', icon: AlertTriangle },
    { name: 'Institutional Analytics', to: '/placement/analytics', icon: BarChart3 },
    { name: 'At-Risk Students', to: '/placement/at-risk', icon: AlertTriangle },
    { name: 'System Settings', to: '/placement/settings', icon: Sliders }
  ];

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      const res = await api.broadcastAnnouncement({
        title: broadcastTitle,
        message: broadcastMessage,
        targetBranch,
        targetYear
      });
      setBroadcastSuccess(res.message);
      setTimeout(() => {
        setBroadcastSuccess(null);
        setShowBroadcastModal(false);
        setBroadcastTitle('');
        setBroadcastMessage('');
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-100/60 dark:bg-slate-950 transition-colors">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-6">
        {/* Placement Admin Badge */}
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-xs font-bold leading-none">Placement Cell</h3>
              <span className="text-[10px] text-slate-400 font-mono">Head Officer Admin</span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-800 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {React.createElement(item.icon, { className: 'w-4 h-4' })}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Announcement Trigger */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-900 flex items-center justify-center gap-2 transition shadow-xs"
          >
            <Megaphone className="w-4 h-4" />
            <span>Broadcast Notice</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Broadcast Announcement Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowBroadcastModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Megaphone className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Campus Placement Notice</h3>
                <p className="text-[11px] text-slate-500">Dispatches real-time in-app and simulated email alerts</p>
              </div>
            </div>

            {broadcastSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center">
                {broadcastSuccess}
              </div>
            ) : (
              <form onSubmit={handleBroadcast} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Announcement Title *</label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Apex Innovations Pre-Placement Talk Tomorrow"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Branch</label>
                    <select
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    >
                      <option value="ALL">All Branches</option>
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Year</label>
                    <select
                      value={targetYear}
                      onChange={(e) => setTargetYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    >
                      <option value="ALL">All Years (3rd & 4th)</option>
                      <option value="4">4th Year Only (2026)</option>
                      <option value="3">3rd Year Only (2027)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Notice Body / Instructions *</label>
                  <textarea
                    rows={4}
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Provide drive instructions, venue details, or deadlines..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none leading-relaxed"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={broadcasting}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                  >
                    {broadcasting ? 'Broadcasting...' : 'Send Broadcast'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
