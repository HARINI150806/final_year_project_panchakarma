import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Stethoscope,
  HeartHandshake,
  ShieldCheck,
  User,
  Target,
  Check,
} from 'lucide-react';
import api from '../api';

export default function TreatmentJourneyTimeline() {
  const [journeySteps, setJourneySteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function loadJourney() {
      setLoading(true);
      try {
        const [profileRes, bookingsRes, plansRes] = await Promise.all([
          api.get('/patient/profile').catch(() => null),
          api.get('/patient/bookings').catch(() => ({ data: [] })),
          api.get('/treatment-plans/my').catch(() => ({ data: [] })),
        ]);

        const profile = profileRes?.data || {};
        const bookings = Array.isArray(bookingsRes?.data) ? bookingsRes.data : [];
        const plans = Array.isArray(plansRes?.data) ? plansRes.data : [];

        // Build dynamic steps from real patient data
        const steps = [];

        // Step 1: Prakriti & Initial Assessment
        const isDoshaAssessed = profile.doshaAssessmentCompleted || profile.dominantDosha;
        steps.push({
          id: 1,
          title: 'Consultation & Prakriti Assessment',
          status: isDoshaAssessed ? 'COMPLETED' : 'ACTIVE',
          date: profile.doshaAssessmentDate
            ? new Date(profile.doshaAssessmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Initial Visit',
          doctor: profile.doctorName || 'Ayurvedic Specialist',
          notes: isDoshaAssessed
            ? `Prakriti diagnosed as ${profile.dominantDosha}. Personalized care roadmap initiated.`
            : 'Initial consultation and Prakriti constitution assessment in progress.',
          icon: Stethoscope,
        });

        // Step 2: Main Therapy / Active Plan
        const activePlan = plans[0] || null;
        const mainBooking = bookings.find(b => b.bookingType === 'THERAPY' || b.purpose?.toLowerCase().includes('abhyanga') || b.purpose?.toLowerCase().includes('virechana')) || bookings[0];

        steps.push({
          id: 2,
          title: activePlan ? activePlan.therapyName : (mainBooking?.purpose || 'Panchakarma Detox Therapy'),
          status: mainBooking?.bookingStatus === 'COMPLETED' ? 'COMPLETED' : (activePlan || mainBooking ? 'ACTIVE' : 'PLANNED'),
          date: activePlan?.prescribedStartDate
            ? new Date(activePlan.prescribedStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : (mainBooking?.date ? new Date(mainBooking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Scheduled'),
          doctor: mainBooking?.therapistName || activePlan?.prescribedByName || 'Senior Therapist & Doctor',
          notes: activePlan?.clinicalNotes || mainBooking?.sessionNotes || 'Guided detox therapy regimen according to Ayurvedic protocols.',
          icon: Sparkles,
        });

        // Step 3: Follow-Up Consultation
        const followUpBooking = bookings.find(b => b.bookingType === 'CONSULTATION' || b.purpose?.toLowerCase().includes('follow')) || null;
        steps.push({
          id: 3,
          title: 'Doctor Follow-Up Consultation',
          status: followUpBooking?.bookingStatus === 'COMPLETED' ? 'COMPLETED' : (followUpBooking ? 'ACTIVE' : 'UPCOMING'),
          date: followUpBooking?.date
            ? new Date(followUpBooking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Post-Therapy',
          subDate: followUpBooking ? '(Scheduled)' : '',
          doctor: followUpBooking?.therapistName || 'Ayurvedic Practitioner',
          notes: followUpBooking?.notes || 'Post-procedure Agni assessment, symptom check, and herb dosage fine-tuning.',
          icon: HeartHandshake,
        });

        // Step 4: Rasayana Rejuvenation & Samsarjana Diet
        steps.push({
          id: 4,
          title: 'Long-term Rasayana Recovery Plan',
          status: isDoshaAssessed && bookings.length > 0 ? 'SCHEDULED' : 'PLANNED',
          date: 'Post Detox',
          doctor: 'Senior Ayurvedic Panel',
          notes: 'Rejuvenation herbal therapy (Rasayana) and personalized daily nutrition routine (Samsarjana Krama).',
          icon: ShieldCheck,
        });

        setJourneySteps(steps);
        setSelectedStep(steps.find(s => s.status === 'ACTIVE')?.id || 1);
      } catch (err) {
        console.error('Error loading journey steps:', err);
      } finally {
        setLoading(false);
      }
    }

    loadJourney();
  }, []);

  useEffect(() => {
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById('treatment-journey-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (attempts < 15) {
        attempts++;
        setTimeout(tryScroll, 150);
      }
    };
    setTimeout(tryScroll, 150);
  }, [searchParams]);

  const activeStepObj = journeySteps.find((s) => s.id === selectedStep) || journeySteps[0];

  return (
    <div id="treatment-journey-section" className="rounded-3xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm space-y-8 w-full min-w-0">
      {/* Header */}
      <div className="space-y-2.5 min-w-0">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ebf7ee] px-3.5 py-1 text-[11px] font-extrabold text-[#235836] tracking-wider uppercase">
          🌿 Dynamic Care Roadmap
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#112d1b] tracking-tight">
          Your Treatment Journey
        </h2>
        <p className="text-sm font-medium text-gray-500">
          Real-time Panchakarma healing progress & clinical milestones
        </p>

        <div className="pt-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-[#fffbeb] px-4 py-1.5 text-xs font-bold text-[#854d0e] shadow-2xs">
            <Clock size={15} className="text-[#a16207] shrink-0" />
            {loading ? 'Loading roadmap...' : `Stage ${selectedStep} of ${journeySteps.length} Active`}
          </span>
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="relative pt-2 pb-2 w-full min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 w-full min-w-0">
          {journeySteps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'COMPLETED';
            const isActive = step.status === 'ACTIVE';
            const isSelected = selectedStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setSelectedStep(step.id)}
                className={`text-left p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden w-full min-w-0 min-h-[175px] ${
                  isActive
                    ? 'bg-[#153826] text-white border-[#153826] shadow-xl scale-[1.01] z-20'
                    : isCompleted
                    ? 'bg-[#f2faf5] border-emerald-100/90 text-[#112d1b] hover:bg-[#eaf7ef] shadow-2xs'
                    : 'bg-[#fcfaf7] border-gray-200/70 text-gray-800 hover:bg-[#f5f0e8] shadow-2xs'
                } ${isSelected && !isActive ? 'ring-2 ring-emerald-600' : ''}`}
              >
                {/* Top Row: Icon in Top-Left, Status Badge in Top-Right */}
                <div className="flex items-start justify-between gap-3 w-full">
                  <div
                    className={`relative h-13 w-13 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                      isActive
                        ? 'bg-[#204933] text-emerald-100'
                        : isCompleted
                        ? 'bg-[#d7f2e3] text-[#1b3d2b]'
                        : 'bg-[#f0eae1] text-gray-700'
                    }`}
                  >
                    <Icon size={24} />
                    {isCompleted && (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#22c55e] text-white shadow-2xs">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-amber-400 text-[#153826] shadow-2xs">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
                        isActive
                          ? 'bg-[#f59e0b] text-[#153826]'
                          : isCompleted
                          ? 'bg-[#c8f0db] text-[#156136]'
                          : 'bg-[#e8e2d7] text-gray-700'
                      }`}
                    >
                      {step.status}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold text-emerald-200 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Stage
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Title */}
                <div className="my-2.5 space-y-1 w-full min-w-0">
                  <h4 className={`text-xs sm:text-sm font-extrabold leading-snug break-words ${isActive ? 'text-white' : 'text-gray-900'}`}>
                    {step.title}
                  </h4>
                </div>

                {/* Bottom Row: Date */}
                <div className="pt-2 border-t border-current/10 w-full flex items-center justify-between">
                  <p className={`text-[11px] sm:text-xs font-medium flex items-center gap-1.5 ${isActive ? 'text-emerald-100/90' : 'text-gray-500'}`}>
                    <Calendar size={13} className={isActive ? 'text-emerald-200/80' : 'text-gray-400'} /> {step.date} {step.subDate || ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Details Panel */}
      {activeStepObj && (
        <div className="rounded-3xl bg-[#f7faf4] border border-emerald-100 p-5 sm:p-6 relative overflow-hidden space-y-4 shadow-2xs w-full min-w-0">
          {/* Header Bar: Icon + Stage Title & Status */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pb-4 border-b border-emerald-900/10 w-full min-w-0">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-[#eaf6e6] to-[#d8edd0] border border-emerald-200/80 shadow-xs flex items-center justify-center shrink-0 p-1.5">
              <svg viewBox="0 0 100 100" className="w-full h-full text-[#245435]">
                <path fill="#4a8558" d="M30 45 C20 30 35 15 50 25 C45 35 40 42 30 45 Z" />
                <path fill="#2e633a" d="M50 25 C65 15 80 30 70 45 C60 42 55 35 50 25 Z" />
                <path fill="#5ca06c" d="M42 35 C32 20 48 10 58 20 C54 28 50 32 42 35 Z" />
                <path fill="#2b5336" d="M22 55 C22 78 78 78 78 55 L22 55 Z" />
                <path fill="#1d3d26" d="M20 52 C20 57 80 57 80 52 C80 47 20 47 20 52 Z" />
                <path fill="#a68453" d="M62 25 L45 60 C43 64 48 67 52 64 L68 28 Z" />
              </svg>
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#1e4d2b] bg-[#e3f4e6] px-2.5 py-0.5 rounded-full border border-emerald-200">
                Stage 0{activeStepObj.id} • {activeStepObj.status}
              </span>
              <h3 className="font-display text-base sm:text-lg font-extrabold text-[#112d1b] leading-tight break-words">
                {activeStepObj.title}
              </h3>
            </div>
          </div>

          {/* Details Content: Practitioner & Clinical Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full min-w-0 pt-1">
            <div className="flex items-start gap-3 bg-white/80 p-4 rounded-2xl border border-emerald-100/90 min-w-0 shadow-2xs">
              <div className="h-9 w-9 rounded-xl bg-[#e6f3e2] text-[#1b3d2b] flex items-center justify-center shrink-0">
                <User size={18} />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-gray-500">Attending Practitioner</p>
                <p className="text-sm font-extrabold text-gray-900 break-words">{activeStepObj.doctor}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/80 p-4 rounded-2xl border border-emerald-100/90 min-w-0 shadow-2xs">
              <div className="h-9 w-9 rounded-xl bg-[#e6f3e2] text-[#1b3d2b] flex items-center justify-center shrink-0 mt-0.5">
                <Target size={18} />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-gray-500">Clinical Overview</p>
                <p className="text-xs font-medium text-gray-700 leading-relaxed break-words">
                  {activeStepObj.notes}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
