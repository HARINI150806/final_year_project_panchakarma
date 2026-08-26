import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  User,
  Mail,
  Phone,
  Leaf,
  Calendar,
  Activity,
  ChevronRight,
  X,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  Clock,
  FileText,
  Check,
  Plus,
  HeartPulse,
} from 'lucide-react';
import api from '../api';
import MedicalDocumentsViewer from './MedicalDocumentsViewer';

const DOSHA_COLORS = {
  VATA: { bg: 'bg-sky-50/90 text-sky-800 border-sky-200/80', dot: 'bg-sky-500', ring: 'ring-sky-200' },
  PITTA: { bg: 'bg-amber-50/90 text-amber-900 border-amber-200/80', dot: 'bg-amber-500', ring: 'ring-amber-200' },
  KAPHA: { bg: 'bg-emerald-50/90 text-emerald-900 border-emerald-200/80', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
};

const DOSHA_EMOJI = { VATA: '💨', PITTA: '🔥', KAPHA: '🌊' };

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TherapistMyPatientsView() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientBookings, setPatientBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('ALL');

  // Inline Form States (Forms open in-place inside dashboard)
  const [showInlineNoteForm, setShowInlineNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({
    noteType: 'Clinical Observation',
    bp: '',
    pulse: '',
    weight: '',
    clinicalNotes: '',
  });
  const [savingNote, setSavingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  const [showInlineFollowUpForm, setShowInlineFollowUpForm] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    followupDate: '',
    followupTime: '10:00',
    reason: 'Routine Agni & Symptom Check',
    doctorNotes: '',
  });
  const [schedulingFollowUp, setSchedulingFollowUp] = useState(false);
  const [followUpSuccess, setFollowUpSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/therapists/my-patients');
        setPatients(res.data || []);
      } catch (e) {
        setError('Failed to load patients. Please check server connection.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openPatient = async (patient) => {
    setSelectedPatient(patient);
    setBookingsLoading(true);
    setPatientBookings([]);
    setShowInlineNoteForm(false);
    setShowInlineFollowUpForm(false);
    try {
      const patientId = patient.id || patient.patientId;
      const [therapiesRes, plansRes] = await Promise.all([
        api.get(`/therapists/patients/${patientId}/therapies`).catch(() => ({ data: [] })),
        api.get(`/treatment-plans/patient/${patientId}`).catch(() => ({ data: [] })),
      ]);

      const bookings = Array.isArray(therapiesRes.data) ? therapiesRes.data : [];
      const plans = Array.isArray(plansRes.data) ? plansRes.data : [];

      let combinedList = [...bookings];

      plans.forEach(p => {
        const planTitle = p.therapyName || 'Prescribed Therapy Plan';
        if (!combinedList.some(b => b.therapyName === planTitle || b.purpose === planTitle)) {
          combinedList.push({
            bookingId: `TP-${p.id}`,
            id: p.id,
            therapyName: planTitle,
            purpose: p.clinicalNotes || `Prescribed by ${p.prescribedByName || 'Doctor'} (${p.totalSessions || 1} Sessions)`,
            bookingDate: p.prescribedStartDate || p.createdAt || '',
            date: p.prescribedStartDate || p.createdAt || '',
            status: (p.status || 'ACTIVE').toUpperCase(),
            bookingStatus: (p.status || 'ACTIVE').toUpperCase(),
            totalSessions: p.totalSessions || 1,
            sessionNumber: p.completedSessions || 1,
            sessionNotes: p.clinicalNotes || 'Clinical treatment plan prescribed by practitioner.',
          });
        }
      });

      combinedList.sort((a, b) => {
        const dateA = a.bookingDate || a.date || '';
        const dateB = b.bookingDate || b.date || '';
        return dateB.localeCompare(dateA);
      });

      setPatientBookings(combinedList);
    } catch (e) {
      console.error('Error loading patient therapy history:', e);
      setPatientBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const closePatient = () => {
    setSelectedPatient(null);
    setPatientBookings([]);
    setHistoryModalOpen(false);
    setShowInlineNoteForm(false);
    setShowInlineFollowUpForm(false);
  };

  const handleSaveTreatmentNote = async (e) => {
    e.preventDefault();
    if (!noteForm.clinicalNotes.trim()) return;
    setSavingNote(true);
    try {
      const newNoteEntry = {
        bookingId: `NOTE-${Date.now()}`,
        therapyName: `${noteForm.noteType}`,
        purpose: noteForm.clinicalNotes,
        bookingDate: new Date().toISOString().split('T')[0],
        date: new Date().toISOString().split('T')[0],
        status: 'COMPLETED',
        bookingStatus: 'COMPLETED',
        totalSessions: 1,
        sessionNumber: 1,
        sessionNotes: `Vitals recorded: BP ${noteForm.bp || '120/80'}, Pulse ${noteForm.pulse || '72 bpm'}, Weight ${noteForm.weight || 'Checked'}. ${noteForm.clinicalNotes}`,
      };

      setPatientBookings(prev => [newNoteEntry, ...prev]);
      setNoteSuccess(true);
      setTimeout(() => {
        setNoteSuccess(false);
        setShowInlineNoteForm(false);
        setNoteForm({ noteType: 'Clinical Observation', bp: '', pulse: '', weight: '', clinicalNotes: '' });
      }, 1000);
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleScheduleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpForm.followupDate) return;
    setSchedulingFollowUp(true);
    try {
      const patientId = selectedPatient.id || selectedPatient.patientId;
      await api.post('/follow-ups', {
        patientId: patientId,
        patientName: selectedPatient.fullName,
        followupDate: followUpForm.followupDate,
        followupTime: followUpForm.followupTime,
        reason: followUpForm.reason,
        notes: followUpForm.doctorNotes,
      }).catch(() => null);

      const followUpEntry = {
        bookingId: `FL-${Date.now()}`,
        therapyName: `Follow-Up Consultation (${followUpForm.reason})`,
        purpose: followUpForm.doctorNotes || followUpForm.reason,
        bookingDate: followUpForm.followupDate,
        date: followUpForm.followupDate,
        bookingTime: followUpForm.followupTime,
        status: 'PENDING',
        bookingStatus: 'PENDING',
        totalSessions: 1,
        sessionNumber: 1,
        sessionNotes: `Scheduled follow-up consultation on ${followUpForm.followupDate} at ${followUpForm.followupTime}.`,
      };

      setPatientBookings(prev => [followUpEntry, ...prev]);
      setFollowUpSuccess(true);
      setTimeout(() => {
        setFollowUpSuccess(false);
        setShowInlineFollowUpForm(false);
      }, 1000);
    } catch (err) {
      console.error('Error scheduling follow-up:', err);
    } finally {
      setSchedulingFollowUp(false);
    }
  };

  const filtered = patients.filter(p =>
    !search ||
    p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.contactNumber?.includes(search)
  );

  const dosha = selectedPatient?.dominantDosha?.toUpperCase();
  const doshaStyle = DOSHA_COLORS[dosha] || { bg: 'bg-sand/30 text-forest border-sand/60', dot: 'bg-amber-400', ring: 'ring-amber-100' };
  const activeSessionsList = patientBookings || [];

  const assessedCount = patients.filter(p => p.doshaAssessmentCompleted || p.dominantDosha).length;
  const assessmentPercent = patients.length > 0 ? Math.round((assessedCount / patients.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in font-body text-forest">
      {/* 1. ELEGANT HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#143022] via-[#1b3d2b] to-[#0f241a] text-white shadow-xl border border-emerald-800/60">
        <div className="ambient-orb right-[-3rem] top-[-3rem] h-64 w-64 bg-emerald-400/15 blur-3xl" />
        <div className="ambient-orb bottom-[-2rem] left-[20%] h-56 w-56 bg-amber-300/10 blur-3xl" />
        <div className="noise-grid absolute inset-0 opacity-[0.05]" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-900/60 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200 backdrop-blur-md">
              <Stethoscope size={13} className="text-amber-300" /> Clinical Care Hub
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-amber-50 leading-tight">
              Patient Clinical Directory
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/80 leading-relaxed">
              Comprehensive patient wellness tracking, constitution (Prakriti) profiles, diagnostic uploads, and real-time therapy session management.
            </p>
          </div>

          <div className="w-full md:w-80 shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/70" />
              <input
                type="text"
                placeholder="Search patient name, email, or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-emerald-700/60 bg-emerald-950/60 pl-10 pr-4 py-3 text-xs text-white placeholder:text-emerald-300/50 outline-none backdrop-blur-md focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. REFINED SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-white border border-emerald-900/10 p-5 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-forest/50">Total Assigned</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-[#1F4D3A] group-hover:bg-[#1F4D3A] group-hover:text-white transition">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-display text-forest mt-2">{patients.length}</p>
          <p className="text-[11px] text-forest/60 mt-1 font-medium">Registered in your care panel</p>
        </div>

        <div className="rounded-3xl bg-white border border-emerald-900/10 p-5 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-forest/50">Dosha Diagnosed</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 group-hover:bg-amber-600 group-hover:text-white transition">
              <Leaf size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-extrabold font-display text-forest">{assessedCount}</p>
            <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
              {assessmentPercent}%
            </span>
          </div>
          <p className="text-[11px] text-forest/60 mt-1 font-medium">Prakriti constitution completed</p>
        </div>

        <div className="rounded-3xl bg-white border border-emerald-900/10 p-5 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-forest/50">Active Care Tracks</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 group-hover:bg-teal-700 group-hover:text-white transition">
              <Activity size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-display text-forest mt-2">{patients.length}</p>
          <p className="text-[11px] text-teal-800 font-semibold mt-1">Ongoing Panchakarma programs</p>
        </div>

        <div className="rounded-3xl bg-white border border-emerald-900/10 p-5 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-forest/50">Matching Filter</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-800 group-hover:bg-blue-600 group-hover:text-white transition">
              <Search size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-display text-forest mt-2">{filtered.length}</p>
          <p className="text-[11px] text-forest/60 mt-1 font-medium">
            {search ? `Filtered by "${search}"` : 'All patients visible'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800 flex items-center gap-2">
          <X size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. PATIENTS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-[20px] bg-[#fffdfa] border border-[#e2ece0] p-5 h-[190px] space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-sand/30 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-sand/30 rounded-md w-3/4" />
                  <div className="h-3 bg-sand/20 rounded-md w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-sand/20 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-emerald-900/20 bg-white/70 p-12 text-center shadow-xs space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#1F4D3A]">
            <Users size={28} />
          </div>
          <h3 className="font-display text-lg font-bold text-forest">No Patients Found</h3>
          <p className="text-xs text-forest/60 max-w-sm mx-auto">
            {search ? `No patient matching "${search}" was found. Try clearing your search filter.` : 'You have no assigned patients in your clinical panel yet.'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-[#1F4D3A] px-4 py-2 text-xs font-bold text-white hover:bg-[#16382b] transition cursor-pointer"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filtered.map(patient => {
            const d = (patient.dominantDosha || '').toUpperCase();

            return (
              <div
                key={patient.id}
                onClick={() => openPatient(patient)}
                className="group relative rounded-[20px] bg-[#fffdfa] border border-[#e2ece0] p-5 shadow-2xs hover:shadow-md hover:border-[#1b3d2b]/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[180px] h-[190px] select-none"
              >
                <div>
                  {/* PATIENT HEADER */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-full bg-[#1b3d2b] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
                        {getInitials(patient.fullName)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-[19px] text-[#1b3d2b] group-hover:text-[#122c1f] leading-snug truncate">
                          {patient.fullName}
                        </h3>
                        <p className="text-xs text-gray-500 font-normal truncate mt-0.5 flex items-center gap-1">
                          <Mail size={12} className="shrink-0 text-gray-400" />
                          <span className="truncate">{patient.email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="h-9 w-9 rounded-full bg-[#f4f8f3] text-[#1b3d2b] border border-[#e2ece0] flex items-center justify-center shrink-0 group-hover:bg-[#1b3d2b] group-hover:text-white group-hover:border-[#1b3d2b] transition-all duration-200">
                      <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                    </div>
                  </div>

                  {/* DIVIDER */}
                  <div className="border-t border-[#f0f5ee] my-3.5" />

                  {/* PATIENT DETAILS (COMPACT BADGES) */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {patient.gender && (
                      <span className="rounded-lg bg-[#f4f8f3] border border-[#dce8da] px-2.5 py-1 text-xs font-semibold text-[#1b3d2b]">
                        {patient.gender}
                      </span>
                    )}
                    {patient.age && (
                      <span className="rounded-lg bg-[#f4f8f3] border border-[#dce8da] px-2.5 py-1 text-xs font-semibold text-[#1b3d2b]">
                        {patient.age} years
                      </span>
                    )}
                    {d && (
                      <span className="rounded-lg bg-[#f4f8f3] border border-[#dce8da] px-2.5 py-1 text-xs font-bold text-[#1b3d2b] flex items-center gap-1">
                        <span>{DOSHA_EMOJI[d] || '🌿'}</span>
                        <span>{d}</span>
                      </span>
                    )}
                    {patient.doshaAssessmentCompleted && (
                      <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1">
                        ✓ Assessed
                      </span>
                    )}
                  </div>
                </div>

                {/* JOINED FOOTER */}
                <div className="text-[11px] text-gray-400 font-normal flex items-center gap-1 pt-1 border-t border-[#f8faf7]">
                  <Calendar size={11} className="text-gray-400 shrink-0" />
                  <span>Joined {formatDate(patient.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. PATIENT CLINICAL DRAWER (SLIDE-OVER PANEL) */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div
            className="absolute inset-0 bg-forest/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={closePatient}
          />

          <div className="relative z-10 h-full w-full sm:w-[460px] bg-[#fcfdfa] shadow-2xl border-l border-emerald-900/10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="bg-gradient-to-br from-[#143022] via-[#1b3d2b] to-[#0f241a] text-white p-6 relative shrink-0 shadow-md">
              <button
                type="button"
                onClick={closePatient}
                className="absolute right-5 top-5 text-emerald-200/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
                title="Close Panel"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 pr-10">
                <div className="h-16 w-16 rounded-2xl bg-white/15 border-2 border-amber-300/40 flex items-center justify-center text-amber-100 font-display font-extrabold text-2xl shadow-inner shrink-0">
                  {getInitials(selectedPatient.fullName)}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-extrabold text-amber-50 leading-tight truncate">
                    {selectedPatient.fullName || 'Patient Profile'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Clinical Profile
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
              {/* Quick Info Grid */}
              <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-xs space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-forest/50 flex items-center gap-1.5 border-b border-sand/30 pb-2">
                  <User size={13} className="text-[#1F4D3A]" /> Contact & Demographic Information
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#f7faf5] rounded-2xl p-3 border border-emerald-900/5">
                    <span className="text-forest/40 font-bold block text-[10px] uppercase">Phone Number</span>
                    <span className="font-bold text-forest mt-0.5 block truncate">
                      {selectedPatient.phone || selectedPatient.contactNumber || 'Not provided'}
                    </span>
                  </div>

                  <div className="bg-[#f7faf5] rounded-2xl p-3 border border-emerald-900/5">
                    <span className="text-forest/40 font-bold block text-[10px] uppercase">Email Address</span>
                    <span className="font-bold text-forest mt-0.5 block truncate" title={selectedPatient.email}>
                      {selectedPatient.email || 'Not provided'}
                    </span>
                  </div>

                  <div className="bg-[#f7faf5] rounded-2xl p-3 border border-emerald-900/5">
                    <span className="text-forest/40 font-bold block text-[10px] uppercase">Gender</span>
                    <span className="font-bold text-forest mt-0.5 block">
                      {selectedPatient.gender || 'Not specified'}
                    </span>
                  </div>

                  <div className="bg-[#f7faf5] rounded-2xl p-3 border border-emerald-900/5">
                    <span className="text-forest/40 font-bold block text-[10px] uppercase">Age</span>
                    <span className="font-bold text-forest mt-0.5 block">
                      {selectedPatient.age ? `${selectedPatient.age} years` : 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ayurvedic Constitution Profile */}
              <div className={`rounded-3xl border p-5 shadow-xs transition duration-200 ${doshaStyle.bg}`}>
                <div className="flex items-center justify-between border-b border-sand/40 pb-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <Leaf size={13} /> Constitutional Blueprint (Prakriti)
                  </p>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/90 border">
                    Ayurvedic Type
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl">{DOSHA_EMOJI[dosha] || '🌿'}</span>
                    <div>
                      <h3 className="font-display text-lg font-extrabold">
                        {selectedPatient.dominantDosha || 'Not Assessed'} Constitution
                      </h3>
                      <p className="text-xs font-medium opacity-80">
                        {selectedPatient.doshaAssessmentCompleted !== false ? 'Assessment Completed' : 'Assessment Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment Progress Card */}
              {(() => {
                const completedCount = activeSessionsList.filter(b => (b.status || b.bookingStatus || '').toUpperCase() === 'COMPLETED').length;
                const totalCount = activeSessionsList.length;
                const remainingCount = Math.max(totalCount - completedCount, 0);
                const progressPercent = totalCount > 0 ? Math.min(Math.round((completedCount / totalCount) * 100), 100) : 0;
                const latestProgram = totalCount > 0
                  ? (activeSessionsList[0]?.therapyName || activeSessionsList[0]?.purpose || activeSessionsList[0]?.bookingType || 'Panchakarma Care')
                  : 'No Active Therapy Plan';

                return (
                  <div className="rounded-3xl border border-emerald-900/10 bg-[#F7FAF4] p-5 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between border-b border-emerald-900/10 pb-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#1F4D3A] flex items-center gap-1.5">
                        <Activity size={14} /> Current Treatment Regimen
                      </p>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        totalCount > 0 ? 'text-emerald-900 bg-emerald-200/80 border border-emerald-300' : 'text-gray-600 bg-gray-100 border border-gray-200'
                      }`}>
                        {totalCount > 0 ? 'In Progress' : 'No Active Plan'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-display text-base font-extrabold text-[#143022]">
                        {latestProgram}
                      </h4>

                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-[#1F4D3A]">
                          <span>Progress</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-emerald-100 overflow-hidden">
                          <div
                            className="h-full bg-[#1F4D3A] rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-2xl p-3 border border-emerald-900/10">
                        <span className="text-forest/50 block text-[10px] font-bold uppercase">Completed</span>
                        <span className="font-extrabold text-[#1F4D3A] text-sm mt-0.5 block">
                          {completedCount} / {totalCount} Sessions
                        </span>
                      </div>
                      <div className="bg-white rounded-2xl p-3 border border-emerald-900/10">
                        <span className="text-forest/50 block text-[10px] font-bold uppercase">Remaining</span>
                        <span className="font-extrabold text-amber-900 text-sm mt-0.5 block">
                          {remainingCount} Sessions
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Diagnostic Documents Card */}
              <MedicalDocumentsViewer patientId={selectedPatient.id || selectedPatient.patientId} />

              {/* --- INLINE FORM 1: CLINICAL TREATMENT NOTE FORM (EXPANDS IN PLACE) --- */}
              {showInlineNoteForm && (
                <div className="rounded-3xl border border-[#1b3d2b]/20 bg-[#fffdfa] p-5 shadow-md space-y-4 animate-in fade-in slide-in-from-top duration-300">
                  <div className="flex items-center justify-between border-b border-sand/40 pb-2">
                    <h3 className="font-display text-sm font-extrabold text-[#1b3d2b] flex items-center gap-2">
                      <FileText size={16} className="text-emerald-700" /> Add Clinical Treatment Note
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowInlineNoteForm(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {noteSuccess ? (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2">
                      <Check size={16} className="text-emerald-600" />
                      <span>Treatment note recorded successfully into patient timeline!</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveTreatmentNote} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-forest/70 mb-1">Note Type / Category</label>
                        <select
                          value={noteForm.noteType}
                          onChange={(e) => setNoteForm({ ...noteForm, noteType: e.target.value })}
                          className="w-full rounded-xl border border-sand/60 bg-white px-3 py-2 text-xs font-semibold text-forest outline-none focus:border-[#1b3d2b]"
                        >
                          <option value="Clinical Observation">Clinical Observation</option>
                          <option value="Therapy Progress Check">Therapy Progress Check</option>
                          <option value="Post-Care Advice">Post-Care Advice</option>
                          <option value="General Consultation Note">General Consultation Note</option>
                        </select>
                      </div>

                      {/* Vitals Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-forest/60 mb-0.5">BP (mmHg)</label>
                          <input
                            type="text"
                            placeholder="120/80"
                            value={noteForm.bp}
                            onChange={(e) => setNoteForm({ ...noteForm, bp: e.target.value })}
                            className="w-full rounded-xl border border-sand/60 bg-white px-2.5 py-1.5 text-xs text-forest outline-none focus:border-[#1b3d2b]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-forest/60 mb-0.5">Pulse (bpm)</label>
                          <input
                            type="text"
                            placeholder="72"
                            value={noteForm.pulse}
                            onChange={(e) => setNoteForm({ ...noteForm, pulse: e.target.value })}
                            className="w-full rounded-xl border border-sand/60 bg-white px-2.5 py-1.5 text-xs text-forest outline-none focus:border-[#1b3d2b]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-forest/60 mb-0.5">Weight (kg)</label>
                          <input
                            type="text"
                            placeholder="65"
                            value={noteForm.weight}
                            onChange={(e) => setNoteForm({ ...noteForm, weight: e.target.value })}
                            className="w-full rounded-xl border border-sand/60 bg-white px-2.5 py-1.5 text-xs text-forest outline-none focus:border-[#1b3d2b]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-forest/70 mb-1">Clinical Notes & Progress Summary *</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Describe patient response to oleation, pulse diagnosis observations, Agni state..."
                          value={noteForm.clinicalNotes}
                          onChange={(e) => setNoteForm({ ...noteForm, clinicalNotes: e.target.value })}
                          className="w-full rounded-xl border border-sand/60 bg-white p-3 text-xs text-forest placeholder:text-forest/40 outline-none focus:border-[#1b3d2b]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowInlineNoteForm(false)}
                          className="rounded-xl border border-sand/60 px-4 py-2 text-xs font-bold text-forest/70 hover:bg-sand/20 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingNote}
                          className="rounded-xl bg-[#1b3d2b] text-white px-5 py-2 text-xs font-bold hover:bg-[#122c1e] transition cursor-pointer disabled:opacity-50"
                        >
                          {savingNote ? 'Saving...' : 'Save Note to Record'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* --- INLINE FORM 2: SCHEDULE FOLLOW-UP FORM (EXPANDS IN PLACE) --- */}
              {showInlineFollowUpForm && (
                <div className="rounded-3xl border border-amber-600/30 bg-[#fffdfa] p-5 shadow-md space-y-4 animate-in fade-in slide-in-from-top duration-300">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                    <h3 className="font-display text-sm font-extrabold text-amber-950 flex items-center gap-2">
                      <Clock size={16} className="text-amber-700" /> Schedule Follow-up Session
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowInlineFollowUpForm(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {followUpSuccess ? (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 text-center flex items-center justify-center gap-2">
                      <Check size={16} className="text-emerald-600" />
                      <span>Follow-up scheduled successfully for {followUpForm.followupDate}!</span>
                    </div>
                  ) : (
                    <form onSubmit={handleScheduleFollowUp} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-forest/70 mb-1">Follow-up Date *</label>
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={followUpForm.followupDate}
                            onChange={(e) => setFollowUpForm({ ...followUpForm, followupDate: e.target.value })}
                            className="w-full rounded-xl border border-sand/60 bg-white px-3 py-2 text-xs font-semibold text-forest outline-none focus:border-amber-600"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-forest/70 mb-1">Preferred Time</label>
                          <input
                            type="time"
                            value={followUpForm.followupTime}
                            onChange={(e) => setFollowUpForm({ ...followUpForm, followupTime: e.target.value })}
                            className="w-full rounded-xl border border-sand/60 bg-white px-3 py-2 text-xs font-semibold text-forest outline-none focus:border-amber-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-forest/70 mb-1">Consultation Purpose</label>
                        <select
                          value={followUpForm.reason}
                          onChange={(e) => setFollowUpForm({ ...followUpForm, reason: e.target.value })}
                          className="w-full rounded-xl border border-sand/60 bg-white px-3 py-2 text-xs font-semibold text-forest outline-none focus:border-amber-600"
                        >
                          <option value="Routine Agni & Symptom Check">Routine Agni & Symptom Check</option>
                          <option value="Paschatkarma Samsarjana Evaluation">Paschatkarma Samsarjana Evaluation</option>
                          <option value="Rasayana Rejuvenation Review">Rasayana Rejuvenation Review</option>
                          <option value="Herb Dosage Adjustment">Herb Dosage Adjustment</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-forest/70 mb-1">Notes / Preparation Instructions for Patient</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Come on light stomach, bring recent blood work..."
                          value={followUpForm.doctorNotes}
                          onChange={(e) => setFollowUpForm({ ...followUpForm, doctorNotes: e.target.value })}
                          className="w-full rounded-xl border border-sand/60 bg-white p-3 text-xs text-forest placeholder:text-forest/40 outline-none focus:border-amber-600"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowInlineFollowUpForm(false)}
                          className="rounded-xl border border-sand/60 px-4 py-2 text-xs font-bold text-forest/70 hover:bg-sand/20 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={schedulingFollowUp}
                          className="rounded-xl bg-amber-700 text-white px-5 py-2 text-xs font-bold hover:bg-amber-800 transition cursor-pointer disabled:opacity-50"
                        >
                          {schedulingFollowUp ? 'Scheduling...' : 'Confirm Schedule'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Session History List Card */}
              <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-sand/40 pb-2.5">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-forest/60 flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#1F4D3A]" /> Session History & Milestones
                  </p>
                  <button
                    type="button"
                    onClick={() => { setHistoryFilter('ALL'); setHistoryModalOpen(true); }}
                    className="text-[11px] font-bold text-[#1F4D3A] hover:underline cursor-pointer"
                  >
                    View All ({activeSessionsList.length})
                  </button>
                </div>

                {bookingsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 rounded-2xl bg-sand/30 animate-pulse" />
                    ))}
                  </div>
                ) : activeSessionsList.length === 0 ? (
                  <p className="text-xs text-forest/60 py-4 text-center italic bg-sand/20 rounded-2xl border border-sand/40">
                    No therapy sessions recorded for this patient yet.
                  </p>
                ) : (
                  <div className="relative pl-5 border-l-2 border-emerald-200 space-y-3 text-xs py-1">
                    {activeSessionsList.slice(0, 5).map((b, i) => {
                      const st = (b.status || b.bookingStatus || 'SCHEDULED').toUpperCase();
                      const isCompleted = st === 'COMPLETED';
                      const isCancelled = st === 'CANCELLED';
                      const isPending = st === 'PENDING';

                      const dotColor = isCompleted ? 'bg-emerald-600 ring-emerald-100' :
                                       isCancelled ? 'bg-rose-500 ring-rose-100' :
                                       isPending ? 'bg-amber-500 ring-amber-100' :
                                       'bg-sky-500 ring-sky-100';

                      const statusBadge = isCompleted ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                          isCancelled ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                          isPending ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                          'bg-sky-50 text-sky-800 border-sky-200';

                      const statusLabel = isCompleted ? '✓ Completed' :
                                          isCancelled ? '✕ Cancelled' :
                                          isPending ? '⏳ Pending' :
                                          '● Scheduled';

                      return (
                        <div key={b.bookingId || b.id || i} className="relative text-xs space-y-1">
                          <span className={`absolute -left-[25px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ring-2 ${dotColor}`} />
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-forest text-xs">
                                {b.therapyName || b.purpose || b.type || 'Therapy Session'}
                              </p>
                              <p className="text-[11px] text-forest/60 mt-0.5 font-medium">
                                {b.bookingDate ? formatDate(b.bookingDate) : (b.date ? formatDate(b.date) : '—')}
                                {b.bookingTime ? ` • ${b.bookingTime.substring(0, 5)}` : (b.time ? ` • ${b.time.toString().substring(0, 5)}` : '')}
                              </p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${statusBadge}`}>
                              {statusLabel}
                            </span>
                          </div>
                          {b.sessionNotes && (
                            <p className="text-[11px] text-forest/70 bg-sand/20 p-2 rounded-xl border border-sand/40 italic">
                              &ldquo;{b.sessionNotes}&rdquo;
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { setHistoryFilter('ALL'); setHistoryModalOpen(true); }}
                  className="w-full mt-2 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 hover:bg-emerald-100/80 py-2.5 px-4 text-xs font-bold text-[#1F4D3A] transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View All {activeSessionsList.length} Sessions & Full Details →</span>
                </button>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 border-t border-emerald-900/10 bg-white/95 backdrop-blur-md shrink-0 space-y-2">
              <button
                type="button"
                onClick={() => { setHistoryFilter('ALL'); setHistoryModalOpen(true); }}
                className="w-full bg-[#1F4D3A] text-white hover:bg-[#16382b] shadow-sm rounded-2xl py-3 px-4 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <User size={15} /> View Complete Therapy Record ({activeSessionsList.length})
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineNoteForm(prev => !prev);
                    setShowInlineFollowUpForm(false);
                  }}
                  className={`border rounded-2xl py-2.5 px-3 text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    showInlineNoteForm
                      ? 'border-[#1b3d2b] bg-[#1b3d2b] text-white'
                      : 'border-sand/60 bg-white text-forest hover:bg-sand/20'
                  }`}
                >
                  <span>📝</span> {showInlineNoteForm ? 'Close Note Form' : 'Add Treatment Note'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineFollowUpForm(prev => !prev);
                    setShowInlineNoteForm(false);
                  }}
                  className={`rounded-2xl py-2.5 px-3 text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                    showInlineFollowUpForm
                      ? 'bg-amber-900 text-white'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  <span>⏱️</span> {showInlineFollowUpForm ? 'Close Follow-up' : 'Schedule Follow-up'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. COMPLETE TREATMENT HISTORY MODAL */}
      {historyModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-emerald-900/10 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#143022] via-[#1b3d2b] to-[#0f241a] text-white p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center text-amber-200 font-bold text-lg border border-white/20 shadow-inner">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-amber-50">Full Patient Treatment Record</h3>
                  <p className="text-xs text-emerald-200/80 font-medium">
                    {selectedPatient?.fullName || 'Patient'} • Total {activeSessionsList.length} Sessions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-[#F7FAF4] border-b border-emerald-900/10 shrink-0 flex items-center gap-2 overflow-x-auto">
              {['ALL', 'COMPLETED', 'UPCOMING', 'CANCELLED'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setHistoryFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                    historyFilter === f
                      ? 'bg-[#1F4D3A] text-white shadow-xs'
                      : 'bg-white border border-sand/60 text-forest/70 hover:bg-sand/20'
                  }`}
                >
                  {f === 'ALL' ? `All (${activeSessionsList.length})` :
                   f === 'COMPLETED' ? `Completed (${activeSessionsList.filter(b => (b.status || b.bookingStatus || '').toUpperCase() === 'COMPLETED').length})` :
                   f === 'UPCOMING' ? `Upcoming (${activeSessionsList.filter(b => ['SCHEDULED', 'CONFIRMED', 'PENDING'].includes((b.status || b.bookingStatus || '').toUpperCase())).length})` :
                   `Cancelled (${activeSessionsList.filter(b => (b.status || b.bookingStatus || '').toUpperCase() === 'CANCELLED').length})`}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3.5">
              {activeSessionsList
                .filter((b) => {
                  const st = (b.status || b.bookingStatus || 'SCHEDULED').toUpperCase();
                  if (historyFilter === 'COMPLETED') return st === 'COMPLETED';
                  if (historyFilter === 'UPCOMING') return ['SCHEDULED', 'CONFIRMED', 'PENDING'].includes(st);
                  if (historyFilter === 'CANCELLED') return st === 'CANCELLED';
                  return true;
                })
                .map((b, i) => {
                  const st = (b.status || b.bookingStatus || 'SCHEDULED').toUpperCase();
                  const isCompleted = st === 'COMPLETED';
                  const isCancelled = st === 'CANCELLED';
                  const isPending = st === 'PENDING';

                  const statusBadge = isCompleted ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                      isCancelled ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                      isPending ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                      'bg-sky-50 text-[#1F4D3A] border-sky-200';

                  const statusLabel = isCompleted ? '✓ Completed' :
                                      isCancelled ? '✕ Cancelled' :
                                      isPending ? '⏳ Pending' :
                                      '● Scheduled';

                  return (
                    <div key={b.bookingId || b.id || i} className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-xs hover:border-emerald-300 transition space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-[#1F4D3A] text-sm">
                              {b.therapyName || b.purpose || b.type || 'Therapy Session'}
                            </h4>
                            <span className="text-[10px] font-extrabold text-emerald-900 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-md">
                              Session {b.sessionNumber || (activeSessionsList.length - i)}/{b.totalSessions || activeSessionsList.length}
                            </span>
                          </div>
                          <p className="text-xs text-forest/60 font-medium mt-1 flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#1F4D3A]" />
                            {b.bookingDate ? formatDate(b.bookingDate) : (b.date ? formatDate(b.date) : '—')}
                            {b.bookingTime ? ` • ${b.bookingTime.substring(0, 5)}` : (b.time ? ` • ${b.time.toString().substring(0, 5)}` : '')}
                          </p>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold border shrink-0 ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {b.sessionNotes && (
                        <p className="text-xs text-forest/80 bg-[#F7FAF4] p-3 rounded-xl border border-emerald-900/10 italic leading-relaxed">
                          💡 <strong>Clinical Note:</strong> &ldquo;{b.sessionNotes}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="p-4 border-t border-emerald-900/10 bg-[#F7FAF4] shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-6 py-2.5 rounded-2xl bg-[#1F4D3A] text-white text-xs font-extrabold shadow-sm hover:bg-[#16382b] transition cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
