import { useState, useEffect } from 'react';
import { Pill, CheckCircle2, AlertTriangle, FileText, User, Calendar, Check, X, Clock, AlertCircle, PackageX, ShieldAlert } from 'lucide-react';
import api from '../../api';

export default function PharmacistDispenseView({ refreshKey, onDispensed }) {
  const [activeSubTab, setActiveSubTab] = useState('PENDING'); // PENDING or DISPENSED
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [dispensedHistory, setDispensedHistory] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRxForDispense, setSelectedRxForDispense] = useState(null);
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [dispensingNotes, setDispensingNotes] = useState('');
  const [dispenseSuccessMsg, setDispenseSuccessMsg] = useState('');
  const [dispenseErrorMsg, setDispenseErrorMsg] = useState('');
  const [selectedMeds, setSelectedMeds] = useState({}); // { [rxId]: { [medIdx]: boolean } }

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const isMedSelected = (rxId, idx) => {
    if (!selectedMeds[rxId]) return true; // Default true
    return selectedMeds[rxId][idx] !== false;
  };

  const toggleMedSelection = (rxId, idx) => {
    setSelectedMeds(prev => {
      const rxState = prev[rxId] || {};
      const current = rxState[idx] !== false;
      return {
        ...prev,
        [rxId]: {
          ...rxState,
          [idx]: !current
        }
      };
    });
  };

  const hasMedicines = (p) => {
    if (!p) return false;
    const hasArray = Array.isArray(p.medicines) && p.medicines.length > 0;
    const hasString = Boolean(p.medicineName && p.medicineName.trim());
    return hasArray || hasString;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, dispensedRes, medsRes] = await Promise.all([
        api.get('/pharmacist/pending-prescriptions'),
        api.get('/pharmacist/dispensed-prescriptions'),
        api.get('/medicines')
      ]);

      setPendingPrescriptions((pendingRes.data || []).filter(hasMedicines));
      setDispensedHistory((dispensedRes.data || []).filter(hasMedicines));
      setInventoryList(medsRes.data || []);
    } catch (err) {
      console.error('Error fetching Prescriptions Dispensing view data', err);
      setPendingPrescriptions([]);
      setDispensedHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStockDetailsForMed = (med) => {
    let target = null;
    if (med.medicineId) {
      target = inventoryList.find(m => String(m.id) === String(med.medicineId));
    }
    if (!target && med.medicineName) {
      target = inventoryList.find(m => m.name.toLowerCase().includes(med.medicineName.toLowerCase()) || med.medicineName.toLowerCase().includes(m.name.toLowerCase()));
    }

    const reqQty = med.quantity || 1;
    const availQty = target ? (target.currentStock !== undefined ? target.currentStock : 0) : (med.availableStock !== undefined ? med.availableStock : 0);
    const minStock = target ? (target.minimumStockThreshold || 10) : (med.minStock || 10);
    const expiryDate = target?.expiryDate || med?.expiryDate || null;
    const batchNumber = target?.batchNumber || med?.batchNumber || 'N/A';
    
    const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
    const isInsufficient = availQty < reqQty;

    return {
      target,
      reqQty,
      availQty,
      minStock,
      expiryDate,
      batchNumber,
      isExpired,
      isInsufficient
    };
  };

  const handleDispenseSubmit = async () => {
    if (!selectedRxForDispense) return;
    setDispenseErrorMsg('');

    const activeMeds = (selectedRxForDispense.medicines || []).filter((m, idx) => isMedSelected(selectedRxForDispense.id, idx));

    if (activeMeds.length === 0) {
      setDispenseErrorMsg('Please select at least 1 medicine to dispense.');
      return;
    }

    // Pre-validation for selected medicines only
    let hasInsufficient = false;
    let hasExpired = false;

    activeMeds.forEach(pm => {
      const details = getStockDetailsForMed(pm);
      if (details.isExpired) hasExpired = true;
      if (details.isInsufficient) hasInsufficient = true;
    });

    if (hasExpired) {
      setDispenseErrorMsg('Cannot dispense! One of the selected medicines has EXPIRED.');
      return;
    }

    if (hasInsufficient) {
      setDispenseErrorMsg('Cannot dispense! Available stock is insufficient for one of the selected medicines.');
      return;
    }

    try {
      const auth = JSON.parse(localStorage.getItem('panchakarma-auth') || '{}');
      const pharmacistName = auth?.fullName || 'Duty Pharmacist';

      const selectedNames = activeMeds.map(m => m.medicineName);

      const res = await api.post(`/pharmacist/dispense/${selectedRxForDispense.id}`, {
        pharmacistName: pharmacistName,
        notes: dispensingNotes,
        selectedMedicineNames: selectedNames
      });

      setDispenseSuccessMsg(`Prescription ${selectedRxForDispense.prescriptionNumber || selectedRxForDispense.id} dispensed successfully (${activeMeds.length} item(s)). Stock updated.`);
      
      // Update UI state & refresh inventory
      setPendingPrescriptions(pendingPrescriptions.filter((p) => p.id !== selectedRxForDispense.id));
      setDispensedHistory([{ ...selectedRxForDispense, status: 'DISPENSED', dispensed: true, dispensedAt: new Date().toISOString() }, ...dispensedHistory]);
      fetchData();
      if (onDispensed) onDispensed();

      setTimeout(() => {
        setDispenseModalOpen(false);
        setSelectedRxForDispense(null);
        setDispenseSuccessMsg('');
        setDispensingNotes('');
      }, 1800);
    } catch (err) {
      setDispenseErrorMsg(err.response?.data?.message || 'Error dispensing prescription.');
    }
  };

  return (
    <div className="space-y-6 motion-fade-in-up">
      {/* Header & Sub-Tabs */}
      <div className="panel-frost rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-forest flex items-center gap-2">
            <Pill size={22} className="text-[#355c39]" /> Dispense Prescriptions
          </h2>
          <p className="font-body text-xs text-forest/65 font-medium mt-0.5">
            Fulfill doctor &amp; therapist Ayurvedic prescriptions, verify stock levels &amp; expiry dates, and update inventory automatically.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-[#eef6e6] p-1.5 rounded-2xl shrink-0 border border-[#cfe0c2]">
          <button
            type="button"
            onClick={() => setActiveSubTab('PENDING')}
            className={`px-4 py-2 rounded-xl font-display text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'PENDING'
                ? 'bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] text-white shadow-xs'
                : 'text-forest/70 hover:text-forest'
            }`}
          >
            Pending ({pendingPrescriptions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('DISPENSED')}
            className={`px-4 py-2 rounded-xl font-display text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'DISPENSED'
                ? 'bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] text-white shadow-xs'
                : 'text-forest/70 hover:text-forest'
            }`}
          >
            History ({dispensedHistory.length})
          </button>
        </div>
      </div>

      {/* PENDING TAB */}
      {activeSubTab === 'PENDING' && (
        <div className="space-y-4">
          {pendingPrescriptions.length === 0 ? (
            <div className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-12 text-center text-gray-400 space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
              <h3 className="font-display font-bold text-gray-800 text-base">No Pending Prescriptions</h3>
              <p className="font-body text-xs text-gray-500">All doctor &amp; therapist prescriptions have been dispensed.</p>
            </div>
          ) : (
            pendingPrescriptions.map((rx) => {
              // Evaluate stock status for currently selected medicines
              let rxHasInsufficient = false;
              let rxHasExpired = false;
              let selectedCount = 0;
              const totalMeds = (rx.medicines || []).length;

              (rx.medicines || []).forEach((med, idx) => {
                if (isMedSelected(rx.id, idx)) {
                  selectedCount++;
                  const sDetails = getStockDetailsForMed(med);
                  if (sDetails.isInsufficient) rxHasInsufficient = true;
                  if (sDetails.isExpired) rxHasExpired = true;
                }
              });

              return (
                <div key={rx.id} className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-6 shadow-xs hover:shadow-md transition space-y-4">
                  {/* RX Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#E4EFE0] text-[#1F4D3A] font-extrabold text-xs flex items-center justify-center border border-emerald-200">
                        RX
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-[#162e21]">{rx.patientName || 'Registered Patient'}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100/80 text-amber-900 border border-amber-200">
                            {rx.prescriptionNumber || `RX-${rx.id}`}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                            STATUS: PENDING
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Prescribed by: <span className="font-bold text-[#1F4D3A]">{rx.doctorName || 'Therapist'}</span></p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{new Date(rx.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Medicines Verification List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900/50">
                        Prescribed Formulations ({selectedCount}/{totalMeds} Selected to Dispense)
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        💡 Uncheck any medicine if patient already has it or doesn't need it
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(rx.medicines || []).map((med, idx) => {
                        const sDetails = getStockDetailsForMed(med);
                        const isChecked = isMedSelected(rx.id, idx);

                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl border space-y-2 transition ${
                              !isChecked
                                ? 'bg-gray-100/70 border-gray-200 opacity-60'
                                : sDetails.isExpired
                                ? 'bg-rose-50/90 border-rose-200'
                                : sDetails.isInsufficient
                                ? 'bg-amber-50/90 border-amber-200'
                                : 'bg-[#f4faee] border-emerald-900/15 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-gray-100/80 pb-2">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleMedSelection(rx.id, idx)}
                                  className="rounded border-gray-300 text-emerald-700 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                />
                                <span className={`font-extrabold text-sm ${isChecked ? 'text-[#162e21]' : 'text-gray-500 line-through'}`}>
                                  {med.medicineName}
                                </span>
                              </label>

                              {isChecked ? (
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sDetails.isExpired ? 'bg-rose-100 text-rose-900 border-rose-300' : sDetails.isInsufficient ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-950 border-emerald-200'}`}>
                                  {sDetails.isExpired ? '🔴 EXPIRED' : sDetails.isInsufficient ? `⚠ INSUFFICIENT (${sDetails.availQty} avail)` : `✓ AVAILABLE (${sDetails.availQty} avail)`}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gray-200 text-gray-700">
                                  ⚪ SKIPPED (Not Needed)
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-gray-700 bg-white/70 p-2 rounded-xl border border-gray-100">
                              <div>
                                <span className="text-[9px] text-gray-400 uppercase block">Required</span>
                                <span className="font-extrabold text-emerald-950">{sDetails.reqQty} {med.unit || 'units'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-gray-400 uppercase block">In Stock</span>
                                <span className={`font-extrabold ${sDetails.isInsufficient ? 'text-amber-700' : 'text-emerald-800'}`}>{sDetails.availQty} {med.unit || 'units'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-gray-400 uppercase block">Batch &amp; Expiry</span>
                                <span className="font-mono text-[10px] block text-gray-600">{sDetails.batchNumber}</span>
                              </div>
                            </div>

                            <p className="text-xs text-gray-700 font-medium">Dosage: {med.dosage || 'As prescribed'}{med.frequency ? ` • Frequency: ${med.frequency}` : ''}{med.duration ? ` • Duration: ${med.duration}` : ''}</p>
                            {med.instructions && (
                              <p className="text-[11px] text-[#1F4D3A] italic bg-white/80 p-2 rounded-xl border border-emerald-100">
                                "{med.instructions}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dispense Action */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                    <div className="text-xs">
                      {selectedCount === 0 ? (
                        <span className="text-gray-500 font-bold flex items-center gap-1">
                          <AlertCircle size={15} /> Select at least 1 medicine to dispense.
                        </span>
                      ) : rxHasExpired ? (
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <ShieldAlert size={15} /> Dispensing blocked: Selected medicine is EXPIRED.
                        </span>
                      ) : rxHasInsufficient ? (
                        <span className="text-amber-800 font-bold flex items-center gap-1">
                          <AlertTriangle size={15} /> Dispensing blocked: Insufficient stock for selected medicine.
                        </span>
                      ) : (
                        <span className="text-emerald-800 font-bold flex items-center gap-1">
                          <CheckCircle2 size={15} /> {selectedCount} of {totalMeds} medicine(s) verified for dispensing.
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={selectedCount === 0 || rxHasExpired || rxHasInsufficient}
                      onClick={() => {
                        setSelectedRxForDispense(rx);
                        setDispenseModalOpen(true);
                      }}
                      className="rounded-2xl bg-[#1F4D3A] hover:bg-[#163a2c] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
                    >
                      <Check size={16} /> Mark as Dispensed ({selectedCount} item{selectedCount !== 1 ? 's' : ''})
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DISPENSED HISTORY TAB */}
      {activeSubTab === 'DISPENSED' && (
        <div className="space-y-3">
          {dispensedHistory.map((rx) => (
            <div key={rx.id} className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E4EFE0] text-[#1F4D3A]">
                    DISPENSED
                  </span>
                  <h3 className="font-extrabold text-sm text-[#162e21]">{rx.patientName}</h3>
                  <span className="text-xs font-mono text-gray-500 font-semibold">({rx.prescriptionNumber || `RX-${rx.id}`})</span>
                </div>
                <p className="text-xs text-gray-600 font-medium">Prescribed by {rx.doctorName} • Dispensed by {rx.dispensedBy || 'Pharmacist'}</p>
                {rx.dispensingNotes && (
                  <p className="text-[11px] text-gray-500 italic bg-gray-50 p-1.5 rounded-lg border border-gray-100 mt-1">
                    Notes: {rx.dispensingNotes}
                  </p>
                )}
              </div>

              <div className="text-xs text-gray-500 font-semibold">
                Dispensed on: {new Date(rx.dispensedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PHYSICAL DISPENSING CONFIRMATION MODAL */}
      {dispenseModalOpen && selectedRxForDispense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-emerald-900/15">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Pill size={20} className="text-[#1F4D3A]" />
                <h3 className="font-extrabold text-base text-[#162e21]">Physical Dispensing Confirmation</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDispenseModalOpen(false);
                  setSelectedRxForDispense(null);
                  setDispenseErrorMsg('');
                }}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {dispenseErrorMsg && (
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-900 text-xs font-bold">
                {dispenseErrorMsg}
              </div>
            )}

            {dispenseSuccessMsg ? (
              <div className="p-5 rounded-2xl bg-emerald-100 text-emerald-950 text-xs font-bold text-center space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-700 animate-bounce" />
                <p className="text-sm font-extrabold">{dispenseSuccessMsg}</p>
                <p className="text-[11px] text-emerald-900/80">Inventory stock deducted &amp; transaction log recorded.</p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
                  <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle size={16} /> Have you physically provided the selected medicine(s) to the patient?
                  </p>
                  <p className="text-amber-800/90 text-[11px]">
                    Clicking "Confirm &amp; Mark as Dispensed" will deduct stock only for checked medicines and record an immutable transaction.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#f4faee] border border-emerald-900/10 space-y-2 text-xs">
                  <p className="font-extrabold text-emerald-950">Patient: {selectedRxForDispense.patientName}</p>
                  <p className="text-gray-600 font-semibold">Prescription ID: {selectedRxForDispense.prescriptionNumber || selectedRxForDispense.id}</p>
                  
                  {/* Selected items */}
                  <div className="pt-2 border-t border-emerald-200/60">
                    <span className="font-bold text-[#1F4D3A] block mb-1">Medicines to be deducted from stock:</span>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 font-medium">
                      {(selectedRxForDispense.medicines || [])
                        .filter((m, i) => isMedSelected(selectedRxForDispense.id, i))
                        .map((m, i) => (
                          <li key={i}>
                            <span className="font-bold text-gray-900">{m.medicineName}</span> — Deduct <strong>{m.quantity || 1} {m.unit || 'g'}</strong> ({m.dosage})
                          </li>
                        ))}
                    </ul>
                  </div>

                  {/* Skipped items if any */}
                  {(selectedRxForDispense.medicines || []).some((m, i) => !isMedSelected(selectedRxForDispense.id, i)) && (
                    <div className="pt-2 border-t border-amber-200/60 text-amber-900">
                      <span className="font-bold block mb-1">Skipped Medicines (Not requested / already with patient):</span>
                      <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px]">
                        {(selectedRxForDispense.medicines || [])
                          .filter((m, i) => !isMedSelected(selectedRxForDispense.id, i))
                          .map((m, i) => (
                            <li key={i} className="line-through">
                              {m.medicineName} (Stock will NOT be deducted)
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Dispensing Notes (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Enter batch confirmation or patient instructions..."
                    value={dispensingNotes}
                    onChange={(e) => setDispensingNotes(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 p-3 text-xs text-gray-900 outline-none focus:border-[#1F4D3A] font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDispenseModalOpen(false);
                      setSelectedRxForDispense(null);
                      setDispenseErrorMsg('');
                    }}
                    className="px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDispenseSubmit}
                    className="px-5 py-2.5 rounded-2xl bg-[#1F4D3A] text-white text-xs font-bold hover:bg-[#163a2c] shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Check size={16} /> Confirm &amp; Mark as Dispensed
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
