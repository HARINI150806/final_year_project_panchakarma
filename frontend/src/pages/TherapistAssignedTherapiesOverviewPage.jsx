import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

function TherapistAssignedTherapiesOverviewPage() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) {
        return <div>Loading patients...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">My Patients & Assigned Therapies</h1>

            {patients.length === 0 ? (
                <p>No patients found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white shadow-md rounded-lg">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b text-left">Name</th>
                                <th className="py-2 px-4 border-b text-left">Email</th>
                                <th className="py-2 px-4 border-b text-left">Phone</th>
                                <th className="py-2 px-4 border-b text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map(patient => (
                                <tr key={patient.id}>
                                    <td className="py-2 px-4 border-b">{patient.name}</td>
                                    <td className="py-2 px-4 border-b">{patient.email}</td>
                                    <td className="py-2 px-4 border-b">{patient.phone}</td>
                                    <td className="py-2 px-4 border-b">
                                        <Link
                                            to={`/therapist/patients/${patient.id}/assigned-therapies`}
                                            className="text-blue-500 hover:underline"
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
        </div>
    );
}

export default TherapistAssignedTherapiesOverviewPage;