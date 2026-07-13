import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarClock,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserCircle2,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { predictions, recoveryTrend, roleLabels, roleMenus } from '../data';

const fallbackDashboard = {
  stats: [],
  activities: [],
  modules: [],
};

export default function DashboardPage({ auth, onLogout }) {
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

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data } = await api.get('/dashboard');
        setDashboard(data);
      } catch (error) {
        setDashboard(fallbackDashboard);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="bg-dashboard-surface min-h-screen font-body text-forest">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb left-[-4rem] top-24 h-72 w-72 bg-[#d7e6cb]" />
        <div className="ambient-orb right-[-5rem] top-12 h-80 w-80 bg-[#ebd5b7]" />
        <div className="noise-grid absolute inset-0 opacity-[0.12]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-start gap-6 px-4 py-4 lg:grid-cols-[280px_1fr] lg:px-6 lg:py-6">
        <Sidebar role={auth.role} fullName={auth.fullName} onLogout={onLogout} />

        <main className="space-y-6 self-start">
          <section className="panel-frost overflow-hidden rounded-[2.4rem] p-4 xl:p-5">
            <div className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
              <div className="panel-frost bg-dashboard-panel-light relative overflow-hidden rounded-[2.2rem] px-6 py-6 text-forest">
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
                <h1 className="mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight md:text-4xl">
                  {roleLabels[auth.role]} workspace for {auth.fullName}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-forest/70">
                  A calmer operations view for consultations, therapy schedules, recovery signals, and the next
                  actions that matter most today.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-[#cfe0c2] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
                    Recovery-driven layout
                  </div>
                  <div className="rounded-full border border-[#cfe0c2] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-forest/70">
                    Refined dashboard
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {quickSignals.map(([label, value, Icon]) => (
                    <div key={label} className="rounded-[1.8rem] border border-[#cfe0c2] bg-white/80 p-4 backdrop-blur-sm">
                      <div className="mb-8 flex items-start justify-between gap-3">
                        <div className="inline-flex rounded-2xl bg-[#e7f2e1] p-3 text-sage">
                          <Icon size={18} />
                        </div>
                        <ArrowUpRight size={16} className="text-forest/35" />
                      </div>
                      <p className="text-xs uppercase tracking-[0.16em] text-forest/52">{label}</p>
                      <p className="mt-2 font-display text-3xl font-semibold text-forest">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[1.8rem] border border-[#cfe0c2] bg-white/78 p-4 backdrop-blur-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-forest/52">Role shortcuts</p>
                      <p className="mt-1 text-sm text-forest/70">Quick access areas for your current workflow.</p>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage">
                      {roleShortcuts.length} active
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {roleShortcuts.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[#cfe0c2] bg-white px-3 py-2 text-xs font-medium text-forest/76"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="panel-frost rounded-[2rem] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage/90">Today&apos;s focus</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-forest">Care flow is steady and visible</h2>
                  <p className="mt-3 text-sm leading-7 text-forest/68">
                    Review recovery flags, confirm sessions, and keep doctors, therapists, and patients aligned from
                    one board instead of jumping between modules.
                  </p>
                </div>

                <div className="grid gap-3">
                  {careHighlights.map(([label, value, description, Icon]) => (
                    <div key={label} className="panel-frost rounded-[1.8rem] px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-[#e6efdf] p-3 text-sage">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.16em] text-forest/52">{label}</p>
                              <p className="mt-1 font-display text-2xl font-semibold text-forest">{value}</p>
                            </div>
                            <ArrowUpRight size={16} className="mt-1 text-forest/35" />
                          </div>
                          <p className="mt-2 text-sm leading-6 text-forest/65">{description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[1.8rem] border border-[#d7c2a3] bg-[linear-gradient(135deg,#fffaf1_0%,#f7efdf_100%)] p-4 shadow-soft">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#f3e4c5] p-3 text-[#a06a3a]">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-forest/52">Operational note</p>
                      <p className="mt-1 text-sm leading-6 text-forest/68">
                        The dashboard is now organized like a care control board: signals first, trends second,
                        supporting modules after.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboard.stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="panel-frost rounded-[2.2rem] p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#e6efdf] p-3 text-sage">
                    <HeartPulse size={20} />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-semibold">Recovery wave</h2>
                    <p className="text-sm text-forest/65">Pain, sleep, and energy are easier to compare over time</p>
                  </div>
                </div>
                <p className="rounded-full bg-[#f3ead8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9d6a3b]">
                  5 tracked sessions
                </p>
              </div>

              <div className="h-72">
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

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {recoveryTrend.slice(-3).map((item) => (
                  <div key={item.session} className="rounded-[1.8rem] border border-sand/70 bg-[linear-gradient(135deg,#fbf6ee_0%,#fffaf3_100%)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-forest/55">{item.session}</p>
                    <div className="mt-3 space-y-2 text-sm text-forest/72">
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

            <div className="grid gap-6">
              <div className="panel-frost rounded-[2.2rem] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-2xl bg-[#f3e4c5] p-3 text-[#a06a3a]">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-semibold">AI recovery prediction</h2>
                    <p className="text-sm text-forest/65">Starter surface for model-backed outcome guidance</p>
                  </div>
                </div>

                <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,#fffaf1_0%,#f7f0e1_100%)] p-5">
                  <p className="text-sm font-semibold text-forest">Predicted recovery percentage</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="font-display text-5xl font-semibold text-sage">78%</p>
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

                <div className="mt-4 space-y-3">
                  {predictions.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-sand bg-white p-3">
                      <div className={`h-3 w-3 rounded-full ${item.color}`} />
                      <p className="flex-1 text-sm font-medium text-forest">{item.label}</p>
                      <span className="text-xs text-forest/60">{item.range}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-frost rounded-[2.2rem] p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#e6efdf] p-3 text-sage">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-semibold">Recent activity stream</h2>
                    <p className="text-sm text-forest/65">The latest visible actions across the care workflow</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {dashboard.activities.map((activity, index) => (
                    <div key={`${activity.title}-${activity.time}`} className="rounded-[1.8rem] border border-sand/70 bg-[linear-gradient(135deg,#fbf6ee_0%,#fffaf3_100%)] p-4">
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

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="panel-frost rounded-[2.2rem] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#e6efdf] p-3 text-sage">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold">Core modules</h2>
                  <p className="text-sm text-forest/65">Entry points arranged as a working board instead of a plain list</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4">
                {dashboard.modules.map((module, index) => (
                  <div
                    key={module.title}
                    className={`rounded-[1.8rem] border p-4 shadow-soft ${
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

            <div className="panel-frost rounded-[2.2rem] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#f3e4c5] p-3 text-[#a06a3a]">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold">Session insights</h2>
                  <p className="text-sm text-forest/65">A denser comparison view for outcome changes across sessions</p>
                </div>
              </div>
              <div className="mt-5 h-80">
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

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  ['Pain trend', 'Downward', 'Lower pain scores are staying consistent.'],
                  ['Sleep trend', 'Improving', 'Sleep quality continues to rise session by session.'],
                  ['Energy trend', 'Stable rise', 'Patients are showing better post-therapy energy.'],
                ].map(([label, value, text]) => (
                  <div key={label} className="rounded-[1.8rem] border border-sand/70 bg-[linear-gradient(135deg,#fbf6ee_0%,#fffaf3_100%)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-forest/50">{label}</p>
                    <p className="mt-2 font-display text-xl font-semibold text-forest">{value}</p>
                    <p className="mt-2 text-sm leading-6 text-forest/65">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-[#dce7d4] bg-[linear-gradient(135deg,#eff8ea_0%,#f7fcf2_48%,#edf5e7_100%)] p-6 shadow-soft">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-sage/90">Dashboard direction</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-forest">
                  The dashboard now reads like a care board, not a generic admin panel
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-forest/70">
                  Priority signals appear first, charts support the story, and modules plus activity are arranged like
                  active workflow lanes for Panchakarma teams.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Signals first', 'Hero metrics and role shortcuts are surfaced immediately.'],
                  ['Trend-led', 'Recovery data is grouped into wave and insight sections.'],
                  ['Workflow-ready', 'Modules and activity now feel like operational tools.'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-3xl border border-white/70 bg-white/75 p-4">
                    <p className="font-display text-lg font-semibold text-forest">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-forest/65">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

