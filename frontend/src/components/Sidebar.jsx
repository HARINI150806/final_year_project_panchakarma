import { CalendarDays, HeartPulse, LayoutDashboard, LogOut, Sparkles, UserRoundCog } from 'lucide-react';
import { roleMenus } from '../data';

const iconMap = [LayoutDashboard, UserRoundCog, CalendarDays, HeartPulse];

export default function Sidebar({ role, fullName, onLogout }) {
  const items = roleMenus[role] || [];

  return (
    <aside className="panel-frost bg-dashboard-panel-light relative flex h-full flex-col justify-between overflow-hidden rounded-[2.2rem] px-5 py-6 text-forest lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
      <div className="ambient-orb right-[-2rem] top-8 h-40 w-40 bg-[#cce4c0]" />
      <div className="ambient-orb bottom-10 left-[-3rem] h-44 w-44 bg-[#e0f0d7]" />
      <div className="noise-grid absolute inset-0 opacity-[0.05]" />
      <div className="relative flex h-full flex-col justify-between gap-6">
      <div>

        {role === 'PATIENT' ? (
          <nav className="space-y-2">
            {items.map((item, index) => {
              const Icon = iconMap[index % iconMap.length];
              const isPrimary = index === 0;
              return (
                <button
                  key={item}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                    isPrimary
                      ? 'bg-white text-forest shadow-lg shadow-black/10'
                      : 'text-forest/76 hover:bg-white/60 hover:text-forest'
                  }`}
                  type="button"
                >
                  <span className={`rounded-xl p-2 ${isPrimary ? 'bg-[#f6f1e7] text-sage' : 'bg-[#eaf4e3] text-sage'}`}>
                    <Icon size={16} />
                  </span>
                  <span>{item}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="rounded-2xl bg-white/55 px-4 py-3 text-sm font-medium text-forest/70 backdrop-blur-sm">
            Therapist actions now live in the header.
          </div>
        )}
      </div>
      </div>
    </aside>
  );
}