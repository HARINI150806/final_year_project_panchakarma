import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Sliders,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  PackageX,
  X
} from 'lucide-react';
import api from '../../api';

export default function PharmacistInventoryView({
  refreshKey,
  onAddStockClick,
  onNewMedicineClick,
  onEditMedicineClick
}) {
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicines();
  }, [refreshKey]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await api.get('/medicines');
      setMedicines(res.data || []);
    } catch (err) {
      console.error('Error fetching inventory medicines', err);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine record?')) return;
    try {
      await api.delete(`/medicines/${id}`);
      setMedicines(medicines.filter((m) => m.id !== id));
    } catch (err) {
      alert('Failed to delete medicine.');
    }
  };

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.batchNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.supplierName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;

    const currentStock = m.currentStock || 0;
    const minThreshold = m.minimumStockThreshold || 10;
    const isOut = currentStock <= 0;
    const isLow = currentStock <= minThreshold;

    const computedStatus = isOut ? 'OUT_OF_STOCK' : isLow ? 'LOW_STOCK' : 'HEALTHY';
    const matchesStatus = statusFilter === 'ALL' || computedStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['ALL', ...new Set(medicines.map((m) => m.category).filter(Boolean))];

  return (
    <div className="space-y-6 motion-fade-in-up">
      {/* Top Header & Actions Bar */}
      <div className="panel-frost rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-forest">
            Ayurvedic Medicine Inventory Catalog
          </h2>
          <p className="font-body text-xs text-forest/65 font-medium mt-0.5">
            Real-time stock management, batch tracking, threshold alerts, and formulation catalog.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onAddStockClick}
            className="flex items-center gap-2 rounded-2xl border border-[#cfe0c2] bg-white/80 px-4 py-2.5 text-xs font-semibold text-forest shadow-xs backdrop-blur-sm transition duration-200 hover:bg-white cursor-pointer"
          >
            <Sliders size={14} />
            <span>Adjust Stock</span>
          </button>

          <button
            type="button"
            onClick={onNewMedicineClick}
            className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add New Medicine</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="rounded-2xl border border-emerald-900/10 bg-white/80 backdrop-blur-md p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search formulation, batch, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-[#f8faf6] font-body text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#1F4D3A] focus:bg-white transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-[#f8faf6] font-display text-xs font-bold text-gray-700 outline-none focus:border-[#1F4D3A]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-[#f8faf6] font-display text-xs font-bold text-gray-700 outline-none focus:border-[#1F4D3A]"
          >
            <option value="ALL">Status: All</option>
            <option value="HEALTHY">Status: Healthy</option>
            <option value="LOW_STOCK">Status: Low Stock</option>
            <option value="OUT_OF_STOCK">Status: Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-6 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center font-body text-xs text-gray-400 font-medium">
            Loading medicine catalog...
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="py-12 text-center font-body text-gray-400 space-y-2">
            <PackageX size={36} className="mx-auto text-gray-300" />
            <h3 className="font-display font-bold text-gray-700 text-base">No Formulations Found</h3>
            <p className="font-body text-xs text-gray-400">No medicines match your search criteria or catalog is empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 font-display text-[10px] font-extrabold text-emerald-950/60 uppercase tracking-wider bg-[#f6faf3]">
                  <th className="p-3.5 rounded-l-xl">Formulation Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Batch / Supplier</th>
                  <th className="p-3.5">Current Stock</th>
                  <th className="p-3.5">Threshold (Min / Max)</th>
                  <th className="p-3.5">MRP</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                {filteredMedicines.map((med) => {
                  const currentStock = med.currentStock || 0;
                  const minThreshold = med.minimumStockThreshold || 10;
                  const maxLevel = med.maximumStockLevel || 100;
                  const isOut = currentStock <= 0;
                  const isLow = currentStock <= minThreshold;

                  return (
                    <tr key={med.id} className="hover:bg-emerald-50/40 transition">
                      <td className="p-3.5 font-display font-extrabold text-[#162e21]">
                        {med.name}
                        <span className="block font-body text-[10px] text-gray-400 font-normal">
                          Expiry: {med.expiryDate || 'N/A'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full font-display text-[10px] font-extrabold bg-emerald-100/70 text-emerald-950">
                          {med.category || 'General'}
                        </span>
                      </td>

                      <td className="p-3.5 font-body text-gray-600">
                        <span className="font-mono text-[11px] block font-bold text-gray-800">
                          {med.batchNumber || 'N/A'}
                        </span>
                        <span className="font-body text-[10px] text-gray-400">{med.supplierName || 'Internal Pharmacy'}</span>
                      </td>

                      <td className="p-3.5 font-mono font-extrabold text-[#162e21] text-sm">
                        {currentStock} <span className="font-body text-xs text-gray-400 font-normal">{med.unit || 'g'}</span>
                      </td>

                      <td className="p-3.5 font-mono text-gray-500 text-[11px]">
                        Min: {minThreshold} | Max: {maxLevel}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-gray-900">
                        ₹{med.mrp ? med.mrp.toFixed(2) : '0.00'}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-display text-[10px] font-extrabold inline-block ${
                            isOut
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : isLow
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-950 border border-emerald-200'
                          }`}
                        >
                          {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'HEALTHY'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onAddStockClick && onAddStockClick(med)}
                          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition cursor-pointer"
                          title="Adjust Stock Level"
                        >
                          <Sliders size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditMedicineClick && onEditMedicineClick(med)}
                          className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                          title="Edit Medicine"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(med.id)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                          title="Delete Medicine"
                        >
                          <Trash2 size={14} />
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
  );
}
