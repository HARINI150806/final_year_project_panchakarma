import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function TherapistDashboard() {
    const [bookings, setBookings] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const [bookingsRes, patientsRes] = await Promise.all([
                    api.get('/api/therapists/my-bookings'),
                    api.get('/api/therapists/my-patients')
                ]);
                setBookings(bookingsRes.data);
                setPatients(patientsRes.data);
            } catch (err) {
                if (err.response && err.response.status === 403) {
                    setError('Access Denied: You do not have permission to view this data. Please ensure you are logged in as a therapist.');
                } else {
                    setError('Failed to fetch data. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold">My Bookings</h2>
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">Patient</th>
                                <th className="py-2 px-4 border-b">Therapy</th>
                                <th className="py-2 px-4 border-b">Date</th>
                                <th className="py-2 px-4 border-b">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(booking => (
                                <tr key={booking.id}>
                                    <td className="py-2 px-4 border-b">{booking.patientName}</td>
                                    <td className="py-2 px-4 border-b">{booking.therapyName}</td>
                                    <td className="py-2 px-4 border-b">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                                    <td className="py-2 px-4 border-b">{booking.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold">My Patients</h2>
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">Name</th>
                                <th className="py-2 px-4 border-b">Email</th>
                                <th className="py-2 px-4 border-b">Phone</th>
                                <th className="py-2 px-4 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map(patient => (
                                <tr key={patient.id}>
                                    <td className="py-2 px-4 border-b">{patient.name}</td>
                                    <td className="py-2 px-4 border-b">{patient.email}</td>
                                    <td className="py-2 px-4 border-b">{patient.phone}</td>
                                    <td className="py-2 px-4 border-b">
                                        <Link to={`/api/therapists/patients/${patient.id}/therapies`} className="text-blue-500 hover:underline">
                                            View Therapies
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default TherapistDashboard;