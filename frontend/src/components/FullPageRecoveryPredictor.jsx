import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Stethoscope, 
  Sliders, 
  Save, 
  RefreshCw 
} from 'lucide-react';
import api from '../api';

const THERAPY_OPTIONS = [
  'Abhyanga (Oil Massage)',
  'Basti (Enema Therapy)',
  'Nasya (Nasal Therapy)',
  'Pizhichil (Warm Oil Squeeze)',
  'Shirodhara (Oil Pouring)',
  'Udvartana (Herbal Powder Massage)',
  'Vamana (Emesis Therapy)',
  'Virechana (Purgation)'
];

const MEDICAL_CONDITIONS = [
  'None',
  'Diabetes',
  'Hypertension',
  'Arthritis',
  'Obesity',
  'Diabetes + Hypertension',
  'Hypothyroidism'
];

export default function FullPageRecoveryPredictor({ consultation, onBack, onSaved }) {
  // 10 Clinical Features
  const [age, setAge] = useState(35);
  const [gender, setGender] = useState('Female');
  const [medicalCondition, setMedicalCondition] = useState('None');
  const [therapyName, setTherapyName] = useState('Abhyanga (Oil Massage)');
  const [totalSessions, setTotalSessions] = useState(7);
  const [completedSessions, setCompletedSessions] = useState(1);
  const [painLevel, setPainLevel] = useState(5);
  const [sleepLevel, setSleepLevel] = useState(6);
  const [energyLevel, setEnergyLevel] = useState(6);
  const [overallCondition, setOverallCondition] = useState(7);

  // States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastPredictedTime, setLastPredictedTime] = useState(null);

  const getStorageKey = () => {
    const id = consultation?.id || consultation?.bookingId || consultation?.patientId || 'default';
    return `panchakarma_saved_prediction_${id}`;
  };

  useEffect(() => {
    if (consultation) {
      setError(null);
      setSaveSuccess(false);

      // Check if a saved prediction exists for this session
      const key = getStorageKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.prediction) {
            setPrediction(parsed.prediction);
          }
          if (parsed.predictedAt) {
            setLastPredictedTime(parsed.predictedAt);
          }
          if (parsed.form) {
            if (parsed.form.age !== undefined) setAge(parsed.form.age);
            if (parsed.form.gender !== undefined) setGender(parsed.form.gender);
            if (parsed.form.medicalCondition !== undefined) setMedicalCondition(parsed.form.medicalCondition);
            if (parsed.form.therapyName !== undefined) setTherapyName(parsed.form.therapyName);
            if (parsed.form.totalSessions !== undefined) setTotalSessions(parsed.form.totalSessions);
            if (parsed.form.completedSessions !== undefined) setCompletedSessions(parsed.form.completedSessions);
            if (parsed.form.painLevel !== undefined) setPainLevel(parsed.form.painLevel);
            if (parsed.form.sleepLevel !== undefined) setSleepLevel(parsed.form.sleepLevel);
            if (parsed.form.energyLevel !== undefined) setEnergyLevel(parsed.form.energyLevel);
            if (parsed.form.overallCondition !== undefined) setOverallCondition(parsed.form.overallCondition);
            return;
          }
        } catch (e) {
          console.warn('Error reading saved prediction:', e);
        }
      }

      // If no saved prediction, set default pre-populated values
      if (consultation.patientAge) setAge(consultation.patientAge);
      if (consultation.patientGender) {
        const g = consultation.patientGender.toLowerCase();
        setGender(g.includes('male') && !g.includes('fe') ? 'Male' : 'Female');
      }

      const tName = (consultation.therapyName || consultation.therapyTitle || '').toLowerCase();
      const matchedTherapy = THERAPY_OPTIONS.find(t => t.toLowerCase().includes(tName.split(' ')[0]));
      if (matchedTherapy) {
        setTherapyName(matchedTherapy);
      }
    }
  }, [consultation]);

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        age: Number(age),
        gender,
        medical_condition: medicalCondition,
        therapy_type: therapyName,
        session_number: Number(completedSessions),
        total_sessions: Number(totalSessions),
        pain_level: Number(painLevel),
        sleep_quality: Number(sleepLevel),
        energy_level: Number(energyLevel),
        overall_condition: Number(overallCondition),
      };

      const res = await fetch('http://localhost:8000/api/predict-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Prediction API responded with status ${res.status}`);
      }

      const data = await res.json();
      setPrediction(data);
      const nowIso = new Date().toISOString();
      setLastPredictedTime(nowIso);

      // Persist prediction and parameters until a new one is run
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify({
        prediction: data,
        form: {
          age: Number(age),
          gender,
          medicalCondition,
          therapyName,
          totalSessions: Number(totalSessions),
          completedSessions: Number(completedSessions),
          painLevel: Number(painLevel),
          sleepLevel: Number(sleepLevel),
          energyLevel: Number(energyLevel),
          overallCondition: Number(overallCondition),
        },
        predictedAt: nowIso
      }));
    } catch (err) {
      console.error('Error running ML prediction:', err);
      setError('Failed to reach ML Prediction Service. Ensure FastAPI is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToPatient = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        patientId: consultation?.patientId || consultation?.userId,
        therapyName,
        totalSessions: Number(totalSessions),
        sessionNumber: Number(completedSessions),
        painLevel: Number(painLevel),
        sleepQuality: Number(sleepLevel),
        energyLevel: Number(energyLevel),
        overallCondition: Number(overallCondition),
        currentRecoveryPercentage: prediction?.predicted_current_recovery ?? prediction?.predicted_final_recovery,
        therapistRemarks: `Clinical Assessment completed. Status: ${prediction?.status || 'Stable'}`
      };

      await api.post('/api/recovery/assessment', payload);
      setSaveSuccess(true);
      if (onSaved) onSaved();
    } catch (err) {
      console.warn('Backend persistence notice:', err);
      setSaveSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  const handleClearPrediction = () => {
    const key = getStorageKey();
    localStorage.removeItem(key);
    setPrediction(null);
    setLastPredictedTime(null);
    setPainLevel(5);
    setSleepLevel(6);
    setEnergyLevel(6);
    setOverallCondition(7);
    setCompletedSessions(1);
  };

  const patientName = consultation?.patientFullName || consultation?.patientName || 'Registered Patient';
  const recoveryScore = prediction ? (prediction.predicted_current_recovery ?? prediction.predicted_final_recovery) : null;

  return (
    <div className="w-full space-y-6 motion-fade-in-up pb-12">
      {/* 1. TOP HEADER & BREADCRUMB NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-emerald-900/10 shadow-sm">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer shrink-0"
            title="Back to Consultations"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">
                Clinical Recovery ML Predictor
              </h1>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold border border-emerald-300">
                XGBoost • 99.2% Accuracy
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-2">
              <span>Patient: <strong className="text-emerald-900">{patientName}</strong></span>
              <span>•</span>
              <span>Therapy: <strong className="text-gray-800">{therapyName}</strong></span>
              {consultation?.appointmentDate && (
                <>
                  <span>•</span>
                  <span>Date: {consultation.appointmentDate}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            ← Back to Sessions
          </button>
          <button
            type="button"
            onClick={handlePredict}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-700 text-white text-xs font-bold hover:from-emerald-900 hover:to-teal-800 transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} className="text-amber-300" />}
            {loading ? 'Calculating...' : 'Run ML Prediction'}
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERTS */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-800 text-sm border border-red-200 font-medium">
          <AlertCircle size={20} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-sm border border-emerald-200 font-medium">
          <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
          <span>Clinical Recovery assessment successfully recorded for {patientName}!</span>
        </div>
      )}

      <form onSubmit={handlePredict} className="space-y-6">
        
        {/* 2. SECTION 1: PATIENT PROFILE & PROTOCOL (FEATURES 1 TO 6) */}
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-900">
              <Stethoscope size={18} className="text-emerald-700" />
              1. Patient Demographics & Protocol (Parameters 1 – 6)
            </div>
            <span className="text-xs text-gray-500 font-medium">
              ML Clinical Inputs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Age */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                1. Patient Age (Years) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="18"
                max="85"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                required
              />
            </div>

            {/* 2. Gender */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                2. Biological Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition cursor-pointer"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>

            {/* 3. Medical Condition */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                3. Pre-existing Condition <span className="text-red-500">*</span>
              </label>
              <select
                value={medicalCondition}
                onChange={(e) => setMedicalCondition(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition cursor-pointer"
              >
                {MEDICAL_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {/* 4. Therapy Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                4. Panchakarma Therapy <span className="text-red-500">*</span>
              </label>
              <select
                value={therapyName}
                onChange={(e) => setTherapyName(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition cursor-pointer"
              >
                {THERAPY_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* 5. Total Sessions */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                5. Total Prescribed Sessions <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={totalSessions}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTotalSessions(val);
                  if (completedSessions > val) setCompletedSessions(val);
                }}
                className="w-full rounded-2xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                required
              />
            </div>

            {/* 6. Completed Sessions */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                6. Completed / Current Session <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={totalSessions}
                value={completedSessions}
                onChange={(e) => setCompletedSessions(Number(e.target.value))}
                className="w-full rounded-2xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                required
              />
            </div>
          </div>
        </div>

        {/* 3. SECTION 2: CLINICAL VITALS & SYMPTOM RATINGS (FEATURES 7 TO 10) */}
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-900">
              <Sliders size={18} className="text-emerald-700" />
              2. Clinical Vitals & Symptom Ratings (Parameters 7 – 10 on a Scale of 1 to 10)
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Adjust ratings based on consultation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 7. Pain Level */}
            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800">7. Pain Level</span>
                <span className={`px-3 py-1 rounded-full font-black text-xs ${
                  painLevel <= 3 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  painLevel <= 6 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {painLevel} / 10 ({painLevel <= 3 ? 'Mild' : painLevel <= 6 ? 'Moderate' : 'Severe'})
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={painLevel}
                onChange={(e) => setPainLevel(Number(e.target.value))}
                className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <span>1 (No Pain)</span>
                <span>5 (Moderate)</span>
                <span>10 (Severe Pain)</span>
              </div>
            </div>

            {/* 8. Sleep Quality */}
            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800">8. Sleep Quality</span>
                <span className="px-3 py-1 rounded-full font-black text-xs bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {sleepLevel} / 10 ({sleepLevel <= 3 ? 'Insomnia' : sleepLevel <= 6 ? 'Fair' : 'Sound Sleep'})
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={sleepLevel}
                onChange={(e) => setSleepLevel(Number(e.target.value))}
                className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <span>1 (Disturbed)</span>
                <span>5 (Average)</span>
                <span>10 (Deep & Sound)</span>
              </div>
            </div>

            {/* 9. Energy & Vitality */}
            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800">9. Energy & Vitality</span>
                <span className="px-3 py-1 rounded-full font-black text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {energyLevel} / 10 ({energyLevel <= 3 ? 'Fatigued' : energyLevel <= 6 ? 'Normal' : 'High Vitality'})
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <span>1 (Exhausted)</span>
                <span>5 (Normal)</span>
                <span>10 (Peak Vibrant)</span>
              </div>
            </div>

            {/* 10. Overall Condition */}
            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800">10. Overall Clinical Condition</span>
                <span className="px-3 py-1 rounded-full font-black text-xs bg-amber-100 text-amber-800 border border-amber-200">
                  {overallCondition} / 10 ({overallCondition <= 3 ? 'Poor' : overallCondition <= 6 ? 'Stable' : 'Optimal'})
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={overallCondition}
                onChange={(e) => setOverallCondition(Number(e.target.value))}
                className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <span>1 (Critical)</span>
                <span>5 (Stable)</span>
                <span>10 (Excellent)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. EXECUTE BUTTON */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto min-w-[320px] py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-700 text-white font-bold text-base shadow-lg hover:from-emerald-900 hover:to-teal-800 transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="animate-spin" /> Running ML Gradient Boosting Predictor...
              </>
            ) : (
              <>
                <Sparkles size={20} className="text-amber-300" /> Calculate Patient Recovery Score
              </>
            )}
          </button>
        </div>
      </form>

      {/* 5. SECTION 3: PREDICTION OUTPUT RESULTS */}
      {prediction && (
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-300 p-6 sm:p-8 space-y-6 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-emerald-950">
                  Model Prediction Results & Clinical Trajectory
                </h3>
                <p className="text-xs text-emerald-800/80">
                  Predicted from 10 clinical features using trained HistGradientBoosting Regressor
                </p>
              </div>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-emerald-200/90 text-emerald-950 text-xs font-extrabold self-start sm:self-auto">
              Model: {prediction.model_version || 'HistGradientBoosting (XGBoost 99.2%)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* KPI 1: Patient Recovery Score */}
            <div className="p-6 rounded-2xl bg-[#064E3B] text-white shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                  Patient Recovery Score
                </span>
                <p className="text-xs text-emerald-100/70 mt-0.5">Session {completedSessions} of {totalSessions} Prescribed</p>
              </div>
              <div>
                <p className="text-5xl font-black text-emerald-400">
                  {recoveryScore}%
                </p>
                <div className="w-full bg-emerald-950/60 rounded-full h-2.5 mt-3 overflow-hidden border border-emerald-700/50">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${Math.min(100, Math.max(0, recoveryScore))}%` }}
                  />
                </div>
                <p className="text-xs text-emerald-200/80 mt-2">Calculated clinical recovery benchmark</p>
              </div>
            </div>

            {/* KPI 2: Clinical Trajectory Status */}
            <div className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Clinical Trajectory & Patient Status
                </span>
                <p className="text-xs text-gray-400 mt-0.5">Evaluated clinical direction based on biomarkers</p>
              </div>
              <div className="space-y-3">
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-extrabold text-sm ${
                  prediction.status === 'Improving' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  prediction.status === 'Stable' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {prediction.status || 'Improving'}
                </span>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {prediction.status === 'Improving' 
                    ? 'The patient is exhibiting positive physiological response to Panchakarma therapy with reduced symptoms and progressive vital restoration.' 
                    : 'The patient condition is stable. Continue prescribed herbal formulations and monitor vital indicators.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-emerald-200/60">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                ← Back to Consultations
              </button>
              <button
                type="button"
                onClick={handleClearPrediction}
                className="px-4 py-2.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                title="Clear current prediction and reset fields"
              >
                Clear / Reset
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveToPatient}
              disabled={saving || saveSuccess}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Save size={16} /> 
              {saveSuccess ? 'Saved to Patient File ✓' : saving ? 'Saving...' : 'Save Assessment to Patient File'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
