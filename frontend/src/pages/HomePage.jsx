import { useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Clock3,
  HeartPulse,
  Leaf,
  MapPinned,
  Menu,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const services = [
  {
    title: 'Panchakarma Programs',
    description: 'Guided detox and restorative care plans shaped around the patient’s dosha and current condition.',
    icon: Stethoscope,
  },
  {
    title: 'Doctor Consultations',
    description: 'Focused clinical sessions for diagnosis, prescription planning, and therapy recommendations.',
    icon: BadgeCheck,
  },
  {
    title: 'Therapy Scheduling',
    description: 'A clear schedule for sessions, room assignments, and therapist coordination across treatments.',
    icon: CalendarDays,
  },
  {
    title: 'Recovery Tracking',
    description: 'Capture energy, sleep, appetite, and comfort levels to refine the recovery journey over time.',
    icon: HeartPulse,
  },
  {
    title: 'Wellness Guidance',
    description: 'Diet, rest, and lifestyle suggestions that support treatment outcomes after each visit.',
    icon: Sparkles,
  },
  {
    title: 'Family Support',
    description: 'Simple updates and shared progress so the patient’s support system stays informed and aligned.',
    icon: Users,
  },
];

const steps = [
  {
    number: '01',
    title: 'Book the right visit',
    text: 'Choose a consultation or therapy session and let the clinic team prepare the treatment flow.',
  },
  {
    number: '02',
    title: 'Personalize the care plan',
    text: 'Doctors review the patient profile, dosha assessment, and symptoms before scheduling therapies.',
  },
  {
    number: '03',
    title: 'Track recovery clearly',
    text: 'Measure progress, improve comfort, and keep every follow-up in one steady workflow.',
  },
];

const testimonials = [
  {
    quote:
      'The experience feels calm, organized, and premium. It is easy to understand the treatment journey from start to finish.',
    name: 'Ananya R.',
    role: 'Patient',
  },
  {
    quote:
      'The clinic workflow is simple for our team. We can coordinate sessions, notes, and follow-ups without friction.',
    name: 'Dr. Meera N.',
    role: 'Physician',
  },
  {
    quote:
      'The design feels warm and reassuring, which is exactly what a wellness-focused Ayurveda practice should communicate.',
    name: 'Rohit S.',
    role: 'Caregiver',
  },
];

const stats = [
  ['12+ years', 'of compassionate Ayurvedic care'],
  ['5-step flow', 'from enquiry to recovery follow-up'],
  ['1000+ sessions', 'planned with care and clarity'],
  ['24/7 support', 'for active patients and families'],
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="inline-flex items-center gap-2 rounded-full border border-[#d8c2a2] bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#8a6138] backdrop-blur-sm">
        <Leaf size={14} />
        {eyebrow}
      </p>
      <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-forest md:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-forest/70">{description}</p>
    </div>
  );
}

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6efe4] text-forest">
      <header className="sticky top-0 z-50 border-b border-white/40 bg-[#f8f2e7]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5c884f_100%)] shadow-[0_14px_30px_rgba(55,90,55,0.28)]">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold leading-tight text-forest">Panchakarma Care</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {[
              ['Services', '#services'],
              ['Approach', '#approach'],
              ['Stories', '#stories'],
              ['Contact', '#contact'],
            ].map(([label, href]) => (
              <a key={label} href={href} className="text-sm font-medium text-forest/70 transition hover:text-forest">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d8c2a2] bg-white/80 text-forest/70 md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link
              to="/login"
              className="hidden rounded-2xl border border-[#d8c2a2] bg-white/85 px-4 py-2.5 text-sm font-semibold text-forest transition hover:bg-white sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5c884f_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(55,90,55,0.25)] transition hover:translate-y-[-1px]"
            >
              Book now
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        {mobileOpen ? (
          <div className="border-t border-white/40 bg-white/85 px-4 py-4 backdrop-blur-xl md:hidden">
            <nav className="mx-auto grid max-w-7xl gap-2">
              {[
                ['Services', '#services'],
                ['Approach', '#approach'],
                ['Stories', '#stories'],
                ['Contact', '#contact'],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-forest/78 transition hover:bg-[#f3eadb]"
                >
                  {label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl border border-[#d8c2a2] bg-white px-4 py-3 text-center text-sm font-semibold text-forest"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5c884f_100%)] px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Book now
                </Link>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(211,231,201,0.75),transparent_18%),radial-gradient(circle_at_78%_18%,rgba(241,221,191,0.9),transparent_18%),radial-gradient(circle_at_78%_78%,rgba(227,243,214,0.72),transparent_22%),linear-gradient(135deg,#fbf7f0_0%,#f3eadb_45%,#eef6e4_100%)]" />
          <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(61,83,46,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(61,83,46,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />

          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d8c2a2] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6138] backdrop-blur-sm">
                <ShieldCheck size={14} />
                Trusted Ayurvedic care
              </div>

              <h1 className="mt-6 max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-forest sm:text-5xl lg:text-6xl">
                A calmer way to plan Panchakarma care.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-forest/72">
                Inspired by the serene feel of a modern Ayurveda clinic, this homepage blends warmth, clarity, and
                premium presentation for patients and therapists.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5c884f_100%)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(55,90,55,0.28)] transition hover:translate-y-[-1px]"
                >
                  Start your care journey
                  <ArrowRight size={17} />
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c2a2] bg-white/80 px-6 py-3.5 text-sm font-semibold text-forest transition hover:bg-white"
                >
                  Explore services
                  <ChevronRight size={17} />
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map(([value, label]) => (
                  <div
                    key={value}
                    className="rounded-[1.5rem] border border-white/80 bg-white/70 p-4 shadow-[0_18px_50px_rgba(32,46,31,0.08)] backdrop-blur-sm"
                  >
                    <p className="font-display text-2xl font-semibold text-forest">{value}</p>
                    <p className="mt-1 text-sm leading-6 text-forest/64">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-12 h-36 w-36 rounded-full bg-[#dbeacb] blur-3xl" />
              <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-[#efd6b7] blur-3xl" />

              <div className="relative mx-auto max-w-xl">
                <div className="rounded-[2rem] border border-white/70 bg-white/82 p-5 shadow-[0_30px_80px_rgba(36,52,33,0.14)] backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-forest/45">
                        Today at the clinic
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-semibold text-forest">Wellness flow</h2>
                    </div>
                    <div className="rounded-2xl bg-[#eef6e6] px-3 py-2 text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">Live</p>
                      <p className="text-sm font-semibold text-forest">8 sessions</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#365f3a_0%,#4d7745_100%)] p-5 text-white shadow-[0_18px_40px_rgba(56,92,59,0.28)]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">Next visit</p>
                        <Clock3 size={16} className="text-white/80" />
                      </div>
                      <p className="mt-4 text-2xl font-semibold">Consultation 10:30 AM</p>
                      <p className="mt-2 max-w-xs text-sm leading-6 text-white/78">
                        Doctor review, dosha discussion, and therapy planning in one calm appointment.
                      </p>
                      <div className="mt-5 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Assigned team</p>
                          <p className="text-xs text-white/72">Doctor, therapist, and care desk</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-[1.4rem] border border-[#eadac0] bg-[#fffaf1] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6138]">Patient mood</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-forest">Balanced</p>
                        <p className="mt-1 text-sm leading-6 text-forest/68">
                          Recovery tracking keeps comfort, energy, and sleep easy to review.
                        </p>
                      </div>

                      <div className="rounded-[1.4rem] border border-[#dfe9d0] bg-[#f4faef] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">Visit location</p>
                        <div className="mt-3 flex items-start gap-3">
                          <MapPinned className="mt-0.5 text-sage" size={18} />
                          <div>
                            <p className="font-semibold text-forest">Coimbatore clinic</p>
                            <p className="text-sm leading-6 text-forest/68">Easy directions, warm reception, and smooth check-in.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {['Clean scheduling', 'Natural design language', 'Patient-first workflow'].map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-[#d8c2a2] bg-white/80 px-3 py-1.5 text-xs font-semibold text-forest/70"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/70 bg-white/82 p-4 shadow-[0_18px_45px_rgba(32,46,31,0.08)] backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest/45">Guided care</p>
                    <p className="mt-2 text-sm leading-6 text-forest/72">
                      A softer visual language makes the experience feel more trustworthy and premium.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/70 bg-white/82 p-4 shadow-[0_18px_45px_rgba(32,46,31,0.08)] backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-[#8a6138]">
                      <Star size={16} className="fill-[#8a6138] text-[#8a6138]" />
                      <span className="text-sm font-semibold">4.9/5 patient satisfaction</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-forest/72">
                      Smooth check-ins, clear sessions, and a more reassuring first impression.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="px-4 py-20 lg:px-8">
          <SectionHeading
            eyebrow="What the clinic offers"
            title="Services presented with more depth and clarity."
            description="The layout keeps the medical feel reassuring while giving each service room to breathe."
          />

          <div className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="group rounded-[1.8rem] border border-[#eadcc7] bg-white/82 p-6 shadow-[0_18px_45px_rgba(37,50,35,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(37,50,35,0.12)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6e6] text-sage">
                    <Icon size={20} />
                  </div>
                  <ChevronRight size={18} className="mt-1 text-forest/20 transition group-hover:text-sage" />
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold text-forest">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-forest/68">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="approach" className="bg-[linear-gradient(180deg,#f2eadf_0%,#f7f1e7_100%)] px-4 py-20 lg:px-8">
          <SectionHeading
            eyebrow="How it works"
            title="A calmer patient journey from the first visit to follow-up."
            description="This section mirrors the reference site's reassuring cadence, but with a cleaner and more editorial visual style."
          />

          <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3">
            {steps.map(({ number, title, text }) => (
              <div key={number} className="rounded-[1.8rem] border border-[#e5d3ba] bg-white/78 p-6 shadow-soft">
                <p className="font-display text-4xl font-semibold text-[#8a6138]/25">{number}</p>
                <h3 className="mt-6 font-display text-xl font-semibold text-forest">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-forest/68">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="stories" className="px-4 py-20 lg:px-8">
          <SectionHeading
            eyebrow="What people feel"
            title="Warm trust is part of the design."
            description="Testimonials are kept simple and readable so the page feels human, not overloaded."
          />

          <div className="mx-auto mt-12 grid max-w-7xl gap-5 lg:grid-cols-3">
            {testimonials.map(({ quote, name, role }) => (
              <blockquote
                key={name}
                className="rounded-[1.8rem] border border-[#eadcc7] bg-white/82 p-6 shadow-[0_18px_45px_rgba(37,50,35,0.08)]"
              >
                <div className="flex items-center gap-1 text-[#8a6138]">
                  {[...Array(5)].map((_, index) => (
                    <Star key={index} size={15} className="fill-current" />
                  ))}
                </div>
                <p className="mt-5 text-base leading-8 text-forest/78">"{quote}"</p>
                <footer className="mt-6">
                  <p className="font-semibold text-forest">{name}</p>
                  <p className="text-sm text-forest/55">{role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="contact" className="px-4 pb-24 pt-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 rounded-[2.25rem] bg-[linear-gradient(135deg,#355c39_0%,#4f7748_45%,#d4b58e_120%)] p-8 text-white shadow-[0_30px_80px_rgba(43,67,45,0.22)] lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
                <PhoneCall size={14} />
                Contact and booking
              </p>
              <h2 className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Bring the same feeling to your clinic homepage and patient experience.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/80">
                If you want, we can keep refining this into a more personalized clinic home page with real photos,
                care details, therapy cards, and a stronger local identity.
              </p>
            </div>

            <div className="grid gap-4 rounded-[1.8rem] bg-white/10 p-5 backdrop-blur-md sm:grid-cols-2">
              {[
                ['Call', '+91 00000 00000'],
                ['Location', 'Coimbatore, Tamil Nadu'],
                ['Appointments', 'Morning and evening slots'],
                ['Support', 'Fast response for patients'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/58">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
