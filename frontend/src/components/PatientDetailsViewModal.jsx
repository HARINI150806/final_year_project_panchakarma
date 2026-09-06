import { useState, useEffect } from 'react';
import { X, User, Heart, Sparkles, AlertCircle, FileText, ClipboardList, ChevronDown, ChevronUp, Activity, Calendar, Leaf, Phone, Mail } from 'lucide-react';
import api from '../api';

const SEVERITY_STYLES = {
  SEVERE: 'bg-rose-100 text-rose-800 border border-rose-200',
  MODERATE: 'bg-amber-100 text-amber-900 border border-amber-200',
  MILD: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
};

function ComplaintCard({ complaint, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const severityClass = SEVERITY_STYLES[(complaint.severity || '').toUpperCase()] || SEVERITY_STYLES.MILD;

  return (
    <div className="rounded-2xl border border-sand/40 bg-white shadow-xs overflow-hidden">
      {/* Complaint Header Row */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-sand/10 transition text-left cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-extrabold">
            #{index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-forest truncate">
              {(complaint.mainComplaint || '').replace(/_/g, ' ')}
              {complaint.otherComplaint && <span className="text-forest/50 font-normal ml-1">— {complaint.otherComplaint}</span>}
            </p>
            <p className="text-[10px] text-forest/50 font-medium mt-0.5">
              {complaint.createdAt
                ? new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${severityClass}`}>
            {complaint.severity || 'MILD'}
          </span>
          {expanded ? <ChevronUp size={14} className="text-forest/40" /> : <ChevronDown size={14} className="text-forest/40" />}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-sand/30">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-forest/50 font-semibold block">Body Area</span>
              <span className="font-bold text-forest">{(complaint.bodyArea || '—').replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-forest/50 font-semibold block">Duration</span>
              <span className="font-bold text-forest">
                {complaint.durationValue} {(complaint.durationUnit || '').toLowerCase()}
              </span>
            </div>
            <div>
              <span className="text-forest/50 font-semibold block">Frequency</span>
              <span className="font-bold text-forest">{(complaint.frequency || '—').replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-forest/50 font-semibold block">Pain Level</span>
              <span className="font-bold text-forest">
                {complaint.painLevel != null ? `${complaint.painLevel}/10` : '—'}
              </span>
            </div>
            <div>
              <span className="text-forest/50 font-semibold block">Status</span>
              <span className="inline-block bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase">
                {complaint.status || 'SUBMITTED'}
              </span>
            </div>
          </div>

          {/* Symptoms */}
          {complaint.symptoms && complaint.symptoms.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50 block mb-1.5">Symptoms</span>
              <div className="flex flex-wrap gap-1.5">
                {complaint.symptoms.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-[10px] font-bold">
                    {(s.symptomName || '').replace(/_/g, ' ')}
                    {s.otherSymptomDetails && ` — ${s.otherSymptomDetails}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Details */}
          {complaint.additionalDetails && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50 block mb-1">Additional Notes</span>
              <p className="text-xs text-forest/70 bg-sand/20 rounded-xl p-2.5 border border-sand/40 italic">
                "{complaint.additionalDetails}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PatientDetailsViewModal({ isOpen, onClose, patientData, onOpenPrescriptionForm }) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('ALL');
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !patientData) return;

    async function fetchAll() {
      setLoading(true);
      let loadedDetails = null;
      const targetId = patientData.patientId || patientData.id || patientData.userId;
      try {
        if (targetId) {
          const res = await api.get(`/patient/details/${targetId}`).catch(() => null);
          loadedDetails = res?.data;
        }
        setDetails(loadedDetails || patientData);
      } catch {
        setDetails(patientData);
      } finally {
        setLoading(false);
      }

      // Fetch complaints, assigned sessions & medical documents dynamically
      const idToFetch = targetId || loadedDetails?.targetUserId || loadedDetails?.id;
      if (idToFetch) {
        setComplaintsLoading(true);
        api.get(`/therapist/patients/${idToFetch}/complaints`)
          .then(r => setComplaints(r.data || []))
          .catch(() => setComplaints([]))
          .finally(() => setComplaintsLoading(false));

        setSessionsLoading(true);
        api.get(`/therapists/patients/${idToFetch}/therapies`)
          .then(r => setSessions(r.data || []))
          .catch(() => setSessions([]))
          .finally(() => setSessionsLoading(false));

        setDocumentsLoading(true);
        api.get(`/medical-documents/patient/${idToFetch}`)
          .then(r => setDocuments(r.data || []))
          .catch(() => setDocuments([]))
          .finally(() => setDocumentsLoading(false));
      }
    }

    fetchAll();
  }, [isOpen, patientData]);

  if (!isOpen || !patientData) return null;

  const patientName = details?.fullName || patientData.patientFullName || patientData.patientName || details?.name || 'Patient Profile';
  const isDoshaAssessed = details ? details.doshaAssessmentCompleted : (patientData.doshaAssessmentCompleted || patientData.patientDoshaAssessed);
  const dominantDosha = isDoshaAssessed ? (details?.dominantDosha || patientData.patientDominantDosha || patientData.dominantDosha) : null;

  function getInitials(name) {
    if (!name) return 'P';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function formatDate(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const activeSessionsList = sessions;
  const completedCount = activeSessionsList.filter(b => (b.status || '').toUpperCase() === 'COMPLETED').length;
  const totalCount = activeSessionsList.length;
  const remainingCount = Math.max(totalCount - completedCount, 0);
  const progressPercent = totalCount > 0 ? Math.min(Math.round((completedCount / totalCount) * 100), 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-300" onClick={onClose} />

      {/* Slide-over Drawer (420px width) */}
      <div className="relative z-10 h-full w-full sm:w-[420px] bg-[#FAFCF8] shadow-2xl border-l border-emerald-900/10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">

        {/* 1. PATIENT HEADER */}
        <div className="bg-gradient-to-br from-[#1F4D3A] via-[#2A5C47] to-[#16382B] text-white p-5 relative shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-emerald-100/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
            title="Close Panel"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="h-14 w-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-extrabold text-xl shadow-inner shrink-0">
              {getInitials(patientName)}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold text-white leading-tight truncate">
                {patientName}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Patient
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SCROLLABLE BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">

          {/* GOOGLE MEET LINK FOR THERAPIST */}
          {(patientData?.meetLink || details?.meetLink || patientData?.consultationType === 'ONLINE') && (
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                  📹 Google Meet Video Consultation
                </span>
                <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full border border-blue-200">
                  Therapist Link
                </span>
              </div>
              <p className="text-xs text-blue-900/80 leading-relaxed">
                Click below to open and join the live online consultation session with {patientName}.
              </p>
              <a
                href={patientData?.meetLink || details?.meetLink || 'https://meet.google.com/new'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
              >
                📹 Join Google Meet Consultation Call →
              </a>
            </div>
          )}

          {/* 2. QUICK PATIENT INFO */}
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm space-y-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900/50 flex items-center gap-1.5">
              <User size={13} className="text-[#1F4D3A]" /> Patient Information
            </p>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-[#F7FAF4] rounded-xl p-2.5 border border-emerald-900/5">
                <span className="text-gray-400 font-semibold block text-[10px] uppercase">📞 Phone</span>
                <span className="font-bold text-[#1F4D3A] mt-0.5 block truncate">
                  {details?.phone || details?.contactNumber || patientData?.patientPhone || patientData?.phone || 'Not provided'}
                </span>
              </div>

              <div className="bg-[#F7FAF4] rounded-xl p-2.5 border border-emerald-900/5">
                <span className="text-gray-400 font-semibold block text-[10px] uppercase">✉ Email</span>
                <span className="font-bold text-[#1F4D3A] mt-0.5 block truncate" title={details?.email || patientData?.patientEmail}>
                  {details?.email || patientData?.patientEmail || patientData?.email || 'Not provided'}
                </span>
              </div>

              <div className="bg-[#F7FAF4] rounded-xl p-2.5 border border-emerald-900/5">
                <span className="text-gray-400 font-semibold block text-[10px] uppercase">👤 Gender</span>
                <span className="font-bold text-[#1F4D3A] mt-0.5 block">
                  {details?.gender || patientData?.gender || 'Not specified'}
                </span>
              </div>

              <div className="bg-[#F7FAF4] rounded-xl p-2.5 border border-emerald-900/5">
                <span className="text-gray-400 font-semibold block text-[10px] uppercase">🎂 Age</span>
                <span className="font-bold text-[#1F4D3A] mt-0.5 block">
                  {details?.age ? `${details.age} years` : patientData?.age ? `${patientData.age} years` : 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. DOSHA PROFILE CARD */}
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-[#FFF9F2] to-[#FDF3E7] p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900/70 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-700" /> Ayurvedic Profile
              </p>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 text-amber-900 border border-amber-200">
                Prakriti
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{dominantDosha && dominantDosha !== '—' ? '🔥' : '🌿'}</span>
                <div>
                  <h3 className="font-display text-lg font-bold text-amber-950">
                    {dominantDosha && dominantDosha !== '—' ? String(dominantDosha).replace(/_/g, ' ') : 'Not Assessed Yet'}
                  </h3>
                  <p className="text-xs text-amber-800/80 font-medium">
                    {dominantDosha && dominantDosha !== '—' ? 'Assessment Completed' : 'Dosha assessment pending'}
                  </p>
                </div>
              </div>
              {dominantDosha && dominantDosha !== '—' && (
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1 hover:underline cursor-pointer">
                  View Assessment →
                </span>
              )}
            </div>
          </div>

          {/* 4. CURRENT TREATMENT & PROGRESS */}
          <div className="rounded-2xl border border-emerald-900/10 bg-[#F7FAF4] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900/60 flex items-center gap-1.5">
                <Activity size={13} className="text-[#1F4D3A]" /> Current Treatment
              </p>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                In Progress
              </span>
            </div>

            <div>
              <h4 className="font-display text-base font-bold text-[#193322]">
                Panchakarma Detox Program
              </h4>
              
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#1F4D3A]">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-emerald-100/80 overflow-hidden">
                  <div
                    className="h-full bg-[#1F4D3A] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-900/10 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white rounded-xl p-2 border border-emerald-900/5">
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Completed</span>
                <span className="font-bold text-[#1F4D3A] text-xs">
                  {completedCount} / {totalCount} Sessions
                </span>
              </div>
              <div className="bg-white rounded-xl p-2 border border-emerald-900/5">
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Remaining</span>
                <span className="font-bold text-amber-900 text-xs">
                  {remainingCount} Sessions
                </span>
              </div>
            </div>
          </div>

          {/* 5. SESSION HISTORY (SHOW LATEST 3 RECENT SESSIONS ONLY) */}
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Calendar size={13} className="text-[#1F4D3A]" /> Session History
              </p>
              <button
                type="button"
                onClick={() => { setHistoryFilter('ALL'); setHistoryModalOpen(true); }}
                className="text-[11px] font-bold text-[#1F4D3A] hover:underline cursor-pointer"
              >
                View All ({activeSessionsList.length})
              </button>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1.5">
              Recent Sessions
            </p>

            <div className="relative pl-5 border-l-2 border-emerald-100 space-y-3 text-xs py-1">
              {activeSessionsList.slice(0, 3).map((b, i) => {
                const st = (b.status || 'SCHEDULED').toUpperCase();
                const isCompleted = st === 'COMPLETED';
                const isCancelled = st === 'CANCELLED';

                const dotColor = isCompleted ? 'bg-emerald-600 ring-emerald-100' :
                                 isCancelled ? 'bg-rose-500 ring-rose-100' :
                                 'bg-sky-500 ring-sky-100';

                return (
                  <div key={b.bookingId || i} className="relative text-xs">
                    <span className={`absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-white ring-2 ${dotColor}`} />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-[#1F4D3A]">
                          {b.therapyName}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {formatDate(b.bookingDate)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isCancelled ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}>
                        {isCompleted ? 'Completed' : isCancelled ? 'Cancelled' : 'Scheduled'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => { setHistoryFilter('ALL'); setHistoryModalOpen(true); }}
              className="w-full mt-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 py-2.5 px-3 text-xs font-bold text-[#1F4D3A] transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View All {activeSessionsList.length} Sessions →</span>
            </button>
          </div>

          {/* 6. UPLOADED MEDICAL DOCUMENTS SECTION */}
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#1F4D3A] flex items-center gap-1.5">
                <FileText size={14} className="text-[#1F4D3A]" /> Patient Medical Records ({documents.length})
              </p>
              <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Therapist Accessible
              </span>
            </div>

            {documentsLoading ? (
              <p className="text-xs text-gray-400 py-2 italic">Loading patient documents...</p>
            ) : documents.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">No uploaded medical documents found for this patient.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.documentId || doc.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-900/10 bg-[#fbfdf9] hover:bg-emerald-50/50 transition text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-[#1F4D3A] truncate">{doc.documentName}</p>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-emerald-700">{doc.documentType || 'Medical Report'}</span>
                        <span>•</span>
                        <span>{doc.uploadedDate ? new Date(doc.uploadedDate).toLocaleDateString() : 'Recent'}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`http://localhost:8080/api/medical-documents/${doc.documentId || doc.id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-900 transition"
                      >
                        👁️ View
                      </a>
                      <a
                        href={`http://localhost:8080/api/medical-documents/${doc.documentId || doc.id}/download`}
                        download
                        className="rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#1F4D3A] transition"
                      >
                        ⬇️ Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. HEALTH COMPLAINTS SECTION */}
          {complaints.length > 0 && (
            <div className="rounded-2xl border border-rose-200/60 bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <ClipboardList size={13} className="text-rose-600" /> Reported Complaints ({complaints.length})
                </p>
              </div>
              <div className="space-y-2">
                {complaints.map((c, i) => (
                  <ComplaintCard key={c.id || i} complaint={c} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 7. STICKY QUICK ACTIONS FOOTER */}
        <div className="p-4 border-t border-emerald-900/10 bg-white/95 backdrop-blur-md shrink-0 space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenPrescriptionForm) {
                onOpenPrescriptionForm(patientData);
              }
            }}
            className="w-full bg-[#1F4D3A] text-white hover:bg-[#183d2e] shadow-sm rounded-xl py-2.5 px-4 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText size={14} /> Create Prescription
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-xl py-2 px-3 text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>📝</span> Add Treatment Note
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-xl py-2 px-3 text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>📅</span> Schedule Session
            </button>
          </div>
        </div>

      </div>

      {/* 8. COMPLETE PATIENT TREATMENT HISTORY MODAL */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-emerald-900/10 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1F4D3A] to-[#2A5C47] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base border border-white/30">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Patient Treatment History</h3>
                  <p className="text-xs text-emerald-200/90">{patientName} • Total {activeSessionsList.length} Sessions</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 bg-[#F7FAF4] border-b border-emerald-900/10 shrink-0 flex items-center gap-2 overflow-x-auto">
              {['ALL', 'COMPLETED', 'UPCOMING', 'CANCELLED'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setHistoryFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    historyFilter === f
                      ? 'bg-[#1F4D3A] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f === 'ALL' ? `All (${activeSessionsList.length})` :
                   f === 'COMPLETED' ? `Completed (${activeSessionsList.filter(b => b.status === 'COMPLETED').length})` :
                   f === 'UPCOMING' ? `Upcoming (${activeSessionsList.filter(b => b.status === 'SCHEDULED').length})` :
                   `Cancelled (${activeSessionsList.filter(b => b.status === 'CANCELLED').length})`}
                </button>
              ))}
            </div>

            {/* Sessions List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {activeSessionsList
                .filter((b) => {
                  const st = (b.status || 'SCHEDULED').toUpperCase();
                  if (historyFilter === 'COMPLETED') return st === 'COMPLETED';
                  if (historyFilter === 'UPCOMING') return ['SCHEDULED', 'CONFIRMED', 'PENDING'].includes(st);
                  if (historyFilter === 'CANCELLED') return st === 'CANCELLED';
                  return true;
                })
                .map((b, i) => {
                  const st = (b.status || 'SCHEDULED').toUpperCase();
                  const isCompleted = st === 'COMPLETED';
                  const isCancelled = st === 'CANCELLED';

                  const statusBadge = isCompleted ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                      isCancelled ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                      'bg-sky-50 text-sky-800 border-sky-200';

                  return (
                    <div key={b.bookingId || i} className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-2xs hover:border-emerald-300 transition space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#1F4D3A] text-sm">
                              {b.therapyName}
                            </h4>
                            {!( (b.type || b.bookingType || '').toUpperCase() === 'CONSULTATION' ) && (
                              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                Session {b.sessionNumber || (activeSessionsList.length - i)}/{b.totalSessions || activeSessionsList.length}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#2e7d5a]" />
                            {formatDate(b.bookingDate)}
                          </p>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${statusBadge}`}>
                          {isCompleted ? '✓ Completed' : isCancelled ? '✕ Cancelled' : '● Scheduled'}
                        </span>
                      </div>

                      {b.sessionNotes && (
                        <p className="text-xs text-gray-600 bg-[#F7FAF4] p-2.5 rounded-xl border border-emerald-900/5 italic">
                          💡 Clinical Notes: &ldquo;{b.sessionNotes}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-emerald-900/10 bg-[#F7FAF4] shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#1F4D3A] text-white text-xs font-bold shadow-sm hover:bg-[#183d2e] transition cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
