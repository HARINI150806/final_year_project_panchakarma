import React, { useEffect, useState } from 'react';
import api from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, UserCircle2, Clock } from 'lucide-react';
import Header from '../components/Header';
import FollowUpScheduleModal from '../components/FollowUpScheduleModal';
import MedicalDocumentsViewer from '../components/MedicalDocumentsViewer';

function AssignedTherapiesPage({ auth, onLogout }) {
    const [therapies, setTherapies] = useState([]);
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const { patientId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch patient details
                const patientRes = await api.get(`/patient/details/${patientId}`);
                setPatient(patientRes.data);

                // Fetch assigned therapies for the patient
                const therapiesRes = await api.get(`/therapists/patients/${patientId}/therapies`);
                setTherapies(therapiesRes.data);

            } catch (err) {
                console.error("Failed to fetch assigned therapies or patient details:", err);
                if (err.response && err.response.status === 403) {
                    setError('Access Denied: You do not have permission to view this data.');
                } else {
                    setError('Failed to fetch data. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [patientId]);

    const patientFullName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Patient';

    return (
        <div className="bg-dashboard-surface min-h-screen font-body text-forest relative">
            {/* Background orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="ambient-orb left-[-4rem] top-24 h-72 w-72 bg-[#d7e6cb] opacity-50" />
                <div className="ambient-orb right-[-5rem] top-12 h-80 w-80 bg-[#ebd5b7] opacity-50" />
                <div className="noise-grid absolute inset-0 opacity-[0.08]" />
            </div>

            {/* Static header */}
            <div className="relative z-50 border-b border-white/60 bg-[rgba(250,248,242,0.86)] backdrop-blur-xl shadow-xs">
                <Header auth={auth} onLogout={onLogout} />
            </div>

            <main className="relative mx-auto max-w-5xl px-4 py-8 z-10">
                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 rounded-xl border border-[#cfe0c2] bg-white/80 px-4 py-2 text-sm font-semibold text-forest/80 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-forest cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                {error && (
                    <div className="panel-frost border-rose-200 bg-rose-50/50 p-6 rounded-[1.6rem] text-rose-800 text-center">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="panel-frost p-12 rounded-[1.6rem] bg-white/80 text-center text-forest/70">
                        Loading assigned therapies...
                    </div>
                )}

                {!loading && !error && !patient && (
                    <div className="panel-frost p-12 rounded-[1.6rem] bg-white/80 text-center text-forest/70">
                        Patient not found.
                    </div>
                )}

                {!loading && !error && patient && (
                    <div className="space-y-6">
                        {/* Patient details section */}
                        <section className="panel-frost rounded-[2rem] p-6 bg-white/80 relative overflow-hidden">
                            <div className="ambient-orb right-[-2rem] top-[-2rem] h-32 w-32 bg-[#cce4c0] opacity-40" />
                            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef6e6] text-sage">
                                        <UserCircle2 size={24} />
                                    </div>
                                    <div>
                                        <span className="inline-block rounded-full bg-[#eef6e6] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sage">
                                            Patient Profile
                                        </span>
                                        <h1 className="mt-1 font-display text-2xl font-bold text-forest">
                                            Assigned Therapies for {patientFullName}
                                        </h1>
                                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-forest/75">
                                            <p><strong>Email:</strong> {patient.email}</p>
                                            <p><strong>Phone:</strong> {patient.contactNumber}</p>
                                            {patient.gender && <p><strong>Gender:</strong> {patient.gender}</p>}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setScheduleModalOpen(true)}
                                    className="flex items-center gap-2 rounded-2xl bg-[#1F4D3A] px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-[#183d2e] transition cursor-pointer self-start md:self-center"
                                >
                                    <Clock size={16} />
                                    <span>Schedule Follow-up</span>
                                </button>
                            </div>
                        </section>

                        {/* Medical Documents Section for Therapist Review */}
                        <MedicalDocumentsViewer patientId={patientId} />

                        {/* Therapies table section */}
                        <section className="panel-frost rounded-[2rem] p-6 bg-white/80">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="rounded-2xl bg-[#e6efdf] p-2.5 text-sage">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h2 className="font-display text-xl font-bold">Therapy Sessions List</h2>
                                    <p className="text-sm text-forest/65">List of sessions booked/scheduled for this patient</p>
                                </div>
                            </div>

                            {therapies.length === 0 ? (
                                <p className="text-forest/60 text-center py-8">No therapies assigned to this patient yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                                        <thead className="bg-gray-50/75">
                                            <tr>
                                                <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Therapy Name</th>
                                                <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                                                <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Duration</th>
                                                <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                                <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                                                <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                                <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Google Meet</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {therapies.map(therapy => (
                                                <tr key={therapy.bookingId} className="hover:bg-gray-50/50 transition">
                                                    <td className="py-3.5 px-4 text-sm font-semibold text-gray-800">{therapy.therapyName}</td>
                                                    <td className="py-3.5 px-4 text-sm text-gray-600 max-w-xs truncate">{therapy.therapyDescription || '-'}</td>
                                                    <td className="py-3.5 px-4 text-sm text-gray-600">{therapy.therapyDuration || '-'}</td>
                                                    <td className="py-3.5 px-4 text-sm text-gray-600">
                                                        {therapy.bookingDate ? new Date(therapy.bookingDate).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-sm text-gray-600">{therapy.bookingTime || '-'}</td>
                                                    <td className="py-3.5 px-4 text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            therapy.bookingStatus === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                                            therapy.bookingStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {therapy.bookingStatus}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-sm">
                                                        {therapy.meetLink ? (
                                                            <a
                                                                href={therapy.meetLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
                                                            >
                                                                📹 Join Meet
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </main>

            {scheduleModalOpen && (
                <FollowUpScheduleModal
                    patientId={patientId}
                    patientName={patientFullName}
                    treatmentName={therapies.length > 0 ? (therapies[0].therapyName || 'Abhyanga') : 'Abhyanga'}
                    bookingId={therapies.length > 0 ? therapies[0].bookingId : null}
                    onClose={() => setScheduleModalOpen(false)}
                    onScheduleSuccess={() => {
                        // Refresh if needed
                    }}
                />
            )}
        </div>
    );
}

export default AssignedTherapiesPage;