import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarClock,
  Droplets,
  Flame,
  HeartPulse,
  Leaf,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserCircle2,
  Wind,
} from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AdminTherapistPanel from '../components/AdminTherapistPanel';
import TherapistDashboard from '../components/TherapistDashboard';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import PatientBookings from '../components/PatientBookings';
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
    <div className={`relative w-full max-w-[320px] overflow-hidden rounded-[1.4rem] border border-[#cfe0f0] bg-white/80 p-3 shadow-sm backdrop-blur-md`}>
      <div className="noise-grid absolute inset-0 opacity-5" />
      <div className="relative flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef5fb]">
            <DoshaIcon size={18} style={{ color: dosha.accent }} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-forest/40">Your Dosha</p>
            <p className="mt-0.5 font-display text-[1.2rem] font-bold leading-none text-forest">
              {dosha.emoji} {dosha.label}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {therapies.map((t) => (
            <span key={t} className="rounded-full bg-[#eef5fb] px-2.5 py-0.5 text-[11px] font-semibold text-sage">
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
    <div className="panel-frost h-full w-full max-w-[320px] rounded-[1.4rem] p-3 md:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-forest/40">
            Wellness snapshot
          </p>
          <p className="mt-1 font-display text-[1rem] font-semibold text-forest">
            {auth?.fullName || 'Patient'} overview
          </p>
        </div>
        <div className="rounded-2xl bg-[#eef6e6] p-2.5 text-sage">
          <HeartPulse size={16} />
        </div>
      </div>

      <div className="mt-2.5 space-y-2">
        <div className="rounded-2xl bg-white/70 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-forest/40">Assessment</p>
          <p className="mt-0.5 text-sm font-medium text-forest">
            {dosha ? `${dosha.label} dominant` : 'Completed'}
          </p>
        </div>
        <div className="rounded-2xl bg-white/70 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-forest/40">Completed on</p>
          <p className="mt-0.5 text-sm font-medium text-forest">{assessedOn}</p>
        </div>
        <div className="rounded-2xl bg-white/70 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-forest/40">Next step</p>
          <p className="mt-0.5 text-sm font-medium text-forest">Review therapies and keep recovery steady</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────
export default function DashboardPage({ auth, onLogout, onAuthUpdate }) {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(fallbackDashboard);

  const quickSignals = [
    ['Upcoming therapies', '12', CalendarClock],
    ['Patient alerts', '04', Bell],
    ['Active patients', '184', UserCircle2],
  ];
  const careHighlights = [
    ['Recovery confidence', '78%', 'Strong improvement across the latest therapy cycle.', HeartPulse],
    ['Clinical momentum', '+12%', 'Steady improvement in tracked outcomes this week.', TrendingUp],
    ['Care readiness', '24 sessions', "Today's assigned sessions are prepared and visible.", ShieldCheck],
  ];
  const roleShortcuts = (roleMenus[auth.role] || []).slice(0, 6);
  const isPatient = auth?.role === 'PATIENT';
  const isAdmin = auth?.role === 'ADMIN';
  const isTherapist = auth?.role === 'THERAPIST';
  const doshaCompleted = Boolean(
    auth?.doshaAssessmentCompleted === true ||
      auth?.doshaAssessmentCompleted === 'true' ||
      auth?.dominantDosha,
  );

  function scrollToAdminTherapistPanel() {
    document.getElementById('admin-therapist-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data } = await api.get('/dashboard');
        setDashboard(data);
      } catch {
        setDashboard(fallbackDashboard);
      }
    }
    if (!isAdmin) {
      loadDashboard();
    }
  }, []);

  return (
    <div className="bg-dashboard-surface min-h-screen font-body text-forest">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb left-[-4rem] top-24 h-72 w-72 bg-[#d7e6cb]" />
        <div className="ambient-orb right-[-5rem] top-12 h-80 w-80 bg-[#ebd5b7]" />
        <div className="noise-grid absolute inset-0 opacity-[0.12]" />
      </div>

      {/* Sticky header */}
      <div className="relative z-40 panel-frost border-b border-white/60">
        <Header auth={auth} onLogout={onLogout} onAdminCreateClick={scrollToAdminTherapistPanel} />
      </div>

      {isAdmin ? (
        <main className="relative mx-auto max-w-6xl space-y-4 px-3 py-3 lg:px-4 lg:py-4">
          <AdminTherapistPanel />
        </main>
      ) : (
        <div className={`relative mx-auto items-start gap-4 px-3 py-3 lg:px-4 lg:py-4 ${isPatient ? 'max-w-6xl' : 'grid max-w-7xl lg:grid-cols-[280px_1fr]'}`}>
        {/* Sidebar for staff roles */}
        {!isPatient && <Sidebar role={auth.role} fullName={auth.fullName} onLogout={onLogout} />}

        <main className="space-y-4 self-start">

          {/* ── Patient-only: Dosha Assessment Banner or Result ── */}
          {isPatient && (
            <section className="pt-1">
              {!doshaCompleted ? (
                <DoshaCallToAction onStart={() => navigate('/dosha-assessment')} />
              ) : (
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                  <DoshaResultCard auth={auth} />
                  <DoshaSnapshotPanel auth={auth} />
                </div>
              )}
            </section>
          )}

          {isPatient && (
            <section>
              <PatientBookings />
            </section>
          )}

          {/* ── Hero panel ── */}
          <section className="panel-frost overflow-hidden rounded-[2.2rem] p-3 xl:p-4">
            <div className="grid gap-3 xl:grid-cols-[1.45fr_0.9fr]">
              <div className="panel-frost bg-dashboard-panel-light relative overflow-hidden rounded-[2rem] px-5 py-5 text-forest">
                <div className="ambient-orb right-[-3rem] top-[-2rem] h-44 w-44 bg-[#cce4c0]" />
                <div className="ambient-orb bottom-[-2rem] left-[12%] h-52 w-52 bg-[#e0f0d7]" />
                <div className="noise-grid absolute inset-0 opacity-[0.05]" />
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe0c2] bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-forest/80">
                      <Sparkles size={14} />
                      Live command center
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe0c2] bg-white/80 px-3 py-1.5 text-xs font-medium text-forest/70">
                      <Stethoscope size={14} />
                      Panchakarma operations
                    </div>
                  </div>
                  <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight md:text-[2.15rem]">
                    {roleLabels[auth.role]} workspace for {auth.fullName}
                  </h1>
                  <p className="mt-2.5 max-w-2xl text-sm leading-6 text-forest/70">
                    A calmer operations view for consultations, therapy schedules, recovery signals, and the next
                    actions that matter most today.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="rounded-full border border-[#cfe0c2] bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">
                      Recovery-driven layout
                    </div>
                    <div className="rounded-full border border-[#cfe0c2] bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-forest/70">
                      Refined dashboard
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2.5 md:grid-cols-3">
                    {quickSignals.map(([label, value, Icon]) => (
                      <div key={label} className="rounded-[1.6rem] border border-[#cfe0c2] bg-white/80 p-3 backdrop-blur-sm">
                        <div className="mb-5 flex items-start justify-between gap-3">
                          <div className="inline-flex rounded-2xl bg-[#e7f2e1] p-2.5 text-sage">
                            <Icon size={16} />
                          </div>
                          <ArrowUpRight size={14} className="text-forest/35" />
                        </div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-forest/50">{label}</p>
                        <p className="mt-1.5 font-display text-2xl font-semibold text-forest">{value}</p>
                      </div>
                    ))}
                  </div>

                  {!isPatient && (
                    <div className="mt-4 rounded-[1.6rem] border border-[#cfe0c2] bg-white/78 p-3.5 backdrop-blur-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.14em] text-forest/52">Role shortcuts</p>
                          <p className="mt-1 text-sm text-forest/68">Quick access areas for your current workflow.</p>
                        </div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">
                          {roleShortcuts.length} active
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {roleShortcuts.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-[#cfe0c2] bg-white px-2.5 py-1.5 text-[11px] font-medium text-forest/76"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="panel-frost rounded-[1.8rem] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage/90">Today&apos;s focus</p>
                  <h2 className="mt-1.5 font-display text-[1.3rem] font-semibold text-forest">Care flow is steady and visible</h2>
                  <p className="mt-2 text-sm leading-6 text-forest/68">
                    Review recovery flags, confirm sessions, and keep therapists and patients aligned from
                    one board instead of jumping between modules.
                  </p>
                </div>

                <div className="grid gap-2.5">
                  {careHighlights.map(([label, value, description, Icon]) => (
                    <div key={label} className="panel-frost rounded-[1.6rem] px-3.5 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-[#e6efdf] p-2.5 text-sage">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.14em] text-forest/50">{label}</p>
                              <p className="mt-0.5 font-display text-[1.35rem] font-semibold text-forest">{value}</p>
                            </div>
                            <ArrowUpRight size={14} className="mt-1 text-forest/35" />
                          </div>
                          <p className="mt-1.5 text-sm leading-6 text-forest/65">{description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[1.6rem] border border-[#d7c2a3] bg-[linear-gradient(135deg,#fffaf1_0%,#f7efdf_100%)] p-3.5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#f3e4c5] p-2.5 text-[#a06a3a]">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-forest/52">Operational note</p>
                      <p className="mt-1 text-sm leading-6 text-forest/68">
                        The dashboard is now organised like a care control board: signals first, trends second,
                        supporting modules after.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Stats ── */}
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {dashboard.stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </section>

          {/* ── Recovery charts ── */}
          <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="panel-frost rounded-[1.8rem] p-4">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#e6efdf] p-2.5 text-sage">
                    <HeartPulse size={18} />
                  </div>
                  <div>
                    <h2 className="font-display text-[1.35rem] font-semibold">Recovery wave</h2>
                    <p className="text-sm text-forest/65">Pain, sleep, and energy are easier to compare over time</p>
                  </div>
                </div>
                <p className="rounded-full bg-[#f3ead8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9d6a3b]">
                  5 tracked sessions
                </p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recoveryTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d3" />
                    <XAxis dataKey="session" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pain" stroke="#ea580c" strokeWidth={3} />
                    <Line type="monotone" dataKey="sleep" stroke="#5f8752" strokeWidth={3} />
                    <Line type="monotone" dataKey="energy" stroke="#b87444" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid gap-2.5 md:grid-cols-3">
                {recoveryTrend.slice(-3).map((item) => (
                  <div key={item.session} className="rounded-[1.6rem] border border-sand/70 bg-[linear-gradient(135deg,#fbf6ee_0%,#fffaf3_100%)] p-3.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-forest/55">{item.session}</p>
                    <div className="mt-2.5 space-y-1.5 text-sm text-forest/72">
                      <div className="flex items-center justify-between">
                        <span>Pain</span>
                        <span className="font-semibold text-[#c46621]">{item.pain}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Sleep</span>
                        <span className="font-semibold text-sage">{item.sleep}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Energy</span>
                        <span className="font-semibold text-[#9d6a3b]">{item.energy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="panel-frost rounded-[1.8rem] p-4">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-2xl bg-[#f3e4c5] p-2.5 text-[#a06a3a]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="font-display text-[1.35rem] font-semibold">AI recovery prediction</h2>
                    <p className="text-sm text-forest/65">Starter surface for model-backed outcome guidance</p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#fffaf1_0%,#f7f0e1_100%)] p-4">
                  <p className="text-sm font-semibold text-forest">Predicted recovery percentage</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="font-display text-4xl font-semibold text-sage">78%</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sage shadow-sm">
                      Status: Good
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full w-[78%] rounded-full bg-[linear-gradient(90deg,#6b9a67_0%,#9dc78d_100%)]" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-forest/65">
                    Current signals suggest a healthy response to therapy with room to improve consistency across sleep
                    and energy levels.
                  </p>
                </div>

                <div className="mt-3 space-y-2.5">
                  {predictions.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-sand bg-white p-2.5">
                      <div className={`h-3 w-3 rounded-full ${item.color}`} />
                      <p className="flex-1 text-sm font-medium text-forest">{item.label}</p>
                      <span className="text-xs text-forest/60">{item.range}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-frost rounded-[1.8rem] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#e6efdf] p-2.5 text-sage">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h2 className="font-display text-[1.35rem] font-semibold">Recent activity stream</h2>
                    <p className="text-sm text-forest/65">The latest visible actions across the care workflow</p>
                  </div>
                </div>
                <div className="mt-3.5 space-y-2.5">
                  {dashboard.activities.map((activity, index) => (
                    <div key={`${activity.title}-${activity.time}`} className="rounded-[1.6rem] border border-sand/70 bg-[linear-gradient(135deg,#fbf6ee_0%,#fffaf3_100%)] p-3.5">
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="mt-1 h-3 w-3 rounded-full bg-sage" />
                          {index !== dashboard.activities.length - 1 ? <div className="mt-2 h-full w-px bg-sand/70" /> : null}
                        </div>
                        <div className="min-w-0 flex-1 pb-1">
                          <p className="text-sm font-semibold text-forest">{activity.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-sage/80">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Modules and session insights ── */}
          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="panel-frost rounded-[1.8rem] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#e6efdf] p-2.5 text-sage">
                  <Activity size={18} />
                </div>
                <div>
                  <h2 className="font-display text-[1.35rem] font-semibold">Core modules</h2>
                  <p className="text-sm text-forest/65">Entry points arranged as a working board instead of a plain list</p>
                </div>
              </div>
              <div className="mt-3.5 grid gap-2.5">
                {dashboard.modules.map((module, index) => (
                  <div
                    key={module.title}
                    className={`rounded-[1.6rem] border p-3.5 shadow-soft ${
                      index % 2 === 0
                        ? 'border-sand bg-[linear-gradient(135deg,#fbf6ee_0%,#fff8ef_100%)]'
                        : 'border-[#d9e7d2] bg-[linear-gradient(135deg,#f4f9f1_0%,#fcfff8_100%)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-forest/50">Module {index + 1}</p>
                        <h3 className="mt-1 font-display text-lg font-semibold">{module.title}</h3>
                      </div>
                      <ArrowUpRight size={16} className="text-forest/35" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-forest/65">{module.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-frost rounded-[1.8rem] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#f3e4c5] p-2.5 text-[#a06a3a]">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h2 className="font-display text-[1.35rem] font-semibold">Session insights</h2>
                  <p className="text-sm text-forest/65">A denser comparison view for outcome changes across sessions</p>
                </div>
              </div>
              <div className="mt-3.5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recoveryTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d3" />
                    <XAxis dataKey="session" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pain" fill="#fb923c" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="sleep" fill="#6b9a67" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="energy" fill="#c08a56" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3.5 grid gap-2.5 md:grid-cols-3">
                {[
                  ['Pain trend', 'Downward', 'Lower pain scores are staying consistent.'],
                  ['Sleep trend', 'Improving', 'Sleep quality continues to rise session by session.'],
                  ['Energy trend', 'Stable rise', 'Patients are showing better post-therapy energy.'],
                ].map(([label, value, text]) => (
                  <div key={label} className="rounded-[1.6rem] border border-sand/70 bg-[linear-gradient(135deg,#fbf6ee_0%,#fffaf3_100%)] p-3.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-forest/50">{label}</p>
                    <p className="mt-1.5 font-display text-[1.15rem] font-semibold text-forest">{value}</p>
                    <p className="mt-1.5 text-sm leading-6 text-forest/65">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Footer card ── */}
          <section className="rounded-[1.8rem] border border-[#dce7d4] bg-[linear-gradient(135deg,#eff8ea_0%,#f7fcf2_48%,#edf5e7_100%)] p-4 shadow-soft">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-sage/90">Dashboard direction</p>
                <h2 className="mt-1.5 font-display text-[1.35rem] font-semibold text-forest">
                  The dashboard now reads like a care board, not a generic admin panel
                </h2>
                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-forest/70">
                  Priority signals appear first, charts support the story, and modules plus activity are arranged like
                  active workflow lanes for Panchakarma teams.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {[
                  ['Signals first', 'Hero metrics and role shortcuts are surfaced immediately.'],
                  ['Trend-led', 'Recovery data is grouped into wave and insight sections.'],
                  ['Workflow-ready', 'Modules and activity now feel like operational tools.'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-[1.4rem] border border-white/70 bg-white/75 p-3.5">
                    <p className="font-display text-base font-semibold text-forest">{title}</p>
                    <p className="mt-1.5 text-sm leading-6 text-forest/65">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
      )}
    </div>
  );
}
