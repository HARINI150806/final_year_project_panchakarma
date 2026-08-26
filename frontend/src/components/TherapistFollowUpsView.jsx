import React, { useEffect, useState } from 'react';
import { Clock, Calendar, User, FileText, CheckCircle, AlertCircle, RefreshCw, Stethoscope } from 'lucide-react';
import api from '../api';
import FollowUpConsultationModal from './FollowUpConsultationModal';
import FollowUpScheduleModal from './FollowUpScheduleModal';

export default function TherapistFollowUpsView() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const fetchFollowups = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/followups/therapist');
      setFollowups(res.data || []);
    } catch (err) {
      console.error('Failed to load therapist follow-ups:', err);
      setError('Unable to load follow-up appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleOpenModal = (followup) => {
    setSelectedFollowup(followup);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
            <Clock size={14} /> Follow-up Consultations
          </div>
          <h2 className="font-display text-2xl font-bold text-[#193322] mt-1">
            Patient Recovery Follow-ups
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Track post-treatment progress, conduct consultations, and record health observations.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => setScheduleModalOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-[#1F4D3A] px-4 py-2 text-xs font-bold text-white hover:bg-[#183d2e] transition cursor-pointer shadow-xs"
          >
            <Clock size={16} />
            <span>+ Schedule Follow-up</span>
          </button>
          <button
            onClick={fetchFollowups}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-3xl border border-dashed border-emerald-900/10 bg-white">
          <RefreshCw size={24} className="animate-spin text-emerald-700" />
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : followups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
          No follow-up appointments assigned yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-[#edf5e7] text-xs uppercase tracking-wider text-[#163322]">
                <tr>
                  <th className="px-6 py-4 font-bold">Patient</th>
                  <th className="px-6 py-4 font-bold">Completed Therapy</th>
                  <th className="px-6 py-4 font-bold">Follow-up Date & Time</th>
                  <th className="px-6 py-4 font-bold">Reason</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {followups.map((item) => {
                  const isCompleted = item.status === 'COMPLETED';
                  return (
                    <tr key={item.followupId} className="hover:bg-emerald-50/40 transition">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-emerald-700" />
                          <span>{item.patientName || 'Keerthi'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-950">
                        {item.treatmentName || 'Abhyanga'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <p className="font-bold text-gray-800">{item.followupDate}</p>
                          <p className="text-gray-500">{item.followupTime || '10:30 AM'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {item.reason || 'Routine Recovery Check'}
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
                      <td className="px-6 py-4 text-right">
                        {isCompleted ? (
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                          >
                            <FileText size={14} />
                            <span>View Observations</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F4D3A] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#183d2e] transition cursor-pointer"
                          >
                            <Stethoscope size={14} />
                            <span>Follow-up Consultation</span>
                          </button>
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

      {/* Consultation Modal */}
      {modalOpen && selectedFollowup && (
        <FollowUpConsultationModal
          followup={selectedFollowup}
          onClose={() => {
            setModalOpen(false);
            setSelectedFollowup(null);
          }}
          onSaveSuccess={() => {
            fetchFollowups();
          }}
        />
      )}

      {/* Schedule Modal */}
      {scheduleModalOpen && (
        <FollowUpScheduleModal
          onClose={() => setScheduleModalOpen(false)}
          onScheduleSuccess={() => fetchFollowups()}
        />
      )}
    </div>
  );
}
