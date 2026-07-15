import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, FlaskConical, Leaf, Sparkles, Wind, Flame, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { updateStoredAuth } from '../auth';
import { doshaAssessmentFields, doshaTherapies } from '../data';

// ─── Dosha metadata ───────────────────────────────────────────
const doshaInfo = {
  VATA: {
    name: 'Vata',
    subtitle: 'Air & Space',
    color: 'from-[#e8f4fd] to-[#d0e8f8]',
    accent: '#4a8db5',
    border: 'border-[#a8d0e8]',
    badge: 'bg-[#d0e8f8] text-[#2d6a96]',
    icon: Wind,
    emoji: '🌬️',
    description:
      'Vata types are creative, enthusiastic, and quick-thinking. You thrive with warmth, routine, and grounding practices.',
    qualities: ['Creative', 'Energetic', 'Adaptable', 'Imaginative'],
  },
  PITTA: {
    name: 'Pitta',
    subtitle: 'Fire & Water',
    color: 'from-[#fef3e2] to-[#fde8c8]',
    accent: '#c07830',
    border: 'border-[#e8c898]',
    badge: 'bg-[#fde8c8] text-[#a06030]',
    icon: Flame,
    emoji: '🔥',
    description:
      'Pitta types are driven, focused, and natural leaders. You thrive with cooling activities, balance, and relaxation.',
    qualities: ['Confident', 'Focused', 'Driven', 'Ambitious'],
  },
  KAPHA: {
    name: 'Kapha',
    subtitle: 'Earth & Water',
    color: 'from-[#edf6e8] to-[#d8edd0]',
    accent: '#5a8553',
    border: 'border-[#b0d8a0]',
    badge: 'bg-[#d8edd0] text-[#3d6835]',
    icon: Droplets,
    emoji: '🌊',
    description:
      'Kapha types are nurturing, patient, and steady. You thrive with movement, stimulation, and light, warming foods.',
    qualities: ['Calm', 'Loyal', 'Patient', 'Steady'],
  },
  VATA_PITTA: {
    name: 'Vata-Pitta',
    subtitle: 'Air, Space & Fire',
    color: 'from-[#e8f4fd] to-[#fde8c8]',
    accent: '#7d858c',
    border: 'border-[#cdbf9f]',
    badge: 'bg-[#ecdfcf] text-[#6f5f48]',
    icon: Wind,
    emoji: '🌬️🔥',
    description:
      'Vata-Pitta types combine quick creativity with focus and drive. You thrive with grounding routines and cooling balance.',
    qualities: ['Creative', 'Focused', 'Quick', 'Driven'],
  },
  VATA_KAPHA: {
    name: 'Vata-Kapha',
    subtitle: 'Air, Space, Earth & Water',
    color: 'from-[#e8f4fd] to-[#d8edd0]',
    accent: '#547f84',
    border: 'border-[#a8c8c0]',
    badge: 'bg-[#dceee5] text-[#3f6765]',
    icon: Wind,
    emoji: '🌬️🌊',
    description:
      'Vata-Kapha types combine sensitivity and imagination with steadiness. You thrive with warmth, lightness, and steady movement.',
    qualities: ['Imaginative', 'Steady', 'Sensitive', 'Calm'],
  },
  PITTA_KAPHA: {
    name: 'Pitta-Kapha',
    subtitle: 'Fire, Water & Earth',
    color: 'from-[#fef3e2] to-[#d8edd0]',
    accent: '#8c7d42',
    border: 'border-[#d1c89c]',
    badge: 'bg-[#efe7c8] text-[#75652d]',
    icon: Flame,
    emoji: '🔥🌊',
    description:
      'Pitta-Kapha types combine determination with steadiness. You thrive with cooling, stimulating routines that keep energy moving.',
    qualities: ['Focused', 'Steady', 'Resilient', 'Purposeful'],
  },
  TRIDOSHA: {
    name: 'Tridosha',
    subtitle: 'Vata, Pitta & Kapha Balanced',
    color: 'from-[#e8f4fd] via-[#fef3e2] to-[#d8edd0]',
    accent: '#637a58',
    border: 'border-[#c8d4bd]',
    badge: 'bg-[#e8efdf] text-[#52694b]',
    icon: Sparkles,
    emoji: '✨',
    description:
      'Tridosha indicates a balanced constitution across Vata, Pitta, and Kapha. You thrive by maintaining consistency across seasons.',
    qualities: ['Balanced', 'Adaptable', 'Stable', 'Responsive'],
  },
};

// ─── Personal info step ───────────────────────────────────────
const labelCls =
  'mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-forest/70';
const inputCls =
  'w-full rounded-2xl border border-[#ddcdb3] bg-[#fffdf9] px-4 py-3 text-sm text-forest outline-none transition placeholder:text-forest/35 focus:border-sage focus:bg-white focus:ring-4 focus:ring-sage/10';
const selectCls = inputCls;

function PersonalInfoStep({ info, onChange }) {
  const fields = [
    { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Your full name', required: true, span: 2 },
    { key: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 28', required: true },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
    { key: 'height', label: 'Height (cm)', type: 'text', placeholder: 'e.g. 168 cm' },
    { key: 'weight', label: 'Weight (kg)', type: 'text', placeholder: 'e.g. 65 kg' },
    { key: 'occupation', label: 'Occupation (optional)', type: 'text', placeholder: 'e.g. Teacher', span: 2 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map(({ key, label, type, placeholder, options, required, span }) => (
        <div key={key} className={span === 2 ? 'md:col-span-2' : ''}>
          <label className={labelCls}>
            {label}
            {required && <span className="ml-0.5 text-rose-400">*</span>}
          </label>
          {type === 'select' ? (
            <select
              className={selectCls}
              value={info[key] || ''}
              onChange={(e) => onChange({ ...info, [key]: e.target.value })}
              required={required}
            >
              <option value="">Select {label}</option>
              {options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              className={inputCls}
              type={type}
              placeholder={placeholder}
              value={info[key] || ''}
              onChange={(e) => onChange({ ...info, [key]: e.target.value })}
              required={required}
              min={type === 'number' ? 1 : undefined}
              max={type === 'number' ? 120 : undefined}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Question card ────────────────────────────────────────────
const doshaOptionLabels = ['Vata', 'Pitta', 'Kapha'];
const doshaOptionColors = [
  'border-[#a8d0e8] bg-[#edf6fc] hover:bg-[#d8eef8] data-[selected]:border-[#4a8db5] data-[selected]:bg-[#d0e8f8]',
  'border-[#e8c898] bg-[#fdf6ea] hover:bg-[#fde8c8] data-[selected]:border-[#c07830] data-[selected]:bg-[#fde8c8]',
  'border-[#b0d8a0] bg-[#eef7ea] hover:bg-[#d8edd0] data-[selected]:border-[#5a8553] data-[selected]:bg-[#d8edd0]',
];
const doshaOptionTextColors = ['text-[#2d6a96]', 'text-[#a06030]', 'text-[#3d6835]'];

function QuestionCard({ field, value, onChange, index, total }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6efdf] text-xs font-bold text-sage">
          {index + 1}
        </span>
        <p className="pt-1 text-base font-semibold leading-snug text-forest">{field.label.replace(/^\d+\.\s*/, '')}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {field.options.map((opt, i) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              data-selected={selected || undefined}
              onClick={() => onChange(field.key, opt)}
              className={`group flex flex-col gap-1.5 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${doshaOptionColors[i]}`}
            >
              <span className={`text-xs font-bold uppercase tracking-[0.14em] ${doshaOptionTextColors[i]}`}>
                {doshaOptionLabels[i]}
              </span>
              <span className="text-sm font-medium text-forest/80 leading-snug">{opt}</span>
              {selected && (
                <CheckCircle2 size={14} className={`mt-0.5 self-end ${doshaOptionTextColors[i]}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────
function ScoreBar({ label, value, max, color, emoji }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-forest">
          {emoji} {label}
        </span>
        <span className="text-sm font-bold text-forest">{value} / {max}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-forest/8">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function normalizeScores(result) {
  const rawScores = {
    vataScore: result?.vataScore || 0,
    pittaScore: result?.pittaScore || 0,
    kaphaScore: result?.kaphaScore || 0,
  };
  const rawTotal = rawScores.vataScore + rawScores.pittaScore + rawScores.kaphaScore;
  const wasSavedWithTwoPointScoring =
    rawTotal > 10 &&
    rawScores.vataScore % 2 === 0 &&
    rawScores.pittaScore % 2 === 0 &&
    rawScores.kaphaScore % 2 === 0;

  if (!wasSavedWithTwoPointScoring) {
    return rawScores;
  }

  return {
    vataScore: rawScores.vataScore / 2,
    pittaScore: rawScores.pittaScore / 2,
    kaphaScore: rawScores.kaphaScore / 2,
  };
}

function inferDoshaType(result) {
  if (result?.dominantDosha && result.dominantDosha !== 'UNKNOWN') {
    return result.dominantDosha;
  }

  const scores = normalizeScores(result);
  const entries = [
    ['VATA', scores.vataScore],
    ['PITTA', scores.pittaScore],
    ['KAPHA', scores.kaphaScore],
  ];
  const maxScore = Math.max(...entries.map(([, score]) => score));
  if (maxScore <= 0) return 'VATA';

  const dominant = entries.filter(([, score]) => score === maxScore).map(([dosha]) => dosha);
  if (dominant.length === 3) return 'TRIDOSHA';
  return dominant.join('_');
}

// ─── Result step ──────────────────────────────────────────────
function ResultStep({ result }) {
  if (!result) return null;
  const { recommendedTherapies } = result;
  const dominantDosha = inferDoshaType(result);
  const info = doshaInfo[dominantDosha] || doshaInfo.VATA;
  const DoshaIcon = info.icon;
  const displayScores = normalizeScores(result);
  const total = 10;

  return (
    <div className="space-y-6">
      {/* Hero result card */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${info.color} border-2 ${info.border} p-6 text-center`}>
        <div className="absolute inset-0 opacity-10">
          <div className="noise-grid absolute inset-0" />
        </div>
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/55">Your dominant dosha</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <div className={`rounded-2xl p-3`} style={{ background: `${info.accent}20` }}>
              <DoshaIcon size={28} style={{ color: info.accent }} />
            </div>
            <div className="text-left">
              <h2 className="font-display text-4xl font-bold text-forest">{info.name}</h2>
              <p className="text-sm font-medium" style={{ color: info.accent }}>{info.subtitle}</p>
            </div>
          </div>
          <p className="mt-4 mx-auto max-w-sm text-sm leading-6 text-forest/70">{info.description}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {info.qualities.map((q) => (
              <span key={q} className={`rounded-full px-3 py-1 text-xs font-semibold ${info.badge}`}>{q}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="rounded-3xl border border-white/70 bg-white/75 p-5 backdrop-blur-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-forest/50">Score breakdown</p>
        <div className="space-y-4">
          <ScoreBar label="Vata" value={displayScores.vataScore} max={total} color="#4a8db5" emoji="🌬️" />
          <ScoreBar label="Pitta" value={displayScores.pittaScore} max={total} color="#c07830" emoji="🔥" />
          <ScoreBar label="Kapha" value={displayScores.kaphaScore} max={total} color="#5a8553" emoji="🌊" />
        </div>
      </div>

      {/* Recommended therapies */}
      <div className="rounded-3xl border border-[#dce7d4] bg-[linear-gradient(135deg,#eff8ea_0%,#f7fcf2_100%)] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Leaf size={16} className="text-sage" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest/55">Recommended therapies</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(recommendedTherapies || doshaTherapies[dominantDosha] || []).map((t) => (
            <span
              key={t}
              className="rounded-full border border-[#c0d8b0] bg-white/80 px-4 py-2 text-sm font-semibold text-sage"
            >
              🌿 {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────
const STEPS = [
  { label: 'Personal Info', icon: FlaskConical },
  { label: 'Questions 1–5', icon: Sparkles },
  { label: 'Questions 6–10', icon: Sparkles },
  { label: 'Your Dosha', icon: Leaf },
];

export default function DoshaAssessmentPage({ auth, onAuthUpdate }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const [personalInfo, setPersonalInfo] = useState({
    fullName: auth?.fullName || '',
    age: auth?.age || '',
    gender: auth?.gender || '',
    height: '',
    weight: '',
    occupation: '',
  });

  const [answers, setAnswers] = useState({});

  const qSet1 = doshaAssessmentFields.slice(0, 5);
  const qSet2 = doshaAssessmentFields.slice(5, 10);

  const setAnswer = (key, val) => setAnswers((prev) => ({ ...prev, [key]: val }));

  const step1Valid =
    Boolean(personalInfo?.fullName) && String(personalInfo.fullName).trim() !== '' &&
    Boolean(personalInfo?.age) && String(personalInfo.age).trim() !== '' &&
    Boolean(personalInfo?.gender) && String(personalInfo.gender).trim() !== '';

  const step2Valid = qSet1.every((f) => answers[f.key]);
  const step2Answered = qSet1.filter((f) => answers[f.key]).length;

  const step3Valid = qSet2.every((f) => answers[f.key]);
  const step3Answered = qSet2.filter((f) => answers[f.key]).length;

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const payload = {
        fullName: personalInfo.fullName,
        age: Number(personalInfo.age),
        gender: personalInfo.gender,
        height: personalInfo.height,
        weight: personalInfo.weight,
        occupation: personalInfo.occupation,
        ...answers,
      };
      const { data } = await api.post('/patient/dosha-assessment', payload);
      setResult(data);
      const updatedAuth = updateStoredAuth({
        doshaAssessmentCompleted: true,
        dominantDosha: data.dominantDosha,
        doshaAssessmentDate: data.doshaAssessmentDate,
        vataScore: data.vataScore,
        pittaScore: data.pittaScore,
        kaphaScore: data.kaphaScore,
      });
      if (onAuthUpdate) onAuthUpdate(updatedAuth);
      setStep(3);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canNext =
    (step === 0 && step1Valid) ||
    (step === 1 && step2Valid) ||
    (step === 2 && step3Valid);

  function handleNext() {
    setError('');
    if (step === 0 && !step1Valid) {
      setError('Please fill in your Full Name, Age, and Gender to continue.');
      return;
    }
    if (step === 1 && !step2Valid) {
      setError('Please answer all 5 questions on this page to continue.');
      return;
    }
    if (step === 2 && !step3Valid) {
      setError('Please answer all 5 questions on this page to continue.');
      return;
    }
    
    if (step === 2) {
      handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="bg-dashboard-surface min-h-screen font-body text-forest">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb left-[-4rem] top-24 h-72 w-72 bg-[#d7e6cb]" />
        <div className="ambient-orb right-[-5rem] top-12 h-80 w-80 bg-[#ebd5b7]" />
        <div className="noise-grid absolute inset-0 opacity-[0.08]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-8 lg:px-6 lg:py-12">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-forest/60 transition hover:text-forest"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] shadow-[0_12px_36px_rgba(62,109,67,0.3)]">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-forest md:text-4xl">
            Dosha Assessment
          </h1>
          <p className="mt-2 text-sm leading-6 text-forest/65">
            Discover your unique Ayurvedic body type in under 3 minutes
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-center gap-2">
              <div className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                    i < step
                      ? 'border-sage bg-sage text-white'
                      : i === step
                      ? 'border-sage bg-white text-sage shadow-[0_0_0_3px_rgba(90,133,83,0.15)]'
                      : 'border-forest/20 bg-white/60 text-forest/40'
                  }`}
                >
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <p
                  className={`hidden text-center text-xs font-medium sm:block ${
                    i === step ? 'text-sage' : i < step ? 'text-sage/70' : 'text-forest/35'
                  }`}
                >
                  {s.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 transition-all ${i < step ? 'bg-sage' : 'bg-forest/15'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="panel-frost overflow-hidden rounded-[2.4rem] p-6 lg:p-8">
          {step === 0 && (
            <div>
              <h2 className="mb-5 font-display text-xl font-semibold text-forest">
                Personal Information
              </h2>
              <PersonalInfoStep info={personalInfo} onChange={setPersonalInfo} />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-forest">Questions 1–5</h2>
                <span className="rounded-full bg-[#e6efdf] px-3 py-1 text-xs font-semibold text-sage">
                  {step2Answered}/5 answered
                </span>
              </div>
              {qSet1.map((field, i) => (
                <QuestionCard
                  key={field.key}
                  field={field}
                  value={answers[field.key]}
                  onChange={setAnswer}
                  index={i}
                  total={qSet1.length}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-forest">Questions 6–10</h2>
                <span className="rounded-full bg-[#e6efdf] px-3 py-1 text-xs font-semibold text-sage">
                  {step3Answered}/5 answered
                </span>
              </div>
              {qSet2.map((field, i) => (
                <QuestionCard
                  key={field.key}
                  field={field}
                  value={answers[field.key]}
                  onChange={setAnswer}
                  index={i + 5}
                  total={qSet2.length}
                />
              ))}
            </div>
          )}

          {step === 3 && <ResultStep result={result} />}

          {/* Error */}
          {error && (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </p>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between gap-4">
            {step > 0 && step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 rounded-2xl border border-[#cfe0c2] bg-white/80 px-5 py-3 text-sm font-semibold text-forest transition hover:bg-white"
              >
                <ArrowLeft size={16} /> Previous
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(62,109,67,0.25)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_38px_rgba(62,109,67,0.32)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  'Analysing...'
                ) : step === 2 ? (
                  <>View My Dosha <Sparkles size={16} /></>
                ) : (
                  <>Next <ArrowRight size={16} /></>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/dashboard/patient')}
                className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(62,109,67,0.25)] transition hover:translate-y-[-1px]"
              >
                Go to Dashboard <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
