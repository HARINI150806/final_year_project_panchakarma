import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, UserCircle2 } from 'lucide-react';
import Header from '../components/Header';

function TherapistAssignedTherapiesOverviewPage({ auth, onLogout }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchPatients() {
            try {
                const response = await api.get('/therapists/my-patients');
                setPatients(response.data);
            } catch (err) {
                console.error("Failed to fetch patients:", err);
                if (err.response && err.response.status === 403) {
                    setError('Access Denied: You do not have permission to view this data.');
                } else {
                    setError('Failed to fetch patients. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        }
        fetchPatients();
    }, []);

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
                    className="mb-6 flex items-center gap-2 rounded-xl border border-[#cfe0c2] bg-white/80 px-4 py-2 text-sm font-semibold text-forest/80 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-forest"
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
                        Loading patients...
                    </div>
                )}

                {!loading && !error && (
                    <section className="panel-frost rounded-[2rem] p-6 bg-white/80 relative overflow-hidden">
                        <div className="ambient-orb right-[-2rem] top-[-2rem] h-32 w-32 bg-[#cce4c0] opacity-40" />
                        
                        <div className="flex items-center gap-3 mb-6 relative">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef6e6] text-sage">
                                <UserCircle2 size={24} />
                            </div>
                            <div>
                                <span className="inline-block rounded-full bg-[#eef6e6] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sage">
                                    Therapist Portal
                                </span>
                                <h1 className="mt-1 font-display text-2xl font-bold text-forest">
                                    My Patients & Assigned Therapies
                                </h1>
                            </div>
                        </div>

                        {patients.length === 0 ? (
                            <p className="text-forest/60 text-center py-8">No patients found.</p>
                        ) : (
                            <div className="overflow-x-auto relative">
                                <table className="min-w-full bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                                    <thead className="bg-gray-50/75">
                                        <tr>
                                            <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                                            <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                                            <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                                            <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {patients.map(patient => (
                                            <tr key={patient.id} className="hover:bg-gray-50/50 transition">
                                                <td className="py-3.5 px-4 text-sm font-semibold text-gray-800">{patient.fullName}</td>
                                                <td className="py-3.5 px-4 text-sm text-gray-600">{patient.email}</td>
                                                <td className="py-3.5 px-4 text-sm text-gray-600">{patient.phone}</td>
                                                <td className="py-3.5 px-4 text-sm">
                                                    <Link
                                                        to={`/therapist/patients/${patient.id}/assigned-therapies`}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
                                                    >
                                                        View Therapies
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}

export default TherapistAssignedTherapiesOverviewPage;