import React, { useEffect, useState } from 'react';
import api from '../api';
import { useParams } from 'react-router-dom';

function AssignedTherapiesPage() {
    const [therapies, setTherapies] = useState([]);
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { patientId } = useParams(); // Assuming patientId will be passed in the URL

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

    if (loading) {
        return <div>Loading assigned therapies...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (!patient) {
        return <div className="text-red-500">Patient not found.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Assigned Therapies for {patient.firstName} {patient.lastName}</h1>

            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4">Patient Details</h2>
                <p><strong>Name:</strong> {patient.firstName} {patient.lastName}</p>
                <p><strong>Email:</strong> {patient.email}</p>
                <p><strong>Phone:</strong> {patient.contactNumber}</p>
                {/* Add more patient details as needed */}
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Therapies</h2>
                {therapies.length === 0 ? (
                    <p>No therapies assigned to this patient yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 border-b">Therapy Name</th>
                                    <th className="py-2 px-4 border-b">Description</th>
                                    <th className="py-2 px-4 border-b">Duration</th>
                                    <th className="py-2 px-4 border-b">Date</th>
                                    <th className="py-2 px-4 border-b">Time</th>
                                    <th className="py-2 px-4 border-b">Status</th>
                                    {/* Add more therapy details as needed */}
                                </tr>
                            </thead>
                            <tbody>
                                {therapies.map(therapy => (
                                    <tr key={therapy.bookingId}>
                                        <td className="py-2 px-4 border-b">{therapy.therapyName}</td>
                                     <td className="py-2 px-4 border-b">{therapy.therapyDescription}</td>
                                     <td className="py-2 px-4 border-b">{therapy.therapyDuration}</td>
                                     <td className="py-2 px-4 border-b">{therapy.bookingDate}</td>
                                     <td className="py-2 px-4 border-b">{therapy.bookingTime}</td>
                                     <td className="py-2 px-4 border-b">{therapy.bookingStatus}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AssignedTherapiesPage;