import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const MyComplaintsPage = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const response = await api.get('/patient/complaints');
                setComplaints(response.data);
            } catch (error) {
                console.error('Error fetching complaints:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchComplaints();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">My Complaints</h1>
                <Link to="/new-complaint" className="bg-blue-500 text-white px-4 py-2 rounded">
                    New Complaint
                </Link>
            </div>
            <div className="bg-white shadow-md rounded my-6">
                <table className="min-w-max w-full table-auto">
                    <thead>
                        <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left">Date</th>
                            <th className="py-3 px-6 text-left">Main Complaint</th>
                            <th className="py-3 px-6 text-center">Severity</th>
                            <th className="py-3 px-6 text-center">Duration</th>
                            <th className="py-3 px-6 text-center">Status</th>
                            <th className="py-3 px-6 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-light">
                        {complaints.map(complaint => (
                            <tr key={complaint.id} className="border-b border-gray-200 hover:bg-gray-100">
                                <td className="py-3 px-6 text-left whitespace-nowrap">
                                    {new Date(complaint.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-6 text-left">
                                    {complaint.mainComplaint}
                                </td>
                                <td className="py-3 px-6 text-center">
                                    {complaint.severity}
                                </td>
                                <td className="py-3 px-6 text-center">
                                    {complaint.durationValue} {complaint.durationUnit}
                                </td>
                                <td className="py-3 px-6 text-center">
                                    <span className="bg-purple-200 text-purple-600 py-1 px-3 rounded-full text-xs">
                                        {complaint.status}
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-center">
                                    <div className="flex item-center justify-center">
                                        <Link to={`/complaint/${complaint.id}`} className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110">
                                            {/* View icon */}
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MyComplaintsPage;