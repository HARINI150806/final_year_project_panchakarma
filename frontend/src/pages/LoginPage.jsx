import { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import AuthLayout from '../components/AuthLayout';
import { getDefaultRoute } from '../auth';

const labelClass = 'mb-2 block text-sm font-semibold tracking-wide text-forest/85';
const iconInputClass =
  'w-full rounded-[1.35rem] border border-[#ddcdb3] bg-[#fffdf9] px-12 py-3.5 text-forest shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] outline-none transition placeholder:text-forest/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', formData);
      onLogin(data);
      navigate(getDefaultRoute(data.role), { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue."
      footerText="New to the system?"
      footerLink="/register"
      footerLabel="Create an account"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className={labelClass}>Email address</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
            <input
              className={iconInputClass}
              type="email"
              placeholder="Enter your email address"
              autoComplete="email"
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold tracking-wide text-forest/85">Password</label>
            <Link className="text-sm font-medium text-sage transition hover:text-[#8f5a32]" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
            <input
              className={iconInputClass}
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
              required
            />
          </div>
        </div>

        {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-600">{error}</p> : null}

        <button
          className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-3.5 font-semibold text-white shadow-[0_18px_45px_rgba(62,109,67,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_55px_rgba(62,109,67,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          <span>{loading ? 'Signing in...' : 'Login'}</span>
          {!loading ? <ArrowRight size={18} /> : null}
        </button>
      </form>
    </AuthLayout>
  );
}
