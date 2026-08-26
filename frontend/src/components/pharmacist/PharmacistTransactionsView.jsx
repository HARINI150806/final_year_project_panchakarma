import { useState, useEffect } from 'react';
import { History, Search, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import api from '../../api';

export default function PharmacistTransactionsView() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/pharmacist/transactions${filterType !== 'ALL' ? `?type=${filterType}` : ''}`);
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Error fetching inventory transactions', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((t) => {
    const matchSearch = (t.referenceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (t.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (t.medicineName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (t.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6 motion-fade-in-up">
      <div className="panel-frost rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-forest flex items-center gap-2">
            <History size={22} className="text-[#355c39]" /> Transaction History
          </h2>
          <p className="font-body text-xs text-forest/65 font-medium mt-0.5">
            Audit log of all stock movements, prescription dispensing events, purchase orders, and stock adjustments.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {['ALL', 'DISPENSED', 'STOCK_IN', 'ADJUSTMENT', 'RETURN'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 rounded-xl font-display text-xs font-semibold transition cursor-pointer ${
                filterType === type
                  ? 'bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] text-white shadow-xs'
                  : 'bg-white/80 border border-[#cfe0c2] text-forest hover:bg-white'
              }`}
            >
              {type === 'ALL' ? 'All Transactions' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reference, patient, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-[#f8faf6] text-xs text-gray-800 outline-none focus:border-[#1F4D3A] font-medium"
            />
          </div>

          <button
            type="button"
            onClick={fetchTransactions}
            className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-[#E4EFE0] text-[#1F4D3A] text-xs font-extrabold flex items-center gap-1.5 hover:bg-[#d5e6cf] transition cursor-pointer self-end sm:self-auto"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400 font-medium">Loading transaction log...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs font-medium space-y-1">
            <History size={36} className="mx-auto text-gray-300" />
            <p className="font-extrabold text-gray-700">No Transactions Found</p>
            <p className="text-gray-400 text-[11px]">No inventory movement logs recorded matching your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-extrabold text-emerald-950/60 uppercase tracking-wider bg-[#f6faf3]">
                  <th className="p-3.5 rounded-l-xl">Type</th>
                  <th className="p-3.5">Reference No</th>
                  <th className="p-3.5">Items &amp; Formulation</th>
                  <th className="p-3.5">Party / Patient / Supplier</th>
                  <th className="p-3.5">Operator</th>
                  <th className="p-3.5 rounded-r-xl text-right">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                {filtered.map((tx) => {
                  const isStockIn = tx.type === 'STOCK_IN' || tx.type === 'RETURN';
                  return (
                    <tr key={tx.id} className="hover:bg-emerald-50/40 transition">
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isStockIn
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-200'
                            : tx.type === 'DISPENSED'
                            ? 'bg-amber-100 text-amber-950 border-amber-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {tx.type}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono font-extrabold text-[#162e21]">
                        {tx.referenceNo || `TX-${tx.id}`}
                      </td>

                      <td className="p-3.5 text-gray-800">
                        <span className="font-bold block">{tx.medicineName || tx.items || 'Formulation Item'}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Qty: {tx.quantity || 1}</span>
                      </td>

                      <td className="p-3.5 text-gray-600">
                        {tx.patientName || tx.supplierName || tx.notes || 'N/A'}
                      </td>

                      <td className="p-3.5 text-gray-500 font-medium">
                        {tx.pharmacistName || 'System'}
                      </td>

                      <td className="p-3.5 text-right font-mono text-[11px] text-gray-500">
                        {new Date(tx.date || Date.now()).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
  );
}
