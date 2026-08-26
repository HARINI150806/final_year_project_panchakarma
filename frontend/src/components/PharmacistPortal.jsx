import { useState } from 'react';
import PharmacistSidebar from './PharmacistSidebar';
import PharmacistHeader from './PharmacistHeader';
import PharmacistDashboardView from './pharmacist/PharmacistDashboardView';
import PharmacistInventoryView from './pharmacist/PharmacistInventoryView';
import PharmacistDispenseView from './pharmacist/PharmacistDispenseView';
import PharmacistMedicinesView from './pharmacist/PharmacistMedicinesView';
import PharmacistTransactionsView from './pharmacist/PharmacistTransactionsView';
import PharmacistSuppliersView from './pharmacist/PharmacistSuppliersView';
import PharmacistReportsView from './pharmacist/PharmacistReportsView';
import PharmacistSettingsView from './pharmacist/PharmacistSettingsView';
import AddEditMedicineModal from './pharmacist/AddEditMedicineModal';
import AdjustStockModal from './pharmacist/AdjustStockModal';
import {
  LayoutDashboard,
  Boxes,
  Pill,
  BookOpen,
  BarChart3,
  Menu,
  X
} from 'lucide-react';

export default function PharmacistPortal({ auth, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Modals state
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [medicineToEdit, setMedicineToEdit] = useState(null);

  const [adjustStockModalOpen, setAdjustStockModalOpen] = useState(false);
  const [medicineToAdjust, setMedicineToAdjust] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenAddMedicine = (medToEdit = null) => {
    setMedicineToEdit(medToEdit);
    setAddEditModalOpen(true);
  };

  const handleOpenAdjustStock = (medToAdjust = null) => {
    setMedicineToAdjust(medToAdjust);
    setAdjustStockModalOpen(true);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    setIsMobileDrawerOpen(false);
  };

  const mobileNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'dispense', label: 'Dispense', icon: Pill },
    { id: 'medicines', label: 'Catalog', icon: BookOpen },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5faf2] flex font-body text-forest antialiased relative pb-20 lg:pb-8">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb left-[-4rem] top-24 h-72 w-72 bg-[#d7e6cb]" />
        <div className="ambient-orb right-[-5rem] top-12 h-80 w-80 bg-[#ebd5b7]" />
        <div className="noise-grid absolute inset-0 opacity-[0.08]" />
      </div>

      {/* 1. FIXED DESKTOP PHARMACIST SIDEBAR */}
      <PharmacistSidebar
        activeTab={activeTab}
        onTabChange={handleTabSelect}
        isCollapsed={isCollapsed}
        onToggleCollapse={setIsCollapsed}
        auth={auth}
        onLogout={onLogout}
      />

      {/* 2. MAIN CONTENT WRAPPER */}
      <main className={`flex-1 min-w-0 ml-0 transition-all duration-300 flex flex-col ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[260px]'}`}>
        {/* Sticky top header */}
        <PharmacistHeader
          auth={auth}
          onLogout={onLogout}
          onAddStockClick={() => handleOpenAddMedicine(null)}
          onNotificationItemClick={(notif) => {
            if (notif && (notif.type === 'CRITICAL_STOCK' || notif.type === 'LOW_STOCK')) {
              setActiveTab('inventory');
            }
          }}
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          isMobileDrawerOpen={isMobileDrawerOpen}
        />

        {/* Mobile Drawer Trigger Bar (Visible on mobile & tablet < lg) */}
        <div className="lg:hidden relative z-30 bg-[#f4faee]/90 border-b border-emerald-900/10 px-4 py-2 flex items-center justify-between backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="flex items-center gap-2 rounded-2xl bg-white border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-950 shadow-2xs active:scale-95 cursor-pointer"
          >
            {isMobileDrawerOpen ? <X size={15} /> : <Menu size={15} />}
            <span>Navigation Menu</span>
          </button>

          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-full">
            {activeTab}
          </span>
        </div>

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
                <span className="font-display font-bold text-forest text-base">Pharmacy Navigation</span>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-xl bg-white border border-emerald-200 text-forest hover:bg-emerald-50 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <PharmacistSidebar
                activeTab={activeTab}
                onTabChange={handleTabSelect}
                isCollapsed={false}
                isMobile={true}
                auth={auth}
                onLogout={onLogout}
              />
            </div>
          </div>
        )}

        {/* MAIN BODY AREA */}
        <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 motion-fade-in-up">
          {activeTab === 'dashboard' && (
            <PharmacistDashboardView
              auth={auth}
              refreshKey={refreshKey}
              onNavigate={setActiveTab}
              onAddStockClick={() => handleOpenAddMedicine(null)}
              onAdjustStockClick={(med) => handleOpenAdjustStock(med)}
            />
          )}

          {activeTab === 'inventory' && (
            <PharmacistInventoryView
              refreshKey={refreshKey}
              onAddStockClick={() => handleOpenAdjustStock(null)}
              onNewMedicineClick={() => handleOpenAddMedicine(null)}
              onEditMedicineClick={(med) => handleOpenAddMedicine(med)}
            />
          )}

          {activeTab === 'dispense' && <PharmacistDispenseView refreshKey={refreshKey} onDispensed={handleRefresh} />}

          {activeTab === 'medicines' && (
            <PharmacistMedicinesView
              refreshKey={refreshKey}
              onAddMedicineClick={(med) => handleOpenAddMedicine(med)}
              onAdjustStockClick={(med) => handleOpenAdjustStock(med)}
            />
          )}

          {activeTab === 'transactions' && <PharmacistTransactionsView refreshKey={refreshKey} />}

          {activeTab === 'suppliers' && <PharmacistSuppliersView refreshKey={refreshKey} />}

          {activeTab === 'reports' && <PharmacistReportsView refreshKey={refreshKey} />}

          {activeTab === 'settings' && <PharmacistSettingsView auth={auth} onLogout={onLogout} />}
        </section>
      </main>

      {/* Mobile Bottom Navigation Bar (Visible on mobile < lg) */}
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
              <Icon size={18} className={isActive ? 'text-[#1F4D3A]' : 'text-gray-400'} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. GLOBAL MODALS */}
      {addEditModalOpen && (
        <AddEditMedicineModal
          medicineToEdit={medicineToEdit}
          onClose={() => setAddEditModalOpen(false)}
          onSaved={handleRefresh}
        />
      )}

      {adjustStockModalOpen && (
        <AdjustStockModal
          medicine={medicineToAdjust}
          onClose={() => setAdjustStockModalOpen(false)}
          onAdjusted={handleRefresh}
          auth={auth}
        />
      )}
    </div>
  );
}
