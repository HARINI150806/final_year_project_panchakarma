import { useState, useEffect } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronDown, Stethoscope, Wand2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

// ─── Shared style tokens ───────────────────────────────────────
const labelCls =
  'mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-forest/70';
const inputCls =
  'w-full rounded-2xl border border-[#ddcdb3] bg-[#fffdf9] px-4 py-3 text-sm text-forest outline-none transition placeholder:text-forest/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10';
const selectCls = inputCls + ' appearance-none';

// ─── Static data ───────────────────────────────────────────────
const THERAPY_TYPES = [
  'Abhyanga (Oil Massage)',
  'Basti (Enema Therapy)',
  'Shirodhara (Oil Pouring)',
  'Virechana (Purgation)',
  'Nasya (Nasal Therapy)',
  'Vamana (Emesis Therapy)',
  'Udvartana (Powder Massage)',
];

const CONSULTATION_REASONS = [
  'Initial Dosha assessment',
  'Treatment follow-up',
  'Chronic pain / joint issues',
  'Digestive problems',
  'Stress & anxiety',
  'Skin conditions',
  'Weight management',
  'General wellness checkup',
];

// ─── Success state ─────────────────────────────────────────────
function SuccessCard({ type, onNew, onDashboard }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#e6efdf_0%,#c8e2bc_100%)] shadow-[0_8px_32px_rgba(90,133,83,0.2)]">
        <CheckCircle2 size={40} className="text-sage" />
      </div>
      <h3 className="font-display text-2xl font-bold text-forest">Booking Confirmed!</h3>
      <p className="mt-3 max-w-xs text-sm leading-6 text-forest/65">
        Your {type === 'consultation' ? 'consultation' : 'therapy session'} request has been
        submitted. You will receive a confirmation shortly.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={onNew}
          className="rounded-2xl border border-[#cfe0c2] bg-white/80 px-5 py-2.5 text-sm font-semibold text-forest transition hover:bg-white"
        >
          Book Another
        </button>
        <button
          onClick={onDashboard}
          className="rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(62,109,67,0.25)] transition hover:translate-y-[-1px]"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Consultation form ─────────────────────────────────────────
function ConsultationForm({ onSuccess }) {
  const [form, setForm] = useState({ date: '', time: '', reason: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // min date = today
  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const auth = JSON.parse(localStorage.getItem('panchakarma-auth'));
      await api.post('/bookings', {
        patientId: auth?.userId,
        date: form.date,
        time: form.time,
        purpose: `${form.reason}${form.notes ? ' — ' + form.notes : ''}`,
        bookingType: 'CONSULTATION',
        bookingStatus: 'PENDING',
      });
      onSuccess();
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date & Time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Preferred Date <span className="text-rose-400">*</span></label>
          <input
            className={inputCls}
            type="date"
            min={today}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Preferred Time <span className="text-rose-400">*</span></label>
          <input
            className={inputCls}
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className={labelCls}>Reason for Visit <span className="text-rose-400">*</span></label>
        <div className="relative">
          <select
            className={selectCls}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          >
            <option value="">Select reason</option>
            {CONSULTATION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-forest/40" />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Additional Notes (optional)</label>
        <textarea
          className={inputCls + ' resize-none'}
          rows={3}
          placeholder="Any specific concerns or medical history..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] py-3.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(62,109,67,0.25)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Confirming...' : 'Confirm Consultation'}
      </button>
    </form>
  );
}

// ─── Therapy form ──────────────────────────────────────────────
function TherapyForm({ onSuccess }) {
  const [form, setForm] = useState({ therapy: '', therapist: '', date: '', time: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [therapists, setTherapists] = useState([]);
  const [therapistsLoading, setTherapistsLoading] = useState(true);

  useEffect(() => {
    async function fetchTherapists() {
      try {
        const response = await api.get('/patient/therapists');
        setTherapists(response.data);
      } catch (error) {
        console.error("Failed to fetch therapists", error);
        // Fallback to mock data if API fails, in a real app you might want to show an error
        setTherapists([]);
      } finally {
        setTherapistsLoading(false);
      }
    }
    fetchTherapists();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const auth = JSON.parse(localStorage.getItem('panchakarma-auth'));
      await api.post('/bookings', {
        patientId: auth?.userId,
        assignedToId: form.therapist,
        date: form.date,
        time: form.time,
        purpose: `${form.therapy}${form.notes ? ' — ' + form.notes : ''}`,
        bookingType: 'THERAPY',
        bookingStatus: 'PENDING',
      });
      onSuccess();
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Therapy type */}
      <div>
        <label className={labelCls}>Therapy Type <span className="text-rose-400">*</span></label>
        <div className="relative">
          <select
            className={selectCls}
            value={form.therapy}
            onChange={(e) => setForm({ ...form, therapy: e.target.value })}
            required
          >
            <option value="">Select therapy</option>
            {THERAPY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-forest/40" />
        </div>
      </div>

      {/* Therapist */}
      <div>
        <label className={labelCls}>Preferred Therapist <span className="text-rose-400">*</span></label>
        <div className="relative">
          <select
            className={selectCls}
            value={form.therapist}
            onChange={(e) => setForm({ ...form, therapist: e.target.value })}
            required
            disabled={therapistsLoading}
          >
            <option value="">{therapistsLoading ? 'Loading therapists...' : 'Choose a therapist'}</option>
            {therapists.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-forest/40" />
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Preferred Date <span className="text-rose-400">*</span></label>
          <input
            className={inputCls}
            type="date"
            min={today}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Preferred Time <span className="text-rose-400">*</span></label>
          <input
            className={inputCls}
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Special Instructions (optional)</label>
        <textarea
          className={inputCls + ' resize-none'}
          rows={3}
          placeholder="Any health conditions or preferences..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] py-3.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(62,109,67,0.25)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Booking...' : 'Book Therapy Session'}
      </button>
    </form>
  );
}

// ─── Main page ─────────────────────────────────────────────────
export default function BookSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'therapy' ? 'therapy' : 'consultation'
  );
  const [success, setSuccess] = useState(false);

  // Reset success when tab changes
  useEffect(() => {
    setSuccess(false);
  }, [activeTab]);

  const tabs = [
    {
      key: 'consultation',
      label: 'Book Consultation',
      icon: Stethoscope,
      desc: 'Meet a care provider to discuss your health and get a personalised care plan.',
      color: 'text-sage',
      bg: 'bg-[#e6efdf]',
    },
    {
      key: 'therapy',
      label: 'Book Therapy',
      icon: Wand2,
      desc: 'Schedule an Ayurvedic therapy session with an experienced therapist.',
      color: 'text-[#a06a3a]',
      bg: 'bg-[#f3e4c5]',
    },
  ];

  return (
    <div className="bg-dashboard-surface min-h-screen font-body text-forest">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb left-[-4rem] top-24 h-72 w-72 bg-[#d7e6cb]" />
        <div className="ambient-orb right-[-5rem] top-12 h-80 w-80 bg-[#ebd5b7]" />
        <div className="noise-grid absolute inset-0 opacity-[0.08]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-8 lg:px-6 lg:py-12">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-forest/60 transition hover:text-forest"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] shadow-[0_12px_36px_rgba(62,109,67,0.3)]">
            <CalendarDays size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-forest">Book a Session</h1>
          <p className="mt-2 text-sm leading-6 text-forest/65">
            Schedule your consultation or therapy at your convenience
          </p>
        </div>

        {/* Tab selector */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {tabs.map(({ key, label, icon: Icon, desc, color, bg }) => (
            <button
              key={key}
              id={`tab-${key}`}
              onClick={() => { setActiveTab(key); setSuccess(false); }}
              className={`flex flex-col items-center gap-2 rounded-3xl border-2 p-5 text-center transition-all duration-200 ${
                activeTab === key
                  ? 'border-sage bg-white shadow-[0_8px_32px_rgba(90,133,83,0.15)]'
                  : 'border-transparent bg-white/50 hover:bg-white/80'
              }`}
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg} ${color}`}>
                <Icon size={22} />
              </span>
              <span className={`text-sm font-bold ${activeTab === key ? 'text-forest' : 'text-forest/60'}`}>
                {label}
              </span>
              <span className={`text-xs leading-5 ${activeTab === key ? 'text-forest/65' : 'text-forest/40'}`}>
                {desc}
              </span>
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="panel-frost rounded-[2.4rem] p-6 lg:p-8">
          {success ? (
            <SuccessCard
              type={activeTab}
              onNew={() => setSuccess(false)}
              onDashboard={() => navigate('/dashboard/patient')}
            />
          ) : activeTab === 'consultation' ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl bg-[#e6efdf] p-3 text-sage"><Stethoscope size={20} /></div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-forest">Consultation Details</h2>
                  <p className="text-sm text-forest/55">Fill in the details to schedule your consultation</p>
                </div>
              </div>
              <ConsultationForm onSuccess={() => setSuccess(true)} />
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl bg-[#f3e4c5] p-3 text-[#a06a3a]"><Wand2 size={20} /></div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-forest">Therapy Details</h2>
                  <p className="text-sm text-forest/55">Select your preferred therapy and therapist</p>
                </div>
              </div>
              <TherapyForm onSuccess={() => setSuccess(true)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}