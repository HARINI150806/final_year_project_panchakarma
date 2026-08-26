import { useRef, useState, useEffect } from 'react';
import { X, Download, Printer, History, Sparkles, Leaf, ShieldCheck, Heart, Stethoscope, Calendar } from 'lucide-react';
import { generatePrescriptionPDF } from '../utils/pdfExport';
import api from '../api';

export default function PatientPrescriptionViewerModal({ isOpen, onClose, prescription }) {
  const printRef = useRef(null);
  const [patientDetails, setPatientDetails] = useState(null);

  useEffect(() => {
    if (!isOpen || !prescription?.patientId) return;
    async function fetchPatientDetails() {
      try {
        const res = await api.get(`/patient/details/${prescription.patientId}`).catch(() => null);
        if (res?.data) {
          setPatientDetails(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch patient details for prescription viewer', err);
      }
    }
    fetchPatientDetails();
  }, [isOpen, prescription]);

  if (!isOpen || !prescription) return null;

  const auth = JSON.parse(localStorage.getItem('panchakarma-auth') || '{}');
  const doctorDisplayName = prescription.doctorName || prescription.therapistName || (auth?.fullName ? (auth.fullName.toLowerCase().startsWith('dr.') ? auth.fullName : `Dr. ${auth.fullName}, BAMS`) : 'Attending Practitioner');
  const doctorSignName = doctorDisplayName.split(',')[0] || doctorDisplayName;

  const patientName = patientDetails?.fullName || prescription.patientName || auth?.fullName || 'Patient';
  const ageGenderStr = (patientDetails?.age || patientDetails?.gender)
    ? `${patientDetails.age ? `${patientDetails.age} Yrs` : ''}${patientDetails.age && patientDetails.gender ? ' / ' : ''}${patientDetails.gender || ''}`
    : 'Not Specified';
  const isAssessed = Boolean(patientDetails?.doshaAssessmentCompleted && patientDetails?.dominantDosha);
  const dominantDosha = isAssessed ? String(patientDetails.dominantDosha).replace(/_/g, '-') : 'Not Assessed Yet';

  const dateStr = prescription.createdAt
    ? new Date(prescription.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : (prescription.date ? new Date(prescription.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));

  const followUpStr = prescription.followUpDate
    ? new Date(prescription.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const medicines = Array.isArray(prescription.medicines) && prescription.medicines.length > 0
    ? prescription.medicines
    : (prescription.medicineName ? [{
      medicineName: prescription.medicineName,
      form: prescription.category || 'Formulation',
      dosage: prescription.dosage || '-',
      frequency: prescription.timing || '-',
      duration: prescription.durationDays ? `${prescription.durationDays} Days` : '-',
      instructions: prescription.practitionerNote || '-',
    }] : []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generatePrescriptionPDF({
      id: prescription.id || prescription.bookingId || 'N/A',
      patientName: patientName,
      therapistName: doctorDisplayName,
      purpose: prescription.therapyName || prescription.purpose || 'Panchakarma Consultation',
      date: dateStr,
      sessionNotes: prescription.clinicalDiagnosis || prescription.sessionNotes || '',
      patientAdvice: `${prescription.dietAdvice || ''}\n${prescription.lifestyleAdvice || ''}\n${prescription.postCareInstructions || ''}`.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/60 p-3 md:p-6 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl flex flex-col justify-between select-none">

        {/* Top Floating Control Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-sand/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-950 font-bold">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h3 className="font-display font-bold text-forest text-base">Official Clinical Prescription</h3>
              <p className="text-[11px] text-forest/60">Read-Only Patient Document • Reg #{prescription.id || prescription.bookingId || 'PK-2026'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 rounded-xl bg-[#1b3d2b] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#122c1e] transition cursor-pointer"
            >
              <Download size={15} /> Download PDF
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-sand/60 bg-white px-3.5 py-2 text-xs font-bold text-forest hover:bg-sand/20 transition cursor-pointer"
            >
              <Printer size={15} /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-forest/40 hover:bg-sand/30 hover:text-forest transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Prescription Sheet Printable Body */}
        <div ref={printRef} className="p-6 md:p-8 space-y-6 bg-white font-body text-forest">

          {/* Clinic & Doctor Header */}
          <div className="border-b-2 border-emerald-900/20 pb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Leaf size={24} className="text-emerald-800" />
                <h1 className="font-display text-xl md:text-2xl font-black text-emerald-950 tracking-tight">
                  Panchakarma Care & Research Centre
                </h1>
              </div>
              <p className="text-xs text-forest/70 font-medium">
                Centre for Authentic Ayurveda Chikitsa, Panchakarma & Rasayana
              </p>
              <p className="text-[11px] text-forest/50">Reg. No: AYUSH-PK-8842/2026 • Certified NABH Center</p>
            </div>

            <div className="text-left md:text-right space-y-0.5 border-l-2 md:border-l-0 md:border-r-2 border-emerald-800/30 pl-3 md:pl-0 md:pr-3 text-xs">
              <h2 className="font-display font-bold text-forest text-sm">{doctorDisplayName}</h2>
              <p className="text-forest/70 font-medium">Senior Panchakarma Specialist</p>
              <p className="text-[11px] font-bold text-emerald-900">Date: {dateStr}</p>
            </div>
          </div>

          {/* Patient Details Strip */}
          <div className="rounded-2xl border border-sand/50 bg-[#faf8f4] p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-forest/60 block font-semibold">Patient Name:</span>
              <span className="font-bold text-forest text-sm">{patientName}</span>
            </div>
            <div>
              <span className="text-forest/60 block font-semibold">Age / Gender:</span>
              <span className="font-bold text-forest">{ageGenderStr}</span>
            </div>
            <div>
              <span className="text-forest/60 block font-semibold">Dominant Prakriti:</span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full inline-block ${dominantDosha === 'Not Assessed Yet'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-emerald-100/80 text-emerald-950'
                }`}>
                {dominantDosha}
              </span>
            </div>
            <div>
              <span className="text-forest/60 block font-semibold">Prescription ID:</span>
              <span className="font-mono font-bold text-forest">#RX-{prescription.id || prescription.bookingId || 'N/A'}</span>
            </div>
          </div>

          {/* Clinical Diagnosis & Prescribed Therapy */}
          <div className={`grid grid-cols-1 ${(prescription.therapyName && prescription.consultationCategory !== 'NORMAL') ? 'md:grid-cols-2' : ''} gap-4 text-xs`}>
            <div className="rounded-2xl border border-sand/40 bg-white p-4 space-y-1.5 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Diagnosis & Symptoms
              </span>
              <p className="font-semibold text-forest text-xs mt-1">
                <strong>Chief Complaint:</strong> {prescription.chiefComplaint || prescription.purpose || prescription.reason || 'Panchakarma Consultation'}
              </p>
              <p className="text-forest/80">
                <strong>Clinical Diagnosis:</strong> {prescription.clinicalDiagnosis || prescription.sessionNotes || 'No specific diagnosis recorded.'}
              </p>
            </div>

            {prescription.therapyName && prescription.consultationCategory !== 'NORMAL' && (
              <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-[#f7fcf4] to-[#edf7e7] p-4 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Prescribed Panchakarma Therapy
                </span>
                <h3 className="font-display font-bold text-forest text-sm mt-1">
                  {prescription.therapyName}
                </h3>
                <p className="text-xs text-forest/80 font-medium">
                  Course: <strong>{prescription.totalSessions ? `${prescription.totalSessions} Sessions` : 'Single Consultation'}</strong>
                  {prescription.frequency ? ` • Frequency: ${prescription.frequency}` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Medicines Table */}
          <div className="space-y-2">
            <h3 className="font-display text-sm font-bold text-forest flex items-center gap-1.5">
              <Stethoscope size={16} className="text-emerald-800" /> Prescribed Herbal Medicines & Dosage
            </h3>

            <div className="rounded-2xl border border-sand/40 overflow-hidden shadow-2xs bg-white">
              {medicines.length === 0 ? (
                <div className="p-6 text-center text-xs text-forest/60 italic font-medium">
                  No medicines prescribed for this consultation.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-sand/25 border-b border-sand/40 font-bold text-forest/80 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3.5">Medicine</th>
                      <th className="py-3 px-3.5">Form</th>
                      <th className="py-3 px-3.5">Dosage</th>
                      <th className="py-3 px-3.5">Frequency</th>
                      <th className="py-3 px-3.5">Duration</th>
                      <th className="py-3 px-3.5">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand/20">
                    {medicines.map((m, idx) => (
                      <tr key={idx} className="hover:bg-sand/10">
                        <td className="py-3 px-3.5 font-bold text-forest">{m.medicineName}</td>
                        <td className="py-3 px-3.5 font-medium text-forest/80">
                          <span className="bg-sand/30 px-2 py-0.5 rounded-md border border-sand/50 text-[11px]">
                            {m.form || 'Tablet'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-emerald-950">{m.dosage || '-'}</td>
                        <td className="py-3 px-3.5 font-medium text-forest">{m.frequency || '-'}</td>
                        <td className="py-3 px-3.5 font-bold text-forest">{m.duration || '-'}</td>
                        <td className="py-3 px-3.5 italic text-forest/75">{m.instructions || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Advice Cards (Diet, Lifestyle, Post-Care) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded-2xl border border-sand/40 bg-sand/10 p-3.5 space-y-1">
              <h4 className="font-bold text-forest text-xs flex items-center gap-1">🥣 Diet Advice (Pathya)</h4>
              <p className="text-forest/75 leading-relaxed font-medium">
                {prescription.dietAdvice || 'No specific diet advice recorded for this session.'}
              </p>
            </div>

            <div className="rounded-2xl border border-sand/40 bg-sand/10 p-3.5 space-y-1">
              <h4 className="font-bold text-forest text-xs flex items-center gap-1">🧘 Lifestyle Advice (Vihara)</h4>
              <p className="text-forest/75 leading-relaxed font-medium">
                {prescription.lifestyleAdvice || 'No specific lifestyle advice recorded for this session.'}
              </p>
            </div>

            <div className="rounded-2xl border border-sand/40 bg-sand/10 p-3.5 space-y-1">
              <h4 className="font-bold text-forest text-xs flex items-center gap-1">⚠️ Post-Care Instructions</h4>
              <p className="text-forest/75 leading-relaxed font-medium">
                {prescription.postCareInstructions || 'No post-care instructions recorded for this session.'}
              </p>
            </div>
          </div>
        </div>

        {/* Follow-up Date Banner */}
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-emerald-800" />
            <span>Recommended Follow-up Visit: <strong>{followUpStr}</strong></span>
          </div>
          <span className="text-[11px] font-extrabold uppercase text-emerald-900 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
            Scheduled Checkup
          </span>
        </div>



      </div>
    </div>

  );
}
