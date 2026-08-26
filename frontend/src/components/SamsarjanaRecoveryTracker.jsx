import { useState, useEffect } from 'react';
import { Utensils, CheckCircle, Flame, Clock, ShieldAlert, Sparkles, BookOpen, Info, HeartHandshake, AlertTriangle, Stethoscope, Activity, Thermometer, UserCheck, Volume2, VolumeX, Play } from 'lucide-react';
import api from '../api';

const SAMSARJANA_STAGES = [
  {
    day: 1,
    name: 'Day 1',
    englishTitle: 'Warm Rice Water Broth',
    sanskritTitle: 'Peya Stage',
    tagline: 'Liquid Broth Only • Gentle Stomach Ignition',
    simpleExplanation: 'Today your stomach is like a small weak flame after cleaning. Drink ONLY warm rice liquid. NO solid food today!',
    recipeSteps: [
      'Take 1 cup white rice and 14 cups water in a cooking pot.',
      'Boil until the rice becomes completely soft.',
      'Filter out all rice grains so only clear liquid remains.',
      'Add a tiny pinch of salt and drink warm.'
    ],
    schedule: [
      { icon: '🌅', time: 'Morning 8:00 AM', item: '1 cup Warm Strained Rice Water' },
      { icon: '☀️', time: 'Afternoon 1:00 PM', item: '1-2 cups Warm Rice Water + Pinch of Salt' },
      { icon: '🌙', time: 'Night 7:00 PM', item: '1 cup Warm Strained Rice Water' }
    ],
    doctorNote: 'Hello! Today is Day 1 after your detox. Your stomach capacity is very weak. Drink only warm rice water broth slowly like tea. Do not eat solid food or drink cold water.',
    voiceText: 'Hello! Today is Day 1 of your diet after treatment. Your stomach is very delicate. Please drink only warm strained rice water. Do not eat solid food, ghee, or cold water today.',
    samyakLakshana: ['Stomach feels light', 'No burping or sour taste', 'Feeling naturally hungry'],
    warningLakshana: ['Feeling like vomiting', 'Stomach pain', 'Cold chills'],
    pathya: [
      'Warm strained rice liquid (Peya)',
      'Tiny pinch of rock salt (Saindhava Namak)',
      'Sips of warm boiled water'
    ],
    apathya: [
      'Solid rice grains or ANY solid food',
      'Cooking oil, ghee, or butter',
      'Spices (chili, pepper, garlic)',
      'Cold water, ice, or cold drinks',
      'Milk, curd, or tea with milk'
    ],
    color: 'border-amber-300 bg-amber-50/80 text-amber-950',
    badge: 'bg-amber-200 text-amber-900 border border-amber-300',
  },
  {
    day: 2,
    name: 'Day 2',
    englishTitle: 'Thick Soft Rice Porridge',
    sanskritTitle: 'Vilepi Stage',
    tagline: 'Soft Porridge Phase • Light Energy',
    simpleExplanation: 'Your stomach is getting stronger! Today you can eat soft rice mashed into porridge with half teaspoon ghee.',
    recipeSteps: [
      'Take 1 cup white rice and 4 cups water.',
      'Boil until rice becomes very thick and soft like porridge.',
      'Add half teaspoon pure cow ghee and a pinch of salt.',
      'Eat warm with a spoon.'
    ],
    schedule: [
      { icon: '🌅', time: 'Morning 8:00 AM', item: '1 small bowl Soft Rice Porridge' },
      { icon: '☀️', time: 'Afternoon 1:00 PM', item: '1 medium bowl Soft Rice Porridge + 1/2 tsp Cow Ghee' },
      { icon: '🌙', time: 'Night 7:00 PM', item: '1 small bowl Warm Soft Rice Porridge' }
    ],
    doctorNote: 'Good morning! Today is Day 2. You can now eat soft cooked rice porridge. Half teaspoon cow ghee is allowed today to heal your stomach lining.',
    voiceText: 'Good morning! Today is Day 2. You can now eat thick soft rice porridge. You can add half teaspoon pure cow ghee. Do not eat spicy food or raw vegetables.',
    samyakLakshana: ['Soft comfortable digestion', 'No gas or bloating', 'Good steady energy'],
    warningLakshana: ['Stomach heavy for >2 hours', 'Heartburn or chest burning'],
    pathya: [
      'Thick warm soft-cooked rice porridge (Vilepi)',
      '1/2 tsp pure Cow Ghee per meal',
      'Pinch of cumin (Jeera) powder & rock salt',
      'Warm boiled drinking water'
    ],
    apathya: [
      'Heavy pulses (chana, rajma, urad dal)',
      'Raw salad, cucumber, or uncooked vegetables',
      'Spicy peppers or chili',
      'Fried snacks or bakery items'
    ],
    color: 'border-emerald-300 bg-emerald-50/80 text-emerald-950',
    badge: 'bg-emerald-200 text-emerald-900 border border-emerald-300',
  },
  {
    day: 3,
    name: 'Day 3',
    englishTitle: 'Clear Yellow Mung Soup',
    sanskritTitle: 'Akrita Yusha Stage',
    tagline: 'Light Protein Broth • Oil-Free Mung Dal',
    simpleExplanation: 'Today we give light strength to your body using clear yellow moong dal liquid. No oil or heavy spices yet.',
    recipeSteps: [
      'Take 1/2 cup yellow split moong dal and 4 cups water.',
      'Boil until dal completely melts into liquid.',
      'Filter out dal skins.',
      'Add rock salt & drink warm clear mung soup.'
    ],
    schedule: [
      { icon: '🌅', time: 'Morning 8:00 AM', item: '1 cup Warm Clear Mung Broth' },
      { icon: '☀️', time: 'Afternoon 1:00 PM', item: '1-2 cups Clear Mung Broth + 1/2 bowl soft rice' },
      { icon: '🌙', time: 'Night 7:00 PM', item: '1 cup Warm Clear Mung Broth' }
    ],
    doctorNote: 'Day 3 introduces light yellow moong dal broth. Moong dal gives strength to your body without making your stomach heavy.',
    voiceText: 'Welcome to Day 3! Today you can drink clear yellow moong dal soup. It gives strength to your body. Drink it warm with a pinch of salt.',
    samyakLakshana: ['Clean pink tongue', 'Light feeling in body', 'Good appetite for dinner'],
    warningLakshana: ['Foul burping', 'Loose motions'],
    pathya: [
      'Clear yellow split moong dal soup (Akrita Yusha)',
      'Rock salt & small slice fresh ginger',
      'Warm ginger water sips'
    ],
    apathya: [
      'Onions, garlic, & heavy spices',
      'Non-veg (Meat, chicken, fish, eggs)',
      'Heavy cooking oils',
      'Cold fridge water or old food'
    ],
    color: 'border-teal-300 bg-teal-50/80 text-teal-950',
    badge: 'bg-teal-200 text-teal-900 border border-teal-300',
  },
  {
    day: 4,
    name: 'Day 4',
    englishTitle: 'Seasoned Mung Soup & Soft Rice',
    sanskritTitle: 'Krita Yusha Stage',
    tagline: 'Tempered Meal Phase • Rebuilding Full Power',
    simpleExplanation: 'Today you eat soft rice with moong dal soup spiced with cumin and turmeric. Your digestive fire is strong now.',
    recipeSteps: [
      'Cook yellow moong dal and soft white rice.',
      'In a small pan, heat 1/2 tsp ghee, add cumin seeds (jeera) and turmeric (haldi).',
      'Mix tempered ghee into the moong dal soup.',
      'Eat warm moong dal soup over soft white rice.'
    ],
    schedule: [
      { icon: '🌅', time: 'Morning 8:00 AM', item: 'Warm Moong Soup or soft porridge' },
      { icon: '☀️', time: 'Afternoon 1:00 PM', item: '1 bowl Soft Steamed Rice + Seasoned Moong Dal' },
      { icon: '🌙', time: 'Night 7:00 PM', item: '1 bowl Moong Dal Soup + Steamed Bottle Gourd (Lauki)' }
    ],
    doctorNote: 'Day 4 is the seasoning phase. Cumin seeds, turmeric, and ghee awaken your stomach enzymes so you digest solid cooked rice and dal easily.',
    voiceText: 'Day 4 is here! You can now enjoy soft white rice with moong dal soup tempered with cumin seeds and turmeric. Chew every bite slowly.',
    samyakLakshana: ['Fullness without heaviness', 'Happy, active mood', 'Normal bowel movement'],
    warningLakshana: ['Severe stomach gas', 'Acidity'],
    pathya: [
      'Tempered moong dal soup with cumin & turmeric',
      'Freshly steamed soft white rice',
      'Steamed light vegetables (Lauki / Ridge gourd / Pumpkin)',
      'Fresh coriander leaves'
    ],
    apathya: [
      'Deep fried foods (samosa, chips, pakora)',
      'Ice cream or cold milkshakes',
      'Packaged junk snacks',
      'Late night dinners after 8:00 PM'
    ],
    color: 'border-blue-300 bg-blue-50/80 text-blue-950',
    badge: 'bg-blue-200 text-blue-900 border border-blue-300',
  },
  {
    day: 5,
    name: 'Day 5',
    englishTitle: 'Normal Soft Balanced Meals',
    sanskritTitle: 'Sadhana Ahara Stage',
    tagline: 'Full Recovery Phase • Normal Healthy Diet',
    simpleExplanation: 'Congratulations! Your stomach is fully recovered. You can eat fresh home-cooked soft meals (Roti, Rice, Dal, Vegetables).',
    recipeSteps: [
      'Prepare fresh home-cooked meals.',
      'Soft wheat roti or rice, mild vegetable curry (lauki/carrot), mung dal.',
      'Eat fresh fruits like papaya or pomegranate.'
    ],
    schedule: [
      { icon: '🌅', time: 'Morning 8:00 AM', item: 'Fresh Papaya or warm oatmeal' },
      { icon: '☀️', time: 'Afternoon 1:00 PM', item: 'Soft Roti/Rice + Mild Vegetable Curry + Dal' },
      { icon: '🌙', time: 'Night 7:00 PM', item: 'Light Vegetable Soup or soft rice' }
    ],
    doctorNote: 'Congratulations! Your 5-day stomach recovery diet is complete today. Your stomach fire is fully restored. You can return to normal fresh home meals.',
    voiceText: 'Congratulations! Your 5-day diet is completed today. Your stomach power is fully restored. You can return to normal healthy home meals.',
    samyakLakshana: ['Strong hunger before meals', 'Full body strength restored', 'Clean, light feeling all day'],
    warningLakshana: ['Overeating discomfort'],
    pathya: [
      'Fresh home-cooked meals (Roti, Rice, Dal, Vegetables)',
      'Fresh fruits (Papaya, Pomegranate, Apple)',
      'Cooked seasonal vegetables',
      'Warm cumin water'
    ],
    apathya: [
      'Alcohol, sodas, or heavy coffee',
      'Overeating or late night dinners',
      'Heavy oily restaurant food'
    ],
    color: 'border-purple-300 bg-purple-50/80 text-purple-950',
    badge: 'bg-purple-200 text-purple-900 border border-purple-300',
  },
];

export default function SamsarjanaRecoveryTracker({ patientId, patientName }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState(null);
  const [digestiveState, setDigestiveState] = useState('NORMAL');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await api.get(`/samsarjana/patient/${patientId}`);
        if (res.data && res.data.id) {
          setPlan(res.data);
          setSelectedDayTab(res.data.currentDay);
        } else {
          setPlan(null);
        }
      } catch (err) {
        console.error('Failed to fetch Samsarjana recovery plan', err);
      } finally {
        setLoading(false);
      }
    }
    if (patientId) fetchPlan();
  }, [patientId]);

  const handleSpeakText = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('Voice playback is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85; // Calmer, unhurried pace for patients
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleLogDay = async () => {
    if (!plan) return;
    setLogging(true);
    try {
      const res = await api.put(`/samsarjana/${plan.id}/log-day`);
      setPlan(res.data);
      if (res.data.currentDay <= 5) {
        setSelectedDayTab(res.data.currentDay);
      }
    } catch (err) {
      alert('Failed to update recovery progress');
    } finally {
      setLogging(false);
    }
  };

  const handleCreateDemoPlan = async () => {
    setLoading(true);
    try {
      const res = await api.post('/samsarjana/assign', {
        patientId,
        patientName: patientName || 'Patient',
        therapyName: 'Virechana Purgation Detox',
        totalDays: 5,
        assignedByDoctorName: 'Dr. Vaidya (Senior Consultant)'
      });
      setPlan(res.data);
      setSelectedDayTab(res.data.currentDay);
    } catch (err) {
      alert('Failed to initialize plan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-xs text-forest/60">Loading your post-therapy recovery diet plan...</div>;
  }

  if (!plan) {
    return (
      <div className="rounded-3xl border border-sand/40 bg-white/80 p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <Utensils size={24} />
        </div>
        <h3 className="font-display text-lg font-bold text-forest">Post-Procedure Diet Navigator</h3>
        <p className="mt-1 text-xs text-forest/70 max-w-md mx-auto leading-relaxed">
          No active post-therapy recovery diet is currently assigned. Doctors automatically activate this step-by-step diet guide after completing your main Panchakarma detox (e.g. Virechana or Vamana).
        </p>
        <button
          onClick={handleCreateDemoPlan}
          className="mt-4 rounded-xl bg-forest px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-forest/90 transition inline-flex items-center gap-1.5"
        >
          <Sparkles size={14} /> Activate Post-Detox Recovery Plan
        </button>
      </div>
    );
  }

  const activeDayNumber = selectedDayTab || plan.currentDay;
  const activeStageIndex = Math.min(Math.max(activeDayNumber - 1, 0), SAMSARJANA_STAGES.length - 1);
  const activeStage = SAMSARJANA_STAGES[activeStageIndex];
  const isViewingCurrentActiveDay = activeDayNumber === plan.currentDay && plan.status === 'ACTIVE';

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-6 shadow-sm space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sand/30 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/90 border border-amber-300 px-3 py-0.5 rounded-full">
            <Stethoscope size={13} /> Doctor's Easy Patient Diet Guide
          </div>
          <h3 className="font-display text-2xl font-bold text-forest mt-1.5 flex items-center gap-2">
            🥗 Post-Detox Meal Guide <span className="text-xs font-normal text-forest/60">(Samsarjana Diet)</span>
          </h3>
          <p className="text-xs text-forest/75 mt-0.5">
            After Treatment: <strong>{plan.therapyName}</strong> • Prescribed by <strong>{plan.assignedByDoctorName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Prescription Player Button for Elderly/Uneducated Patients */}
          <button
            onClick={() => handleSpeakText(activeStage.voiceText)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
              isSpeaking ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-700 text-white hover:bg-emerald-800'
            }`}
          >
            {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isSpeaking ? 'Stop Voice' : '🔊 Listen to Doctor Voice'}</span>
          </button>

          <div className={`text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 ${
            plan.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-amber-100 text-amber-950 border border-amber-300'
          }`}>
            {plan.status === 'COMPLETED' ? (
              <><CheckCircle size={14} className="text-emerald-600" /> Diet Complete 🎉</>
            ) : (
              <><Flame size={14} className="text-amber-600 animate-pulse" /> Active: Day {plan.currentDay} of {plan.totalDays}</>
            )}
          </div>
        </div>
      </div>

      {/* Doctor's Audio & Simple Directive Box */}
      <div className="bg-gradient-to-r from-emerald-900 via-forest to-emerald-800 text-white rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Stethoscope size={18} /> Doctor's Voice Directive for Day {activeStage.day}:
          </div>
          <button
            onClick={() => handleSpeakText(activeStage.voiceText)}
            className="text-[11px] bg-amber-400 text-slate-900 px-3 py-1 rounded-lg font-bold hover:bg-amber-300 transition flex items-center gap-1"
          >
            <Play size={12} /> Press to Hear Speech
          </button>
        </div>

        <p className="text-sm text-amber-100 font-medium leading-relaxed bg-white/10 p-3 rounded-xl border border-white/10">
          "{activeStage.doctorNote}"
        </p>

        <div className="text-xs text-emerald-100 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/50 flex items-center gap-2">
          <Info size={16} className="text-amber-300 shrink-0" />
          <span><strong>Easy Rule for Today:</strong> {activeStage.simpleExplanation}</span>
        </div>
      </div>

      {/* Interactive Stomach Check (Simplified for Uneducated Patients) */}
      <div className="bg-sand/20 border border-sand/40 rounded-2xl p-4 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-forest flex items-center gap-1.5 text-sm">
            <Activity size={16} className="text-emerald-700" /> How is your stomach feeling right now?
          </h4>
          <span className="text-[11px] text-forest/60">Tap your stomach feeling below:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            onClick={() => setDigestiveState('EXCELLENT')}
            className={`p-3 rounded-xl border text-left font-medium transition ${
              digestiveState === 'EXCELLENT' ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400' : 'bg-white text-forest border-sand/40 hover:bg-emerald-50'
            }`}
          >
            <div className="font-bold text-sm">🟢 Light & Hungry</div>
            <div className="text-[11px] opacity-90 mt-0.5">Stomach feels good. You can eat today's meal.</div>
          </button>

          <button
            onClick={() => setDigestiveState('NORMAL')}
            className={`p-3 rounded-xl border text-left font-medium transition ${
              digestiveState === 'NORMAL' ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400' : 'bg-white text-forest border-sand/40 hover:bg-amber-50'
            }`}
          >
            <div className="font-bold text-sm">🟡 Comfortable & Normal</div>
            <div className="text-[11px] opacity-90 mt-0.5">Sip warm water slowly between meals.</div>
          </button>

          <button
            onClick={() => setDigestiveState('BLOATED')}
            className={`p-3 rounded-xl border text-left font-medium transition ${
              digestiveState === 'BLOATED' ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400' : 'bg-white text-forest border-sand/40 hover:bg-rose-50'
            }`}
          >
            <div className="font-bold text-sm">🔴 Heavy / Gas / Bloated</div>
            <div className="text-[11px] opacity-90 mt-0.5">Do NOT eat solid food. Drink warm cumin water only.</div>
          </button>
        </div>

        {digestiveState === 'BLOATED' && (
          <div className="bg-rose-100 border border-rose-300 text-rose-950 p-3 rounded-xl flex items-center gap-2.5 text-xs animate-fadeIn mt-2 font-medium">
            <AlertTriangle size={18} className="text-rose-700 shrink-0" />
            <div>
              <strong>Doctor Advice for Gas/Heaviness:</strong> Stop eating solid food right now! Boil 1 glass of water with half teaspoon cumin seeds (jeera) and sip warm until stomach feels light.
            </div>
          </div>
        )}
      </div>

      {/* 5-Day Timeline Stepper Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} className="text-sage" /> Your 5-Day Step-by-Step Diet Plan:
          </h4>
          <span className="text-[11px] text-forest/60 italic">Tap any day to see meals</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {SAMSARJANA_STAGES.map((stg) => {
            const isDone = stg.day < plan.currentDay || plan.status === 'COMPLETED';
            const isCurrentDay = stg.day === plan.currentDay && plan.status === 'ACTIVE';
            const isSelected = stg.day === activeDayNumber;

            return (
              <button
                key={stg.day}
                onClick={() => setSelectedDayTab(stg.day)}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  isSelected ? 'ring-2 ring-forest shadow-sm' : ''
                } ${
                  isDone ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' :
                  isCurrentDay ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-medium' :
                  'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                  <span>Day {stg.day}</span>
                  {isDone ? (
                    <CheckCircle size={13} className="text-emerald-600" />
                  ) : isCurrentDay ? (
                    <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold">TODAY</span>
                  ) : null}
                </div>
                <div className="font-bold text-xs mt-1 truncate text-forest">{stg.englishTitle}</div>
                <div className="text-[10px] opacity-70 italic truncate">({stg.sanskritTitle})</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Content Card */}
      {activeStage && (
        <div className={`rounded-2xl border p-5 ${activeStage.color} space-y-5 shadow-sm`}>
          {/* Header of Active Day */}
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-black/10 pb-3">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${activeStage.badge}`}>
                {activeStage.name} • {activeStage.tagline}
              </span>
              <h4 className="font-display text-2xl font-bold mt-1 text-forest flex items-center gap-2">
                {activeStage.englishTitle}
              </h4>
              <p className="text-xs opacity-90 leading-relaxed mt-1 font-medium">{activeStage.simpleExplanation}</p>
            </div>
            {isViewingCurrentActiveDay && (
              <span className="text-xs bg-amber-500 text-white font-bold px-3 py-1 rounded-lg shadow-sm animate-bounce">
                👈 Today's Meal Plan
              </span>
            )}
          </div>

          {/* Simple Step-by-Step Kitchen Preparation */}
          <div className="bg-white/95 border border-sand/50 rounded-xl p-4 space-y-2 text-xs shadow-sm">
            <h5 className="font-bold flex items-center gap-1.5 text-forest text-sm">
              <BookOpen size={16} className="text-emerald-700" /> Easy Kitchen Preparation (Step-by-Step):
            </h5>
            <ol className="space-y-1.5 pl-2">
              {activeStage.recipeSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-forest/90 font-medium">
                  <span className="bg-emerald-100 text-emerald-900 rounded-full h-5 w-5 flex items-center justify-center font-bold text-[11px] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Meal Timings Schedule */}
          <div className="bg-white/95 border border-sand/50 rounded-xl p-4 space-y-2 text-xs shadow-sm">
            <h5 className="font-bold flex items-center gap-1.5 text-forest text-sm">
              <Clock size={16} className="text-amber-700" /> What to Eat Morning, Afternoon & Night:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {activeStage.schedule.map((sch, i) => (
                <div key={i} className="bg-sand/20 rounded-xl p-3 border border-sand/40 space-y-1">
                  <div className="font-bold text-forest text-xs flex items-center gap-1.5">
                    <span>{sch.icon}</span> <span>{sch.time}</span>
                  </div>
                  <div className="text-forest/90 text-xs font-medium">{sch.item}</div>
                </div>
              ))}
            </div>
          </div>

          {/* GREEN LIGHT (EAT THIS) vs RED LIGHT (DO NOT EAT THIS) - Ultra Clear for Uneducated Patients */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-emerald-50/95 border-2 border-emerald-300 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-base">
                <span className="text-xl">🟢</span>
                <span>WHAT YOU CAN EAT (ALLOWED)</span>
              </div>
              <ul className="space-y-2 text-emerald-950 text-xs font-medium">
                {activeStage.pathya.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 bg-white/80 p-2 rounded-xl border border-emerald-200">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-50/95 border-2 border-rose-300 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-rose-950 font-bold text-base">
                <span className="text-xl">🔴</span>
                <span>WHAT YOU MUST NOT EAT (STOP)</span>
              </div>
              <ul className="space-y-2 text-rose-950 text-xs font-medium">
                {activeStage.apathya.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 bg-white/80 p-2 rounded-xl border border-rose-200">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Log Button for current active day */}
          {plan.status === 'ACTIVE' && isViewingCurrentActiveDay && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-white/90 border border-sand/50 p-4 rounded-2xl shadow-sm">
              <div className="text-xs text-forest/90 font-medium">
                Did you finish all meals for <strong>Day {plan.currentDay} ({activeStage.englishTitle})</strong>?
              </div>
              <button
                onClick={handleLogDay}
                disabled={logging}
                className="rounded-xl bg-forest px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-forest/90 transition inline-flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle size={18} /> {logging ? 'Saving...' : `I Finished Day ${plan.currentDay} Meals 👍 Move to Next Day`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

