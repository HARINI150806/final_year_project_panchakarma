import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Stethoscope, FileText, ClipboardList, Menu, X } from 'lucide-react';

export default function DashboardLayout({
  children,
  auth,
  onLogout,
  activeTab = 'home',
  onTabChange,
  onAdminCreateClick,
}) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleTabSelect = (tabId) => {
    setIsMobileDrawerOpen(false);
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      const role = auth?.role?.toLowerCase() || 'patient';
      navigate(`/dashboard/${role}?tab=${tabId}`);
    }
  };

  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appts', icon: CalendarDays },
    { id: 'treatment', label: 'Therapy', icon: Stethoscope },
    { id: 'prescriptions', label: 'Rx', icon: FileText },
    { id: 'reports', label: 'Reports', icon: ClipboardList },
  ];

  const isPatient = auth && auth.role?.toUpperCase() === 'PATIENT';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5faf2] flex font-body text-forest antialiased relative pb-20 lg:pb-8">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb left-[-4rem] top-24 h-72 w-72 bg-[#d7e6cb]" />
        <div className="ambient-orb right-[-5rem] top-12 h-80 w-80 bg-[#ebd5b7]" />
        <div className="noise-grid absolute inset-0 opacity-[0.08]" />
      </div>

      {/* Fixed Desktop Left Sidebar */}
      {isPatient && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabSelect}
          isCollapsed={isCollapsed}
          onToggleCollapse={setIsCollapsed}
        />
      )}

      {/* Main Layout Area */}
      <main className={`flex-1 min-w-0 ml-0 transition-all duration-300 flex flex-col ${isPatient ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-[260px]') : ''}`}>
        {/* Sticky top header */}
        <Header
          auth={auth}
          onLogout={onLogout}
          onAdminCreateClick={onAdminCreateClick}
          activeTab={activeTab}
          onTabChange={handleTabSelect}
        />

        {/* Mobile Drawer Trigger Bar (Visible on mobile & tablet < lg) */}
        {isPatient && (
          <div className="lg:hidden relative z-30 bg-[#f4faee]/90 border-b border-emerald-900/10 px-4 py-2.5 flex items-center justify-between backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="flex items-center gap-2 rounded-2xl bg-white border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-950 shadow-xs active:scale-95 cursor-pointer"
            >
              {isMobileDrawerOpen ? <X size={16} /> : <Menu size={16} />}
              <span>Menu & Navigation</span>
            </button>

            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-full">
              {activeTab}
            </span>
          </div>
        )}

        {/* Mobile Backdrop & Drawer */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-forest/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            {/* Drawer content */}
            <div className="relative z-10 w-72 max-w-[85vw] bg-gradient-to-b from-white via-[#f7fcf4] to-[#edf7e7] p-5 shadow-2xl overflow-y-auto flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-emerald-900/10 pb-3 mb-4">
                <span className="font-display font-bold text-forest text-base">Navigation</span>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-xl bg-white border border-emerald-200 text-forest hover:bg-emerald-50"
                >
                  <X size={18} />
                </button>
              </div>

              <Sidebar
                activeTab={activeTab}
                onTabChange={handleTabSelect}
                isCollapsed={false}
                isMobile={true}
              />
            </div>
          </div>
        )}

        {/* Main Page Content Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 motion-fade-in-up">
          {children}
        </section>
      </main>

      {/* Mobile Bottom Navigation Bar (Visible on mobile < lg) */}
      {auth && auth.role?.toUpperCase() === 'PATIENT' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-emerald-900/10 px-2 py-2 flex items-center justify-around shadow-[0_-8px_24px_rgba(28,52,39,0.08)]">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabSelect(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-100/90 text-emerald-950 font-extrabold scale-105'
                    : 'text-gray-500 hover:text-forest'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#2d5a37]' : 'text-gray-400'} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
