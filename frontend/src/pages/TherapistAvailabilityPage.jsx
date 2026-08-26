import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import TherapistAvailabilityManager from '../components/TherapistAvailabilityManager';

function TherapistAvailabilityPage({ auth, onLogout }) {
    const navigate = useNavigate();

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

                <section className="panel-frost rounded-[2rem] p-6 bg-white/80 relative overflow-hidden">
                    <div className="ambient-orb right-[-2rem] top-[-2rem] h-32 w-32 bg-[#cce4c0] opacity-40" />
                    
                    <div className="relative">
                        <TherapistAvailabilityManager />
                    </div>
                </section>
            </main>
        </div>
    );
}

export default TherapistAvailabilityPage;
