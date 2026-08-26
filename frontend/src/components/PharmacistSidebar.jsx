import { useState } from 'react';
import {
  LayoutDashboard,
  Boxes,
  Pill,
  BookOpen,
  History,
  Truck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Leaf
} from 'lucide-react';

export default function PharmacistSidebar({
  activeTab = 'dashboard',
  onTabChange,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  isMobile = false,
  auth,
  onLogout
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

  const menuGroups = [
    {
      title: 'PHARMACY WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inventory', label: 'Inventory', icon: Boxes },
        { id: 'dispense', label: 'Dispense Prescription', icon: Pill },
      ],
    },
    {
      title: 'FORMULATION & ORDERS',
      items: [
        { id: 'medicines', label: 'Medicines Catalog', icon: BookOpen },
        { id: 'transactions', label: 'Transactions', icon: History },
        { id: 'suppliers', label: 'Suppliers', icon: Truck },
      ],
    },
    {
      title: 'REPORTS & SYSTEM',
      items: [
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`${
        isMobile
          ? 'relative flex h-full w-full flex-col justify-between bg-[#F7FAF3] p-4 select-none'
          : `hidden lg:flex fixed top-0 left-0 bottom-0 z-50 h-screen flex-col justify-between border-r border-emerald-900/10 bg-[#F7FAF3] rounded-r-3xl p-4 shadow-sm select-none transition-all duration-300 ${
              isCollapsed ? 'w-20' : 'w-[260px]'
            }`
      }`}
    >
      <div className="flex h-full w-full flex-col justify-between overflow-y-auto no-scrollbar">
        {/* Top Brand & Header Section */}
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
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
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
                      key={item.id}
                      type="button"
                      title={item.label}
                      onClick={() => onTabChange && onTabChange(item.id)}
                      className={`flex items-center rounded-xl transition-all duration-200 cursor-pointer ${
                        isCollapsed && !isMobile
                          ? 'mx-auto h-11 w-11 justify-center'
                          : 'w-full gap-3 px-3.5 py-2.5 text-left text-xs font-semibold'
                      } ${
                        isActive
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
            ))}
          </div>
        </div>

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
