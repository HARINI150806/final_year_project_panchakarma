import { useState, useEffect } from 'react';
import {
  Pill, CheckCircle2, AlertTriangle, FileText, User, Check, X,
  Clock, AlertCircle, PackageX, ShieldAlert, Sparkles, ClipboardCheck,
  FlaskConical, Leaf, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../../api';

export default function PharmacistDispenseView({ refreshKey, onDispensed }) {
  const [activeSubTab, setActiveSubTab] = useState('PENDING');
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [dispensedHistory, setDispensedHistory] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Per-card inline confirm state — keyed by rx.id
  const [confirmOpenId, setConfirmOpenId] = useState(null);
  const [dispensingNotes, setDispensingNotes] = useState('');
  const [dispenseSuccessId, setDispenseSuccessId] = useState(null);
  const [dispenseErrorMsg, setDispenseErrorMsg] = useState('');
  const [selectedMeds, setSelectedMeds] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, [refreshKey]);

  const isMedSelected = (rxId, idx) => {
    if (!selectedMeds[rxId]) return true;
    return selectedMeds[rxId][idx] !== false;
  };

  const toggleMedSelection = (rxId, idx) => {
    setSelectedMeds(prev => {
      const rxState = prev[rxId] || {};
      const current = rxState[idx] !== false;
      return { ...prev, [rxId]: { ...rxState, [idx]: !current } };
    });
  };

  const hasMedicines = (p) => {
    if (!p) return false;
    if (Array.isArray(p.medicines)) {
      return p.medicines.length > 0;
    }
    if (p.medicineName && p.medicineName.trim()) {
      const name = p.medicineName.trim().toLowerCase();
      return name !== 'n/a' && name !== 'none' && name !== 'null' && name !== 'undefined';
    }
    return false;
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
    if (med.medicineId) target = inventoryList.find(m => String(m.id) === String(med.medicineId));
    if (!target && med.medicineName) {
      target = inventoryList.find(m =>
        m.name.toLowerCase().includes(med.medicineName.toLowerCase()) ||
        med.medicineName.toLowerCase().includes(m.name.toLowerCase())
      );
    }
    const reqQty = med.quantity || 1;
    const availQty = target ? (target.currentStock ?? 0) : (med.availableStock ?? 0);
    const expiryDate = target?.expiryDate || med?.expiryDate || null;
    const batchNumber = target?.batchNumber || med?.batchNumber || 'N/A';
    const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
    const isInsufficient = availQty < reqQty;
    return { reqQty, availQty, expiryDate, batchNumber, isExpired, isInsufficient };
  };

  const openConfirm = (rxId) => {
    setConfirmOpenId(rxId);
    setDispenseErrorMsg('');
    setDispensingNotes('');
  };

  const closeConfirm = () => {
    setConfirmOpenId(null);
    setDispenseErrorMsg('');
    setDispensingNotes('');
  };

  const handleDispenseSubmit = async (rx) => {
    setDispenseErrorMsg('');
    setSubmitting(true);

    const activeMeds = (rx.medicines || []).filter((m, idx) => isMedSelected(rx.id, idx));

    if (activeMeds.length === 0) {
      setDispenseErrorMsg('Please select at least 1 medicine to dispense.');
      setSubmitting(false);
      return;
    }

    let hasInsufficient = false, hasExpired = false;
    activeMeds.forEach(pm => {
      const d = getStockDetailsForMed(pm);
      if (d.isExpired) hasExpired = true;
      if (d.isInsufficient) hasInsufficient = true;
    });

    if (hasExpired) { setDispenseErrorMsg('Cannot dispense! One of the selected medicines has EXPIRED.'); setSubmitting(false); return; }
    if (hasInsufficient) { setDispenseErrorMsg('Cannot dispense! Insufficient stock for a selected medicine.'); setSubmitting(false); return; }

    try {
      const auth = JSON.parse(localStorage.getItem('panchakarma-auth') || '{}');
      await api.post(`/pharmacist/dispense/${rx.id}`, {
        pharmacistName: auth?.fullName || 'Duty Pharmacist',
        notes: dispensingNotes,
        selectedMedicineNames: activeMeds.map(m => m.medicineName)
      });

      setDispenseSuccessId(rx.id);
      setConfirmOpenId(null);

      setTimeout(() => {
        setDispenseSuccessId(null);
        setPendingPrescriptions(p => p.filter(r => r.id !== rx.id));
        setDispensedHistory(h => [{ ...rx, status: 'DISPENSED', dispensedAt: new Date().toISOString() }, ...h]);
        fetchData();
        if (onDispensed) onDispensed();
      }, 1800);
    } catch (err) {
      setDispenseErrorMsg(err.response?.data?.message || 'Error dispensing prescription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 motion-fade-in-up">

      {/* ── HEADER & TABS ── */}
      <div className="panel-frost rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-forest flex items-center gap-2">
            <Pill size={22} className="text-[#355c39]" /> Dispense Prescriptions
          </h2>
          <p className="font-body text-xs text-forest/65 font-medium mt-0.5">
            Fulfill Ayurvedic prescriptions, verify stock &amp; expiry, and auto-update inventory.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#eef6e6] p-1.5 rounded-2xl shrink-0 border border-[#cfe0c2]">
          {['PENDING', 'DISPENSED'].map(tab => (
            <button key={tab} type="button" onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-2 rounded-xl font-display text-xs font-semibold transition cursor-pointer ${
                activeSubTab === tab
                  ? 'bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] text-white shadow-xs'
                  : 'text-forest/70 hover:text-forest'
              }`}>
              {tab === 'PENDING' ? `Pending (${pendingPrescriptions.length})` : `History (${dispensedHistory.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── PENDING TAB ── */}
      {activeSubTab === 'PENDING' && (
        <div className="space-y-4">
          {pendingPrescriptions.length === 0 ? (
            <div className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-12 text-center space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
              <h3 className="font-display font-bold text-gray-800 text-base">No Pending Prescriptions</h3>
              <p className="font-body text-xs text-gray-500">All prescriptions have been dispensed.</p>
            </div>
          ) : (
            pendingPrescriptions.map((rx) => {
              let rxHasInsufficient = false, rxHasExpired = false, selectedCount = 0;
              const totalMeds = (rx.medicines || []).length;
              (rx.medicines || []).forEach((med, idx) => {
                if (isMedSelected(rx.id, idx)) {
                  selectedCount++;
                  const d = getStockDetailsForMed(med);
                  if (d.isInsufficient) rxHasInsufficient = true;
                  if (d.isExpired) rxHasExpired = true;
                }
              });

              const isConfirmOpen = confirmOpenId === rx.id;
              const isSuccess = dispenseSuccessId === rx.id;

              return (
                <div key={rx.id}
                  className={`rounded-3xl border bg-white/90 backdrop-blur-md shadow-xs transition-all duration-300 overflow-hidden ${
                    isConfirmOpen ? 'border-emerald-400 shadow-[0_0_0_3px_rgba(52,130,87,0.12)]' : 'border-emerald-900/10 hover:shadow-md'
                  }`}>

                  {/* ── SUCCESS BANNER ── */}
                  {isSuccess && (
                    <div className="flex items-center gap-4 px-6 py-5 bg-emerald-50 border-b border-emerald-200">
                      <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} className="text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="font-extrabold text-emerald-900 text-sm">Dispensed Successfully!</p>
                        <p className="text-xs text-emerald-700 font-medium">Stock deducted · Transaction recorded</p>
                      </div>
                      <Sparkles size={18} className="text-emerald-500 ml-auto" />
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    {/* RX Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#E4EFE0] text-[#1F4D3A] font-extrabold text-xs flex items-center justify-center border border-emerald-200">RX</div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-base text-[#162e21]">{rx.patientName || 'Registered Patient'}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100/80 text-amber-900 border border-amber-200">{rx.prescriptionNumber || `RX-${rx.id}`}</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 uppercase">PENDING</span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">Prescribed by: <span className="font-bold text-[#1F4D3A]">{rx.doctorName || 'Therapist'}</span></p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{new Date(rx.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Medicines List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900/50">
                          Prescribed Formulations ({selectedCount}/{totalMeds} Selected)
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(rx.medicines || []).map((med, idx) => {
                          const sDetails = getStockDetailsForMed(med);
                          const isChecked = isMedSelected(rx.id, idx);
                          return (
                            <div key={idx} className={`p-3.5 rounded-2xl border space-y-2 transition ${
                              !isChecked ? 'bg-gray-100/70 border-gray-200 opacity-60'
                              : sDetails.isExpired ? 'bg-rose-50/90 border-rose-200'
                              : sDetails.isInsufficient ? 'bg-amber-50/90 border-amber-200'
                              : 'bg-[#f4faee] border-emerald-900/15'
                            }`}>
                              <div className="flex items-center justify-between gap-2 border-b border-gray-100/80 pb-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input type="checkbox" checked={isChecked} onChange={() => toggleMedSelection(rx.id, idx)}
                                    className="rounded border-gray-300 text-emerald-700 focus:ring-emerald-500 h-4 w-4 cursor-pointer" />
                                  <span className={`font-extrabold text-sm ${isChecked ? 'text-[#162e21]' : 'text-gray-500 line-through'}`}>{med.medicineName}</span>
                                </label>
                                {isChecked ? (
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    sDetails.isExpired ? 'bg-rose-100 text-rose-900 border-rose-300'
                                    : sDetails.isInsufficient ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-emerald-100 text-emerald-950 border-emerald-200'
                                  }`}>
                                    {sDetails.isExpired ? '🔴 EXPIRED' : sDetails.isInsufficient ? `⚠ LOW (${sDetails.availQty})` : `✓ OK (${sDetails.availQty})`}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gray-200 text-gray-700">⚪ SKIPPED</span>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-gray-700 bg-white/70 p-2 rounded-xl border border-gray-100">
                                <div><span className="text-[9px] text-gray-400 uppercase block">Required</span><span className="font-extrabold text-emerald-950">{sDetails.reqQty} {med.unit || 'units'}</span></div>
                                <div><span className="text-[9px] text-gray-400 uppercase block">In Stock</span><span className={`font-extrabold ${sDetails.isInsufficient ? 'text-amber-700' : 'text-emerald-800'}`}>{sDetails.availQty} {med.unit || 'units'}</span></div>
                                <div><span className="text-[9px] text-gray-400 uppercase block">Batch</span><span className="font-mono text-[10px] block text-gray-600">{sDetails.batchNumber}</span></div>
                              </div>
                              <p className="text-xs text-gray-700 font-medium">
                                {med.dosage || 'As prescribed'}{med.frequency ? ` • ${med.frequency}` : ''}{med.duration ? ` • ${med.duration}` : ''}
                              </p>
                              {med.instructions && (
                                <p className="text-[11px] text-[#1F4D3A] italic bg-white/80 p-2 rounded-xl border border-emerald-100">"{med.instructions}"</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── ACTION BAR ── */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                      <div className="text-xs">
                        {selectedCount === 0 ? (
                          <span className="text-gray-500 font-bold flex items-center gap-1"><AlertCircle size={15} /> Select at least 1 medicine.</span>
                        ) : rxHasExpired ? (
                          <span className="text-rose-700 font-bold flex items-center gap-1"><ShieldAlert size={15} /> Blocked: Selected medicine is EXPIRED.</span>
                        ) : rxHasInsufficient ? (
                          <span className="text-amber-800 font-bold flex items-center gap-1"><AlertTriangle size={15} /> Blocked: Insufficient stock.</span>
                        ) : (
                          <span className="text-emerald-800 font-bold flex items-center gap-1"><CheckCircle2 size={15} /> {selectedCount} of {totalMeds} medicine(s) verified.</span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={selectedCount === 0 || rxHasExpired || rxHasInsufficient}
                        onClick={() => isConfirmOpen ? closeConfirm() : openConfirm(rx.id)}
                        className={`rounded-2xl text-white px-5 py-2.5 text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0 disabled:bg-gray-300 disabled:cursor-not-allowed ${
                          isConfirmOpen ? 'bg-gray-600 hover:bg-gray-700' : 'bg-[#1F4D3A] hover:bg-[#163a2c]'
                        }`}
                      >
                        {isConfirmOpen ? (
                          <><ChevronUp size={15} /> Hide Confirmation</>
                        ) : (
                          <><ClipboardCheck size={15} /> Mark as Dispensed ({selectedCount})</>
                        )}
                      </button>
                    </div>

                    {/* ══════════════════════════════════════════════════
                        INLINE CONFIRMATION PANEL — expands inside card
                        ══════════════════════════════════════════════════ */}
                    {isConfirmOpen && (
                      <div className="mt-2 rounded-2xl overflow-hidden border border-emerald-300 shadow-[0_4px_20px_rgba(52,130,87,0.12)] animate-in slide-in-from-top-2 duration-200">

                        {/* Panel Header */}
                        <div className="px-5 py-3.5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#1a3d2b 0%,#2d5a3d 60%,#3a7050 100%)' }}>
                          <div className="h-8 w-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                            <ClipboardCheck size={16} className="text-white" strokeWidth={2} />
                          </div>
                          <div className="flex-1">
                            <p className="font-extrabold text-white text-sm">Confirm Dispensing</p>
                            <p className="text-emerald-200/70 text-[11px] font-medium">Physically hand medicines to patient before confirming</p>
                          </div>
                          <button onClick={closeConfirm} className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white cursor-pointer transition">
                            <X size={14} />
                          </button>
                        </div>

                        <div className="bg-white px-5 py-4 space-y-4">

                          {/* Error */}
                          {dispenseErrorMsg && (
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200">
                              <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                              <p className="text-xs font-bold text-rose-800">{dispenseErrorMsg}</p>
                            </div>
                          )}

                          {/* Warning notice */}
                          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-semibold text-amber-800 leading-relaxed">
                              This will <strong>permanently deduct stock</strong> and create an immutable transaction record. Ensure the patient has received the medicines.
                            </p>
                          </div>

                          {/* Medicines summary — two columns */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Dispensing */}
                            <div className="rounded-xl border border-emerald-200 overflow-hidden">
                              <div className="px-3 py-2 bg-emerald-50 flex items-center gap-2 border-b border-emerald-100">
                                <FlaskConical size={12} className="text-emerald-700" />
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                                  Dispensing ({(rx.medicines || []).filter((m, i) => isMedSelected(rx.id, i)).length})
                                </span>
                              </div>
                              <div className="p-2.5 space-y-1.5">
                                {(rx.medicines || []).filter((m, i) => isMedSelected(rx.id, i)).map((m, i) => (
                                  <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                                    <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                      <Check size={9} className="text-white" strokeWidth={3} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-extrabold text-emerald-950 truncate">{m.medicineName}</p>
                                      <p className="text-[10px] text-emerald-700 font-semibold">Deduct {m.quantity || 1} {m.unit || 'g'}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Skipped or All-selected */}
                            {(rx.medicines || []).some((m, i) => !isMedSelected(rx.id, i)) ? (
                              <div className="rounded-xl border border-gray-200 overflow-hidden">
                                <div className="px-3 py-2 bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                                  <PackageX size={12} className="text-gray-500" />
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600">
                                    Skipped ({(rx.medicines || []).filter((m, i) => !isMedSelected(rx.id, i)).length})
                                  </span>
                                </div>
                                <div className="p-2.5 space-y-1.5">
                                  {(rx.medicines || []).filter((m, i) => !isMedSelected(rx.id, i)).map((m, i) => (
                                    <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
                                      <div className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                                        <X size={9} className="text-white" strokeWidth={3} />
                                      </div>
                                      <p className="text-xs font-bold text-gray-400 line-through truncate">{m.medicineName}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30 flex flex-col items-center justify-center gap-1.5 p-5 text-center">
                                <Leaf size={20} className="text-emerald-400" strokeWidth={1.5} />
                                <p className="text-xs font-bold text-emerald-700">All medicines selected</p>
                                <p className="text-[10px] text-emerald-600/60">Full prescription fulfillment</p>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-600 uppercase tracking-wider">
                              <FileText size={12} className="text-gray-400" />
                              Dispensing Notes <span className="text-gray-400 font-medium normal-case tracking-normal">(Optional)</span>
                            </label>
                            <textarea
                              rows={2}
                              placeholder="e.g. Batch confirmed, patient counselled on dosage timing..."
                              value={dispensingNotes}
                              onChange={(e) => setDispensingNotes(e.target.value)}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#1F4D3A] focus:bg-white transition font-medium resize-none"
                            />
                          </div>

                          {/* Confirm / Cancel */}
                          <div className="flex items-center justify-end gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={closeConfirm}
                              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDispenseSubmit(rx)}
                              disabled={submitting}
                              className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs font-extrabold transition cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                              style={{
                                background: submitting ? '#6b7280' : 'linear-gradient(135deg,#1a3d2b 0%,#2d6a40 100%)',
                                boxShadow: submitting ? 'none' : '0 6px 18px rgba(29,78,50,0.30)'
                              }}
                            >
                              {submitting ? (
                                <>
                                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                  </svg>
                                  Dispensing...
                                </>
                              ) : (
                                <>
                                  <ClipboardCheck size={14} strokeWidth={2.5} />
                                  Confirm &amp; Mark as Dispensed
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── DISPENSED HISTORY TAB ── */}
      {activeSubTab === 'DISPENSED' && (
        <div className="space-y-3">
          {dispensedHistory.length === 0 ? (
            <div className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-12 text-center space-y-2">
              <FileText size={36} className="mx-auto text-gray-400" />
              <h3 className="font-display font-bold text-gray-800 text-base">No Dispensing History</h3>
              <p className="font-body text-xs text-gray-500">Dispensed prescriptions will appear here.</p>
            </div>
          ) : dispensedHistory.map((rx) => (
            <div key={rx.id} className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E4EFE0] text-[#1F4D3A]">DISPENSED</span>
                  <h3 className="font-extrabold text-sm text-[#162e21]">{rx.patientName}</h3>
                  <span className="text-xs font-mono text-gray-500 font-semibold">({rx.prescriptionNumber || `RX-${rx.id}`})</span>
                </div>
                <p className="text-xs text-gray-600 font-medium">Prescribed by {rx.doctorName} · Dispensed by {rx.dispensedBy || 'Pharmacist'}</p>
                {rx.dispensingNotes && <p className="text-[11px] text-gray-500 italic bg-gray-50 p-1.5 rounded-lg border border-gray-100 mt-1">Notes: {rx.dispensingNotes}</p>}
              </div>
              <div className="text-xs text-gray-500 font-semibold shrink-0">
                {new Date(rx.dispensedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
