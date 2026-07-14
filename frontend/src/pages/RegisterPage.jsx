import { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, Phone, UserRound, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AuthLayout from '../components/AuthLayout';
import { getDefaultRoute } from '../auth';

const labelClass = 'mb-2 block text-sm font-semibold tracking-wide text-forest/85';
const iconInputClass =
  'w-full rounded-[1.2rem] border border-[#ddcdb3] bg-[#fffdf9] px-12 py-3 text-forest shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] outline-none transition placeholder:text-forest/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10';
const plainInputClass =
  'w-full rounded-[1.2rem] border border-[#ddcdb3] bg-[#fffdf9] px-4 py-3 text-forest shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] outline-none transition placeholder:text-forest/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10';

const initialState = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  gender: '',
  age: '',
  role: 'PATIENT',
};

export default function RegisterPage({ onRegister }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        age: Number(formData.age),
      };
      const { data } = await api.post('/auth/register', payload);
      onRegister(data);
      navigate(getDefaultRoute(data.role), { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create account. Please verify your details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle=""
      footerText="Already have an account?"
      footerLink="/login"
      footerLabel="Sign in"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass}>Full name</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
              <input
                className={iconInputClass}
                placeholder="Enter full name"
                autoComplete="name"
                value={formData.fullName}
                onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
              <input
                className={iconInputClass}
                type="email"
                placeholder="Enter email"
                autoComplete="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Phone</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
              <input
                className={iconInputClass}
                type="tel"
                placeholder="Enter phone number"
                autoComplete="tel"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
              <input
                className={iconInputClass}
                type="password"
                placeholder="Create password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Role</label>
            <input className={iconInputClass} value="Patient" readOnly aria-readonly="true" />
          </div>

          <div>
            <label className={labelClass}>Gender</label>
            <div className="relative">
              <Users className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
              <select
                className={iconInputClass}
                value={formData.gender}
                onChange={(event) => setFormData({ ...formData, gender: event.target.value })}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Age</label>
            <input
              className={plainInputClass}
              type="number"
              min="1"
              max="120"
              inputMode="numeric"
              placeholder="Enter age"
              value={formData.age}
              onChange={(event) => setFormData({ ...formData, age: event.target.value })}
              required
            />
          </div>
        </div>

        {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-600">{error}</p> : null}

        <button
          className="flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-3 font-semibold text-white shadow-[0_18px_45px_rgba(62,109,67,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_55px_rgba(62,109,67,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          <span>{loading ? 'Creating account...' : 'Register'}</span>
          {!loading ? <ArrowRight size={18} /> : null}
        </button>

      </form>
    </AuthLayout>
  );
}
