import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarClock,
  ClipboardList,
  CloudRain,
  Download,
  Droplets,
  FileText,
  Flame,
  HeartPulse,
  Leaf,
  Settings,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Utensils,
  Wind,
  X,
} from 'lucide-react';
import { generatePrescriptionPDF, generateDoshaCertificatePDF } from '../utils/pdfExport';
import { doshaDietRecommendations } from '../data';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import AdminTherapistPanel from '../components/AdminTherapistPanel';
import TherapistDashboard from '../components/TherapistDashboard';
import TherapistAvailabilityManager from '../components/TherapistAvailabilityManager';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PharmacistPortal from '../components/PharmacistPortal';
import StatCard from '../components/StatCard';
import PatientBookings from '../components/PatientBookings';
import PatientPrescriptionViewerModal from '../components/PatientPrescriptionViewerModal';
import DinacharyaPlanner from '../components/DinacharyaPlanner';
import SamsarjanaRecoveryTracker from '../components/SamsarjanaRecoveryTracker';
import PatientWellnessRoutine from '../components/PatientWellnessRoutine';
import TreatmentJourneyTimeline from '../components/TreatmentJourneyTimeline';
import PatientTreatmentHistory from '../components/PatientTreatmentHistory';
import TherapyRoomMatrix from '../components/TherapyRoomMatrix';
import MyFollowUpsPage from './MyFollowUpsPage';
import MedicalDocumentsPage from './MedicalDocumentsPage';
import { predictions, recoveryTrend, roleLabels, roleMenus, doshaTherapies } from '../data';

const fallbackDashboard = {
  stats: [],
  activities: [],
  modules: [],
};

// ─── Dosha banner (shown only for patients) ────────────────────
const doshaInfo = {
  VATA: { label: 'Vata', emoji: '🌬️', icon: Wind, color: 'from-[#e8f4fd] to-[#d0e8f8]', border: 'border-[#a8d0e8]', accent: '#4a8db5', badge: 'bg-[#d0e8f8] text-[#2d6a96]' },
  PITTA: { label: 'Pitta', emoji: '🔥', icon: Flame, color: 'from-[#fef3e2] to-[#fde8c8]', border: 'border-[#e8c898]', accent: '#c07830', badge: 'bg-[#fde8c8] text-[#a06030]' },
  KAPHA: { label: 'Kapha', emoji: '🌊', icon: Droplets, color: 'from-[#edf6e8] to-[#d8edd0]', border: 'border-[#b0d8a0]', accent: '#5a8553', badge: 'bg-[#d8edd0] text-[#3d6835]' },
  VATA_PITTA: { label: 'Vata-Pitta', emoji: '🌬️🔥', icon: Wind, color: 'from-[#e8f4fd] to-[#fde8c8]', border: 'border-[#cdbf9f]', accent: '#7d858c', badge: 'bg-[#ecdfcf] text-[#6f5f48]' },
  VATA_KAPHA: { label: 'Vata-Kapha', emoji: '🌬️🌊', icon: Wind, color: 'from-[#e8f4fd] to-[#d8edd0]', border: 'border-[#a8c8c0]', accent: '#547f84', badge: 'bg-[#dceee5] text-[#3f6765]' },
  PITTA_KAPHA: { label: 'Pitta-Kapha', emoji: '🔥🌊', icon: Flame, color: 'from-[#fef3e2] to-[#d8edd0]', border: 'border-[#d1c89c]', accent: '#8c7d42', badge: 'bg-[#efe7c8] text-[#75652d]' },
  TRIDOSHA: { label: 'Tridosha', emoji: '✨', icon: Sparkles, color: 'from-[#e8f4fd] via-[#fef3e2] to-[#d8edd0]', border: 'border-[#c8d4bd]', accent: '#637a58', badge: 'bg-[#e8efdf] text-[#52694b]' },
};

function DoshaCallToAction({ onStart }) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-[#dfe9d8] bg-white/80 p-4 shadow-sm backdrop-blur-md">
      <div className="absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-full bg-[#e8f4e0] blur-2xl" />
      <div className="noise-grid absolute inset-0 opacity-[0.04]" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6e6] text-sage">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="inline-block rounded-full bg-[#eef6e6] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sage">
              Personalised Ayurveda
            </span>
            <h2 className="mt-2 font-display text-xl font-bold leading-snug text-forest md:text-2xl">
              Discover Your Body Type
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-forest/65">
              Take the Dosha Assessment to unlock a personalised care plan, therapy recommendations, and Ayurvedic insights tailored to your constitution.
            </p>
          </div>
        </div>
        <button
          id="btn-start-dosha-assessment"
          onClick={onStart}
          className="shrink-0 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(62,109,67,0.2)] transition hover:translate-y-[-1px] hover:shadow-[0_14px_30px_rgba(62,109,67,0.26)] active:translate-y-0"
        >
          🌿 Take Dosha Assessment
        </button>
      </div>
    </div>
  );
}

function DoshaResultCard({ auth }) {
  const dosha = doshaInfo[auth?.dominantDosha] || null;
  if (!dosha) return null;
  const DoshaIcon = dosha.icon;
  const therapies = doshaTherapies[auth.dominantDosha] || [];

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl border border-emerald-900/10 bg-white/90 p-5 shadow-sm backdrop-blur-md space-y-3`}>
      <div className="noise-grid absolute inset-0 opacity-5" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-900">
            <DoshaIcon size={22} style={{ color: dosha.accent }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Your Body Type (Prakriti)</p>
            <h3 className="font-display text-xl font-bold leading-tight text-forest">
              {dosha.emoji} {dosha.label} Constitution
            </h3>
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${dosha.badge}`}>
          Dominant
        </span>
      </div>

      <div className="pt-2 border-t border-sand/30">
        <p className="text-xs font-bold text-forest/70 mb-2">Prescribed Ayurvedic Therapies for You:</p>
        <div className="flex flex-wrap gap-2">
          {therapies.map((t) => (
            <span key={t} className="rounded-xl bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
              🌿 {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DoshaSnapshotPanel({ auth }) {
  const dosha = doshaInfo[auth?.dominantDosha] || null;
  const assessedOn = auth?.doshaAssessmentDate
    ? new Date(auth.doshaAssessmentDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : 'Recently completed';

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-5 shadow-sm backdrop-blur-md w-full space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-sand/30 pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">
            Wellness Snapshot
          </p>
          <p className="font-display text-base font-bold text-forest mt-0.5">
            {auth?.fullName || 'Patient'} Care Summary
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-100/70 p-2.5 text-forest">
          <HeartPulse size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-sand/20 border border-sand/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Prakriti Status</p>
          <p className="mt-1 text-xs font-bold text-forest">
            {dosha ? `${dosha.label} Dominant` : 'Assessed'}
          </p>
        </div>
        <div className="rounded-2xl bg-sand/20 border border-sand/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Assessment Date</p>
          <p className="mt-1 text-xs font-bold text-forest">{assessedOn}</p>
        </div>
        <div className="rounded-2xl bg-sand/20 border border-sand/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Next Milestone</p>
          <p className="mt-1 text-xs font-bold text-forest">Post-Procedure Diet</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────
export default function DashboardPage({ auth, onLogout, onAuthUpdate }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab');
  const [dashboard, setDashboard] = useState(fallbackDashboard);
  const [patientTab, setPatientTab] = useState(currentTab || 'home');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isPatient = auth?.role === 'PATIENT';
  const isAdmin = auth?.role === 'ADMIN';
  const isTherapist = auth?.role === 'THERAPIST';
  const isPharmacist = auth?.role === 'PHARMACIST';

  if (isPharmacist) {
    return <PharmacistPortal auth={auth} onLogout={onLogout} />;
  }

  const doshaCompleted = Boolean(
    auth?.doshaAssessmentCompleted === true ||
    auth?.doshaAssessmentCompleted === 'true' ||
    auth?.dominantDosha,
  );

  const [adminActiveTab, setAdminActiveTab] = useState('OVERVIEW');

  function handleAdminCreateClick() {
    setAdminActiveTab('STAFF');
    setTimeout(() => {
      const formEl = document.getElementById('staff-creation-form') || document.getElementById('admin-therapist-panel');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const nameInput = document.getElementById('staff-name-input');
        if (nameInput) nameInput.focus();
      }
    }, 100);
  }

  useEffect(() => {
    const validTabs = [
      'home', 'sessions', 'patients', 'consultations', 'therapies',
      'treatment-plans', 'prescriptions', 'notes',
      'availability', 'requests', 'reports', 'resources',
      'treatment', 'appointments', 'wellness', 'profile', 'complaints', 'settings',
      'followups', 'documents'
    ];
    if (currentTab && validTabs.includes(currentTab)) {
      setPatientTab(currentTab);
    }
  }, [currentTab]);

  const handleTabChange = (tabId) => {
    setPatientTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [prescriptionViewerOpen, setPrescriptionViewerOpen] = useState(false);
  const [selectedPrescriptionForView, setSelectedPrescriptionForView] = useState(null);

  // Complaints state
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    mainComplaint: '',
    otherComplaint: '',
    symptoms: [],
    bodyArea: '',
    severity: 'MILD',
    durationValue: '',
    durationUnit: 'DAYS',
    frequency: 'OCCASIONAL',
    painLevel: 5,
    additionalDetails: '',
  });
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintStep, setComplaintStep] = useState(1); // 1=form, 2=review

  const [notifPrefs, setNotifPrefs] = useState({
    inAppNotif: true,
    emailNotif: true,
    reminderNotif: true,
  });

  // Load notification preferences from backend on mount
  useEffect(() => {
    async function loadNotifPrefs() {
      try {
        const { data } = await api.get('/patient/notification-prefs');
        const merged = {
          inAppNotif: data.inAppNotif !== false,
          emailNotif: data.emailNotif !== false,
          reminderNotif: true, // frontend-only reminder pref
        };
        const saved = localStorage.getItem('panchakarma-notif-prefs');
        if (saved) {
          const local = JSON.parse(saved);
          merged.reminderNotif = local.reminderNotif !== false;
        }
        setNotifPrefs(merged);
        localStorage.setItem('panchakarma-notif-prefs', JSON.stringify(merged));
      } catch {
        // fallback to localStorage
        const saved = localStorage.getItem('panchakarma-notif-prefs');
        if (saved) setNotifPrefs(JSON.parse(saved));
      }
    }
    loadNotifPrefs();
  }, []);

  const handleToggleNotif = async (key) => {
    setNotifPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('panchakarma-notif-prefs', JSON.stringify(updated));
      // Persist inAppNotif and emailNotif to backend
      if (key === 'inAppNotif' || key === 'emailNotif') {
        api.patch('/patient/notification-prefs', { [key]: updated[key] }).catch(() => {});
      }
      return updated;
    });
  };

  const loadDashboardData = async () => {
    try {
      const { data } = await api.get('/dashboard');
      setDashboard(data);
    } catch {
      setDashboard(fallbackDashboard);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      loadDashboardData();
    }
    if (isPatient) {
      api.get('/patient/prescriptions')
        .then((res) => setPrescriptions(res.data || []))
        .catch((err) => console.error('Prescriptions API error', err));

      api.get('/patient/reports')
        .then((res) => setReports(res.data || []))
        .catch((err) => console.error('Reports API error', err));

      api.get('/patient/complaints')
        .then((res) => setComplaints(res.data || []))
        .catch((err) => console.error('Complaints API error', err));
    }
  }, [isAdmin, isPatient]);

  const fetchComplaints = () => {
    setComplaintsLoading(true);
    api.get('/patient/complaints')
      .then((res) => setComplaints(res.data || []))
      .catch(() => {})
      .finally(() => setComplaintsLoading(false));
  };

  const handleComplaintSymptomToggle = (enumVal) => {
    setComplaintForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(enumVal)
        ? prev.symptoms.filter(s => s !== enumVal)
        : [...prev.symptoms, enumVal],
    }));
  };

  const handleComplaintSubmit = async () => {
    setComplaintSubmitting(true);
    try {
      await api.post('/patient/complaints', {
        mainComplaint: complaintForm.mainComplaint,
        otherComplaint: complaintForm.mainComplaint === 'OTHER' ? complaintForm.otherComplaint : '',
        symptoms: complaintForm.symptoms.map(s => ({ symptomName: s, otherSymptomDetails: '' })),
        bodyArea: complaintForm.bodyArea,
        severity: complaintForm.severity,
        durationValue: parseInt(complaintForm.durationValue) || 1,
        durationUnit: complaintForm.durationUnit,
        frequency: complaintForm.frequency,
        painLevel: parseInt(complaintForm.painLevel),
        additionalDetails: complaintForm.additionalDetails,
      });
      setComplaintModalOpen(false);
      setComplaintStep(1);
      setComplaintForm({ mainComplaint: '', otherComplaint: '', symptoms: [], bodyArea: '', severity: 'MILD', durationValue: '', durationUnit: 'DAYS', frequency: 'OCCASIONAL', painLevel: 5, additionalDetails: '' });
      fetchComplaints();
    } catch (err) {
      alert('Failed to submit complaint. Please try again.');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const COMPLAINT_OPTIONS = [
    { label: 'Joint Pain', value: 'JOINT_PAIN' }, { label: 'Back Pain', value: 'BACK_PAIN' },
    { label: 'Neck Pain', value: 'NECK_PAIN' }, { label: 'Headache / Migraine', value: 'HEADACHE_MIGRAINE' },
    { label: 'Muscle Pain', value: 'MUSCLE_PAIN' }, { label: 'Body Stiffness', value: 'BODY_STIFFNESS' },
    { label: 'Stress / Anxiety', value: 'STRESS_ANXIETY' }, { label: 'Sleep Problem', value: 'SLEEP_PROBLEM' },
    { label: 'Digestive Problem', value: 'DIGESTIVE_PROBLEM' }, { label: 'Constipation', value: 'CONSTIPATION' },
    { label: 'Acidity / Heartburn', value: 'ACIDITY_HEARTBURN' }, { label: 'Skin Problem', value: 'SKIN_PROBLEM' },
    { label: 'Fatigue / Low Energy', value: 'FATIGUE_LOW_ENERGY' }, { label: 'Respiratory Problem', value: 'RESPIRATORY_PROBLEM' },
    { label: 'Other', value: 'OTHER' },
  ];
  const SYMPTOM_OPTIONS = [
    { label: 'Pain', value: 'PAIN' }, { label: 'Stiffness', value: 'STIFFNESS' }, { label: 'Swelling', value: 'SWELLING' },
    { label: 'Difficulty Moving', value: 'DIFFICULTY_MOVING' }, { label: 'Weakness', value: 'WEAKNESS' },
    { label: 'Fatigue', value: 'TIREDNESS_FATIGUE' }, { label: 'Headache', value: 'HEADACHE' },
    { label: 'Dizziness', value: 'DIZZINESS' }, { label: 'Poor Sleep', value: 'POOR_SLEEP' },
    { label: 'Stress', value: 'STRESS' }, { label: 'Bloating', value: 'BLOATING' },
    { label: 'Nausea', value: 'NAUSEA' }, { label: 'Indigestion', value: 'INDIGESTION' },
    { label: 'Itching', value: 'ITCHING' }, { label: 'Cough', value: 'COUGH' },
  ];
  const BODY_AREA_OPTIONS = [
    { label: 'Head', value: 'HEAD' }, { label: 'Neck', value: 'NECK' }, { label: 'Shoulder', value: 'SHOULDER' },
    { label: 'Chest', value: 'CHEST' }, { label: 'Upper Back', value: 'UPPER_BACK' }, { label: 'Lower Back', value: 'LOWER_BACK' },
    { label: 'Abdomen', value: 'ABDOMEN_STOMACH' }, { label: 'Arm', value: 'ARM' }, { label: 'Knee', value: 'KNEE' },
    { label: 'Ankle', value: 'ANKLE' }, { label: 'Hip', value: 'HIP' }, { label: 'Full Body', value: 'FULL_BODY' },
    { label: 'Multiple Areas', value: 'MULTIPLE_AREAS' }, { label: 'Not Applicable', value: 'NOT_APPLICABLE' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5faf2] flex font-body text-forest antialiased relative">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb left-[-4rem] top-24 h-72 w-72 bg-[#d7e6cb]" />
        <div className="ambient-orb right-[-5rem] top-12 h-80 w-80 bg-[#ebd5b7]" />
        <div className="noise-grid absolute inset-0 opacity-[0.08]" />
      </div>

      {/* Fixed Desktop Left Sidebar */}
      {(isPatient || isTherapist) && (
        <Sidebar
          activeTab={patientTab}
          onTabChange={handleTabChange}
          isCollapsed={isCollapsed}
          onToggleCollapse={setIsCollapsed}
          role={auth?.role || 'PATIENT'}
          onLogout={onLogout}
        />
      )}

      {/* Main Layout Area */}
      <main className={`flex-1 min-w-0 ml-0 transition-all duration-300 flex flex-col ${(isPatient || isTherapist) ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-[260px]') : ''}`}>
        {/* Sticky Header for Right Pane */}
        <Header
          auth={auth}
          onLogout={onLogout}
          onAdminCreateClick={handleAdminCreateClick}
          activeTab={patientTab}
          onTabChange={handleTabChange}
        />

        {isAdmin ? (
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 motion-fade-in-up">
            <AdminTherapistPanel activeTab={adminActiveTab} onTabChange={setAdminActiveTab} />
          </section>
        ) : isTherapist ? (
          patientTab === 'availability' ? (
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 motion-fade-in-up">
              {/* Back button */}
              <button
                onClick={() => handleTabChange('home')}
                className="flex items-center gap-2 rounded-xl border border-[#cfe0c2] bg-white/80 px-4 py-2 text-sm font-semibold text-[#1F4D3A]/80 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-[#1F4D3A]"
              >
                ← Back to Dashboard
              </button>
              <section className="panel-frost rounded-[2rem] p-6 bg-white/80 relative overflow-hidden">
                <div className="ambient-orb right-[-2rem] top-[-2rem] h-32 w-32 bg-[#cce4c0] opacity-40" />
                <div className="relative">
                  <TherapistAvailabilityManager />
                </div>
              </section>
            </section>
          ) : (
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 motion-fade-in-up">
              <TherapistDashboard activeTab={patientTab} onTabChange={handleTabChange} auth={auth} />
            </section>
          )
        ) : (
          /* PATIENT DASHBOARD */
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 motion-fade-in-up">
            <div className="w-full space-y-8">
              {/* TAB 1: HOME VIEW */}

              {(patientTab === 'home' || !patientTab) && (
                <div className="space-y-8">
                  {/* 1. TOP HERO BANNER */}
                  <section className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#1e382b] via-[#2c4c34] to-[#162e21] text-white shadow-xl border border-emerald-800/80">
                    <div className="ambient-orb right-[-2rem] top-[-2rem] h-56 w-56 bg-emerald-400/20 blur-3xl" />
                    <div className="ambient-orb bottom-[-2rem] left-[10%] h-64 w-64 bg-amber-300/10 blur-3xl" />
                    <div className="noise-grid absolute inset-0 opacity-[0.06]" />

                    <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* Left Column: Greeting, Description, Tip & Buttons */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-900/60 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200 backdrop-blur-md">
                          🌿 Personal Care Companion
                        </div>

                        <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight text-amber-50">
                          {new Date().getHours() < 12
                            ? 'Good Morning'
                            : new Date().getHours() < 17
                              ? 'Good Afternoon'
                              : 'Good Evening'}
                          , {auth?.fullName || 'Patient'} 🌿
                        </h1>

                        <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed max-w-xl">
                          Welcome to your Panchakarma healing portal. Track your upcoming therapies, personalized nutrition guidelines, and daily recovery routines in one place.
                        </p>

                        {/* Daily Health Tip Callout */}
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-2xl p-2.5 px-4 text-xs font-medium text-amber-100 backdrop-blur-md">
                          <Sparkles size={16} className="text-amber-300 shrink-0" />
                          <span><strong>Today&apos;s Health Tip:</strong> Sip warm cumin-coriander tea throughout the day to nourish your digestive fire (Agni).</span>
                        </div>
                      </div>

                      {/* Right Column: Score Ring Card */}
                      <div className="lg:col-span-5 flex justify-center lg:justify-end items-center">
                        <div className="flex items-center gap-4 bg-white/10 border border-white/15 rounded-3xl p-5 px-6 backdrop-blur-md shadow-lg w-full max-w-sm">
                          <div className="relative h-16 w-16 shrink-0 flex items-center justify-center font-bold text-white text-base">
                            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-emerald-900"
                                strokeWidth="3.5"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-amber-300"
                                strokeDasharray="88, 100"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <span className="absolute text-xs font-extrabold text-amber-200">88%</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">Wellness Progress</p>
                            <p className="text-base font-extrabold text-white leading-tight">Optimal Agni & Digestion</p>
                            <p className="text-xs text-emerald-200/80 font-medium">Body Type: {auth?.dominantDosha ? String(auth.dominantDosha).replace('_', '-') : 'Not Assessed Yet'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 3. TREATMENT JOURNEY PROGRESS TIMELINE (FULL WIDTH) */}
                  <TreatmentJourneyTimeline />

                  {/* 4. UNDERSTANDABLE AYURVEDIC PROFILE & DOSHA ENERGY BALANCE */}
                  <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-7 space-y-6">
                      <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-6 shadow-sm backdrop-blur-md space-y-5">
                        <div className="flex items-center justify-between border-b border-sand/30 pb-3">
                          <div>
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                              🌿 Constitutional Blueprint
                            </div>
                            <h2 className="font-display text-2xl font-bold text-forest mt-1">Your Body Constitution (Prakriti)</h2>
                            <p className="text-xs text-forest/70">Understanding your Vata, Pitta, and Kapha energy balance</p>
                          </div>

                          <span className="rounded-full bg-amber-100 text-amber-900 px-3.5 py-1 text-xs font-bold">
                            {auth?.dominantDosha ? `${String(auth.dominantDosha).replace('_', '-')} Dominant` : 'Not Assessed Yet'}
                          </span>
                        </div>

                        {/* 3 Dosha Bars with Clear Explanations */}
                        <div className="space-y-4">
                          {/* Vata */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-forest">
                              <span>🌬️ Vata (Air & Movement - Controls circulation & nerves)</span>
                              <span className="text-blue-700 font-semibold">30% - Balanced</span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-blue-100 overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: '30%' }} />
                            </div>
                          </div>

                          {/* Pitta */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-forest">
                              <span>🔥 Pitta (Fire & Digestion - Controls heat & metabolism)</span>
                              <span className="text-amber-800 font-extrabold">50% - Primary Constitution</span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-amber-100 overflow-hidden">
                              <div className="h-full bg-amber-600 rounded-full transition-all duration-500" style={{ width: '50%' }} />
                            </div>
                          </div>

                          {/* Kapha */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-forest">
                              <span>🌊 Kapha (Earth & Structure - Controls stability & immunity)</span>
                              <span className="text-emerald-700 font-semibold">20% - Stable</span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-emerald-100 overflow-hidden">
                              <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: '20%' }} />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed space-y-1">
                          <p className="font-bold flex items-center gap-1.5 text-amber-950">
                            💡 What this means for your daily health:
                          </p>
                          <p>
                            Your constitution is naturally high in <strong>Pitta (Fire element)</strong>. To stay balanced, focus on cooling foods (coconut water, cow ghee, fresh sweet fruits) and avoid excessive direct heat or spicy peppers.
                          </p>
                        </div>
                      </div>

                      {/* 4. TODAY'S DAILY WELLNESS ROUTINE (DINACHARYA) */}
                      <PatientWellnessRoutine />

                      {/* 4B. TREATMENT HISTORY QUICK ACCESS */}
                      <div className="rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-emerald-900 via-[#1b3d2b] to-[#122c1e] p-5 shadow-sm text-white space-y-3 relative overflow-hidden">
                        <div className="ambient-orb right-[-2rem] top-[-2rem] h-32 w-32 bg-emerald-400/20 blur-2xl" />
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-800/80 text-emerald-200">
                              <Stethoscope size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Clinical History Log</p>
                              <h3 className="font-display text-lg font-bold leading-snug text-white">Your Treatment History</h3>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTabChange('treatment')}
                            className="shrink-0 rounded-2xl bg-emerald-100 px-4 py-2 text-xs font-extrabold text-emerald-950 shadow-xs hover:bg-white transition cursor-pointer"
                          >
                            View Full History →
                          </button>
                        </div>
                        <p className="text-xs text-emerald-100/80 leading-relaxed relative z-10">
                          Access past Panchakarma therapy records, doctor notes, recorded vitals (BP/Pulse), and download official clinical summary PDFs.
                        </p>
                      </div>
                    </div>

                    {/* Right Column: Personal Nutrition */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* 6. PERSONALIZED NUTRITION (PATHYA & APATHYA) */}
                      <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-5 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-sand/30 pb-3 gap-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Personalized Diet Plan (Pathya & Apathya)</p>
                            <h3 className="font-display text-lg font-bold text-forest flex items-center gap-2 flex-wrap">
                              <span>Recommended Foods & Habits</span>
                              {auth?.dominantDosha && (
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                                  Body Type: {String(auth.dominantDosha).replace('_', '-')}
                                </span>
                              )}
                            </h3>
                          </div>
                          <Utensils size={20} className="text-amber-700 hidden sm:block shrink-0" />
                        </div>

                        {/* Active Dosha Diet Display - Strictly based on dominant body type */}
                        {(() => {
                          if (!auth?.dominantDosha) {
                            return (
                              <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-5 text-center space-y-3">
                                <p className="text-xs text-amber-950 font-semibold leading-relaxed">
                                  You haven&apos;t taken your Ayurvedic Dosha assessment yet. Complete the 2-minute assessment to diagnose your dominant Prakriti and view personalized food recommendations.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => navigate('/dosha-assessment')}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1b3d2b] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#122c1e] transition cursor-pointer"
                                >
                                  <Sparkles size={14} /> Take Dosha Assessment Now
                                </button>
                              </div>
                            );
                          }
                          const activeDoshaKey = String(auth.dominantDosha).toUpperCase().replace('-', '_');
                          const diet = doshaDietRecommendations[activeDoshaKey] || doshaDietRecommendations.VATA;
                          return (
                            <div className="space-y-3 pt-1">
                              <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                                    {diet.doshaName} Constitution Guide
                                  </span>
                                  <span className="text-[11px] font-semibold text-amber-800 italic">
                                    {diet.tagline}
                                  </span>
                                </div>
                                <p className="text-[11px] text-amber-950/80 mt-1 font-medium leading-relaxed">
                                  <strong>Core Rule:</strong> {diet.keyPrinciples}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* EAT (PATHYA) */}
                                <div className="rounded-2xl bg-emerald-50/90 border border-emerald-200 p-3.5 space-y-2">
                                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 border-b border-emerald-200/60 pb-1.5">
                                    🟢 Pathya (Foods to Take & Enjoy)
                                  </p>
                                  <ul className="text-[11px] text-emerald-950/90 space-y-1.5 list-disc pl-4 leading-relaxed font-medium">
                                    {diet.pathya.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>

                                {/* AVOID (APATHYA) */}
                                <div className="rounded-2xl bg-rose-50/90 border border-rose-200 p-3.5 space-y-2">
                                  <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5 border-b border-rose-200/60 pb-1.5">
                                    🔴 Apathya (Foods to Avoid / Limit)
                                  </p>
                                  <ul className="text-[11px] text-rose-950/90 space-y-1.5 list-disc pl-4 leading-relaxed font-medium">
                                    {diet.apathya.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              <div className="text-[11px] text-forest/75 bg-sand/20 border border-sand/40 p-2.5 rounded-xl text-center font-medium">
                                🕒 <strong>Best Meal Schedule for {diet.doshaName}:</strong> {diet.bestMealTiming}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 7. SEASONAL HEALTH GUIDE */}
                      <div className="rounded-3xl border border-teal-900/10 bg-gradient-to-br from-teal-50/80 to-emerald-50/80 p-5 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-teal-950 font-bold text-sm border-b border-teal-200/60 pb-2">
                          <CloudRain size={20} className="text-teal-700" />
                          <span>Monsoon Seasonal Health Care 🌧️</span>
                        </div>

                        <ul className="space-y-2 text-xs text-teal-950/85 leading-relaxed">
                          <li className="flex items-start gap-2">
                            <span className="text-teal-600 font-bold">•</span>
                            <span>Prefer warm boiled water; avoid raw uncooked salads during rains.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-teal-600 font-bold">•</span>
                            <span>Sip warm ginger tea before meals to stimulate digestion.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-teal-600 font-bold">•</span>
                            <span>Practice gentle alternate-nostril breathing (Pranayama) 10 mins daily.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 2: TREATMENT VIEW */}
              {/* TAB 2: TREATMENT HISTORY (INCLUDES CONSULTATIONS & THERAPIES SEPARATELY) */}
              {patientTab === 'treatment' && (
                <div className="space-y-8">
                  <PatientTreatmentHistory auth={auth} />
                  <TreatmentJourneyTimeline />
                  <SamsarjanaRecoveryTracker patientId={auth?.userId} patientName={auth?.fullName} />
                </div>
              )}

              {/* TAB 3: APPOINTMENTS VIEW */}
              {(patientTab === 'appointments' || patientTab === 'consultations' || patientTab === 'therapies') && (
                <div className="w-full space-y-8">
                  <PatientBookings />
                </div>
              )}

              {/* TAB 4: PRESCRIPTIONS VIEW (Step 6 & 7) */}
              {patientTab === 'prescriptions' && (
                <div className="space-y-8">
                  <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-6 md:p-8 shadow-sm backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-900">
                        <FileText size={14} /> My Prescriptions
                      </span>
                      <h2 className="mt-2 font-display text-2xl font-bold text-forest">Your Clinical Prescriptions</h2>
                      <p className="mt-1 text-sm text-forest/70 max-w-xl">
                        View official Panchakarma therapy plans, herbal formulations, diet advice, and download official PDF prescriptions.
                      </p>
                    </div>
                  </div>

                  {/* Prescriptions Table (Step 6) */}
                  <div className="bg-white/95 border border-sand/40 rounded-3xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-sand/40 bg-sand/10 text-xs font-bold text-forest/70 uppercase tracking-wider">
                          <th className="py-3.5 px-4">Date</th>
                          <th className="py-3.5 px-4">Doctor</th>
                          <th className="py-3.5 px-4">Therapy</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand/20 text-xs">
                        {prescriptions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-forest/60">
                              No clinical prescriptions found yet.
                            </td>
                          </tr>
                        ) : (
                          prescriptions.map((p) => {
                            const dateFormatted = p.createdAt
                              ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                              : (p.date ? new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A');
                            return (
                              <tr key={p.id || p.medicineName || Math.random()} className="hover:bg-sand/10 transition">
                                <td className="py-4 px-4 font-bold text-forest">{dateFormatted}</td>
                                <td className="py-4 px-4 font-semibold text-forest/80">{p.doctorName || p.therapistName || 'Attending Practitioner'}</td>
                                <td className="py-4 px-4 font-bold text-emerald-950">
                                  {p.therapyName || p.purpose || p.medicineName || 'Clinical Consultation'}
                                </td>
                                <td className="py-4 px-4">
                                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                    {p.status || 'Available'}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPrescriptionForView(p);
                                      setPrescriptionViewerOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1b3d2b] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#122c1e] transition cursor-pointer"
                                  >
                                    <FileText size={14} /> View Prescription
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB COMPLAINTS VIEW */}
              {patientTab === 'complaints' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-6 md:p-8 shadow-sm backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 px-3 py-1 text-xs font-bold text-rose-900">
                        <ClipboardList size={14} /> Health Complaints &amp; Symptoms
                      </span>
                      <h2 className="mt-2 font-display text-2xl font-bold text-forest">My Reported Health Concerns</h2>
                      <p className="mt-1 text-sm text-forest/70 max-w-xl">
                        Log your symptoms, track severity levels, and let your Ayurvedic practitioner review your health concerns.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setComplaintModalOpen(true); setComplaintStep(1); }}
                      className="shrink-0 flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-5 py-3 text-xs font-bold text-white shadow-md transition hover:shadow-lg cursor-pointer"
                    >
                      <ClipboardList size={16} /> + Log New Complaint
                    </button>
                  </div>

                  {/* Complaints Table */}
                  {complaintsLoading ? (
                    <div className="rounded-3xl border border-emerald-900/10 bg-white/80 p-12 text-center text-forest/60 text-sm">
                      Loading your health complaints...
                    </div>
                  ) : complaints.length === 0 ? (
                    <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-12 text-center space-y-4 shadow-xs">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100/80 text-rose-700">
                        <ClipboardList size={28} />
                      </div>
                      <h3 className="font-display text-lg font-bold text-forest">No Complaints Recorded Yet</h3>
                      <p className="text-xs text-forest/65 max-w-md mx-auto">
                        You haven't logged any health complaints yet. Click below to log symptoms for your doctor's review.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setComplaintModalOpen(true); setComplaintStep(1); }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#1b3d2b] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#122c1e] transition mt-2 cursor-pointer"
                      >
                        <ClipboardList size={15} /> Log First Complaint
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-emerald-900/10 bg-white/90 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-forest">
                          <thead className="bg-[#f2f8ee] border-b border-emerald-900/10 text-[11px] font-bold uppercase tracking-wider text-forest/70">
                            <tr>
                              <th className="py-4 px-6">Date Logged</th>
                              <th className="py-4 px-6">Main Complaint</th>
                              <th className="py-4 px-6 text-center">Severity</th>
                              <th className="py-4 px-6 text-center">Duration</th>
                              <th className="py-4 px-6 text-center">Frequency</th>
                              <th className="py-4 px-6 text-center">Pain Level</th>
                              <th className="py-4 px-6 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-900/5">
                            {complaints.map((c) => (
                              <tr key={c.id} className="hover:bg-emerald-50/40 transition duration-150">
                                <td className="py-4 px-6 whitespace-nowrap font-medium text-forest/80">
                                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                </td>
                                <td className="py-4 px-6 font-bold text-forest max-w-[180px] truncate">
                                  {(c.mainComplaint || '').replace(/_/g, ' ')}
                                  {c.otherComplaint && <span className="text-forest/60 font-normal ml-1">— {c.otherComplaint}</span>}
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                    (c.severity || '').toLowerCase() === 'severe' ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : (c.severity || '').toLowerCase() === 'moderate' ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  }`}>
                                    {c.severity || 'MILD'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-center font-medium text-forest/80">
                                  {c.durationValue} {(c.durationUnit || '').toLowerCase()}
                                </td>
                                <td className="py-4 px-6 text-center font-medium text-forest/70">
                                  {(c.frequency || '—').replace(/_/g, ' ')}
                                </td>
                                <td className="py-4 px-6 text-center font-bold text-forest">
                                  {c.painLevel != null ? `${c.painLevel}/10` : '—'}
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <span className="inline-block bg-emerald-100/80 text-emerald-900 px-3 py-1 rounded-full font-extrabold text-[10px] uppercase">
                                    {c.status || 'Submitted'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB MY FOLLOW-UPS */}
              {patientTab === 'followups' && <MyFollowUpsPage />}

              {/* TAB MEDICAL DOCUMENTS */}
              {patientTab === 'documents' && <MedicalDocumentsPage />}

              {/* TAB 5: REPORTS VIEW */}
              {patientTab === 'reports' && (
                <div className="space-y-8">
                  <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-6 md:p-8 shadow-sm backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100/80 px-3 py-1 text-xs font-bold text-teal-900">
                        <ClipboardList size={14} /> Health Analytics & Clinical Progress
                      </span>
                      <h2 className="mt-2 font-display text-2xl font-bold text-forest">Patient Health & Recovery Reports</h2>
                      <p className="mt-1 text-sm text-forest/70 max-w-xl">
                        Monitor your Panchakarma recovery progress, vital signs, Dosha constitution report, and download official clinical certificates.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!auth?.dominantDosha) {
                          alert('Please complete your Dosha Assessment first before downloading the certificate.');
                          return;
                        }
                        generateDoshaCertificatePDF({
                          patientName: auth?.fullName || 'Valued Patient',
                          patientEmail: auth?.email || '',
                          primaryDosha: auth?.dominantDosha,
                          prakritiDetails: `${String(auth.dominantDosha).replace(/_/g, '-')}-dominant constitution assessed through personalized Prakriti evaluation.`,
                          vataScore: auth?.vataScore ?? 0,
                          pittaScore: auth?.pittaScore ?? 0,
                          kaphaScore: auth?.kaphaScore ?? 0,
                          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        });
                      }}
                      className="shrink-0 flex items-center gap-2 rounded-2xl bg-[#1b3d2b] px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#122c1e] hover:shadow-lg cursor-pointer"
                    >
                      <Download size={16} /> Download Health Certificate (PDF)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-4 shadow-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Overall Recovery</p>
                      <h3 className="text-2xl font-black text-emerald-900 mt-1">92%</h3>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">↑ +8% vs last week</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-4 shadow-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Dosha Type</p>
                      <h3 className="text-xl font-black text-amber-900 mt-1 truncate">{auth?.dominantDosha ? String(auth.dominantDosha).replace(/_/g, '-') : '—'}</h3>
                      <p className="text-[11px] text-amber-700 font-semibold mt-0.5">{auth?.dominantDosha ? 'Prakriti Assessed' : 'Not Assessed Yet'}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-4 shadow-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Completed Sessions</p>
                      <h3 className="text-2xl font-black text-teal-900 mt-1">5 / 7</h3>
                      <p className="text-[11px] text-teal-700 font-semibold mt-0.5">Abhyanga & Shirodhara</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-4 shadow-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Symptom Reduction</p>
                      <h3 className="text-2xl font-black text-emerald-900 mt-1">-75%</h3>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Joint Stiffness & Fatigue</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-lg font-bold text-forest">7-Week Panchakarma Vitality & Recovery Trend</h3>
                        <p className="text-xs text-forest/65">Visual progress tracking energy index, digestion fire (Agni), and symptom resolution.</p>
                      </div>
                    </div>
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={recoveryTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="week" stroke="#475569" fontSize={12} />
                          <YAxis stroke="#475569" fontSize={12} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="vitality" name="Vitality Index (%)" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="symptomReduction" name="Symptom Relief (%)" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SETTINGS VIEW */}
              {patientTab === 'settings' && (
                <div className="space-y-8">
                  <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-6 md:p-8 shadow-sm backdrop-blur-md">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-900">
                      <Settings size={14} /> Account & Health Settings
                    </span>
                    <h2 className="mt-2 font-display text-2xl font-bold text-forest">Manage Profile & Preferences</h2>
                    <p className="mt-1 text-sm text-forest/70">
                      Review personal information, retake your Dosha Prakriti assessment, and configure notification preferences.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-sand/30 pb-3">
                        <h3 className="font-display text-lg font-bold text-forest">Personal Profile Details</h3>
                        <button
                          type="button"
                          onClick={() => navigate('/profile')}
                          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                        >
                          View / Edit Full Profile
                        </button>
                      </div>

                      <div className="space-y-3 text-xs text-forest">
                        <div className="flex justify-between py-1 border-b border-sand/20">
                          <span className="font-semibold text-forest/60">Full Name:</span>
                          <span className="font-bold text-forest">{auth?.fullName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-sand/20">
                          <span className="font-semibold text-forest/60">Email Address:</span>
                          <span className="font-bold text-forest">{auth?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-sand/20">
                          <span className="font-semibold text-forest/60">User Role:</span>
                          <span className="font-bold text-emerald-800 uppercase">{auth?.role || 'PATIENT'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-sand/20">
                          <span className="font-semibold text-forest/60">Dominant Dosha:</span>
                          <span className="font-bold text-forest">{auth?.dominantDosha ? String(auth.dominantDosha).replace(/_/g, '-') : 'Not Assessed'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-sand/30 pb-3">
                        <div>
                          <h3 className="font-display text-lg font-bold text-forest flex items-center gap-2">
                            <Bell size={18} className="text-emerald-800" /> Booking Notification Settings
                          </h3>
                          <p className="text-xs text-forest/65 mt-0.5">Configure in-app and email alerts when a therapy session is booked.</p>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          Active
                        </span>
                      </div>

                      <div className="space-y-3 pt-1 text-xs">
                        {/* In-App Notification Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-2xl border border-sand/40 bg-[#faf8f4]">
                          <div className="space-y-0.5 pr-3">
                            <span className="font-bold text-forest block">🔔 In-App Booking Notifications</span>
                            <span className="text-[11px] text-forest/70 block">Receive instant popups and header bell alerts when a session is booked.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleNotif('inAppNotif')}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${notifPrefs.inAppNotif ? 'bg-emerald-700' : 'bg-gray-300'}`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${notifPrefs.inAppNotif ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        {/* Email Notification Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-2xl border border-sand/40 bg-[#faf8f4]">
                          <div className="space-y-0.5 pr-3">
                            <span className="font-bold text-forest block">📧 Email Booking Confirmation</span>
                            <span className="text-[11px] text-forest/70 block">Send instant confirmation & calendar invite to {auth?.email || 'your registered email'}.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleNotif('emailNotif')}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${notifPrefs.emailNotif ? 'bg-emerald-700' : 'bg-gray-300'}`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${notifPrefs.emailNotif ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        {/* Pre-Session Reminders */}
                        <div className="flex items-center justify-between p-3 rounded-2xl border border-sand/40 bg-[#faf8f4]">
                          <div className="space-y-0.5 pr-3">
                            <span className="font-bold text-forest block">🌿 Pre-Session Guidelines</span>
                            <span className="text-[11px] text-forest/70 block">Send pre-procedure oleation and diet preparation tips 24 hours prior.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleNotif('reminderNotif')}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${notifPrefs.reminderNotif ? 'bg-emerald-700' : 'bg-gray-300'}`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${notifPrefs.reminderNotif ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: WELLNESS VIEW */}
              {patientTab === 'wellness' && (
                <div className="space-y-8">
                  <PatientWellnessRoutine />
                  <DinacharyaPlanner auth={auth} />
                </div>
              )}

              {/* TAB 8: PROFILE VIEW */}
              {patientTab === 'profile' && (
                <div className="space-y-8">
                  {!doshaCompleted ? (
                    <DoshaCallToAction onStart={() => navigate('/dosha-assessment')} />
                  ) : (
                    <div className="space-y-4 w-full">
                      <DoshaResultCard auth={auth} />
                      <DoshaSnapshotPanel auth={auth} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Patient Prescription Viewer Modal (Step 7) */}
      <PatientPrescriptionViewerModal
        isOpen={prescriptionViewerOpen}
        onClose={() => setPrescriptionViewerOpen(false)}
        prescription={selectedPrescriptionForView}
      />

      {/* Log New Complaint Modal */}
      {complaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] border border-white/60 p-6 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sand/30 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-forest">
                  {complaintStep === 1 ? '📋 Log New Health Complaint' : '✅ Review & Submit'}
                </h3>
                <p className="text-xs text-forest/60 mt-0.5">
                  {complaintStep === 1 ? 'Describe your symptoms so your Ayurvedic doctor can review them.' : 'Please review before submitting.'}
                </p>
              </div>
              <button
                onClick={() => { setComplaintModalOpen(false); setComplaintStep(1); }}
                className="rounded-lg p-1.5 hover:bg-sand/20 text-forest/40 hover:text-forest transition"
              >
                <X size={18} />
              </button>
            </div>

            {complaintStep === 1 ? (
              <div className="space-y-4">
                {/* Main Complaint */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-forest/50 mb-1.5">Main Complaint <span className="text-rose-500">*</span></label>
                  <select
                    value={complaintForm.mainComplaint}
                    onChange={e => setComplaintForm(p => ({ ...p, mainComplaint: e.target.value }))}
                    className="w-full rounded-2xl border border-sand/70 p-3 text-sm text-forest bg-[#faf8f4] outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                  >
                    <option value="">Select a complaint...</option>
                    {COMPLAINT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {complaintForm.mainComplaint === 'OTHER' && (
                    <input
                      type="text"
                      placeholder="Please specify your complaint..."
                      value={complaintForm.otherComplaint}
                      onChange={e => setComplaintForm(p => ({ ...p, otherComplaint: e.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-sand/70 p-3 text-sm text-forest bg-[#faf8f4] outline-none focus:border-sage"
                    />
                  )}
                </div>

                {/* Symptoms */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-forest/50 mb-2">Associated Symptoms (select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {SYMPTOM_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => handleComplaintSymptomToggle(s.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          complaintForm.symptoms.includes(s.value)
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-forest/70 border-sand/60 hover:bg-emerald-50 hover:border-emerald-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body Area */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-forest/50 mb-1.5">Body Area Affected</label>
                  <select
                    value={complaintForm.bodyArea}
                    onChange={e => setComplaintForm(p => ({ ...p, bodyArea: e.target.value }))}
                    className="w-full rounded-2xl border border-sand/70 p-3 text-sm text-forest bg-[#faf8f4] outline-none focus:border-sage"
                  >
                    <option value="">Select body area...</option>
                    {BODY_AREA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Severity + Frequency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-forest/50 mb-1.5">Severity</label>
                    <select
                      value={complaintForm.severity}
                      onChange={e => setComplaintForm(p => ({ ...p, severity: e.target.value }))}
                      className="w-full rounded-2xl border border-sand/70 p-3 text-sm text-forest bg-[#faf8f4] outline-none focus:border-sage"
                    >
                      <option value="MILD">Mild</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="SEVERE">Severe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-forest/50 mb-1.5">Frequency</label>
                    <select
                      value={complaintForm.frequency}
                      onChange={e => setComplaintForm(p => ({ ...p, frequency: e.target.value }))}
                      className="w-full rounded-2xl border border-sand/70 p-3 text-sm text-forest bg-[#faf8f4] outline-none focus:border-sage"
                    >
                      <option value="OCCASIONAL">Occasional</option>
                      <option value="FREQUENT">Frequent</option>
                      <option value="DAILY">Daily</option>
                      <option value="CONTINUOUS">Continuous</option>
                    </select>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-forest/50 mb-1.5">Duration</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 3"
                      value={complaintForm.durationValue}
                      onChange={e => setComplaintForm(p => ({ ...p, durationValue: e.target.value }))}
                      className="w-1/2 rounded-2xl border border-sand/70 p-3 text-sm text-forest bg-[#faf8f4] outline-none focus:border-sage"
                    />
                    <select
                      value={complaintForm.durationUnit}
                      onChange={e => setComplaintForm(p => ({ ...p, durationUnit: e.target.value }))}
                      className="w-1/2 rounded-2xl border border-sand/70 p-3 text-sm text-forest bg-[#faf8f4] outline-none focus:border-sage"
                    >
                      <option value="DAYS">Days</option>
                      <option value="WEEKS">Weeks</option>
                      <option value="MONTHS">Months</option>
                      <option value="YEARS">Years</option>
                    </select>
                  </div>
                </div>

                {/* Pain Level */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-forest/50 mb-1.5">
                    Pain Level: <span className="text-forest font-extrabold">{complaintForm.painLevel}/10</span>
                  </label>
                  <input
                    type="range" min="1" max="10"
                    value={complaintForm.painLevel}
                    onChange={e => setComplaintForm(p => ({ ...p, painLevel: e.target.value }))}
                    className="w-full accent-emerald-700"
                  />
                  <div className="flex justify-between text-[10px] text-forest/50 mt-0.5">
                    <span>Very Mild (1)</span><span>Severe (10)</span>
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-forest/50 mb-1.5">Additional Details (Optional)</label>
                  <textarea
                    value={complaintForm.additionalDetails}
                    onChange={e => setComplaintForm(p => ({ ...p, additionalDetails: e.target.value }))}
                    placeholder="Any other relevant symptoms, triggers, or context..."
                    rows={3}
                    className="w-full rounded-2xl border border-sand/70 p-3 text-sm text-forest placeholder-forest/30 bg-[#faf8f4] outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setComplaintModalOpen(false); setComplaintStep(1); }}
                    className="rounded-xl border border-sand bg-white px-4 py-2.5 text-xs font-bold text-forest/70 hover:bg-sand/10 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!complaintForm.mainComplaint}
                    onClick={() => setComplaintStep(2)}
                    className="flex-1 rounded-xl bg-forest px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-forest/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Review Complaint →
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 2: Review */
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#f7fbf4] border border-emerald-200 p-4 space-y-2.5 text-xs text-forest">
                  {[
                    ['Main Complaint', (complaintForm.mainComplaint || '').replace(/_/g, ' ') + (complaintForm.otherComplaint ? ` — ${complaintForm.otherComplaint}` : '')],
                    ['Symptoms', complaintForm.symptoms.map(s => s.replace(/_/g, ' ')).join(', ') || '—'],
                    ['Body Area', (complaintForm.bodyArea || '—').replace(/_/g, ' ')],
                    ['Severity', complaintForm.severity],
                    ['Duration', `${complaintForm.durationValue} ${(complaintForm.durationUnit || '').toLowerCase()}`],
                    ['Frequency', (complaintForm.frequency || '').replace(/_/g, ' ')],
                    ['Pain Level', `${complaintForm.painLevel}/10`],
                    ['Additional Details', complaintForm.additionalDetails || '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between gap-4 border-b border-sand/20 pb-2 last:border-0 last:pb-0">
                      <span className="font-semibold text-forest/60 shrink-0">{label}:</span>
                      <span className="font-bold text-forest text-right">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setComplaintStep(1)}
                    className="rounded-xl border border-sand bg-white px-4 py-2.5 text-xs font-bold text-forest/70 hover:bg-sand/10 transition"
                  >
                    ← Edit Details
                  </button>
                  <button
                    type="button"
                    disabled={complaintSubmitting}
                    onClick={handleComplaintSubmit}
                    className="flex-1 rounded-xl bg-forest px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-forest/90 transition disabled:opacity-50"
                  >
                    {complaintSubmitting ? 'Submitting...' : '✅ Submit Complaint'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
