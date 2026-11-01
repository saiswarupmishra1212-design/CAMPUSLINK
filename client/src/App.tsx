import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { FloatingDemoControls } from './components/FloatingDemoControls';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { AiEvaluationPage } from './pages/ai/AiEvaluationPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentJobs } from './pages/student/StudentJobs';
import { StudentJobDetail } from './pages/student/StudentJobDetail';
import { StudentApplications } from './pages/student/StudentApplications';
import { StudentOffers } from './pages/student/StudentOffers';

// Recruiter Pages
import { RecruiterLayout } from './pages/recruiter/RecruiterLayout';
import { RecruiterProfile } from './pages/recruiter/RecruiterProfile';
import { RecruiterVacancies } from './pages/recruiter/RecruiterVacancies';
import { PostVacancy } from './pages/recruiter/PostVacancy';
import { RecruiterApplications } from './pages/recruiter/RecruiterApplications';
import { RecruiterRounds } from './pages/recruiter/RecruiterRounds';
import { RecruiterOffers } from './pages/recruiter/RecruiterOffers';
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';

// Placement Cell Pages
import { PlacementLayout } from './pages/placement/PlacementLayout';
import { PlacementStudents } from './pages/placement/PlacementStudents';
import { PlacementAuditLogs } from './pages/placement/PlacementAuditLogs';
import { PlacementCompanies } from './pages/placement/PlacementCompanies';
import { PlacementMonitoring } from './pages/placement/PlacementMonitoring';
import { PlacementClashes } from './pages/placement/PlacementClashes';
import { PlacementAnalytics } from './pages/placement/PlacementAnalytics';
import { PlacementAtRisk } from './pages/placement/PlacementAtRisk';
import { PlacementSettings } from './pages/placement/PlacementSettings';

// Route Guard
const ProtectedRoute: React.FC<{
  allowedRoles: string[];
  children: React.ReactElement;
}> = ({ allowedRoles, children }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !role || !allowedRoles.includes(role)) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export const AppContent: React.FC = () => {
  const { refreshUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />

      <div className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/ai-evaluation" element={<AiEvaluationPage />} />

          {/* Student Portal Routes (Violet Theme) */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/jobs"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/jobs/:id"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentJobDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/offers"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentOffers />
              </ProtectedRoute>
            }
          />

          {/* Recruiter Portal Routes (Teal Theme) */}
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <RecruiterLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
            <Route path="profile" element={<RecruiterProfile />} />
            <Route path="vacancies" element={<RecruiterVacancies />} />
            <Route path="post-vacancy" element={<PostVacancy />} />
            <Route path="applications" element={<RecruiterApplications />} />
            <Route path="rounds" element={<RecruiterRounds />} />
            <Route path="offers" element={<RecruiterOffers />} />
            <Route path="dashboard" element={<RecruiterDashboard />} />
          </Route>

          {/* Placement Cell Portal Routes (Slate Theme) */}
          <Route
            path="/placement"
            element={
              <ProtectedRoute allowedRoles={['placement']}>
                <PlacementLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/placement/students" replace />} />
            <Route path="students" element={<PlacementStudents />} />
            <Route path="audit-logs" element={<PlacementAuditLogs />} />
            <Route path="companies" element={<PlacementCompanies />} />
            <Route path="monitoring" element={<PlacementMonitoring />} />
            <Route path="clashes" element={<PlacementClashes />} />
            <Route path="analytics" element={<PlacementAnalytics />} />
            <Route path="at-risk" element={<PlacementAtRisk />} />
            <Route path="settings" element={<PlacementSettings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Floating Demo Controls accessible across all views */}
      <FloatingDemoControls onRefresh={refreshUser} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
