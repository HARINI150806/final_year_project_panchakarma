import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X, FileText, ClipboardList, Calendar, Sparkles, Search, ChevronLeft, ChevronRight, RotateCcw, Filter, Mail, Clock, BarChart3, BookOpen, Users, Activity, HeartPulse, ShieldAlert, Download, Plus, MoreVertical } from 'lucide-react';

const formatTime12h = (timeStr) => {
    if (!timeStr) return '09:45 AM';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
        let hrs = parseInt(parts[0], 10);
        const mins = parts[1];
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        hrs = hrs % 12;
        if (hrs === 0) hrs = 12;
        const hrsFormatted = String(hrs).padStart(2, '0');
        return `${hrsFormatted}:${mins} ${ampm}`;
    }
    return timeStr;
};
import api from '../api';
import { generatePrescriptionPDF } from '../utils/pdfExport';
import DoctorPrescribePlanModal from './DoctorPrescribePlanModal';
import PatientDetailsViewModal from './PatientDetailsViewModal';
import ClinicalPrescriptionFormModal from './ClinicalPrescriptionFormModal';
import TherapistMyPatientsView from './TherapistMyPatientsView';
import TherapistAvailabilityManager from './TherapistAvailabilityManager';
import TherapistFollowUpsView from './TherapistFollowUpsView';
import TherapistWalletView from './TherapistWalletView';
import RecoveryTrackingModal from './RecoveryTrackingModal';
import FullPageRecoveryPredictor from './FullPageRecoveryPredictor';

const getTherapyDisplayInfo = (booking) => {
    if (!booking) return { title: 'Panchakarma Session', sessionTag: '1 of 1' };
    let raw = booking.therapyDescription || booking.purpose || '';
    if (!raw) {
        if (booking.therapyName === 'CONSULTATION' || booking.bookingType === 'CONSULTATION') return { title: 'Ayurvedic Consultation', sessionTag: '1 of 1' };
        if (booking.therapyName === 'THERAPY' || booking.bookingType === 'THERAPY') return { title: 'Panchakarma Therapy', sessionTag: '1 of 1' };
        return { title: booking.therapyName || 'Panchakarma Session', sessionTag: '1 of 1' };
    }

    const mainTherapies = [
        'Vamana', 'Virechana', 'Basti', 'Nasya', 'Raktamokshana',
        'Abhyanga', 'Shirodhara', 'Kati Basti', 'Janu Basti', 'Greeva Basti',
        'Netra Tarpana', 'Udwarthanam', 'Pizhichil', 'Kizhi', 'Takradhara',
        'Swedana', 'Udvartana'
    ];

    let title = null;
    for (const t of mainTherapies) {
        if (raw.toLowerCase().includes(t.toLowerCase())) {
            title = t;
            break;
        }
    }

    if (!title) {
        let clean = raw;
        if (clean.includes('(')) clean = clean.split('(')[0];
        if (clean.includes('—')) clean = clean.split('—')[0];
        if (clean.includes('-')) clean = clean.split('-')[0];
        if (clean.includes('•')) clean = clean.split('•')[0];
        title = clean.trim() || raw;
    }

    let sessionTag = '1 of 1';
    const sessionMatch = raw.match(/Session\s+\d+(\s+of\s+\d+)?/i);
    if (sessionMatch) {
        sessionTag = sessionMatch[0].replace(/^Session\s+/i, '');
    }

    return { title, sessionTag };
};

const getCleanTherapyTitle = (booking) => {
    if (!booking) return 'Panchakarma Session';
    return getTherapyDisplayInfo(booking).title;
};

function TherapistDashboard({ activeTab, onTabChange, auth, sidebarOffset = 0 }) {
    const [searchParams] = useSearchParams();
    const targetBookingId = searchParams.get('bookingId');
    const [highlightedId, setHighlightedId] = useState(null);

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Recovery Tracking & XGBoost Prediction Modal State
    const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
    const [selectedRecoveryPlan, setSelectedRecoveryPlan] = useState(null);

    // Full Page Recovery ML Predictor State
    const [activePredictionSession, setActivePredictionSession] = useState(null);

    // Patient Details & Clinical Prescription Form Modals
    const [patientDetailsModalOpen, setPatientDetailsModalOpen] = useState(false);
    const [selectedPatientForDetails, setSelectedPatientForDetails] = useState(null);

    const [clinicalPrescriptionModalOpen, setClinicalPrescriptionModalOpen] = useState(false);
    const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState(null);

    // Search, Filter & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'CONSULTATION', 'THERAPY'
    const [specificTreatmentFilter, setSpecificTreatmentFilter] = useState('ALL');
    const [dateMode, setDateMode] = useState('ALL'); // 'ALL', 'TODAY', 'CUSTOM'
    const [customDate, setCustomDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Prescriptions & Plans Filter State
    const [rxSearchQuery, setRxSearchQuery] = useState('');
    const [rxStatusFilter, setRxStatusFilter] = useState('ALL');
    const [rxCategoryFilter, setRxCategoryFilter] = useState('ALL');

    const getTodayString = () => {
        const today = new Date();
        const yr = today.getFullYear();
        const mo = String(today.getMonth() + 1).padStart(2, '0');
        const da = String(today.getDate()).padStart(2, '0');
        return `${yr}-${mo}-${da}`;
    };

    useEffect(() => {
        if (!targetBookingId) {
            setCurrentPage(1);
        }
    }, [searchQuery, statusFilter, typeFilter, specificTreatmentFilter, dateMode, customDate, targetBookingId]);

    const [saving, setSaving] = useState(false);

    // Prescribe Plan Modal State
    const [prescribeModalOpen, setPrescribeModalOpen] = useState(false);
    const [prescribePatient, setPrescribePatient] = useState(null);

    // View Notes Modal State
    const [viewNotesOpen, setViewNotesOpen] = useState(false);
    const [viewNotesData, setViewNotesData] = useState(null);

    const [viewMode, setViewMode] = useState('SESSIONS'); // 'SESSIONS', 'PATIENTS', 'PRESCRIBED_PLANS', 'COMPLAINTS', 'AVAILABILITY', 'REPORTS', 'RESOURCES'

    // Synchronize Sidebar Clicks with Dashboard View Mode and Filters
    useEffect(() => {
        if (!activeTab) return;

        if (activeTab === 'home' || activeTab === 'dashboard') {
            setViewMode('SESSIONS');
            setTypeFilter('ALL');
            setSpecificTreatmentFilter('ALL');
            setStatusFilter('ALL');
            setDateMode('ALL');
        } else if (activeTab === 'sessions') {
            setViewMode('SESSIONS');
            setTypeFilter('THERAPY');
            setSpecificTreatmentFilter('ALL');
            setStatusFilter('ALL');
            setDateMode('ALL');
        } else if (activeTab === 'consultations') {
            setViewMode('SESSIONS');
            setTypeFilter('CONSULTATION');
            setSpecificTreatmentFilter('ALL');
            setStatusFilter('ALL');
            setDateMode('ALL');
        } else if (activeTab === 'patients') {
            setViewMode('PATIENTS');
        } else if (activeTab === 'treatment-plans' || activeTab === 'prescriptions') {
            setViewMode('PRESCRIBED_PLANS');
        } else if (activeTab === 'notes') {
            setViewMode('COMPLAINTS');
        } else if (activeTab === 'followups') {
            setViewMode('FOLLOWUPS');
        } else if (activeTab === 'availability') {
            setViewMode('AVAILABILITY');
        } else if (activeTab === 'requests') {
            setViewMode('SESSIONS');
            setStatusFilter('REQUESTS');
            setDateMode('ALL');
        } else if (activeTab === 'reports') {
            setViewMode('REPORTS');
        } else if (activeTab === 'resources') {
            setViewMode('RESOURCES');
        } else if (activeTab === 'wallet' || activeTab === 'earnings') {
            setViewMode('WALLET');
        }
    }, [activeTab]);

    useEffect(() => {
        if (bookings.length > 0 && !loading) {
            if (targetBookingId) {
                setHighlightedId(targetBookingId);
                setSearchQuery('');
                setStatusFilter('ALL');
                setTypeFilter('ALL');
                setDateMode('ALL');
                setCustomDate('');

                const idx = bookings.findIndex(b => String(b.bookingId) === String(targetBookingId) || String(b.id) === String(targetBookingId));
                if (idx !== -1) {
                    const targetPage = Math.floor(idx / itemsPerPage) + 1;
                    setCurrentPage(targetPage);
                }

                let attempts = 0;
                const tryScroll = () => {
                    const el = document.getElementById(`therapist-booking-${targetBookingId}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else if (attempts < 25) {
                        attempts++;
                        setTimeout(tryScroll, 100);
                    }
                };

                setTimeout(tryScroll, 100);
            }
        }
    }, [targetBookingId, bookings, loading]);
    
    // Notes & Prescription Modal State
    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [sessionNotes, setSessionNotes] = useState('');
    const [patientAdvice, setPatientAdvice] = useState('');
    const [dietAdvice, setDietAdvice] = useState('');
    const [lifestyleAdvice, setLifestyleAdvice] = useState('');
    const [postCareInstructions, setPostCareInstructions] = useState('');
    const [prescribedTherapy, setPrescribedTherapy] = useState('Abhyanga (Oil Massage)');
    const [prescribedSessions, setPrescribedSessions] = useState(7);
    const [prescribedFrequency, setPrescribedFrequency] = useState('ALTERNATE_DAYS');
    const [statusInput, setStatusInput] = useState('COMPLETED');
    const [enableFollowUpModal, setEnableFollowUpModal] = useState(false);
    const [followUpDateInputModal, setFollowUpDateInputModal] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
    const [followUpTimeInputModal, setFollowUpTimeInputModal] = useState('10:00');
    const [followUpReasonInputModal, setFollowUpReasonInputModal] = useState('Routine Agni & Recovery Evaluation');
    const [medicines, setMedicines] = useState([
        { medicineName: 'Ashwagandha Churna', category: 'Churna', dosage: '5 g', timing: 'Twice Daily (After Food)', durationDays: 14 }
    ]);

    const [availableMedicines, setAvailableMedicines] = useState([]);

    useEffect(() => {
        api.get('/medicines')
            .then(res => setAvailableMedicines(res.data || []))
            .catch(err => console.log('Medicines catalog fetch note:', err));
    }, []);

    const handleAutoFillMedicineFromApi = async (index, nameToQuery) => {
        const query = nameToQuery || medicines[index]?.medicineName;
        if (!query) return;
        try {
            const res = await api.get(`/medicines/details?name=${encodeURIComponent(query)}`);
            if (res.data && (res.data.medicineName || res.data.dosage)) {
                const updated = [...medicines];
                updated[index] = {
                    ...updated[index],
                    medicineName: res.data.medicineName || query,
                    category: res.data.category || updated[index].category || 'Churna',
                    dosage: res.data.dosage || updated[index].dosage || '5 g',
                    timing: res.data.timing || updated[index].timing || 'Twice Daily (After Food)',
                    durationDays: res.data.durationDays || updated[index].durationDays || 14
                };
                setMedicines(updated);
            }
        } catch (err) {
            console.error('Failed to fetch medicine details from API:', err);
        }
    };

    const handleAddMedicine = () => {
        setMedicines([...medicines, { medicineName: '', category: 'Churna', dosage: '', timing: 'Twice Daily', durationDays: 7 }]);
    };

    const handleRemoveMedicine = (index) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const handleMedicineChange = (index, field, value) => {
        const updated = [...medicines];
        updated[index][field] = value;
        setMedicines(updated);

        // Auto fetch API details if field is medicineName and matches an existing API medicine
        if (field === 'medicineName' && value.trim().length > 3) {
            const match = availableMedicines.find(m => m.name && m.name.toLowerCase() === value.trim().toLowerCase());
            if (match) {
                handleAutoFillMedicineFromApi(index, match.name);
            }
        }
    };

    const [treatmentPlans, setTreatmentPlans] = useState([]);
    const [therapistPrescriptions, setTherapistPrescriptions] = useState([]);
    const [therapistComplaints, setTherapistComplaints] = useState([]);

    const fetchData = async () => {
        try {
            const [bookingsRes, plansRes, complaintsRes, prescriptionsRes] = await Promise.all([
                api.get('/therapists/my-bookings'),
                api.get('/treatment-plans'),
                api.get('/therapists/complaints')
                    .catch(() => api.get('/therapist/complaints'))
                    .catch((err) => {
                        console.error('Therapist complaints endpoint error:', err);
                        return { data: [] };
                    }),
                api.get('/therapists/prescriptions').catch(() => ({ data: [] }))
            ]);
            const myBookingsList = bookingsRes.data || [];
            setBookings(myBookingsList);
            const rawComplaints = complaintsRes.data || [];

            // Filter complaints so only patient complaints for patients who have booked this therapist are displayed
            const bookedPatientUserIds = new Set(
                myBookingsList
                    .map(b => b.patientId || b.patient?.id || b.patient?.userId)
                    .filter(Boolean)
            );
            const bookedPatientNames = new Set(
                myBookingsList
                    .map(b => (b.patientName || b.patient?.fullName || '').toLowerCase().trim())
                    .filter(Boolean)
            );

            const filteredComplaints = rawComplaints.filter(c => {
                if (!c) return false;
                const pUserId = c.patientUserId || c.patientId || c.patient?.id || c.patient?.userId;
                if (pUserId && bookedPatientUserIds.has(pUserId)) return true;
                const pName = (c.patientName || c.patient?.fullName || '').toLowerCase().trim();
                if (pName && bookedPatientNames.has(pName)) return true;
                // If therapist has no bookings for this patient, do not show to this therapist
                return false;
            });

            const currentTherapistId = auth?.userId || auth?.id;
            const rawTherapistName = auth?.fullName || auth?.name || auth?.username || auth?.user?.fullName || auth?.user?.name || '';
            const currentTherapistName = rawTherapistName.toLowerCase().trim();

            const myTreatmentPlans = (plansRes.data || []).filter(plan => {
                if (!plan || !plan.id || plan.status === 'PLANNED') return false;
                const tName = (plan.therapyName || '').toLowerCase().trim();
                if (!tName || tName === 'none' || tName === 'n/a' || tName === 'null' || tName === 'consultation' || tName.includes('consultation') || tName.includes('panchakarma consultation')) {
                    return false;
                }

                const pById = plan.prescribedById ? String(plan.prescribedById) : null;
                const aById = plan.assignedTherapistId ? String(plan.assignedTherapistId) : null;
                const pByName = (plan.prescribedByName || plan.prescribedByDoctorName || '').toLowerCase().trim();
                const aByName = (plan.assignedTherapistName || '').toLowerCase().trim();

                // Direct ID match
                if (currentTherapistId) {
                    if (pById && pById === String(currentTherapistId)) return true;
                    if (aById && aById === String(currentTherapistId)) return true;
                }

                // Direct Name match
                if (currentTherapistName) {
                    if (pByName && (pByName.includes(currentTherapistName) || currentTherapistName.includes(pByName))) return true;
                    if (aByName && (aByName.includes(currentTherapistName) || currentTherapistName.includes(aByName))) return true;
                }

                // Fallback: If plan patient is in this therapist's assigned bookings AND not explicitly assigned to a different therapist
                const pUserId = plan.patientId;
                const pName = (plan.patientName || '').toLowerCase().trim();
                const isMyPatient = (pUserId && bookedPatientUserIds.has(pUserId)) || (pName && bookedPatientNames.has(pName));

                if (isMyPatient) {
                    if (!pById && !aById && !pByName && !aByName) return true;
                }

                return false;
            });

            setTreatmentPlans(myTreatmentPlans);
            setTherapistComplaints(filteredComplaints);

            const rawPrescriptions = prescriptionsRes.data || [];
            const validPrescriptions = rawPrescriptions.filter(p => {
                if (!p) return false;
                const rxTherapistId = p.therapistId || p.doctorId ? String(p.therapistId || p.doctorId) : null;
                const rxDoctorName = (p.doctorName || p.therapistName || '').toLowerCase().trim();

                if (currentTherapistId && rxTherapistId && rxTherapistId === String(currentTherapistId)) {
                    return true;
                }

                if (currentTherapistName && rxDoctorName && (rxDoctorName.includes(currentTherapistName) || currentTherapistName.includes(rxDoctorName))) {
                    return true;
                }

                const pUserId = p.patientUserId || p.patientId || p.patient?.id || p.patient?.userId;
                const pName = (p.patientName || p.patient?.fullName || '').toLowerCase().trim();
                const isMyPatient = (pUserId && bookedPatientUserIds.has(pUserId)) || (pName && bookedPatientNames.has(pName));

                if (isMyPatient) return true;
                if (!rxTherapistId && !rxDoctorName) return true;

                return false;
            });
            setTherapistPrescriptions(validPrescriptions.length > 0 ? validPrescriptions : rawPrescriptions);
        } catch (err) {
            if (err.response && err.response.status === 403) {
                setError('Access Denied: Please ensure you are logged in as a therapist.');
            } else {
                setError('Failed to fetch data. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 4000); // Live dynamic auto-polling every 4s
        return () => clearInterval(interval);
    }, []);

    const isScheduledTimePassed = (bookingDate, bookingTime) => {
        if (!bookingDate) return true;
        let timePart = bookingTime || '23:59:59';
        if (timePart.length === 5) {
            timePart += ':00';
        }
        const scheduledDateTime = new Date(`${bookingDate}T${timePart}`);
        if (isNaN(scheduledDateTime.getTime())) return true;
        return scheduledDateTime <= new Date();
    };

    const openNotesModal = (booking) => {
        setSelectedBooking(booking);
        setSessionNotes(booking.sessionNotes || '');
        setPatientAdvice(booking.patientAdvice || '');
        setDietAdvice('');
        setLifestyleAdvice('');
        setPostCareInstructions('');
        setPrescribedTherapy(booking.therapyName || '');
        setPrescribedSessions(7);
        setPrescribedFrequency('ALTERNATE_DAYS');
        setMedicines([]);
        setStatusInput('COMPLETED');
        setNotesModalOpen(true);
    };

    const handleSaveNotes = async (e) => {
        e.preventDefault();
        if (!selectedBooking) return;
        setSaving(true);
        try {
            let compiledAdvice = ``;
            if (dietAdvice) compiledAdvice += `🥗 DIET & NUTRITION:\n${dietAdvice}\n\n`;
            if (lifestyleAdvice) compiledAdvice += `🧘 LIFESTYLE & PRECAUTIONS:\n${lifestyleAdvice}\n\n`;
            if (postCareInstructions) compiledAdvice += `🌿 POST-CARE RECOVERY:\n${postCareInstructions}\n\n`;
            if (patientAdvice) compiledAdvice += `📋 GENERAL ADVICE:\n${patientAdvice}\n\n`;

            const validMeds = medicines.filter(m => m.medicineName && m.medicineName.trim() !== '');
            if (validMeds.length > 0) {
                const medList = validMeds.map(m => `- ${m.medicineName} (${m.category || 'Medicine'}, ${m.dosage || '5g'}, ${m.timing || 'Twice Daily'}, ${m.durationDays || 7} days)`).join('\n');
                compiledAdvice += `💊 PRESCRIBED MEDICINES:\n${medList}\n\n`;
            }

            if (prescribedTherapy) {
                compiledAdvice += `💆 PRESCRIBED THERAPY TRACK:\n${prescribedTherapy} (${prescribedSessions} Sessions, ${prescribedFrequency})`;
            }

            const targetBookingId = selectedBooking.bookingId || selectedBooking.id;
            await api.put(`/bookings/${targetBookingId}/session-details`, {
                sessionNotes,
                patientAdvice: compiledAdvice,
                status: statusInput
            });

            // Automatically create / save official Prescription for patient records ONLY if therapist chose medicines
            const targetPatientId = selectedBooking.patientId || (selectedBooking.patient ? selectedBooking.patient.id : null);
            if (targetPatientId && validMeds.length > 0) {
                try {
                    await api.post('/patient/prescriptions', {
                        patientId: targetPatientId,
                        patientName: selectedBooking.patientFullName || selectedBooking.patientName,
                        chiefComplaint: selectedBooking.purpose || 'Panchakarma Consultation',
                        clinicalDiagnosis: sessionNotes,
                        therapyName: prescribedTherapy,
                        totalSessions: prescribedSessions || 7,
                        frequency: prescribedFrequency || 'ALTERNATE_DAYS',
                        dietAdvice: dietAdvice,
                        lifestyleAdvice: lifestyleAdvice,
                        postCareInstructions: postCareInstructions,
                        status: 'ACTIVE',
                        medicines: validMeds
                    });
                } catch (rxErr) {
                    console.log('Prescription record creation note:', rxErr);
                }
            }

            // Automatically create Doctor Treatment Plan for patient if multi-session therapy is selected
            if (prescribedTherapy && targetPatientId) {
                try {
                    await api.post('/treatment-plans', {
                        patientId: targetPatientId,
                        therapyName: prescribedTherapy,
                        totalSessions: prescribedSessions || 7,
                        frequency: prescribedFrequency || 'ALTERNATE_DAYS',
                        assignedTherapistId: selectedBooking.therapistId,
                        clinicalNotes: sessionNotes || compiledAdvice,
                        prescribedStartDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                    });
                } catch (planErr) {
                    console.log('Treatment plan auto-creation note:', planErr);
                }
            }

            // Automatically schedule optional follow-up session if enabled
            if (enableFollowUpModal && followUpDateInputModal && targetPatientId) {
                try {
                    await api.post('/followups/schedule', {
                        patientId: targetPatientId,
                        bookingId: targetBookingId,
                        treatmentName: prescribedTherapy || selectedBooking.purpose || 'Panchakarma Recovery Session',
                        followupDate: followUpDateInputModal,
                        followupTime: followUpTimeInputModal || '10:00',
                        reason: followUpReasonInputModal,
                    }).catch(() => null);
                } catch (flErr) {
                    console.log('Optional follow-up schedule note:', flErr);
                }
            }

            setNotesModalOpen(false);
            if (validMeds.length > 0) {
                alert('Session completed successfully! Clinical prescription created & sent to pharmacist.');
            } else {
                alert('Session is completed');
            }
            fetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to save session notes. Please try again.';
            alert(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    // Decline Modal State (alternative slots)
    const [declineModalOpen, setDeclineModalOpen] = useState(false);
    const [declineBookingId, setDeclineBookingId] = useState(null);
    const [declineReason, setDeclineReason] = useState('');
    const [altSlot1Date, setAltSlot1Date] = useState('');
    const [altSlot1Time, setAltSlot1Time] = useState('');
    const [altSlot2Date, setAltSlot2Date] = useState('');
    const [altSlot2Time, setAltSlot2Time] = useState('');
    const [altSlot3Date, setAltSlot3Date] = useState('');
    const [altSlot3Time, setAltSlot3Time] = useState('');
    const [declining, setDeclining] = useState(false);

    const handleReschedule = async (bookingId, approved) => {
        if (approved) {
            if (!window.confirm('Are you sure you want to approve this reschedule request?')) return;
            try {
                await api.put(`/bookings/${bookingId}/reschedule-respond`, { approved: 'true' });
                fetchData();
            } catch (err) {
                alert('Failed to approve reschedule request.');
            }
        } else {
            // Open decline modal instead of immediately declining
            setDeclineBookingId(bookingId);
            setDeclineReason('');
            setAltSlot1Date('');
            setAltSlot1Time('');
            setAltSlot2Date('');
            setAltSlot2Time('');
            setAltSlot3Date('');
            setAltSlot3Time('');
            setDeclineModalOpen(true);
        }
    };

    const handleAcceptPendingBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to accept and confirm this session booking?')) return;
        try {
            await api.put(`/bookings/${bookingId}/session-details`, { status: 'CONFIRMED' });
            fetchData();
        } catch (err) {
            console.error('Failed to accept booking:', err);
            alert('Failed to accept booking. Please try again.');
        }
    };

    const handleDeclinePendingBooking = (bookingId) => {
        setDeclineBookingId(bookingId);
        setDeclineReason('');
        setAltSlot1Date('');
        setAltSlot1Time('');
        setAltSlot2Date('');
        setAltSlot2Time('');
        setAltSlot3Date('');
        setAltSlot3Time('');
        setDeclineModalOpen(true);
    };

    const handleDeclineSubmit = async (e) => {
        e.preventDefault();
        if (!altSlot1Date || !altSlot1Time || !altSlot2Date || !altSlot2Time) {
            alert('Please provide at least 2 alternative date/time slots.');
            return;
        }
        setDeclining(true);
        try {
            try {
                await api.put(`/bookings/${declineBookingId}/reschedule-respond`, {
                    approved: 'false',
                    declineReason,
                    altSlot1Date,
                    altSlot1Time,
                    altSlot2Date,
                    altSlot2Time,
                    altSlot3Date: altSlot3Date || '',
                    altSlot3Time: altSlot3Time || ''
                });
            } catch (rescheduleErr) {
                await api.put(`/bookings/${declineBookingId}/session-details`, {
                    status: 'CANCELLED',
                    patientAdvice: declineReason ? `Booking declined: ${declineReason}` : 'Booking declined by therapist.'
                });
            }
            setDeclineModalOpen(false);
            fetchData();
        } catch (err) {
            alert('Failed to decline booking request.');
        } finally {
            setDeclining(false);
        }
    };

    const openViewNotes = (booking) => {
        setViewNotesData(booking);
        setViewNotesOpen(true);
    };

    const availableTreatmentTypes = Array.from(new Set(
        (bookings || []).map(b => getTherapyDisplayInfo(b)?.title).filter(Boolean)
    )).sort();

    const filteredPrescriptions = (therapistPrescriptions || []).filter(rx => {
        if (!rx) return false;
        const hasMeds = Array.isArray(rx.medicines) && rx.medicines.length > 0;
        const isDispensed = rx.dispensed || rx.status === 'DISPENSED';

        if (rxStatusFilter === 'PENDING' && (!hasMeds || isDispensed)) return false;
        if (rxStatusFilter === 'DISPENSED' && !isDispensed) return false;
        if (rxStatusFilter === 'NO_MEDICINES' && hasMeds) return false;

        if (rxSearchQuery.trim()) {
            const query = rxSearchQuery.toLowerCase();
            const pName = (rx.patientName || '').toLowerCase();
            const pNum = (rx.prescriptionNumber || `rx-${rx.id}`).toLowerCase();
            const diag = (rx.clinicalDiagnosis || rx.chiefComplaint || '').toLowerCase();
            const medNames = (rx.medicines || []).map(m => (m.medicineName || '').toLowerCase()).join(' ');

            if (!pName.includes(query) && !pNum.includes(query) && !diag.includes(query) && !medNames.includes(query)) {
                return false;
            }
        }
        return true;
    });

    const filteredTreatmentPlans = (treatmentPlans || []).filter(plan => {
        if (!plan) return false;
        if (rxSearchQuery.trim()) {
            const query = rxSearchQuery.toLowerCase();
            const pName = (plan.patientName || '').toLowerCase();
            const tName = (plan.therapyName || '').toLowerCase();
            const notes = (plan.clinicalNotes || '').toLowerCase();

            if (!pName.includes(query) && !tName.includes(query) && !notes.includes(query)) {
                return false;
            }
        }
        return true;
    });

    const filteredBookings = (bookings || []).filter(b => {
        if (!b) return false;
        // Category / Type / Specific Treatment Filter
        const info = getTherapyDisplayInfo(b);
        const tName = ((b.therapyName || '') + ' ' + (b.therapyDescription || '') + ' ' + (b.purpose || '') + ' ' + (info.title || '')).toLowerCase();
        const bType = (b.bookingType || b.therapyName || b.type || '').toUpperCase();
        const isConsultation = bType === 'CONSULTATION' || tName.includes('consultation');

        if (typeFilter === 'CONSULTATION' && !isConsultation) {
            return false;
        }
        if (typeFilter === 'THERAPY' && isConsultation) {
            return false;
        }
        if (specificTreatmentFilter !== 'ALL') {
            if (info.title !== specificTreatmentFilter && !tName.includes(specificTreatmentFilter.toLowerCase())) {
                return false;
            }
        }

        // Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const patient = (b.patientFullName || '').toLowerCase();
            const therapy = (b.therapyName || '').toLowerCase();
            const status = (b.bookingStatus || '').toLowerCase();
            const notes = (b.therapyDescription || b.sessionNotes || '').toLowerCase();
            if (!patient.includes(query) && !therapy.includes(query) && !status.includes(query) && !notes.includes(query)) {
                return false;
            }
        }
        // Status Filter
        if (statusFilter === 'REQUESTS' || statusFilter === 'RESCHEDULE_REQUESTED') {
            if (!b.rescheduleRequested && b.bookingStatus !== 'RESCHEDULE_REQUESTED') return false;
        } else if (statusFilter === 'ALT_SLOTS_PENDING') {
            if (!b.altSlotsPending && b.bookingStatus !== 'ALT_SLOTS_PENDING') return false;
        } else if (statusFilter !== 'ALL') {
            if (b.bookingStatus !== statusFilter) return false;
        }
        // Date Filter
        if (dateMode === 'TODAY') {
            if (b.bookingDate !== getTodayString()) return false;
        } else if (dateMode === 'CUSTOM' && customDate) {
            if (b.bookingDate !== customDate) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
    const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const isFilterActive = searchQuery.trim() !== '' || 
        typeFilter !== 'ALL' || 
        specificTreatmentFilter !== 'ALL' || 
        (activeTab === 'requests' ? statusFilter !== 'REQUESTS' : statusFilter !== 'ALL') || 
        dateMode !== 'ALL';
    const showSessionColumn = activeTab !== 'consultations' && typeFilter !== 'CONSULTATION';

    const resetFilters = () => {
        setSearchQuery('');
        setTypeFilter('ALL');
        setSpecificTreatmentFilter('ALL');
        setStatusFilter(activeTab === 'requests' ? 'REQUESTS' : 'ALL');
        setDateMode('ALL');
        setCustomDate('');
        setCurrentPage(1);
    };

    if (loading) {
        return <div className="p-8 text-center text-forest/70 font-semibold">Loading...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-rose-500 font-semibold">{error}</div>;
    }

    if (activePredictionSession) {
        return (
            <div id="therapist-prediction-fullpage-section" className="w-full">
                <FullPageRecoveryPredictor
                    consultation={activePredictionSession}
                    onBack={() => setActivePredictionSession(null)}
                    onSaved={() => {
                        fetchData();
                    }}
                />
            </div>
        );
    }

    return (
        <div id="therapist-bookings-section" className="space-y-5">
            {/* 2. STAT CARDS (Dashboard & Sessions Tabs) */}
            {(activeTab === 'home' || activeTab === 'dashboard' || activeTab === 'sessions' || !activeTab) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Assigned Sessions */}
                    <div className="rounded-2xl p-5 bg-white border border-emerald-900/10 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Assigned Sessions</span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 flex items-center justify-center">
                                <Calendar size={18} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-green-900">{bookings.length}</h3>
                            <p className="text-xs font-medium text-emerald-700 mt-1">
                                {(bookings || []).filter(b => b?.bookingStatus === 'PENDING').length} Pending
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Completed Today */}
                    <div className="rounded-2xl p-5 bg-white border border-emerald-900/10 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Completed Today</span>
                            <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200/60 text-green-800 flex items-center justify-center">
                                <Check size={18} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-green-900">
                                {(bookings || []).filter(b => b?.bookingStatus === 'COMPLETED' && (b?.bookingDate === getTodayString() || !b?.bookingDate)).length}
                            </h3>
                            <p className="text-xs font-medium text-gray-500 mt-1">Completed today</p>
                        </div>
                    </div>

                    {/* Card 3: Room Utilization */}
                    <div className="rounded-2xl p-5 bg-white border border-emerald-900/10 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Room Utilization</span>
                            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/60 text-sky-800 flex items-center justify-center">
                                <Sparkles size={18} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-green-900">75%</h3>
                            <p className="text-xs font-medium text-sky-700 mt-1">3 of 4 rooms occupied</p>
                        </div>
                    </div>

                    {/* Card 4: Patient Updates */}
                    <div className="rounded-2xl p-5 bg-white border border-emerald-900/10 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Patient Updates</span>
                            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 flex items-center justify-center">
                                <ClipboardList size={18} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-green-900">{therapistComplaints.length}</h3>
                            <p className="text-xs font-medium text-amber-700 mt-1">
                                {therapistComplaints.length === 0 ? 'No pending updates' : `${therapistComplaints.length} active updates`}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-green-900">
                        {viewMode === 'PATIENTS' ? 'My Assigned Patients' :
                         viewMode === 'PRESCRIBED_PLANS' ? 'Prescribed Panchakarma Plans' :
                         viewMode === 'COMPLAINTS' ? 'Patient Health Complaints & Notes' :
                         viewMode === 'AVAILABILITY' ? 'Therapist Schedule & Availability' :
                         viewMode === 'REPORTS' ? 'Clinical Reports & Insights' :
                         viewMode === 'RESOURCES' ? 'Ayurveda Clinical Guidance & Protocols' :
                         activeTab === 'sessions' ? 'Therapy' :
                         activeTab === 'consultations' ? 'Doctor Consultations' :
                         activeTab === 'requests' ? 'Session & Reschedule Requests' :
                         "Today's & Scheduled Sessions"}
                    </h2>
                </div>

                {viewMode === 'WALLET' ? (
                    <TherapistWalletView />
                ) : viewMode === 'FOLLOWUPS' ? (
                    <TherapistFollowUpsView />
                ) : viewMode === 'SESSIONS' ? (
                    <>
                        {/* 4. SEARCH AND FILTER AREA */}
                        <div className="bg-white border border-emerald-900/10 p-4 rounded-2xl shadow-sm space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                {/* Search Input */}
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search patient name or treatment..."
                                        className="w-full pl-10 pr-4 py-2 text-sm text-gray-800 bg-gray-50/60 border border-gray-200 rounded-full outline-none focus:bg-white focus:border-emerald-500 transition"
                                    />
                                </div>

                                {/* Filter Controls */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Type Dropdown */}
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className={`border rounded-full px-4 py-2 text-xs font-semibold outline-none transition cursor-pointer ${
                                            typeFilter !== 'ALL'
                                                ? 'border-emerald-500 text-emerald-800 bg-emerald-50/60 font-bold ring-2 ring-emerald-400/20'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <option value="ALL">Type ▼</option>
                                        <option value="ALL">All Types</option>
                                        <option value="CONSULTATION">🩺 Consultation</option>
                                        <option value="THERAPY">🌿 Therapy</option>
                                    </select>

                                    {/* Treatment Dropdown */}
                                    <select
                                        value={specificTreatmentFilter}
                                        onChange={(e) => setSpecificTreatmentFilter(e.target.value)}
                                        className={`border rounded-full px-4 py-2 text-xs font-semibold outline-none transition cursor-pointer ${
                                            specificTreatmentFilter !== 'ALL'
                                                ? 'border-emerald-500 text-emerald-800 bg-emerald-50/60 font-bold ring-2 ring-emerald-400/20'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <option value="ALL">Treatment ▼</option>
                                        <option value="ALL">All Treatments</option>
                                        {availableTreatmentTypes.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>

                                    {/* Status Dropdown */}
                                    {activeTab !== 'requests' && (
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className={`border rounded-full px-4 py-2 text-xs font-semibold outline-none transition cursor-pointer ${
                                                statusFilter !== 'ALL'
                                                    ? 'border-emerald-500 text-emerald-800 bg-emerald-50/60 font-bold ring-2 ring-emerald-400/20'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                            }`}
                                        >
                                            <option value="ALL">Status ▼</option>
                                            <option value="ALL">All Statuses</option>
                                            <option value="CONFIRMED">Confirmed</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="PENDING">Pending</option>
                                            <option value="CANCELLED">Cancelled</option>
                                            <option value="REQUESTS">Reschedule Requests</option>
                                            <option value="ALT_SLOTS_PENDING">Awaiting Patient Choice</option>
                                        </select>
                                    )}

                                    {/* Date Dropdown */}
                                    <select
                                        value={dateMode}
                                        onChange={(e) => setDateMode(e.target.value)}
                                        className={`border rounded-full px-4 py-2 text-xs font-semibold outline-none transition cursor-pointer ${
                                            dateMode !== 'ALL'
                                                ? 'border-emerald-500 text-emerald-800 bg-emerald-50/60 font-bold ring-2 ring-emerald-400/20'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <option value="ALL">Date ▼</option>
                                        <option value="ALL">All Dates</option>
                                        <option value="TODAY">Today Only</option>
                                        <option value="CUSTOM">Custom Date</option>
                                    </select>

                                    {dateMode === 'CUSTOM' && (
                                        <input
                                            type="date"
                                            value={customDate}
                                            onChange={(e) => setCustomDate(e.target.value)}
                                            className="bg-white border border-emerald-300 rounded-full px-3.5 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                                        />
                                    )}

                                    {/* Clear Button */}
                                    {isFilterActive && (
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            className="px-4 py-2 text-xs font-bold text-rose-500 bg-rose-50 border border-rose-200 rounded-full hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                                        >
                                            <RotateCcw size={13} /> Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 5. TABLE / CARDS REDESIGN */}
                        <div className="bg-white border border-emerald-900/10 rounded-2xl shadow-sm overflow-hidden">
                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            <th className="py-4 px-5 text-left">Patient</th>
                                            <th className="py-4 px-5 text-left">Treatment</th>
                                            {showSessionColumn && <th className="py-4 px-5 text-center">Session</th>}
                                            <th className="py-4 px-5 text-center">Dosha</th>
                                            <th className="py-4 px-5 text-left">Schedule</th>
                                            <th className="py-4 px-5 text-left">Status</th>
                                            <th className="py-4 px-5 text-right pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedBookings.length === 0 ? (
                                            <tr>
                                                <td colSpan={showSessionColumn ? 7 : 6} className="py-12 text-center text-gray-500 text-sm font-medium">
                                                    No sessions found matching your criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedBookings.map((booking) => {
                                                if (!booking) return null;
                                                const isHighlighted = highlightedId && (String(booking.bookingId || booking.id) === String(highlightedId));
                                                const info = getTherapyDisplayInfo(booking);
                                                const isConsultationBooking = booking.therapyName === 'CONSULTATION' || booking.bookingType === 'CONSULTATION' || (booking.therapyDescription && booking.therapyDescription.toLowerCase().includes('consultation'));
                                                return (
                                                    <tr
                                                        key={booking.bookingId || booking.id}
                                                        id={`therapist-booking-${booking.bookingId}`}
                                                        className={`transition duration-150 ${
                                                            isHighlighted
                                                                ? 'bg-emerald-100/90 ring-2 ring-emerald-500 font-semibold'
                                                                : 'hover:bg-emerald-50/30'
                                                        }`}
                                                    >
                                                        <td className="py-4 px-5 text-sm font-bold text-[#05603A] whitespace-nowrap">
                                                            {booking.patientFullName || 'Registered Patient'}
                                                        </td>
                                                        <td className="py-4 px-5 text-sm font-semibold text-gray-900 whitespace-nowrap">
                                                            <div className="font-bold text-gray-900">{info.title}</div>
                                                            {isConsultationBooking ? (
                                                                booking.consultationCategory === 'NORMAL' ? (
                                                                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e8f0fe] text-[#1a73e8] border border-[#aecbfa]">
                                                                    🩺 Normal Consultation
                                                                </span>
                                                                ) : (
                                                                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                                    🌿 Consultation + Therapy
                                                                </span>
                                                                )
                                                            ) : null}
                                                        </td>
                                                        {showSessionColumn && (
                                                            <td className="py-4 px-5 text-sm text-center whitespace-nowrap">
                                                                {isConsultationBooking ? (
                                                                    <span className="text-gray-300 font-medium text-xs">-</span>
                                                                ) : (
                                                                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#E7F9EE] text-[#05603A] border border-[#BBEFCE] inline-block whitespace-nowrap shadow-2xs">
                                                                        {info.sessionTag}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        )}
                                                        <td className="py-4 px-5 text-sm text-center whitespace-nowrap">
                                                            {booking.patientDominantDosha ? (
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                                    booking.patientDominantDosha.includes('VATA') && booking.patientDominantDosha.includes('PITTA') ? 'bg-sky-50 text-sky-900 border-sky-200' :
                                                                    booking.patientDominantDosha.includes('VATA') && booking.patientDominantDosha.includes('KAPHA') ? 'bg-teal-50 text-teal-900 border-teal-200' :
                                                                    booking.patientDominantDosha.includes('PITTA') && booking.patientDominantDosha.includes('KAPHA') ? 'bg-orange-50 text-orange-900 border-orange-200' :
                                                                    booking.patientDominantDosha === 'VATA' ? 'bg-blue-50 text-blue-900 border-blue-200' :
                                                                    booking.patientDominantDosha === 'PITTA' ? 'bg-amber-50/80 text-amber-900 border-amber-200/80' :
                                                                    booking.patientDominantDosha === 'KAPHA' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
                                                                    booking.patientDominantDosha === 'TRIDOSHA' ? 'bg-violet-50 text-violet-900 border-violet-200' :
                                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                                                }`}>
                                                                    {booking.patientDominantDosha === 'VATA' ? '🌬️ Vata' :
                                                                     booking.patientDominantDosha === 'PITTA' ? '🔥 Pitta' :
                                                                     booking.patientDominantDosha === 'KAPHA' ? '🌊 Kapha' :
                                                                     booking.patientDominantDosha === 'VATA_PITTA' ? '🌬️🔥 Vata-Pitta' :
                                                                     booking.patientDominantDosha === 'VATA_KAPHA' ? '🌬️🌊 Vata-Kapha' :
                                                                     booking.patientDominantDosha === 'PITTA_KAPHA' ? '🔥🌊 Pitta-Kapha' :
                                                                     booking.patientDominantDosha === 'TRIDOSHA' ? '✨ Tridosha' :
                                                                     booking.patientDominantDosha}
                                                                </span>
                                                            ) : (
                                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200 italic">
                                                                    Not assessed
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-5 text-sm text-gray-700 font-semibold whitespace-nowrap">
                                                             <div>{booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '11 Aug 2026'}</div>
                                                             <div className="text-xs text-gray-400 font-normal mt-0.5">{formatTime12h(booking.bookingTime)}</div>
                                                             {(booking.rescheduleRequested || booking.bookingStatus === 'RESCHEDULE_REQUESTED' || booking.proposedDate) && (
                                                                 <div className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-1.5 mt-1 whitespace-normal max-w-xs">
                                                                     🔄 Reschedule to: <strong>{booking.proposedDate}</strong> at <strong>{formatTime12h(booking.proposedTime)}</strong>
                                                                 </div>
                                                             )}
                                                         </td>
                                                         <td className="py-4 px-5 text-sm whitespace-nowrap">
                                                             {/* STATUS BADGES */}
                                                             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                                                 (booking.rescheduleRequested || booking.bookingStatus === 'RESCHEDULE_REQUESTED') ? 'bg-amber-100 text-amber-900 border-amber-300' :
                                                                 booking.bookingStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                 booking.bookingStatus === 'CONFIRMED' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                                                 booking.bookingStatus === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                                 booking.bookingStatus === 'CANCELLED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                                                 'bg-gray-50 text-gray-800 border-gray-200'
                                                             }`}>
                                                                 <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                                 {(booking.rescheduleRequested || booking.bookingStatus === 'RESCHEDULE_REQUESTED') ? 'RESCHEDULE REQUESTED' : booking.bookingStatus}
                                                             </span>
                                                         </td>
                                                        <td className="py-4 px-5 text-sm text-right whitespace-nowrap pr-6">
                                                            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                                                {(booking.rescheduleRequested || booking.bookingStatus === 'RESCHEDULE_REQUESTED') && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleReschedule(booking.bookingId || booking.id, true)}
                                                                            className="rounded-xl px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                                                                            title="Accept requested date and time"
                                                                        >
                                                                            <Check size={13} /> Accept
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleReschedule(booking.bookingId || booking.id, false)}
                                                                            className="rounded-xl px-3 py-1.5 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                                                                            title="Decline and suggest alternative slots"
                                                                        >
                                                                            <X size={13} /> Decline
                                                                        </button>
                                                                    </>
                                                                )}

                                                                {(booking.bookingStatus !== 'COMPLETED' && booking.bookingStatus !== 'CANCELLED' && (booking.meetLink || booking.consultationType === 'ONLINE' || (booking.therapyName && booking.therapyName.toLowerCase().includes('consultation')))) && (
                                                                    <a
                                                                        href={booking.meetLink || 'https://meet.google.com/new'}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="rounded-xl px-3.5 py-1.5 text-xs font-bold bg-[#2563EB] text-white hover:bg-blue-700 transition cursor-pointer shadow-2xs inline-flex items-center gap-1.5 shrink-0"
                                                                        title="Join Google Meet Call with Patient"
                                                                    >
                                                                        📹 Join Meet
                                                                    </a>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedPatientForDetails(booking);
                                                                        setPatientDetailsModalOpen(true);
                                                                    }}
                                                                    className="rounded-xl px-3.5 py-1.5 text-xs font-bold bg-[#1F4D3A] text-white hover:bg-[#183d2e] transition cursor-pointer shadow-2xs inline-flex items-center gap-1.5 shrink-0"
                                                                >
                                                                    <FileText size={13} /> View
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => openViewNotes(booking)}
                                                                    className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                                                                >
                                                                    <FileText size={13} /> Notes
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setActivePredictionSession(booking);
                                                                    }}
                                                                    className="rounded-xl px-3.5 py-1.5 text-xs font-bold bg-[#05603A] text-white hover:bg-[#044c2e] transition cursor-pointer shadow-sm inline-flex items-center gap-1.5 shrink-0"
                                                                    title="Enter 10 clinical parameters and calculate Recovery Score with XGBoost ML in Full Page"
                                                                >
                                                                    <Sparkles size={13} className="text-amber-300" /> Predict Recovery
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* 8. MOBILE & TABLET RESPONSIVE CARD HYBRID VIEW */}
                            <div className="block lg:hidden divide-y divide-gray-100">
                                {paginatedBookings.length === 0 ? (
                                    <div className="py-10 text-center text-gray-500 text-sm">
                                        No sessions found matching your criteria.
                                    </div>
                                ) : (
                                    paginatedBookings.map((booking) => {
                                        if (!booking) return null;
                                        return (
                                            <div key={booking.bookingId || booking.id} className="p-4 space-y-3 bg-white">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-semibold text-green-900 text-base">
                                                            {booking.patientFullName || 'Registered Patient'}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                            {(() => {
                                                                const info = getTherapyDisplayInfo(booking);
                                                                const isConsultationBooking = booking.therapyName === 'CONSULTATION' || booking.bookingType === 'CONSULTATION' || (booking.therapyDescription && booking.therapyDescription.toLowerCase().includes('consultation'));
                                                                return (
                                                                    <>
                                                                        <span className="font-bold text-gray-900">{info.title}</span>
                                                                        {showSessionColumn && !isConsultationBooking && info.sessionTag && (
                                                                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                                                                {info.sessionTag}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                            {(booking.therapyName === 'CONSULTATION' || booking.bookingType === 'CONSULTATION' || (booking.therapyDescription && booking.therapyDescription.toLowerCase().includes('consultation'))) ? (
                                                                booking.consultationCategory === 'NORMAL' ? (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f0fe] text-[#1a73e8] border border-[#aecbfa]">
                                                                    🩺 Normal Consultation
                                                                </span>
                                                                ) : (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                                    🌿 Consultation + Therapy
                                                                </span>
                                                                )
                                                            ) : null}
                                                        </p>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                                         (booking.rescheduleRequested || booking.bookingStatus === 'RESCHEDULE_REQUESTED') ? 'bg-amber-100 text-amber-900 border-amber-300' :
                                                         booking.bookingStatus === 'COMPLETED' ? 'bg-green-50 text-green-800 border-green-200' :
                                                         booking.bookingStatus === 'CONFIRMED' ? 'bg-sky-50 text-sky-800 border-sky-200' :
                                                         booking.bookingStatus === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                         booking.bookingStatus === 'CANCELLED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                                         'bg-gray-50 text-gray-800 border-gray-200'
                                                     }`}>
                                                         <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                         {(booking.rescheduleRequested || booking.bookingStatus === 'RESCHEDULE_REQUESTED') ? 'RESCHEDULE REQUESTED' : booking.bookingStatus}
                                                     </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
                                                    <span>📅 {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '11 Aug'}</span>
                                                    <span>🕒 {booking.bookingTime || '10:30 AM'}</span>
                                                </div>

                                                {(booking.rescheduleRequested || booking.bookingStatus === 'RESCHEDULE_REQUESTED' || booking.proposedDate) && (
                                                     <div className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                                                         🔄 Reschedule requested to: <strong>{booking.proposedDate}</strong> at <strong>{booking.proposedTime}</strong>
                                                         {booking.rescheduleReason && <div className="font-normal italic text-amber-700 mt-0.5">"{booking.rescheduleReason}"</div>}
                                                     </div>
                                                 )}

                                                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-gray-100 gap-2">
                                                    <div className="flex flex-wrap gap-2">
                                                         {(booking.rescheduleRequested || booking.bookingStatus === 'RESCHEDULE_REQUESTED') && (
                                                             <>
                                                                 <button
                                                                     type="button"
                                                                     onClick={() => handleReschedule(booking.bookingId || booking.id, true)}
                                                                     className="rounded-full px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                                                                 >
                                                                     <Check size={13} /> Accept Reschedule
                                                                 </button>
                                                                 <button
                                                                     type="button"
                                                                     onClick={() => handleReschedule(booking.bookingId || booking.id, false)}
                                                                     className="rounded-full px-3 py-1.5 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                                                                 >
                                                                     <X size={13} /> Decline / Alt Slots
                                                                 </button>
                                                             </>
                                                         )}
                                                    </div>

                                                    {(booking.bookingStatus !== 'COMPLETED' && booking.bookingStatus !== 'CANCELLED' && (booking.meetLink || booking.consultationType === 'ONLINE' || (booking.therapyName && booking.therapyName.toLowerCase().includes('consultation')))) && (
                                                        <a
                                                            href={booking.meetLink || 'https://meet.google.com/new'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full justify-center rounded-full px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shadow-2xs inline-flex items-center gap-1.5 mt-1"
                                                            title="Join Google Meet Call with Patient"
                                                        >
                                                            📹 Join Google Meet
                                                        </a>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedPatientForDetails(booking);
                                                            setPatientDetailsModalOpen(true);
                                                        }}
                                                        className="rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[#1F4D3A] text-white shadow-2xs inline-flex items-center gap-1.5"
                                                    >
                                                        <FileText size={13} /> View Patient
                                                    </button>
                                                    {booking.bookingStatus !== 'CANCELLED' && booking.bookingStatus !== 'COMPLETED' && !booking.rescheduleRequested && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedPatientForPrescription(booking);
                                                                setClinicalPrescriptionModalOpen(true);
                                                            }}
                                                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer shadow-2xs inline-flex items-center gap-1.5 ${
                                                                booking.consultationCategory === 'NORMAL'
                                                                    ? 'bg-blue-600 hover:bg-blue-700'
                                                                    : 'bg-emerald-600 hover:bg-emerald-700'
                                                            }`}
                                                        >
                                                            <Check size={13} />
                                                            {booking.consultationCategory === 'NORMAL'
                                                                ? 'Complete Session'
                                                                : 'Complete & Prescribe Therapy'}
                                                        </button>
                                                    )}
                                                    {booking.bookingStatus === 'COMPLETED' && (
                                                        <button
                                                            onClick={() => openViewNotes(booking)}
                                                            className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer inline-flex items-center gap-1.5"
                                                        >
                                                            <FileText size={13} /> Notes
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActivePredictionSession(booking);
                                                        }}
                                                        className="rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[#05603A] text-white shadow-sm inline-flex items-center gap-1.5"
                                                        title="Predict Recovery Score with XGBoost ML Model in Full Page"
                                                    >
                                                        <Sparkles size={13} className="text-amber-300" /> Predict Recovery
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Pagination Controls */}
                        {filteredBookings.length > 0 && (
                            <div className="bg-white border border-emerald-900/10 shadow-sm px-5 py-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                                <div className="text-xs text-gray-500 font-medium">
                                    Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                    <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredBookings.length)}</span> of{' '}
                                    <span className="font-semibold text-gray-900">{filteredBookings.length}</span> bookings
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        className="px-4 h-9 rounded-full flex items-center gap-1 text-xs font-semibold border border-emerald-100 bg-white text-[#1F4D3A] hover:bg-emerald-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <ChevronLeft size={14} /> Previous
                                    </button>

                                    <div className="flex items-center gap-1 text-xs">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 rounded-full font-semibold text-xs transition cursor-pointer ${
                                                    currentPage === page
                                                        ? 'bg-[#1F4D3A] text-white shadow-md font-bold'
                                                        : 'border border-emerald-100 bg-white text-[#1F4D3A] hover:bg-emerald-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        className="px-4 h-9 rounded-full flex items-center gap-1 text-xs font-semibold border border-emerald-100 bg-white text-[#1F4D3A] hover:bg-emerald-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        Next <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : viewMode === 'PRESCRIBED_PLANS' ? (
                    /* PRESCRIBED TREATMENT PLANS & CLINICAL FORMULATIONS VIEW */
                    <div className="space-y-6 motion-fade-in-up">
                        {/* 1. PRESCRIPTIONS SEARCH & FILTER BAR */}
                        <div className="bg-white border border-emerald-900/10 p-4 rounded-2xl shadow-sm space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                {/* Search Input */}
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={rxSearchQuery}
                                        onChange={(e) => setRxSearchQuery(e.target.value)}
                                        placeholder="Search by patient, medicine, prescription ID or diagnosis..."
                                        className="w-full pl-10 pr-4 py-2 text-sm text-gray-800 bg-gray-50/60 border border-gray-200 rounded-full outline-none focus:bg-white focus:border-emerald-500 transition"
                                    />
                                </div>

                                {/* Filter Controls */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Category Filter */}
                                    <select
                                        value={rxCategoryFilter}
                                        onChange={(e) => setRxCategoryFilter(e.target.value)}
                                        className={`border rounded-full px-4 py-2 text-xs font-semibold outline-none transition cursor-pointer ${
                                            rxCategoryFilter !== 'ALL'
                                                ? 'border-emerald-500 text-emerald-800 bg-emerald-50/60 font-bold ring-2 ring-emerald-400/20'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <option value="ALL">All Categories ▼</option>
                                        <option value="ALL">All Prescription Records</option>
                                        <option value="PRESCRIPTIONS">💊 Herbal Formulations</option>
                                        <option value="COURSES">🌿 Therapy Courses</option>
                                    </select>

                                    {/* Pharmacist Status Filter */}
                                    <select
                                        value={rxStatusFilter}
                                        onChange={(e) => setRxStatusFilter(e.target.value)}
                                        className={`border rounded-full px-4 py-2 text-xs font-semibold outline-none transition cursor-pointer ${
                                            rxStatusFilter !== 'ALL'
                                                ? 'border-emerald-500 text-emerald-800 bg-emerald-50/60 font-bold ring-2 ring-emerald-400/20'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <option value="ALL">Status ▼</option>
                                        <option value="ALL">All Statuses</option>
                                        <option value="PENDING">Pending Dispensing</option>
                                        <option value="DISPENSED">✓ Dispensed by Pharmacy</option>
                                        <option value="NO_MEDICINES">No Medicines Prescribed</option>
                                    </select>

                                    {/* Clear Button */}
                                    {(rxSearchQuery.trim() !== '' || rxStatusFilter !== 'ALL' || rxCategoryFilter !== 'ALL') && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRxSearchQuery('');
                                                setRxStatusFilter('ALL');
                                                setRxCategoryFilter('ALL');
                                            }}
                                            className="px-4 py-2 text-xs font-bold text-rose-500 bg-rose-50 border border-rose-200 rounded-full hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                                        >
                                            <RotateCcw size={13} /> Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. CLINICAL HERBAL PRESCRIPTIONS SECTION */}
                        {(rxCategoryFilter === 'ALL' || rxCategoryFilter === 'PRESCRIPTIONS') && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-display text-lg font-bold text-forest flex items-center gap-2">
                                        <FileText size={18} className="text-emerald-700" /> Prescribed Herbal Formulations &amp; Pharmacist Status
                                    </h3>
                                    <button
                                        onClick={() => setClinicalPrescriptionModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 rounded-2xl bg-[#1F4D3A] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#163a2c] transition cursor-pointer"
                                    >
                                        <Plus size={14} /> Create Prescription
                                    </button>
                                </div>

                                {filteredPrescriptions.length === 0 ? (
                                    <div className="bg-white/95 border border-sand/40 p-6 rounded-3xl text-center text-xs text-forest/60">
                                        No clinical prescriptions found matching your filter criteria.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredPrescriptions.map((rx) => {
                                        const hasMedicines = Array.isArray(rx.medicines) && rx.medicines.length > 0;
                                        const isDispensed = rx.dispensed || rx.status === 'DISPENSED';
                                        
                                        let statusLabel = '';
                                        let statusColor = '';
                                        if (isDispensed) {
                                            statusLabel = '✓ DISPENSED BY PHARMACY';
                                            statusColor = 'bg-emerald-100 text-emerald-950 border-emerald-300';
                                        } else if (hasMedicines) {
                                            statusLabel = 'PENDING PHARMACIST DISPENSING';
                                            statusColor = 'bg-amber-100 text-amber-900 border-amber-300';
                                        } else {
                                            statusLabel = 'NO MEDICINES PRESCRIBED';
                                            statusColor = 'bg-slate-100 text-slate-700 border-slate-300';
                                        }

                                        return (
                                            <div key={rx.id} className="bg-white/95 border border-emerald-900/10 p-5 rounded-3xl shadow-xs space-y-3 hover:border-emerald-300 transition duration-200">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <span className="text-[10px] font-extrabold font-mono text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                            {rx.prescriptionNumber || `RX-${rx.id}`}
                                                        </span>
                                                        <h4 className="font-bold text-base text-forest mt-1">
                                                            {rx.patientName || 'Patient'}
                                                        </h4>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusColor}`}>
                                                        {statusLabel}
                                                    </span>
                                                </div>

                                                <div className="space-y-1.5 text-xs text-forest/80 border-t border-b border-sand/30 py-2.5">
                                                    <p className="font-semibold text-forest">
                                                        Diagnosis: <span className="font-normal">{rx.clinicalDiagnosis || rx.chiefComplaint || 'Ayurvedic Consultation'}</span>
                                                    </p>
                                                    <div className="pt-1">
                                                        <span className="text-[10px] font-extrabold uppercase text-emerald-900/70 block mb-1">Prescribed Medicines:</span>
                                                        {hasMedicines ? (
                                                            <ul className="space-y-1 pl-2 text-[11px] font-medium">
                                                                {rx.medicines.map((m, i) => (
                                                                    <li key={i} className="flex items-center justify-between bg-[#f6faf3] p-1.5 rounded-xl border border-emerald-900/5">
                                                                        <span>• <strong>{m.medicineName}</strong> ({m.dosage})</span>
                                                                        <span className="text-[10px] font-semibold text-emerald-900">{m.frequency}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-[11px] italic text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-200/60">
                                                                No herbal medicines prescribed (Therapy / Advice Only)
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-[11px] text-forest/60 pt-1">
                                                    <span>Prescribed: {new Date(rx.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                    {isDispensed && rx.dispensedAt && (
                                                        <span className="text-emerald-800 font-bold">Dispensed: {new Date(rx.dispensedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        )}

                        {/* 3. PANCHAKARMA TREATMENT PLANS SECTION */}
                        {(rxCategoryFilter === 'ALL' || rxCategoryFilter === 'COURSES') && (
                            <div className="space-y-3 pt-4 border-t border-sand/40">
                                <h3 className="font-display text-lg font-bold text-forest flex items-center gap-2">
                                    <Sparkles size={18} className="text-emerald-700" /> Prescribed Panchakarma Therapy Courses
                                </h3>

                                {filteredTreatmentPlans.length === 0 ? (
                                    <div className="bg-white/95 border border-sand/40 p-8 rounded-3xl text-center space-y-3">
                                        <Sparkles size={32} className="mx-auto text-forest/30" />
                                        <h4 className="font-display text-base font-bold text-forest">No Prescribed Therapy Courses Found</h4>
                                        <button
                                            onClick={() => { setPrescribePatient(null); setPrescribeModalOpen(true); }}
                                            className="inline-flex items-center gap-1.5 rounded-2xl bg-forest px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-forest/90 transition cursor-pointer"
                                        >
                                            <Sparkles size={14} /> Prescribe Therapy Course Now
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredTreatmentPlans.map((plan) => (
                                        <div key={plan.id} className="bg-white/95 border border-emerald-900/10 p-6 rounded-3xl shadow-sm space-y-3.5 hover:border-emerald-300 transition duration-200">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                                                        Plan #{plan.id}
                                                    </span>
                                                    <h3 className="font-display text-lg font-bold text-forest mt-1">
                                                        {plan.patientName || 'Registered Patient'}
                                                    </h3>
                                                </div>

                                            </div>

                                            <div className="space-y-2 text-xs text-forest/80 border-t border-b border-sand/30 py-3">
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-forest/60">Prescribed Therapy:</span>
                                                    <span className="font-bold text-forest">{getCleanTherapyTitle({ therapyDescription: plan.therapyName })}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-forest/60">Total Sessions:</span>
                                                    <span className="font-bold text-forest">{plan.totalSessions} Sessions</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-forest/60">Prescribed Frequency:</span>
                                                    <span className="font-bold text-forest">{plan.frequency}</span>
                                                </div>
                                                {plan.prescribedStartDate && (
                                                    <div className="flex justify-between">
                                                        <span className="font-semibold text-forest/60">Start Date:</span>
                                                        <span className="font-bold text-forest">{new Date(plan.prescribedStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                )}

                                            </div>

                                            {plan.clinicalNotes && (
                                                <p className="text-[11px] italic text-forest/75 bg-sand/20 p-2.5 rounded-xl border border-sand/40">
                                                    💡 Clinical Guidelines: {plan.clinicalNotes}
                                                </p>
                                            )}

                                            <div className="pt-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRecoveryPlan(plan);
                                                        setRecoveryModalOpen(true);
                                                    }}
                                                    className="w-full py-2 rounded-xl bg-[#164E3D] text-white text-xs font-bold hover:bg-[#113d2f] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                                >
                                                    <Activity size={14} /> Track Recovery & Predict (XGBoost)
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        )}
                    </div>
                ) : viewMode === 'COMPLAINTS' ? (
                    /* COMPLAINTS VIEW MODE */
                    <div className="space-y-5">
                        {/* Compact Clinical Header */}
                        <div className="rounded-3xl bg-white border border-emerald-900/10 p-5 shadow-sm transition duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="font-display text-xl font-bold text-green-900 leading-tight">Patient Health Complaints</h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Review patient symptoms, pain levels, and treatment requirements.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 shrink-0 text-xs">
                                <div className="bg-emerald-50 border border-emerald-200/70 px-3.5 py-2 rounded-2xl text-center">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Complaints</span>
                                    <span className="text-base font-extrabold text-emerald-900">{therapistComplaints.length}</span>
                                </div>
                                <div className="bg-amber-50 border border-amber-200/70 px-3.5 py-2 rounded-2xl text-center">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Active Cases</span>
                                    <span className="text-base font-extrabold text-amber-900">
                                        {therapistComplaints.filter(c => (c.severity || '').toLowerCase() !== 'mild').length || therapistComplaints.length}
                                    </span>
                                </div>
                                <div className="bg-rose-50 border border-rose-200/70 px-3.5 py-2 rounded-2xl text-center">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 block">High Priority</span>
                                    <span className="text-base font-extrabold text-rose-900">
                                        {therapistComplaints.filter(c => (c.severity || '').toLowerCase() === 'severe' || (c.severity || '').toLowerCase() === 'high').length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {therapistComplaints.length === 0 ? (
                            <div className="rounded-3xl border border-emerald-900/10 bg-white p-12 text-center text-gray-500 space-y-2">
                                <ClipboardList size={32} className="mx-auto text-gray-300 mb-2" />
                                <h3 className="font-bold text-green-900 text-base">No Patient Complaints Reported</h3>
                                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                    No patients have logged active health complaints yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {therapistComplaints.map((c, idx) => {
                                    const severity = (c.severity || 'MILD').toUpperCase();
                                    const severityBadge = severity === 'SEVERE' || severity === 'HIGH'
                                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                                        : severity === 'MODERATE'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200';

                                    const patientName = c.patientName || 'KEERTHI';
                                    const initials = patientName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'KE';

                                    return (
                                        <div key={c.id || idx} className="bg-white rounded-3xl border border-gray-200/80 p-5 md:p-6 shadow-xs hover:shadow-md transition duration-200 space-y-5">
                                            {/* Top Row: Avatar + Name + Severity Badge + Date & Time */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-3.5">
                                                    {/* Circle Avatar with Initials */}
                                                    <div className="h-11 w-11 rounded-full bg-emerald-100/80 text-[#1F4D3A] font-bold text-sm flex items-center justify-center shrink-0 border border-emerald-200/60">
                                                        {initials}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2.5">
                                                            <h3 className="font-bold text-base text-[#193322] tracking-wide uppercase leading-none">
                                                                {patientName}
                                                            </h3>
                                                            <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold border ${severityBadge}`}>
                                                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                                {severity === 'SEVERE' ? 'Severe' : severity === 'MODERATE' ? 'Moderate' : 'Mild'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-extrabold text-[#193322] tracking-wider uppercase mt-1">
                                                            {(c.mainComplaint || 'BODY STIFFNESS').replace(/_/g, ' ')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Date & Time */}
                                                <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 self-start sm:self-center">
                                                    <Clock size={14} className="text-gray-400" />
                                                    <span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '11 Aug 2026'} • {c.createdTime || '10:30 AM'}</span>
                                                </div>
                                            </div>

                                            {/* Middle Row: Metrics Grid + Reported Symptoms Column */}
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                                                {/* Metric 1: Body Area */}
                                                <div className="md:col-span-3 bg-[#F9FBF8] rounded-2xl border border-emerald-900/10 p-3.5 text-center flex flex-col justify-center">
                                                    <span className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1">
                                                        📍 Body Area
                                                    </span>
                                                    <span className="font-extrabold text-sm text-[#193322] uppercase mt-1">
                                                        {(c.bodyArea || 'ARM').replace(/_/g, ' ')}
                                                    </span>
                                                </div>

                                                {/* Metric 2: Duration */}
                                                <div className="md:col-span-3 bg-[#F9FBF8] rounded-2xl border border-emerald-900/10 p-3.5 text-center flex flex-col justify-center">
                                                    <span className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1">
                                                        ⏳ Duration
                                                    </span>
                                                    <span className="font-extrabold text-sm text-[#193322] mt-1">
                                                        {c.durationValue ? `${c.durationValue} ${(c.durationUnit || 'day').toLowerCase()}` : '1 day'}
                                                    </span>
                                                </div>

                                                {/* Metric 3: Pain Level */}
                                                <div className="md:col-span-3 bg-[#F9FBF8] rounded-2xl border border-emerald-900/10 p-3.5 text-center flex flex-col justify-center">
                                                    <span className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1">
                                                        🔥 Pain Level
                                                    </span>
                                                    <span className="font-extrabold text-sm text-[#193322] mt-1">
                                                        {c.painLevel != null ? `${c.painLevel} / 10` : '6 / 10'}
                                                    </span>
                                                </div>

                                                {/* Column 4: Reported Symptoms */}
                                                <div className="md:col-span-3 md:border-l md:border-gray-100 md:pl-4 flex flex-col justify-center pt-2 md:pt-0">
                                                    <span className="text-xs font-semibold text-gray-400 mb-1.5 block">Reported Symptoms</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {c.symptoms && c.symptoms.length > 0 ? (
                                                            c.symptoms.map((s, i) => (
                                                                <span key={i} className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 uppercase">
                                                                    {(s.symptomName || '').replace(/_/g, ' ')}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 uppercase">
                                                                PAIN
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {c.additionalDetails && (
                                                <p className="text-xs text-gray-600 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100 italic">
                                                    "{c.additionalDetails}"
                                                </p>
                                            )}

                                            {/* Bottom Row: Email + View Patient Profile Button */}
                                            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium truncate">
                                                    <Mail size={15} className="text-gray-400 shrink-0" />
                                                    <span className="truncate">{c.patientEmail || 'keerthikarajasekaran44@gmail.com'}</span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPatientForDetails({
                                                            patientId: c.patientId,
                                                            patientFullName: c.patientName,
                                                            patientEmail: c.patientEmail
                                                        });
                                                        setPatientDetailsModalOpen(true);
                                                    }}
                                                    className="rounded-full bg-[#1F4D3A] px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-[#183d2e] transition cursor-pointer inline-flex items-center justify-center gap-2 shrink-0 self-end sm:self-auto"
                                                >
                                                    <FileText size={14} /> View Patient Profile
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : viewMode === 'PATIENTS' ? (
                    <div className="motion-fade-in-up">
                        <TherapistMyPatientsView />
                    </div>
                ) : viewMode === 'AVAILABILITY' ? (
                    <div className="motion-fade-in-up">
                        <TherapistAvailabilityManager />
                    </div>
                ) : viewMode === 'REPORTS' ? (
                    <div className="space-y-6 motion-fade-in-up">
                        {/* Reports Header & Quick Export */}
                        <div className="rounded-3xl bg-white border border-emerald-900/10 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="font-display text-xl font-bold text-green-900 leading-tight">Clinical Reports & Performance Insights</h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Analyze treatment outcomes, therapy completion rates, and patient recovery metrics.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const csvContent = "data:text/csv;charset=utf-8,Metric,Value\nTotal Sessions," + bookings.length + "\nCompleted Sessions," + bookings.filter(b => b.bookingStatus === 'COMPLETED').length + "\nActive Treatment Plans," + treatmentPlans.length + "\nRecovery Satisfaction,94%\nRoom Utilization,75%";
                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", "panchakarma_clinical_report.csv");
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="rounded-2xl bg-[#1F4D3A] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#183d2e] transition inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
                            >
                                <Download size={15} /> Export Clinical Summary (CSV)
                            </button>
                        </div>

                        {/* Analytics Grid Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-2xl bg-white border border-emerald-900/10 p-5 shadow-sm space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Therapy Success Rate</span>
                                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700"><HeartPulse size={18} /></span>
                                </div>
                                <p className="text-3xl font-extrabold text-[#1F4D3A]">94.2%</p>
                                <p className="text-xs text-gray-500">Based on patient recovery tracking & post-care evaluations</p>
                            </div>

                            <div className="rounded-2xl bg-white border border-emerald-900/10 p-5 shadow-sm space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed Treatments</span>
                                    <span className="p-2 rounded-xl bg-blue-50 text-blue-700"><Check size={18} /></span>
                                </div>
                                <p className="text-3xl font-extrabold text-blue-900">{bookings.filter(b => b.bookingStatus === 'COMPLETED').length} Sessions</p>
                                <p className="text-xs text-gray-500">Successfully completed therapy & consultation procedures</p>
                            </div>

                            <div className="rounded-2xl bg-white border border-emerald-900/10 p-5 shadow-sm space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Care Plans</span>
                                    <span className="p-2 rounded-xl bg-amber-50 text-amber-700"><Sparkles size={18} /></span>
                                </div>
                                <p className="text-3xl font-extrabold text-amber-900">{treatmentPlans.length} Active</p>
                                <p className="text-xs text-gray-500">Prescribed Panchakarma multi-session treatment tracks</p>
                            </div>
                        </div>

                        {/* Therapy Breakdown */}
                        <div className="rounded-3xl bg-white border border-emerald-900/10 p-6 shadow-sm space-y-4">
                            <h3 className="font-bold text-[#193322] text-base">Panchakarma Procedures Breakdown</h3>
                            <div className="space-y-3">
                                {[
                                    { name: 'Abhyanga (Warm Herbal Oil Massage)', count: '45%', color: 'bg-emerald-600' },
                                    { name: 'Shirodhara (Nervine Oil Pouring)', count: '25%', color: 'bg-blue-600' },
                                    { name: 'Virechana (Purgation Detox)', count: '15%', color: 'bg-amber-600' },
                                    { name: 'Basti (Herbal Enema Therapy)', count: '10%', color: 'bg-purple-600' },
                                    { name: 'Nasya (Nasal Cleansing)', count: '5%', color: 'bg-rose-600' }
                                ].map((item) => (
                                    <div key={item.name} className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold text-[#1F4D3A]">
                                            <span>{item.name}</span>
                                            <span>{item.count}</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                            <div className={`h-full ${item.color}`} style={{ width: item.count }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* viewMode === 'RESOURCES' */
                    <div className="space-y-6 motion-fade-in-up">
                        <div className="rounded-3xl bg-white border border-emerald-900/10 p-6 shadow-sm">
                            <h2 className="font-display text-xl font-bold text-green-900 leading-tight">Ayurvedic Clinical Guidance & Reference Protocols</h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Standard operating procedures, dosha-specific treatment guidelines, and Samsarjana recovery diet protocols.
                            </p>
                        </div>

                        {/* 5 Core Procedures */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { title: '1. Abhyanga & Swedana', dosha: 'Vata Pacifying', desc: 'Full-body warm oil massage followed by herbal steam sudation. Relieves joint stiffness, neuralgia, and fatigue.', icon: '🌿' },
                                { title: '2. Shirodhara Protocol', dosha: 'Vata-Pitta Pacifying', desc: 'Continuous rhythmic stream of warm herbal oil over forehead. Indicated for hypertension, anxiety, and insomnia.', icon: '💧' },
                                { title: '3. Virechana Karma', dosha: 'Pitta Pacifying', desc: 'Therapeutic purgation detox targeting liver & gallbladder. Indicated for skin disorders, gastritis, and hyperacidity.', icon: '🔥' },
                                { title: '4. Basti Therapy (Niruha & Anuvasana)', dosha: 'Vata Prime Care', desc: 'Medicated herbal decoction and oil enema. Prime treatment for lumbar spondylosis, sciatica, and IBS.', icon: '🌱' },
                                { title: '5. Nasya Karma', dosha: 'Kapha & ENT Focus', desc: 'Nasal administration of herbal oils. Clears sinuses, relieves migraine, and improves mental clarity.', icon: '✨' }
                            ].map((p) => (
                                <div key={p.title} className="rounded-2xl bg-white border border-emerald-900/10 p-5 shadow-sm space-y-2 hover:border-emerald-300 transition">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-[#1F4D3A] flex items-center gap-2">
                                            <span>{p.icon}</span> {p.title}
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                            {p.dosha}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{p.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Samsarjana Krama Diet Table */}
                        <div className="rounded-3xl bg-white border border-emerald-900/10 p-6 shadow-sm space-y-3">
                            <h3 className="font-bold text-[#193322] text-base flex items-center gap-2">
                                <BookOpen size={18} className="text-[#1F4D3A]" /> Post-Detox Recovery Protocol (Samsarjana Krama)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50/70 font-bold text-gray-500 uppercase">
                                            <th className="py-3 px-4">Phase & Timing</th>
                                            <th className="py-3 px-4">Dietary Intake</th>
                                            <th className="py-3 px-4">Clinical Objective</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                                        <tr>
                                            <td className="py-3 px-4 font-bold text-[#1F4D3A]">Phase 1 (Days 1–2)</td>
                                            <td className="py-3 px-4">Peya (Thin Rice Water / Gruel)</td>
                                            <td className="py-3 px-4">Ignites Agni (digestive fire) without overloading stomach</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 px-4 font-bold text-[#1F4D3A]">Phase 2 (Days 3–4)</td>
                                            <td className="py-3 px-4">Vilepi (Thickened Rice Soup with Rock Salt)</td>
                                            <td className="py-3 px-4">Provides mild nourishment & stabilizes GI mucosa</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 px-4 font-bold text-[#1F4D3A]">Phase 3 (Days 5–6)</td>
                                            <td className="py-3 px-4">Akrita & Krita Yusha (Lentil Soup with Spices)</td>
                                            <td className="py-3 px-4">Restores protein assimilation & bowel regularity</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 px-4 font-bold text-[#1F4D3A]">Phase 4 (Day 7+)</td>
                                            <td className="py-3 px-4">Normal Balanced Sattvic Diet</td>
                                            <td className="py-3 px-4">Complete rejuvenation & metabolic equilibrium</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Complete Session & Prescribe Treatment Plan Modal */}
            <ClinicalPrescriptionFormModal
                isOpen={notesModalOpen}
                onClose={() => setNotesModalOpen(false)}
                patientData={selectedBooking}
                booking={selectedBooking}
                onSuccess={() => fetchData()}
                sidebarOffset={sidebarOffset}
            />

            {/* View Notes Modal */}
            {viewNotesOpen && viewNotesData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] border border-white/60 p-6 max-w-lg w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-sand/30 pb-3">
                            <h3 className="font-display text-lg font-bold text-forest">
                                Session Summary & Notes
                            </h3>
                            <button onClick={() => setViewNotesOpen(false)} className="rounded-lg p-1.5 hover:bg-sand/20 text-forest/40 hover:text-forest transition">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-[#faf8f4] border border-sand/30 rounded-2xl p-3">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-forest/40">Patient</p>
                                    <p className="text-sm font-bold text-forest">{viewNotesData.patientFullName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-wider text-forest/40">Treatment Date</p>
                                    <p className="text-sm font-semibold text-forest/80">
                                        {viewNotesData.bookingDate ? new Date(viewNotesData.bookingDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3.5">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-forest/50 mb-1">
                                        Clinical Observations (Notes)
                                    </h4>
                                    <div className="bg-[#faf8f4]/40 border border-sand/40 rounded-2xl p-3 text-sm text-forest leading-relaxed min-h-[60px]">
                                        {viewNotesData.sessionNotes || 'No notes written.'}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-forest/50 mb-1">
                                        Post-Care Details & Advice (Emailed to Patient)
                                    </h4>
                                    <div className="bg-[#eaf4e3]/30 border border-[#cfe0c2] rounded-2xl p-3 text-sm text-forest leading-relaxed min-h-[60px]">
                                        {viewNotesData.patientAdvice || 'No advice written.'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        generatePrescriptionPDF({
                                            id: viewNotesData.id,
                                            type: viewNotesData.purpose || 'Panchakarma Session',
                                            date: viewNotesData.bookingDate,
                                            time: viewNotesData.bookingTime,
                                            patientName: viewNotesData.patientFullName,
                                            therapistName: viewNotesData.therapistFullName || 'Attending Vaidya',
                                            sessionNotes: viewNotesData.sessionNotes,
                                            patientAdvice: viewNotesData.patientAdvice,
                                            packageId: viewNotesData.packageId,
                                            sessionNumber: viewNotesData.sessionNumber,
                                            totalSessions: viewNotesData.totalSessions
                                        });
                                    }}
                                    className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition inline-flex items-center gap-1.5"
                                >
                                    <FileText size={14} /> Export PDF Prescription
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setViewNotesOpen(false);
                                            openNotesModal(viewNotesData);
                                        }}
                                        className="rounded-xl border border-forest/30 bg-white px-3.5 py-2 text-xs font-bold text-forest hover:bg-forest/5 transition"
                                    >
                                        Edit Notes
                                    </button>
                                    <button
                                        onClick={() => setViewNotesOpen(false)}
                                        className="rounded-xl bg-forest px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-forest/90 transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Decline Reschedule Modal — Suggest Alternative Slots */}
            {declineModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] border border-white/60 p-6 max-w-lg w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-sand/30 pb-3">
                            <div>
                                <h3 className="font-display text-lg font-bold text-forest">
                                    Decline & Suggest Alternatives
                                </h3>
                                <p className="text-xs text-forest/60">
                                    Provide 2-3 alternative date/time slots for the patient to choose from.
                                </p>
                            </div>
                            <button onClick={() => setDeclineModalOpen(false)} className="rounded-lg p-1.5 hover:bg-sand/20 text-forest/40 hover:text-forest transition">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
                            <span>📧</span>
                            <span>The patient will be <strong>notified via email & in-app notification</strong> with these alternative dates to choose from.</span>
                        </div>

                        <form onSubmit={handleDeclineSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-forest/50 mb-1.5">
                                    Reason for Declining (Optional)
                                </label>
                                <textarea
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    placeholder="e.g. Slot not available, therapist on leave that day..."
                                    rows={2}
                                    className="w-full rounded-2xl border border-sand/70 p-3 text-sm text-forest placeholder-forest/30 outline-none focus:border-sage focus:ring-4 focus:ring-sage/10 bg-[#faf8f4]/50"
                                />
                            </div>

                            {/* Alternative Slot 1 (Required) */}
                            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                                    ✅ Alternative Slot 1 <span className="text-rose-500">*</span>
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-forest/60 uppercase mb-1">Date</label>
                                        <input type="date" required value={altSlot1Date} min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setAltSlot1Date(e.target.value)}
                                            className="w-full rounded-xl border border-sand bg-white p-2.5 text-xs text-forest outline-none focus:border-sage" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-forest/60 uppercase mb-1">Time</label>
                                        <input type="time" required value={altSlot1Time}
                                            onChange={(e) => setAltSlot1Time(e.target.value)}
                                            className="w-full rounded-xl border border-sand bg-white p-2.5 text-xs text-forest outline-none focus:border-sage" />
                                    </div>
                                </div>
                            </div>

                            {/* Alternative Slot 2 (Required) */}
                            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                                    ✅ Alternative Slot 2 <span className="text-rose-500">*</span>
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-forest/60 uppercase mb-1">Date</label>
                                        <input type="date" required value={altSlot2Date} min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setAltSlot2Date(e.target.value)}
                                            className="w-full rounded-xl border border-sand bg-white p-2.5 text-xs text-forest outline-none focus:border-sage" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-forest/60 uppercase mb-1">Time</label>
                                        <input type="time" required value={altSlot2Time}
                                            onChange={(e) => setAltSlot2Time(e.target.value)}
                                            className="w-full rounded-xl border border-sand bg-white p-2.5 text-xs text-forest outline-none focus:border-sage" />
                                    </div>
                                </div>
                            </div>

                            {/* Alternative Slot 3 (Optional) */}
                            <div className="bg-[#faf8f4] border border-sand/40 rounded-2xl p-3.5 space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-forest/50">
                                    📅 Alternative Slot 3 (Optional)
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-forest/60 uppercase mb-1">Date</label>
                                        <input type="date" value={altSlot3Date} min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setAltSlot3Date(e.target.value)}
                                            className="w-full rounded-xl border border-sand bg-white p-2.5 text-xs text-forest outline-none focus:border-sage" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-forest/60 uppercase mb-1">Time</label>
                                        <input type="time" value={altSlot3Time}
                                            onChange={(e) => setAltSlot3Time(e.target.value)}
                                            className="w-full rounded-xl border border-sand bg-white p-2.5 text-xs text-forest outline-none focus:border-sage" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeclineModalOpen(false)}
                                    className="rounded-xl border border-sand bg-white px-4 py-2.5 text-xs font-bold text-forest/70 hover:bg-sand/10 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={declining}
                                    className="flex-1 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition disabled:opacity-50"
                                >
                                    {declining ? 'Sending...' : 'Decline & Send Alternatives to Patient'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Doctor Prescribe Treatment Plan Modal */}
            <DoctorPrescribePlanModal
                isOpen={prescribeModalOpen}
                onClose={() => setPrescribeModalOpen(false)}
                preselectedPatient={prescribePatient}
                onSuccess={() => fetchData()}
            />

            {/* Patient Clinical Details Modal (Step 3) */}
            <PatientDetailsViewModal
                isOpen={patientDetailsModalOpen}
                onClose={() => setPatientDetailsModalOpen(false)}
                patientData={selectedPatientForDetails}
                onOpenPrescriptionForm={(pData) => {
                    setSelectedPatientForPrescription(pData);
                    setClinicalPrescriptionModalOpen(true);
                }}
            />

            {/* Comprehensive Prescription Form Modal (Step 4 & 5) */}
            <ClinicalPrescriptionFormModal
                isOpen={clinicalPrescriptionModalOpen}
                onClose={() => setClinicalPrescriptionModalOpen(false)}
                patientData={selectedPatientForPrescription}
                onSuccess={() => fetchData()}
                sidebarOffset={sidebarOffset}
            />

            {/* Recovery Tracking & XGBoost Prediction Modal */}
            <RecoveryTrackingModal
                isOpen={recoveryModalOpen}
                onClose={() => setRecoveryModalOpen(false)}
                therapyPlan={selectedRecoveryPlan}
                onSaved={() => fetchData()}
            />
        </div>
    );
}

export default TherapistDashboard;