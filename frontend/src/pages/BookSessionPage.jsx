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
  { value: 'Abhyanga', label: 'Abhyanga' },
  { value: 'Shirodhara', label: 'Shirodhara' },
  { value: 'Virechana', label: 'Virechana' },
  { value: 'Basti', label: 'Basti' },
  { value: 'Nasya', label: 'Nasya' },
  { value: 'Udvartana', label: 'Udvartana' },
  { value: 'Vamana', label: 'Vamana' },
];

function matchTherapyType(inputName, strict = false) {
  if (!inputName) return strict ? null : THERAPY_TYPES[0].value;
  const lower = String(inputName).toLowerCase();
  if (strict && (lower.includes('pending') || lower.includes('not prescribed') || lower.includes('not booked'))) {
    return null;
  }
  const matched = THERAPY_TYPES.find(t => {
    const mainKey = t.value.split(' ')[0].toLowerCase();
    return lower.includes(mainKey);
  });
  if (matched) return matched.value;
  return strict ? null : THERAPY_TYPES[0].value;
}

const CONSULTATION_REASONS = [
  'Initial Prakriti (Dosha) Assessment & Consultation',
  'Panchakarma Detox & Therapy Follow-up',
  'Amadosha & Agni Imbalance (Digestive & Metabolic Care)',
  'Sandhigata Vata & Joint Care (Arthritis, Back & Neck Pain)',
  'Manovaha Srotas Care (Stress, Anxiety & Insomnia)',
  'Twak Roga & Skin Wellness (Psoriasis, Eczema, Allergies)',
  'Sthoulya & Medoroga (Weight & Obesity Management)',
  'Rasayana & Swasthya Vritta (Rejuvenation & Preventive Wellness)',
  'Kasa & Swasa Care (Respiratory Health & Allergies)',
  'Stri Roga & Hormonal Balance (Women\'s Health & PCOS)',
  'Post-Panchakarma Samsarjana Krama Diet Follow-up',
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

  // Medical Document Upload state (multiple files support)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documentType, setDocumentType] = useState('Lab Report');

  const handleMultipleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newItems = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      category: documentType,
    }));
    setSelectedFiles((prev) => [...prev, ...newItems]);
    e.target.value = null;
  };

  const removeSelectedFile = (idToRemove) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== idToRemove));
  };

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

      // 0. Upload Medical Documents to patient profile if files selected
      const uploadedDocsInfo = [];
      if (selectedFiles.length > 0) {
        for (const item of selectedFiles) {
          try {
            const docFormData = new FormData();
            docFormData.append('file', item.file);
            docFormData.append('documentType', item.category);
            const uploadRes = await api.post('/medical-documents/upload', docFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (uploadRes?.data) {
              uploadedDocsInfo.push(uploadRes.data);
            }
          } catch (uploadErr) {
            console.warn(`Medical document upload warning for ${item.file.name}:`, uploadErr);
          }
        }
      }

      const docNotesSummary = uploadedDocsInfo.length > 0
        ? ` [Attached ${uploadedDocsInfo.length} Medical Record(s): ${uploadedDocsInfo.map(d => `${d.documentName || 'Document'} (${d.documentType || 'Medical Record'})`).join(', ')}]`
        : (selectedFiles.length > 0 ? ` [Attached ${selectedFiles.length} Medical Record(s)]` : '');

      const appendedNotes = form.notes + docNotesSummary;

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
          email: auth?.email || '',
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
              className={`flex flex-col gap-1.5 rounded-2xl border-2 p-3.5 cursor-pointer transition ${form.consultationCategory === 'NORMAL'
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
              className={`flex flex-col gap-1.5 rounded-2xl border-2 p-3.5 cursor-pointer transition ${form.consultationCategory === 'THERAPY_RECOMMENDATION'
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

        {/* Upload Medical Document Card (Multiple Files Supported) */}
        <div className="rounded-2xl border border-emerald-900/10 bg-[#f7faf4] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className={labelCls + ' mb-0 flex items-center gap-1.5 font-bold text-forest'}>
              <FileText size={15} className="text-[#355c39]" />
              <span>Upload Medical Documents (Optional)</span>
            </label>
            <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Saved to Patient Profile
            </span>
          </div>
          <p className="text-xs text-forest/65 leading-relaxed">
            Attach prior lab reports, prescriptions, or X-Rays so your consulting Ayurvedic doctor can review them before or during your consultation. You can select and attach multiple files.
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
              <label className="text-[11px] font-semibold text-forest/60 block mb-1">Select File(s) (PDF, Image)</label>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleMultipleFilesSelect}
                className="w-full text-xs text-forest file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-900 hover:file:bg-emerald-200 cursor-pointer"
              />
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-emerald-900/10">
              <div className="flex items-center justify-between text-[11px] font-bold text-forest/70 uppercase tracking-wider">
                <span>Attached Documents ({selectedFiles.length}):</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-rose-600 hover:underline cursor-pointer lowercase font-normal"
                >
                  clear all
                </button>
              </div>
              <div className="space-y-1.5">
                {selectedFiles.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-emerald-200 text-emerald-950 font-medium shadow-2xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="truncate">📄 {item.file.name} ({(item.file.size / 1024).toFixed(1)} KB)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(item.id)}
                      className="text-rose-600 font-bold hover:underline text-[11px] cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
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
  const [hasOngoingTherapy, setHasOngoingTherapy] = useState(false);
  const [ongoingTherapyInfo, setOngoingTherapyInfo] = useState(null);
  const [latestConsInfo, setLatestConsInfo] = useState(null);
  const [isRebooking, setIsRebooking] = useState(false);

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
          const [plansRes, bookingsRes, journeyRes] = await Promise.all([
            api.get(`/treatment-plans/patient/${auth.userId}`).catch(() => ({ data: [] })),
            api.get('/patient/bookings').catch(() => ({ data: [] })),
            api.get('/patient/treatment-journey').catch(() => ({ data: null })),
          ]);

          const allBookings = bookingsRes.data || [];
          const rawPlans = (plansRes.data || []).sort((a, b) => (b.id || 0) - (a.id || 0));

          const isTherapyBooking = (b) => {
            if (!b) return false;
            const typeStr = (b.bookingType || b.type || '').toUpperCase();
            if (typeStr === 'CONSULTATION') return false;
            const purposeStr = (b.purpose || b.notes || '').toLowerCase();
            if (purposeStr.includes('consultation') || purposeStr.includes('consult')) return false;
            if (typeStr === 'THERAPY') return true;
            if (b.sessionNumber != null && Number(b.sessionNumber) > 0) return true;
            if (b.packageId && String(b.packageId).length > 0) return true;
            if (purposeStr.includes('session') || purposeStr.includes('therapy track')) return true;
            return false;
          };

          // Filter treatment plans where booked therapy sessions are less than total prescribed sessions
          const planned = rawPlans.filter(p => {
            if (!p || p.status === 'COMPLETED' || p.status === 'CANCELLED') {
              return false;
            }
            const planTherapyKey = (p.therapyName || '').toLowerCase().split(' ')[0].trim();
            const bookedSessionsForPlan = allBookings.filter(b => {
              if (b.status === 'CANCELLED' || b.bookingStatus === 'CANCELLED') return false;
              if (!isTherapyBooking(b)) return false;
              if (b.treatmentPlanId && String(b.treatmentPlanId) === String(p.id)) return true;
              const bName = (b.therapyName || b.purpose || b.notes || '').toLowerCase();
              return planTherapyKey.length > 0 && bName.includes(planTherapyKey);
            }).length;

            const totalPlanSessions = p.totalSessions || 1;
            return bookedSessionsForPlan < totalPlanSessions;
          });

          setPlans(planned);
          let activePlanObj = planned.length > 0 ? planned[0] : null;

          const completedConsList = allBookings.filter(b => {
            const typeStr = (b.bookingType || b.type || '').toUpperCase();
            const statusStr = (b.bookingStatus || b.status || '').toUpperCase();
            return (typeStr === 'CONSULTATION' || b.purpose?.toLowerCase().includes('consultation')) &&
              (statusStr === 'COMPLETED' || statusStr === 'CONFIRMED' || statusStr === 'PENDING');
          });

          // Fallback 1: If no formal plan in DB table, check Treatment Journey response for prescribed nodes
          if (!activePlanObj && journeyRes?.data?.cycles?.length > 0) {
            for (const cycle of journeyRes.data.cycles) {
              const planNode = cycle.nodes?.find(n => n.type === 'THERAPY_PLAN');
              if (planNode && planNode.therapyName && !planNode.therapyName.toLowerCase().includes('pending')) {
                const matchedTherapy = matchTherapyType(planNode.therapyName, true);
                const isNodeDone = planNode.status === 'COMPLETED';
                if (!isNodeDone && matchedTherapy) {
                  activePlanObj = {
                    id: planNode.treatmentPlanId || null,
                    therapyName: matchedTherapy,
                    totalSessions: planNode.totalSessions != null ? Number(planNode.totalSessions) : 7,
                    assignedTherapistName: planNode.assignedTherapist || 'Assigned Doctor',
                    assignedTherapistId: null,
                    prescribedStartDate: planNode.firstSessionDate !== 'Not Booked Yet' ? planNode.firstSessionDate : null,
                    status: 'PLANNED',
                  };
                  break;
                }
              }
            }
          }

          // Fallback 2: If still no plan, check completed consultation notes for explicitly prescribed therapy recommendation
          if (!activePlanObj && completedConsList.length > 0) {
            const latestCons = completedConsList[0];
            const adviceText = (latestCons.patientAdvice || latestCons.sessionNotes || latestCons.notes || '').toLowerCase();
            const matchedTherapy = matchTherapyType(adviceText, true);

            if (matchedTherapy) {
              const doctorName = latestCons.therapistName || latestCons.assignedTo?.fullName || 'Attending Specialist';
              let totalSessions = 7;
              if (adviceText.includes('1 session') || adviceText.includes('single session')) totalSessions = 1;
              else if (adviceText.includes('3 session')) totalSessions = 3;
              else if (adviceText.includes('5 session')) totalSessions = 5;
              else if (adviceText.includes('14 session')) totalSessions = 14;

              activePlanObj = {
                id: null,
                therapyName: matchedTherapy,
                totalSessions: totalSessions,
                assignedTherapistName: doctorName,
                assignedTherapistId: latestCons.assignedToId || latestCons.assignedTo?.id || null,
                status: 'PLANNED',
                consultationBookingId: latestCons.bookingId || latestCons.id || null,
              };
            }
          }

          setSelectedPlan(activePlanObj);

          if (activePlanObj) {
            const matchedTherapy = matchTherapyType(activePlanObj.therapyName);
            setForm(prev => ({
              ...prev,
              therapy: matchedTherapy,
              totalSessions: activePlanObj.totalSessions != null ? Number(activePlanObj.totalSessions) : 7,
              therapist: activePlanObj.assignedTherapistId || prev.therapist,
              date: activePlanObj.prescribedStartDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            }));
          }

          const activeTherapyBookings = allBookings.filter(b => {
            if (b.bookingStatus === 'CANCELLED' || b.status === 'CANCELLED') return false;
            if (b.bookingStatus === 'COMPLETED' || b.status === 'COMPLETED') return false;
            const typeStr = String(b.bookingType || b.type || '').toUpperCase();
            return typeStr === 'THERAPY';
          });

          const completedCount = allBookings.filter(b => {
            const typeStr = String(b.bookingType || b.type || '').toUpperCase();
            return typeStr === 'THERAPY' && (b.bookingStatus === 'COMPLETED' || b.status === 'COMPLETED');
          }).length;
          const totalSessions = activePlanObj?.totalSessions || 3;

          // Therapy is ongoing ONLY if active uncompleted therapy bookings exist AND total sessions have not been completed
          const isOngoing = activeTherapyBookings.length > 0 && completedCount < totalSessions;
          setHasOngoingTherapy(isOngoing);

          if (isOngoing) {
            const topBooking = activeTherapyBookings[0];
            const rawTherapy = activePlanObj?.therapyName || topBooking?.therapyName || topBooking?.purpose || 'Panchakarma Therapy';
            const therapistName = activePlanObj?.assignedTherapistName || topBooking?.therapistName || topBooking?.assignedTo?.fullName || 'Assigned Specialist';

            setOngoingTherapyInfo({
              therapyName: matchTherapyType(rawTherapy),
              therapistName,
              totalSessions,
              completedSessionsCount: completedCount,
            });
          } else {
            setOngoingTherapyInfo(null);
          }

          let isBooked = false;
          if (activePlanObj && activePlanObj.id) {
            const bookedForSelectedPlan = allBookings.filter(b => {
              if (b.status === 'CANCELLED' || b.bookingStatus === 'CANCELLED') return false;
              const typeStr = String(b.bookingType || b.type || '').toUpperCase();
              if (typeStr !== 'THERAPY') return false;
              if (b.treatmentPlanId && String(b.treatmentPlanId) === String(activePlanObj.id)) return true;
              const purposeStr = (b.purpose || b.notes || '').toLowerCase();
              const planTherapyKey = (activePlanObj.therapyName || '').toLowerCase().split(' ')[0].trim();
              return purposeStr.includes('prescribed session') && planTherapyKey.length > 0 && purposeStr.includes(planTherapyKey);
            });
            if (bookedForSelectedPlan.length > 0) {
              isBooked = true;
            }
          }

          setHasBooked1stTherapySession(isBooked);
          if (onStatusChange) onStatusChange(isOngoing || isBooked);

          if (completedConsList.length > 0) {
            const latestCons = completedConsList[0];
            const adviceText = (latestCons.patientAdvice || latestCons.sessionNotes || latestCons.purpose || latestCons.notes || '').toLowerCase();
            const doctorName = latestCons.therapistName || latestCons.assignedTo?.fullName || 'Attending Specialist';

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

  // Auto-resolve assigned therapist ID from selected plan therapist name
  useEffect(() => {
    if (selectedPlan && therapists.length > 0 && !form.therapist) {
      let resolvedId = selectedPlan.assignedTherapistId;
      if (!resolvedId && selectedPlan.assignedTherapistName) {
        const planNameClean = (selectedPlan.assignedTherapistName || '').toLowerCase().replace('dr.', '').trim();
        const matchedT = therapists.find(t => {
          const tName = (t.fullName || t.name || '').toLowerCase();
          return tName.includes(planNameClean) || planNameClean.includes(tName);
        });
        if (matchedT) resolvedId = matchedT.id;
      }
      if (resolvedId) {
        setForm(prev => ({ ...prev, therapist: resolvedId }));
      }
    }
  }, [selectedPlan, therapists]);

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
        let therapistId = form.therapist || selectedPlan?.assignedTherapistId;
        if (!therapistId && selectedPlan?.assignedTherapistName && therapists.length > 0) {
          const planNameClean = (selectedPlan.assignedTherapistName || '').toLowerCase().replace('dr.', '').trim();
          const matchedT = therapists.find(t => {
            const tName = (t.fullName || t.name || '').toLowerCase();
            return tName.includes(planNameClean) || planNameClean.includes(tName);
          });
          if (matchedT) therapistId = matchedT.id;
        }
        if (!therapistId) therapistId = 0;

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
  }, [form.therapist, form.date, selectedPlan, therapists, refetchTrigger]);

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
        let responseData = null;
        if (selectedPlan.id) {
          const response = await api.post(`/treatment-plans/${selectedPlan.id}/schedule`, {
            startDate: form.date,
            timeSlot: formattedTime,
            inAppNotifEnabled: inAppNotifEnabled,
            emailNotifEnabled: emailNotifEnabled,
          });
          responseData = response.data;
        } else {
          // Create treatment plan in DB first, then schedule
          const createRes = await api.post('/treatment-plans', {
            patientId: auth?.userId,
            therapyName: form.therapy || selectedPlan.therapyName,
            totalSessions: form.totalSessions || selectedPlan.totalSessions,
            frequency: '2',
            assignedTherapistId: selectedPlan.assignedTherapistId || (form.therapist && form.therapist !== '0' ? form.therapist : null),
            prescribedStartDate: form.date,
            consultationBookingId: selectedPlan.consultationBookingId || null,
          }).catch(() => null);

          if (createRes?.data?.id) {
            const response = await api.post(`/treatment-plans/${createRes.data.id}/schedule`, {
              startDate: form.date,
              timeSlot: formattedTime,
              inAppNotifEnabled: inAppNotifEnabled,
              emailNotifEnabled: emailNotifEnabled,
            });
            responseData = response.data;
          } else {
            const response = await api.post('/bookings', {
              patientId: auth?.userId,
              assignedToId: therapistIdToSubmit,
              date: form.date,
              time: formattedTime,
              purpose: `${form.therapy || selectedPlan.therapyName} — Prescribed Session`,
              bookingType: 'THERAPY',
              bookingStatus: 'CONFIRMED',
              totalSessions: form.totalSessions || selectedPlan.totalSessions,
              inAppNotifEnabled: inAppNotifEnabled,
              emailNotifEnabled: emailNotifEnabled,
            });
            responseData = response.data;
          }
        }

        const selectedTherapistObj = therapists.find(t => String(t.id) === String(responseData?.assignedTherapistId || form.therapist));
        const resolvedTherapistName = selectedTherapistObj
          ? (selectedTherapistObj.fullName || selectedTherapistObj.name)
          : (responseData?.assignedTherapistName || selectedPlan?.assignedTherapistName || 'System Assigned');

        const rawTherapyName = responseData?.therapyName || selectedPlan?.therapyName || (form.therapy ? form.therapy.split(' ')[0] : 'Therapy');
        const cleanTherapyName = rawTherapyName.toLowerCase().includes('consultation') ? 'Panchakarma Therapy' : rawTherapyName;

        const adaptedBooking = {
          ...responseData,
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

  if (hasOngoingTherapy && !selectedPlan) {
    return (
      <div className="rounded-3xl border border-amber-300/80 bg-gradient-to-br from-amber-50 to-orange-50/60 p-8 text-center space-y-5 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
          <Wand2 size={30} />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-1 text-xs font-bold text-amber-950 border border-amber-300">
            🔒 Therapy Track In Progress
          </div>
          <h3 className="font-display text-xl font-bold text-amber-950">
            Previous Therapy is Not Completed Yet to Book Another Therapy
          </h3>
          <p className="text-xs text-amber-900/80 max-w-md mx-auto leading-relaxed">
            Your current <strong>{ongoingTherapyInfo?.therapyName || 'Panchakarma Therapy'}</strong> track ({ongoingTherapyInfo?.completedSessionsCount || 0} / {ongoingTherapyInfo?.totalSessions || 1} sessions completed) is not completed yet. 
            Please complete your current therapy track before booking a new therapy.
          </p>
        </div>

        {ongoingTherapyInfo && (
          <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-white/80 p-4 text-left space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs border-b border-amber-100 pb-2">
              <span className="font-bold text-forest/70 uppercase tracking-wider text-[10px]">Active Therapy Track</span>
              <span className="font-semibold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md text-[11px]">
                {ongoingTherapyInfo.therapyName}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-forest/60 block text-[10px] uppercase font-bold">Assigned Specialist</span>
                <span className="font-semibold text-forest">{ongoingTherapyInfo.therapistName}</span>
              </div>
              <div>
                <span className="text-forest/60 block text-[10px] uppercase font-bold">Session Progress</span>
                <span className="font-semibold text-forest">{ongoingTherapyInfo.completedSessionsCount} / {ongoingTherapyInfo.totalSessions} Sessions</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onSwitchToConsultation}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#355c39] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#28472c] transition cursor-pointer"
          >
            <Stethoscope size={16} /> Book Doctor Consultation First
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/patient?tab=appointments')}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-white px-5 py-2.5 text-xs font-bold text-amber-950 shadow-xs hover:bg-amber-50 transition cursor-pointer"
          >
            <CalendarDays size={15} /> View My Appointments
          </button>
        </div>
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
            <span>Therapy Session Already Booked</span>
          </div>
          <p className="text-xs text-amber-900/80 leading-relaxed">
            Your therapy session for this plan has already been scheduled. To change your appointment date or time, visit <strong>My Appointments</strong>.
          </p>
          <p className="text-xs text-amber-900/80 leading-relaxed">
            To book another therapy cycle, a doctor consultation and new prescription are required first.
          </p>
          <div className="pt-1 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSwitchToConsultation}
              className="rounded-xl bg-[#355c39] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#28472c] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Stethoscope size={15} /> Book Doctor Consultation First
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/patient?tab=appointments')}
              className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-bold text-amber-950 shadow-xs hover:bg-amber-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>📅</span> Go to My Appointments
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
                🔒 Prescribed
              </span>
            )}
          </div>
          <div className="relative">
            <select
              className={selectCls + ((isPrescribed || hasBooked1stTherapySession) ? ' opacity-85 cursor-not-allowed bg-sand/20 font-semibold' : '')}
              value={form.therapy}
              onChange={(e) => setForm({ ...form, therapy: e.target.value })}
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
                🔒 Prescribed
              </span>
            )}
          </div>
          <div className="relative">
            <select
              className={selectCls + ((isPrescribed || hasBooked1stTherapySession) ? ' opacity-85 cursor-not-allowed bg-sand/20 font-semibold' : '')}
              value={form.totalSessions}
              onChange={(e) => setForm({ ...form, totalSessions: parseInt(e.target.value) })}
              disabled={isPrescribed || hasBooked1stTherapySession}
              required
            >
              <option value={1}>1 Session</option>
              <option value={3}>3 Sessions</option>
              <option value={5}>5 Sessions</option>
              <option value={7}>7 Sessions</option>
              <option value={14}>14 Sessions</option>
              {/* Dynamic fallback: show doctor-prescribed value if it doesn't match predefined options */}
              {![1, 3, 5, 7, 14].includes(Number(form.totalSessions)) && form.totalSessions > 0 && (
                <option value={form.totalSessions}>
                  {form.totalSessions} Sessions
                </option>
              )}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-forest/40" />
          </div>
        </div>

        {/* Specialist / Therapist Selection */}
        <div>
          <label className={labelCls}>Assigned Specialist / Therapist</label>
          {selectedPlan ? (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-900/10 bg-[#faf8f4] p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest/10 font-bold text-forest text-sm">
                  🩺
                </div>
                <div>
                  <p className="font-semibold text-forest text-xs mt-0.5">
                    Assigned Therapist: {selectedPlan.assignedTherapistName || `Specialist #${selectedPlan.assignedTherapistId || 'Auto-Assigned'}`}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider border border-emerald-200">
                🔒 Prescribed
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] py-3.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(62,109,67,0.25)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60 pointer-events-auto cursor-pointer"
        >
          {hasBooked1stTherapySession ? '🔒 Session Already Booked — Book Doctor Consultation First' : loading ? 'Scheduling Prescribed Plan...' : selectedPlan ? 'Confirm & Schedule Prescribed Sessions' : 'Confirm Therapy Booking'}
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
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tabs.map(({ key, label, icon: Icon, desc, color, bg }) => (
            <button
              key={key}
              id={`tab-${key}`}
              onClick={() => { setActiveTab(key); setSuccess(false); }}
              className={`flex items-center sm:flex-col gap-3.5 sm:gap-2 rounded-2xl sm:rounded-3xl border-2 p-3.5 sm:p-5 text-left sm:text-center transition-all duration-200 ${activeTab === key
                ? 'border-sage bg-white shadow-[0_8px_32px_rgba(90,133,83,0.15)]'
                : 'border-transparent bg-white/60 hover:bg-white/90'
                }`}
            >
              <span className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl ${bg} ${color}`}>
                <Icon size={22} />
              </span>
              <div className="flex-1 flex flex-col sm:items-center min-w-0">
                <div className="flex items-center gap-2 flex-wrap sm:justify-center">
                  <span className={`text-sm font-bold ${activeTab === key ? 'text-forest' : 'text-forest/70'}`}>
                    {label}
                  </span>
                  {key === 'therapy' && isTherapyBooked && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 border border-amber-300">
                      🔒 1st Session Booked
                    </span>
                  )}
                </div>
                <span className={`text-xs leading-5 mt-0.5 ${activeTab === key ? 'text-forest/70' : 'text-forest/45'}`}>
                  {desc}
                </span>
              </div>
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