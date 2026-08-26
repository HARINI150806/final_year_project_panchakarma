import { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Filter, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import api from '../../api';

export default function PharmacistMedicinesView({ refreshKey, onAddMedicineClick, onAdjustStockClick }) {
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedMedId, setExpandedMedId] = useState(null);

  const categories = [
    'ALL', 'Churna', 'Capsules', 'Tablets', 'Taila', 'Ghrita', 'Avaleha', 'Arishta', 'Asava', 'Kalpa', 'Gulika', 'Rasayana', 'Khanda'
  ];

  useEffect(() => {
    fetchMedicines();
  }, [refreshKey]);

  const fetchMedicines = async () => {
    try {
      const res = await api.get('/medicines');
      setMedicines(res.data || []);
    } catch (err) {
      console.error('Error fetching medicines catalog', err);
      setMedicines([]);
    }
  };

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch = (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.batchNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 motion-fade-in-up">
      {/* Header & Controls */}
      <div className="panel-frost rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-forest flex items-center gap-2">
              <BookOpen size={22} className="text-[#355c39]" /> Medicines Catalog
            </h2>
            <p className="font-body text-xs text-forest/65 font-medium mt-0.5">
              Complete reference directory of classical Ayurvedic formulations, categories, dosages, and stock metrics.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onAdjustStockClick}
              className="flex items-center gap-2 rounded-2xl border border-[#cfe0c2] bg-white/80 px-4 py-2.5 text-xs font-semibold text-forest shadow-xs backdrop-blur-sm transition duration-200 hover:bg-white cursor-pointer"
            >
              <Sliders size={14} />
              <span>Adjust Stock</span>
            </button>
            <button
              type="button"
              onClick={onAddMedicineClick}
              className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Add Formulation</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by formulation name, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-[#f8faf6] text-xs text-gray-800 outline-none focus:border-[#1F4D3A] font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1F4D3A] text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border border-emerald-200/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog Cards Grid */}
      {filteredMedicines.length === 0 ? (
        <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-12 text-center text-gray-400 space-y-2">
          <BookOpen size={36} className="mx-auto text-gray-300" />
          <h3 className="font-bold text-gray-700 text-base">No Formulations in Catalog</h3>
          <p className="text-xs text-gray-400">Click "Add Formulation" to create new Ayurvedic medicine entries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedicines.map((med) => {
            const currentStock = med.currentStock || 0;
            const minThreshold = med.minimumStockThreshold || 10;
            const isOut = currentStock <= 0;
            const isLow = currentStock <= minThreshold;
            const isExpanded = expandedMedId === med.id;

            return (
              <div
                key={med.id}
                className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-5 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900/50 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {med.category || 'General'}
                      </span>
                      <h3 className="font-extrabold text-base text-[#162e21] mt-1">{med.name}</h3>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        isOut
                          ? 'bg-rose-100 text-rose-900 border-rose-200'
                          : isLow
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-950 border border-emerald-200'
                      }`}
                    >
                      {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'HEALTHY'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 font-medium line-clamp-2">
                    {med.description || ''}
                  </p>
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-700 bg-[#f6faf3] p-2.5 rounded-2xl border border-emerald-900/5">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase block">Available Stock</span>
                      <span className="font-extrabold font-mono text-[#1F4D3A] text-sm">{currentStock} {med.unit || 'g'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase block">Retail MRP</span>
                      <span className="font-extrabold font-mono text-gray-900 text-sm">₹{med.mrp ? med.mrp.toFixed(2) : '0.00'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3 rounded-2xl bg-gray-50 text-xs space-y-1.5 font-medium border border-gray-100 animate-in fade-in duration-150">
                      <p><strong className="text-gray-800">Batch Number:</strong> {med.batchNumber || 'N/A'}</p>
                      <p><strong className="text-gray-800">Supplier:</strong> {med.supplierName || 'N/A'}</p>
                      <p><strong className="text-gray-800">Expiry Date:</strong> {med.expiryDate || 'N/A'}</p>
                      <p><strong className="text-gray-800">Safety Threshold:</strong> {minThreshold} {med.unit || 'g'}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                    className="w-full text-center text-xs font-bold text-[#1F4D3A] hover:underline flex items-center justify-center gap-1 cursor-pointer pt-1"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Full Specifications'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
