import { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, Clock, User, Tag, Info } from 'lucide-react';

const PatientBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await api.get('/patient/bookings');
                setBookings(response.data);
            } catch (err) {
                setError('Failed to fetch bookings. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    if (loading) {
        return <div className="text-center p-4">Loading bookings...</div>;
    }

    if (error) {
        return <div className="text-center p-4 text-red-500">{error}</div>;
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
            {bookings.length === 0 ? (
                <p>You have no bookings.</p>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="bg-white p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">{booking.type}</h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>{booking.status}</span>
                            </div>
                            <div className="text-sm text-gray-600 mt-2">
                                <div className="flex items-center mb-1">
                                    <Calendar size={14} className="mr-2" />
                                    <span>{new Date(booking.date).toLocaleDateString()}</span>
                                    <Clock size={14} className="ml-4 mr-2" />
                                    <span>{booking.time}</span>
                                </div>
                                {booking.assignedTo && (
                                    <div className="flex items-center">
                                        <User size={14} className="mr-2" />
                                        <span>Therapist: {booking.assignedTo.fullName}</span>
                                    </div>
                                )}
                                <div className="flex items-center mt-1">
                                    <Info size={14} className="mr-2" />
                                    <span>Notes: {booking.notes}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientBookings;