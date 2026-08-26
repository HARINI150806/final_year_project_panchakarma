import React, { useState } from 'react';
import { X, CheckCircle, Save, AlertCircle } from 'lucide-react';
import api from '../api';

export default function FollowUpConsultationModal({ followup, onClose, onSaveSuccess }) {
  const [painLevel, setPainLevel] = useState(followup?.painLevel || 5);
  const [sleepQuality, setSleepQuality] = useState(followup?.sleepQuality || 5);
  const [energyLevel, setEnergyLevel] = useState(followup?.energyLevel || 5);
  const [recoveryStatus, setRecoveryStatus] = useState(followup?.recoveryStatus || 'Good');
  const [additionalObservations, setAdditionalObservations] = useState(followup?.additionalObservations || '');
  const [continueMedication, setContinueMedication] = useState(followup?.continueMedication ?? true);
  const [furtherTherapyRequired, setFurtherTherapyRequired] = useState(followup?.furtherTherapyRequired ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        painLevel: Number(painLevel),
        sleepQuality: Number(sleepQuality),
        energyLevel: Number(energyLevel),
        recoveryStatus,
        additionalObservations,
        continueMedication,
        furtherTherapyRequired,
      };

      await api.post(`/followups/${followup.followupId}/complete`, payload);
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save follow-up consultation:', err);
      setError(err.response?.data?.message || 'Failed to save follow-up consultation observations.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#193322]">
              Follow-up Consultation
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Record patient recovery progress and health parameters
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Patient Details Summary Box */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[#F7FAF3] p-4 text-sm border border-emerald-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Patient</span>
              <p className="font-extrabold text-[#193322] text-base">{followup?.patientName || 'Keerthi'}</p>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Completed Therapy</span>
              <p className="font-extrabold text-[#1F4D3A] text-base">{followup?.treatmentName || 'Abhyanga'}</p>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Ratings Section */}
          <div className="space-y-4">
            {/* Pain Level */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700">Current Pain Level (1–10)</label>
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">{painLevel}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={painLevel}
                onChange={(e) => setPainLevel(e.target.value)}
                className="w-full accent-[#1F4D3A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>1 (No Pain)</span>
                <span>10 (Severe Pain)</span>
              </div>
            </div>

            {/* Sleep Quality */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700">Current Sleep Quality (1–10)</label>
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">{sleepQuality}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={sleepQuality}
                onChange={(e) => setSleepQuality(e.target.value)}
                className="w-full accent-[#1F4D3A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>1 (Poor)</span>
                <span>10 (Excellent Restful)</span>
              </div>
            </div>

            {/* Energy Level */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700">Current Energy Level (1–10)</label>
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">{energyLevel}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value)}
                className="w-full accent-[#1F4D3A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>1 (Fatigued)</span>
                <span>10 (High Energy)</span>
              </div>
            </div>
          </div>

          {/* Recovery Status */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Recovery Status</label>
            <div className="grid grid-cols-4 gap-2">
              {['Excellent', 'Good', 'Moderate', 'Poor'].map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setRecoveryStatus(status)}
                  className={`rounded-xl py-2 px-3 text-xs font-bold border transition ${
                    recoveryStatus === status
                      ? 'border-[#1F4D3A] bg-[#1F4D3A] text-white shadow-xs'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Observations */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Additional Observations</label>
            <textarea
              rows={3}
              value={additionalObservations}
              onChange={(e) => setAdditionalObservations(e.target.value)}
              placeholder="Record clinical observations, vitals, or symptoms reported by patient..."
              className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:border-[#1F4D3A] focus:outline-none"
            />
          </div>

          {/* Toggles / Yes-No Choices */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
              <label className="block text-xs font-bold text-gray-700 mb-2">Continue Medication?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setContinueMedication(true)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold border transition ${
                    continueMedication ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setContinueMedication(false)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold border transition ${
                    !continueMedication ? 'bg-rose-700 text-white border-rose-700' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
              <label className="block text-xs font-bold text-gray-700 mb-2">Further Therapy Required?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFurtherTherapyRequired(true)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold border transition ${
                    furtherTherapyRequired ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFurtherTherapyRequired(false)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold border transition ${
                    !furtherTherapyRequired ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#1F4D3A] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#183d2e] transition disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Observations'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
