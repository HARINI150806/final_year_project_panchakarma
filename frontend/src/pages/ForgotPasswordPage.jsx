import { useState } from 'react';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import api from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (error) {
      setMessage('Unable to process your request right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Request a reset link through the same calmer access experience used across the sign-in flow."
      footerText="Remembered your password?"
      footerLink="/login"
      footerLabel="Go back to login"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="rounded-[1.7rem] border border-[#e9ddca] bg-[linear-gradient(135deg,#fffaf2_0%,#f7f0e4_100%)] p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#e6efdf] p-3 text-sage">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-forest">Password recovery</p>
              <p className="mt-1 text-sm leading-6 text-forest/68">
                We&apos;ll send a reset instruction to the email connected to your Panchakarma account.
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

        {message ? <p className="rounded-2xl bg-sage/10 px-4 py-3 text-sm text-forest">{message}</p> : null}

        <button
          className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-[linear-gradient(135deg,#3e6d43_0%,#5b8854_100%)] px-4 py-3.5 font-semibold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          <span>{loading ? 'Sending link...' : 'Send reset link'}</span>
          {!loading ? <ArrowRight size={18} /> : null}
        </button>
      </form>
    </AuthLayout>
  );
}
