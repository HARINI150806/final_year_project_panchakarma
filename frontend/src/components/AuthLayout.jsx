import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ title, subtitle, children, footerText, footerLink, footerLabel }) {
  return (
    <div className="bg-brand-canvas fixed inset-0 overflow-hidden font-body text-forest">
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-orb left-[-5rem] top-[-4rem] h-72 w-72 bg-[#d7e7c8]" />
        <div className="ambient-orb bottom-[-6rem] right-[-2rem] h-[24rem] w-[24rem] bg-[#ecd4b6]" />
        <div className="noise-grid absolute inset-0 opacity-[0.18]" />
      </div>

      <div className="relative mx-auto grid h-full w-full max-w-none items-center gap-6 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-8 lg:py-4 xl:gap-10 2xl:px-12">
        <section className="hidden lg:flex lg:items-center">
          <div className="relative max-w-3xl px-2 text-forest xl:px-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#cfe0c2] bg-white/65 px-4 py-2 backdrop-blur-sm">
              <div className="rounded-full bg-[#e7f2e1] p-2 text-sage">
                <Leaf size={18} />
              </div>
              <span className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-forest/70">
                Panchakarma Management
              </span>
            </div>

            <div className="mt-10 max-w-2xl">
              <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.06] text-forest xl:text-5xl">
                A clearer entry point for Panchakarma care management.
              </h1>
              <p className="mt-4 max-w-xl text-[0.98rem] leading-7 text-forest/70 xl:text-base">
                Coordinate consultations, therapy schedules, dosha assessments, treatment plans, and recovery follow-up
                in one organized space.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ['Therapy coordination', 'Keep Panchakarma sessions, timing, and assignments aligned for each patient.'],
                ['Recovery tracking', 'Monitor pain, sleep, energy, and progress after each treatment cycle.'],
                ['Clinical workflow', 'Manage therapists, patients, and appointments with a steady rhythm.'],
              ].map(([heading, text]) => (
                <div key={heading} className="flex h-full min-h-[128px] flex-col gap-3 rounded-[1.5rem] bg-white/55 p-4 backdrop-blur-sm">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[1.05rem] font-semibold leading-6 text-forest">{heading}</h3>
                    <p className="mt-2 text-sm leading-5 text-forest/66">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="auth-card panel-frost w-full max-w-[460px] justify-self-end rounded-[2.2rem] p-4 md:p-4.5">
          <div className="mb-3">
            <h2 className="font-display text-2xl font-semibold leading-tight text-forest">{title}</h2>
            <p className="mt-1.5 text-sm leading-6 text-forest/70">{subtitle}</p>
          </div>
          {children}
          <p className="mt-4 text-center text-sm text-forest/70">
            {footerText}{' '}
            <Link className="font-semibold text-sage transition hover:text-[#8f5a32]" to={footerLink}>
              {footerLabel}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
