import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Calendar,
  Loader2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Wind,
  Flame,
  Droplets,
  Leaf,
  FileText,
  Activity,
  Award,
} from 'lucide-react';
import api from '../api';
import { updateStoredAuth } from '../auth';
import { doshaAssessmentFields, doshaTherapies, doshaDietRecommendations } from '../data';
import { generateDoshaCertificatePDF } from '../utils/pdfExport';

const doshaInfo = {
  VATA: {
    name: 'Vata',
    subtitle: 'Air & Space Constitution',
    badge: 'bg-[#d0e8f8] text-[#2d6a96]',
    icon: Wind,
    emoji: '🌬️',
    description: 'Vata types are creative, enthusiastic, and energetic. Grounding routines and warm foods keep you in perfect balance.',
  },
  PITTA: {
    name: 'Pitta',
    subtitle: 'Fire & Water Constitution',
    badge: 'bg-[#fde8c8] text-[#a06030]',
    icon: Flame,
    emoji: '🔥',
    description: 'Pitta types are driven, focused, and passionate. Cooling foods, balance, and stress relief keep your fire steady.',
  },
  KAPHA: {
    name: 'Kapha',
    subtitle: 'Earth & Water Constitution',
    badge: 'bg-[#d8edd0] text-[#3d6835]',
    icon: Droplets,
    emoji: '🌊',
    description: 'Kapha types are nurturing, patient, and strong. Light, warm, well-spiced foods and active movement keep you vibrant.',
  },
  VATA_PITTA: {
    name: 'Vata-Pitta',
    subtitle: 'Air, Space & Fire Constitution',
    badge: 'bg-[#ecdfcf] text-[#6f5f48]',
    icon: Wind,
    emoji: '🌬️🔥',
    description: 'Combines rapid creativity with laser focus and ambition. Grounding routines and cooling balance nourish your mind and body.',
  },
  VATA_KAPHA: {
    name: 'Vata-Kapha',
    subtitle: 'Air, Space, Earth & Water',
    badge: 'bg-[#dceee5] text-[#3f6765]',
    icon: Wind,
    emoji: '🌬️🌊',
    description: 'Combines deep sensitivity and imagination with steadiness. Warmth, light nutrition, and daily rhythm benefit you best.',
  },
  PITTA_KAPHA: {
    name: 'Pitta-Kapha',
    subtitle: 'Fire, Water & Earth Constitution',
    badge: 'bg-[#efe7c8] text-[#75652d]',
    icon: Flame,
    emoji: '🔥🌊',
    description: 'Combines intense focus and determination with physical resilience. Active, cooling routines keep energy flowing smoothly.',
  },
  TRIDOSHA: {
    name: 'Tridosha',
    subtitle: 'Vata, Pitta & Kapha Balanced',
    badge: 'bg-[#e8efdf] text-[#52694b]',
    icon: Sparkles,
    emoji: '✨',
    description: 'Your constitution shows a rare and harmonious balance across all three doshas. Seasonal Ayurvedic alignment keeps you optimal.',
  },
};

const doshaOptionLabels = ['Vata', 'Pitta', 'Kapha'];
const doshaOptionColors = [
  'border-[#a8d0e8] bg-[#edf6fc] hover:bg-[#d8eef8] data-[selected]:border-[#4a8db5] data-[selected]:bg-[#d0e8f8]',
  'border-[#e8c898] bg-[#fdf6ea] hover:bg-[#fde8c8] data-[selected]:border-[#c07830] data-[selected]:bg-[#fde8c8]',
  'border-[#b0d8a0] bg-[#eef7ea] hover:bg-[#d8edd0] data-[selected]:border-[#5a8553] data-[selected]:bg-[#d8edd0]',
];
const doshaOptionTextColors = ['text-[#2d6a96]', 'text-[#a06030]', 'text-[#3d6835]'];

function QuestionCard({ field, value, onChange, index }) {
  return (
    <div className="space-y-3 bg-white p-5 rounded-2xl border border-emerald-900/10 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e6efdf] text-xs font-bold text-emerald-800">
          {index + 1}
        </span>
        <p className="pt-0.5 text-sm font-bold text-forest leading-snug">
          {field.label.replace(/^\d+\.\s*/, '')}
        </p>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {field.options.map((opt, i) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              data-selected={selected || undefined}
              onClick={() => onChange(field.key, opt)}
              className={`group flex flex-col justify-between gap-2 rounded-xl border-2 p-3.5 text-left transition-all duration-200 cursor-pointer ${doshaOptionColors[i]}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${doshaOptionTextColors[i]}`}>
                  {doshaOptionLabels[i]}
                </span>
                {selected && <CheckCircle2 size={14} className={doshaOptionTextColors[i]} />}
              </div>
              <span className="text-xs font-semibold text-forest/90 leading-relaxed">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CompletePatientProfile({ auth, onAuthUpdate }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // 1 = Age/Gender, 2 = Dosha Q1-5, 3 = Dosha Q6-10, 4 = Result
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
  });
  const [answers, setAnswers] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [doshaResult, setDoshaResult] = useState(null);

  const qSet1 = doshaAssessmentFields.slice(0, 5);
  const qSet2 = doshaAssessmentFields.slice(5, 10);

  const step1Valid = Boolean(formData.age && parseInt(formData.age, 10) > 0 && formData.gender);
  const step2Valid = qSet1.every((f) => answers[f.key]);
  const step3Valid = qSet2.every((f) => answers[f.key]);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        const response = await api.get('/patient/profile').catch(() => null);
        if (response && response.data) {
          const patient = response.data;
          let existingAge = patient.age || patient.user?.age || '';
          if (!existingAge && patient.dateOfBirth) {
            const birthDate = new Date(patient.dateOfBirth);
            const today = new Date();
            let years = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              years--;
            }
            existingAge = years > 0 ? years : '';
          }

          setFormData({
            age: existingAge ? String(existingAge) : '',
            gender: patient.gender || auth?.gender || '',
          });
        }
      } catch (err) {
        console.warn('Could not fetch pre-fill profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientProfile();
  }, [auth?.gender]);

  const handleAnswerChange = (key, val) => {
    setAnswers((prev) => ({ ...prev, [key]: val }));
    if (error) setError('');
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    setError('');
    const numericAge = parseInt(formData.age, 10);
    if (!formData.age || isNaN(numericAge) || numericAge <= 0 || numericAge > 120) {
      setError('Please enter a valid age between 1 and 120.');
      return;
    }
    if (!formData.gender) {
      setError('Please select your gender.');
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    setError('');
    if (!step2Valid) {
      setError('Please answer all 5 questions on this page to proceed.');
      return;
    }
    setCurrentStep(3);
  };

  const handleFinalSubmit = async () => {
    setError('');
    if (!step3Valid) {
      setError('Please answer all 5 questions on this page to complete your assessment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const numericAge = parseInt(formData.age, 10);
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - numericAge);
      const formattedDob = dob.toISOString().split('T')[0];

      // 1. Save mandatory Age & Gender profile
      await api.put('/patient/profile', {
        age: numericAge,
        dateOfBirth: formattedDob,
        gender: formData.gender,
      });

      // 2. Submit mandatory Dosha assessment answers
      const { data: resultData } = await api.post('/patient/dosha-assessment', answers);
      setDoshaResult(resultData);

      // 3. Update auth state
      const updatedAuth = updateStoredAuth({
        profileCompleted: true,
        doshaAssessmentCompleted: true,
        dominantDosha: resultData.dominantDosha,
        doshaAssessmentDate: resultData.doshaAssessmentDate,
        vataScore: resultData.vataScore,
        pittaScore: resultData.pittaScore,
        kaphaScore: resultData.kaphaScore,
        age: numericAge,
        gender: formData.gender,
      });

      if (onAuthUpdate) onAuthUpdate(updatedAuth);
      setCurrentStep(4); // Move to final result display step
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to complete profile. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-[#ddcdb3] bg-[#fffdf9] px-11 py-3 text-forest shadow-xs outline-none transition placeholder:text-forest/35 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 font-medium text-sm';
  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-forest/80 mb-2';

  return (
    <div className="min-h-screen bg-[#f5faf2] font-body text-forest flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb left-[-4rem] top-12 h-80 w-80 bg-[#d7e6cb]" />
        <div className="ambient-orb right-[-5rem] bottom-12 h-96 w-96 bg-[#ebd5b7]" />
        <div className="noise-grid absolute inset-0 opacity-[0.08]" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Step Progress Bar */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-900/10 bg-white/90 p-4 shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-900 border border-emerald-200">
              {currentStep === 4 ? '✓' : `Step ${currentStep}/3`}
            </span>
            <div>
              <p className="text-xs font-bold text-forest uppercase tracking-wider">
                {currentStep === 1 && '1. Basic Information (Age & Gender)'}
                {currentStep === 2 && '2. Ayurvedic Prakriti Assessment (Questions 1–5)'}
                {currentStep === 3 && '3. Ayurvedic Prakriti Assessment (Questions 6–10)'}
                {currentStep === 4 && '4. Profile & Prakriti Diagnosis Completed!'}
              </p>
              <p className="text-[11px] text-forest/60">Mandatory Patient Profile Completion</p>
            </div>
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep >= stepNum ? 'w-8 bg-emerald-600' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-emerald-900/10 bg-white/95 p-6 md:p-8 shadow-xl backdrop-blur-md space-y-6">
          {isLoading ? (
            <div className="py-16 text-center text-forest/60 space-y-3">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-700" />
              <p className="text-xs font-semibold">Loading profile configuration...</p>
            </div>
          ) : (
            <>
              {/* STEP 1: AGE & GENDER */}
              {currentStep === 1 && (
                <form onSubmit={handleStep1Next} className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                      <Sparkles size={24} />
                    </div>
                    <h1 className="font-display text-2xl font-extrabold text-[#163322]">
                      Complete Patient Profile
                    </h1>
                    <p className="text-xs text-forest/70 max-w-md mx-auto leading-relaxed">
                      Please enter your age and gender to begin your mandatory Ayurvedic care profile and Dosha diagnosis.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                    {/* Age Field */}
                    <div>
                      <label htmlFor="age" className={labelClass}>
                        Age (Years) <span className="text-rose-600 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-800/60" size={18} />
                        <input
                          type="number"
                          name="age"
                          id="age"
                          min="1"
                          max="120"
                          placeholder="Enter your age (e.g. 28)"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                          className={inputClass}
                          required
                        />
                      </div>
                    </div>

                    {/* Gender Field */}
                    <div>
                      <label htmlFor="gender" className={labelClass}>
                        Gender <span className="text-rose-600 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-800/60" size={18} />
                        <select
                          name="gender"
                          id="gender"
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className={`${inputClass} appearance-none cursor-pointer`}
                          required
                        >
                          <option value="">-- Select Gender --</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-forest/50 text-xs">
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-center text-xs font-bold text-rose-700 max-w-md mx-auto">
                      {error}
                    </div>
                  )}

                  <div className="pt-2 max-w-md mx-auto">
                    <button
                      type="submit"
                      disabled={!step1Valid}
                      className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] text-sm font-bold text-white shadow-md transition hover:shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      <span>Continue to Dosha Assessment</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: DOSHA QUESTIONS 1–5 */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-sand/40 pb-4">
                    <div>
                      <h2 className="font-display text-xl font-bold text-[#163322]">
                        Ayurvedic Prakriti Assessment (Part 1/2)
                      </h2>
                      <p className="text-xs text-forest/70 mt-0.5">
                        Answer questions 1 to 5 to evaluate your physical and mental traits.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      5 Questions
                    </span>
                  </div>

                  <div className="space-y-4">
                    {qSet1.map((field, idx) => (
                      <QuestionCard
                        key={field.key}
                        field={field}
                        value={answers[field.key]}
                        onChange={handleAnswerChange}
                        index={idx}
                      />
                    ))}
                  </div>

                  {error && (
                    <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-center text-xs font-bold text-rose-700">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleStep2Next}
                      disabled={!step2Valid}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] text-xs font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                    >
                      <span>Next: Questions 6–10</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: DOSHA QUESTIONS 6–10 */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-sand/40 pb-4">
                    <div>
                      <h2 className="font-display text-xl font-bold text-[#163322]">
                        Ayurvedic Prakriti Assessment (Part 2/2)
                      </h2>
                      <p className="text-xs text-forest/70 mt-0.5">
                        Answer questions 6 to 10 to calculate your dominant Prakriti constitution.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      Final 5 Questions
                    </span>
                  </div>

                  <div className="space-y-4">
                    {qSet2.map((field, idx) => (
                      <QuestionCard
                        key={field.key}
                        field={field}
                        value={answers[field.key]}
                        onChange={handleAnswerChange}
                        index={idx + 5}
                      />
                    ))}
                  </div>

                  {error && (
                    <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-center text-xs font-bold text-rose-700">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={!step3Valid || isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#164E3D] text-xs font-bold text-white shadow-md hover:bg-[#113f31] disabled:opacity-60 cursor-pointer transition"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Calculating Prakriti...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Complete & Save Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: RESULT & DIAGNOSIS SUMMARY */}
              {currentStep === 4 && doshaResult && (
                <div className="space-y-6">
                  {(() => {
                    const domKey = (doshaResult.dominantDosha || 'VATA').toUpperCase().replace('-', '_');
                    const info = doshaInfo[domKey] || doshaInfo.VATA;
                    const Icon = info.icon;

                    const vRaw = Number(doshaResult.vataScore) || 0;
                    const pRaw = Number(doshaResult.pittaScore) || 0;
                    const kRaw = Number(doshaResult.kaphaScore) || 0;
                    const total = vRaw + pRaw + kRaw || 1;
                    const vPct = Math.round((vRaw / total) * 100);
                    const pPct = Math.round((pRaw / total) * 100);
                    const kPct = Math.round((kRaw / total) * 100);

                    const diet = doshaDietRecommendations[domKey] || doshaDietRecommendations.VATA;

                    return (
                      <div className="space-y-6">
                        <div className="text-center space-y-3 border-b border-sand/40 pb-5">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-800 shadow-xs border border-emerald-200">
                            <Icon size={32} />
                          </div>
                          <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-extrabold ${info.badge}`}>
                            {info.emoji} {info.name} Prakriti Diagnosed
                          </span>
                          <h2 className="font-display text-2xl font-black text-[#163322]">
                            Your Body Constitution (Prakriti)
                          </h2>
                          <p className="text-xs text-forest/75 max-w-md mx-auto leading-relaxed">
                            {info.description}
                          </p>
                        </div>

                        {/* Ratio breakdown */}
                        <div className="rounded-2xl bg-sand/20 border border-sand/40 p-4 space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-forest/60">
                            Dosha Score Balance:
                          </p>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-xl bg-[#d0e8f8]/60 p-2.5">
                              <span className="text-[10px] font-bold text-[#2d6a96] uppercase">Vata</span>
                              <p className="text-base font-black text-[#2d6a96]">{vPct}%</p>
                            </div>
                            <div className="rounded-xl bg-[#fde8c8]/60 p-2.5">
                              <span className="text-[10px] font-bold text-[#a06030] uppercase">Pitta</span>
                              <p className="text-base font-black text-[#a06030]">{pPct}%</p>
                            </div>
                            <div className="rounded-xl bg-[#d8edd0]/60 p-2.5">
                              <span className="text-[10px] font-bold text-[#3d6835] uppercase">Kapha</span>
                              <p className="text-base font-black text-[#3d6835]">{kPct}%</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              generateDoshaCertificatePDF({
                                patientName: auth?.fullName || 'Patient',
                                patientEmail: auth?.email || '',
                                primaryDosha: info.name,
                                vataScore: vPct,
                                pittaScore: pPct,
                                kaphaScore: kPct,
                                assessmentDate: doshaResult.doshaAssessmentDate || new Date().toLocaleDateString(),
                              });
                            }}
                            className="w-full sm:w-auto flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-2xl border border-emerald-800 text-emerald-900 bg-emerald-50 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
                          >
                            <FileText size={16} />
                            <span>Download Dosha Certificate (PDF)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              navigate('/dashboard/patient', { replace: true });
                            }}
                            className="w-full sm:w-auto flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] text-xs font-bold text-white shadow-md hover:shadow-lg cursor-pointer transition"
                          >
                            <span>Enter Patient Dashboard</span>
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}