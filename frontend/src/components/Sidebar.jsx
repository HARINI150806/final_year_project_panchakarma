import { useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Stethoscope,
  FileText,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Users,
  Clock,
  Sparkles,
  BarChart3,
  BookOpen,
  LogOut,
  Wallet,
} from 'lucide-react';
import mortarPestleImg from '../assets/ayurveda_mortar_pestle.png';

const patientMenuItems = [
  { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'treatment', label: 'Treatment History', icon: Stethoscope },
  { id: 'followups', label: 'My Follow-ups', icon: Clock },
  { id: 'documents', label: 'Medical Documents', icon: FileText },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
  { id: 'complaints', label: 'My Complaints', icon: ClipboardList },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const therapistMenuGroups = [
  {
    title: 'WORKSPACE',
    items: [
      { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'sessions', label: 'My Sessions', icon: CalendarDays },
      { id: 'patients', label: 'My Patients', icon: Users },
      { id: 'consultations', label: 'Consultations', icon: Stethoscope },
    ],
  },
  {
    title: 'CARE MANAGEMENT',
    items: [

      { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
      { id: 'followups', label: 'Follow-ups', icon: Clock },
      { id: 'notes', label: 'Patient Notes', icon: ClipboardList },
    ],
  },
  {
    title: 'SCHEDULE & PAYOUTS',
    items: [
      { id: 'wallet', label: 'Wallet & Earnings', icon: Wallet },
      { id: 'availability', label: 'Availability', icon: Clock },
      { id: 'requests', label: 'Session Requests', icon: CalendarDays },
    ],
  },
  {
    title: 'INSIGHTS',
    items: [
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'resources', label: 'Ayurveda Resources', icon: BookOpen },
    ],
  },
];

export default function Sidebar({
  activeTab = 'home',
  onTabChange,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  isMobile = false,
  role = 'PATIENT',
  onLogout,
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    const nextState = !isCollapsed;
    if (onToggleCollapse) {
      onToggleCollapse(nextState);
    } else {
      setInternalCollapsed(nextState);
    }
  };

  const isTherapist = role === 'THERAPIST';

  const handleItemClick = (item) => {
    if (item.isLogout) {
      if (onLogout) onLogout();
      return;
    }
    if (onTabChange) {
      onTabChange(item.id);
    }
  };

  return (
    <aside
      className={`${isMobile
        ? 'relative flex h-full w-full flex-col justify-between bg-[#F7FAF3] p-4 select-none'
        : `hidden lg:flex fixed top-0 left-0 bottom-0 z-50 h-screen flex-col justify-between border-r border-emerald-900/10 bg-[#F7FAF3] rounded-r-3xl p-4 shadow-sm select-none transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-[260px]'
        }`
        }`}
    >
      <div className="flex h-full w-full flex-col justify-between overflow-y-auto no-scrollbar">
        {/* Top Brand & Menu Section */}
        <div className="w-full space-y-5">
          {/* Brand Logo Header */}
          {!isCollapsed || isMobile ? (
            <div className="flex items-center gap-3 px-2 pt-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1F4D3A] text-white shadow-xs">
                <Leaf size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-900/50 leading-none">
                  Panchakarma
                </p>
                <p className="text-sm font-extrabold text-[#193322] leading-tight mt-0.5">
                  Care Center
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#1F4D3A] text-white shadow-xs">
              <Leaf size={22} />
            </div>
          )}

          {/* Navigation Items */}
          <div className="w-full space-y-4 pr-0.5">
            {isTherapist ? (
              /* Grouped Navigation for Therapist Workspace */
              therapistMenuGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  {(!isCollapsed || isMobile) && (
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-900/40 px-3 pt-2 pb-1">
                      {group.title}
                    </p>
                  )}
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        title={item.label}
                        onClick={() => handleItemClick(item)}
                        className={`flex items-center rounded-xl transition-all duration-200 cursor-pointer ${isCollapsed && !isMobile
                          ? 'mx-auto h-11 w-11 justify-center'
                          : 'w-full gap-3 px-3.5 py-2.5 text-left text-xs font-semibold'
                          } ${isActive
                            ? 'border-l-4 border-[#1F4D3A] bg-[#E4EFE0] text-[#1F4D3A] font-extrabold shadow-2xs'
                            : 'border-l-4 border-transparent text-gray-600 hover:bg-emerald-100/50 hover:text-emerald-900'
                          }`}
                      >
                        <Icon size={18} className={`shrink-0 ${isActive ? 'text-[#1F4D3A]' : 'text-gray-400'}`} />
                        {(!isCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              /* Standard Patient Menu */
              patientMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.label}
                    type="button"
                    title={item.label}
                    onClick={() => onTabChange && onTabChange(item.id)}
                    className={`flex items-center rounded-xl transition-all duration-200 cursor-pointer ${isCollapsed && !isMobile
                      ? 'mx-auto h-11 w-11 justify-center'
                      : 'w-full gap-3 px-3.5 py-2.5 text-left text-xs font-semibold'
                      } ${isActive
                        ? 'border-l-4 border-[#1F4D3A] bg-[#E4EFE0] text-[#1F4D3A] font-extrabold shadow-2xs'
                        : 'border-l-4 border-transparent text-gray-600 hover:bg-emerald-100/50 hover:text-emerald-900'
                      }`}
                  >
                    <Icon size={18} className={`shrink-0 ${isActive ? 'text-[#1F4D3A]' : 'text-gray-400'}`} />
                    {(!isCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Promo Card (for Patients) */}
        {!isTherapist && (
          isCollapsed && !isMobile ? (
            <div className="mt-auto flex w-full shrink-0 justify-center border-t border-emerald-900/5 pt-3">
              <button
                type="button"
                onClick={handleToggle}
                title="Expand Sidebar"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-emerald-100/70 text-[#1b3d2b] shadow-2xs transition duration-200 hover:scale-105 hover:bg-emerald-200/80 active:scale-95"
              >
                <Leaf size={18} />
              </button>
            </div>
          ) : (
            <div className="mt-auto shrink-0 pt-4 w-full">
              <div className="rounded-3xl border border-emerald-200/60 bg-[#edf5e7] p-4 text-center shadow-2xs transition duration-300">
                <div className="mx-auto flex h-14 w-14 items-center justify-center">
                  <img
                    src={mortarPestleImg}
                    alt="Ayurvedic mortar and pestle"
                    className="h-full w-full object-contain filter drop-shadow-xs"
                  />
                </div>
                <div className="mt-2 space-y-1">
                  <h4 className="font-display text-xs font-extrabold leading-tight text-[#163322]">
                    Ayurveda for a Better You
                  </h4>
                  <p className="text-[10px] font-medium leading-snug text-gray-600">
                    Embrace natural healing for a balanced life.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onTabChange && onTabChange('wellness')}
                  className="mt-3 w-full rounded-2xl bg-[#1F4D3A] py-2.5 px-3 text-xs font-bold text-white shadow-2xs flex items-center justify-center gap-1.5 hover:bg-[#183d2e] active:scale-[0.99] transition cursor-pointer"
                >
                  <span>Explore Wellness</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {!isMobile && (
        <button
          type="button"
          onClick={handleToggle}
          title={isCollapsed ? 'Expand Sidebar' : 'Shrink Sidebar'}
          className="absolute -right-3.5 top-7 z-40 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-800 shadow-md transition duration-200 hover:scale-110 hover:bg-emerald-100 active:scale-95"
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      )}
    </aside>
  );
}
