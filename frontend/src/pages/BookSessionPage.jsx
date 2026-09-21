import { useState, useEffect } from 'react';
import { ArrowLeft, Brain, CalendarDays, CheckCircle2, ChevronDown, Stethoscope, Wand2, FileText } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { generatePrescriptionPDF } from '../utils/pdfExport';
import DashboardLayout from '../components/DashboardLayout';
import PaymentCheckoutModal from '../components/PaymentCheckoutModal';

// ─── Shared style tokens ───────────────────────────────────────
const labelCls =
  'mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-forest/70';
const inputCls =
  'w-full rounded-2xl border border-[#ddcdb3] bg-[#fffdf9] px-4 py-3 text-sm text-forest outline-none transition placeholder:text-forest/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10';
const selectCls = inputCls + ' appearance-none';

// ─── Static data ───────────────────────────────────────────────
const THERAPY_TYPES = [
  { value: 'Abhyanga (Oil Massage)', label: 'Abhyanga — Warm Oil Massage (Vata • Joint Stiffness, Pain & Fatigue)' },
  { value: 'Shirodhara (Oil Pouring)', label: 'Shirodhara — Warm Oil Pouring (Vata-Pitta • Stress, Insomnia & Anxiety)' },
  { value: 'Virechana (Purgation)', label: 'Virechana — Purgation Detox (Pitta • Acidity, Skin Conditions & Liver)' },
  { value: 'Basti (Enema Therapy)', label: 'Basti — Herbal Enema Therapy (Vata • Back Pain, Sciatica & Bloating)' },
  { value: 'Nasya (Nasal Therapy)', label: 'Nasya — Nasal Administration (Kapha-Vata • Sinus, Headaches & Migraine)' },
  { value: 'Udvartana (Powder Massage)', label: 'Udvartana — Herbal Powder Massage (Kapha • Weight & Lymphatic Flow)' },
  { value: 'Vamana (Emesis Therapy)', label: 'Vamana — Therapeutic Emesis (Kapha • Asthma, Allergies & Heavy Mucus)' },
];

function matchTherapyType(inputName) {
  if (!inputName) return THERAPY_TYPES[0].value;
  const lower = String(inputName).toLowerCase();
  const matched = THERAPY_TYPES.find(t => {
    const mainKey = t.value.split(' ')[0].toLowerCase();
    return lower.includes(mainKey);
  });
  return matched ? matched.value : THERAPY_TYPES[0].value;
}

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
function SuccessCard({ type, booking, onNew, onDashboard }) {
  const handleDownloadPrescription = () => {
    if (booking) {
      generatePrescriptionPDF(booking);
    }
  };

  if (!booking) {
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

  // Display with booking details
  const isOnline = booking.consultationType === 'ONLINE' || booking.meetLink;
  const therapistName = booking.therapistName || (booking.assignedTo ? booking.assignedTo.fullName : 'Not Assigned Yet');
  const date = booking.date;
  const time = booking.time || booking.startTime;
  const meetLink = booking.meetLink;

  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#e6efdf_0%,#c8e2bc_100%)] shadow-[0_8px_32px_rgba(90,133,83,0.2)]">
        <CheckCircle2 size={40} className="text-sage" />
      </div>
      <h3 className="font-display text-2xl font-bold text-forest">Booking Confirmed!</h3>

      {isOnline ? (
        <>
          <p className="mt-3 max-w-sm text-sm leading-6 text-forest/65">
            Your online consultation has been scheduled successfully.
          </p>

          {/* Booking Details Card */}
          <div className="mt-6 w-full rounded-2xl border border-[#cfe0c2] bg-[#f9fcf7] p-5 text-left">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-forest/60">Assigned Therapist</p>
                  <p className="mt-1 text-sm font-semibold text-forest">{therapistName}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                  💳 Paid ₹500 (Razorpay Test)
                </span>
              </div>
              <div className="h-px bg-[#cfe0c2]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-forest/60">Scheduled Date & Time</p>
                <p className="mt-1 text-sm font-semibold text-forest">{formattedDate}</p>
                <p className="text-xs text-forest/65">{time} {booking.endTime ? `- ${booking.endTime}` : ''}</p>
              </div>
              {booking.razorpayPaymentId && (
                <>
                  <div className="h-px bg-[#cfe0c2]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-forest/60">Razorpay Payment ID</p>
                    <p className="mt-1 text-xs font-mono font-medium text-forest/80 bg-sand/20 px-2.5 py-1 rounded-md inline-block">{booking.razorpayPaymentId}</p>
                  </div>
                </>
              )}
              {meetLink && (
                <>
                  <div className="h-px bg-[#cfe0c2]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-forest/60">Google Meet Link</p>
                    <a
                      href={meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 transition"
                    >
                      📹 Join Meeting
                    </a>
                    <p className="mt-2 break-all text-xs text-forest/55">{meetLink}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 max-w-sm text-sm leading-6 text-forest/65">
            Your request for {type === 'consultation' ? 'an offline consultation' : 'a therapy session'} has been submitted.
          </p>

          {/* Booking Details Card */}
          <div className="mt-6 w-full rounded-2xl border border-[#cfe0c2] bg-[#f9fcf7] p-5 text-left">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-forest/60">
                    {type === 'consultation' ? 'Consultation Mode' : 'Booking Type'}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-forest">
                    {type === 'consultation'
                      ? 'Offline (In-Clinic)'
                      : (booking.notes
                          ? booking.notes.replace(/^CONSULTATION\s*[—–-]?\s*/i, 'Therapy — ')
                          : 'Therapy Session')}
                  </p>
                </div>
                {type === 'consultation' && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                    💳 Paid ₹500
                  </span>
                )}
              </div>
              <div className="h-px bg-[#cfe0c2]" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-forest/60">Preferred Therapist</p>
                  <p className="mt-1 text-sm font-semibold text-forest">{therapistName}</p>
                </div>
              </div>
              <div className="h-px bg-[#cfe0c2]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-forest/60">Scheduled Date & Time</p>
                <p className="mt-1 text-sm font-semibold text-forest">{formattedDate}</p>
                <p className="text-xs text-forest/65">{time}</p>
              </div>
              {booking.razorpayPaymentId && (
                <>
                  <div className="h-px bg-[#cfe0c2]" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-forest/60">Payment ID</p>
                    <p className="mt-1 text-xs font-mono font-medium text-forest/80 bg-sand/20 px-2.5 py-1 rounded-md inline-block">{booking.razorpayPaymentId}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* In-App & Email Notification Alert Callout */}
          {(() => {
            const savedNotifPrefs = JSON.parse(localStorage.getItem('panchakarma-notif-prefs') || '{"inAppNotif":true,"emailNotif":true}');
            const patientEmail = JSON.parse(localStorage.getItem('panchakarma-auth') || '{}')?.email || 'your registered email';
            return (
              <div className="mt-4 w-full rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-left space-y-2 shadow-2xs">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                    <span className="text-sm">🔔</span> <span>Booking Notifications Status</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    Preferences Applied
                  </span>
                </div>
                <ul className="text-[11px] text-emerald-900 space-y-1 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span>{savedNotifPrefs.inAppNotif ? '✅' : '⏸️'}</span>
                    <span><strong>Patient In-App Notification:</strong> {savedNotifPrefs.inAppNotif ? 'Delivered to your Patient Dashboard header bell alert' : 'Disabled per your notification settings'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span>{savedNotifPrefs.emailNotif ? '📧' : '⏸️'}</span>
                    <span><strong>Patient Email Confirmation:</strong> {savedNotifPrefs.emailNotif ? `Instant confirmation sent to ${patientEmail}` : 'Email alerts disabled per your settings'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span>🩺</span>
                    <span><strong>Therapist In-App Notification:</strong> Dispatched to {therapistName || 'assigned therapist'}'s workspace dashboard bell</span>
                  </li>
                </ul>
              </div>
            );
          })()}
        </>
      )}

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
  const [form, setForm] = useState({
    date: '',
    reason: '',
    notes: '',
    consultationType: 'ONLINE',
    consultationCategory: 'NORMAL',
    assignedTo: '',
  });
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Available slots state
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Medical Document Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('Lab Report');

  // Interactive Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [pendingBookingPayload, setPendingBookingPayload] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // min date = today
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadTherapists() {
      try {
        const res = await api.get('/patient/therapists');
        setTherapists(res.data || []);
      } catch (e) {
        console.warn('Failed to load therapists:', e);
      }
    }
    loadTherapists();
  }, []);

  // Fetch slots whenever assignedTo, date, or websocket refetchTrigger changes
  useEffect(() => {
    async function fetchSlots() {
      if (!form.date) {
        setAvailableSlots([]);
        setForm(prev => ({ ...prev, time: '' }));
        return;
      }
      setSlotsLoading(true);
      try {
        const therapistId = form.assignedTo || 0;
        const response = await api.get(`/therapists/${therapistId}/availability?date=${form.date}`);
        let rawSlots = response.data || [];

        // Filter out completed/past time slots if selected date is today
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        if (form.date === todayStr) {
          const nowHours = String(now.getHours()).padStart(2, '0');
          const nowMinutes = String(now.getMinutes()).padStart(2, '0');
          const currentTimeStr = `${nowHours}:${nowMinutes}`;
          rawSlots = rawSlots.filter(s => s.startTime.substring(0, 5) > currentTimeStr);
        }

        setAvailableSlots(rawSlots);

        const startTimes = rawSlots.map(s => s.startTime.substring(0, 5));
        setForm(prev => {
          if (prev.time && !startTimes.includes(prev.time)) {
            setError(`The slot at ${prev.time} is no longer available. Please select a different slot.`);
            return { ...prev, time: '' };
          }
          return prev;
        });
      } catch (err) {
        console.error("Failed to fetch available slots for consultation", err);
        setAvailableSlots([]);
        setForm(prev => ({ ...prev, time: '' }));
      } finally {
        setSlotsLoading(false);
      }
    }
    fetchSlots();
  }, [form.assignedTo, form.date, refetchTrigger]);

  // WebSocket listener to auto-refresh consultation slots in real-time
  useEffect(() => {
    if (!form.date) return;

    const apiURL = api.defaults.baseURL;
    let wsURL = apiURL.replace(/^http/, 'ws');
    if (wsURL.endsWith('/api')) {
      wsURL = wsURL.substring(0, wsURL.length - 4) + '/ws/bookings';
    } else {
      wsURL = wsURL + '/ws/bookings';
    }

    const ws = new WebSocket(wsURL);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'BOOKING_UPDATE') {
          if ((!form.assignedTo || String(data.therapistId) === String(form.assignedTo)) && data.date === form.date) {
            setRefetchTrigger(prev => prev + 1);
          }
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };
    return () => ws.close();
  }, [form.assignedTo, form.date]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const auth = JSON.parse(localStorage.getItem('panchakarma-auth'));
      const notifPrefs = JSON.parse(localStorage.getItem('panchakarma-notif-prefs') || '{"inAppNotif":true,"emailNotif":true}');
      const inAppNotifEnabled = notifPrefs.inAppNotif !== false;
      const emailNotifEnabled = notifPrefs.emailNotif !== false;

      // 0. Upload Medical Document to patient profile if file selected
      let uploadedDocInfo = null;
      if (selectedFile) {
        try {
          const docFormData = new FormData();
          docFormData.append('file', selectedFile);
          docFormData.append('documentType', documentType);
          const uploadRes = await api.post('/medical-documents/upload', docFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          uploadedDocInfo = uploadRes?.data;
        } catch (uploadErr) {
          console.warn('Medical document upload warning:', uploadErr);
        }
      }

      const appendedNotes = form.notes + (uploadedDocInfo || selectedFile
        ? ` [Attached Medical Record: ${uploadedDocInfo?.documentName || selectedFile?.name} (${documentType})]`
        : '');

      // 1. Create Order for ₹500
      const orderRes = await api.post('/payments/create-order', {
        amount: 500.00,
        currency: 'INR'
      });

      const orderData = orderRes.data;
      if (!orderData?.keyId || !orderData?.orderId || !orderData?.amountInPaise || !orderData?.currency) {
        throw new Error('Razorpay order details are incomplete. Please check the backend payment configuration.');
      }

      const bookingPayload = {
        patientId: auth?.userId,
        consultationType: form.consultationType,
        consultationCategory: form.consultationCategory,
        assignedToId: form.assignedTo ? parseInt(form.assignedTo) : null,
        date: form.date,
        time: form.time || '09:00',
        reason: form.reason,
        notes: appendedNotes,
        inAppNotifEnabled: inAppNotifEnabled,
        emailNotifEnabled: emailNotifEnabled,
      };

      setPendingOrderData(orderData);
      setPendingBookingPayload(bookingPayload);

      // Open Official Razorpay Checkout Modal SDK
      const loadRazorpaySDK = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const sdkLoaded = await loadRazorpaySDK();
      if (!sdkLoaded || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency,
        name: 'Panchakarma Care Center',
        description: 'Clinical Consultation Fee (₹500)',
        order_id: orderData.orderId,
        prefill: {
          name: auth?.fullName || auth?.username || 'Patient',
          email: auth?.email || 'patient@panchakarma.com',
          contact: auth?.phone || '9876543210',
        },
        theme: { color: '#355c39' },
        handler: async function (paymentResponse) {
          await handleConfirmPaymentVerification({
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
          }, bookingPayload);
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'An error occurred. Please try again.');
      console.error(err);
      setLoading(false);
    }
  }

  async function handleConfirmPaymentVerification(paymentDetails, overridePayload = null) {
    const payload = overridePayload || pendingBookingPayload;
    const order = pendingOrderData;
    setIsProcessingPayment(true);
    try {
      const verifyRes = await api.post('/payments/verify-and-book', {
        razorpayOrderId: paymentDetails.razorpay_order_id || order?.orderId || `order_${Date.now()}`,
        razorpayPaymentId: paymentDetails.razorpay_payment_id || paymentDetails.paymentId || `pay_test_${Date.now()}`,
        razorpaySignature: paymentDetails.razorpay_signature || 'test_signature',
        patientId: payload?.patientId,
        consultationType: payload?.consultationType,
        consultationCategory: payload?.consultationCategory,
        assignedToId: payload?.assignedToId,
        date: payload?.date,
        time: payload?.time || '10:00',
        reason: payload?.reason,
        notes: payload?.notes,
        inAppNotifEnabled: payload?.inAppNotifEnabled,
        emailNotifEnabled: payload?.emailNotifEnabled,
      });

      setPaymentModalOpen(false);
      setIsProcessingPayment(false);
      onSuccess(verifyRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Payment verification failed.');
      setIsProcessingPayment(false);
      setPaymentModalOpen(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
      {/* Consultation Fee Card Notice */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-amber-50/50 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-white text-lg font-bold">
            💳
          </div>
          <div>
            <p className="font-bold text-forest text-sm">Consultation Fee: ₹500</p>
            <p className="text-xs text-forest/65">Secure Online Payment</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider border border-emerald-200">
          Required Before Booking
        </span>
      </div>

      {/* Consultation Category Option */}
      <div>
        <label className={labelCls}>Consultation Intention <span className="text-rose-400">*</span></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className={`flex flex-col gap-1.5 rounded-2xl border-2 p-3.5 cursor-pointer transition ${
              form.consultationCategory === 'NORMAL'
                ? 'border-forest bg-forest/5 shadow-xs'
                : 'border-sand/60 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="consultationCategory"
                value="NORMAL"
                checked={form.consultationCategory === 'NORMAL'}
                onChange={(e) => setForm({ ...form, consultationCategory: e.target.value })}
                className="w-4 h-4 text-forest"
              />
              <span className="text-sm font-bold text-forest">🩺 Normal Consultation</span>
            </div>
            <p className="text-[11px] text-forest/65 pl-6 leading-relaxed">
              Standard health, Agni checkup & general doctor evaluation. Therapist completes with session notes.
            </p>
          </label>

          <label
            className={`flex flex-col gap-1.5 rounded-2xl border-2 p-3.5 cursor-pointer transition ${
              form.consultationCategory === 'THERAPY_RECOMMENDATION'
                ? 'border-[#355c39] bg-[#e6efdf]/50 shadow-xs'
                : 'border-sand/60 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="consultationCategory"
                value="THERAPY_RECOMMENDATION"
                checked={form.consultationCategory === 'THERAPY_RECOMMENDATION'}
                onChange={(e) => setForm({ ...form, consultationCategory: e.target.value })}
                className="w-4 h-4 text-forest"
              />
              <span className="text-sm font-bold text-forest">🌿 Consultation + Therapy Plan</span>
            </div>
            <p className="text-[11px] text-forest/65 pl-6 leading-relaxed">
              For Panchakarma detox & therapy planning. Doctor prescribes therapy track & total session count.
            </p>
          </label>
        </div>
      </div>

      {/* Auto-Assigned Specialist Banner */}
      <div>
        <label className={labelCls}>Assigned Specialist / Doctor</label>
        <div className="flex items-center justify-between rounded-2xl border border-emerald-900/10 bg-[#faf8f4] p-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest/10 font-bold text-forest text-sm">
              🩺
            </div>
            <div>
              <p className="font-bold text-forest text-sm">✨ Auto-Assigned Clinic Specialist</p>
              <p className="text-[11px] text-forest/60">System automatically load-balances across available doctors according to date & slot availability</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider border border-emerald-200">
            ✓ Auto-Scheduled
          </span>
        </div>
      </div>

      {/* Consultation Mode */}
      <div>
        <label className={labelCls}>Consultation Mode <span className="text-rose-400">*</span></label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="consultationType"
              value="OFFLINE"
              checked={form.consultationType === 'OFFLINE'}
              onChange={(e) => setForm({ ...form, consultationType: e.target.value })}
              className="w-4 h-4"
            />
            <span className="text-sm text-forest">Offline (In-Clinic)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="consultationType"
              value="ONLINE"
              checked={form.consultationType === 'ONLINE'}
              onChange={(e) => setForm({ ...form, consultationType: e.target.value })}
              className="w-4 h-4"
            />
            <span className="text-sm text-forest">Online (Auto-Scheduled)</span>
          </label>
        </div>
        {form.consultationType === 'ONLINE' && (
          <p className="mt-2 text-xs text-sage italic">
            {form.assignedTo 
              ? `Session will be booked directly with ${therapists.find(t => String(t.id) === String(form.assignedTo))?.fullName || 'selected doctor'} and generate Google Meet link`
              : "System will load-balance across all available doctors and generate Google Meet link"}
          </p>
        )}
      </div>

      {/* Date & Time Slot */}
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
          <label className={labelCls}>Available Time Slot <span className="text-rose-400">*</span></label>
          <div className="relative">
            <select
              className={selectCls}
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              required
              disabled={slotsLoading || !form.date}
            >
              {!form.date ? (
                <option value="">Select preferred date first</option>
              ) : slotsLoading ? (
                <option value="">Loading available slots...</option>
              ) : availableSlots.length === 0 ? (
                <option value="">No slots available on this day</option>
              ) : (
                <>
                  <option value="">Choose a slot</option>
                  {availableSlots.map((slot) => {
                    const startFormatted = slot.startTime.substring(0, 5);
                    const endFormatted = slot.endTime.substring(0, 5);
                    return (
                      <option key={slot.startTime} value={startFormatted}>
                        {startFormatted} - {endFormatted}
                      </option>
                    );
                  })}
                </>
              )}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-forest/40" />
          </div>
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

      {/* Upload Medical Document Card */}
      <div className="rounded-2xl border border-emerald-900/10 bg-[#f7faf4] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className={labelCls + ' mb-0 flex items-center gap-1.5 font-bold text-forest'}>
            <FileText size={15} className="text-[#355c39]" />
            <span>Upload Medical Document (Optional)</span>
          </label>
          <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Saved to Patient Profile
          </span>
        </div>
        <p className="text-xs text-forest/65 leading-relaxed">
          Attach prior lab reports, prescriptions, or X-Rays so your consulting Ayurvedic doctor can review them before or during your consultation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[11px] font-semibold text-forest/60 block mb-1">Document Category</label>
            <div className="relative">
              <select
                className={selectCls + ' text-xs'}
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="Lab Report">Lab Report</option>
                <option value="Prescription">Prescription</option>
                <option value="Blood Report">Blood Report</option>
                <option value="X-Ray / MRI Scan">X-Ray / MRI Scan</option>
                <option value="Other">Other Medical Record</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-forest/40" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-forest/60 block mb-1">Select File (PDF, Image)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              className="w-full text-xs text-forest file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-900 hover:file:bg-emerald-200 cursor-pointer"
            />
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-emerald-200 text-emerald-950 font-medium">
            <span className="truncate">📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-rose-600 font-bold hover:underline ml-2 text-[11px] cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}
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
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] py-3.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(62,109,67,0.25)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
      >
        {loading ? 'Opening Razorpay Gateway...' : '💳 Pay ₹500 & Confirm Consultation'}
      </button>
    </form>
  </>
  );
}

function TherapyForm({ onSuccess, onSwitchToConsultation, onStatusChange }) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [hasCompletedConsultation, setHasCompletedConsultation] = useState(false);
  const [hasBooked1stTherapySession, setHasBooked1stTherapySession] = useState(false);
  const [latestConsInfo, setLatestConsInfo] = useState(null);

  const [form, setForm] = useState({ therapy: '', therapist: '', date: '', time: '', totalSessions: 1, notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [therapists, setTherapists] = useState([]);
  const [therapistsLoading, setTherapistsLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Fetch patient's doctor-prescribed treatment plans and booking history
  useEffect(() => {
    async function fetchPlansAndHistory() {
      setPlansLoading(true);
      try {
        const auth = JSON.parse(localStorage.getItem('panchakarma-auth'));
        if (auth?.userId) {
          const [plansRes, bookingsRes] = await Promise.all([
            api.get(`/treatment-plans/patient/${auth.userId}`),
            api.get('/patient/bookings').catch(() => ({ data: [] })),
          ]);

          const allBookings = bookingsRes.data || [];

          // Only keep treatment plans where booked therapy sessions are less than total prescribed sessions
          const planned = (plansRes.data || []).filter(p => {
            if (!p || p.status === 'COMPLETED' || p.status === 'CANCELLED' || p.status === 'SCHEDULED') {
              return false;
            }
            const planTherapyKey = (p.therapyName || '').toLowerCase().split(' ')[0].trim();
            const bookedSessionsForPlan = allBookings.filter(b => {
              if (b.status === 'CANCELLED' || b.bookingStatus === 'CANCELLED') return false;
              const isTherapy = b.bookingType === 'THERAPY' || b.type === 'THERAPY' || (b.therapyName && b.therapyName.length > 0);
              if (!isTherapy) return false;
              if (b.treatmentPlanId && String(b.treatmentPlanId) === String(p.id)) return true;
              const bName = (b.therapyName || b.purpose || b.notes || '').toLowerCase();
              return planTherapyKey.length > 0 && bName.includes(planTherapyKey);
            }).length;

            const totalPlanSessions = p.totalSessions || 1;
            return bookedSessionsForPlan < totalPlanSessions;
          });

          setPlans(planned);
          if (planned.length > 0) {
            setSelectedPlan(planned[0]);
            const matchedTherapy = matchTherapyType(planned[0].therapyName);
            setForm(prev => ({
              ...prev,
              therapy: matchedTherapy,
              totalSessions: planned[0].totalSessions || 7,
              therapist: planned[0].assignedTherapistId || prev.therapist,
              date: planned[0].prescribedStartDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            }));
          } else {
            setSelectedPlan(null);
          }
          const completedConsList = allBookings.filter(
            b => (b.bookingType === 'CONSULTATION' || b.type === 'CONSULTATION') &&
                 (b.bookingStatus === 'COMPLETED' || b.status === 'COMPLETED' || b.bookingStatus === 'CONFIRMED')
          );
          const activeTherapyBookings = allBookings.filter(
            b => (b.bookingType === 'THERAPY' || b.type === 'THERAPY') &&
                 (b.bookingStatus !== 'CANCELLED' && b.status !== 'CANCELLED') &&
                 (b.bookingStatus !== 'COMPLETED' && b.status !== 'COMPLETED')
          );

          let isBooked = false;
          if (completedConsList.length > 0) {
            setHasCompletedConsultation(true);
            const latestCons = completedConsList[0];
            const consDate = new Date(latestCons.createdAt || latestCons.date);
            const therapyAfterCons = activeTherapyBookings.filter(tb => {
              const tbDate = new Date(tb.createdAt || tb.date);
              return tbDate >= consDate || tb.sessionNumber === 1 || tb.totalSessions >= 1;
            });
            if (therapyAfterCons.length > 0) {
              isBooked = true;
            }
          } else if (activeTherapyBookings.length > 0) {
            isBooked = true;
          }

          setHasBooked1stTherapySession(isBooked);
          if (onStatusChange) onStatusChange(isBooked);

          if (completedConsList.length > 0) {
            const latestCons = completedConsList[0];
            const adviceText = (latestCons.patientAdvice || latestCons.sessionNotes || latestCons.purpose || latestCons.notes || '').toLowerCase();
            const doctorName = latestCons.therapistName || latestCons.assignedTo?.fullName || 'Dr. Vaidya';

            const matchedTherapy = matchTherapyType(adviceText);

            let frequencyLabel = 'Alternate Days (Every 2 Days)';
            if (adviceText.includes('once_daily') || adviceText.includes('once daily') || adviceText.includes('consecutive')) {
              frequencyLabel = 'Once Daily (Consecutive Days)';
            } else if (adviceText.includes('every_3_days') || adviceText.includes('every 3 days')) {
              frequencyLabel = 'Every 3 Days (Rest Interval)';
            } else if (adviceText.includes('weekly')) {
              frequencyLabel = 'Weekly (Once per week)';
            }

            let totalSessions = 7;
            if (adviceText.includes('1 session') || adviceText.includes('single session')) totalSessions = 1;
            else if (adviceText.includes('3 session')) totalSessions = 3;
            else if (adviceText.includes('5 session')) totalSessions = 5;
            else if (adviceText.includes('14 session')) totalSessions = 14;

            setLatestConsInfo({
              doctorName,
              detectedTherapy: matchedTherapy,
              frequencyLabel,
              totalSessions,
            });

            // Only override therapy & totalSessions from consultation notes if no treatment plan exists
            if (!planned || planned.length === 0) {
              setForm(prev => ({
                ...prev,
                therapy: matchedTherapy,
                totalSessions,
              }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch treatment plans:', err);
      } finally {
        setPlansLoading(false);
      }
    }
    fetchPlansAndHistory();
  }, []);

  // Clear errors when the form selection changes
  useEffect(() => {
    setError('');
  }, [form.therapist, form.date, form.time]);

  // Fetch slots whenever therapist, date, or websocket refetchTrigger changes
  useEffect(() => {
    async function fetchSlots() {
      if (!form.date) {
        setAvailableSlots([]);
        setForm(prev => ({ ...prev, time: '' }));
        return;
      }
      setSlotsLoading(true);
      try {
        const therapistId = form.therapist || 0;
        const response = await api.get(`/therapists/${therapistId}/availability?date=${form.date}`);
        let rawSlots = response.data || [];

        // Filter out completed/past time slots if selected date is today
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        if (form.date === todayStr) {
          const nowHours = String(now.getHours()).padStart(2, '0');
          const nowMinutes = String(now.getMinutes()).padStart(2, '0');
          const currentTimeStr = `${nowHours}:${nowMinutes}`;
          rawSlots = rawSlots.filter(s => s.startTime.substring(0, 5) > currentTimeStr);
        }

        setAvailableSlots(rawSlots);
        
        // If current selected time is not in the list of new slots, clear it and show warning
        const startTimes = rawSlots.map(s => s.startTime.substring(0, 5));
        setForm(prev => {
          if (prev.time && !startTimes.includes(prev.time)) {
            setError(`The slot at ${prev.time} is no longer available. Please select a different slot.`);
            return { ...prev, time: '' };
          }
          return prev;
        });
      } catch (err) {
        console.error("Failed to fetch available slots", err);
        setAvailableSlots([]);
        setForm(prev => ({ ...prev, time: '' }));
      } finally {
        setSlotsLoading(false);
      }
    }
    fetchSlots();
  }, [form.therapist, form.date, refetchTrigger]);

  // WebSocket listener to auto-refresh slots in real-time
  useEffect(() => {
    if (!form.date) return;

    const apiURL = api.defaults.baseURL;
    let wsURL = apiURL.replace(/^http/, 'ws');
    if (wsURL.endsWith('/api')) {
      wsURL = wsURL.substring(0, wsURL.length - 4) + '/ws/bookings';
    } else {
      wsURL = wsURL + '/ws/bookings';
    }

    const ws = new WebSocket(wsURL);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'BOOKING_UPDATE') {
          if ((!form.therapist || String(data.therapistId) === String(form.therapist)) && data.date === form.date) {
            setRefetchTrigger(prev => prev + 1);
          }
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };
    return () => ws.close();
  }, [form.therapist, form.date]);

  useEffect(() => {
    async function fetchTherapists() {
      try {
        const response = await api.get('/patient/therapists');
        setTherapists(response.data || []);
      } catch (error) {
        console.error("Failed to fetch therapists", error);
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

    if (!form.date) {
      setError('Please select a valid start date.');
      setLoading(false);
      return;
    }
    if (!form.time) {
      setError('Please select an available time slot.');
      setLoading(false);
      return;
    }

    try {
      const auth = JSON.parse(localStorage.getItem('panchakarma-auth'));

      const notifPrefs = JSON.parse(localStorage.getItem('panchakarma-notif-prefs') || '{"inAppNotif":true,"emailNotif":true}');
      const inAppNotifEnabled = notifPrefs.inAppNotif !== false;
      const emailNotifEnabled = notifPrefs.emailNotif !== false;

      const formattedTime = form.time.split(' ')[0].trim().substring(0, 5);
      const therapistIdToSubmit = (form.therapist && form.therapist !== '0') ? form.therapist : null;

      if (selectedPlan) {
        // Schedule doctor-prescribed treatment plan
        const response = await api.post(`/treatment-plans/${selectedPlan.id}/schedule`, {
          startDate: form.date,
          timeSlot: formattedTime,
          inAppNotifEnabled: inAppNotifEnabled,
          emailNotifEnabled: emailNotifEnabled,
        });
        
        const selectedTherapistObj = therapists.find(t => String(t.id) === String(response.data.assignedTherapistId || form.therapist));
        const resolvedTherapistName = selectedTherapistObj 
          ? (selectedTherapistObj.fullName || selectedTherapistObj.name) 
          : (response.data.assignedTherapistName || 'System Assigned');

        const rawTherapyName = response.data?.therapyName || selectedPlan?.therapyName || (form.therapy ? form.therapy.split(' ')[0] : 'Therapy');
        const cleanTherapyName = rawTherapyName.toLowerCase().includes('consultation') ? 'Panchakarma Therapy' : rawTherapyName;

        const adaptedBooking = {
          ...response.data,
          date: form.date,
          time: formattedTime,
          therapistName: resolvedTherapistName,
          notes: `${cleanTherapyName} — Prescribed Session`,
          bookingType: 'THERAPY'
        };
        onSuccess(adaptedBooking);
      } else {
        // Regular direct booking
        const response = await api.post('/bookings', {
          patientId: auth?.userId,
          assignedToId: therapistIdToSubmit,
          date: form.date,
          time: formattedTime,
          purpose: `${form.therapy}${form.notes ? ' — ' + form.notes : ''}`,
          bookingType: 'THERAPY',
          bookingStatus: 'PENDING',
          totalSessions: form.totalSessions,
          inAppNotifEnabled: inAppNotifEnabled,
          emailNotifEnabled: emailNotifEnabled,
        }).catch(async (err) => {
          if (err.response?.status === 403 || err.response?.status === 401) {
            return api.post('/patient/book-therapy', {
              therapyName: form.therapy,
              date: form.date,
              time: formattedTime,
              notes: form.notes,
              therapistId: therapistIdToSubmit,
            });
          }
          throw err;
        });
        onSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'An error occurred while booking. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const isPrescribed = !!selectedPlan;

  if (plansLoading) {
    return (
      <div className="py-12 text-center text-forest/60 text-xs">
        Loading your doctor-prescribed treatment plans...
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/40 p-8 text-center space-y-4 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
          <Stethoscope size={30} />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold text-amber-950">Consultation Required First to Book Therapy</h3>
          <p className="text-xs text-amber-900/80 max-w-md mx-auto leading-relaxed">
            Panchakarma therapies require a clinical evaluation and prescription from an Ayurvedic Vaidya. 
            Once a therapy cycle is completed or if you do not have an active prescription, you must consult a doctor first to receive your personalized therapy plan.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToConsultation}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#355c39] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#28472c] transition cursor-pointer"
        >
          <Stethoscope size={16} /> Book Doctor Consultation First
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {hasBooked1stTherapySession && (
        <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50 to-orange-50/70 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
            <span className="text-lg">🔒</span>
            <span>1st Therapy Session Already Booked</span>
          </div>
          <p className="text-xs text-amber-900/80 leading-relaxed">
            Only your <strong>1st therapy session</strong> after consultation is booked on this page. Subsequent therapy sessions in your treatment track are scheduled directly by your therapist.
          </p>
          <p className="text-xs text-amber-900/80 leading-relaxed">
            If you need to change your date or time slot for an existing session, you can request a reschedule under <strong>My Appointments</strong>.
          </p>
          <div className="pt-1 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/patient?tab=appointments')}
              className="rounded-xl bg-[#355c39] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#28472c] transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>📅</span> Go to My Appointments to Reschedule
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-4 ${hasBooked1stTherapySession ? 'opacity-65 pointer-events-none' : ''}`}>
        {/* Therapy Type */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls + ' mb-0'}>Therapy Type <span className="text-rose-400">*</span></label>
            {(isPrescribed || hasBooked1stTherapySession) && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                🔒 Prescribed by Doctor (Locked)
              </span>
            )}
          </div>
          <div className="relative">
            <select
              className={selectCls + ((isPrescribed || hasBooked1stTherapySession) ? ' opacity-85 cursor-not-allowed bg-sand/20 font-semibold' : '')}
              value={form.therapy}
              onChange={(e) => !isPrescribed && !hasBooked1stTherapySession && setForm({ ...form, therapy: e.target.value })}
              disabled={isPrescribed || hasBooked1stTherapySession}
              required
            >
              <option value="">Select prescribed or recommended therapy</option>
              {THERAPY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-forest/40" />
          </div>
        </div>

        {/* Therapy Track */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls + ' mb-0'}>Therapy Track <span className="text-rose-400">*</span></label>
            {(isPrescribed || hasBooked1stTherapySession) && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                🔒 Prescribed by Doctor (Locked)
              </span>
            )}
          </div>
          <div className="relative">
            <select
              className={selectCls + ((isPrescribed || hasBooked1stTherapySession) ? ' opacity-85 cursor-not-allowed bg-sand/20 font-semibold' : '')}
              value={form.totalSessions}
              onChange={(e) => !isPrescribed && !hasBooked1stTherapySession && setForm({ ...form, totalSessions: parseInt(e.target.value) })}
              disabled={isPrescribed || hasBooked1stTherapySession}
              required
            >
              <option value={1}>Single Therapy Session (1 Day)</option>
              <option value={3}>3-Session Track (Introductory)</option>
              <option value={5}>5-Session Track (Spaced over 12 Days)</option>
              <option value={7}>7-Session Panchakarma Track (Spaced over 18 Days)</option>
              <option value={14}>14-Session Healing Care Plan (Spaced over 35 Days)</option>
              {/* Dynamic fallback: show doctor-prescribed value if it doesn't match predefined options */}
              {![1, 3, 5, 7, 14].includes(Number(form.totalSessions)) && form.totalSessions > 0 && (
                <option value={form.totalSessions}>
                  {form.totalSessions}-Session Track (Prescribed by Doctor)
                </option>
              )}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-forest/40" />
          </div>
        </div>

        {/* Specialist / Therapist Selection */}
        <div>
          <label className={labelCls}>Assigned Specialist / Therapist</label>
          {selectedPlan?.assignedTherapistId || selectedPlan?.assignedTherapistName ? (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-900/10 bg-[#faf8f4] p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest/10 font-bold text-forest text-sm">
                  🌿
                </div>
                <div>
                  <p className="font-bold text-forest text-sm">
                    {selectedPlan.assignedTherapistName || `Specialist #${selectedPlan.assignedTherapistId}`}
                  </p>
                  <p className="text-[11px] text-forest/60">Doctor-assigned specialist for your treatment plan</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider border border-emerald-200">
                🔒 Assigned by Doctor
              </span>
            </div>
          ) : (
            <div className="relative">
              <select
                className={selectCls}
                value={form.therapist}
                onChange={(e) => setForm({ ...form, therapist: e.target.value })}
                disabled={hasBooked1stTherapySession}
              >
                <option value="">✨ Auto-Assign Best Available Specialist</option>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName || t.name || `Therapist #${t.id}`} {t.specialization ? `(${t.specialization})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-forest/40" />
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Preferred Start Date <span className="text-rose-400">*</span></label>
            <input
              className={inputCls}
              type="date"
              min={today}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              disabled={hasBooked1stTherapySession}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Available Time Slot <span className="text-rose-400">*</span></label>
            <div className="relative">
              <select
                className={selectCls}
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
                disabled={slotsLoading || !form.date || hasBooked1stTherapySession}
              >
                {!form.date ? (
                  <option value="">Select preferred start date first</option>
                ) : slotsLoading ? (
                  <option value="">Loading available slots...</option>
                ) : availableSlots.length === 0 ? (
                  <option value="">No slots available on this day</option>
                ) : (
                  <>
                    <option value="">Choose a slot</option>
                    {availableSlots.map((slot) => {
                      const startFormatted = slot.startTime.substring(0, 5);
                      const endFormatted = slot.endTime.substring(0, 5);
                      return (
                        <option key={slot.startTime} value={startFormatted}>
                          {startFormatted} - {endFormatted}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-forest/40" />
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || hasBooked1stTherapySession || (selectedPlan && (!form.date || !form.time))}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] py-3.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(62,109,67,0.25)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60 pointer-events-auto"
        >
          {hasBooked1stTherapySession ? '🔒 1st Session Already Booked — Reschedule via Appointments' : loading ? 'Scheduling Prescribed Plan...' : selectedPlan ? 'Confirm & Schedule Prescribed Sessions' : 'Confirm Therapy Booking'}
        </button>
      </form>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────
export default function BookSessionPage({ auth, onLogout }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'therapy' ? 'therapy' : 'consultation'
  );
  const [success, setSuccess] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [isTherapyBooked, setIsTherapyBooked] = useState(false);

  // Reset success when tab changes
  useEffect(() => {
    setSuccess(false);
    setBookingData(null);
  }, [activeTab]);

  function handleBookingSuccess(booking) {
    setBookingData(booking);
    setSuccess(true);
  }

  const tabs = [
    {
      key: 'consultation',
      label: 'Book Consultation',
      icon: Stethoscope,
      desc: 'Meet a care provider to discuss your health.',
      color: 'text-sage',
      bg: 'bg-[#e6efdf]',
    },
    {
      key: 'therapy',
      label: 'Book Therapy',
      icon: Wand2,
      desc: isTherapyBooked ? '1st session booked. Therapist schedules remaining.' : 'Schedule your doctor-prescribed therapy sessions.',
      color: 'text-[#a06a3a]',
      bg: 'bg-[#f3e4c5]',
    },
  ];

  return (
    <DashboardLayout auth={auth} onLogout={onLogout} activeTab="appointments">
      <div className="relative mx-auto max-w-2xl px-2 py-4">
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
        <div className="mb-6 grid grid-cols-2 gap-3">
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
              <div className="flex flex-col items-center">
                <span className={`text-sm font-bold ${activeTab === key ? 'text-forest' : 'text-forest/60'}`}>
                  {label}
                </span>
                {key === 'therapy' && isTherapyBooked && (
                  <span className="mt-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900 border border-amber-300">
                    🔒 1st Session Booked
                  </span>
                )}
              </div>
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
              booking={bookingData}
              onNew={() => {
                setSuccess(false);
                setBookingData(null);
              }}
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
              <ConsultationForm onSuccess={handleBookingSuccess} />
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl bg-[#f3e4c5] p-3 text-[#a06a3a]"><Wand2 size={20} /></div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-forest">Therapy Details</h2>
                  <p className="text-sm text-forest/55">Review your prescribed care details and select your preferred start date & time slot</p>
                </div>
              </div>
              <TherapyForm
                onSuccess={handleBookingSuccess}
                onSwitchToConsultation={() => setActiveTab('consultation')}
                onStatusChange={(booked) => setIsTherapyBooked(booked)}
              />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}