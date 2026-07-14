import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Droplets,
  Flame,
  HeartPulse,
  Leaf,
  Mail,
  Phone,
  Sparkles,
  User,
  Wind,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// ─── Dosha display map ─────────────────────────────────────────
const doshaDisplay = {
  VATA: {
    label: 'Vata', subtitle: 'Air & Space', emoji: '🌬️',
    icon: Wind,
    gradient: 'from-[#e8f4fd] to-[#d0e8f8]',
    border: 'border-[#a8d0e8]',
    accent: '#4a8db5',
    badge: 'bg-[#d0e8f8] text-[#2d6a96]',
    bar: '#4a8db5',
  },
  PITTA: {
    label: 'Pitta', subtitle: 'Fire & Water', emoji: '🔥',
    icon: Flame,
    gradient: 'from-[#fef3e2] to-[#fde8c8]',
    border: 'border-[#e8c898]',
    accent: '#c07830',
    badge: 'bg-[#fde8c8] text-[#a06030]',
    bar: '#c07830',
  },
  KAPHA: {
    label: 'Kapha', subtitle: 'Earth & Water', emoji: '🌊',
    icon: Droplets,
    gradient: 'from-[#edf6e8] to-[#d8edd0]',
    border: 'border-[#b0d8a0]',
    accent: '#5a8553',
    badge: 'bg-[#d8edd0] text-[#3d6835]',
    bar: '#5a8553',
  },
};

function ScoreBar({ label, value, total, color, emoji }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-forest">
          {emoji} {label}
        </span>
        <span className="font-bold text-forest">{value}/{total}</span>
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

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-forest/50">{label}</p>
      <p className="text-sm font-medium text-forest text-right">{value}</p>
    </div>
  );
}

export default function PatientProfilePage({ auth }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data } = await api.get('/patient/profile');
        setProfile(data);
      } catch {
        // Fallback to auth data if API fails
        setProfile({
          fullName: auth?.fullName,
          email: auth?.email,
          dominantDosha: auth?.dominantDosha,
          doshaAssessmentCompleted: auth?.doshaAssessmentCompleted,
        });
        setError('Could not load full profile from server. Showing cached data.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [auth]);

  const dosha = profile?.dominantDosha ? doshaDisplay[profile.dominantDosha] : null;
  const DoshaIcon = dosha?.icon;
  const doshaCompleted = Boolean(
    profile?.doshaAssessmentCompleted === true ||
      profile?.doshaAssessmentCompleted === 'true' ||
      profile?.dominantDosha,
  );
  const total = (profile?.vataScore || 0) + (profile?.pittaScore || 0) + (profile?.kaphaScore || 0) || 10;

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'P';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dashboard-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-sage border-t-transparent" />
          <p className="text-sm text-forest/60">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dashboard-surface min-h-screen font-body text-forest">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb left-[-4rem] top-24 h-72 w-72 bg-[#d7e6cb]" />
        <div className="ambient-orb right-[-5rem] top-12 h-80 w-80 bg-[#ebd5b7]" />
        <div className="noise-grid absolute inset-0 opacity-[0.08]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-8 lg:px-6 lg:py-12">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-forest/60 transition hover:text-forest"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {error && (
          <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {error}
          </p>
        )}

        {/* Avatar hero */}
        <div className="panel-frost mb-6 overflow-hidden rounded-[2.4rem] p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#e6efdf_0%,#c8e2bc_100%)] text-3xl font-bold text-sage shadow-[0_8px_24px_rgba(90,133,83,0.2)]">
              {initials}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest/45">Patient Profile</p>
              <h1 className="mt-1 font-display text-3xl font-bold text-forest">
                {profile?.fullName || 'Patient'}
              </h1>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {profile?.email && (
                  <span className="flex items-center gap-1.5 rounded-full border border-[#dce7d4] bg-white/70 px-3 py-1 text-xs font-medium text-forest/65">
                    <Mail size={12} /> {profile.email}
                  </span>
                )}
                {profile?.phone && (
                  <span className="flex items-center gap-1.5 rounded-full border border-[#dce7d4] bg-white/70 px-3 py-1 text-xs font-medium text-forest/65">
                    <Phone size={12} /> {profile.phone}
                  </span>
                )}
                {dosha && (
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${dosha.badge}`}>
                    {dosha.emoji} {dosha.label} Dominant
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal details */}
          <div className="panel-frost rounded-[2.2rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-[#e6efdf] p-2.5 text-sage"><User size={16} /></div>
              <p className="text-sm font-bold text-forest">Personal Details</p>
            </div>
            <div className="divide-y divide-forest/8">
              <InfoRow label="Age" value={profile?.age ? `${profile.age} years` : null} />
              <InfoRow label="Gender" value={profile?.gender} />
              <InfoRow label="Height" value={profile?.height} />
              <InfoRow label="Weight" value={profile?.weight} />
              <InfoRow label="Occupation" value={profile?.occupation} />
            </div>
          </div>

          {/* Dosha card */}
          {dosha ? (
            <div className={`relative overflow-hidden rounded-[2.2rem] border-2 bg-gradient-to-br ${dosha.gradient} ${dosha.border} p-5`}>
              <div className="noise-grid absolute inset-0 opacity-5" />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl p-2.5" style={{ background: `${dosha.accent}20` }}>
                    {DoshaIcon && <DoshaIcon size={16} style={{ color: dosha.accent }} />}
                  </div>
                  <p className="text-sm font-bold text-forest">Your Dosha Type</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-display text-4xl font-bold" style={{ color: dosha.accent }}>
                    {dosha.emoji} {dosha.label}
                  </p>
                </div>
                <p className="mt-1 text-sm font-medium text-forest/60">{dosha.subtitle}</p>
                {profile?.doshaAssessmentDate && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-forest/50">
                    <CalendarDays size={12} />
                    Assessed on {new Date(profile.doshaAssessmentDate).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[2.2rem] border-2 border-dashed border-forest/20 bg-white/40 p-6 text-center">
              <Sparkles size={28} className="mb-3 text-forest/30" />
              <p className="text-sm font-semibold text-forest/50">Dosha Not Assessed Yet</p>
              <p className="mt-1 text-xs text-forest/35">Take the assessment to discover your body type</p>
              {!doshaCompleted ? (
                <button
                  onClick={() => navigate('/dosha-assessment')}
                  className="mt-4 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-2 text-xs font-semibold text-white"
                >
                  Take Assessment
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Dosha scores */}
        {doshaCompleted && (
          <div className="panel-frost mt-6 rounded-[2.2rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-[#e6efdf] p-2.5 text-sage"><HeartPulse size={16} /></div>
              <p className="text-sm font-bold text-forest">Dosha Score Breakdown</p>
            </div>
            <div className="space-y-4">
              <ScoreBar label="Vata" value={profile?.vataScore || 0} total={total} color="#4a8db5" emoji="🌬️" />
              <ScoreBar label="Pitta" value={profile?.pittaScore || 0} total={total} color="#c07830" emoji="🔥" />
              <ScoreBar label="Kapha" value={profile?.kaphaScore || 0} total={total} color="#5a8553" emoji="🌊" />
            </div>
          </div>
        )}

        {/* Recommended therapies */}
        {profile?.recommendedTherapies?.length > 0 && (
          <div className="mt-6 rounded-[2.2rem] border border-[#dce7d4] bg-[linear-gradient(135deg,#eff8ea_0%,#f7fcf2_100%)] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-[#d8edd0] p-2.5 text-sage"><Leaf size={16} /></div>
              <p className="text-sm font-bold text-forest">Recommended Therapies</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {profile.recommendedTherapies.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[#b0d8a0] bg-white/80 px-4 py-2 text-sm font-semibold text-sage"
                >
                  🌿 {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Assessment answers */}
        {doshaCompleted && profile?.bodyBuild && (
          <div className="panel-frost mt-6 rounded-[2.2rem] p-5">
            <p className="mb-4 text-sm font-bold text-forest">Assessment Answers</p>
            <div className="grid gap-x-8 md:grid-cols-2">
              <div className="divide-y divide-forest/8">
                <InfoRow label="Body Build" value={profile.bodyBuild} />
                <InfoRow label="Skin Type" value={profile.skinType} />
                <InfoRow label="Appetite" value={profile.appetite} />
                <InfoRow label="Digestion" value={profile.digestion} />
                <InfoRow label="Sleep Pattern" value={profile.sleepPattern} />
              </div>
              <div className="divide-y divide-forest/8">
                <InfoRow label="Energy Level" value={profile.energyLevel} />
                <InfoRow label="Stress Response" value={profile.stressResponse} />
                <InfoRow label="Climate Preference" value={profile.climatePreference} />
                <InfoRow label="Walking Style" value={profile.walkingStyle} />
                <InfoRow label="Personality" value={profile.personality} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
