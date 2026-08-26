import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import api from '../../api';

export default function AddEditMedicineModal({ medicineToEdit, onClose, onSaved }) {
  const [suppliersList, setSuppliersList] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Churna',
    supplierName: '',
    batchNumber: '',
    currentStock: 0,
    minimumStockThreshold: 10,
    maximumStockLevel: 100,
    unit: '',
    mrp: 0,
    wholesalePrice: 0,
    manufacturingDate: '',
    expiryDate: '',
    description: ''
  });

  const categories = [
    'Churna', 'Capsules', 'Tablets', 'Taila', 'Ghrita', 'Avaleha', 'Arishta', 'Asava', 'Kalpa', 'Gulika', 'Rasayana', 'Khanda'
  ];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliersList(res.data || []);
    } catch (err) {
      setSuppliersList([]);
    }
  };

  useEffect(() => {
    if (medicineToEdit) {
      setFormData({
        name: medicineToEdit.name || '',
        category: medicineToEdit.category || 'Churna',
        supplierName: medicineToEdit.supplierName || '',
        batchNumber: medicineToEdit.batchNumber || '',
        currentStock: medicineToEdit.currentStock !== undefined ? medicineToEdit.currentStock : 0,
        minimumStockThreshold: medicineToEdit.minimumStockThreshold || 10,
        maximumStockLevel: medicineToEdit.maximumStockLevel || 100,
        unit: medicineToEdit.unit || '',
        mrp: medicineToEdit.mrp || 0,
        wholesalePrice: medicineToEdit.wholesalePrice || 0,
        manufacturingDate: medicineToEdit.manufacturingDate || '',
        expiryDate: medicineToEdit.expiryDate || '',
        description: medicineToEdit.description || ''
      });
    }
  }, [medicineToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.currentStock < 0) {
      alert('Stock cannot be negative!');
      return;
    }

    try {
      if (medicineToEdit && medicineToEdit.id) {
        await api.put(`/medicines/${medicineToEdit.id}`, formData);
      } else {
        await api.post('/medicines', formData);
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      if (onSaved) onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-emerald-900/15 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-bold text-base text-gray-900">
            {medicineToEdit ? 'Edit Ayurvedic Formulation' : 'Add New Medicine Formulation'}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Medicine Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Triphala Churna"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Formulation Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700 bg-white cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Manufacturer / Supplier</label>
              {suppliersList.length > 0 ? (
                <select
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700 bg-white cursor-pointer"
                >
                  <option value="">Select Supplier</option>
                  {suppliersList.map((s) => (
                    <option key={s.id || s.supplierName} value={s.supplierName || s.name}>
                      {s.supplierName || s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Dabur Ayurvedic Ltd."
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700"
                />
              )}
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Batch Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. TC-2026-078"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Current Stock Quantity *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Minimum Threshold *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.minimumStockThreshold}
                onChange={(e) => setFormData({ ...formData, minimumStockThreshold: parseInt(e.target.value) || 1 })}
                className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Maximum Stock Target</label>
              <input
                type="number"
                min="1"
                value={formData.maximumStockLevel}
                onChange={(e) => setFormData({ ...formData, maximumStockLevel: parseInt(e.target.value) || 100 })}
                className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Packaging Unit *</label>
              <input
                type="text"
                required
                placeholder="e.g. 100g pack, 60 cap bottle"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">MRP (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Wholesale Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.wholesalePrice}
                onChange={(e) => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Manufacturing Date</label>
              <input
                type="date"
                value={formData.manufacturingDate}
                onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700 cursor-pointer"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Formulation Description &amp; Indications</label>
            <textarea
              rows={2}
              placeholder="Enter dosage guidelines, classical reference, or therapeutic indication..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-[#162e21] text-white font-bold hover:bg-emerald-950 shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <Check size={16} /> Save Formulation Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
