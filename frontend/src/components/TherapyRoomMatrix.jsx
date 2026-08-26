import { useState, useEffect } from 'react';
import { DoorOpen, CheckCircle, AlertTriangle, RefreshCw, Clock, Sparkles } from 'lucide-react';
import api from '../api';

export default function TherapyRoomMatrix() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
      setError('Failed to load room matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (roomId, newStatus) => {
    setUpdatingId(roomId);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'OCCUPIED') {
        payload.currentPatientName = 'Active Patient Session';
        payload.currentTherapy = 'Panchakarma Treatment';
        payload.occupiedUntil = '18:45';
      }
      await api.put(`/rooms/${roomId}/status`, payload);
      await fetchRooms();
    } catch (err) {
      alert('Failed to update room status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-xs text-forest/50">Loading therapy room matrix...</div>;
  }

  return (
    <div className="rounded-3xl border border-sand/40 bg-white/90 p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sand/30 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            Hospital Facility Operations
          </span>
          <h3 className="font-display text-xl font-bold text-forest mt-1 flex items-center gap-2">
            <DoorOpen size={22} className="text-sage" /> Live Therapy Room & Sanitization Matrix
          </h3>
          <p className="text-xs text-forest/65">
            Real-time occupancy, Droni table status, and herbal sanitization cycles between patient sessions.
          </p>
        </div>

        <button
          onClick={fetchRooms}
          className="rounded-xl border border-sand/60 bg-white px-3 py-1.5 text-xs font-bold text-forest hover:bg-sand/10 transition inline-flex items-center gap-1.5"
        >
          <RefreshCw size={13} /> Refresh Matrix
        </button>
      </div>

      {error && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rooms.map((room) => {
          const isAvailable = room.status === 'AVAILABLE';
          const isOccupied = room.status === 'OCCUPIED';
          const needsSanitization = room.status === 'NEEDS_SANITIZATION';

          return (
            <div
              key={room.id}
              className={`rounded-2xl border p-4 transition-all flex flex-col justify-between space-y-3 ${
                isAvailable
                  ? 'border-emerald-300 bg-emerald-50/60 text-emerald-950'
                  : isOccupied
                  ? 'border-rose-300 bg-rose-50/60 text-rose-950'
                  : 'border-amber-300 bg-amber-50/60 text-amber-950'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {room.roomType.replace('_', ' ')}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      isAvailable
                        ? 'bg-emerald-200 text-emerald-900'
                        : isOccupied
                        ? 'bg-rose-200 text-rose-900'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {isAvailable ? '🟢 AVAILABLE' : isOccupied ? '🔴 OCCUPIED' : '🟡 SANITIZING'}
                  </span>
                </div>

                <h4 className="font-display text-sm font-bold mt-2">{room.roomName}</h4>

                {isOccupied && (
                  <div className="mt-2 bg-white/70 rounded-xl p-2 text-xs space-y-1">
                    <p className="font-semibold text-rose-900">{room.currentTherapy || 'Active Session'}</p>
                    <p className="text-forest/70">{room.currentPatientName || 'Patient'}</p>
                    {room.occupiedUntil && (
                      <p className="text-[11px] text-rose-700 flex items-center gap-1 font-medium">
                        <Clock size={11} /> Until {room.occupiedUntil}
                      </p>
                    )}
                  </div>
                )}

                {needsSanitization && (
                  <div className="mt-2 bg-white/70 rounded-xl p-2 text-xs text-amber-900">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertTriangle size={12} className="text-amber-600" /> Herbal Steam Sanitize
                    </p>
                    <p className="text-[11px] opacity-80 mt-0.5">Droni table requires cleaning cycle before next patient.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons for Therapists/Staff */}
              <div className="pt-2 border-t border-black/5 flex flex-col gap-1.5">
                {isAvailable && (
                  <button
                    onClick={() => handleUpdateStatus(room.id, 'OCCUPIED')}
                    disabled={updatingId === room.id}
                    className="w-full rounded-xl bg-forest px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-forest/90 transition"
                  >
                    Start Patient Session
                  </button>
                )}

                {isOccupied && (
                  <button
                    onClick={() => handleUpdateStatus(room.id, 'NEEDS_SANITIZATION')}
                    disabled={updatingId === room.id}
                    className="w-full rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
                  >
                    Finish Session & Mark Sanitize
                  </button>
                )}

                {needsSanitization && (
                  <button
                    onClick={() => handleUpdateStatus(room.id, 'AVAILABLE')}
                    disabled={updatingId === room.id}
                    className="w-full rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition inline-flex items-center justify-center gap-1"
                  >
                    <Sparkles size={13} /> Mark Sanitized & Available
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
