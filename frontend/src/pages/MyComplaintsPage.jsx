import { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { ClipboardList, PlusCircle, AlertCircle, Calendar, Clock, ChevronRight } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const MyComplaintsPage = ({ auth, onLogout }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await api.get('/patient/complaints');
        setComplaints(response.data || []);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  return (
    <DashboardLayout auth={auth} onLogout={onLogout} activeTab="reports">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-6 md:p-8 shadow-sm backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-900">
              <ClipboardList size={14} /> Health History & Clinical Concerns
            </span>
            <h1 className="mt-2 font-display text-2xl font-bold text-forest">My Reported Symptoms & Complaints</h1>
            <p className="mt-1 text-sm text-forest/70 max-w-xl">
              Track your logged symptoms, severity levels, and consultation status with your attending Ayurvedic doctor.
            </p>
          </div>
          <Link
            to="/new-complaint"
            className="shrink-0 flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-5 py-3 text-xs font-bold text-white shadow-md transition hover:shadow-lg"
          >
            <PlusCircle size={16} /> Log New Health Concern
          </Link>
        </div>

        {/* Content Table / Cards */}
        {loading ? (
          <div className="rounded-3xl border border-emerald-900/10 bg-white/80 p-12 text-center text-forest/60">
            Loading your health complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-12 text-center space-y-3 shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-900">
              <ClipboardList size={26} />
            </div>
            <h3 className="font-display text-lg font-bold text-forest">No Complaints Recorded</h3>
            <p className="text-xs text-forest/65 max-w-md mx-auto">
              You haven't logged any health complaints yet. Click below to log symptoms for doctor review.
            </p>
            <Link
              to="/new-complaint"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1b3d2b] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#122c1e] mt-2"
            >
              <PlusCircle size={15} /> Add First Complaint
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border border-emerald-900/10 bg-white/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-forest">
                <thead className="bg-[#f2f8ee] border-b border-emerald-900/10 text-[11px] font-bold uppercase tracking-wider text-forest/70">
                  <tr>
                    <th className="py-4 px-6">Date Logged</th>
                    <th className="py-4 px-6">Main Complaint</th>
                    <th className="py-4 px-6 text-center">Severity</th>
                    <th className="py-4 px-6 text-center">Duration</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/5">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-emerald-50/40 transition duration-150">
                      <td className="py-4 px-6 whitespace-nowrap font-medium text-forest/80">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 font-bold text-forest max-w-xs truncate">
                        {c.mainComplaint}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          c.severity?.toLowerCase() === 'high' || c.severity?.toLowerCase() === 'severe'
                            ? 'bg-rose-100 text-rose-800'
                            : c.severity?.toLowerCase() === 'moderate'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {c.severity || 'Mild'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-medium text-forest/80">
                        {c.durationValue} {c.durationUnit}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block bg-emerald-100/80 text-emerald-900 px-3 py-1 rounded-full font-extrabold text-[10px] uppercase">
                          {c.status || 'Reviewed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyComplaintsPage;