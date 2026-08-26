import { useState, useEffect } from 'react';
import { Calendar, Clock, Trash2, Plus, Save, AlertCircle, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import api from '../api';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

export default function TherapistAvailabilityManager() {
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [dateOverrides, setDateOverrides] = useState([]);
  
  // New override form state
  const [overrideForm, setOverrideForm] = useState({
    overrideDate: '',
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
  });

  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingOverrides, setLoadingOverrides] = useState(true);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' }); // 'success' or 'error'
  const [overrideStatus, setOverrideStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchWeeklySchedule();
    fetchDateOverrides();
  }, []);

  async function fetchWeeklySchedule() {
    try {
      const res = await api.get('/therapists/weekly-schedule');
      // Format backend times (e.g., "09:00:00" -> "09:00")
      const formatted = res.data.map(s => ({
        ...s,
        startTime: s.startTime ? s.startTime.substring(0, 5) : '09:00',
        endTime: s.endTime ? s.endTime.substring(0, 5) : '17:00',
      }));
      setWeeklySchedule(formatted);
    } catch (err) {
      console.error("Failed to load weekly schedule", err);
    } finally {
      setLoadingSchedule(false);
    }
  }

  async function fetchDateOverrides() {
    try {
      const res = await api.get('/therapists/date-overrides');
      const formatted = res.data.map(o => ({
        ...o,
        startTime: o.startTime ? o.startTime.substring(0, 5) : null,
        endTime: o.endTime ? o.endTime.substring(0, 5) : null,
      }));
      setDateOverrides(formatted);
    } catch (err) {
      console.error("Failed to load date overrides", err);
    } finally {
      setLoadingOverrides(false);
    }
  }

  const handleWeeklyToggle = (dayValue) => {
    setWeeklySchedule(prev =>
      prev.map(item =>
        item.dayOfWeek === dayValue ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  const handleWeeklyTimeChange = (dayValue, field, val) => {
    setWeeklySchedule(prev =>
      prev.map(item =>
        item.dayOfWeek === dayValue ? { ...item, [field]: val } : item
      )
    );
  };

  const handleSaveWeeklySchedule = async () => {
    setSaveStatus({ type: '', message: '' });
    try {
      // Send data to backend
      const payload = weeklySchedule.map(item => ({
        dayOfWeek: item.dayOfWeek,
        startTime: item.isAvailable ? `${item.startTime}:00` : null,
        endTime: item.isAvailable ? `${item.endTime}:00` : null,
        isAvailable: item.isAvailable
      }));
      
      const res = await api.put('/therapists/weekly-schedule', payload);
      const formatted = res.data.map(s => ({
        ...s,
        startTime: s.startTime ? s.startTime.substring(0, 5) : '09:00',
        endTime: s.endTime ? s.endTime.substring(0, 5) : '17:00',
      }));
      setWeeklySchedule(formatted);
      setSaveStatus({ type: 'success', message: 'Weekly schedule updated successfully!' });
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 4000);
    } catch (err) {
      setSaveStatus({ type: 'error', message: 'Failed to update weekly schedule. Please try again.' });
    }
  };

  const handleAddOverride = async (e) => {
    e.preventDefault();
    setOverrideStatus({ type: '', message: '' });

    if (!overrideForm.overrideDate) {
      setOverrideStatus({ type: 'error', message: 'Please select a valid date.' });
      return;
    }

    try {
      const payload = {
        overrideDate: overrideForm.overrideDate,
        startTime: overrideForm.isAvailable ? `${overrideForm.startTime}:00` : null,
        endTime: overrideForm.isAvailable ? `${overrideForm.endTime}:00` : null,
        isAvailable: overrideForm.isAvailable
      };

      const res = await api.post('/therapists/date-overrides', payload);
      const formattedNew = {
        ...res.data,
        startTime: res.data.startTime ? res.data.startTime.substring(0, 5) : null,
        endTime: res.data.endTime ? res.data.endTime.substring(0, 5) : null,
      };

      // Add to list and sort
      setDateOverrides(prev => {
        const filtered = prev.filter(o => o.overrideDate !== formattedNew.overrideDate);
        return [...filtered, formattedNew].sort((a, b) => new Date(a.overrideDate) - new Date(b.overrideDate));
      });

      setOverrideStatus({ type: 'success', message: 'Date exception configured successfully!' });
      // Reset date input
      setOverrideForm({
        overrideDate: '',
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true
      });
      setTimeout(() => setOverrideStatus({ type: '', message: '' }), 4000);
    } catch (err) {
      setOverrideStatus({ type: 'error', message: 'Failed to save date override.' });
    }
  };

  const handleDeleteOverride = async (id) => {
    try {
      await api.delete(`/therapists/date-overrides/${id}`);
      setDateOverrides(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete override", err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-forest">Manage Availability</h2>
        <p className="text-sm text-forest/75">
          Configure your default weekly working hours templates and set exceptions or leaves for specific dates.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column: Weekly Template */}
        <div className="panel-frost rounded-[2rem] p-6 bg-white/70 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#e6efdf] p-2.5 text-sage">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-forest">Weekly Working Template</h3>
                <p className="text-xs text-forest/60">Your recurring weekly availability</p>
              </div>
            </div>
            <button
              onClick={handleSaveWeeklySchedule}
              className="flex items-center gap-2 rounded-xl bg-sage px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-forest transition"
            >
              <Save size={16} />
              Save Template
            </button>
          </div>

          {saveStatus.message && (
            <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
              saveStatus.type === 'success' ? 'bg-[#f0f9ea] text-sage' : 'bg-red-50 text-red-600'
            }`}>
              {saveStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{saveStatus.message}</span>
            </div>
          )}

          {loadingSchedule ? (
            <div className="py-8 text-center text-forest/50">Loading schedule templates...</div>
          ) : (
            <div className="space-y-4">
              {DAYS_OF_WEEK.map(dayInfo => {
                const daySched = weeklySchedule.find(s => s.dayOfWeek === dayInfo.value) || {
                  dayOfWeek: dayInfo.value,
                  startTime: '09:00',
                  endTime: '17:00',
                  isAvailable: false,
                };

                return (
                  <div
                    key={dayInfo.value}
                    className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                      daySched.isAvailable 
                        ? 'border-[#cfe0c2] bg-[#fdfefd]' 
                        : 'border-gray-200 bg-gray-50/50 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Sliding Toggle */}
                      <button
                        onClick={() => handleWeeklyToggle(dayInfo.value)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          daySched.isAvailable ? 'bg-sage' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            daySched.isAvailable ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="font-display text-sm font-bold text-forest">{dayInfo.label}</span>
                    </div>

                    {daySched.isAvailable ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={daySched.startTime}
                          onChange={(e) => handleWeeklyTimeChange(dayInfo.value, 'startTime', e.target.value)}
                          className="rounded-xl border border-[#ddcdb3] bg-white px-2 py-1.5 text-sm text-forest outline-none focus:border-sage"
                        />
                        <span className="text-xs text-forest/50">to</span>
                        <input
                          type="time"
                          value={daySched.endTime}
                          onChange={(e) => handleWeeklyTimeChange(dayInfo.value, 'endTime', e.target.value)}
                          className="rounded-xl border border-[#ddcdb3] bg-white px-2 py-1.5 text-sm text-forest outline-none focus:border-sage"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Exception override / calendar exemptions */}
        <div className="space-y-8">
          {/* Section A: Create Date Override */}
          <div className="panel-frost rounded-[2rem] p-6 bg-white/70 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-[#f3e4c5] p-2.5 text-[#a06a3a]">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-forest">Add Schedule Override</h3>
                <p className="text-xs text-forest/60">Modify availability for a specific date</p>
              </div>
            </div>

            {overrideStatus.message && (
              <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                overrideStatus.type === 'success' ? 'bg-[#f0f9ea] text-sage' : 'bg-red-50 text-red-600'
              }`}>
                {overrideStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{overrideStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleAddOverride} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-forest/70">Select Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={overrideForm.overrideDate}
                    onChange={(e) => setOverrideForm({ ...overrideForm, overrideDate: e.target.value })}
                    className="w-full rounded-xl border border-[#ddcdb3] bg-white px-3 py-2.5 text-sm text-forest outline-none focus:border-sage"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-forest/70">Availability status</label>
                  <div className="flex h-10 items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="overrideAvail"
                        checked={overrideForm.isAvailable}
                        onChange={() => setOverrideForm({ ...overrideForm, isAvailable: true })}
                        className="h-4 w-4 accent-sage"
                      />
                      <span className="text-sm font-semibold text-forest">Available</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="overrideAvail"
                        checked={!overrideForm.isAvailable}
                        onChange={() => setOverrideForm({ ...overrideForm, isAvailable: false })}
                        className="h-4 w-4 accent-sage"
                      />
                      <span className="text-sm font-semibold text-forest">Off / Blocked</span>
                    </label>
                  </div>
                </div>
              </div>

              {overrideForm.isAvailable && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-forest/70">Custom Start Time</label>
                    <input
                      type="time"
                      value={overrideForm.startTime}
                      onChange={(e) => setOverrideForm({ ...overrideForm, startTime: e.target.value })}
                      className="w-full rounded-xl border border-[#ddcdb3] bg-white px-3 py-2.5 text-sm text-forest outline-none focus:border-sage"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-forest/70">Custom End Time</label>
                    <input
                      type="time"
                      value={overrideForm.endTime}
                      onChange={(e) => setOverrideForm({ ...overrideForm, endTime: e.target.value })}
                      className="w-full rounded-xl border border-[#ddcdb3] bg-white px-3 py-2.5 text-sm text-forest outline-none focus:border-sage"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-sage transition shadow-soft"
              >
                <Plus size={16} /> Add Exception Override
              </button>
            </form>
          </div>

          {/* Section B: Existing Overrides Listing */}
          <div className="panel-frost rounded-[2rem] p-6 bg-white/70 shadow-soft">
            <h3 className="font-display text-lg font-bold text-forest mb-4">Date Overrides List</h3>
            {loadingOverrides ? (
              <div className="text-center py-4 text-forest/55">Loading exceptions...</div>
            ) : dateOverrides.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400 italic">No schedule exceptions configured yet.</div>
            ) : (
              <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                {dateOverrides.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-sand/40 bg-white p-3 shadow-soft hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-display text-sm font-bold text-forest">
                        {new Date(item.overrideDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs mt-0.5">
                        {item.isAvailable ? (
                          <span className="font-medium text-sage">
                            🟢 Custom hours: {item.startTime} - {item.endTime}
                          </span>
                        ) : (
                          <span className="font-semibold text-rose-500">🔴 Unavailable / Off</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteOverride(item.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                      title="Delete override"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
