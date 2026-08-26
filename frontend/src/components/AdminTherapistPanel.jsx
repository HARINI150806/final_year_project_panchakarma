import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Building,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Filter,
  HeartPulse,
  Leaf,
  LockKeyhole,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import api from '../api';
import TherapyRoomMatrix from './TherapyRoomMatrix';
import PatientDetailsViewModal from './PatientDetailsViewModal';

const inputClass =
  'w-full rounded-[1.1rem] border border-[#ddcdb3] bg-[#fffdf9] px-4 py-3 text-sm text-forest outline-none transition placeholder:text-forest/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  gender: 'Female',
  age: '30',
  accountType: 'THERAPIST',
  pharmacyName: 'Panchakarma Care Central Pharmacy',
};

const SEVERITY_BADGES = {
  SEVERE: 'bg-rose-100 text-rose-800 border-rose-200',
  MODERATE: 'bg-amber-100 text-amber-900 border-amber-200',
  MILD: 'bg-emerald-100 text-emerald-900 border-emerald-200',
};

export default function AdminTherapistPanel({ activeTab: externalActiveTab, onTabChange }) {
  const [formData, setFormData] = useState(initialForm);
  const [therapists, setTherapists] = useState([]);
  const [pharmacists, setPharmacists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active Admin View Tab: 'OVERVIEW', 'STAFF', 'PATIENTS', 'ROOMS', 'COMPLAINTS'
  const [internalAdminTab, setInternalAdminTab] = useState(externalActiveTab || 'OVERVIEW');

  useEffect(() => {
    if (externalActiveTab) {
      setInternalAdminTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  const adminTab = externalActiveTab || internalAdminTab;
  const setAdminTab = (tab) => {
    setInternalAdminTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Staff Sub-tab: 'THERAPISTS' | 'PHARMACISTS'
  const [staffTab, setStaffTab] = useState('THERAPISTS');

  // Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [complaintSearchTerm, setComplaintSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [patientPage, setPatientPage] = useState(1);
  const pageSize = 4;

  // Selected patient for details view modal
  const [selectedPatientModalData, setSelectedPatientModalData] = useState(null);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => {
      setSuccess('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [success]);

  async function loadTherapists() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/therapists');
      setTherapists(data || []);
    } catch {
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPharmacists() {
    try {
      const { data } = await api.get('/admin/pharmacists');
      setPharmacists(data || []);
    } catch {
      setPharmacists([]);
    }
  }

  async function loadPatients() {
    setPatientsLoading(true);
    try {
      const { data } = await api.get('/admin/patients');
      setPatients(data || []);
    } catch {
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }

  async function loadComplaints() {
    setComplaintsLoading(true);
    try {
      const { data } = await api.get('/admin/complaints');
      setComplaints(data || []);
    } catch {
      setComplaints([]);
    } finally {
      setComplaintsLoading(false);
    }
  }

  useEffect(() => {
    loadTherapists();
    loadPharmacists();
    loadPatients();
    loadComplaints();
  }, []);

  async function handleDeleteUser(userId, role, name) {
    if (!window.confirm(`Are you sure you want to delete ${role.toLowerCase()} "${name}"? This action will permanently remove all their associated records.`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const endpoint = role === 'THERAPIST' 
        ? `/admin/therapists/${userId}` 
        : role === 'PHARMACIST' 
        ? `/admin/pharmacists/${userId}` 
        : `/admin/patients/${userId}`;
      
      await api.delete(endpoint);
      setSuccess(`Successfully deleted ${role.toLowerCase()} "${name}".`);
      
      // Reload directories
      if (role === 'THERAPIST') {
        loadTherapists();
      } else if (role === 'PHARMACIST') {
        loadPharmacists();
      } else if (role === 'PATIENT') {
        loadPatients();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || `Failed to delete ${role.toLowerCase()}.`);
    }
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, staffTab]);

  useEffect(() => {
    setPatientPage(1);
  }, [patientSearchTerm]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    // Sanitize phone number (strip spaces/dashes/country code prefix)
    const rawDigits = (formData.phone || '').replace(/\D/g, '');
    if (rawDigits.length < 10) {
      setError('Phone number must contain at least 10 digits (e.g., 9876543210).');
      return;
    }
    const finalPhone = rawDigits.slice(-10);

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSaving(true);

    try {
      if (formData.accountType === 'PHARMACIST') {
        await api.post('/admin/pharmacists', {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: finalPhone,
          password: formData.password,
          gender: formData.gender || 'Male',
          age: Number(formData.age) || 30,
          pharmacyName: formData.pharmacyName || 'Panchakarma Care Central Pharmacy',
        });
        setSuccess('Pharmacist account authorized & created successfully!');
        setStaffTab('PHARMACISTS');
        await loadPharmacists();
      } else {
        await api.post('/admin/therapists', {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: finalPhone,
          password: formData.password,
          gender: formData.gender || 'Female',
          age: Number(formData.age) || 30,
        });
        setSuccess('Therapist account authorized & created successfully.');
        setStaffTab('THERAPISTS');
        await loadTherapists();
      }
      setFormData(initialForm);
    } catch (requestError) {
      const serverMsg = requestError.response?.data?.message || requestError.response?.data?.error;
      setError(serverMsg || 'Unable to create account. Please check email uniqueness or details.');
    } finally {
      setSaving(false);
    }
  }

  const currentStaffList = staffTab === 'PHARMACISTS' ? pharmacists : therapists;

  const filteredStaff = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return [...currentStaffList].filter((item) => {
      if (!term) return true;
      return (
        item.fullName?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.phone?.toLowerCase().includes(term) ||
        item.pharmacyName?.toLowerCase().includes(term)
      );
    });
  }, [currentStaffList, searchTerm]);

  const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  const filteredPatients = useMemo(() => {
    const term = patientSearchTerm.trim().toLowerCase();
    return [...patients].filter((p) => {
      if (!term) return true;
      return (
        p.fullName?.toLowerCase().includes(term) ||
        p.name?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.phone?.toLowerCase().includes(term) ||
        p.dominantDosha?.toLowerCase().includes(term)
      );
    });
  }, [patients, patientSearchTerm]);

  const totalPatientPages = Math.ceil(filteredPatients.length / 5) || 1;
  const paginatedPatients = useMemo(() => {
    const start = (patientPage - 1) * 5;
    return filteredPatients.slice(start, start + 5);
  }, [filteredPatients, patientPage]);

  const filteredComplaints = useMemo(() => {
    const term = complaintSearchTerm.trim().toLowerCase();
    return [...complaints].filter((c) => {
      if (!term) return true;
      return (
        c.patientName?.toLowerCase().includes(term) ||
        c.mainComplaint?.toLowerCase().includes(term) ||
        c.bodyArea?.toLowerCase().includes(term) ||
        c.severity?.toLowerCase().includes(term)
      );
    });
  }, [complaints, complaintSearchTerm]);

  return (
    <div id="admin-therapist-panel" className="space-y-6 w-full min-w-0">
      {/* 1. EXECUTIVE COMMAND HEADER */}
      <div className="rounded-[2.2rem] bg-[linear-gradient(135deg,#1f4d3a_0%,#2a5c47_50%,#153826_100%)] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="ambient-orb right-[-3rem] top-[-3rem] h-48 w-48 bg-emerald-400/20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold text-emerald-200 backdrop-blur-md">
              <ShieldCheck size={15} className="text-emerald-300" />
              <span>CLINICAL GOVERNANCE & COMMAND CENTER</span>
            </div>
            <h1 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Admin Executive Dashboard
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-emerald-100/80 max-w-xl leading-relaxed">
              Real-time clinical operations, staff authorization, therapy suite occupancy, and patient health records management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAdminTab('STAFF')}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#1f4d3a] shadow-md hover:bg-emerald-50 transition cursor-pointer"
            >
              <UserPlus size={16} />
              Onboard Staff
            </button>
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-emerald-100">
              <Sparkles size={15} className="text-amber-300" />
              NABH Compliant System
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI STATS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Patients */}
        <div
          onClick={() => setAdminTab('PATIENTS')}
          className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm hover:shadow-md transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-forest/60">Total Patients</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#1f4d3a] group-hover:scale-105 transition">
              <Users size={20} />
            </div>
          </div>
          <p className="font-display text-2xl font-extrabold text-[#1f4d3a]">{patients.length}</p>
          <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 size={13} /> Active Care Members
          </p>
        </div>

        {/* Certified Therapists */}
        <div
          onClick={() => { setAdminTab('STAFF'); setStaffTab('THERAPISTS'); }}
          className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm hover:shadow-md transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-forest/60">Therapists</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#1f4d3a] group-hover:scale-105 transition">
              <Stethoscope size={20} />
            </div>
          </div>
          <p className="font-display text-2xl font-extrabold text-[#1f4d3a]">{therapists.length}</p>
          <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <UserCheck size={13} /> Certified Practitioners
          </p>
        </div>

        {/* Central Pharmacists */}
        <div
          onClick={() => { setAdminTab('STAFF'); setStaffTab('PHARMACISTS'); }}
          className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm hover:shadow-md transition cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-forest/60">Pharmacists</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#1f4d3a] group-hover:scale-105 transition">
              <Building size={20} />
            </div>
          </div>
          <p className="font-display text-2xl font-extrabold text-[#1f4d3a]">{pharmacists.length}</p>
          <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 size={13} /> Central Dispensary
          </p>
        </div>
      </div>

      {/* 3. EXECUTIVE ADMIN TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 rounded-2xl bg-[#eef5e9] p-1.5 border border-emerald-900/10">
        {[
          ['OVERVIEW', '📊 Operational Overview', Activity],
          ['STAFF', '👥 Staff Onboarding & Directory', Users],
          ['PATIENTS', '🩺 Patient Directory', UserRound],
          ['ROOMS', '🏥 Therapy Suite Matrix', Building],
        ].map(([tabKey, tabLabel, TabIcon]) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setAdminTab(tabKey)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              adminTab === tabKey
                ? 'bg-[#1f4d3a] text-white shadow-sm'
                : 'text-forest/70 hover:bg-white/60 hover:text-forest'
            }`}
          >
            <TabIcon size={16} />
            <span>{tabLabel}</span>
          </button>
        ))}
      </div>

      {/* 4. TAB CONTENT */}

      {/* TAB 1: OPERATIONAL OVERVIEW */}
      {adminTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Live Operations
                </span>
                <h3 className="font-display text-lg font-bold text-[#1f4d3a] mt-1">Therapy Suites & Room Allocations</h3>
              </div>
              <button
                type="button"
                onClick={() => setAdminTab('ROOMS')}
                className="text-xs font-bold text-[#1f4d3a] hover:underline"
              >
                Full Room Management →
              </button>
            </div>
            <TherapyRoomMatrix />
          </div>
        </div>
      )}

      {/* TAB 2: STAFF ONBOARDING & DIRECTORY */}
      {adminTab === 'STAFF' && (
        <div className="grid items-start gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          {/* Staff Creation Form */}
          <section id="staff-creation-form" className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
              <div className="rounded-2xl bg-emerald-50 p-3 text-[#1f4d3a]">
                <UserPlus size={20} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                  ADMIN AUTHORIZATION ONLY
                </span>
                <h2 className="font-display text-xl font-bold text-[#1f4d3a]">Onboard Staff Member</h2>
                <p className="text-xs text-forest/70 mt-1">
                  Authorize & create credentials for new Certified Therapists or Central Pharmacists.
                </p>
              </div>
            </div>

            <form className="grid gap-3.5 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-forest">Account Role *</label>
                <select
                  className={`${inputClass} font-bold text-forest`}
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                >
                  <option value="THERAPIST">Therapist Account</option>
                  <option value="PHARMACIST">Pharmacist Account (Admin Exclusive)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-forest">Full Name *</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest/40" size={18} />
                  <input
                    id="staff-name-input"
                    className={`${inputClass} pl-12`}
                    placeholder="Enter practitioner's full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-forest">Email *</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest/40" size={18} />
                  <input
                    className={`${inputClass} pl-12`}
                    type="email"
                    placeholder="official@panchakarma.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-forest">Phone *</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest/40" size={18} />
                  <input
                    className={`${inputClass} pl-12`}
                    type="tel"
                    placeholder="10-digit phone number (e.g. 9876543210)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              {formData.accountType === 'PHARMACIST' && (
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-forest">Pharmacy Name</label>
                  <div className="relative">
                    <Building className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest/40" size={18} />
                    <input
                      className={`${inputClass} pl-12`}
                      placeholder="e.g. Panchakarma Care Central Pharmacy"
                      value={formData.pharmacyName}
                      onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-forest">Password *</label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest/40" size={18} />
                  <input
                    className={`${inputClass} pl-12`}
                    type="password"
                    placeholder="Create secure password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-forest">Gender & Age</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className={inputClass}
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                  <input
                    className={inputClass}
                    type="number"
                    min="18"
                    max="99"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
              </div>

              {error && <p className="sm:col-span-2 text-xs font-bold text-rose-700 bg-rose-50 p-3 rounded-2xl border border-rose-200">{error}</p>}
              {success && <p className="sm:col-span-2 text-xs font-bold text-emerald-800 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">{success}</p>}

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1f4d3a] px-4 py-3.5 text-xs font-extrabold text-white shadow-md hover:bg-[#16382b] transition disabled:opacity-50 cursor-pointer"
                >
                  <UserPlus size={16} />
                  <span>{saving ? 'Authorizing & Creating...' : `Create ${formData.accountType === 'PHARMACIST' ? 'Pharmacist' : 'Therapist'} Account`}</span>
                </button>
              </div>
            </form>
          </section>

          {/* Registered Staff Directory */}
          <section className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-[#1f4d3a]" />
                <h2 className="font-display text-lg font-bold text-[#1f4d3a]">Registered Staff Directory</h2>
              </div>

              <div className="flex items-center gap-1 bg-emerald-50 p-1 rounded-2xl border border-emerald-100">
                <button
                  type="button"
                  onClick={() => setStaffTab('THERAPISTS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    staffTab === 'THERAPISTS' ? 'bg-[#1f4d3a] text-white shadow-xs' : 'text-forest/70 hover:text-forest'
                  }`}
                >
                  Therapists ({therapists.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffTab('PHARMACISTS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    staffTab === 'PHARMACISTS' ? 'bg-[#1f4d3a] text-white shadow-xs' : 'text-forest/70 hover:text-forest'
                  }`}
                >
                  Pharmacists ({pharmacists.length})
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-forest/40" size={16} />
              <input
                className={`${inputClass} pl-10 text-xs`}
                placeholder={`Search ${staffTab.toLowerCase()} by name, email, phone...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {paginatedStaff.length === 0 ? (
                <div className="py-8 text-center text-xs text-forest/50">
                  No registered {staffTab.toLowerCase()} found.
                </div>
              ) : (
                paginatedStaff.map((staff) => (
                  <div key={staff.id} className="p-4 rounded-2xl bg-[#f7faf4] border border-emerald-900/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#1f4d3a]">{staff.fullName}</h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                          {staffTab === 'PHARMACISTS' ? 'PHARMACIST' : 'THERAPIST'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(staff.id, staffTab === 'PHARMACISTS' ? 'PHARMACIST' : 'THERAPIST', staff.fullName)}
                          className="text-rose-600 hover:text-rose-800 transition font-bold text-xs bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-100 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-forest/70">{staff.email} • {staff.phone}</p>
                    {staff.pharmacyName && (
                      <p className="text-[11px] text-[#1f4d3a] font-semibold">📍 {staff.pharmacyName}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1.5 rounded-xl border border-gray-200 text-forest disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-bold text-forest/70">Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1.5 rounded-xl border border-gray-200 text-forest disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: PATIENT INTAKE DIRECTORY */}
      {adminTab === 'PATIENTS' && (
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Patient Records
              </span>
              <h2 className="font-display text-xl font-bold text-[#1f4d3a] mt-1">Patient Intake Directory</h2>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-forest/40" size={16} />
              <input
                className={`${inputClass} pl-10 text-xs`}
                placeholder="Search patients by name, dosha, phone..."
                value={patientSearchTerm}
                onChange={(e) => setPatientSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-forest/60 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Patient Name</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Age / Gender</th>
                  <th className="py-3 px-3">Dosha Profile</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-forest/50">
                      No matching patient records found.
                    </td>
                  </tr>
                ) : (
                  paginatedPatients.map((p) => (
                    <tr key={p.id || p.patientId} className="hover:bg-emerald-50/50 transition">
                      <td className="py-3.5 px-3 font-bold text-[#1f4d3a]">
                        {p.fullName || p.name || 'Patient'}
                      </td>
                      <td className="py-3.5 px-3 text-forest/70">
                        <div>{p.email}</div>
                        <div className="text-[11px] text-gray-500">{p.phone}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-forest">
                        {p.age ? `${p.age} yrs` : '—'} • {p.gender || '—'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                          {p.dominantDosha || 'Not Assessed'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPatientModalData(p)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-[#1f4d3a] shadow-2xs hover:bg-emerald-50 cursor-pointer"
                          >
                            <Eye size={14} />
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(p.id || p.patientId, 'PATIENT', p.fullName || p.name || 'Patient')}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPatientPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
              <button
                type="button"
                disabled={patientPage <= 1}
                onClick={() => setPatientPage((p) => p - 1)}
                className="p-1.5 rounded-xl border border-gray-200 text-forest disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-forest/70">Page {patientPage} of {totalPatientPages}</span>
              <button
                type="button"
                disabled={patientPage >= totalPatientPages}
                onClick={() => setPatientPage((p) => p + 1)}
                className="p-1.5 rounded-xl border border-gray-200 text-forest disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: THERAPY ROOM MATRIX */}
      {adminTab === 'ROOMS' && (
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Resource Allocation
              </span>
              <h2 className="font-display text-xl font-bold text-[#1f4d3a] mt-1">Therapy Suite Management</h2>
            </div>
          </div>
          <TherapyRoomMatrix />
        </div>
      )}

      {/* PATIENT DETAILS VIEW MODAL */}
      {selectedPatientModalData && (
        <PatientDetailsViewModal
          isOpen={!!selectedPatientModalData}
          onClose={() => setSelectedPatientModalData(null)}
          patientData={selectedPatientModalData}
        />
      )}
    </div>
  );
}