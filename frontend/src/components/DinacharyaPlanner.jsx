import { useState, useEffect } from 'react';
import { 
  Sun, 
  Sparkles, 
  Activity, 
  Apple, 
  Utensils, 
  Moon, 
  CheckCircle2, 
  Heart, 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Compass,
  Info
} from 'lucide-react';
import api from '../api';

const routineData = {
  VATA: {
    title: 'Balanced Routine for Dry & Sensitive Body Types',
    description: 'A warm and grounding routine to help you feel steady and calm throughout the day.',
    colorClass: 'text-[#4a8db5] bg-[#e8f4fd] border-[#a8d0e8]',
    progressColor: 'bg-[#4a8db5]',
    items: [
      { id: 'v1', time: '6:00 AM', title: 'Awakening', desc: 'Rise gently. Sit quietly in bed for a few moments to ground your energy before stepping out.', icon: Sun },
      { id: 'v2', time: '6:30 AM', title: 'Oral Cleansing', desc: 'Gently brush your teeth, scrape your tongue, and swish warm sesame oil in your mouth to strengthen your gums.', icon: Sparkles },
      { id: 'v3', time: '7:00 AM', title: 'Warm Oil Massage', desc: 'Gently massage your skin with warm sesame oil, focusing on your joints, head, and feet to soothe your nerves.', icon: Heart },
      { id: 'v4', time: '7:30 AM', title: 'Gentle Stretching & Breathing', desc: 'Spend 15 minutes doing slow stretches or gentle yoga, followed by deep, slow belly breaths.', icon: Activity },
      { id: 'v5', time: '8:30 AM', title: 'Nourishing Breakfast', desc: 'Eat a warm, fresh breakfast like oatmeal cooked with spices and a little butter or ghee.', icon: Apple },
      { id: 'v6', time: '1:00 PM', title: 'Main Lunch', desc: 'Have your largest, warm, cooked meal in a quiet place without screens or distractions.', icon: Utensils },
      { id: 'v7', time: '9:30 PM', title: 'Bedtime Routine', desc: 'Sip warm milk, turn off all screens, and go to sleep by 10:00 PM to protect your energy.', icon: Moon }
    ]
  },
  PITTA: {
    title: 'Balanced Routine for Heat-Sensitive Body Types',
    description: 'A cooling and calming routine to help you stay refreshed and relaxed.',
    colorClass: 'text-[#c07830] bg-[#fef3e2] border-[#e8c898]',
    progressColor: 'bg-[#c07830]',
    items: [
      { id: 'p1', time: '5:30 AM', title: 'Awakening', desc: 'Rise early before the day gets hot. Sit in quiet silence to feel calm and cool.', icon: Sun },
      { id: 'p2', time: '6:00 AM', title: 'Oral Cleansing', desc: 'Brush your teeth, scrape your tongue, and swish coconut oil in your mouth to release excess heat.', icon: Sparkles },
      { id: 'p3', time: '6:30 AM', title: 'Cooling Oil Massage', desc: 'Massage your body with coconut or sunflower oil using gentle, soothing strokes.', icon: Heart },
      { id: 'p4', time: '7:00 AM', title: 'Cooling Stretching & Breathing', desc: 'Practice cooling breathing exercises and light, relaxed stretches.', icon: Activity },
      { id: 'p5', time: '8:00 AM', title: 'Cooling Breakfast', desc: 'Enjoy a refreshing breakfast. Sweet fruits (like melon or pears) or oatmeal with coconut flakes are excellent.', icon: Apple },
      { id: 'p6', time: '12:30 PM', title: 'Main Lunch', desc: 'Eat your largest meal. Include sweet or bitter green vegetables, cucumbers, rice, and cooling fennel tea.', icon: Utensils },
      { id: 'p7', time: '10:00 PM', title: 'Bedtime Routine', desc: 'Massage the bottom of your feet with coconut oil, keep your bedroom cool, and dim the lights by 10:30 PM.', icon: Moon }
    ]
  },
  KAPHA: {
    title: 'Balanced Routine for Heavy & Slow Body Types',
    description: 'An active, warm, and stimulating routine to boost your energy and circulation.',
    colorClass: 'text-[#3d6835] bg-[#edf6e8] border-[#b0d8a0]',
    progressColor: 'bg-[#5a8553]',
    items: [
      { id: 'k1', time: '5:00 AM', title: 'Early Awakening', desc: 'Rise early before 6:00 AM to prevent feeling heavy or sluggish. Get out of bed quickly to start your day.', icon: Sun },
      { id: 'k2', time: '5:30 AM', title: 'Oral Cleansing', desc: 'Brush your teeth, scrape your tongue, and swish warm sesame oil to clear congesting mucus.', icon: Sparkles },
      { id: 'k3', time: '6:00 AM', title: 'Vigorous Exercise', desc: 'Engage in 30 minutes of active exercise, fast walking, or active stretches to stimulate your body.', icon: Activity },
      { id: 'k4', time: '6:45 AM', title: 'Dry Skin Massage', desc: 'Perform a dry rub on your skin using a dry washcloth or skin brush to stimulate circulation.', icon: Heart },
      { id: 'k5', time: '8:00 AM', title: 'Light Breakfast', desc: 'Have a light breakfast or sip warm ginger water. Baked apples with cinnamon or warm grains are best.', icon: Apple },
      { id: 'k6', time: '1:00 PM', title: 'Main Lunch', desc: 'Enjoy a warm, dry, and spicy lunch (like lentil soup with black pepper). Avoid heavy milk or cheese.', icon: Utensils },
      { id: 'k7', time: '9:30 PM', title: 'Bedtime Routine', desc: 'Drink hot ginger water, avoid late night snacks, and ensure you are asleep by 10:00 PM.', icon: Moon }
    ]
  },
  GENERAL: {
    title: 'General Daily Health Plan',
    description: 'A simple daily routine to keep your body balanced and feel healthy.',
    colorClass: 'text-[#637a58] bg-[#fbf6ee] border-[#c8d4bd]',
    progressColor: 'bg-[#637a58]',
    items: [
      { id: 'g1', time: '6:00 AM', title: 'Awakening', desc: 'Rise with the sun. Sip warm water to help start your digestion.', icon: Sun },
      { id: 'g2', time: '6:30 AM', title: 'Oral Cleansing', desc: 'Brush your teeth, scrape your tongue, and wash your eyes with cool, clean water.', icon: Sparkles },
      { id: 'g3', time: '7:00 AM', title: 'Warm Oil Massage', desc: 'Massage your body with warm oil to help circulation and soothe your joints.', icon: Heart },
      { id: 'g4', time: '7:30 AM', title: 'Stretching & Quiet Time', desc: 'Do 20 minutes of light walking or stretching, followed by 10 minutes of sitting quietly.', icon: Activity },
      { id: 'g5', time: '8:30 AM', title: 'Nourishing Breakfast', desc: 'Eat a fresh, simple, warm breakfast (like cooked grains or porridge). Avoid skipping breakfast.', icon: Apple },
      { id: 'g6', time: '1:00 PM', title: 'Main Lunch', desc: 'Enjoy your main meal of the day, incorporating fresh seasonal vegetables and whole grains.', icon: Utensils },
      { id: 'g7', time: '9:30 PM', title: 'Bedtime Routine', desc: 'Turn off all screens, read a book or practice slow breathing, and be asleep by 10:00 PM.', icon: Moon }
    ]
  }
};

export default function DinacharyaPlanner({ auth }) {
  const doshaKey = auth?.dominantDosha ? auth.dominantDosha.toUpperCase() : 'GENERAL';
  const routine = routineData[doshaKey] || routineData.GENERAL;
  const userId = auth?.id || 'guest';
  const dateStr = new Date().toISOString().split('T')[0]; // Reset every day
  const storageKey = `dinacharya-checks-${userId}-${dateStr}`;

  // Checked off items state
  const [checkedItems, setCheckedItems] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : {};
  });

  // Weather Override States
  const [temp, setTemp] = useState('MILD');
  const [humidity, setHumidity] = useState('MODERATE');

  // Digestive Fire (Agni) Log State
  const [agniType, setAgniType] = useState('SAMAGNI');
  const [submittingAgni, setSubmittingAgni] = useState(false);

  // Suggestions from API
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Clean old days from localStorage
  useEffect(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('dinacharya-checks-') && !key.endsWith(dateStr)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('Failed to clean up old dinacharya items:', e);
    }
  }, [dateStr]);

  // Sync checked items to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(checkedItems));
  }, [checkedItems, storageKey]);

  // Fetch today's logged Agni and weather settings if any
  useEffect(() => {
    async function loadTodayAgni() {
      try {
        const { data } = await api.get('/rutu-rhythm/agni-log/today');
        if (data) {
          setAgniType(data.agniType);
          if (data.weatherTemperature) setTemp(data.weatherTemperature);
          if (data.weatherHumidity) setHumidity(data.weatherHumidity);
        }
      } catch (err) {
        console.error('Failed to load today Agni log', err);
      }
    }
    loadTodayAgni();
  }, []);

  // Fetch seasonal suggestions whenever temp or humidity overrides change
  useEffect(() => {
    async function fetchRutuSuggestions() {
      setLoadingSuggestions(true);
      try {
        const { data } = await api.get(`/rutu-rhythm/suggestions?temp=${temp}&humidity=${humidity}`);
        setSuggestions(data);
      } catch (err) {
        console.error('Failed to fetch Rutu suggestions', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }
    fetchRutuSuggestions();
  }, [temp, humidity]);

  const toggleItem = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleAgniSelection = async (type) => {
    setSubmittingAgni(true);
    setAgniType(type);
    try {
      await api.post('/rutu-rhythm/agni-log', {
        agniType: type,
        weatherTemperature: temp,
        weatherHumidity: humidity
      });
    } catch (err) {
      console.error('Failed to submit Agni check-in', err);
    } finally {
      setSubmittingAgni(false);
    }
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = routine.items.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const getTempLabel = (t) => {
    switch (t) {
      case 'COLD': return 'Cold & Chilly ❄️';
      case 'MILD': return 'Pleasant & Mild ⛅';
      case 'HOT': return 'Hot & Sunny 🔥';
      default: return t;
    }
  };

  const getHumidityLabel = (h) => {
    switch (h) {
      case 'DRY': return 'Dry & Windy 🏜️';
      case 'MODERATE': return 'Normal & Pleasant ⛅';
      case 'WET': return 'Humid & Rainy 🌧️';
      default: return h;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Seasonal & Weather Harmony Header ────────────────── */}
      <div className="panel-frost rounded-[2.2rem] p-6 bg-white/85 shadow-soft border border-white/70 relative overflow-hidden">
        <div className="ambient-orb right-[-3rem] top-[-2rem] h-32 w-32 bg-[#fff2cc] opacity-60" />
        <div className="ambient-orb left-[15%] bottom-[-2rem] h-28 w-28 bg-[#e2f0d9] opacity-40" />
        <div className="noise-grid absolute inset-0 opacity-[0.04] pointer-events-none" />

        <div className="relative z-10 grid gap-6 md:grid-cols-[1.5fr_1fr] items-center">
          {/* Left Column: Season & Alert */}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] bg-sage/10 text-sage border border-sage/20">
              🌿 Seasonal & Weather Harmony Guide
            </div>
            
            {suggestions ? (
              <div className="mt-3">
                <h2 className="font-display text-2xl font-bold text-forest">
                  {suggestions.rutuEnglish} Season
                </h2>
                <p className="text-xs text-forest/75 mt-1 leading-relaxed max-w-xl font-medium">
                  {suggestions.rutuDescription}
                </p>
                <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-800 leading-relaxed shadow-sm">
                  <strong>💡 Today's Weather Advisory:</strong> {suggestions.climateAlert}
                </div>
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-sage border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Right Column: Weather Settings */}
          <div className="bg-white/60 border border-sand/50 rounded-[1.8rem] p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest/70 flex items-center gap-1.5">
              <Compass size={14} className="text-sage" /> How is the weather outside today?
            </h3>
            
            {/* Temperature Tuner */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-forest/40">
                <span>Temperature</span>
                <span className="text-sage font-semibold">{getTempLabel(temp)}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {['COLD', 'MILD', 'HOT'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemp(t)}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold transition border ${
                      temp === t 
                        ? 'bg-forest text-white border-forest shadow-sm' 
                        : 'bg-white/90 hover:bg-white text-forest/70 border-sand/40'
                    }`}
                  >
                    {t === 'COLD' ? '❄️ Cold' : t === 'MILD' ? '⛅ Mild' : '🔥 Hot'}
                  </button>
                ))}
              </div>
            </div>

            {/* Humidity Tuner */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-forest/40">
                <span>Humidity & Air</span>
                <span className="text-sage font-semibold">{getHumidityLabel(humidity)}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {['DRY', 'MODERATE', 'WET'].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHumidity(h)}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold transition border ${
                      humidity === h 
                        ? 'bg-forest text-white border-forest shadow-sm' 
                        : 'bg-white/90 hover:bg-white text-forest/70 border-sand/40'
                    }`}
                  >
                    {h === 'DRY' ? '🏜️ Dry' : h === 'MODERATE' ? '⛅ Normal' : '🌧️ Damp'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Split Layout: Routine Checklist & Recommenders ────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        
        {/* Left Side: Dynamic Dinacharya Checklist */}
        <div className="panel-frost rounded-[2.2rem] p-6 bg-white/85 shadow-soft border border-white/70 relative">
          <div className="absolute right-[-2rem] top-[-2rem] h-24 w-24 bg-[#e6efdf] opacity-50 blur-xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-sand/30">
            <div>
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] border ${routine.colorClass}`}>
                ✦ {routine.title}
              </div>
              <h2 className="font-display text-xl font-bold text-forest mt-2">
                My Balanced Daily Timeline
              </h2>
            </div>

            {/* Progress Tracker */}
            <div className="flex items-center gap-3 bg-white/60 border border-sand/50 rounded-2xl p-2.5 shrink-0 self-start">
              <div className="relative flex items-center justify-center h-10 w-10 rounded-full border border-sand/70">
                <span className="text-xs font-bold text-forest">{progressPercent}%</span>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.12em] text-forest/45">Completed</p>
                <p className="text-xs font-semibold text-forest">
                  {completedCount} of {totalCount}
                </p>
              </div>
            </div>
          </div>

          {/* Dinacharya Timeline Items */}
          <div className="space-y-4">
            {routine.items.map((item) => {
              const IconComponent = item.icon;
              const isCompleted = checkedItems[item.id];
              
              return (
                <div 
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`group flex items-start gap-4 p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
                    isCompleted 
                      ? 'bg-[#eaf4e3]/60 border-[#cfe0c2] translate-x-1' 
                      : 'bg-white/60 border-sand/40 hover:bg-white/95 hover:border-sand/70 hover:translate-x-1'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="mt-1 shrink-0">
                    <div className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-forest border-forest text-white' 
                        : 'border-sand hover:border-forest'
                    }`}>
                      {isCompleted && <CheckCircle2 size={13} className="stroke-[3]" />}
                    </div>
                  </div>

                  {/* Routine Icon */}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    isCompleted 
                      ? 'bg-forest/10 text-forest' 
                      : 'bg-[#fbf9f4] text-sage group-hover:bg-[#eaf4e3]'
                  }`}>
                    <IconComponent size={18} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sage">
                        {item.time}
                      </span>
                    </div>
                    <h3 className={`font-display text-sm font-semibold mt-0.5 transition ${
                      isCompleted ? 'text-forest/60 line-through' : 'text-forest'
                    }`}>
                      {item.title}
                    </h3>
                    <p className="text-xs text-forest/60 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Climate Modifications Infobox */}
          {suggestions && suggestions.routineTweak && suggestions.routineTweak.length > 0 && (
            <div className="mt-6 pt-5 border-t border-sand/30 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-forest/50 flex items-center gap-1.5">
                ⚡ Simple Routine Tweaks for Today
              </h4>
              <div className="space-y-2">
                {suggestions.routineTweak.map((tweak, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-forest/75 leading-relaxed shadow-sm">
                    <span className="text-amber-500 font-bold shrink-0 mt-0.5">✦</span>
                    <p>{tweak}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Agni Tracker & Custom Apothic Recommendations */}
        <div className="space-y-6">
          
          {/* Agni (Digestive Fire) Check-in */}
          <div className="panel-frost rounded-[2.2rem] p-5 bg-white/85 border border-white/70 relative">
            <h3 className="font-display text-lg font-bold text-forest flex items-center gap-2">
              🔥 How is your digestion today?
            </h3>
            <p className="text-xs text-forest/60 mt-1">
              In Ayurveda, a happy stomach (Agni) is the secret to good health. Let us know how your stomach feels today:
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { type: 'SAMAGNI', name: 'Balanced & Light', desc: 'Digesting easily', icon: '✨' },
                { type: 'MANDAGNI', name: 'Slow & Heavy', desc: 'Bloated or full', icon: '🐢' },
                { type: 'TIKSHNAGNI', name: 'Fiery & Acidic', desc: 'Acid reflux or heartburn', icon: '🌶️' },
                { type: 'VISHAMAGNI', name: 'Irregular & Gassy', desc: 'Gas or stomach cramps', icon: '🍃' }
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAgniSelection(item.type)}
                  disabled={submittingAgni}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                    agniType === item.type
                      ? 'bg-forest border-forest text-white shadow-md'
                      : 'bg-white/80 hover:bg-white text-forest border-sand/40 hover:border-sand'
                  }`}
                >
                  <span className="text-xl mb-1">{item.icon}</span>
                  <span className="text-xs font-bold leading-none">{item.name}</span>
                  <span className={`text-[9px] mt-1 ${agniType === item.type ? 'text-white/80' : 'text-forest/45'}`}>
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Herbal Formula/Remedy Scroll */}
            {suggestions && suggestions.agniHerbs && suggestions.agniHerbs[agniType] && (
              <div className="mt-4 p-4 rounded-2xl bg-[#fdf9f0] border border-[#f3e5ca] relative shadow-inner overflow-hidden">
                <div className="absolute right-[-1rem] bottom-[-1.2rem] text-4xl opacity-15 select-none pointer-events-none">🍵</div>
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#a67c40]">
                  🍵 Recommended Remedy
                </h4>
                <p className="text-xs text-[#805e2d] mt-1.5 leading-relaxed font-medium">
                  {suggestions.agniHerbs[agniType]}
                </p>
              </div>
            )}
          </div>

          {/* Climate Dietary Guide */}
          {suggestions && suggestions.dietRecommendations && suggestions.dietRecommendations.length > 0 && (
            <div className="panel-frost rounded-[2.2rem] p-5 bg-white/85 border border-white/70">
              <h3 className="font-display text-lg font-bold text-forest flex items-center gap-2">
                🥦 What to Eat & Drink
              </h3>
              <p className="text-xs text-forest/60 mt-1">
                Simple food choices to stay balanced during this {suggestions.rutuEnglish || 'season'}.
              </p>

              <div className="mt-4 space-y-2.5">
                {suggestions.dietRecommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-[#eaf4e3] text-sage text-[10px] mt-0.5">
                      ✓
                    </div>
                    <p className="text-xs text-forest/75 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
