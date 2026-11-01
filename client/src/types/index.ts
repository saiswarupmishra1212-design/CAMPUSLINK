export type UserRole = 'student' | 'recruiter' | 'placement';

export interface StudentMaster {
  id: number;
  reg_no: string;
  name: string;
  branch: string;
  discipline?: string;
  college?: string;
  year: number;
  passout_batch: number;
  cgpa: number;
  backlog_count: number;
  email: string;
}

export interface StudentProfile {
  id: number;
  student_master_id: number;
  photo_url?: string;
  photoUrl?: string;
  linkedin?: string;
  github?: string;
  phone?: string;
  cv_file_name?: string;
  cvFileName?: string;
  cv_text?: string;
  cvText?: string;
  confirmed_skills: string[];
  confirmedSkills?: string[];
  projects: string[];
  certifications: string[];
  internships?: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  regNo?: string;
  branch?: string;
  discipline?: string;
  college?: string;
  year?: number;
  passoutBatch?: number;
  cgpa?: number;
  backlogCount?: number;
  companyId?: number;
  logo?: string;
  website?: string;
  description?: string;
  hrContact?: string;
  approvalStatus?: 'RequestSent' | 'Approved' | 'Declined';
  profile?: StudentProfile;
}

export interface Round {
  roundIndex: number;
  name: string;
  date: string;
  time: string;
  mode: 'Online' | 'Offline';
  venue: string;
}

export interface Vacancy {
  id: number;
  companyId: number;
  companyName: string;
  companyLogo?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companyHrContact?: string;
  role: string;
  description: string;
  requiredSkills: string[];
  allowedBranches: string[];
  minCgpa: number;
  backlogRule: 'NotAllowed' | 'AllowedUpToN';
  maxBacklogs: number;
  ctc: string;
  openings: number;
  openDate: string;
  closeDate: string;
  rounds: Round[];
  status: 'Draft' | 'Open' | 'Closed';
  tag?: 'Active' | 'Closing soon' | 'Closed';
  diffDays?: number;
  hasApplied?: boolean;
  applicationId?: number;
  applicationStatus?: string;
  aiMatch?: {
    matchPercent: number;
    matchedSkills: string[];
    missingSkills: string[];
    readinessLevel: 'Highly Employable' | 'Ready' | 'Developing' | 'Not Ready';
    totalRequired: number;
    matchedCount: number;
    explanation: string;
  };
  eligibility?: {
    isEligible: boolean;
    meetsMatch: boolean;
    meetsCgpa: boolean;
    meetsBranch: boolean;
    meetsBacklog: boolean;
    reasons: string[];
    minMatchPercentRequired: number;
  };
}

export interface Application {
  id: number;
  vacancyId: number;
  companyId: number;
  companyName: string;
  companyLogo?: string;
  jobRole: string;
  ctc: string;
  matchPercent: number;
  matchedSkills: string[];
  missingSkills: string[];
  readinessLevel: string;
  status: string;
  rejectionReason?: string;
  appliedAt: string;
  rounds: Round[];
  roundResults: {
    id: number;
    round_index: number;
    result: 'Pass' | 'Fail' | 'Pending';
    feedback: string;
    evaluated_at: string;
  }[];
  offer?: {
    id: number;
    status: 'Released' | 'Accepted' | 'Declined' | 'Deferred';
    ctc: string;
    joiningDate: string;
    documents: string[];
  };
}

export interface NotificationItem {
  id: number;
  recipient_user_id?: string;
  sender_id?: string;
  event_type?: string;
  event_key?: string;
  user_id?: string;
  role?: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  is_read: number;
  read_at?: string | null;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface SimulatedEmail {
  id: number;
  recipient_email: string;
  sender: string;
  subject: string;
  body_text: string;
  channel: string;
  sent_at: string;
}

export interface ClashItem {
  id: string;
  type: 'STUDENT_SCHEDULE_CLASH' | 'VENUE_DOUBLE_BOOKED';
  severity: 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  studentId?: number;
  studentName?: string;
  regNo?: string;
  venue?: string;
  date?: string;
  time?: string;
  drive1: {
    company: string;
    role: string;
    round: string;
    date?: string;
    time?: string;
    venue?: string;
  };
  drive2: {
    company: string;
    role: string;
    round: string;
    date?: string;
    time?: string;
    venue?: string;
  };
  resolution: string;
}
