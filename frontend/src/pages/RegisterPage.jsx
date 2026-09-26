import { useState, useEffect } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AuthLayout from '../components/AuthLayout';
import { getDefaultRoute } from '../auth';

const labelClass = 'mb-2 block text-sm font-semibold tracking-wide text-forest/85';
const iconInputClass =
  'w-full rounded-[1.2rem] border border-[#ddcdb3] bg-[#fffdf9] px-12 py-3 text-forest shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] outline-none transition placeholder:text-forest/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10';

const initialState = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'PATIENT',
  otpCode: '',
};

export default function RegisterPage({ onRegister }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);

  // Clear OTP sent state if user changes their email address
  useEffect(() => {
    setOtpSent(false);
    setFormData(prev => ({ ...prev, otpCode: '' }));
  }, [formData.email]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function handleSendOtp() {
    if (!formData.email) {
      setToast({ type: 'error', message: 'Please enter your email first.' });
      return;
    }
    setToast(null);
    setOtpLoading(true);
    try {
      const response = await api.post('/auth/send-verification', { email: formData.email });
      setOtpSent(true);
      if (response.data?.code) {
        setFormData((prev) => ({ ...prev, otpCode: response.data.code }));
      }
      setToast({
        type: 'success',
        message: response.data.message || 'Verification code sent to your email!'
      });
    } catch (requestError) {
      setToast({
        type: 'error',
        message: requestError.response?.data?.message || 'Failed to send verification code. Please check your email.'
      });
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setToast(null);

    const hasNonDigits = /\D/.test(formData.phone);
    if (hasNonDigits) {
      setToast({ type: 'error', message: 'Phone number must contain only digits.' });
      return;
    }
    if (formData.phone.length !== 10) {
      setToast({ type: 'error', message: 'Phone number must be exactly 10 digits.' });
      return;
    }
    if (!otpSent) {
      setToast({ type: 'error', message: 'Please request a verification code and verify your email first.' });
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData };
      const { data } = await api.post('/auth/register', payload);
      onRegister(data);
      navigate(getDefaultRoute(data.role), { replace: true });
    } catch (requestError) {
      setToast({
        type: 'error',
        message: requestError.response?.data?.message || 'Unable to create account. Please verify your details.'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-white/40 bg-white/95 px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-md transition-all duration-300">
          <div className={`rounded-full p-1.5 ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <span className="text-sm font-semibold tracking-wide text-forest/90">{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-auto text-forest/40 hover:text-forest/70 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <AuthLayout
        title="Create your account"
        subtitle=""
        footerText="Already have an account?"
        footerLink="/login"
        footerLabel="Sign in"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
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

          {/* Email + Send Code */}
          <div>
            <label className={labelClass}>Email</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
                <input
                  className={iconInputClass}
                  type="email"
                  placeholder="Enter email address"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading || !formData.email}
                className="rounded-xl border border-[#ddcdb3] bg-sage/10 px-5 text-sm font-semibold text-sage hover:bg-sage/20 transition disabled:opacity-50"
              >
                {otpLoading ? 'Sending...' : otpSent ? 'Resend' : 'Send Code'}
              </button>
            </div>
          </div>

          {/* Verification Code + Phone side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Verification Code</label>
              <div className="relative">
                <Key className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
                <input
                  className={iconInputClass}
                  placeholder={otpSent ? '6-digit code' : 'Send code first'}
                  maxLength={6}
                  value={formData.otpCode}
                  onChange={(event) => setFormData({ ...formData, otpCode: event.target.value })}
                  disabled={!otpSent}
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
                  placeholder="10-digit number"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Password with eye toggle */}
          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
              <input
                className={iconInputClass}
                type={showPassword ? 'text' : 'password'}
                placeholder="Create password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sage/50 hover:text-sage transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

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
    </>
  );
}
