import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Building2, Briefcase, PlusCircle, Users, Calendar,
  Award, LayoutDashboard, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RecruiterLayout: React.FC = () => {
  const { user } = useAuth();
  const isApproved = user?.approvalStatus === 'Approved';

  // Exact 7 Sidebar items in specified order:
  // 1 Company Profile, 2 My Vacancies, 3 Post Vacancy, 4 Applications, 5 Rounds & Results, 6 Offers, 7 Dashboard
  const navItems = [
    { name: '1. Company Profile', to: '/recruiter/profile', icon: Building2 },
    { name: '2. My Vacancies', to: '/recruiter/vacancies', icon: Briefcase },
    {
      name: '3. Post Vacancy',
      to: '/recruiter/post-vacancy',
      icon: PlusCircle,
      disabled: !isApproved,
      disabledBadge: !isApproved ? 'Pending Approval' : undefined
    },
    { name: '4. Applications', to: '/recruiter/applications', icon: Users },
    { name: '5. Rounds & Results', to: '/recruiter/rounds', icon: Calendar },
    { name: '6. Offers', to: '/recruiter/offers', icon: Award },
    { name: '7. Dashboard', to: '/recruiter/dashboard', icon: LayoutDashboard }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-6">
        {/* Company Card Header */}
        <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 flex items-center gap-3">
          <img
            src={user?.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
            alt={user?.name}
            className="w-10 h-10 rounded-xl object-cover bg-white p-0.5 border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.name}
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
              isApproved
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              {user?.approvalStatus || 'Approved'}
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="p-2.5 rounded-xl text-slate-400 dark:text-slate-600 text-xs font-semibold flex items-center justify-between cursor-not-allowed opacity-60"
                  title="Posting vacancies is locked until Placement Cell approves your company registration."
                >
                  <div className="flex items-center gap-2.5">
                    {React.createElement(item.icon, { className: 'w-4 h-4' })}
                    <span>{item.name}</span>
                  </div>
                  {item.disabledBadge && (
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                      {item.disabledBadge}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                {React.createElement(item.icon, { className: 'w-4 h-4' })}
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
