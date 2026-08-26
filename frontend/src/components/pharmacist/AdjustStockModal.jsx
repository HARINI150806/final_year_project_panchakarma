import { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Check,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Tag
} from 'lucide-react';
import api from '../../api';

export default function AdjustStockModal({ medicine, onClose, onAdjusted, auth }) {
  const [medicinesList, setMedicinesList] = useState([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState(medicine?.id || '');
  const [selectedMedicine, setSelectedMedicine] = useState(medicine || null);
  const [loadingMedicines, setLoadingMedicines] = useState(false);

  const [adjustmentType, setAdjustmentType] = useState('STOCK_IN');
  const [quantity, setQuantity] = useState(10);
  const [referenceNo, setReferenceNo] = useState(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState('');
  const [operatorName, setOperatorName] = useState(auth?.fullName || 'Duty Pharmacist');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch medicines list if no medicine pre-selected
  useEffect(() => {
    if (!medicine) {
      fetchMedicines();
    } else {
      setSelectedMedicine(medicine);
      setSelectedMedicineId(medicine.id);
    }
  }, [medicine]);

  const fetchMedicines = async () => {
    setLoadingMedicines(true);
    try {
      const res = await api.get('/medicines');
      const data = res.data || [];
      setMedicinesList(data);
      if (data.length > 0 && !selectedMedicineId) {
        setSelectedMedicineId(data[0].id);
        setSelectedMedicine(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch medicine list for adjustment modal', err);
    } finally {
      setLoadingMedicines(false);
    }
  };

  const handleMedicineChange = (e) => {
    const id = e.target.value;
    setSelectedMedicineId(id);
    const found = medicinesList.find((m) => String(m.id) === String(id));
    setSelectedMedicine(found || null);
  };

  const generateNewRef = () => {
    const prefix = adjustmentType === 'STOCK_IN' ? 'PO' : adjustmentType === 'RETURN' ? 'RET' : 'ADJ';
    setReferenceNo(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Movement Types metadata (Simple & clean)
  const movementTypes = [
    { id: 'STOCK_IN', label: 'Add Stock (+)', isAddition: true },
    { id: 'STOCK_OUT', label: 'Remove Stock (-)', isAddition: false },
    { id: 'DAMAGED', label: 'Damaged (-)', isAddition: false },
    { id: 'EXPIRED', label: 'Expired (-)', isAddition: false },
    { id: 'RETURN', label: 'Return (+)', isAddition: true },
  ];

  const currentTypeConfig = movementTypes.find((t) => t.id === adjustmentType) || movementTypes[0];
  const isAddition = currentTypeConfig.isAddition;

  // Live stock calculation
  const currentStock = selectedMedicine?.currentStock || 0;
  const qtyNumber = Math.max(0, parseInt(quantity) || 0);
  const projectedStock = isAddition ? currentStock + qtyNumber : Math.max(0, currentStock - qtyNumber);

  const minThreshold = selectedMedicine?.minimumStockThreshold || 10;
  const maxThreshold = selectedMedicine?.maximumStockLevel || 100;
  const unit = selectedMedicine?.unit || 'g';

  const isProjectedLow = projectedStock > 0 && projectedStock <= minThreshold;
  const isProjectedOut = projectedStock <= 0;

  const quickNotesPresets = [
    'Received shipment from supplier, verified.',
    'Routine inventory audit count adjustment.',
    'Damaged container during handling.',
    'Expired batch written off per protocol.',
    'Customer returned unused item.'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMedicine || !selectedMedicine.id) {
      setErrorMsg('Please select a medicine item to adjust.');
      return;
    }

    if (qtyNumber <= 0) {
      setErrorMsg('Quantity must be greater than 0.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post(`/medicines/${selectedMedicine.id}/adjust-stock`, {
        quantity: qtyNumber,
        type: adjustmentType,
        notes: notes,
        referenceNo: referenceNo,
        operatorName: operatorName
      });
      if (onAdjusted) onAdjusted();
      onClose();
    } catch (err) {
      console.error('Failed to submit stock adjustment', err);
      if (onAdjusted) onAdjusted();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-emerald-900/15 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-100 text-[#1F4D3A]">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-gray-900 leading-tight">Adjust Inventory Stock Level</h3>
              <p className="font-body text-[11px] text-gray-500 font-medium">Real-time stock movement, batch audit & reconciliation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Formulation Selector */}
          <div>
            <label className="font-display font-bold text-gray-800 block mb-1.5">
              Select Medicine *
            </label>
            {!medicine && medicinesList.length > 0 ? (
              <select
                value={selectedMedicineId}
                onChange={handleMedicineChange}
                className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:border-emerald-700 bg-[#f8faf6] font-bold cursor-pointer text-gray-900"
              >
                {medicinesList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (Stock: {m.currentStock || 0} {m.unit || 'g'})
                  </option>
                ))}
              </select>
            ) : selectedMedicine ? (
              <div className="p-3.5 rounded-2xl bg-[#edf5e7] border border-emerald-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-display font-extrabold text-[#162e21] text-sm">{selectedMedicine.name}</p>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-950">
                    {selectedMedicine.category || 'General'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-gray-600 font-medium">
                  <span>Batch: <strong className="font-mono text-gray-900">{selectedMedicine.batchNumber || 'N/A'}</strong></span>
                  <span>Supplier: <strong className="text-gray-800">{selectedMedicine.supplierName || 'Internal'}</strong></span>
                  <span>Expiry: <strong className="text-gray-800">{selectedMedicine.expiryDate || 'N/A'}</strong></span>
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-gray-400">Loading medicines...</div>
            )}
          </div>

          {/* Movement Type */}
          <div>
            <label className="font-display font-bold text-gray-800 block mb-1.5">
              Adjustment Type *
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:border-emerald-700 bg-white font-bold cursor-pointer text-gray-900"
            >
              {movementTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Reference Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-display font-bold text-gray-800 block mb-1.5">
                Adjustment Quantity ({unit}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:border-emerald-700 text-sm font-bold text-gray-900 bg-white"
                placeholder="Enter unit quantity"
              />
            </div>

            <div>
              <label className="font-display font-bold text-gray-800 block mb-1.5">
                Reference / PO Number *
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 p-3 pr-10 outline-none focus:border-emerald-700 font-mono font-bold text-gray-900 bg-white"
                />
                <button
                  type="button"
                  onClick={generateNewRef}
                  title="Generate new Ref #"
                  className="absolute right-2.5 p-1.5 rounded-xl text-gray-400 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Live Stock Calculation Preview Card */}
          {selectedMedicine && (
            <div className="rounded-2xl border border-emerald-900/10 bg-[#f7faf5] p-3.5 space-y-2">
              <p className="font-display text-[11px] font-extrabold uppercase tracking-wider text-emerald-900/60">
                Live Stock Projection
              </p>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px]">Current Stock</span>
                  <span className="font-mono font-bold text-gray-800 text-sm">{currentStock} {unit}</span>
                </div>

                <div className="text-center px-2">
                  <span className="text-gray-400 text-xs font-bold block">{isAddition ? '+' : '-'}</span>
                  <span className={`font-mono font-bold text-sm ${isAddition ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isAddition ? `+${qtyNumber}` : `-${qtyNumber}`} {unit}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-gray-500 block text-[10px]">Projected Stock</span>
                  <span className={`font-mono font-extrabold text-base ${isProjectedOut ? 'text-rose-700' : isProjectedLow ? 'text-amber-700' : 'text-[#162e21]'}`}>
                    {projectedStock} {unit}
                  </span>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center justify-between pt-1.5 border-t border-emerald-900/5">
                <span className="text-[10px] text-gray-500">Threshold: Min {minThreshold} | Max {maxThreshold} {unit}</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-display text-[10px] font-extrabold ${
                    isProjectedOut
                      ? 'bg-rose-100 text-rose-900'
                      : isProjectedLow
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-950'
                  }`}
                >
                  {isProjectedOut ? 'OUT OF STOCK' : isProjectedLow ? 'LOW STOCK' : 'HEALTHY'}
                </span>
              </div>
            </div>
          )}

          {/* Reason & Audit Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-display font-bold text-gray-800">Reason &amp; Audit Notes</label>
              <span className="text-[10px] text-gray-400 font-medium">Click preset to quick fill</span>
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Verified shipment with delivery challan PO-4819."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 p-3 outline-none focus:border-emerald-700 font-body text-gray-900"
            />

            {/* Quick preset tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickNotesPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNotes(preset)}
                  className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-emerald-100 hover:text-emerald-950 text-[10px] font-semibold text-gray-600 transition cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Operator Name */}
          <div>
            <label className="font-display font-bold text-gray-800 block mb-1">Operator / Officer Name</label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 p-2.5 outline-none focus:border-emerald-700 text-xs font-semibold text-gray-800 bg-[#f8faf6]"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl bg-[#162e21] text-white font-bold hover:bg-emerald-950 shadow-sm transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check size={16} />
              <span>{submitting ? 'Saving Adjustment...' : 'Save Stock Adjustment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
