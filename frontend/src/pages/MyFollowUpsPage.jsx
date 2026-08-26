import React, { useEffect, useState } from 'react';
import { Clock, Calendar, User, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../api';

export default function MyFollowUpsPage() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFollowups = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/followups/patient');
      setFollowups(res.data || []);
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
      setError('Unable to load follow-up appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-[#1F4D3A] p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-800/60 px-3 py-1 text-xs font-semibold text-emerald-200">
              <Clock size={14} />
              <span>Post-Care Care & Recovery</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl text-white">
              My Follow-ups
            </h1>
            <p className="mt-1 max-w-xl text-sm text-emerald-100/80">
              View your scheduled recovery checkups, health evaluations, and consultation status with your therapist.
            </p>
          </div>
          <button
            onClick={fetchFollowups}
            className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text.xs font-medium text-white backdrop-blur-md hover:bg-white/20 transition cursor-pointer self-start md:self-center"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-emerald-900/10 bg-white p-8">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={28} className="animate-spin text-emerald-700" />
            <p className="text-sm font-medium text-gray-600">Loading follow-ups...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <AlertCircle className="mx-auto mb-2" size={24} />
          <p className="font-semibold">{error}</p>
        </div>
      ) : followups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-900/20 bg-white/70 p-12 text-center shadow-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 mb-4">
            <Calendar size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">No Follow-ups Scheduled</h3>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Once your therapist completes your therapy sessions, follow-up consultations will be automatically scheduled and displayed here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-[#edf5e7] text-xs uppercase tracking-wider text-[#163322]">
                <tr>
                  <th className="px-6 py-4 font-bold">Follow-up Date</th>
                  <th className="px-6 py-4 font-bold">Time</th>
                  <th className="px-6 py-4 font-bold">Therapist</th>
                  <th className="px-6 py-4 font-bold">Treatment / Purpose</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Recovery Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {followups.map((item) => {
                  const isCompleted = item.status === 'COMPLETED';
                  return (
                    <tr key={item.followupId} className="hover:bg-emerald-50/40 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-emerald-700" />
                          <span>{item.followupDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {item.followupTime || '10:30 AM'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span className="font-semibold text-gray-800">
                            {item.therapistName ? `Dr. ${item.therapistName}` : 'Care Therapist'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <div>
                          <p className="font-medium text-emerald-950">{item.treatmentName || 'Panchakarma Care'}</p>
                          <p className="text-xs text-gray-500">{item.reason}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isCompleted ? <CheckCircle size={14} /> : <Clock size={14} />}
                          {isCompleted ? 'Completed' : 'Upcoming'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isCompleted ? (
                          <div className="text-xs space-y-1">
                            <p><span className="font-bold text-gray-700">Recovery:</span> <span className="font-semibold text-emerald-700">{item.recoveryStatus || 'Good'}</span></p>
                            <p><span className="font-bold text-gray-700">Pain Level:</span> {item.painLevel}/10</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Pending consultation</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
