import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api';

export default function FollowUpScheduleModal({ patientId: initialPatientId, patientName: initialPatientName, treatmentName: initialTreatmentName, bookingId, onClose, onScheduleSuccess }) {
  const [option, setOption] = useState('15'); // '15', '30', 'custom'

  const getDateForOption = (opt) => {
    const today = new Date();
    if (opt === '15') {
      today.setDate(today.getDate() + 15);
      return today.toISOString().split('T')[0];
    } else if (opt === '30') {
      today.setDate(today.getDate() + 30);
      return today.toISOString().split('T')[0];
    }
    return '';
  };

  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');
  const [patientList, setPatientList] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [followupDate, setFollowupDate] = useState(getDateForOption('15'));
  const [followupTime, setFollowupTime] = useState('10:30 AM');
  const [reason, setReason] = useState('Routine Recovery Check');
  const [treatmentName, setTreatmentName] = useState(initialTreatmentName || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!initialPatientId) {
      setLoadingPatients(true);
      api.get('/therapists/my-patients')
        .then((res) => {
          const list = res.data || [];
          setPatientList(list);
          if (list.length > 0) {
            const first = list[0];
            setSelectedPatientId(first.id || first.patientId);
          }
        })
        .catch((err) => {
          console.error('Failed to load patients:', err);
        })
        .finally(() => {
          setLoadingPatients(false);
        });
    }
  }, [initialPatientId]);

  const handleOptionChange = (newOpt) => {
    setOption(newOpt);
    if (newOpt !== 'custom') {
      setFollowupDate(getDateForOption(newOpt));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pid = initialPatientId || selectedPatientId;
    if (!pid) {
      setError('Please select a valid patient.');
      return;
    }
    if (!followupDate) {
      setError('Please select a valid follow-up date.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        patientId: Number(pid),
        bookingId: bookingId ? Number(bookingId) : null,
        treatmentName: treatmentName || 'Abhyanga Therapy',
        followupDate,
        followupTime,
        reason,
      };

      await api.post('/followups/schedule', payload);
      setSuccessMsg('Follow-up scheduled successfully! Confirmation email sent to patient.');
      if (onScheduleSuccess) onScheduleSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to schedule follow-up:', err);
      setError(err.response?.data?.message || 'Failed to schedule follow-up appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const activePatientName = initialPatientName || (patientList.find(p => String(p.id || p.patientId) === String(selectedPatientId))?.fullName || 'Selected Patient');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Treatment Completed
            </span>
            <h2 className="font-display text-lg font-bold text-[#193322] mt-1">
              Schedule Follow-up
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Patient Selection / Summary */}
        {initialPatientId ? (
          <div className="mt-4 rounded-2xl bg-[#F7FAF3] p-3 text-xs space-y-1 border border-emerald-100">
            <p><span className="font-bold text-gray-500">Patient:</span> <span className="font-bold text-[#193322] text-sm">{activePatientName}</span></p>
            <p><span className="font-bold text-gray-500">Therapy:</span> <span className="font-bold text-[#1F4D3A]">{treatmentName || 'Abhyanga Therapy'}</span></p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <label className="block text-xs font-bold text-gray-700">Select Patient</label>
            {loadingPatients ? (
              <div className="text-xs text-gray-400 italic">Loading patient list...</div>
            ) : (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-semibold text-gray-800 focus:border-[#1F4D3A] focus:outline-none"
              >
                {patientList.map((p) => (
                  <option key={p.id || p.patientId} value={p.id || p.patientId}>
                    {p.fullName || p.name} ({p.email})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Schedule Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Options */}
          <div>
            <label className="block font-bold text-gray-700 mb-2">Schedule Timeframe</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleOption"
                  checked={option === '15'}
                  onChange={() => handleOptionChange('15')}
                  className="accent-[#1F4D3A]"
                />
                <span className="font-semibold text-gray-800">After 15 Days</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleOption"
                  checked={option === '30'}
                  onChange={() => handleOptionChange('30')}
                  className="accent-[#1F4D3A]"
                />
                <span className="font-semibold text-gray-800">After 30 Days</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleOption"
                  checked={option === 'custom'}
                  onChange={() => handleOptionChange('custom')}
                  className="accent-[#1F4D3A]"
                />
                <span className="font-semibold text-gray-800">Custom Date</span>
              </label>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Follow-up Date</label>
            <input
              type="date"
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-medium focus:border-[#1F4D3A] focus:outline-none"
              required
            />
          </div>

          {/* Time Picker */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Time</label>
            <input
              type="text"
              value={followupTime}
              onChange={(e) => setFollowupTime(e.target.value)}
              placeholder="10:30 AM"
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-medium focus:border-[#1F4D3A] focus:outline-none"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Reason / Purpose</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Routine Recovery Check"
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-medium focus:border-[#1F4D3A] focus:outline-none"
              required
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#1F4D3A] px-5 py-2 font-bold text-white shadow-md hover:bg-[#183d2e] transition disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Schedule Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
