import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Download,
  Sparkles,
  Activity,
  ChevronRight,
  X,
  ShieldCheck,
  Leaf,
  PlusCircle,
  HeartPulse,
} from 'lucide-react';
import api from '../api';
import { generatePrescriptionPDF } from '../utils/pdfExport';

export default function PatientTreatmentHistory({ auth }) {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedSessionModal, setSelectedSessionModal] = useState(null);

  useEffect(() => {
    async function loadTreatmentHistory() {
      setLoading(true);
      try {
        // Fetch real patient bookings directly from the bookings table API
        const bookingsRes = await api.get('/patient/bookings').catch(() => ({ data: [] }));
        const bookingsData = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];

        let combined = [];

        // Helper to extract clean practitioner name
        const resolvePractitioner = (b) => {
          let name = b.assignedTo?.fullName || b.assignedTo?.name || b.therapistName || b.assignedToName || b.doctorName;
          if (!name || name === 'Ayurvedic Specialist' || name === 'null' || name === 'nil') {
            name = 'Assigned Practitioner';
          } else if (!name.toLowerCase().startsWith('dr.') && !name.toLowerCase().startsWith('therapist') && !name.toLowerCase().startsWith('vaidya')) {
            name = `Dr. ${name}`;
          }
          return name;
        };

        // Helper to resolve specific therapy name from booking object fields
        const resolveTherapyName = (item) => {
          if (!item) return 'Panchakarma Session';
          
          if (item.therapyName && item.therapyName !== 'nil' && item.therapyName !== 'null' && item.therapyName.trim() !== '') {
            return item.therapyName;
          }
          if (item.purpose && item.purpose !== 'nil' && item.purpose !== 'null' && item.purpose.trim() !== '') {
            return item.purpose;
          }
          if (item.notes && item.notes !== 'nil' && item.notes !== 'null' && item.notes.trim() !== '') {
            return item.notes;
          }
          if (item.packageId && item.packageId !== 'nil' && item.packageId !== 'null' && item.packageId.trim() !== '') {
            return item.packageId.replace(/_/g, ' ');
          }
          if (item.consultationCategory && item.consultationCategory !== 'NORMAL') {
            return `${item.consultationCategory.replace(/_/g, ' ')} Consultation`;
          }
          
          const bookingType = item.type || item.bookingType;
          if (bookingType === 'THERAPY') {
            return 'Panchakarma Therapy Session';
          } else if (bookingType === 'CONSULTATION') {
            return 'Ayurvedic Doctor Consultation';
          } else if (bookingType) {
            return bookingType.replace(/_/g, ' ');
          }
          
          return 'Panchakarma Session';
        };

        // Map records exclusively from the bookings table
        bookingsData.forEach((b, idx) => {
          const rawTherapy = resolveTherapyName(b);
          const practitionerName = resolvePractitioner(b);
          
          let displayNotes = '';
          if (b.sessionNotes && b.sessionNotes !== 'nil' && b.sessionNotes !== 'null' && b.sessionNotes.trim() !== '') {
            displayNotes = b.sessionNotes;
          } else if (b.notes && b.notes !== rawTherapy && b.notes !== 'nil' && b.notes !== 'null' && b.notes.trim() !== '') {
            displayNotes = b.notes;
          }

          combined.push({
            id: `BK-${b.id || idx + 1}`,
            rawId: b.id,
            therapyName: rawTherapy,
            category: (b.type || b.bookingType || 'THERAPY').toUpperCase(),
            date: b.date || '',
            time: b.time || '',
            practitioner: practitionerName,
            practitionerRole: b.assignedTo?.role || b.practitionerRole || '',
            status: (b.status || b.bookingStatus || 'CONFIRMED').toUpperCase(),
            notes: displayNotes,
            patientAdvice: b.patientAdvice || '',
            medicines: b.medicines || [],
            meetLink: b.meetLink,
          });
        });

        // Sort descending by date (most recent first)
        combined.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date) - new Date(a.date);
        });

        setHistoryList(combined);
      } catch (err) {
        console.error('Error loading patient treatment history:', err);
        setHistoryList([]);
      } finally {
        setLoading(false);
      }
    }

    loadTreatmentHistory();
  }, [auth]);

  const [recordCategory, setRecordCategory] = useState('ALL');

  // Helper to identify consultations vs therapies
  const isConsultationItem = (item) => {
    const cat = (item.category || '').toUpperCase();
    const name = (item.therapyName || '').toLowerCase();
    const notes = (item.notes || '').toLowerCase();
    return (
      cat === 'CONSULTATION' ||
      name.includes('consultation') ||
      name.includes('dosha') ||
      notes.includes('consultation') ||
      Boolean(item.meetLink)
    );
  };

  const consultationCount = historyList.filter(isConsultationItem).length;
  const therapyCount = historyList.filter(h => !isConsultationItem(h)).length;

  // Dynamic Statistics
  const completedCount = historyList.filter((h) => h.status === 'COMPLETED' || h.status === 'CONFIRMED').length;
  const activeCount = historyList.filter((h) => h.status === 'ACTIVE' || h.status === 'IN_PROGRESS' || h.status === 'PLANNED').length;
  const scheduledCount = historyList.filter((h) => h.status === 'SCHEDULED' || h.status === 'PENDING').length;
  const totalCount = historyList.length;

  // Filtered List
  const filteredHistory = historyList.filter((item) => {
    const isConsultation = isConsultationItem(item);

    const matchesSearch =
      item.therapyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.practitioner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedStatusFilter === 'ALL') return true;
    if (selectedStatusFilter === 'COMPLETED') return item.status === 'COMPLETED' || item.status === 'CONFIRMED';
    if (selectedStatusFilter === 'CONSULTATIONS') return isConsultation;
    if (selectedStatusFilter === 'THERAPIES') return !isConsultation;
    if (selectedStatusFilter === 'ACTIVE') return item.status === 'ACTIVE' || item.status === 'IN_PROGRESS' || item.status === 'PLANNED';
    if (selectedStatusFilter === 'SCHEDULED') return item.status === 'SCHEDULED' || item.status === 'PENDING';
    return true;
  });

  const handleDownloadPDF = (session) => {
    generatePrescriptionPDF({
      id: session.id,
      patientName: auth?.fullName || 'Valued Patient',
      therapistName: session.practitioner,
      purpose: session.therapyName,
      date: session.date || new Date().toLocaleDateString('en-IN'),
      sessionNotes: session.notes,
      patientAdvice: session.patientAdvice,
    });
  };

  return (
    <div className="space-y-8 w-full min-w-0">
      {/* Header Banner */}
      <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-6 md:p-8 shadow-sm backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="ambient-orb right-[-2rem] top-[-2rem] h-44 w-44 bg-emerald-200/40 blur-3xl" />
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3.5 py-1 text-xs font-bold text-emerald-900 uppercase tracking-wider">
            <Stethoscope size={15} /> Dynamic Clinical Records
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-forest">
            My Panchakarma Treatment History
          </h2>
          <p className="text-sm text-forest/70 max-w-2xl leading-relaxed">
            Real-time record of your Panchakarma sessions, active treatment plans, doctor notes, and post-care guidelines.
          </p>
        </div>

        <div className="relative z-10 shrink-0 flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-900 text-white p-4 shadow-sm text-center min-w-[130px]">
            <p className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">Recorded Items</p>
            <p className="text-2xl font-black">{totalCount}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Completed Sessions</p>
          <h3 className="text-2xl font-black text-emerald-950 mt-1">{completedCount}</h3>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
            <CheckCircle2 size={13} /> Verified by Center
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Active / Planned</p>
          <h3 className="text-2xl font-black text-amber-900 mt-1">{activeCount}</h3>
          <p className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
            <Activity size={13} /> Current Phase
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Scheduled Sessions</p>
          <h3 className="text-2xl font-black text-teal-900 mt-1">{scheduledCount}</h3>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
            <Calendar size={13} /> Upcoming
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Dosha Blueprint</p>
          <h3 className="text-xl font-black text-emerald-900 mt-1 uppercase truncate">{auth?.dominantDosha ? String(auth.dominantDosha).replace(/_/g, '-') : 'Not Assessed'}</h3>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
            <Sparkles size={13} /> Live Profile
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-4 shadow-sm backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All History' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CONSULTATIONS', label: '🩺 Doctor Consultations' },
            { id: 'THERAPIES', label: '🌿 Panchakarma Therapies' },
            { id: 'ACTIVE', label: 'Active / In Progress' },
            { id: 'SCHEDULED', label: 'Scheduled' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
                selectedStatusFilter === tab.id
                  ? 'bg-[#1b3d2b] text-white shadow-xs'
                  : 'bg-sand/20 text-forest/70 hover:bg-sand/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest/40" />
          <input
            type="text"
            placeholder="Search therapy or practitioner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-sand/70 pl-10 pr-4 py-2 text-xs text-forest bg-[#faf8f4] outline-none focus:border-sage focus:ring-2 focus:ring-sage/10"
          />
        </div>
      </div>

      {/* Dynamic Treatment History List & Table */}
      <div className="bg-white/95 border border-sand/40 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-forest/60 text-sm">
            <HeartPulse size={28} className="mx-auto mb-2 text-emerald-700 animate-bounce" />
            Loading your clinical treatment history from server...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-16 text-center space-y-4 px-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Stethoscope size={28} />
            </div>
            <h3 className="font-display text-lg font-bold text-forest">No Treatment Records Found</h3>
            <p className="text-xs text-forest/65 max-w-md mx-auto leading-relaxed">
              {historyList.length === 0
                ? "You haven't completed or booked any Panchakarma therapy sessions yet. Book a session or log a complaint to get started."
                : "No treatment records match your search or filter criteria."}
            </p>
            {historyList.length === 0 && (
              <button
                type="button"
                onClick={() => navigate('/book-session')}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#1b3d2b] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#122c1e] transition cursor-pointer mt-1"
              >
                <PlusCircle size={15} /> Book First Session
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-sand/40 bg-sand/10 text-[11px] font-bold text-forest/70 uppercase tracking-wider">
                  <th className="py-4 px-5">Date &amp; Time</th>
                  <th className="py-4 px-5">Therapy / Record</th>
                  <th className="py-4 px-5">Practitioner</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/20">
                {filteredHistory.map((item) => {
                  const dateStr = item.date
                    ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Scheduled';

                  const isCompleted = item.status === 'COMPLETED' || item.status === 'CONFIRMED';
                  const isActive = item.status === 'ACTIVE' || item.status === 'IN_PROGRESS' || item.status === 'PLANNED';

                  return (
                    <tr key={item.id} className="hover:bg-sand/10 transition group">
                      {/* Date & Time */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-forest text-xs flex items-center gap-1.5">
                          <Calendar size={13} className="text-emerald-800" />
                          {dateStr}
                        </div>
                        {item.time && (
                          <span className="text-[11px] text-forest/60 flex items-center gap-1 mt-0.5">
                            <Clock size={11} /> {item.time}
                          </span>
                        )}
                      </td>

                      {/* Therapy Name & Notes */}
                      <td className="py-4 px-5 max-w-[280px]">
                        <p className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                          🌿 {item.therapyName}
                        </p>
                        {item.notes && item.notes.trim() !== '' && (
                          <p className="text-[11px] text-forest/65 line-clamp-1 mt-0.5 font-medium">
                            {item.notes}
                          </p>
                        )}
                      </td>

                      {/* Practitioner */}
                      <td className="py-4 px-5">
                        <p className="font-bold text-forest flex items-center gap-1.5">
                          <User size={13} className="text-emerald-800 shrink-0" />
                          {item.practitioner}
                        </p>
                        <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block mt-0.5">
                          {item.practitionerRole
                            ? item.practitionerRole.replace(/_/g, ' ')
                            : item.category === 'PRESCRIPTION'
                            ? 'Prescribing Physician'
                            : item.category === 'CONSULTATION'
                            ? 'Consulting Vaidya'
                            : 'Ayurvedic Practitioner'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : isActive
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                              : 'bg-teal-100 text-teal-900 border border-teal-200'
                          }`}
                        >
                          {isCompleted && <CheckCircle2 size={11} />}
                          {isActive && <Activity size={11} />}
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSessionModal(item)}
                            className="inline-flex items-center gap-1 rounded-xl bg-sand/30 hover:bg-sand/60 px-3 py-1.5 text-xs font-bold text-forest transition cursor-pointer"
                          >
                            Details <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(item)}
                            title="Download Clinical Summary PDF"
                            className="p-1.5 rounded-xl bg-[#1b3d2b] text-white hover:bg-[#122c1e] transition cursor-pointer shadow-xs"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {selectedSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[2rem] border border-white/60 p-6 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-sand/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-forest text-base">Session Record Details</h3>
                  <p className="text-xs text-forest/60">ID: {selectedSessionModal.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSessionModal(null)}
                className="rounded-lg p-1.5 hover:bg-sand/20 text-forest/40 hover:text-forest transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Session Info Card */}
            <div className="rounded-2xl bg-[#f7fbf4] border border-emerald-200 p-4 space-y-3 text-xs text-forest">
              <div className="flex justify-between items-center border-b border-sand/30 pb-2">
                <span className="font-bold text-emerald-950 text-sm">🌿 {selectedSessionModal.therapyName}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[10px]">
                  {selectedSessionModal.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <p className="text-forest/60 font-semibold">Date &amp; Time:</p>
                  <p className="font-bold text-forest">
                    {selectedSessionModal.date ? selectedSessionModal.date : 'Scheduled'}{' '}
                    {selectedSessionModal.time ? `at ${selectedSessionModal.time}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-forest/60 font-semibold">Attending Practitioner:</p>
                  <p className="font-bold text-forest">{selectedSessionModal.practitioner}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-sand/30 space-y-1">
                <p className="font-bold text-forest/80">Doctor Session Notes:</p>
                <p className="text-forest/90 leading-relaxed italic">{selectedSessionModal.notes}</p>
              </div>

              {selectedSessionModal.patientAdvice && (
                <div className="pt-2 border-t border-sand/30 space-y-1">
                  <p className="font-bold text-amber-900 flex items-center gap-1">
                    <Leaf size={14} className="text-amber-700" /> Post-Care &amp; Diet Guidelines:
                  </p>
                  <p className="text-amber-950 font-medium">{selectedSessionModal.patientAdvice}</p>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSessionModal(null)}
                className="flex-1 rounded-xl border border-sand bg-white py-2.5 text-xs font-bold text-forest/70 hover:bg-sand/10 transition cursor-pointer"
              >
                Close Record
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadPDF(selectedSessionModal);
                  setSelectedSessionModal(null);
                }}
                className="flex-1 rounded-xl bg-[#1b3d2b] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#122c1e] transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download size={14} /> Download Summary (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

