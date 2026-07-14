import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  LockKeyhole,
  Mail,
  Phone,
  Search,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import api from '../api';

const inputClass =
  'w-full rounded-[1.1rem] border border-[#ddcdb3] bg-[#fffdf9] px-4 py-3 text-sm text-forest outline-none transition placeholder:text-forest/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  gender: '',
  age: '',
};

export default function AdminTherapistPanel() {
  const [formData, setFormData] = useState(initialForm);
  const [therapists, setTherapists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pageSize = 3;

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
      setTherapists(data);
    } catch {
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPatients() {
    setPatientsLoading(true);
    try {
      const { data } = await api.get('/admin/patients');
      setPatients(data);
    } catch {
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }

  useEffect(() => {
    loadTherapists();
    loadPatients();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await api.post('/admin/therapists', {
        ...formData,
        age: Number(formData.age),
      });
      setSuccess('Therapist account created successfully.');
      setFormData(initialForm);
      await loadTherapists();
      await loadPatients();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create therapist account.');
    } finally {
      setSaving(false);
    }
  }

  const filteredTherapists = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return [...therapists]
      .filter((therapist) => {
        if (!term) return true;
        const haystack = [
          therapist.fullName,
          therapist.email,
          therapist.phone,
          therapist.gender,
          therapist.age,
          therapist.id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return (a.fullName || '').localeCompare(b.fullName || '');
        if (sortBy === 'name-desc') return (b.fullName || '').localeCompare(a.fullName || '');
        if (sortBy === 'age-asc') return (a.age || 0) - (b.age || 0);
        if (sortBy === 'age-desc') return (b.age || 0) - (a.age || 0);
        if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [searchTerm, sortBy, therapists]);

  const totalPages = Math.max(1, Math.ceil(filteredTherapists.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTherapists = filteredTherapists.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div id="admin-therapist-panel" className="grid items-start gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="panel-frost self-start rounded-[2rem] p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#e6efdf] p-3 text-sage">
            <UserPlus size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage/90">Admin only</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-forest">Create Therapist Account</h2>
            <p className="mt-2 text-sm leading-6 text-forest/65">
              Add therapist logins here. The role is fixed to therapist, so there is nothing extra to choose.
            </p>
          </div>
        </div>

        <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold tracking-wide text-forest/85">Full name</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
              <input
                className={`${inputClass} pl-12`}
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold tracking-wide text-forest/85">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
              <input
                className={`${inputClass} pl-12`}
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold tracking-wide text-forest/85">Phone</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
              <input
                className={`${inputClass} pl-12`}
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold tracking-wide text-forest/85">Password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
              <input
                className={`${inputClass} pl-12`}
                type="password"
                placeholder="Create password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold tracking-wide text-forest/85">Gender</label>
            <select
              className={inputClass}
              value={formData.gender}
              onChange={(event) => setFormData({ ...formData, gender: event.target.value })}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold tracking-wide text-forest/85">Age</label>
            <input
              className={inputClass}
              type="number"
              min="1"
              max="120"
              placeholder="Enter age"
              value={formData.age}
              onChange={(event) => setFormData({ ...formData, age: event.target.value })}
              required
            />
          </div>

          {error ? (
            <p className="sm:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-600">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="sm:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
              {success}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-[1.1rem] bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-3 font-semibold text-white shadow-[0_18px_45px_rgba(62,109,67,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_55px_rgba(62,109,67,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={saving}
            >
              <span>{saving ? 'Creating...' : 'Create Therapist Account'}</span>
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-[#e2ead9] pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage/90">Patients</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-forest">Patient Details</h3>
              <p className="mt-2 text-sm leading-6 text-forest/65">
                Admin can review patient records and assessment status here.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {patientsLoading ? (
              <p className="text-sm text-forest/60">Loading patients...</p>
            ) : patients.length ? (
              patients.map((patient) => (
                <div key={patient.id} className="rounded-[1.4rem] border border-[#dce7d4] bg-white/75 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold text-forest">{patient.fullName}</p>
                      <p className="mt-1 text-sm text-forest/65">{patient.email}</p>
                    </div>
                    <span className="rounded-full bg-[#f3e4c5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a06a3a]">
                      Patient
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-forest/70 sm:grid-cols-2">
                    <p>Phone: {patient.phone || '-'}</p>
                    <p>Gender: {patient.gender || '-'}</p>
                    <p>Age: {patient.age || '-'}</p>
                    <p>Dosha: {patient.dominantDosha || 'Not completed'}</p>
                    <p className="sm:col-span-2">
                      Assessment: {patient.doshaAssessmentCompleted ? 'Completed' : 'Pending'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-forest/60">No patient records found.</p>
            )}
          </div>
        </div>
      </section>

      <section className="panel-frost self-start rounded-[2rem] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage/90">Existing staff</p>
            <h3 className="mt-1 font-display text-2xl font-semibold text-forest">Therapist Accounts</h3>
            <p className="mt-2 text-sm leading-6 text-forest/65">
              Search, sort, and page through therapist logins created by admin.
            </p>
          </div>
          <div className="rounded-2xl bg-[#eef6e6] p-3 text-sage">
            <Users size={20} />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="grid gap-3 rounded-[1.4rem] border border-[#dce7d4] bg-white/60 p-3.5 sm:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={17} />
              <input
                className="w-full rounded-[1.1rem] border border-[#ddcdb3] bg-[#fffdf9] py-3 pl-11 pr-4 text-sm text-forest outline-none transition placeholder:text-forest/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10"
                placeholder="Search therapists"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={16} />
                <select
                  className="w-full rounded-[1.1rem] border border-[#ddcdb3] bg-[#fffdf9] py-3 pl-11 pr-4 text-sm text-forest outline-none transition focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="age-asc">Age low-high</option>
                  <option value="age-desc">Age high-low</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-forest/60">Loading therapists...</p>
          ) : pagedTherapists.length ? (
            pagedTherapists.map((therapist) => (
              <div key={therapist.id} className="rounded-[1.4rem] border border-[#dce7d4] bg-white/75 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-forest">{therapist.fullName}</p>
                    <p className="mt-1 text-sm text-forest/65">{therapist.email}</p>
                  </div>
                  <span className="rounded-full bg-[#eef6e6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">
                    Therapist
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-forest/70 sm:grid-cols-2">
                  <p>Phone: {therapist.phone || '-'}</p>
                  <p>Gender: {therapist.gender || '-'}</p>
                  <p>Age: {therapist.age || '-'}</p>
                  <p>ID: {therapist.id}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-forest/60">No therapist accounts yet.</p>
          )}

          {filteredTherapists.length > pageSize ? (
            <div className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-[#dce7d4] bg-white/70 px-3 py-3">
              <p className="text-sm text-forest/65">
                Page {safePage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#dce7d4] bg-white px-3 py-2 text-sm font-medium text-forest transition hover:bg-[#f6fbf2] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#dce7d4] bg-white px-3 py-2 text-sm font-medium text-forest transition hover:bg-[#f6fbf2] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safePage === totalPages}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}
        </div>

      </section>
    </div>
  );
}