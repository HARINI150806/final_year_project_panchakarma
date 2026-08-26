import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import {
  Calendar,
  Clock,
  User,
  Tag,
  Info,
  AlertTriangle,
  CheckSquare,
  Sparkles,
  X,
  FileText,
  Filter,
  ChevronDown,
  Flower2,
  Leaf,
  XCircle,
  ClipboardList,
  CalendarClock,
} from 'lucide-react';
import { generatePrescriptionPDF } from '../utils/pdfExport';

const therapyGuidelines = {
  shirodhara: [
    'Wash your hair prior to the session (as you cannot wash it for a few hours post-treatment).',
    'Wear loose, comfortable clothing.',
    'Avoid heavy meals 2 hours before the treatment.',
    'Post-treatment: Keep your head covered and avoid direct wind or AC for 2 hours.',
  ],
  abhyanga: [
    'Take a warm shower before coming to open up body pores.',
    'Wear old clothes as herbal oil may stain.',
    'Do not eat a heavy meal within 2 hours of the massage.',
    'Post-treatment: Drink warm water and rest for 30 minutes before taking a warm bath.',
  ],
  basti: [
    'Ensure you have empty bowels before the treatment.',
    'Fast or eat only a light meal 3 hours prior to the procedure.',
    'Wear comfortable, loose clothing.',
    'Post-treatment: Avoid strenuous activity, cold baths, and exposure to cold wind.',
  ],
  nasya: [
    'Gargle with warm water before the session.',
    'Do not eat, drink, or brush your teeth 1 hour before the treatment.',
    'Avoid exposure to cold weather immediately after the nasal drops.',
    'Post-treatment: Spit out all secretions and gargle with warm saline water.',
  ],
  udvartana: [
    'Avoid shaving or waxing body hair for 48 hours prior to the herbal powder scrub.',
    'Keep well-hydrated before the session.',
    'Do not eat a heavy meal for 2 hours before the treatment.',
  ],
  vamana: [
    'Strictly fast from the previous night or as instructed by your physician.',
    'Get a good night’s rest before the procedure.',
    'Post-treatment: Rest in a warm, quiet room and strictly follow the diet regimen (Samsarjana Krama).',
  ],
  virechana: [
    'Eat a light, easily digestible dinner the night before (like Kitchari).',
    'Ensure you are fasting or have had only warm water in the morning.',
    'Post-treatment: Keep warm, rest, and resume eating gradually with light warm rice water.',
  ],
};

const getGuidelines = (purpose) => {
  if (!purpose) return null;
  const lower = purpose.toLowerCase();
  for (const [key, rules] of Object.entries(therapyGuidelines)) {
    if (lower.includes(key)) {
      return { therapyName: key.toUpperCase(), rules };
    }
  }
  return null;
};

const canModifyBooking = (bookingDate, bookingTime) => {
  try {
    if (!bookingDate || !bookingTime) return false;
    const [year, month, day] = bookingDate.split('-');
    const [hour, minute] = bookingTime.split(':');
    const bookingDateTime = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
    return bookingDateTime.getTime() - now.getTime() >= twoDaysInMs;
  } catch (e) {
    return false;
  }
};

const PatientBookings = ({ categoryFilter: propCategory }) => {
  const [searchParams] = useSearchParams();
  const targetBookingId = searchParams.get('bookingId');
  const [highlightedId, setHighlightedId] = useState(null);

  const [activeCategory, setActiveCategory] = useState(propCategory || 'ALL');

  useEffect(() => {
    if (propCategory) {
      setActiveCategory(propCategory);
    }
  }, [propCategory]);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Accordion state for pre-therapy guidelines
  const [openGuidelines, setOpenGuidelines] = useState({});

  // Reschedule form state
  const [activeRescheduleId, setActiveRescheduleId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const detailPanelRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('LATEST');
  const pageSize = 6;

  const fetchBookings = async () => {
    try {
      const response = await api.get('/patient/bookings');
      setBookings(response.data || []);
    } catch (err) {
      setError('Failed to fetch bookings. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (bookings.length > 0 && !loading) {
      if (targetBookingId) {
        setHighlightedId(targetBookingId);
        setSelectedBookingId(targetBookingId);
        setStatusFilter('ALL');

        let attempts = 0;
        const tryScroll = () => {
          const el = document.getElementById(`patient-booking-${targetBookingId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (attempts < 20) {
            attempts++;
            setTimeout(tryScroll, 100);
          }
        };
        setTimeout(tryScroll, 100);
      }
    }
  }, [targetBookingId, bookings, loading]);

  const toggleGuidelines = (id) => {
    setOpenGuidelines((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const handleRescheduleSubmit = async (e, bookingId) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/bookings/${bookingId}/reschedule-request`, {
        proposedDate: rescheduleDate,
        proposedTime: rescheduleTime,
        reason: rescheduleReason,
      });
      setActiveRescheduleId(null);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to request reschedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAlternative = async (bookingId, slotNumber) => {
    if (!window.confirm(`Are you sure you want to accept this alternative slot?`)) return;
    try {
      await api.put(`/bookings/${bookingId}/accept-alternative`, { slotNumber });
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to accept alternative slot.');
    }
  };

  const getEffectiveStatus = (b) => {
    if (b.status === 'CANCELLED') return 'CANCELLED';
    if (b.status === 'COMPLETED') return 'COMPLETED';
    try {
      if (b.date) {
        let timeStr = b.time || '00:00';
        if (timeStr.length === 5) timeStr += ':00';
        const [yr, mo, dy] = b.date.split('-').map(Number);
        const [hr, mn] = timeStr.split(':').map(Number);
        if (new Date() >= new Date(yr, mo - 1, dy, hr || 0, mn || 0)) {
          return 'COMPLETED';
        }
      }
    } catch (e) {}
    return b.status || 'CONFIRMED';
  };

  const totalCount = bookings.length;
  const upcomingCount = bookings.filter((b) => {
    const s = getEffectiveStatus(b);
    return s === 'CONFIRMED' || s === 'PENDING';
  }).length;
  const completedCount = bookings.filter((b) => getEffectiveStatus(b) === 'COMPLETED').length;
  const cancelledCount = bookings.filter((b) => getEffectiveStatus(b) === 'CANCELLED').length;

  const filteredBookings = bookings.filter((b) => {
    const s = getEffectiveStatus(b);
    if (statusFilter === 'UPCOMING' && !(s === 'CONFIRMED' || s === 'PENDING')) return false;
    if (statusFilter === 'COMPLETED' && s !== 'COMPLETED') return false;
    if (statusFilter === 'CANCELLED' && s !== 'CANCELLED') return false;

    // Category Filter (Consultations vs Therapies)
    const isConsultation = Boolean(
      b.consultationType === 'ONLINE' ||
      b.consultationType === 'OFFLINE' ||
      (b.purpose || b.therapyName || '').toLowerCase().includes('consultation') ||
      (b.purpose || '').toLowerCase().includes('dosha') ||
      b.meetLink
    );

    if (activeCategory === 'CONSULTATION' && !isConsultation) return false;
    if (activeCategory === 'THERAPY' && isConsultation) return false;

    return true;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const idA = Number(a.id || a.bookingId || 0);
    const idB = Number(b.id || b.bookingId || 0);

    if (sortBy === 'OLDEST') {
      if (idA > 0 && idB > 0 && idA !== idB) return idA - idB;
      const dateA = new Date(`${a.date || '2026-01-01'}T${a.time || '00:00:00'}`);
      const dateB = new Date(`${b.date || '2026-01-01'}T${b.time || '00:00:00'}`);
      return dateA - dateB;
    }

    if (sortBy === 'UPCOMING') {
      const sA = getEffectiveStatus(a);
      const sB = getEffectiveStatus(b);
      const isUpA = sA === 'CONFIRMED' || sA === 'PENDING';
      const isUpB = sB === 'CONFIRMED' || sB === 'PENDING';
      if (isUpA && !isUpB) return -1;
      if (!isUpA && isUpB) return 1;
      if (idA > 0 && idB > 0 && idA !== idB) return idB - idA;
      const dateA = new Date(`${a.date || '2026-01-01'}T${a.time || '00:00:00'}`);
      const dateB = new Date(`${b.date || '2026-01-01'}T${b.time || '00:00:00'}`);
      return dateB - dateA;
    }

    // Default LATEST: Newest booked appointment 1st
    if (idA > 0 && idB > 0 && idA !== idB) return idB - idA;
    const dateA = new Date(`${a.date || '2026-01-01'}T${a.time || '00:00:00'}`);
    const dateB = new Date(`${b.date || '2026-01-01'}T${b.time || '00:00:00'}`);
    return dateB - dateA;
  });

  const totalPages = Math.max(1, Math.ceil(sortedBookings.length / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedBookings = sortedBookings.slice(startIndex, startIndex + pageSize);

  const selectedBooking = selectedBookingId
    ? sortedBookings.find((booking) => String(booking.id || booking.bookingId) === String(selectedBookingId)) || null
    : null;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const selectBooking = (bookingId) => {
    setSelectedBookingId(bookingId);
    setActiveRescheduleId(null);
    requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const closeBookingDetails = () => {
    setSelectedBookingId(null);
    setActiveRescheduleId(null);
  };

  const goToPage = (page) => {
    const nextPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(nextPage);
    setActiveRescheduleId(null);
    setSelectedBookingId(null);
  };

  return (
    <div id="patient-appointments-section" className="motion-fade-in-up relative overflow-hidden rounded-[2.4rem] border border-emerald-900/10 bg-white/72 p-4 md:p-6 shadow-[0_28px_90px_rgba(24,46,34,0.12)] backdrop-blur-xl">
      <div className="ambient-orb left-[-4rem] top-[-3rem] h-56 w-56 bg-[#d8ecd1]" />
      <div className="ambient-orb right-[-4rem] top-16 h-64 w-64 bg-[#f0d9bf]" />
      <div className="noise-grid absolute inset-0 opacity-[0.06]" />

      <div className="relative space-y-6">
        {/* Top Banner */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#1d3a2a_0%,#35613e_54%,#f0f6e9_54%,#fffaf2_100%)] p-6 md:p-8 shadow-[0_18px_48px_rgba(26,43,33,0.12)]">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute bottom-[-2rem] left-[12%] h-40 w-40 rounded-full bg-amber-200/25 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4 text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/40 bg-emerald-950/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-100 backdrop-blur-md">
                <Leaf size={13} /> Panchakarma Care Flow
              </span>
              <div className="space-y-2">
                <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight text-amber-50">
                  My Appointments
                </h1>
                <p className="max-w-xl text-sm md:text-[15px] leading-7 text-emerald-50/88">
                  Manage your therapies, follow up on reschedules, and keep every wellness session aligned with your Ayurvedic healing plan.
                </p>
              </div>
            </div>

            <div className="relative hidden shrink-0 sm:flex items-center justify-center">
              <div className="rounded-[1.75rem] border border-white/60 bg-white/92 p-4 shadow-[0_18px_36px_rgba(23,39,28,0.16)]">
                <div className="flex h-24 w-36 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,#f3f8ec_0%,#e4f0d9_48%,#fbe9cc_100%)] text-5xl select-none">
                  🌿🪷🌿
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Summary Stat Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Appointments */}
        <div className="flex items-center gap-4 rounded-[1.5rem] border border-emerald-900/10 bg-white/85 p-5 shadow-[0_12px_30px_rgba(19,31,24,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(19,31,24,0.12)]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800">
            <ClipboardList size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/50">Total Appointments</p>
            <h3 className="mt-0.5 font-display text-2xl font-bold text-forest">{totalCount}</h3>
            <p className="mt-0.5 text-[11px] font-medium text-forest/55">All time bookings</p>
          </div>
        </div>

        {/* Card 2: Upcoming */}
        <div className="flex items-center gap-4 rounded-[1.5rem] border border-emerald-900/10 bg-white/85 p-5 shadow-[0_12px_30px_rgba(19,31,24,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(19,31,24,0.12)]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-200 text-sky-700">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/50">Upcoming</p>
            <h3 className="mt-0.5 font-display text-2xl font-bold text-forest">{upcomingCount}</h3>
            <p className="mt-0.5 text-[11px] font-medium text-forest/55">Scheduled sessions</p>
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="flex items-center gap-4 rounded-[1.5rem] border border-emerald-900/10 bg-white/85 p-5 shadow-[0_12px_30px_rgba(19,31,24,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(19,31,24,0.12)]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-200 text-violet-700">
            <Flower2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/50">Completed</p>
            <h3 className="mt-0.5 font-display text-2xl font-bold text-forest">{completedCount}</h3>
            <p className="mt-0.5 text-[11px] font-medium text-forest/55">Sessions completed</p>
          </div>
        </div>

        {/* Card 4: Cancelled */}
        <div className="flex items-center gap-4 rounded-[1.5rem] border border-emerald-900/10 bg-white/85 p-5 shadow-[0_12px_30px_rgba(19,31,24,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(19,31,24,0.12)]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 text-orange-700">
            <XCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/50">Cancelled</p>
            <h3 className="mt-0.5 font-display text-2xl font-bold text-forest">{cancelledCount}</h3>
            <p className="mt-0.5 text-[11px] font-medium text-forest/55">
              {cancelledCount === 0 ? 'No cancellations' : 'Cancelled sessions'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Switcher Bar: Doctor Consultations vs Panchakarma Therapies */}
      <div className="rounded-[1.75rem] border border-emerald-900/10 bg-gradient-to-r from-emerald-50/90 to-amber-50/50 p-2.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveCategory('CONSULTATION')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold transition cursor-pointer ${
              activeCategory === 'CONSULTATION'
                ? 'bg-[#1F4D3A] text-white shadow-md'
                : 'bg-white/80 text-forest/70 hover:bg-white hover:text-forest border border-emerald-900/10'
            }`}
          >
            <span>🩺 Doctor Consultations</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('THERAPY')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold transition cursor-pointer ${
              activeCategory === 'THERAPY'
                ? 'bg-[#1F4D3A] text-white shadow-md'
                : 'bg-white/80 text-forest/70 hover:bg-white hover:text-forest border border-emerald-900/10'
            }`}
          >
            <span>🌿 Panchakarma Therapies</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('ALL')}
            className={`flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition cursor-pointer ${
              activeCategory === 'ALL'
                ? 'bg-[#1F4D3A] text-white shadow-md'
                : 'bg-white/80 text-forest/70 hover:bg-white hover:text-forest border border-emerald-900/10'
            }`}
          >
            <span>📋 All Records</span>
          </button>
        </div>

        <div className="text-xs font-bold text-[#1F4D3A] bg-white/90 px-3.5 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
          Showing {filteredBookings.length} {activeCategory === 'CONSULTATION' ? 'Consultations' : activeCategory === 'THERAPY' ? 'Therapy Sessions' : 'Appointments'}
        </div>
      </div>

      {/* Filter Tabs & Sort Controls */}
      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-white/70 bg-white/78 p-4 shadow-[0_14px_34px_rgba(20,35,26,0.08)] lg:flex-row lg:items-center lg:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              statusFilter === 'ALL'
                ? 'bg-gradient-to-r from-[#1d3a2a] to-[#35613e] text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('UPCOMING')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              statusFilter === 'UPCOMING'
                ? 'bg-gradient-to-r from-[#1d3a2a] to-[#35613e] text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            Upcoming & Pending ({upcomingCount})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              statusFilter === 'COMPLETED'
                ? 'bg-gradient-to-r from-[#1d3a2a] to-[#35613e] text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              statusFilter === 'CANCELLED'
                ? 'bg-gradient-to-r from-[#1d3a2a] to-[#35613e] text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>

        {/* Sort & Filter Dropdowns */}
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-2xl border border-emerald-100 bg-white/95 pl-3.5 pr-8 py-2 text-xs font-semibold text-gray-700 outline-none shadow-sm cursor-pointer focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300"
            >
              <option value="UPCOMING">Sort by: Upcoming First</option>
              <option value="LATEST">Sort by: Latest First</option>
              <option value="OLDEST">Sort by: Oldest First</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setStatusFilter('ALL')}
            className="flex items-center gap-1.5 rounded-2xl border border-emerald-100 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-emerald-50 cursor-pointer"
          >
            <Filter size={14} className="text-gray-500" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Bookings Grid */}
      {loading ? (
        <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-white/70 py-12 text-center font-medium text-forest/60">
          Loading your appointments...
        </div>
      ) : error ? (
        <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700 shadow-sm">{error}</div>
      ) : sortedBookings.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-white/80 p-10 text-center text-sm text-gray-500 shadow-sm">
          No {statusFilter.toLowerCase()} appointments found.
        </div>
      ) : (
        <div className={`grid w-full grid-cols-1 gap-6 items-start ${selectedBooking ? 'lg:grid-cols-12' : ''}`}>
          <div className={`space-y-3 w-full min-w-0 ${selectedBooking ? 'lg:col-span-7' : ''}`}>
            {paginatedBookings.map((booking) => {
              const bookingId = booking.id || booking.bookingId;
              const effectiveStatus = getEffectiveStatus(booking);
              const isModifiable =
                (effectiveStatus === 'CONFIRMED' || effectiveStatus === 'PENDING') &&
                canModifyBooking(booking.date, booking.time);
              const isHighlighted =
                String(highlightedId) === String(booking.id) ||
                String(highlightedId) === String(booking.bookingId) ||
                String(selectedBookingId) === String(bookingId);

              let rawText = booking.notes || booking.purpose || booking.therapyName || 'Abhyanga Therapy';
              if (booking.type === 'CONSULTATION' || booking.bookingType === 'CONSULTATION') {
                rawText = booking.notes || booking.purpose || 'Initial Clinical Consultation';
              }

              // 1. Extract session numbers if embedded (e.g. Session 7 of 7 or Session 7/7)
              let currentSess = booking.currentSession || booking.sessionNumber || 7;
              let totalSess = booking.totalSessions || booking.maxSessions || 7;
              const sessionMatch = rawText.match(/Session\s*(\d+)\s*(?:of|\/)\s*(\d+)/i);
              if (sessionMatch) {
                currentSess = parseInt(sessionMatch[1], 10);
                totalSess = parseInt(sessionMatch[2], 10);
              }

              // 2. Remove session info from string
              let text = rawText.replace(/\s*\(?Session\s*\d+\s*(?:of|\/)\s*\d+\)?/gi, '').trim();

              // 3. Remove "Therapy — " or "Therapy - " prefix
              text = text.replace(/^Therapy\s*[—–-]\s*/i, '').trim();

              // 4. Extract subtitle from bracket or parenthetical text (e.g., "(Oil Massage)")
              let treatmentSubtitle = booking.clinicalStage || booking.programName || booking.treatmentPlanName || '';

              const extractedBrackets = [];
              text = text.replace(/\((.*)/g, (match, inner) => {
                const cleanedInner = inner.replace(/\)/g, '').replace(/[•·]/g, '').trim();
                if (cleanedInner) {
                  extractedBrackets.push(cleanedInner);
                }
                return ''; // Completely remove everything starting from `(`
              }).trim();

              if (extractedBrackets.length > 0) {
                // Extract ONLY the first clean item before any secondary nested brackets
                let firstItem = extractedBrackets[0].split('(')[0].replace(/\btherapy\b/gi, '').replace(/[•·—–-]/g, '').trim();
                if (firstItem) {
                  treatmentSubtitle = firstItem;
                }
              }

              if (!treatmentSubtitle) {
                treatmentSubtitle = 'Follow-Up Clinical Evaluation';
              }

              // 5. Clean main title: strip any remaining trailing dashes, dots, or stray parens
              let mainTitleName = text
                .replace(/^Therapy\s*[—–-]\s*/i, '')
                .replace(/\s*\(.*$/, '')
                .replace(/\btherapy\b/gi, '')
                .replace(/[—–-•·]/g, '')
                .trim();

              if (!mainTitleName) mainTitleName = 'Abhyanga';

              let treatmentTitle = `${mainTitleName} Therapy`;
              if (mainTitleName.toLowerCase().includes('consultation')) {
                treatmentTitle = mainTitleName;
              }

              let formattedDate = booking.date;
              try {
                if (booking.date) {
                  formattedDate = new Date(booking.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                }
              } catch (e) {}

              let formattedTime = booking.time ? booking.time.substring(0, 5) : '';
              if (formattedTime) {
                try {
                  const [h, m] = formattedTime.split(':').map(Number);
                  const ampm = h >= 12 ? 'PM' : 'AM';
                  const h12 = h % 12 || 12;
                  formattedTime = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
                } catch (e) {}
              }

              const therapistName = booking.assignedTo?.fullName || booking.therapistName || 'Harini';

              return (
                <button
                  key={bookingId}
                  id={`patient-booking-${bookingId}`}
                  type="button"
                  onClick={() => selectBooking(bookingId)}
                  className={`w-full h-auto rounded-2xl p-4 border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                    isHighlighted
                      ? 'border-emerald-500 bg-emerald-50/60 ring-4 ring-emerald-300 shadow-md'
                      : 'border-emerald-900/10 bg-white'
                  }`}
                >
                  <div className="w-full space-y-2">
                    {/* Title and status row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 min-w-0">
                      <h3 className="text-lg font-semibold text-green-900 leading-tight truncate">
                        {treatmentTitle}
                      </h3>
                      <span
                        className={`shrink-0 self-start sm:self-auto rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          effectiveStatus === 'COMPLETED'
                            ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                            : effectiveStatus === 'CONFIRMED'
                            ? 'border-sky-200 bg-sky-100 text-sky-800'
                            : effectiveStatus === 'PENDING'
                            ? 'border-amber-200 bg-amber-100 text-amber-800'
                            : 'border-rose-200 bg-rose-100 text-rose-800'
                        }`}
                      >
                        {effectiveStatus}
                      </span>
                    </div>

                    {/* Consultation Category Badge for Consultation Appointments */}
                    {(booking.type === 'CONSULTATION' || booking.bookingType === 'CONSULTATION') && (
                      <div className="flex items-center gap-2 pt-0.5">
                        {((booking.consultationCategory === 'NORMAL') || (booking.notes || booking.purpose || '').toLowerCase().includes('normal')) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e8f0fe] text-[#1a73e8] border border-[#aecbfa]">
                            🩺 Normal Consultation
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            🌿 Consultation with Therapy
                          </span>
                        )}
                      </div>
                    )}

                    {/* Subtitle and Session badge row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-gray-500 break-words">
                        {treatmentSubtitle}
                      </p>

                      <span className="inline-flex items-center gap-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs bg-green-50 text-green-700 font-medium border border-green-200/60">
                        <span>Session {currentSess} / {totalSess}</span>
                      </span>
                    </div>

                    {/* Details row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3 pt-2.5 border-t border-gray-100">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-green-700 shrink-0" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-green-700 shrink-0" />
                        {formattedTime}
                      </span>
                      <span className="flex items-center gap-1.5 truncate">
                        <User size={14} className="text-green-700 shrink-0" />
                        Therapist: {therapistName}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {sortedBookings.length > pageSize && (
              <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-sm px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                {/* Left side: appointment information */}
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Appointments
                  </p>
                  <p className="text-sm font-medium text-gray-600 mt-0.5">
                    Showing <span className="font-semibold text-gray-900">{startIndex + 1}–{Math.min(startIndex + pageSize, sortedBookings.length)}</span> of <span className="font-semibold text-gray-900">{sortedBookings.length}</span> appointments
                  </p>
                </div>

                {/* Right side: controls */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
                  {/* Previous Button */}
                  <button
                    type="button"
                    onClick={() => goToPage(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                    className="px-4 h-10 rounded-full flex items-center gap-1 text-sm font-semibold border border-emerald-100 bg-white text-[#1F4D3A] hover:bg-emerald-50 hover:border-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>←</span>
                    <span>Previous</span>
                  </button>

                  {/* Page Numbers */}
                  {(() => {
                    const getPages = (current, total) => {
                      if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
                      if (current <= 3) return [1, 2, 3, 4, '...', total];
                      if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
                      return [1, '...', current - 1, current, current + 1, '...', total];
                    };

                    return getPages(safeCurrentPage, totalPages).map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`dots-${idx}`} className="h-10 w-8 flex items-center justify-center text-sm font-medium text-gray-400 select-none">
                            ...
                          </span>
                        );
                      }
                      const isActive = p === safeCurrentPage;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => goToPage(p)}
                          className={`h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#1F4D3A] text-white shadow-md font-bold'
                              : 'border border-emerald-100 bg-white text-[#1F4D3A] font-semibold hover:bg-emerald-50 hover:border-emerald-200'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    });
                  })()}

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={() => goToPage(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                    className="px-4 h-10 rounded-full flex items-center gap-1 text-sm font-semibold border border-emerald-100 bg-white text-[#1F4D3A] hover:bg-emerald-50 hover:border-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Next</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedBooking && (
            <div
              ref={detailPanelRef}
              className="w-full min-w-0 lg:col-span-5 lg:sticky lg:top-[90px] space-y-4 rounded-[2.1rem] border-2 border-emerald-400 bg-[linear-gradient(180deg,#ffffff_0%,#f7fcf2_100%)] p-4 shadow-[0_28px_70px_rgba(19,31,24,0.18)] backdrop-blur-xl"
            >
              <BookingDetails
                booking={selectedBooking}
                effectiveStatus={getEffectiveStatus(selectedBooking)}
                activeRescheduleId={activeRescheduleId}
                setActiveRescheduleId={setActiveRescheduleId}
                rescheduleDate={rescheduleDate}
                setRescheduleDate={setRescheduleDate}
                rescheduleTime={rescheduleTime}
                setRescheduleTime={setRescheduleTime}
                rescheduleReason={rescheduleReason}
                setRescheduleReason={setRescheduleReason}
                submitting={submitting}
                handleRescheduleSubmit={handleRescheduleSubmit}
                handleCancel={handleCancel}
                handleAcceptAlternative={handleAcceptAlternative}
                toggleGuidelines={toggleGuidelines}
                openGuidelines={openGuidelines}
                generatePrescriptionPDF={generatePrescriptionPDF}
                canModifyBooking={canModifyBooking}
                onClose={closeBookingDetails}
              />
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );

function BookingDetails({
  booking,
  effectiveStatus,
  activeRescheduleId,
  setActiveRescheduleId,
  rescheduleDate,
  setRescheduleDate,
  rescheduleTime,
  setRescheduleTime,
  rescheduleReason,
  setRescheduleReason,
  submitting,
  handleRescheduleSubmit,
  handleCancel,
  handleAcceptAlternative,
  toggleGuidelines,
  openGuidelines,
  generatePrescriptionPDF,
  canModifyBooking,
  onClose,
}) {
  const bookingId = booking.id || booking.bookingId;
  const guidelinesInfo = getGuidelines(booking.notes || booking.therapyName || booking.purpose);
  const isGuidelinesOpen = Boolean(openGuidelines[bookingId]);
  const therapistName = booking.assignedTo?.fullName || booking.therapistName || 'Rini';
  const isModifiable =
    (effectiveStatus === 'CONFIRMED' || effectiveStatus === 'PENDING') && canModifyBooking(booking.date, booking.time);

  let mainTitle = 'Therapy';
  if (booking.type === 'CONSULTATION' || booking.bookingType === 'CONSULTATION') {
    mainTitle = booking.notes || booking.purpose || 'Consultation';
  } else if (booking.notes) {
    mainTitle = booking.notes.toLowerCase().startsWith('therapy')
      ? booking.notes
      : `Therapy — ${booking.notes}`;
  } else if (booking.purpose) {
    mainTitle = `Therapy — ${booking.purpose}`;
  } else if (booking.therapyName) {
    mainTitle = `Therapy — ${booking.therapyName}`;
  } else {
    mainTitle = 'Therapy — Panchakarma Session';
  }

  let formattedDate = booking.date;
  try {
    if (booking.date) {
      formattedDate = new Date(booking.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch (e) {}

  let formattedTime = booking.time ? booking.time.substring(0, 5) : '';
  if (formattedTime) {
    try {
      const [h, m] = formattedTime.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      formattedTime = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch (e) {}
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.6rem] border border-emerald-900/10 bg-[linear-gradient(135deg,#173022_0%,#2f5a3a_100%)] p-4 text-white shadow-[0_18px_42px_rgba(23,39,28,0.18)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/80">Booking details</p>
            <h3 className="mt-1 line-clamp-2 font-display text-lg font-bold leading-snug text-amber-50">
              {mainTitle}
            </h3>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                effectiveStatus === 'COMPLETED'
                  ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                  : effectiveStatus === 'CONFIRMED'
                  ? 'border-sky-200 bg-sky-100 text-sky-800'
                  : effectiveStatus === 'PENDING'
                  ? 'border-amber-200 bg-amber-100 text-amber-800'
                  : 'border-rose-200 bg-rose-100 text-rose-800'
              }`}
            >
              {effectiveStatus}
            </span>
            <button
              type="button"
              onClick={onClose}
              title="Close details"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-amber-50 transition hover:bg-white/20"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-emerald-50/90 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
            <Calendar size={14} /> {formattedDate}
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
            <Clock size={14} /> {formattedTime}
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 sm:col-span-2">
            <User size={14} /> {therapistName}
          </div>
        </div>
      </div>

      {/* Consultation Category Info Card for Patient */}
      {(booking.type === 'CONSULTATION' || booking.bookingType === 'CONSULTATION') && (
        <div className={`rounded-2xl p-4 border space-y-1.5 text-xs ${
          (booking.consultationCategory === 'NORMAL' || (booking.notes || booking.purpose || '').toLowerCase().includes('normal'))
            ? 'bg-blue-50/90 border-blue-200 text-blue-950'
            : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-center justify-between font-bold gap-2">
            <span className="flex items-center gap-1.5">
              <span>{(booking.consultationCategory === 'NORMAL' || (booking.notes || booking.purpose || '').toLowerCase().includes('normal')) ? '🩺' : '🌿'}</span>
              <span>{(booking.consultationCategory === 'NORMAL' || (booking.notes || booking.purpose || '').toLowerCase().includes('normal')) ? 'Normal Health Consultation' : 'Consultation with Therapy'}</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold border ${
              (booking.consultationCategory === 'NORMAL' || (booking.notes || booking.purpose || '').toLowerCase().includes('normal'))
                ? 'bg-blue-100 text-blue-900 border-blue-300'
                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
            }`}>
              {(booking.consultationCategory === 'NORMAL' || (booking.notes || booking.purpose || '').toLowerCase().includes('normal')) ? 'Checkup Only' : 'Therapy Track'}
            </span>
          </div>
          <p className="text-[11px] text-forest/80 leading-relaxed font-medium">
            {(booking.consultationCategory === 'NORMAL' || (booking.notes || booking.purpose || '').toLowerCase().includes('normal'))
              ? 'General health & Agni checkup with your consulting doctor. Session completes directly with clinical notes. No multi-session therapy track is required.'
              : 'Doctor evaluates your health condition and prescribes your personalized Panchakarma detox & therapy course so you can book your 1st therapy session.'}
          </p>
        </div>
      )}

      <div className="rounded-[1.5rem] border border-emerald-900/10 bg-white/90 p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest/45">Next steps</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => generatePrescriptionPDF(booking)}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-xs font-bold text-emerald-950 transition hover:bg-emerald-100 cursor-pointer"
          >
            <FileText size={14} className="text-emerald-700" /> Prescription
          </button>

          {booking.meetLink &&
            effectiveStatus !== 'CANCELLED' &&
            effectiveStatus !== 'COMPLETED' && (
              <a
                href={booking.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#2b6ea3_0%,#4b88b6_100%)] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-105"
              >
                📹 Meet
              </a>
            )}
          {isModifiable && !booking.rescheduleRequested && activeRescheduleId !== booking.id && (
            <button
              onClick={() => {
                setActiveRescheduleId(booking.id);
                setRescheduleDate(booking.date);
                setRescheduleTime(booking.time ? booking.time.substring(0, 5) : '');
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-100 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-emerald-50"
            >
              <CalendarClock size={13} className="text-blue-600" /> Reschedule
            </button>
          )}
          <button
            onClick={() => handleCancel(booking.id)}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50/80 px-3.5 py-2 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-100"
          >
            <X size={13} className="text-rose-600" /> Cancel
          </button>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-forest/55">
          Tip: pick any row on the left to switch this panel instantly.
        </p>
        </div>

      {guidelinesInfo && (
        <div className="overflow-hidden rounded-2xl border border-amber-200/70 bg-amber-50/60">
          <button
            type="button"
            onClick={() => toggleGuidelines(bookingId)}
            className="flex w-full items-center justify-between p-3 text-[11px] font-bold uppercase tracking-wider text-amber-900 transition hover:bg-amber-100/40 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={13} className="text-amber-700" />
              Guidelines ({guidelinesInfo.therapyName})
            </span>
            <ChevronDown
              size={15}
              className={`text-amber-700 transition-transform duration-200 ${isGuidelinesOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isGuidelinesOpen && (
            <div className="border-t border-amber-200/50 px-4 pb-3 pt-2 text-xs text-gray-700">
              <ul className="list-disc space-y-1 pl-4">
                {guidelinesInfo.rules.slice(0, 4).map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          )}
            </div>
      )}

      {effectiveStatus === 'COMPLETED' && (booking.sessionNotes || booking.patientAdvice) && (
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-3 text-xs">
          <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-950">
            <CheckSquare size={13} className="text-emerald-800" /> Feedback
          </h4>
          {booking.sessionNotes && <p className="mt-1 text-gray-700"><strong>Obs:</strong> {booking.sessionNotes}</p>}
          {booking.patientAdvice && <p className="mt-1 text-gray-800"><strong>Advice:</strong> {booking.patientAdvice}</p>}
        </div>
      )}

      {booking.rescheduleRequested && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <strong>Reschedule pending:</strong> {booking.proposedDate} {booking.proposedTime ? booking.proposedTime.substring(0, 5) : ''}
          </div>
        </div>
      )}

      {booking.altSlotsPending && (
        <div className="space-y-2 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs">
          <div className="flex items-start gap-2 text-sky-900">
            <Info size={15} className="mt-0.5 shrink-0 text-blue-700" />
            <div>
              <p className="font-bold">Choose another slot</p>
              {booking.declineReason && <p className="text-sky-800">{booking.declineReason}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {booking.altSlot1Date && (
              <button onClick={() => handleAcceptAlternative(booking.id, 1)} className="rounded-full border border-sky-300 bg-white px-3 py-1.5 text-[11px] font-bold text-sky-900 transition hover:bg-sky-100">
                {booking.altSlot1Date} {booking.altSlot1Time?.substring(0, 5)}
              </button>
            )}
            {booking.altSlot2Date && (
              <button onClick={() => handleAcceptAlternative(booking.id, 2)} className="rounded-full border border-sky-300 bg-white px-3 py-1.5 text-[11px] font-bold text-sky-900 transition hover:bg-sky-100">
                {booking.altSlot2Date} {booking.altSlot2Time?.substring(0, 5)}
              </button>
            )}
            {booking.altSlot3Date && (
              <button onClick={() => handleAcceptAlternative(booking.id, 3)} className="rounded-full border border-sky-300 bg-white px-3 py-1.5 text-[11px] font-bold text-sky-900 transition hover:bg-sky-100">
                {booking.altSlot3Date} {booking.altSlot3Time?.substring(0, 5)}
              </button>
            )}
          </div>
        </div>
      )}

      {activeRescheduleId === booking.id && (
        <form
          onSubmit={(e) => handleRescheduleSubmit(e, booking.id)}
          className="space-y-3 rounded-2xl border border-emerald-900/5 bg-white p-3"
        >
          <div className="flex justify-between items-center pb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-forest/70">Request Reschedule</h4>
            <button
              type="button"
              onClick={() => setActiveRescheduleId(null)}
              className="text-gray-400 transition hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="date"
              required
              value={rescheduleDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-white p-2 text-xs text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
            <input
              type="time"
              required
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-white p-2 text-xs text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <textarea
            value={rescheduleReason}
            onChange={(e) => setRescheduleReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={2}
            className="w-full rounded-xl border border-emerald-100 bg-white p-2 text-xs text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-[linear-gradient(135deg,#1d3a2a_0%,#35613e_100%)] py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-105"
            >
              {submitting ? 'Sending...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => setActiveRescheduleId(null)}
              className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-emerald-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
};

export default PatientBookings;