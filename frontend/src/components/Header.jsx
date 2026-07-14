import { useState, useRef, useEffect } from 'react';
import { Bell, CalendarPlus, ChevronDown, LogOut, Stethoscope, UserCircle2, UserPlus, Wand2, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { roleMenus } from '../data';

export default function Header({ auth, onLogout, onAdminCreateClick }) {
  const [bookOpen, setBookOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setBookOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = auth?.fullName
    ? auth.fullName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'P';

  const doshaCompleted = Boolean(
    auth?.doshaAssessmentCompleted === true ||
      auth?.doshaAssessmentCompleted === 'true' ||
      auth?.dominantDosha,
  );

  const sampleNotifications = [
    { id: 1, icon: '🌿', title: 'Welcome to Panchakarma!', time: 'Just now', read: false },
    { id: 2, icon: '📋', title: 'Complete your Dosha Assessment', time: '2 min ago', read: !doshaCompleted ? false : true },
    { id: 3, icon: '🗓️', title: 'No upcoming sessions yet', time: 'Today', read: true },
  ];

  const unreadCount = sampleNotifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-50 w-full bg-[rgba(250,248,242,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 lg:px-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] shadow-lg">
            <Wand2 size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/50">
              Panchakarma
            </p>
            <p className="text-sm font-bold leading-none text-forest">Care Center</p>
          </div>
        </div>

        {/* Center — Greeting for non-patients */}
        <div className="hidden flex-1 justify-center md:flex">
          {auth?.role !== 'PATIENT' ? (
            <p className="text-sm font-medium text-forest/70">
              Welcome back, <span className="font-semibold text-forest">{auth?.fullName}</span> ✨
            </p>
          ) : null}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {auth?.role === 'PATIENT' ? (
            <nav className="hidden items-center gap-1 rounded-2xl bg-white/55 p-1 backdrop-blur-md lg:flex">
              {roleMenus.PATIENT.map((item) => (
                <button
                  key={item}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-forest/70 transition hover:bg-white/80 hover:text-forest"
                >
                  {item}
                </button>
              ))}
            </nav>
          ) : null}

          {auth?.role === 'THERAPIST' ? (
            <nav className="hidden items-center gap-1 rounded-2xl bg-white/55 p-1 backdrop-blur-md lg:flex">
              {roleMenus.THERAPIST.map((item) => {
                let toPath = '';
                if (item === 'Manage Sessions') {
                  toPath = `/dashboard/${auth.role.toLowerCase()}`;
                } else if (item === 'View Assigned Therapies') {
                  toPath = '/therapist/assigned-therapies';
                } else if (item === 'Patient History') {
                  toPath = `/dashboard/${auth.role.toLowerCase()}`; // Placeholder, adjust as needed
                }

                return (
                  <Link
                    key={item}
                    to={toPath}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-forest/70 transition hover:bg-white/80 hover:text-forest"
                  >
                    {item}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {auth?.role === 'ADMIN' ? (
            <button
              id="btn-create-therapist"
              onClick={onAdminCreateClick}
              className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(62,109,67,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_12px_30px_rgba(62,109,67,0.35)] active:translate-y-0"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Create Therapist</span>
            </button>
          ) : auth?.role === 'PATIENT' ? (
            <div className="relative" ref={dropRef}>
              <button
                id="btn-book-session"
                onClick={() => { setBookOpen((o) => !o); setNotifOpen(false); setProfileOpen(false); }}
                className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(62,109,67,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_12px_30px_rgba(62,109,67,0.35)] active:translate-y-0"
              >
                <CalendarPlus size={16} />
                <span className="hidden sm:inline">Book Session</span>
                <ChevronDown size={14} className={`transition-transform ${bookOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Book dropdown */}
              {bookOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_20px_60px_rgba(30,44,35,0.18)] backdrop-blur-xl">
                  <div className="p-2">
                    <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-forest/45">
                      Choose type
                    </p>
                    <button
                      id="btn-book-consultation"
                      onClick={() => { setBookOpen(false); navigate('/book-session?tab=consultation'); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-forest transition hover:bg-[#eaf4e3]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e6efdf] text-sage">
                        <Stethoscope size={15} />
                      </span>
                      Book Consultation
                    </button>
                    <button
                      id="btn-book-therapy"
                      onClick={() => { setBookOpen(false); navigate('/book-session?tab=therapy'); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-forest transition hover:bg-[#eaf4e3]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3e4c5] text-[#a06a3a]">
                        <Wand2 size={15} />
                      </span>
                      Book Therapy
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              id="btn-notifications"
              onClick={() => { setNotifOpen((o) => !o); setBookOpen(false); setProfileOpen(false); }}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-forest/70 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-forest"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_20px_60px_rgba(30,44,35,0.18)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-[#eef4ea] px-4 py-3">
                  <p className="text-sm font-semibold text-forest">Notifications</p>
                  <button onClick={() => setNotifOpen(false)} className="rounded-lg p-1 text-forest/40 transition hover:text-forest">
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto p-2">
                  {sampleNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 rounded-xl px-3 py-3 ${!n.read ? 'bg-[#f0f9ea]' : ''}`}
                    >
                      <span className="text-lg">{n.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm leading-5 ${!n.read ? 'font-semibold text-forest' : 'font-medium text-forest/70'}`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-forest/45">{n.time}</p>
                      </div>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sage" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile avatar */}
          <div className="relative" ref={profileRef}>
            <button
              id="btn-profile"
              onClick={() => { setProfileOpen((o) => !o); setBookOpen(false); setNotifOpen(false); }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-[linear-gradient(135deg,#e6efdf_0%,#d0e8c3_100%)] text-sm font-bold text-sage shadow-sm transition hover:scale-105 hover:shadow-md"
              title="View profile"
            >
              {initials}
            </button>

            {/* Profile dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_20px_60px_rgba(30,44,35,0.18)] backdrop-blur-xl">
                <div className="border-b border-[#eef4ea] p-4">
                  <p className="font-display text-lg font-semibold text-forest">{auth?.fullName}</p>
                  <p className="text-sm font-medium text-forest/70">{auth?.role}</p>
                  <p className="mt-1 text-xs text-forest/50">{auth?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-forest transition hover:bg-[#eaf4e3]"
                  >
                    <UserCircle2 size={16} /> View Profile
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); if (onLogout) onLogout(); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}