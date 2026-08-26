import { useState, useMemo, useEffect } from 'react';
import api from '../api';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  Droplets,
  Flame,
  HeartPulse,
  HelpCircle,
  Leaf,
  Menu,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Services / Therapies Detailed Dataset
const ALL_THERAPIES = [
  {
    id: 'abhyanga',
    title: 'Abhyanga (Warm Herbal Oil Therapy)',
    category: 'detox',
    shortDesc: 'Full-body synchronized warm oil massage to release toxins, soothe nerves, and nourish tissues.',
    dosha: 'Vata & Kapha',
    duration: '60 Mins',
    herbs: 'Mahanarayana Oil, Dhanwantharam Thailam',
    benefits: ['Relieves joint stiffness', 'Improves lymphatic circulation', 'Deep skin hydration'],
    icon: Leaf,
    popular: true,
  },
  {
    id: 'shirodhara',
    title: 'Shirodhara (Mind & Nervous Flow)',
    category: 'rejuvenation',
    shortDesc: 'Continuous warm herbal oil stream gently poured on the forehead for deep mental calmness.',
    dosha: 'Vata & Pitta',
    duration: '45 Mins',
    herbs: 'Brahmi Thailam, Ksheerabala Oil',
    benefits: ['Reduces anxiety & insomnia', 'Enhances mental clarity', 'Alleviates migraines'],
    icon: Sparkles,
    popular: true,
  },
  {
    id: 'virechana',
    title: 'Virechana (Pitta Detoxification)',
    category: 'detox',
    shortDesc: 'Medicated purgation therapy eliminating excess Pitta toxins from liver and gallbladder.',
    dosha: 'Pitta Primary',
    duration: '1 Day Cycle',
    herbs: 'Triphala, Trivrit Lehyam',
    benefits: ['Clears skin disorders', 'Purifies blood & liver', 'Balances digestive fire'],
    icon: Flame,
    popular: false,
  },
  {
    id: 'takradhara',
    title: 'Takradhara (Cooling Buttermilk Therapy)',
    category: 'rejuvenation',
    shortDesc: 'Medicated cool buttermilk flow over forehead to calm hyper-acidity and thermal stress.',
    dosha: 'Pitta Primary',
    duration: '45 Mins',
    herbs: 'Medicated Takra with Musta & Chandana',
    benefits: ['Cools body heat', 'Calms chronic headaches', 'Eases hypertension'],
    icon: Droplets,
    popular: false,
  },
  {
    id: 'janu-vasti',
    title: 'Janu Vasti (Knee & Joint Nourishment)',
    category: 'pain',
    shortDesc: 'Warm oil reservoir formed over affected knee joints for deep cartilage & tissue repair.',
    dosha: 'Vata Primary',
    duration: '50 Mins',
    herbs: 'Sahacharadi Thailam, Kottamchukkadi',
    benefits: ['Reduces joint friction', 'Relieves arthritis discomfort', 'Strengthens knee cartilage'],
    icon: Zap,
    popular: true,
  },
  {
    id: 'udvarthana',
    title: 'Udvarthana (Herbal Scrub & Lymphatic)',
    category: 'pain',
    shortDesc: 'Dry herbal powder massage aimed at breakdown of stagnation and improving skin glow.',
    dosha: 'Kapha Primary',
    duration: '60 Mins',
    herbs: 'Triphala Powder, Kolakulathadi Churna',
    benefits: ['Mobilizes lymphatic stagnation', 'Smoothens skin texture', 'Promotes metabolic agility'],
    icon: HeartPulse,
    popular: false,
  },
];

// Care Stepper Data
const CARE_STEPS = [
  {
    number: '01',
    phase: 'Consultation & Pulse Diagnosis',
    title: 'Nadi Pariksha & Dosha Mapping',
    desc: 'Our senior doctor reviews your current symptoms, pulse waveform, digestive fire (Agni), and health history to curate a custom Panchakarma roadmap.',
    detailPoints: ['1-on-1 pulse evaluation', 'Customized herbal prescription', 'Personalized dietary guidelines'],
  },
  {
    number: '02',
    phase: 'Purva Karma (Preparation)',
    title: 'Snehana & Swedana Preparatory Phase',
    desc: 'Internal oleation and soothing herbal steam therapies soften deep-seated toxins and guide them toward elimination channels.',
    detailPoints: ['Warm herbal oil saturation', 'Herbal steam chamber detox', 'Nervous system relaxation'],
  },
  {
    number: '03',
    phase: 'Pradhana Karma (Core Detox)',
    title: 'Guided Purification Sessions',
    desc: 'Targeted Panchakarma cleansing therapies administered by certified therapists under continuous doctor supervision.',
    detailPoints: ['Precision treatment timing', 'Monitored comfort & vital tracking', 'Clean hygienic treatment suites'],
  },
  {
    number: '04',
    phase: 'Paschat Karma (Rejuvenation)',
    title: 'Samsarjana Diet & Rasayana Care',
    desc: 'Gradual restoration of digestive energy through light soothing kitchari dietary phases and restorative herbs for long-term immunity.',
    detailPoints: ['Stepwise digestive reset diet', 'Energy & vitality herbs', '30-day follow-up tracker'],
  },
];

// Testimonials Data
const TESTIMONIALS = [
  {
    quote: 'The personalized care plan transformed my chronic lower back stiffness. The therapists and doctors are exceptionally attentive and calm.',
    name: 'Ananya R.',
    role: 'Patient (Panchakarma 14-Day Detox)',
    category: 'Patients',
    rating: 5,
    city: 'Coimbatore',
  },
  {
    quote: 'As an Ayurvedic physician, having a clear digital scheduling and patient tracking system ensures every therapy plan is executed flawlessly.',
    name: 'Dr. Meera N.',
    role: 'Senior Physician (BAMS, MD)',
    category: 'Doctors',
    rating: 5,
    city: 'Bengaluru',
  },
  {
    quote: 'My mother received warm, respectful, and well-organized treatment. Tracking her daily recovery parameters gave our family immense confidence.',
    name: 'Rohit S.',
    role: 'Caregiver',
    category: 'Caregivers',
    rating: 5,
    city: 'Chennai',
  },
  {
    quote: 'The Shirodhara session cured my chronic sleep disruptions. The serene ambience and organized slot booking made everything seamless.',
    name: 'Kavitha P.',
    role: 'Patient (Rejuvenation Plan)',
    category: 'Patients',
    rating: 5,
    city: 'Kochi',
  },
];

// FAQ Data
const FAQS = [
  {
    q: 'What is Panchakarma and who is it suitable for?',
    a: 'Panchakarma is Ayurveda’s premier 5-stage detoxification and rejuvenation therapy designed to clear deep cellular toxins, balance doshas, and restore digestive fire. It is tailored individually for stress, pain management, skin wellness, or general preventative immunity.',
  },
  {
    q: 'Do I need a doctor consultation before starting therapies?',
    a: 'Yes! Every treatment plan begins with a doctor consultation (Nadi Pariksha) to assess your unique dosha imbalance and ensure therapies are prescribed safely.',
  },
  {
    q: 'How many days does a standard Panchakarma program last?',
    a: 'Programs range from 3-day weekend refreshes to intensive 7, 14, or 21-day therapeutic packages depending on clinical goals.',
  },
  {
    q: 'Can I choose specific appointment time slots online?',
    a: 'Absolutely. Our platform lets patients select preferred dates, available time slots, and doctor preferences directly with live slot verification.',
  },
  {
    q: 'What diet should I follow during the treatment period?',
    a: 'During Panchakarma, doctors prescribe a soothing "Samsarjana" diet of warm, easily digestible foods like kitchari, herbal decoctions, and light soups to support digestive fire.',
  },
];

// Stats Data
const STATS_DATA = [
  { label: 'Years of Clinical Excellence', value: '12+', subtext: 'Rooted in authentic tradition' },
  { label: 'Patient Satisfaction Rate', value: '98.6%', subtext: 'Based on post-care reviews' },
  { label: 'Therapies Conducted', value: '1,400+', subtext: 'Safely administered sessions' },
  { label: 'Expert Medical Team', value: '15+', subtext: 'Doctors & certified therapists' },
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTherapyCategory, setSelectedTherapyCategory] = useState('all');
  const [searchTherapy, setSearchTherapy] = useState('');
  const [activeTherapyModal, setActiveTherapyModal] = useState(null);

  // Live Clinic Stats from Backend DB
  const [liveStats, setLiveStats] = useState([
    { label: 'Registered Patients', value: '...' },
    { label: 'Certified Therapists', value: '...' },
    { label: 'Central Pharmacists', value: '...' },
    { label: 'Clinical Bookings', value: '...' },
  ]);

  useEffect(() => {
    api.get('/public/clinic-stats')
      .then((res) => {
        if (res.data) {
          setLiveStats([
            { label: 'Registered Patients', value: String(res.data.registeredPatients || 0) },
            { label: 'Certified Therapists', value: String(res.data.activeTherapists || 0) },
            { label: 'Central Pharmacists', value: String(res.data.activePharmacists || 0) },
            { label: 'Clinical Bookings', value: String(res.data.totalBookings || 0) },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  // Interactive Care Stepper State
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // FAQ Filter State
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Testimonials Category State
  const [testimonialFilter, setTestimonialFilter] = useState('All Stories');

  // Filtered Therapies
  const filteredTherapies = useMemo(() => {
    return ALL_THERAPIES.filter((t) => {
      const matchCat = selectedTherapyCategory === 'all' || t.category === selectedTherapyCategory;
      const matchSearch =
        t.title.toLowerCase().includes(searchTherapy.toLowerCase()) ||
        t.shortDesc.toLowerCase().includes(searchTherapy.toLowerCase()) ||
        t.herbs.toLowerCase().includes(searchTherapy.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedTherapyCategory, searchTherapy]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return FAQS;
    return FAQS.filter(
      (f) =>
        f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase())
    );
  }, [faqSearch]);

  // Filtered Testimonials
  const filteredTestimonials = useMemo(() => {
    if (testimonialFilter === 'All Stories') return TESTIMONIALS;
    return TESTIMONIALS.filter((t) => t.category === testimonialFilter);
  }, [testimonialFilter]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6efe4] font-body text-forest">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 border-b border-white/40 bg-[#f8f2e7]/90 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 lg:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2e5332_0%,#548048_100%)] text-white shadow-[0_12px_24px_rgba(46,83,50,0.25)] transition duration-300 group-hover:scale-105">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-tight text-forest tracking-tight">Panchakarma Care</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6138]">Authentic Ayurveda</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {[
              ['Services', '#services'],
              ['Therapy Explorer', '#therapies'],
              ['Care Steps', '#approach'],
              ['Reviews', '#stories'],
              ['FAQs', '#faqs'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm font-semibold text-forest/75 transition duration-200 hover:text-forest hover:underline underline-offset-8 decoration-[#8a6138]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((c) => !c)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d8c2a2] bg-white/80 text-forest lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link
              to="/login"
              className="hidden rounded-2xl border border-[#d8c2a2] bg-white/90 px-4 py-2.5 text-sm font-semibold text-forest shadow-sm transition duration-200 hover:bg-white hover:shadow-md sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2e5332_0%,#4e7a43_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(46,83,50,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(46,83,50,0.35)]"
            >
              Book Consultation
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="border-t border-white/40 bg-[#f8f2e7]/98 px-5 py-5 backdrop-blur-2xl lg:hidden">
            <nav className="grid gap-3">
              {[
                ['Services', '#services'],
                ['Therapy Explorer', '#therapies'],
                ['Care Steps', '#approach'],
                ['Reviews', '#stories'],
                ['FAQs', '#faqs'],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-forest/80 hover:bg-[#eae0d0]"
                >
                  {label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-3 pt-2 border-t border-white/50">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-[#d8c2a2] bg-white py-2.5 text-center text-sm font-semibold text-forest"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-[#2e5332] py-2.5 text-center text-sm font-semibold text-white"
                >
                  Book Consultation
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION (Ultra Premium & Clean) */}
        <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
          <div className="ambient-orb -left-20 top-10 h-72 w-72 bg-[#cbe3bd]" />
          <div className="ambient-orb right-0 top-32 h-96 w-96 bg-[#f4dcc2]" />

          <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d8c2a2] bg-white/80 px-4 py-2 text-xs font-semibold text-forest shadow-sm backdrop-blur-md">
              <ShieldCheck size={16} className="text-[#2e5332]" />
              <span className="text-[#8a6138] uppercase tracking-[0.2em] font-bold">Trusted Ayurvedic Center</span>
              <span className="hidden sm:inline">• NABH Compliant Healthcare</span>
            </div>

            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-forest sm:text-5xl lg:text-6xl">
                  Holistic Healing & <br className="hidden sm:inline" />
                  <span className="bg-[linear-gradient(135deg,#2e5332_0%,#7a5229_100%)] bg-clip-text text-transparent">
                    Panchakarma Renewal
                  </span>
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-forest/75 sm:text-lg">
                  Experience personalized Ayurvedic healthcare guided by pulse diagnosis (Nadi Pariksha), authentic herbal therapies, and seamless digital care tracking.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2e5332_0%,#4e7a43_100%)] px-7 py-4 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(46,83,50,0.3)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(46,83,50,0.38)]"
                  >
                    Start Care Journey
                    <ArrowRight size={18} />
                  </Link>
                  <a
                    href="#therapies"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c2a2] bg-white/80 px-6 py-4 text-sm font-semibold text-forest shadow-sm backdrop-blur-sm transition duration-200 hover:bg-white hover:shadow-md"
                  >
                    <Leaf size={16} className="text-[#8a6138]" />
                    Explore Treatments
                  </a>
                </div>

                {/* Counter Stats */}
                <div className="mt-12 grid grid-cols-2 gap-4 xl:grid-cols-4">
                  {liveStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="group rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_12px_32px_rgba(30,44,35,0.06)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-[#d8c2a2]"
                    >
                      <p className="font-display text-2xl font-bold text-forest group-hover:text-[#2e5332]">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-forest/70">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Hero Card: Authentic Clinical Excellence Showcase */}
              <div className="relative">
                <div className="panel-frost rounded-[2.5rem] p-6 shadow-2xl">
                  <div className="flex items-center justify-between gap-4 border-b border-[#e5d8c3] pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8a6138]">
                        Clinical Excellence
                      </span>
                      <h3 className="font-display text-xl font-bold text-forest">Authentic Care Standards</h3>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-[#d8c2a2] bg-[#f6efe4] px-3 py-1 text-xs font-semibold text-[#8a6138]">
                      <BadgeCheck size={15} className="text-[#2e5332]" />
                      Certified Care
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl bg-[linear-gradient(135deg,#2e5332_0%,#3d6741_100%)] p-5 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                          Panchakarma Suite
                        </span>
                        <Stethoscope size={18} className="text-amber-200" />
                      </div>
                      <p className="mt-2 text-xl font-bold">5 Purification Therapies</p>
                      <p className="mt-1 text-xs text-white/80">Vamana, Virechana, Vasti, Nasya & Raktamokshana tailored to your Dosha profile.</p>
                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/20">
                        <span className="text-xs text-white/90 font-medium">Doctor-Supervised Protocol</span>
                        <Link
                          to="/register"
                          className="rounded-xl bg-white/20 px-3 py-1 text-xs font-bold text-white hover:bg-white/30"
                        >
                          Book Visit
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-[#e5d8c3] bg-[#fffaf2] p-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a6138]">
                          Care Approach
                        </span>
                        <p className="mt-1 font-display text-base font-bold text-forest">Nadi Pariksha</p>
                        <p className="text-[11px] text-forest/70">Pulse & Agni Analysis</p>
                      </div>

                      <div className="rounded-2xl border border-[#dce8d2] bg-[#f4faef] p-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#4e7a43]">
                          Patient Care
                        </span>
                        <div className="mt-1 flex items-center gap-1">
                          <Star size={16} className="fill-amber-400 text-amber-400" />
                          <span className="font-display text-base font-bold text-forest">Verified 4.9/5</span>
                        </div>
                        <p className="text-[11px] text-forest/70">Restorative Care</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-xl bg-white/60 p-3 text-xs text-forest/80 border border-white">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <ShieldCheck size={16} className="text-[#2e5332]" />
                      Authentic Clinical Standards
                    </span>
                    <span className="font-medium text-[#8a6138]">NABH Compliant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DYNAMIC THERAPY EXPLORER */}
        <section id="therapies" className="py-20 px-4 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d8c2a2] bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-[#8a6138]">
              <Leaf size={14} />
              Treatment Suite
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-forest md:text-4xl">
              Explore Panchakarma Therapies
            </h2>
            <p className="mt-3 text-base text-forest/75">
              Filter authentic treatments by clinical purpose or search specific herbs and benefits.
            </p>
          </div>

          {/* Explorer Filters */}
          <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                ['all', 'All Therapies'],
                ['detox', 'Detox & Purva Karma'],
                ['rejuvenation', 'Rejuvenation & Mind'],
                ['pain', 'Joint & Pain Care'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedTherapyCategory(key)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition duration-200 ${
                    selectedTherapyCategory === key
                      ? 'bg-[#2e5332] text-white shadow-md'
                      : 'bg-white/80 text-forest/80 border border-[#d8c2a2] hover:bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3.5 top-3 text-forest/50" />
              <input
                type="text"
                placeholder="Search therapy, herb, benefit..."
                value={searchTherapy}
                onChange={(e) => setSearchTherapy(e.target.value)}
                className="w-full rounded-xl border border-[#d8c2a2] bg-white/90 pl-10 pr-4 py-2 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-[#2e5332]"
              />
            </div>
          </div>

          {/* Therapy Grid */}
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTherapies.map((therapy) => {
              const IconComp = therapy.icon;
              return (
                <div
                  key={therapy.id}
                  className="group relative flex flex-col justify-between rounded-[1.8rem] border border-[#eadcc7] bg-white/85 p-6 shadow-[0_12px_32px_rgba(37,50,35,0.06)] transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#8a6138]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6e6] text-[#2e5332]">
                        <IconComp size={22} />
                      </div>
                      {therapy.popular && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-900 border border-amber-300">
                          Popular Choice
                        </span>
                      )}
                    </div>

                    <h3 className="mt-5 font-display text-lg font-bold text-forest">{therapy.title}</h3>
                    <p className="mt-2 text-xs leading-6 text-forest/75">{therapy.shortDesc}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-md bg-[#f6efe4] px-2.5 py-1 text-[11px] font-semibold text-[#8a6138]">
                        ⏱ {therapy.duration}
                      </span>
                      <span className="rounded-md bg-[#eef6e6] px-2.5 py-1 text-[11px] font-semibold text-[#2e5332]">
                        🌿 {therapy.dosha}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#eadcc7] flex items-center justify-between">
                    <span className="text-xs text-forest/60 font-medium">Authentic Ayurvedic Formulation</span>
                    <button
                      type="button"
                      onClick={() => setActiveTherapyModal(therapy)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#2e5332] hover:text-[#8a6138]"
                    >
                      View Details
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* THERAPY DETAILS MODAL */}
        {activeTherapyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-xl rounded-3xl border border-white/80 bg-white p-6 sm:p-8 shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveTherapyModal(null)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6e6] text-[#2e5332]">
                  {<activeTherapyModal.icon size={24} />}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8a6138]">
                    {activeTherapyModal.category} Therapy
                  </span>
                  <h3 className="font-display text-xl font-bold text-forest">{activeTherapyModal.title}</h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-forest/80">{activeTherapyModal.shortDesc}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#f6efe4] p-4 border border-[#eadcc7]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a6138]">Session Duration</span>
                  <p className="text-sm font-bold text-forest">{activeTherapyModal.duration}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a6138]">Target Dosha</span>
                  <p className="text-sm font-bold text-forest">{activeTherapyModal.dosha}</p>
                </div>
              </div>

              <div className="mt-5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a6138]">Key Formulations & Oils:</span>
                <p className="mt-1 text-xs font-semibold text-forest bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  🍃 {activeTherapyModal.herbs}
                </p>
              </div>

              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8a6138]">Clinical Benefits:</span>
                <ul className="mt-2 space-y-1.5 text-xs text-forest/80">
                  {activeTherapyModal.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTherapyModal(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <Link
                  to="/register"
                  className="rounded-xl bg-[#2e5332] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#234226]"
                >
                  Schedule Session
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* INTERACTIVE CARE JOURNEY TIMELINE */}
        <section id="approach" className="py-20 px-4 lg:px-8 max-w-7xl mx-auto border-t border-[#e2d3be]">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d8c2a2] bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-[#8a6138]">
              <Stethoscope size={14} />
              Structured Clinical Workflow
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-forest md:text-4xl">
              The 4-Stage Panchakarma Care Journey
            </h2>
            <p className="mt-3 text-base text-forest/75">
              Click through the stages below to explore how we guide each patient from diagnosis to full vitality.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CARE_STEPS.map((step, idx) => {
              const isActive = activeStepIndex === idx;
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => setActiveStepIndex(idx)}
                  className={`rounded-2xl border p-5 text-left transition duration-300 ${
                    isActive
                      ? 'border-[#2e5332] bg-[#2e5332] text-white shadow-xl scale-[1.02]'
                      : 'border-[#eadcc7] bg-white/80 text-forest hover:border-[#8a6138]'
                  }`}
                >
                  <span className={`font-display text-2xl font-bold ${isActive ? 'text-amber-200' : 'text-[#8a6138]/40'}`}>
                    {step.number}
                  </span>
                  <p className={`mt-2 text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white/80' : 'text-[#8a6138]'}`}>
                    {step.phase}
                  </p>
                  <h3 className="mt-1 font-display text-sm font-bold leading-tight">{step.title}</h3>
                </button>
              );
            })}
          </div>

          {/* Selected Stage Active Card */}
          <div className="mt-8 rounded-[2rem] border border-[#d8c2a2] bg-white p-6 sm:p-8 shadow-lg">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#8a6138]">
                  Phase Details • Step {CARE_STEPS[activeStepIndex].number}
                </span>
                <h3 className="mt-2 font-display text-2xl font-bold text-forest">
                  {CARE_STEPS[activeStepIndex].title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-forest/80">
                  {CARE_STEPS[activeStepIndex].desc}
                </p>

                <div className="mt-5 space-y-2">
                  {CARE_STEPS[activeStepIndex].detailPoints.map((pt) => (
                    <div key={pt} className="flex items-center gap-2.5 text-xs font-semibold text-forest">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[linear-gradient(135deg,#f6efe4_0%,#eae0d0_100%)] p-6 border border-[#e5d8c3]">
                <h4 className="font-display text-base font-bold text-forest">Doctor Supervision Guarantee</h4>
                <p className="mt-2 text-xs text-forest/75 leading-5">
                  Every step in this phase is recorded in your personal patient dashboard, allowing your doctor and therapist team to continuously optimize treatment protocols.
                </p>
                <Link
                  to="/register"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#2e5332] hover:underline"
                >
                  Schedule Your Step 01 Visit →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section id="stories" className="bg-[#f1e6d5]/70 py-20 px-4 lg:px-8 border-y border-[#e2d3be]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d8c2a2] bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-[#8a6138]">
                  <Star size={14} className="fill-[#8a6138]" />
                  Verified Experiences
                </span>
                <h2 className="mt-4 font-display text-3xl font-bold text-forest md:text-4xl">
                  Stories of Healing & Trust
                </h2>
              </div>

              {/* Category Switcher */}
              <div className="flex flex-wrap gap-2">
                {['All Stories', 'Patients', 'Doctors', 'Caregivers'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTestimonialFilter(cat)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                      testimonialFilter === cat
                        ? 'bg-[#2e5332] text-white shadow-sm'
                        : 'bg-[#faf6f0] text-forest border border-[#d8c2a2] hover:bg-[#f6efe4]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTestimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="rounded-[1.8rem] border border-[#eadcc7] bg-white p-6 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={16} className="fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-forest/80 italic">"{t.quote}"</p>
                  <div className="mt-6 pt-4 border-t border-[#f0e6d6] flex items-center justify-between">
                    <div>
                      <p className="font-display text-sm font-bold text-forest">{t.name}</p>
                      <p className="text-xs text-forest/60">{t.role}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-[#8a6138] bg-[#f6efe4] px-2.5 py-1 rounded-md">
                      📍 {t.city}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEARCHABLE FAQS SECTION */}
        <section id="faqs" className="py-20 px-4 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d8c2a2] bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-[#8a6138]">
              <HelpCircle size={14} />
              Frequently Asked Questions
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-forest md:text-4xl">
              Everything You Need to Know
            </h2>
          </div>

          {/* FAQ Search */}
          <div className="mt-8 relative max-w-md mx-auto">
            <Search size={16} className="absolute left-3.5 top-3.5 text-forest/50" />
            <input
              type="text"
              placeholder="Search questions about treatment, diet, booking..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full rounded-2xl border border-[#d8c2a2] bg-white px-10 py-3 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-[#2e5332] shadow-sm"
            />
          </div>

          <div className="mt-8 space-y-4">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-[#eadcc7] bg-white overflow-hidden shadow-sm transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between p-5 text-left font-display text-base font-bold text-forest hover:bg-[#fcf9f4]"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={20} className="text-[#8a6138]" /> : <ChevronDown size={20} className="text-forest/40" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs leading-6 text-forest/75 border-t border-[#f4ebde] pt-3 bg-[#fdfbf7]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA FOOTER CARD */}
        <section className="px-4 pb-20 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-[2.5rem] bg-[linear-gradient(135deg,#2e5332_0%,#467041_50%,#7a5229_100%)] p-8 sm:p-12 text-white shadow-2xl">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-white/90">
                  <PhoneCall size={14} />
                  Direct Booking Assistance
                </span>
                <h2 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl">
                  Begin Your Journey Back to Natural Balance
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/80 max-w-xl">
                  Connect with our clinical team to organize your consultation, schedule therapy sessions, and receive customized diet guidelines.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#2e5332] shadow-lg hover:bg-amber-50"
                  >
                    Create Free Patient Account
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/20"
                  >
                    Existing Patient Sign In
                  </Link>
                </div>
              </div>

              {/* Contact Info Cards Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  ['Clinic Location', 'Coimbatore, Tamil Nadu'],
                  ['Helpline', '+91 (0422) 240-0199'],
                  ['Operating Hours', 'Mon - Sat: 8 AM - 7 PM'],
                  ['Emergency Duty', '24/7 On-Call Support'],
                ].map(([label, val]) => (
                  <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{label}</p>
                    <p className="mt-1 text-xs font-bold text-white">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#e2d3be] bg-[#efe5d5] py-10 px-4 lg:px-8 text-xs text-forest/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2e5332] text-white">
              <Sparkles size={14} />
            </div>
            <span className="font-display font-bold text-forest text-sm">Panchakarma Care Management System</span>
          </div>
          <p>© {new Date().getFullYear()} Panchakarma Care. All rights reserved. Built with authentic Ayurvedic principles.</p>
          <div className="flex gap-4">
            <a href="#services" className="hover:underline">Services</a>
            <a href="#faqs" className="hover:underline">FAQs</a>
            <Link to="/login" className="hover:underline">Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
