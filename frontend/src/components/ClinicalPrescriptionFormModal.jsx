import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles, CheckCircle2, FileText, Calendar, Pill, Search, Layers } from 'lucide-react';
import api from '../api';

const THERAPY_OPTIONS = [
  'Abhyanga (Oil Massage)',
  'Shirodhara (Oil Pouring)',
  'Nasya (Nasal Therapy)',
  'Vamana (Emesis Therapy)',
  'Virechana (Purgation)',
  'Basti (Enema Therapy)',
  'Pizhichil (Warm Oil Squeeze)',
  'Udvartana (Herbal Powder Massage)',
];

const FORM_OPTIONS = ['Powder', 'Churna', 'Capsules', 'Tablets', 'Taila', 'Ghrita', 'Avaleha', 'Arishta', 'Kashayam', 'Oil'];
const ROUTE_OPTIONS = ['Oral', 'Nasal', 'External', 'Rectal (Basti)', 'Ocular (Tarpana)'];
const FREQUENCY_OPTIONS = ['Once Daily', 'Twice Daily', 'Three Times Daily', 'Four Times Daily'];
const INSTRUCTION_OPTIONS = ['After food', 'Before food', 'With warm water', 'With warm milk', 'Before sleep', 'External use'];

const DIET_PRESET_CHIPS = [
  'Consume warm freshly prepared food.',
  'Drink warm water throughout the day.',
  'Avoid refrigerated & cold foods.',
  'Avoid heavy oily & fried foods.',
  'Maintain light warm soup diet post therapy.',
];

const LIFESTYLE_PRESET_CHIPS = [
  'Sleep before 10 PM.',
  'Avoid heavy strenuous exercise.',
  'Practice 15 mins meditation daily.',
  'Take adequate rest post session.',
  'Avoid direct wind & cold AC draft exposure.',
];

const POSTCARE_PRESET_CHIPS = [
  'Do not bathe immediately after therapy (wait 45 mins).',
  'Avoid cold drinks & iced water.',
  'Take complete rest after oil treatment.',
  'Attend next scheduled session on time.',
];

export default function ClinicalPrescriptionFormModal({ isOpen, onClose, patientData, booking, onSuccess, sidebarOffset = 0 }) {
  const [patients, setPatients] = useState([]);
  const [catalogMedicines, setCatalogMedicines] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [markCompleted, setMarkCompleted] = useState(true);

  const [form, setForm] = useState({
    patientId: '',
    patientName: '',
    chiefComplaint: '',
    clinicalDiagnosis: '',
    therapyName: THERAPY_OPTIONS[0],
    totalSessions: 7,
    frequency: 'Alternate Days',
    dietAdvice: '',
    lifestyleAdvice: '',
    postCareInstructions: '',
    followUpDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    status: 'PENDING',
  });
  const [medicines, setMedicines] = useState([]);
  const [enableFollowUp, setEnableFollowUp] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    followupDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    followupTime: '10:00',
    reason: 'Routine Agni & Recovery Evaluation',
  });

  useEffect(() => {
    if (!isOpen) return;
    async function loadData() {
      try {
        const [patientsRes, medsRes] = await Promise.all([
          api.get('/therapists/my-patients'),
          api.get('/medicines')
        ]);

        const pList = patientsRes.data || [];
        setPatients(pList);
        
        const mList = medsRes.data || [];
        setCatalogMedicines(mList);

        const targetData = booking || patientData;
        if (targetData?.patientId || targetData?.id) {
          const pid = targetData.patientId || targetData.id;
          const pName = targetData.patientFullName || targetData.patientName || targetData.fullName || 'Valued Patient';
          const pComplaint = targetData.purpose || targetData.chiefComplaint || 'Panchakarma Consultation';
          const pDiag = targetData.sessionNotes || targetData.clinicalDiagnosis || '';
          const pTherapy = targetData.therapyName || THERAPY_OPTIONS[0];

          setForm(prev => ({
            ...prev,
            patientId: pid,
            patientName: pName,
            chiefComplaint: pComplaint,
            clinicalDiagnosis: pDiag,
            therapyName: pTherapy
          }));
        } else if (pList.length > 0) {
          setForm(prev => ({ ...prev, patientId: pList[0].id, patientName: pList[0].fullName }));
        }

        if (mList.length > 0) {
          // Don't auto-add a medicine — let the practitioner add them explicitly
          // setMedicines([...]); // Removed: was auto-adding first catalog item
        }
      } catch (err) {
        console.error('Failed to fetch patients or medicine catalog', err);
      }
    }
    loadData();
  }, [isOpen, patientData, booking]);

  if (!isOpen) return null;

  const handleAddMedicine = () => {
    const firstCat = catalogMedicines.length > 0 ? catalogMedicines[0] : null;
    setMedicines(prev => [
      ...prev,
      {
        medicineId: firstCat ? firstCat.id : null,
        medicineName: firstCat ? firstCat.name : 'Brahmi Ghrita',
        form: firstCat ? (firstCat.category || 'Ghrita') : 'Ghrita',
        quantity: 100,
        unit: firstCat?.unit ? firstCat.unit.split(' ')[0] : 'g',
        dosage: '1 Teaspoon',
        frequency: 'Twice Daily',
        duration: '15 Days',
        route: 'Oral',
        instructions: 'With warm water after food',
        availableStock: firstCat ? firstCat.currentStock : 100,
      },
    ]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectCatalogMedicine = (index, catalogMedId) => {
    const selected = catalogMedicines.find(m => String(m.id) === String(catalogMedId));
    if (selected) {
      setMedicines(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          medicineId: selected.id,
          medicineName: selected.name,
          form: selected.category || updated[index].form,
          availableStock: selected.currentStock,
          unit: selected.unit ? selected.unit.split(' ')[0] : updated[index].unit,
        };
        return updated;
      });
    }
  };

  const handleMedicineChange = (index, field, value) => {
    setMedicines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addPresetChip = (formField, chipText) => {
    setForm(prev => {
      const current = prev[formField] || '';
      if (current.includes(chipText)) return prev;
      return {
        ...prev,
        [formField]: current ? `${current} ${chipText}` : chipText,
      };
    });
  };

  async function handleSubmit(e, isDraft = false) {
    if (e) e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const auth = JSON.parse(localStorage.getItem('panchakarma-auth') || '{}');
      const statusToSave = isDraft ? 'DRAFT' : 'PENDING';

      const activeBookingData = booking || (patientData?.bookingId ? patientData : null) || patientData;
      const consultationCategory = activeBookingData?.consultationCategory || (isNormalConsultation ? 'NORMAL' : 'THERAPY_RECOMMENDATION');

      const payload = {
        ...form,
        status: statusToSave,
        consultationCategory,
        doctorName: auth?.fullName ? (auth.fullName.toLowerCase().startsWith('dr.') ? auth.fullName : `Therapist ${auth.fullName}`) : 'Therapist Abi',
        medicines: medicines.map(m => ({
          medicineId: m.medicineId,
          medicineName: m.medicineName,
          form: m.form,
          quantity: parseInt(m.quantity) || 1,
          unit: m.unit || 'g',
          dosage: m.dosage || '5 g',
          frequency: m.frequency || 'Twice Daily',
          duration: m.duration || '15 Days',
          route: m.route || 'Oral',
          instructions: m.instructions || 'After food'
        })),
      };

      await api.post('/patient/prescriptions', payload);

      // If completing a session booking, update booking status to COMPLETED
      const activeBooking = booking || (patientData?.bookingId ? patientData : null);
      if (activeBooking && markCompleted) {
        const bId = activeBooking.bookingId || activeBooking.id;
        let compiledAdvice = ``;
        if (form.dietAdvice) compiledAdvice += `🥗 DIET ADVICE:\n${form.dietAdvice}\n\n`;
        if (form.lifestyleAdvice) compiledAdvice += `🧘 LIFESTYLE & PRECAUTIONS:\n${form.lifestyleAdvice}\n\n`;
        if (form.postCareInstructions) compiledAdvice += `🌿 POST-CARE RECOVERY:\n${form.postCareInstructions}\n\n`;

        await api.put(`/bookings/${bId}/session-details`, {
          sessionNotes: form.clinicalDiagnosis || form.chiefComplaint,
          patientAdvice: compiledAdvice,
          status: 'COMPLETED'
        });

        // Also create treatment plan for patient if in consultation with therapy recommendation mode & therapy prescribed
        const isNormalConsult = activeBooking?.consultationCategory === 'NORMAL';
        if (isConsultation && !isNormalConsult && form.therapyName && form.patientId) {
          try {
            await api.post('/treatment-plans', {
              patientId: form.patientId,
              therapyName: form.therapyName,
              totalSessions: form.totalSessions || 7,
              frequency: form.frequency || 'Alternate Days',
              assignedTherapistId: activeBooking.assignedToId || activeBooking.therapistId,
              clinicalNotes: form.clinicalDiagnosis || compiledAdvice,
              prescribedStartDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            });
          } catch (tpErr) {
            console.log('Treatment plan creation note:', tpErr);
          }
        }

        // Schedule optional follow-up session if therapist enabled it
        if (enableFollowUp && followUpData.followupDate && form.patientId) {
          try {
            await api.post('/followups/schedule', {
              patientId: form.patientId,
              bookingId: activeBooking ? (activeBooking.bookingId || activeBooking.id) : null,
              treatmentName: form.therapyName || 'Panchakarma Recovery Session',
              followupDate: followUpData.followupDate,
              followupTime: followUpData.followupTime || '10:00',
              reason: followUpData.reason || 'Routine Follow-up',
            }).catch(() => null);
          } catch (flErr) {
            console.log('Optional follow-up schedule note:', flErr);
          }
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save clinical prescription.');
    } finally {
      setSubmitting(false);
    }
  }

  const targetBooking = booking || (patientData?.bookingId ? patientData : null) || patientData;
  const purposeText = (targetBooking?.purpose || targetBooking?.therapyName || targetBooking?.notes || targetBooking?.serviceType || '').toLowerCase();
  const isConsultation = !booking || 
                         purposeText.includes('consult') || 
                         purposeText.includes('doctor') || 
                         purposeText.includes('assessment') ||
                         targetBooking?.bookingType === 'CONSULTATION' ||
                         targetBooking?.type === 'CONSULTATION' ||
                         targetBooking?.isConsultation === true;

  const isNormalConsultation = isConsultation && (
    targetBooking?.consultationCategory === 'NORMAL' ||
    purposeText.includes('normal') ||
    purposeText.includes('checkup') ||
    purposeText.includes('general')
  );
  const isTherapyRecommendation = isConsultation && !isNormalConsultation;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-200" style={{ background: 'rgba(15,30,20,0.60)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-4xl flex flex-col rounded-[2rem] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.25)] overflow-hidden border border-white/60" style={{ maxHeight: 'calc(100vh - 32px)' }}>

        {/* ── STICKY HEADER ── */}
        <div className="relative shrink-0 px-7 pt-6 pb-5" style={{ background: isNormalConsultation ? 'linear-gradient(135deg,#1a2d5a 0%,#2d4a80 100%)' : 'linear-gradient(135deg,#1a3d2b 0%,#2d5a3d 50%,#3a7050 100%)' }}>
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#fff,transparent)', transform: 'translate(30%,-30%)' }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/25 shrink-0">
                <FileText size={22} className="text-white" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="font-display text-lg font-extrabold text-white tracking-tight">
                  {isNormalConsultation ? '🩺 Complete Normal Consultation'
                    : isTherapyRecommendation ? '🌿 Complete Consultation with Therapy'
                    : '📋 Complete Session & Clinical Prescription'}
                </h2>
                <p className="text-white/60 text-xs font-medium mt-0.5">
                  {booking ? `Patient: ${form.patientName || 'Patient'} · ${isNormalConsultation ? 'Standard Evaluation' : 'Therapy Track Planning'}` : 'Panchakarma Therapy & Herbal Formulation Prescriber'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer shrink-0">
              <X size={17} />
            </button>
          </div>

          {/* Booking type badge */}
          {isConsultation && (
            <div className="relative mt-3 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/15">
              <span className="text-lg">{isNormalConsultation ? '🩺' : '🌿'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-extrabold text-white uppercase tracking-wider">{isNormalConsultation ? 'Normal Consultation' : 'Consultation + Therapy Recommendation'}</p>
                <p className="text-white/60 text-[10px] font-medium leading-relaxed">{isNormalConsultation ? 'Enter clinical diagnosis, optional medicines, and diet/lifestyle advice.' : 'Specify therapy type, session count, frequency, and post-care instructions.'}</p>
              </div>
              <span className={`shrink-0 text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${isNormalConsultation ? 'bg-blue-100/20 text-blue-100 border-blue-300/30' : 'bg-emerald-100/20 text-emerald-100 border-emerald-300/30'}`}>
                {isNormalConsultation ? 'General Checkup' : 'Therapy Track'}
              </span>
            </div>
          )}
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5">

          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-rose-600 font-extrabold text-xs">{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-16 text-center space-y-4">
              <div className="relative inline-block">
                <div className="h-20 w-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={44} className="text-emerald-600" strokeWidth={1.8} />
                </div>
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Sparkles size={13} className="text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-forest">
                  {booking ? 'Session Marked COMPLETED!' : 'Prescription Sent to Pharmacist!'}
                </h3>
                <p className="text-xs text-forest/70 max-w-md mx-auto mt-2 leading-relaxed">
                  {booking ? 'Clinical notes and guidelines have been saved for patient access.' : 'The prescription is PENDING dispensal. Stock will be updated when the Pharmacist dispenses.'}
                </p>
              </div>
            </div>
          ) : (
            <form id="clinical-session-form" onSubmit={(e) => handleSubmit(e, false)} className="space-y-5 text-xs">
            {/* Step 1: Patient & Clinical Diagnosis */}
            <div className="rounded-2xl border border-sand/40 bg-[#faf8f4] p-4 space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-forest/80 border-b border-sand/40 pb-2 text-[11px]">
                1. Clinical Diagnosis & Session Notes
              </h3>

              {!patientData && !booking && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block font-display font-bold text-forest/80 text-xs">Select Patient *</label>
                    <select
                      value={form.patientId}
                      onChange={(e) => {
                        const selected = patients.find(p => String(p.id) === String(e.target.value));
                        setForm({ ...form, patientId: e.target.value, patientName: selected?.fullName || '' });
                      }}
                      className="w-full rounded-xl border border-sand bg-white p-3 font-bold text-forest outline-none focus:border-[#1F4D3A] focus:ring-2 focus:ring-emerald-500/20 text-xs"
                      required
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.fullName} ({p.email})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block font-display font-bold text-forest/80 text-xs">Chief Complaint *</label>
                    <input
                      type="text"
                      value={form.chiefComplaint}
                      onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                      placeholder="e.g. Knee Pain, Lower Back Stiffness"
                      className="w-full rounded-xl border border-sand bg-white p-3 font-semibold text-forest outline-none focus:border-[#1F4D3A] focus:ring-2 focus:ring-emerald-500/20 text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block font-display font-bold text-forest/80 text-xs">Clinical Diagnosis *</label>
                <textarea
                  rows={3}
                  value={form.clinicalDiagnosis}
                  onChange={(e) => setForm({ ...form, clinicalDiagnosis: e.target.value })}
                  placeholder="e.g. Sandhigata Vata (Osteoarthritis), Amavata, Vata-Kapha imbalance causing joint stiffness and pain."
                  className="w-full rounded-2xl border border-sand bg-white p-3.5 font-semibold text-forest text-xs leading-relaxed outline-none focus:border-[#1F4D3A] focus:ring-2 focus:ring-emerald-500/20 transition resize-y"
                  required
                />
              </div>
            </div>

            {/* Step 2: Panchakarma Therapy Prescription (Only shown during Consultation with Therapy) */}
            {isTherapyRecommendation && (
              <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50/50 to-white p-4 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-sand/40 pb-2 flex-wrap gap-2">
                  <h3 className="font-bold uppercase tracking-wider text-forest/80 text-[11px] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-700" />
                    2. Panchakarma Therapy Track Prescription
                  </h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-900 border border-emerald-300">
                    Therapy Track Prescription
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block font-bold text-forest/70">Panchakarma Therapy</label>
                    <select
                      value={form.therapyName}
                      onChange={(e) => setForm({ ...form, therapyName: e.target.value })}
                      className="w-full rounded-xl border border-sand bg-white p-2.5 font-semibold text-forest outline-none"
                    >
                      {THERAPY_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-forest/70">Total Sessions</label>
                    <select
                      value={form.totalSessions}
                      onChange={(e) => setForm({ ...form, totalSessions: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-sand bg-white p-2.5 font-semibold text-forest outline-none"
                    >
                      <option value={1}>1 Single Session</option>
                      <option value={3}>3 Sessions (Introductory)</option>
                      <option value={7}>7 Sessions (Standard Panchakarma Course)</option>
                      <option value={14}>14 Sessions (Intensive Healing Track)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-forest/70">Prescribed Frequency</label>
                    <select
                      value={form.frequency}
                      onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                      className="w-full rounded-xl border border-sand bg-white p-2.5 font-semibold text-forest outline-none"
                    >
                      <option value="Daily">Daily (Once Daily)</option>
                      <option value="Alternate Days">Alternate Days (Every 2 Days)</option>
                      <option value="Weekly">Weekly (Every 7 Days)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Prescribed Medicines Editor */}
            <div className="rounded-2xl border border-sand/40 bg-white p-4 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-sand/40 pb-2">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-forest/80 text-[11px] flex items-center gap-1.5">
                    <Pill size={14} className="text-emerald-700" />
                    {isTherapyRecommendation ? '3.' : '2.'} Select Medicines from Pharmacy Catalog (Optional)
                  </h3>
                  <p className="text-[10px] text-forest/60 mt-0.5">
                    Select from live inventory catalog. Prescribing does <strong>NOT</strong> deduct stock (Stock is deducted upon Pharmacist dispensing).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMedicine}
                  className="flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-950 hover:bg-emerald-200 transition cursor-pointer shrink-0"
                >
                  <Plus size={14} /> Add Medicine
                </button>
              </div>

              {medicines.length === 0 ? (
                <div className="p-3 text-center text-forest/50 italic bg-[#faf8f4] rounded-xl border border-dashed border-sand/60">
                  No medicines prescribed yet. Click "+ Add Medicine" above to prescribe from pharmacy catalog.
                </div>
              ) : (
                <div className="space-y-4">
                  {medicines.map((med, idx) => (
                    <div key={idx} className="rounded-2xl border border-sand/50 bg-[#faf8f4] p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-900 text-xs">Medicine #{idx + 1}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                          title="Remove Medicine"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                        {/* Medicine Selector from Catalog */}
                        <div className="md:col-span-4">
                          <label className="text-[10px] font-bold text-forest/60 block mb-0.5">Select Catalog Medicine</label>
                          <select
                            value={med.medicineId || ''}
                            onChange={(e) => {
                              if (e.target.value === 'CUSTOM') {
                                handleMedicineChange(idx, 'medicineId', null);
                                handleMedicineChange(idx, 'medicineName', '');
                              } else {
                                handleSelectCatalogMedicine(idx, e.target.value);
                              }
                            }}
                            className="w-full rounded-xl border border-sand bg-white p-2.5 font-bold text-forest outline-none text-xs"
                          >
                            <option value="">-- Select Formulation --</option>
                            {catalogMedicines.map(cm => (
                              <option key={cm.id} value={cm.id}>
                                {cm.name} ({cm.category || 'General'})
                              </option>
                            ))}
                            <option value="CUSTOM">+ Custom / Manual Entry</option>
                          </select>
                        </div>

                        {!med.medicineId && (
                          <div className="md:col-span-4">
                            <label className="text-[10px] font-bold text-forest/60 block mb-0.5">Custom Medicine Name</label>
                            <input
                              type="text"
                              value={med.medicineName}
                              onChange={(e) => handleMedicineChange(idx, 'medicineName', e.target.value)}
                              className="w-full rounded-xl border border-sand bg-white p-2.5 font-semibold text-forest outline-none text-xs"
                              placeholder="e.g. Custom Churna Mix"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-forest/60 block mb-0.5">Prescribed Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={med.quantity || 150}
                            onChange={(e) => handleMedicineChange(idx, 'quantity', parseInt(e.target.value))}
                            className="w-full rounded-xl border border-sand bg-white p-2 font-bold text-forest outline-none text-xs"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-forest/60 block mb-0.5">Unit</label>
                          <input
                            type="text"
                            value={med.unit || 'g'}
                            onChange={(e) => handleMedicineChange(idx, 'unit', e.target.value)}
                            placeholder="g, ml, tabs"
                            className="w-full rounded-xl border border-sand bg-white p-2 font-semibold text-forest outline-none text-xs"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-forest/60 block mb-0.5">Dosage</label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                            placeholder="e.g. 5 g, 2 tabs"
                            className="w-full rounded-xl border border-sand bg-white p-2 font-semibold text-forest outline-none text-xs"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-forest/60 block mb-0.5">Frequency</label>
                          <select
                            value={med.frequency}
                            onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                            className="w-full rounded-xl border border-sand bg-white p-2 font-semibold text-forest outline-none text-xs"
                          >
                            {FREQUENCY_OPTIONS.map(freq => (
                              <option key={freq} value={freq}>{freq}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-forest/60 block mb-0.5">Duration</label>
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                            placeholder="e.g. 15 Days"
                            className="w-full rounded-xl border border-sand bg-white p-2 font-semibold text-forest outline-none text-xs"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-forest/60 block mb-0.5">Route</label>
                          <select
                            value={med.route || 'Oral'}
                            onChange={(e) => handleMedicineChange(idx, 'route', e.target.value)}
                            className="w-full rounded-xl border border-sand bg-white p-2 font-semibold text-forest outline-none text-xs"
                          >
                            {ROUTE_OPTIONS.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-forest/60 block mb-0.5">Instructions</label>
                        <select
                          value={med.instructions}
                          onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                          className="w-full rounded-xl border border-sand bg-white p-2 font-semibold text-forest outline-none text-xs"
                        >
                          {INSTRUCTION_OPTIONS.map(inst => (
                            <option key={inst} value={inst}>{inst}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddMedicine}
                className="w-full py-2.5 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 text-emerald-950 font-bold hover:bg-emerald-100/50 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={16} /> + Add Another Medicine
              </button>
            </div>

            {/* Step 4: Advice & Lifestyle */}
            <div className={`grid grid-cols-1 ${isNormalConsultation ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
              <div className="space-y-2">
                <label className="font-bold text-forest/80 block">Diet Advice (Pathya Ahara)</label>
                <textarea
                  rows={3}
                  value={form.dietAdvice}
                  onChange={(e) => setForm({ ...form, dietAdvice: e.target.value })}
                  placeholder="e.g. Warm sattvic food, avoid cold/chilled beverages..."
                  className="w-full rounded-xl border border-sand p-2.5 text-xs text-forest outline-none"
                />
                <div className="flex flex-wrap gap-1">
                  {DIET_PRESET_CHIPS.map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => addPresetChip('dietAdvice', chip)}
                      className="rounded-lg bg-sand/30 px-2 py-0.5 text-[9px] font-semibold text-forest hover:bg-sand/60"
                    >
                      + {chip.slice(0, 24)}...
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-forest/80 block">Lifestyle Guidelines (Vihara)</label>
                <textarea
                  rows={3}
                  value={form.lifestyleAdvice}
                  onChange={(e) => setForm({ ...form, lifestyleAdvice: e.target.value })}
                  placeholder="e.g. Sleep before 10 PM, avoid direct cold drafts..."
                  className="w-full rounded-xl border border-sand p-2.5 text-xs text-forest outline-none"
                />
                <div className="flex flex-wrap gap-1">
                  {LIFESTYLE_PRESET_CHIPS.map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => addPresetChip('lifestyleAdvice', chip)}
                      className="rounded-lg bg-sand/30 px-2 py-0.5 text-[9px] font-semibold text-forest hover:bg-sand/60"
                    >
                      + {chip.slice(0, 24)}...
                    </button>
                  ))}
                </div>
              </div>

              {!isNormalConsultation && (
                <div className="space-y-2">
                  <label className="font-bold text-forest/80 block">Post Care Recovery Instructions</label>
                  <textarea
                    rows={3}
                    value={form.postCareInstructions}
                    onChange={(e) => setForm({ ...form, postCareInstructions: e.target.value })}
                    placeholder="e.g. Do not bathe immediately after oil massage (wait 45 mins)..."
                    className="w-full rounded-xl border border-sand p-2.5 text-xs text-forest outline-none"
                  />
                  <div className="flex flex-wrap gap-1">
                    {POSTCARE_PRESET_CHIPS.map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => addPresetChip('postCareInstructions', chip)}
                        className="rounded-lg bg-sand/30 px-2 py-0.5 text-[9px] font-semibold text-forest hover:bg-sand/60"
                      >
                        + {chip.slice(0, 24)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 5: OPTIONAL FOLLOW-UP SESSION SECTION */}
            <div className="rounded-2xl border border-[#1F4D3A]/20 bg-[#F7FAF4] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableFollowUp}
                    onChange={(e) => setEnableFollowUp(e.target.checked)}
                    className="h-4 w-4 rounded text-[#1F4D3A] focus:ring-[#1F4D3A] cursor-pointer"
                  />
                  <span className="font-bold text-xs text-[#1F4D3A] flex items-center gap-1.5">
                    <span>⏱️</span> Schedule Follow-Up Session (Optional)
                  </span>
                </label>
                <span className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                  Optional
                </span>
              </div>

              {enableFollowUp && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t border-emerald-900/10">
                  <div>
                    <label className="block text-[11px] font-bold text-forest/70 mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={followUpData.followupDate}
                      onChange={(e) => setFollowUpData({ ...followUpData, followupDate: e.target.value })}
                      className="w-full rounded-xl border border-sand bg-white p-2 text-xs text-forest outline-none focus:border-[#1F4D3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-forest/70 mb-1">Preferred Time</label>
                    <input
                      type="time"
                      value={followUpData.followupTime}
                      onChange={(e) => setFollowUpData({ ...followUpData, followupTime: e.target.value })}
                      className="w-full rounded-xl border border-sand bg-white p-2 text-xs text-forest outline-none focus:border-[#1F4D3A]"
                    />
                  </div>
                </div>
              )}
            </div>

            </form>
          )}
        </div>

        {/* ── STICKY FOOTER ── */}
        {!success && (
          <div className="shrink-0 px-7 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition cursor-pointer shadow-xs"
            >
              Cancel
            </button>
            <button
              form="clinical-session-form"
              type="submit"
              disabled={submitting}
              className={`flex items-center gap-2 px-7 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-lg transition cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                isNormalConsultation ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#1F4D3A] hover:bg-[#163a2c]'
              }`}
              style={{ boxShadow: submitting ? 'none' : isNormalConsultation ? '0 8px 24px rgba(37,99,235,0.3)' : '0 8px 24px rgba(29,78,50,0.35)' }}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Completing Session...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                  {isNormalConsultation ? 'Complete Consultation & Save Notes'
                    : isTherapyRecommendation ? 'Complete Consultation & Save Therapy Plan'
                    : 'Complete Session & Save Prescription'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
