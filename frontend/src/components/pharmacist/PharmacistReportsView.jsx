import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Download, PieChart as PieIcon, CheckCircle2, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../../api';

const COLOR_PALETTE = ['#1F4D3A', '#2d5a40', '#528265', '#88ab95', '#d8aa6d', '#e09f67', '#8a5d3b'];

export default function PharmacistReportsView() {
  const [period, setPeriod] = useState('MONTHLY'); // MONTHLY, QUARTERLY, YEARLY
  const [reportData, setReportData] = useState({
    totalInventoryValue: 0,
    totalDispensedCount: 0,
    totalStockInCount: 0,
    expiredItemsCount: 0,
    categoryBreakdown: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/pharmacist/reports?period=${period}`);
      if (res.data) setReportData(res.data);
    } catch (err) {
      console.error('Error fetching pharmacy report data', err);
    } finally {
      setLoading(false);
    }
  };

  // Build chart dynamic pie data from categoryBreakdown
  const categoryPieData = Object.entries(reportData.categoryBreakdown || {}).map(([cat, count], idx) => ({
    name: cat,
    value: Number(count),
    color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
  }));

  const summaryCards = [
    { title: 'Inventory Valuation', value: `₹${(reportData.totalInventoryValue || 0).toLocaleString('en-IN')}`, icon: DollarSign, badge: 'Valuation' },
    { title: 'Total Dispensed Rx', value: reportData.totalDispensedCount || 0, icon: CheckCircle2, badge: 'Fulfillment' },
    { title: 'Total Stock In Orders', value: reportData.totalStockInCount || 0, icon: TrendingUp, badge: 'Purchases' },
    { title: 'Expired Medicines', value: reportData.expiredItemsCount || 0, icon: AlertTriangle, badge: 'Audits' },
  ];

  return (
    <div className="space-y-6 motion-fade-in-up">
      {/* Header & Controls */}
      <div className="panel-frost rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-forest flex items-center gap-2">
            <BarChart3 size={22} className="text-[#355c39]" /> Pharmacy Analytics &amp; Reports
          </h2>
          <p className="font-body text-xs text-forest/65 font-medium mt-0.5">
            Real-time database stats on inventory valuation, dispensing activity, and category breakdown.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 bg-[#eef6e6] p-1.5 rounded-2xl shrink-0 border border-[#cfe0c2]">
          {['MONTHLY', 'QUARTERLY', 'YEARLY'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-xl font-display text-xs font-semibold transition cursor-pointer ${
                period === p
                  ? 'bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] text-white shadow-xs'
                  : 'text-forest/70 hover:text-forest'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <div key={idx} className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-900/50 uppercase tracking-wider">{card.badge}</span>
                <div className="p-2 rounded-xl bg-[#E4EFE0] text-[#1F4D3A]">
                  <IconComp size={18} />
                </div>
              </div>
              <div>
                <h3 className="font-display text-2xl font-extrabold text-[#162e21]">{card.value}</h3>
                <p className="text-xs font-bold text-gray-500 mt-0.5">{card.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <div className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-display text-base font-extrabold text-[#162e21] flex items-center gap-2">
              <PieIcon size={18} className="text-[#1F4D3A]" /> Catalog Category Distribution
            </h3>
            <span className="text-[10px] font-extrabold bg-[#E4EFE0] text-[#1F4D3A] px-2.5 py-0.5 rounded-full uppercase">
              Database Sync
            </span>
          </div>

          {categoryPieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-gray-400 font-medium">
              No categories found in inventory catalog.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Transactions Summary Table */}
        <div className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-display text-base font-extrabold text-[#162e21] flex items-center gap-2">
              <TrendingUp size={18} className="text-[#1F4D3A]" /> Inventory Movement Metrics
            </h3>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-950 px-2.5 py-0.5 rounded-full uppercase">
              {period}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-[#f6faf3] border border-emerald-900/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-gray-800 block">Total Stock Additions (Stock In)</span>
                <span className="text-[11px] text-gray-500 font-medium">Bulk purchase orders &amp; restocks</span>
              </div>
              <span className="font-mono text-lg font-extrabold text-[#1F4D3A]">{reportData.totalStockInCount || 0} Orders</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f6faf3] border border-emerald-900/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-gray-800 block">Total Clinical Fulfillments (Dispensed)</span>
                <span className="text-[11px] text-gray-500 font-medium">Doctor &amp; therapist prescriptions fulfilled</span>
              </div>
              <span className="font-mono text-lg font-extrabold text-[#1F4D3A]">{reportData.totalDispensedCount || 0} Rx</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f6faf3] border border-emerald-900/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-gray-800 block">Total Inventory Asset Value</span>
                <span className="text-[11px] text-gray-500 font-medium">Calculated from MRP * current stock</span>
              </div>
              <span className="font-mono text-lg font-extrabold text-[#1F4D3A]">₹{(reportData.totalInventoryValue || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
