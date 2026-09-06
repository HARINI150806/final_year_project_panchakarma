import React, { useState, useEffect } from 'react';
import { Activity, HeartPulse, Sparkles, X, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../api';

export default function RecoveryTrackingModal({ isOpen, onClose, therapyPlan, onSaved }) {
  const [sessionNumber, setSessionNumber] = useState(1);
  const [painLevel, setPainLevel] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(6);
  const [energyLevel, setEnergyLevel] = useState(6);
  const [overallCondition, setOverallCondition] = useState(7);
  const [clinicalObservation, setClinicalObservation] = useState('');
  const [therapistRemarks, setTherapistRemarks] = useState('');

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (therapyPlan) {
      setResult(null);
      setError(null);
      fetchLatestRecovery();
    }
  }, [therapyPlan]);

  const fetchLatestRecovery = async () => {
    if (!therapyPlan?.id) return;
    try {
      const res = await api.get(`/api/recovery/plan/${therapyPlan.id}`);
      if (res.data) {
        const nextSess = (res.data.completedSessions || 0) + 1;
        setSessionNumber(nextSess);
        if (res.data.currentPain !== undefined) setPainLevel(res.data.currentPain);
        if (res.data.currentSleep !== undefined) setSleepQuality(res.data.currentSleep);
        if (res.data.currentEnergy !== undefined) setEnergyLevel(res.data.currentEnergy);
        if (res.data.currentOverall !== undefined) setOverallCondition(res.data.currentOverall);
        if (res.data.therapistRemarks) setTherapistRemarks(res.data.therapistRemarks);
        if (res.data.clinicalObservation) setClinicalObservation(res.data.clinicalObservation);
      }
    } catch (err) {
      // Default initial state
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        therapyPlanId: therapyPlan.id,
        patientId: therapyPlan.patientId || therapyPlan.patient?.id,
        sessionNumber: Number(sessionNumber),
        painLevel: Number(painLevel),
        sleepQuality: Number(sleepQuality),
        energyLevel: Number(energyLevel),
        overallCondition: Number(overallCondition),
        clinicalObservation: clinicalObservation,
        therapistRemarks: therapistRemarks,
      };

      const res = await api.post('/api/recovery/assessment', payload);
      setResult(res.data);
      if (onSaved) onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save recovery assessment.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !therapyPlan) return null;

  const totalSessions = therapyPlan.totalSessions || 7;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-emerald-900/15 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#164E3D_0%,#1F4D3A_100%)] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-emerald-200 border border-white/20">
              <Activity size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">Recovery Tracking & Prediction</h2>
              <p className="text-xs text-emerald-100/80">
                {therapyPlan.therapyName || 'Therapy Assessment'} • Session {sessionNumber} of {totalSessions}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            /* Result Summary View after saving */
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700 text-white text-xs font-bold">
                  <CheckCircle2 size={14} /> Assessment Saved Successfully
                </div>
                <h3 className="text-xl font-bold text-emerald-950">Clinical Recovery Metrics</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-900 text-white text-center shadow-sm">
                  <p className="text-xs font-medium text-emerald-200 uppercase tracking-wider">Current Recovery</p>
                  <p className="text-3xl font-black text-emerald-400 mt-1">{result.currentRecoveryPercentage}%</p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white text-center shadow-sm">
                  <div className="flex items-center justify-center gap-1 text-xs font-medium text-amber-100 uppercase tracking-wider">
                    <Sparkles size={13} /> XGBoost Predicted Final
                  </div>
                  <p className="text-3xl font-black text-white mt-1">{result.predictedFinalRecovery}%</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                  <span>Recovery Trajectory Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    {result.status || 'Improving'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium pt-1 border-t border-gray-200">
                  <div>
                    <span className="text-gray-500 block">Pain</span>
                    <span className="font-bold text-emerald-900">{result.baselinePain} → {result.currentPain}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Sleep</span>
                    <span className="font-bold text-emerald-900">{result.baselineSleep} → {result.currentSleep}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Energy</span>
                    <span className="font-bold text-emerald-900">{result.baselineEnergy} → {result.currentEnergy}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Overall</span>
                    <span className="font-bold text-emerald-900">{result.baselineOverall} → {result.currentOverall}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
                >
                  Edit Metrics
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-[#164E3D] text-white text-xs font-bold hover:bg-[#113d2f] transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Entry Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex justify-between items-center bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900">Assessing Session Number:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={totalSessions}
                    value={sessionNumber}
                    onChange={(e) => setSessionNumber(e.target.value)}
                    className="w-16 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-center text-xs font-bold text-emerald-950"
                  />
                  <span className="text-xs text-gray-500 font-medium">/ {totalSessions}</span>
                </div>
              </div>

              {/* Slider / Number Inputs */}
              <div className="grid grid-cols-2 gap-4">
                {/* Pain Level */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-800">Pain Level (0-10)</label>
                    <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 font-black text-xs">
                      {painLevel} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painLevel}
                    onChange={(e) => setPainLevel(Number(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Sleep Quality */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-800">Sleep Quality (0-10)</label>
                    <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-black text-xs">
                      {sleepQuality} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Energy Level */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-800">Energy Level (0-10)</label>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-black text-xs">
                      {energyLevel} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>

                {/* Overall Condition */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-800">Overall Condition (0-10)</label>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs">
                      {overallCondition} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={overallCondition}
                    onChange={(e) => setOverallCondition(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Clinical Observation</label>
                  <textarea
                    rows={2}
                    value={clinicalObservation}
                    onChange={(e) => setClinicalObservation(e.target.value)}
                    placeholder="Enter clinical observations during/after session..."
                    className="w-full p-3 rounded-xl border border-gray-300 text-xs outline-none focus:border-[#164E3D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Therapist Remarks</label>
                  <textarea
                    rows={2}
                    value={therapistRemarks}
                    onChange={(e) => setTherapistRemarks(e.target.value)}
                    placeholder="Enter notes for patient recovery plan..."
                    className="w-full p-3 rounded-xl border border-gray-300 text-xs outline-none focus:border-[#164E3D]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#164E3D] text-white text-xs font-bold hover:bg-[#113d2f] transition shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {saving ? 'Calculating & Saving...' : 'Save Assessment & Predict'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
