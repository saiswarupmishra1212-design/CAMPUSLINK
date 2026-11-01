import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, KeyRound, BookOpen, Upload, FileText,
  Sparkles, CheckCircle2, AlertCircle, Save, Plus, X, Globe,
  ShieldCheck, Check, Camera, ExternalLink, Briefcase, Award,
  Layers, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { SkillChips } from '../../components/SkillChips';

export const StudentProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable Form Fields
  const [photoUrl, setPhotoUrl] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmedSkills, setConfirmedSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [internships, setInternships] = useState<string[]>([]);

  // Form Validation Errors
  const [validationErrors, setValidationErrors] = useState<{
    linkedin?: string;
    github?: string;
    phone?: string;
  }>({});

  // New Item Input States
  const [newProject, setNewProject] = useState('');
  const [newCert, setNewCert] = useState('');
  const [newInternship, setNewInternship] = useState('');

  // CV Upload & AI Extraction State
  const [cvText, setCvText] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [aiExtracting, setAiExtracting] = useState(false);
  const [extractedCandidateSkills, setExtractedCandidateSkills] = useState<string[]>([]);
  const [extractionAlert, setExtractionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fallback Paste State
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Confirmation & Save States
  const [skillsConfirmedState, setSkillsConfirmedState] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [confirmingSkills, setConfirmingSkills] = useState(false);

  // File Input References
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentProfile();
      setProfileData(data);
      if (data.profile) {
        setPhotoUrl(data.profile.photoUrl || data.profile.photo_url || '');
        setLinkedin(data.profile.linkedin || '');
        setGithub(data.profile.github || '');
        setPhone(data.profile.phone || '');
        setConfirmedSkills(data.profile.confirmedSkills || data.profile.confirmed_skills || []);
        setProjects(data.profile.projects || []);
        setCertifications(data.profile.certifications || []);
        setInternships(data.profile.internships || []);
        setCvFileName(data.profile.cvFileName || data.profile.cv_file_name || '');
        setCvText(data.profile.cvText || data.profile.cv_text || '');
        if ((data.profile.confirmedSkills || data.profile.confirmed_skills || []).length > 0) {
          setSkillsConfirmedState(true);
        }
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      showToast('error', err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Compute live completeness
  const computeCompleteness = () => {
    let score = 20; // Base: Registered
    if (photoUrl) score += 10;
    if (linkedin) score += 10;
    if (github) score += 10;
    if (phone) score += 10;
    if (cvFileName) score += 15;
    if (confirmedSkills.length >= 5) score += 15;
    else if (confirmedSkills.length > 0) score += 8;
    if (projects.length > 0) score += 5;
    if (certifications.length > 0) score += 5;
    return Math.min(100, score);
  };

  const completenessScore = computeCompleteness();

  // Validate editable profile inputs
  const validateInputs = () => {
    const errors: { linkedin?: string; github?: string; phone?: string } = {};

    if (linkedin.trim()) {
      if (!/^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(linkedin.trim())) {
        errors.linkedin = 'Must be a valid LinkedIn URL (e.g. https://linkedin.com/in/username)';
      }
    }

    if (github.trim()) {
      if (!/^https?:\/\/(www\.)?github\.com\/.+/i.test(github.trim())) {
        errors.github = 'Must be a valid GitHub URL (e.g. https://github.com/username)';
      }
    }

    if (phone.trim()) {
      if (!/^[+]?[\d\s-]{7,18}$/.test(phone.trim())) {
        errors.phone = 'Must be a valid phone number (e.g. +91 9876543210)';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Photo Upload
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Profile photo size exceeds the 2 MB limit.');
      return;
    }

    // Check type
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Only image files (PNG, JPG, WEBP, GIF, SVG) are allowed.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await api.uploadPhoto(formData);
      setPhotoUrl(res.photoUrl);
      showToast('success', 'Profile photo uploaded successfully!');
      refreshUser();
    } catch (err: any) {
      showToast('error', err.message || 'Photo upload failed');
    }
  };

  // Handle CV File Upload (PDF, DOCX, TXT)
  const handleCvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'CV file size exceeds the 5 MB limit.');
      return;
    }

    setAiExtracting(true);
    setExtractionAlert(null);

    const formData = new FormData();
    formData.append('cvFile', file);

    try {
      const res = await api.uploadCvFile(formData);
      setCvFileName(res.cvFileName || file.name);
      setCvText(res.cvText || '');
      setExtractedCandidateSkills(res.extractedSkills || []);
      setSkillsConfirmedState(false);

      if (res.parsedInfo) {
        if (res.parsedInfo.phone && !phone) setPhone(res.parsedInfo.phone);
        if (res.parsedInfo.linkedin && !linkedin) setLinkedin(res.parsedInfo.linkedin);
        if (res.parsedInfo.github && !github) setGithub(res.parsedInfo.github);
        if (res.parsedInfo.projects && res.parsedInfo.projects.length > 0) {
          const merged = Array.from(new Set([...projects, ...res.parsedInfo.projects]));
          setProjects(merged);
        }
        if (res.parsedInfo.certifications && res.parsedInfo.certifications.length > 0) {
          const merged = Array.from(new Set([...certifications, ...res.parsedInfo.certifications]));
          setCertifications(merged);
        }
        if (res.parsedInfo.internships && res.parsedInfo.internships.length > 0) {
          const merged = Array.from(new Set([...internships, ...res.parsedInfo.internships]));
          setInternships(merged);
        }
      }

      setExtractionAlert({
        type: 'success',
        message: `AI Engine parsed "${file.name}" and extracted ${res.extractedSkills?.length || 0} skills! Review and confirm them below.`
      });
      showToast('success', `Resume parsed: ${res.extractedSkills?.length || 0} skills identified.`);
      setShowPasteFallback(false);
      refreshUser();
    } catch (err: any) {
      setExtractionAlert({
        type: 'error',
        message: err.message || 'Could not parse text from this file. Please use the Paste CV fallback below.'
      });
      setShowPasteFallback(true);
      showToast('error', 'File parsing issue: Please paste your resume text below.');
    } finally {
      setAiExtracting(false);
      if (cvInputRef.current) cvInputRef.current.value = '';
    }
  };

  // Handle Pasted Text Fallback
  const handlePastedTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim() || pastedText.trim().length < 15) {
      showToast('error', 'Please paste substantial resume text (at least 15 characters).');
      return;
    }

    setAiExtracting(true);
    setExtractionAlert(null);

    try {
      const res = await api.uploadCV({
        cvText: pastedText.trim(),
        cvFileName: 'Pasted_Resume_Text.txt'
      });

      setCvFileName('Pasted_Resume_Text.txt');
      setCvText(pastedText.trim());
      setExtractedCandidateSkills(res.extractedSkills || []);
      setSkillsConfirmedState(false);

      if (res.parsedInfo) {
        if (res.parsedInfo.phone && !phone) setPhone(res.parsedInfo.phone);
        if (res.parsedInfo.linkedin && !linkedin) setLinkedin(res.parsedInfo.linkedin);
        if (res.parsedInfo.github && !github) setGithub(res.parsedInfo.github);
        if (res.parsedInfo.projects?.length) setProjects(Array.from(new Set([...projects, ...res.parsedInfo.projects])));
        if (res.parsedInfo.certifications?.length) setCertifications(Array.from(new Set([...certifications, ...res.parsedInfo.certifications])));
        if (res.parsedInfo.internships?.length) setInternships(Array.from(new Set([...internships, ...res.parsedInfo.internships])));
      }

      setExtractionAlert({
        type: 'success',
        message: `AI Engine extracted ${res.extractedSkills?.length || 0} skills from pasted text! Review and confirm them below.`
      });
      showToast('success', 'Resume text processed successfully!');
      setShowPasteFallback(false);
      setPastedText('');
      refreshUser();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to process pasted text');
    } finally {
      setAiExtracting(false);
    }
  };

  // Preset Resumes for instant demo
  const loadPresetResume = async (type: 'fullstack' | 'ml' | 'cloud' | 'dataeng') => {
    setAiExtracting(true);
    setExtractionAlert(null);

    let text = '';
    let fName = 'FullStack_Developer_Resume.pdf';

    if (type === 'fullstack') {
      fName = 'FullStack_Engineer_Resume.pdf';
      text = `Full Stack Engineer Resume\nSkills: Python (py3), React (reactjs), Node.js, TypeScript, SQL, Git, REST API, HTML/CSS, Docker\nProjects:\n- Campus Recruitment Portal with Real-Time AI Scoring\n- Microservices Architecture with Redis\nCertifications:\n- Meta Frontend Professional Certificate\nInternships:\n- Software Engineering Intern at TechFlow Solutions`;
    } else if (type === 'ml') {
      fName = 'Data_Scientist_Resume.pdf';
      text = `Machine Learning Engineer Resume\nSkills: Python, Machine Learning, Deep Learning, PyTorch, SQL, Data Analysis, Git, Data Structures & Algorithms\nProjects:\n- Neural Image Classifier with PyTorch\n- Real-Time Predictive Maintenance Engine\nCertifications:\n- DeepLearning.AI Specialization\nInternships:\n- AI Research Intern at Analytics Hub`;
    } else if (type === 'cloud') {
      fName = 'Cloud_DevOps_Resume.pdf';
      text = `Cloud DevOps Engineer Resume\nSkills: AWS, Docker, Kubernetes, CI/CD, Git, Python, SQL\nProjects:\n- Multi-Region High Availability AWS Infrastructure\n- Automated GitHub Actions Deployment Matrix\nCertifications:\n- AWS Certified Solutions Architect Associate\nInternships:\n- Cloud Infrastructure Intern at ScaleGrid`;
    } else if (type === 'dataeng') {
      fName = 'Big_Data_Engineer_Resume.pdf';
      text = `Data Engineer Resume\nSkills: Data Engineering, Python, SQL, AWS, Docker, Git\nProjects:\n- Spark Distributed Streaming Pipeline\n- Enterprise Data Lake Architecture\nCertifications:\n- Databricks Certified Associate Data Engineer\nInternships:\n- Big Data Engineering Intern at DataVortex`;
    }

    try {
      const res = await api.uploadCV({ cvText: text, cvFileName: fName });
      setCvFileName(fName);
      setCvText(text);
      setExtractedCandidateSkills(res.extractedSkills || []);
      setSkillsConfirmedState(false);

      if (res.parsedInfo) {
        if (res.parsedInfo.projects?.length) setProjects(res.parsedInfo.projects);
        if (res.parsedInfo.certifications?.length) setCertifications(res.parsedInfo.certifications);
        if (res.parsedInfo.internships?.length) setInternships(res.parsedInfo.internships);
      }

      setExtractionAlert({
        type: 'success',
        message: `Loaded ${fName}. AI identified ${res.extractedSkills?.length || 0} skills! Review and confirm them below.`
      });
      showToast('success', `Preset CV loaded: ${res.extractedSkills?.length || 0} skills extracted.`);
      refreshUser();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load preset resume');
    } finally {
      setAiExtracting(false);
    }
  };

  // Add individual extracted skill to confirmed list
  const handleConfirmSingleExtracted = (skill: string) => {
    if (!confirmedSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      setConfirmedSkills([...confirmedSkills, skill]);
    }
    setExtractedCandidateSkills(extractedCandidateSkills.filter(s => s !== skill));
  };

  // Confirm all extracted skills at once
  const handleConfirmAllExtracted = () => {
    const combined = Array.from(new Set([...confirmedSkills, ...extractedCandidateSkills]));
    setConfirmedSkills(combined);
    setExtractedCandidateSkills([]);
  };

  // Add manual skill from autocomplete
  const handleAddManualSkill = (skill: string) => {
    if (!confirmedSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      setConfirmedSkills([...confirmedSkills, skill]);
      setSkillsConfirmedState(false);
    }
  };

  // Remove confirmed skill
  const handleRemoveConfirmedSkill = (skill: string) => {
    setConfirmedSkills(confirmedSkills.filter(s => s !== skill));
    setSkillsConfirmedState(false);
  };

  // Confirm Skills (Strict Requirement: ONLY confirmed skills are used for matching, and instantly updates all match scores & sends notification)
  const handleConfirmSkillsSubmit = async () => {
    if (confirmedSkills.length === 0) {
      showToast('error', 'Please add at least one technical skill before confirming.');
      return;
    }

    setConfirmingSkills(true);
    try {
      const res = await api.confirmSkills(confirmedSkills);
      setSkillsConfirmedState(true);
      showToast('success', `Skills confirmed! ${res.matchingJobCount || 0} job drives match your profile.`);
      refreshUser();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to confirm skills');
    } finally {
      setConfirmingSkills(false);
    }
  };

  // Save Full Profile Changes
  const handleSaveProfile = async () => {
    if (!validateInputs()) {
      showToast('error', 'Please resolve form validation errors before saving.');
      return;
    }

    setSavingProfile(true);
    try {
      await api.updateStudentProfile({
        photoUrl,
        linkedin: linkedin.trim(),
        github: github.trim(),
        phone: phone.trim(),
        confirmedSkills,
        projects,
        certifications,
        internships
      });

      showToast('success', 'Profile information saved successfully!');
      refreshUser();
      fetchProfile();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>AI Resume Intelligence & Master Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            CV & Profile Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Institutional verified academic records and AI-extracted technical credentials.
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-lg shadow-violet-500/25 transition flex items-center justify-center gap-2 self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          {savingProfile ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Profile Changes</span>
        </button>
      </div>

      {/* Profile Completeness Meter */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Profile Completeness Score
            </h3>
          </div>
          <span className="font-mono font-black text-sm text-amber-500">
            {completenessScore}%
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completenessScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              completenessScore >= 80
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : completenessScore >= 50
                ? 'bg-gradient-to-r from-violet-500 to-amber-400'
                : 'bg-gradient-to-r from-rose-500 to-amber-500'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 font-medium">
          <span className={user ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1' : ''}>
            <Check className="w-3 h-3" /> Master Record
          </span>
          <span className={photoUrl ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1' : ''}>
            {photoUrl ? <Check className="w-3 h-3" /> : '○'} Photo
          </span>
          <span className={cvFileName ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1' : ''}>
            {cvFileName ? <Check className="w-3 h-3" /> : '○'} CV Upload
          </span>
          <span className={confirmedSkills.length > 0 ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1' : ''}>
            {confirmedSkills.length > 0 ? <Check className="w-3 h-3" /> : '○'} Confirmed Skills ({confirmedSkills.length})
          </span>
          <span className={linkedin ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1' : ''}>
            {linkedin ? <Check className="w-3 h-3" /> : '○'} LinkedIn
          </span>
          <span className={github ? 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1' : ''}>
            {github ? <Check className="w-3 h-3" /> : '○'} GitHub
          </span>
        </div>
      </div>

      {/* 1. Verified Master Block (Strictly READ ONLY from Placement Cell) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Placement Cell Master Record (Locked / Verified)
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Academic Data
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Full Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                {profileData?.student?.name || user?.name}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Registration No</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 font-mono block mt-0.5">
                {profileData?.student?.regNo || user?.regNo}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Branch</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 block mt-0.5">
                {profileData?.student?.branch || user?.branch}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Discipline</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 block mt-0.5 truncate">
                {profileData?.student?.discipline || 'Engineering & Technology'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Year / Batch</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 block mt-0.5">
                {profileData?.student?.year || user?.year}th Year ({profileData?.student?.passoutBatch || user?.passoutBatch || 2026})
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">CGPA (Read-only)</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm block mt-0.5">
                {profileData?.student?.cgpa || user?.cgpa}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active Backlogs</span>
              <span className={`font-bold font-mono text-sm block mt-0.5 ${
                (profileData?.student?.backlogCount || user?.backlogCount || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {profileData?.student?.backlogCount ?? user?.backlogCount ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 sm:col-span-2">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">College / University</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                {profileData?.student?.college || 'National Institute of Engineering & Technology'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 sm:col-span-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Registered College Email</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                {profileData?.student?.email || user?.email}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Photo & Contact Links (Editable) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Photo Upload & Preview Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 flex flex-col items-center text-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Profile Photo
          </h3>

          <div className="relative group">
            <img
              src={photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'Student')}`}
              alt="Profile avatar"
              className="w-28 h-28 rounded-3xl object-cover bg-slate-100 dark:bg-slate-800 p-1 border-2 border-violet-300 dark:border-violet-700 shadow-md"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="absolute inset-0 rounded-3xl bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">Change Photo</span>
            </button>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
            onChange={handlePhotoFileChange}
            className="hidden"
          />

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="px-4 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 hover:bg-violet-100 text-xs font-bold transition border border-violet-200 dark:border-violet-800"
            >
              Upload Photo (Max 2 MB)
            </button>
            <p className="text-[10px] text-slate-400">Supported: PNG, JPEG, WEBP</p>
          </div>
        </div>

        {/* Contact Links & Phone */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
            Editable Contact & Social Presence
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (validationErrors.phone) setValidationErrors({ ...validationErrors, phone: undefined });
                  }}
                  placeholder="+91 98765 43210"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 ${
                    validationErrors.phone ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>
              {validationErrors.phone && (
                <p className="text-[10px] text-rose-600 mt-1">{validationErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => {
                    setLinkedin(e.target.value);
                    if (validationErrors.linkedin) setValidationErrors({ ...validationErrors, linkedin: undefined });
                  }}
                  placeholder="https://linkedin.com/in/username"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 ${
                    validationErrors.linkedin ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>
              {validationErrors.linkedin && (
                <p className="text-[10px] text-rose-600 mt-1">{validationErrors.linkedin}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GitHub Repository URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={github}
                  onChange={(e) => {
                    setGithub(e.target.value);
                    if (validationErrors.github) setValidationErrors({ ...validationErrors, github: undefined });
                  }}
                  placeholder="https://github.com/username"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 ${
                    validationErrors.github ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>
              {validationErrors.github && (
                <p className="text-[10px] text-rose-600 mt-1">{validationErrors.github}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CV Upload & AI Skill Extraction */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900/60 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              AI Resume Parser & Skill Extraction
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Supports PDF, DOCX, & TXT up to 5 MB
          </span>
        </div>

        {/* Upload Dropzone */}
        <div className="border-2 border-dashed border-violet-300 dark:border-violet-800/80 rounded-3xl p-6 text-center space-y-4 bg-violet-50/30 dark:bg-violet-950/20 hover:bg-violet-50/50 transition">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-sm">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {cvFileName ? `Current Resume: ${cvFileName}` : 'Upload your CV (PDF, DOCX, TXT)'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Extracts technical skills, projects, certifications, and contacts via offline explainable NLP engine.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleCvFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => cvInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-md shadow-violet-500/20 flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{cvFileName ? 'Change CV File' : 'Choose Resume File'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPasteFallback(!showPasteFallback)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {showPasteFallback ? 'Hide Paste Box' : 'Paste CV Text Fallback'}
            </button>
          </div>

          {/* Quick Demo Presets */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Or test presets:</span>
            <button
              type="button"
              onClick={() => loadPresetResume('fullstack')}
              className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-violet-50 text-[11px] font-semibold transition"
            >
              Full Stack CV
            </button>
            <button
              type="button"
              onClick={() => loadPresetResume('ml')}
              className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-violet-50 text-[11px] font-semibold transition"
            >
              Data Science CV
            </button>
            <button
              type="button"
              onClick={() => loadPresetResume('cloud')}
              className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-violet-50 text-[11px] font-semibold transition"
            >
              DevOps CV
            </button>
            <button
              type="button"
              onClick={() => loadPresetResume('dataeng')}
              className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-violet-50 text-[11px] font-semibold transition"
            >
              Big Data CV
            </button>
          </div>
        </div>

        {/* Fallback Paste Box */}
        <AnimatePresence>
          {showPasteFallback && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handlePastedTextSubmit}
              className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3"
            >
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Paste Your CV Text Fallback</span>
              </div>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the text from your resume here (e.g. Skills: Python, React, SQL, AWS...)"
                className="w-full p-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteFallback(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={aiExtracting}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
                >
                  Extract Skills from Pasted Text
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Processing Indicator */}
        {aiExtracting && (
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-3 text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>AI NLP Engine parsing document & normalizing aliases (e.g. py3 &rarr; Python)...</span>
          </div>
        )}

        {/* Extraction Feedback Alert */}
        {extractionAlert && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 ${
              extractionAlert.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {extractionAlert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{extractionAlert.message}</span>
            </div>
            <button onClick={() => setExtractionAlert(null)} className="text-slate-400 hover:text-slate-600">
              &times;
            </button>
          </motion.div>
        )}

        {/* Extracted Candidates Ready for Confirmation */}
        {extractedCandidateSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  AI Extracted Candidate Skills ({extractedCandidateSkills.length}) - Click to Confirm
                </h4>
              </div>
              <button
                type="button"
                onClick={handleConfirmAllExtracted}
                className="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition shadow-xs"
              >
                Add All to Confirmed
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {extractedCandidateSkills.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleConfirmSingleExtracted(skill)}
                  className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-amber-300 dark:border-amber-700 text-xs font-medium hover:bg-emerald-500 hover:text-white transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3 h-3 text-emerald-600" />
                  <span>{skill}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Confirmed Technical Skills Section */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <span>Confirmed Technical Skills ({confirmedSkills.length})</span>
                {skillsConfirmedState && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Skills Confirmed
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Only confirmed skills are used for AI job readiness matching and corporate ranking.
              </p>
            </div>

            {/* Prominent Confirm Skills Button */}
            <button
              type="button"
              onClick={handleConfirmSkillsSubmit}
              disabled={confirmingSkills || confirmedSkills.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                skillsConfirmedState
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/25 animate-pulse'
              } disabled:opacity-50`}
            >
              {confirmingSkills ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{skillsConfirmedState ? 'Re-Confirm Skills' : 'Confirm Skills for AI Matching'}</span>
            </button>
          </div>

          {confirmedSkills.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Upload your CV to get job matches
              </p>
              <p className="text-[11px] text-slate-400">
                Or use the "Add Master Skill" button to select skills manually from the master catalog.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <SkillChips
                skills={confirmedSkills}
                isEditable={true}
                onAddSkill={handleAddManualSkill}
                onRemoveSkill={handleRemoveConfirmedSkill}
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. Projects, Certifications & Internships (Extracted & Editable Lists) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-violet-600" />
            <span>Projects ({projects.length})</span>
          </h3>

          <div className="space-y-1.5 min-h-[80px]">
            {projects.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                <span className="truncate pr-2">{p}</span>
                <button
                  type="button"
                  onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-rose-600 p-0.5"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (newProject.trim()) {
              setProjects([...projects, newProject.trim()]);
              setNewProject('');
            }
          }} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="Add project title..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs outline-none"
            />
            <button type="submit" className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700">
              Add
            </button>
          </form>
        </div>

        {/* Certifications */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Certifications ({certifications.length})</span>
          </h3>

          <div className="space-y-1.5 min-h-[80px]">
            {certifications.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50">
                <span className="truncate pr-2">{c}</span>
                <button
                  type="button"
                  onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                  className="text-amber-600 hover:text-rose-600 p-0.5"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (newCert.trim()) {
              setCertifications([...certifications, newCert.trim()]);
              setNewCert('');
            }
          }} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newCert}
              onChange={(e) => setNewCert(e.target.value)}
              placeholder="Add certification..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs outline-none"
            />
            <button type="submit" className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700">
              Add
            </button>
          </form>
        </div>

        {/* Internships & Experience */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-teal-600" />
            <span>Internships ({internships.length})</span>
          </h3>

          <div className="space-y-1.5 min-h-[80px]">
            {internships.map((intern, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 text-xs text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-900/50">
                <span className="truncate pr-2">{intern}</span>
                <button
                  type="button"
                  onClick={() => setInternships(internships.filter((_, i) => i !== idx))}
                  className="text-teal-600 hover:text-rose-600 p-0.5"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (newInternship.trim()) {
              setInternships([...internships, newInternship.trim()]);
              setNewInternship('');
            }
          }} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newInternship}
              onChange={(e) => setNewInternship(e.target.value)}
              placeholder="Add internship role..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs outline-none"
            />
            <button type="submit" className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700">
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
