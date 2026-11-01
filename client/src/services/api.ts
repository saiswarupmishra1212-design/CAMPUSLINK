// In Android WebView (Capacitor) there is no proxy, so use absolute URL.
// ANDROID_SERVER_URL is injected at build time via .env or defaults to emulator alias.
const isNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNative;
const API_BASE = isNative
  ? `${import.meta.env.VITE_SERVER_URL ?? 'http://10.0.2.2:5000'}/api`
  : '/api';


export function getAuthToken(): string | null {
  return localStorage.getItem('campuslink_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('campuslink_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('campuslink_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'An unexpected error occurred');
  }

  return data;
}

export const api = {
  // Auth
  studentLogin: (body: any) => request<any>('/auth/student/login', { method: 'POST', body: JSON.stringify(body) }),
  studentRegister: (body: any) => request<any>('/auth/student/register', { method: 'POST', body: JSON.stringify(body) }),
  recruiterLogin: (body: any) => request<any>('/auth/recruiter/login', { method: 'POST', body: JSON.stringify(body) }),
  placementLogin: (body: any) => request<any>('/auth/placement/login', { method: 'POST', body: JSON.stringify(body) }),
  getDemoAccounts: () => request<any>('/auth/demo-accounts'),
  getMe: () => request<any>('/auth/me'),

  // Student
  getStudentProfile: () => request<any>('/student/profile'),
  updateStudentProfile: (body: any) => request<any>('/student/profile', { method: 'PUT', body: JSON.stringify(body) }),
  uploadPhoto: (formData: FormData) => request<any>('/student/upload-photo', { method: 'POST', body: formData }),
  uploadCV: (body: any) => request<any>('/student/upload-cv', { method: 'POST', body: JSON.stringify(body) }),
  uploadCvFile: (formData: FormData) => request<any>('/student/upload-cv', { method: 'POST', body: formData }),
  confirmSkills: (confirmedSkills: string[]) => request<any>('/student/confirm-skills', { method: 'POST', body: JSON.stringify({ confirmedSkills }) }),
  getStudentJobs: () => request<any[]>('/student/jobs'),
  getStudentJobDetail: (id: number) => request<any>(`/student/jobs/${id}`),
  applyToJob: (body: any) => request<any>('/student/apply', { method: 'POST', body: JSON.stringify(body) }),
  getStudentApplications: () => request<any[]>('/student/applications'),
  getStudentOffers: () => request<any[]>('/student/offers'),
  respondToOffer: (offerId: number, action: 'Accept' | 'Decline' | 'Defer') =>
    request<any>(`/student/offers/${offerId}/respond`, { method: 'POST', body: JSON.stringify({ action }) }),

  // Recruiter
  getRecruiterProfile: () => request<any>('/recruiter/profile'),
  updateRecruiterProfile: (body: any) => request<any>('/recruiter/profile', { method: 'PUT', body: JSON.stringify(body) }),
  getRecruiterVacancies: () => request<any[]>('/recruiter/vacancies'),
  postVacancy: (body: any) => request<any>('/recruiter/vacancies', { method: 'POST', body: JSON.stringify(body) }),
  updateVacancy: (id: number, body: any) => request<any>(`/recruiter/vacancies/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  closeVacancyEarly: (id: number) => request<any>(`/recruiter/vacancies/${id}/close-early`, { method: 'PUT' }),
  // Recruiter - Round Decisions & Broadcast
  getVacancyApplications: (id: number) => request<any>(`/recruiter/vacancies/${id}/applications`),
  getCandidateProfile: (studentId: number) => request<any>(`/recruiter/candidate/${studentId}`),
  submitRoundResults: (body: any) => request<any>('/recruiter/rounds/results', { method: 'POST', body: JSON.stringify(body) }),
  bulkUploadRoundResults: (formData: FormData) => request<any>('/recruiter/rounds/bulk-upload', { method: 'POST', body: formData }),
  broadcastToApplicants: (vacancyId: number, body: any) =>
    request<any>(`/recruiter/vacancies/${vacancyId}/broadcast-message`, { method: 'POST', body: JSON.stringify(body) }),
  releaseOffer: (body: any) => request<any>('/recruiter/offers/release', { method: 'POST', body: JSON.stringify(body) }),
  getRecruiterDashboard: () => request<any>('/recruiter/dashboard'),

  // Notifications
  getNotifications: () => request<any>('/notifications'),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),
  markNotificationRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
  getEmailOutbox: () => request<any[]>('/notifications/email-outbox'),

  // AI & Skills
  getMasterSkills: () => request<string[]>('/ai/master-skills'),
  getAiEvaluation: () => request<any>('/ai/evaluation'),
  extractSkillsAi: (body: any) => request<any>('/ai/extract-skills', { method: 'POST', body: JSON.stringify(body) }),
  matchSkillsAi: (studentSkills: any, requiredSkills?: any) =>
    request<any>('/ai/match-skills', { method: 'POST', body: JSON.stringify(typeof studentSkills === 'object' && !requiredSkills ? studentSkills : { studentSkills, requiredSkills }) }),

  // Placement Cell
  getPlacementAnalytics: () => request<any>('/placement/analytics'),
  getPlacementAtRisk: () => request<any>('/placement/at-risk'),
  notifyMentor: (body: any) => request<any>('/placement/notify-mentor', { method: 'POST', body: JSON.stringify(body) }),
  getAuditLogs: () => request<any>('/placement/audit-logs'),
  getPlacementClashes: () => request<any>('/placement/clashes'),
  getPlacementCompanies: () => request<any>('/placement/companies'),
  updateCompanyStatus: (id: number, body: any) => request<any>(`/placement/companies/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
  broadcastAnnouncement: (body: any) => request<any>('/placement/broadcast', { method: 'POST', body: JSON.stringify(body) }),
  getPlacementMonitoring: () => request<any>('/placement/monitoring'),
  getPlacementSettings: () => request<any>('/placement/settings'),
  updatePlacementSettings: (body: any) => request<any>('/placement/settings', { method: 'PUT', body: JSON.stringify(body) }),
  getPlacementStudents: (params?: any) => request<any>('/placement/students'),
  addStudentMaster: (body: any) => request<any>('/placement/students', { method: 'POST', body: JSON.stringify(body) }),
  updateStudentBacklog: (id: number, body: any) => request<any>(`/placement/students/${id}/backlog`, { method: 'PUT', body: JSON.stringify(body) }),
  importStudentsCsv: (body: any) =>
    request<any>('/placement/students/import-csv', {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),

  // Demo Clock (per-job virtual date controls)
  getDemoClockJobs: () => request<any[]>('/demo-clock/jobs'),
  getDemoClockJob: (id: number) => request<any>(`/demo-clock/job/${id}`),
  controlJobClock: (id: number, action: string, params?: any) =>
    request<any>(`/demo-clock/job/${id}`, { method: 'POST', body: JSON.stringify({ action, ...params }) }),
  advanceJobDay: (id: number, days: number = 1) =>
    request<any>(`/demo-clock/job/${id}/add-day`, { method: 'POST', body: JSON.stringify({ days }) }),
  jumpJobClose: (id: number) =>
    request<any>(`/demo-clock/job/${id}/jump-close`, { method: 'POST' }),
  jumpJobExam: (id: number, roundIndex: number = 0) =>
    request<any>(`/demo-clock/job/${id}/jump-exam`, { method: 'POST', body: JSON.stringify({ roundIndex }) }),
  jumpJobDayAfterExam: (id: number, roundIndex: number = 0) =>
    request<any>(`/demo-clock/job/${id}/jump-day-after-exam`, { method: 'POST', body: JSON.stringify({ roundIndex }) }),
  resetJobClock: (id: number) =>
    request<any>(`/demo-clock/job/${id}/reset`, { method: 'POST' }),
  syncAllJobClocks: (date?: string) =>
    request<any>('/demo-clock/sync-all', { method: 'POST', body: JSON.stringify({ date }) }),
  resetDemoData: () => request<any>('/demo/reset', { method: 'POST' }),
};
