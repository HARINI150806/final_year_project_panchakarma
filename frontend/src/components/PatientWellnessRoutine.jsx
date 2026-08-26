import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Sun, Sunset, Moon, Sparkles, Trophy } from 'lucide-react';

const DEFAULT_ROUTINE = {
  morning: [
    { id: 'm1', text: 'Warm water with lemon & honey', detail: 'Sips slowly to gently activate digestive Agni', done: true },
    { id: 'm2', text: 'Sesame oil pulling (Gandusha)', detail: 'Swish 1 tsp warm sesame oil for 5 mins', done: true },
    { id: 'm3', text: 'Gentle Pranayama & Yoga', detail: '15 mins Anulom-Vilom and Nadi Shodhana', done: false },
  ],
  afternoon: [
    { id: 'a1', text: 'Warm nourishing lunch', detail: 'Kitchari or Peya according to prescribed diet', done: true },
    { id: 'a2', text: 'Post-meal digestive herbal tea', detail: 'Cumin-Coriander-Fennel (CCF) warm tea', done: false },
  ],
  evening: [
    { id: 'e1', text: 'Evening meditation & reflection', detail: '10 mins quiet breathing before sundown', done: false },
    { id: 'e2', text: 'Warm Golden Milk (Haridra)', detail: 'Warm milk with turmeric & cardamom before bed', done: false },
  ]
};

export default function PatientWellnessRoutine() {
  const [routine, setRoutine] = useState(() => {
    const saved = localStorage.getItem('ayurveda_daily_routine');
    return saved ? JSON.parse(saved) : DEFAULT_ROUTINE;
  });

  useEffect(() => {
    localStorage.setItem('ayurveda_daily_routine', JSON.stringify(routine));
  }, [routine]);

  const toggleItem = (section, id) => {
    setRoutine((prev) => ({
      ...prev,
      [section]: prev[section].map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    }));
  };

  const totalItems = routine.morning.length + routine.afternoon.length + routine.evening.length;
  const completedItems =
    routine.morning.filter((i) => i.done).length +
    routine.afternoon.filter((i) => i.done).length +
    routine.evening.filter((i) => i.done).length;

  const percentage = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-6 shadow-sm backdrop-blur-md space-y-6">
      {/* Header & Percentage Progress Ring */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-900/10 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-900 uppercase tracking-wider">
            <Sparkles size={13} /> Dinacharya Daily Care
          </div>
          <h3 className="font-display text-2xl font-bold text-forest">Today&apos;s Wellness Routine</h3>
          <p className="text-xs text-forest/70">Interactive daily Ayurvedic self-care checklist</p>
        </div>

        {/* Completion Progress Badge */}
        <div className="flex items-center gap-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 px-4">
          <div className="relative h-12 w-12 flex items-center justify-center font-bold text-forest text-sm">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-emerald-200"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-forest transition-all duration-500 ease-out"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-extrabold text-forest">{percentage}%</span>
          </div>
          <div>
            <p className="text-xs font-bold text-forest">
              {percentage === 100 ? '🌱 Complete Wellness Achieved!' : `Completed ${completedItems} of ${totalItems} tasks`}
            </p>
            <p className="text-[11px] text-forest/65 font-medium">
              You completed {percentage}% of today&apos;s routine 🌱
            </p>
          </div>
        </div>
      </div>

      {/* Routine Sections: Morning, Afternoon, Evening */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Morning */}
        <div className="rounded-2xl bg-amber-50/40 border border-amber-200/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm border-b border-amber-200/50 pb-2">
            <Sun size={18} className="text-amber-600" />
            <span>Morning Rituals</span>
          </div>
          <div className="space-y-2.5">
            {routine.morning.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem('morning', item.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  item.done
                    ? 'bg-emerald-50/90 border-emerald-200 text-forest'
                    : 'bg-white/80 border-amber-100 text-forest/80 hover:bg-white'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-xs font-bold ${item.done ? 'line-through opacity-80' : ''}`}>{item.text}</p>
                  <p className="text-[11px] text-forest/60 mt-0.5">{item.detail}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Afternoon */}
        <div className="rounded-2xl bg-teal-50/40 border border-teal-200/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-teal-900 font-bold text-sm border-b border-teal-200/50 pb-2">
            <Sunset size={18} className="text-teal-600" />
            <span>Afternoon Care</span>
          </div>
          <div className="space-y-2.5">
            {routine.afternoon.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem('afternoon', item.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  item.done
                    ? 'bg-emerald-50/90 border-emerald-200 text-forest'
                    : 'bg-white/80 border-teal-100 text-forest/80 hover:bg-white'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle size={18} className="text-teal-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-xs font-bold ${item.done ? 'line-through opacity-80' : ''}`}>{item.text}</p>
                  <p className="text-[11px] text-forest/60 mt-0.5">{item.detail}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Evening */}
        <div className="rounded-2xl bg-indigo-50/40 border border-indigo-200/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm border-b border-indigo-200/50 pb-2">
            <Moon size={18} className="text-indigo-600" />
            <span>Evening Rest</span>
          </div>
          <div className="space-y-2.5">
            {routine.evening.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem('evening', item.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  item.done
                    ? 'bg-emerald-50/90 border-emerald-200 text-forest'
                    : 'bg-white/80 border-indigo-100 text-forest/80 hover:bg-white'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-xs font-bold ${item.done ? 'line-through opacity-80' : ''}`}>{item.text}</p>
                  <p className="text-[11px] text-forest/60 mt-0.5">{item.detail}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
