import { useState, useEffect } from 'react';
import { ArrowRight, Eye, EyeOff, Mail, ShieldCheck, Key, LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import api from '../api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = Request code, 2 = Verify and Reset
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '...' }

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function handleRequestCode(event) {
    event.preventDefault();
    if (!email) return;
    setToast(null);
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setToast({ type: 'success', message: data.message || 'Verification code sent to your email!' });
      setStep(2); // move to step 2 (verify and reset)
    } catch (error) {
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Unable to process your request. Please check your email.'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    if (!otpCode || !newPassword) return;
    setToast(null);

    if (newPassword.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/reset-password', { email, otpCode, newPassword });
      setToast({ type: 'success', message: data.message || 'Password reset successfully!' });
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000); // Redirect after toast message
    } catch (error) {
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Invalid or expired verification code.'
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
        title={step === 1 ? 'Forgot password' : 'Reset password'}
        subtitle={step === 1 ? 'Request a reset code through the same calmer access experience.' : 'Enter the code sent to your email to configure your new password.'}
        footerText="Remembered your password?"
        footerLink="/login"
        footerLabel="Go back to login"
      >
        {step === 1 ? (
          <form className="space-y-5" onSubmit={handleRequestCode}>
            <div className="rounded-[1.7rem] border border-[#e9ddca] bg-[linear-gradient(135deg,#fffaf2_0%,#f7f0e4_100%)] p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-[#e6efdf] p-3 text-sage">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-forest">Password recovery</p>
                  <p className="mt-1 text-sm leading-6 text-forest/68">
                    We&apos;ll send a verification code to the email connected to your Panchakarma account.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-forest">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
                <input
                  className="w-full rounded-[1.4rem] border border-[#ddcdb3] bg-[#fffdf9] px-12 py-3.5 outline-none transition focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-[linear-gradient(135deg,#3e6d43_0%,#5b8854_100%)] px-4 py-3.5 font-semibold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Sending code...' : 'Send reset code'}</span>
              {!loading ? <ArrowRight size={18} /> : null}
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleResetPassword}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-forest">Verification Code</label>
              <div className="relative">
                <Key className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
                <input
                  className="w-full rounded-[1.4rem] border border-[#ddcdb3] bg-[#fffdf9] px-12 py-3.5 outline-none transition focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10"
                  placeholder="Enter 6-digit OTP code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-forest">New Password</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage/60" size={18} />
                <input
                  className="w-full rounded-[1.4rem] border border-[#ddcdb3] bg-[#fffdf9] px-12 py-3.5 outline-none transition focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
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
              className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-[linear-gradient(135deg,#3e6d43_0%,#5b8854_100%)] px-4 py-3.5 font-semibold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Resetting password...' : 'Reset Password'}</span>
              {!loading ? <ArrowRight size={18} /> : null}
            </button>
          </form>
        )}
      </AuthLayout>
    </>
  );
}
