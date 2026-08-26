import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, CheckCheck, AlertTriangle, Menu, X, ShieldCheck } from 'lucide-react';
import api from '../api';

export default function PharmacistHeader({
  auth,
  onLogout,
  onAddStockClick,
  onNotificationItemClick,
  onToggleMobileDrawer,
  isMobileDrawerOpen
}) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/pharmacist/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Error fetching notifications', err);
      setNotifications([]);
    }
  };

  const unreadCount = notifications.filter((n) => !n.readStatus).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/pharmacist/notifications/${id}/read`);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, readStatus: true } : n)));
    } catch (err) {
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, readStatus: true } : n)));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/pharmacist/notifications/read-all');
      setNotifications(notifications.map((n) => ({ ...n, readStatus: true })));
    } catch (err) {
      setNotifications(notifications.map((n) => ({ ...n, readStatus: true })));
    }
  };

  const initials = auth?.fullName
    ? auth.fullName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'PH';

  return (
    <header className="relative z-20 w-full bg-[#f8f9f6]/95 border-b border-gray-200/50 backdrop-blur-md">
      <div className="mx-auto flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left Side: Mobile Toggle & Greeting */}
        <div className="flex items-center gap-3">
          {onToggleMobileDrawer && (
            <button
              type="button"
              onClick={onToggleMobileDrawer}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-200/60 transition cursor-pointer"
            >
              {isMobileDrawerOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}

          <div className="hidden items-center gap-3 lg:flex">
            <p className="text-sm font-medium text-forest/70">
              Welcome back, <span className="font-bold text-forest">{auth?.fullName || 'Pharmacist'}</span> ✨
            </p>
          </div>

          <div className="block lg:hidden text-xs font-medium text-forest/70">
            Welcome, <span className="font-bold">{auth?.fullName || 'Pharmacist'}</span> ✨
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications((o) => {
                  if (!o) fetchNotifications();
                  return !o;
                });
                setShowProfileMenu(false);
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-forest/70 shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-forest hover:shadow-[0_12px_24px_rgba(19,31,24,0.12)] cursor-pointer"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_20px_60px_rgba(30,44,35,0.18)] backdrop-blur-xl z-50">
                <div className="flex items-center justify-between border-b border-[#eef4ea] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-forest" />
                    <p className="text-sm font-semibold text-forest">Pharmacy Alerts</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-forest/70 hover:text-forest flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-forest/45">
                      No notifications available
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isCritical = n.type === 'CRITICAL_STOCK' || n.type === 'EXPIRY_ALERT';
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.readStatus) handleMarkAsRead(n.id);
                            if (onNotificationItemClick) onNotificationItemClick(n);
                            setShowNotifications(false);
                          }}
                          className={`flex items-start gap-3 rounded-xl px-3 py-3 cursor-pointer transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                            n.readStatus
                              ? 'bg-gray-50/60 opacity-75'
                              : isCritical
                              ? 'bg-rose-50/80'
                              : 'bg-[#f0f9ea]'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
                            <AlertTriangle size={15} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm leading-5 ${!n.readStatus ? 'font-semibold text-forest' : 'font-medium text-forest/70'}`}>
                                {n.title}
                              </p>
                              {!n.readStatus && <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />}
                            </div>
                            <p className="mt-1 text-xs text-forest/60 leading-relaxed">{n.message}</p>
                            <p className="mt-1 text-[10px] text-forest/40">
                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile avatar */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setShowProfileMenu((o) => !o);
                setShowNotifications(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-[linear-gradient(135deg,#e6efdf_0%,#d0e8c3_100%)] text-sm font-bold text-sage shadow-sm transition duration-200 hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(19,31,24,0.12)] cursor-pointer"
              title="View profile"
            >
              {initials}
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_20px_60px_rgba(30,44,35,0.18)] backdrop-blur-xl z-50">
                <div className="border-b border-[#eef4ea] p-4">
                  <p className="font-display text-lg font-semibold text-forest">{auth?.fullName || 'Pharmacist'}</p>
                  <p className="text-sm font-medium text-forest/70">Pharmacy Officer</p>
                  <p className="mt-1 text-xs text-forest/50">{auth?.email || ''}</p>
                </div>
                <div className="p-2">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition duration-200 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-sm cursor-pointer"
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
