import { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  PackageX,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Plus,
  Pill,
  ShieldCheck,
  Search,
  Sparkles,
  BookOpen
} from 'lucide-react';
import api from '../../api';

export default function PharmacistDashboardView({
  auth,
  refreshKey,
  onNavigate,
  onAddStockClick,
  onNewMedicineClick
}) {
  const [stats, setStats] = useState({
    totalFormulations: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    todayDispensed: 0,
    inventoryValue: 0
  });
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, medicinesRes, txRes] = await Promise.all([
        api.get('/pharmacist/dashboard-stats'),
        api.get('/medicines/low-stock'),
        api.get('/pharmacist/transactions')
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (medicinesRes.data) setLowStockMedicines(medicinesRes.data);
      if (txRes.data) setRecentTransactions((txRes.data || []).slice(0, 5));
    } catch (err) {
      console.error('Error fetching Pharmacist Dashboard data', err);
      setLowStockMedicines([]);
      setRecentTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const statCards = [
    { title: 'Total Formulations', value: stats.totalFormulations, color: 'bg-emerald-100/90 text-emerald-950', icon: Boxes, badge: 'Catalog' },
    { title: 'Low Stock Alert', value: stats.lowStockCount, color: 'bg-amber-100/90 text-amber-950', icon: AlertTriangle, badge: 'Requires Reorder' },
    { title: 'Out of Stock', value: stats.outOfStockCount, color: 'bg-rose-100/90 text-rose-950', icon: PackageX, badge: 'Critical' },
    { title: "Today's Dispensed", value: stats.todayDispensed, color: 'bg-emerald-100/90 text-emerald-950', icon: CheckCircle2, badge: 'Prescriptions' },
  ];

  return (
    <div className="space-y-6 motion-fade-in-up">
      {/* 1. TOP COMPACT HERO HEADER (Patient Dashboard Style) */}
      <div className="relative overflow-hidden rounded-[1.5rem] border border-[#dfe9d8] bg-white/80 p-5 shadow-sm backdrop-blur-md">
        <div className="absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-full bg-[#e8f4e0] blur-2xl" />
        <div className="noise-grid absolute inset-0 opacity-[0.04]" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6e6] text-sage">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block rounded-full bg-[#eef6e6] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sage font-display">
                  Pharmacy Hub
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#d8edd0] px-2.5 py-0.5 text-[10px] font-semibold text-[#3d6835]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
                </span>
              </div>
              <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-forest leading-tight">
                Good Morning, {auth?.fullName?.split(' ')[0] || 'Pharmacist'} 🌿
              </h1>
              <p className="mt-0.5 text-xs text-forest/65 font-medium font-body">
                Formulation inventory, low stock monitoring &amp; prescription dispensing portal
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onAddStockClick}
              className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(62,109,67,0.24)] transition duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>+ Add Stock</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dispense')}
              className="flex items-center gap-2 rounded-2xl border border-[#cfe0c2] bg-white/80 px-4 py-2.5 text-xs font-semibold text-forest shadow-xs backdrop-blur-sm transition duration-200 hover:bg-white cursor-pointer"
            >
              <Pill size={15} />
              <span>Dispense Prescriptions</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid (Patient Dashboard Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <div
              key={idx}
              className="panel-frost group hover-lift relative overflow-hidden rounded-[2rem] p-5 transition duration-300"
            >
              <div className="ambient-orb right-[-1rem] top-[-1rem] h-24 w-24 bg-[#dce9cf]" />
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-sage">{card.badge}</p>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef6e6] text-[#1F4D3A] transition duration-300 group-hover:scale-110">
                  <IconComponent size={18} />
                </div>
              </div>
              <p className="relative mt-4 font-display text-3xl font-bold text-forest">
                {loading ? '...' : card.value}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf2e8]">
                <div className="h-full w-3/4 rounded-full bg-[linear-gradient(90deg,#6b9a67_0%,#b7d6a6_100%)]" />
              </div>
              <p className="relative mt-3 text-xs leading-5 text-forest/65 font-body font-medium">{card.title}</p>
            </div>
          );
        })}
      </div>

      {/* Low Stock Alert Table & Quick Dispense Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Low Stock Alert Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="panel-frost rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-sand/40 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fef3e2] text-[#c07830]">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-forest">
                    Low Stock &amp; Critical Threshold Alerts
                  </h2>
                  <p className="font-body text-xs text-forest/65 font-medium">
                    Medicines at or below minimum safety threshold
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="font-display text-xs font-bold text-[#355c39] hover:text-forest flex items-center gap-1 transition cursor-pointer"
              >
                <span>View All Inventory</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Low Stock Items List */}
            {loading ? (
              <div className="py-8 text-center font-body text-xs text-forest/50 font-medium">Loading inventory alerts...</div>
            ) : lowStockMedicines.length === 0 ? (
              <div className="py-8 text-center font-body text-forest/60 text-xs font-medium space-y-1">
                <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
                <p className="font-display font-bold text-forest">All Stock Thresholds Optimal!</p>
                <p className="font-body text-forest/50 text-[11px]">No formulations are currently below their minimum safety levels.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-sand/40 font-display text-[10px] font-bold text-forest/70 uppercase tracking-wider bg-[#f6faf3]">
                      <th className="p-3 rounded-l-xl">Formulation</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Current Stock</th>
                      <th className="p-3">Min Threshold</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 rounded-r-xl text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand/30 font-medium text-forest">
                    {lowStockMedicines.map((med) => {
                      const isOut = (med.currentStock || 0) <= 0;
                      const isCritical = (med.currentStock || 0) <= Math.max(2, (med.minimumStockThreshold || 10) / 4);

                      return (
                        <tr key={med.id} className="hover:bg-[#f4faee]/60 transition">
                          <td className="p-3 font-display font-bold text-forest">
                            {med.name}
                            <span className="block font-body text-[10px] text-forest/50 font-mono font-normal">
                              Batch: {med.batchNumber || 'N/A'}
                            </span>
                          </td>
                          <td className="p-3 font-body text-forest/70">{med.category || 'General'}</td>
                          <td className="p-3 font-mono font-bold text-forest">
                            {med.currentStock} {med.unit || 'units'}
                          </td>
                          <td className="p-3 font-mono text-forest/60">
                            {med.minimumStockThreshold || 10} {med.unit || 'units'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-display text-[10px] font-bold uppercase tracking-wider inline-block ${isOut
                                  ? 'bg-[#fce4e4] text-[#9b2c2c]'
                                  : isCritical
                                    ? 'bg-[#fde8c8] text-[#a06030]'
                                    : 'bg-[#fde8c8] text-[#a06030]'
                                }`}
                            >
                              {isOut ? 'OUT OF STOCK' : isCritical ? 'CRITICAL' : 'LOW STOCK'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={onAddStockClick}
                              className="px-3.5 py-1.5 rounded-2xl border border-[#cfe0c2] bg-white/80 hover:bg-white text-forest font-display font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
                            >
                              Restock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Transactions & Quick Nav */}
        <div className="space-y-4">
          <div className="panel-frost rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-sand/40 pb-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#355c39]" />
                <h3 className="font-display text-base font-bold text-forest">
                  Recent Activity
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('transactions')}
                className="font-display text-xs font-bold text-[#355c39] hover:underline cursor-pointer"
              >
                History
              </button>
            </div>

            {loading ? (
              <div className="py-6 text-center font-body text-xs text-forest/50 font-medium">Loading transactions...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="py-6 text-center font-body text-xs text-forest/50 font-medium">No recent inventory transactions</div>
            ) : (
              <div className="space-y-2.5">
                {recentTransactions.map((tx) => {
                  const isStockIn = tx.type === 'STOCK_IN' || tx.type === 'RETURN';
                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-2xl bg-[#faf8f4] border border-sand/40 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-display text-[9px] font-bold uppercase tracking-wider ${isStockIn ? 'bg-[#d8edd0] text-[#3d6835]' : 'bg-[#fde8c8] text-[#a06030]'
                              }`}
                          >
                            {tx.type}
                          </span>
                          <span className="font-display font-bold text-forest">
                            {tx.medicineName || tx.referenceNo || 'Transaction'}
                          </span>
                        </div>
                        <p className="font-body text-[11px] text-forest/60 font-medium">
                          {tx.notes || tx.pharmacistName || 'System update'}
                        </p>
                      </div>

                      <div className="text-right font-mono font-bold">
                        <span className={isStockIn ? 'text-[#3d6835]' : 'text-[#a06030]'}>
                          {isStockIn ? '+' : '-'}{tx.quantity || 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="panel-frost rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl p-5 shadow-xs space-y-3">
            <h4 className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-sage">
              Pharmacy Directives
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigate('medicines')}
                className="p-3 rounded-2xl bg-[#edf5e7] hover:bg-[#e4efdf] text-[#193322] font-display font-bold text-xs transition cursor-pointer text-left flex flex-col justify-between h-20"
              >
                <BookOpen size={16} className="text-[#355c39]" />
                <span>Formulation Catalog</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('dispense')}
                className="p-3 rounded-2xl bg-[#edf5e7] hover:bg-[#e4efdf] text-[#193322] font-display font-bold text-xs transition cursor-pointer text-left flex flex-col justify-between h-20"
              >
                <Pill size={16} className="text-[#355c39]" />
                <span>Dispense Rx</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
