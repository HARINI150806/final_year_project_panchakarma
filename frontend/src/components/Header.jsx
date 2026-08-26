import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, CalendarPlus, ChevronDown, LogOut, Stethoscope, UserCircle2, UserPlus, Wand2, X } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { roleMenus, patientNavItems } from '../data';
import api from '../api';

export default function Header({ auth, onLogout, onAdminCreateClick, activeTab, onTabChange }) {
  const [bookOpen, setBookOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const currentTabFromUrl = searchParams.get('tab');
  const currentActiveTab = activeTab || currentTabFromUrl || 'home';

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

  const [notifications, setNotifications] = useState([]);
  const [hasBooked1stTherapy, setHasBooked1stTherapy] = useState(false);

  useEffect(() => {
    if (auth?.role?.toUpperCase() === 'PATIENT') {
      api.get('/patient/bookings')
        .then(res => {
          const bookings = res.data || [];
          const completedCons = bookings.filter(b => (b.bookingType === 'CONSULTATION' || b.type === 'CONSULTATION') && (b.bookingStatus === 'COMPLETED' || b.status === 'COMPLETED' || b.bookingStatus === 'CONFIRMED'));
          const activeTherapyBookings = bookings.filter(b => (b.bookingType === 'THERAPY' || b.type === 'THERAPY') && (b.bookingStatus !== 'CANCELLED' && b.status !== 'CANCELLED') && (b.bookingStatus !== 'COMPLETED' && b.status !== 'COMPLETED'));
          if (completedCons.length > 0) {
            const latestCons = completedCons[0];
            const consDate = new Date(latestCons.createdAt || latestCons.date);
            const therapyAfterCons = activeTherapyBookings.filter(tb => new Date(tb.createdAt || tb.date) >= consDate || tb.sessionNumber === 1 || tb.totalSessions >= 1);
            if (therapyAfterCons.length > 0) setHasBooked1stTherapy(true);
            else setHasBooked1stTherapy(false);
          } else if (activeTherapyBookings.length > 0) {
            setHasBooked1stTherapy(true);
          } else {
            setHasBooked1stTherapy(false);
          }
        })
        .catch(() => {});
    }
  }, [auth]);

  const fetchNotifications = useCallback(async () => {
    if (!auth) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [auth]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000); // Check every 4s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      handleMarkAsRead(n.id);
    }
    setNotifOpen(false);

    const role = auth?.role?.toUpperCase();
    let target = n.targetUrl;

    if (!target) {
      const title = (n.title || '').toLowerCase();
      const msg = (n.message || '').toLowerCase();
      const text = title + ' ' + msg;

      let resolvedBookingId = null;
      const match = msg.match(/(?:booking|appointment)\s*(?:id|#)?\s*:?\s*(\d+)/i) ||
                    title.match(/(?:booking|appointment)\s*(?:id|#)?\s*:?\s*(\d+)/i);
      if (match) {
        resolvedBookingId = match[1];
      }

      if (!resolvedBookingId && (role === 'THERAPIST' || role === 'PATIENT')) {
        try {
          const endpoint = role === 'THERAPIST' ? '/therapists/my-bookings' : '/patient/bookings';
          const { data: userBookings } = await api.get(endpoint);

          if (Array.isArray(userBookings) && userBookings.length > 0) {
            const found = userBookings.find(b => {
              const pName = (b.patientFullName || b.patientName || '').toLowerCase();
              const date = (b.bookingDate || b.date || '').toString();

              if (title.includes('reschedule request') && b.rescheduleRequested) return true;
              if (title.includes('alternative') && b.altSlotsPending) return true;
              if (pName && msg.includes(pName)) return true;
              if (date && msg.includes(date)) return true;
              return false;
            }) || userBookings[0];

            if (found) {
              resolvedBookingId = found.bookingId || found.id;
            }
          }
        } catch (err) {
          console.error('Failed smart lookup for notification booking', err);
        }
      }

      if (role === 'PATIENT') {
        if (text.includes('treatment') || text.includes('prescribed') || text.includes('plan')) {
          target = '/dashboard/patient?tab=treatment';
        } else if (
          text.includes('booking') ||
          text.includes('reschedul') ||
          text.includes('appointment') ||
          text.includes('slot') ||
          text.includes('session')
        ) {
          target = `/dashboard/patient?tab=appointments${resolvedBookingId ? `&bookingId=${resolvedBookingId}` : ''}`;
        } else if (text.includes('wellness') || text.includes('routine') || text.includes('dosha')) {
          target = '/dashboard/patient?tab=wellness';
        } else {
          target = '/dashboard/patient';
        }
      } else if (role === 'THERAPIST') {
        if (text.includes('availability') || text.includes('schedule slot')) {
          target = '/therapist/availability';
        } else if (text.includes('assigned therapies') || text.includes('my patients')) {
          target = '/therapist/assigned-therapies';
        } else {
          target = `/dashboard/therapist${resolvedBookingId ? `?bookingId=${resolvedBookingId}` : ''}`;
        }
      } else if (role === 'ADMIN') {
        target = '/dashboard/admin';
      }
    }

    if (target) {
      try {
        const urlObj = new URL(target, window.location.origin);
        const tabParam = urlObj.searchParams.get('tab');
        const bookingId = urlObj.searchParams.get('bookingId');
        const planId = urlObj.searchParams.get('planId');

        if (tabParam && onTabChange && location.pathname.includes('/dashboard/patient')) {
          onTabChange(tabParam);
        }

        navigate(target);

        let attempts = 0;
        const doScroll = () => {
          let el = null;
          if (bookingId) {
            el = document.getElementById(`patient-booking-${bookingId}`) ||
                 document.getElementById(`therapist-booking-${bookingId}`);
          }
          if (!el && planId) {
            el = document.getElementById(`treatment-plan-${planId}`);
          }
          if (!el && !bookingId && !planId) {
            if (tabParam === 'appointments') {
              el = document.getElementById('patient-appointments-section');
            } else if (tabParam === 'treatment') {
              el = document.getElementById('treatment-journey-section');
            } else if (role === 'THERAPIST') {
              el = document.getElementById('therapist-bookings-section');
            }
          }

          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (attempts < 25) {
            attempts++;
            setTimeout(doScroll, 100);
          }
        };

        setTimeout(doScroll, 100);
      } catch (e) {
        console.error('Invalid target URL', e);
        navigate(target);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="relative z-20 w-full bg-[#f8f9f6]/95 border-b border-gray-200/50 backdrop-blur-md">
      <div className="mx-auto flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left Side: Hamburger & Greeting */}
        <div className="flex items-center gap-3">
          {/* Brand logo shown on mobile (< lg) */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2a4d33] text-white">
              <Wand2 size={16} />
            </div>
            <span className="font-bold text-sm text-[#193322]">Panchakarma</span>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <p className="text-sm font-medium text-forest/70">
              Welcome back, <span className="font-bold text-forest">{auth?.fullName}</span> ✨
            </p>
          </div>
        </div>

        {/* Mobile Greeting */}
        <div className="block lg:hidden text-xs font-medium text-forest/70">
          Welcome, <span className="font-bold">{auth?.fullName}</span> ✨
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">



          {auth?.role === 'ADMIN' ? (
            <button
              id="btn-create-therapist"
              onClick={onAdminCreateClick}
              className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(62,109,67,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(62,109,67,0.35)] active:translate-y-0"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Create Therapist</span>
            </button>
          ) : auth?.role === 'PATIENT' ? (
            <div className="relative" ref={dropRef}>
              <button
                id="btn-book-session"
                onClick={() => { setBookOpen((o) => !o); setNotifOpen(false); setProfileOpen(false); }}
                className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(62,109,67,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(62,109,67,0.35)] active:translate-y-0"
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
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-forest transition duration-200 hover:-translate-y-0.5 hover:bg-[#eaf4e3] hover:shadow-sm"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e6efdf] text-sage">
                        <Stethoscope size={15} />
                      </span>
                      Book Consultation
                    </button>
                    <button
                      id="btn-book-therapy"
                      onClick={() => { setBookOpen(false); navigate('/book-session?tab=therapy'); }}
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-forest transition duration-200 hover:-translate-y-0.5 hover:bg-[#eaf4e3] hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3e4c5] text-[#a06a3a]">
                          <Wand2 size={15} />
                        </span>
                        <span>Book Therapy</span>
                      </div>
                      {hasBooked1stTherapy && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 border border-amber-300">
                          Booked
                        </span>
                      )}
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
              onClick={() => {
                setNotifOpen((o) => {
                  if (!o) fetchNotifications();
                  return !o;
                });
                setBookOpen(false);
                setProfileOpen(false);
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-forest/70 shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-forest hover:shadow-[0_12px_24px_rgba(19,31,24,0.12)]"
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
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-forest/45">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`flex items-start gap-3 rounded-xl px-3 py-3 cursor-pointer transition duration-200 hover:-translate-y-0.5 hover:bg-forest/5 hover:shadow-sm ${!n.isRead ? 'bg-[#f0f9ea]' : ''}`}
                      >
                        <span className="text-lg">🌿</span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm leading-5 ${!n.isRead ? 'font-semibold text-forest' : 'font-medium text-forest/70'}`}>
                            {n.title}
                          </p>
                          <p className="mt-1 text-xs text-forest/60 leading-relaxed">{n.message}</p>
                          <p className="mt-1 text-[10px] text-forest/40">
                            {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sage" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile avatar */}
          <div className="relative" ref={profileRef}>
            <button
              id="btn-profile"
              onClick={() => { setProfileOpen((o) => !o); setBookOpen(false); setNotifOpen(false); }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-[linear-gradient(135deg,#e6efdf_0%,#d0e8c3_100%)] text-sm font-bold text-sage shadow-sm transition duration-200 hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(19,31,24,0.12)]"
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
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-forest transition duration-200 hover:-translate-y-0.5 hover:bg-[#eaf4e3] hover:shadow-sm"
                  >
                    <UserCircle2 size={16} /> View Profile
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); if (onLogout) onLogout(); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition duration-200 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-sm"
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