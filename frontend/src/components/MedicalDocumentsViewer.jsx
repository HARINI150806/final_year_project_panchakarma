import React, { useEffect, useState } from 'react';
import { FileText, Eye, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api';

export default function MedicalDocumentsViewer({ patientId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDocuments = async () => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/medical-documents/patient/${patientId}`);
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to load patient medical documents:', err);
      setError('Could not load patient medical documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [patientId]);

  const handleView = async (doc) => {
    try {
      const response = await api.get(`/medical-documents/${doc.documentId}/view`, {
        responseType: 'blob',
      });
      const file = new Blob([response.data], { type: doc.fileType || 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error('Failed to view document:', err);
      alert('Could not view document. Access denied or file not found.');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await api.get(`/medical-documents/${doc.documentId}/download`, {
        responseType: 'blob',
      });
      const file = new Blob([response.data], { type: doc.fileType || 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', doc.documentName || 'medical-document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error('Failed to download document:', err);
      alert('Could not download document. Access denied or file not found.');
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-bold text-[#193322]">
            Medical Documents
          </h3>
          <p className="text-xs text-gray-500">
            Uploaded diagnostics, blood reports, prescriptions & imaging
          </p>
        </div>
        <button
          onClick={fetchDocuments}
          className="p-1.5 text-gray-400 hover:text-emerald-700 transition cursor-pointer"
          title="Refresh Documents"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <RefreshCw size={20} className="animate-spin text-emerald-700" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
          No medical documents uploaded by patient yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-[#edf5e7] text-[10px] uppercase tracking-wider text-[#163322]">
              <tr>
                <th className="px-4 py-2 font-bold">Type</th>
                <th className="px-4 py-2 font-bold">Document Name</th>
                <th className="px-4 py-2 font-bold">Date</th>
                <th className="px-4 py-2 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.documentId} className="hover:bg-emerald-50/40 transition">
                  <td className="px-4 py-2.5 font-bold text-[#1F4D3A]">
                    {doc.documentType}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">
                    <div className="flex items-center gap-1.5">
                      <FileText size={14} className="text-emerald-700" />
                      <span>{doc.documentName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 font-medium">
                    {doc.uploadedDate}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(doc)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-100/70 px-2.5 py-1 text-[11px] font-bold text-emerald-900 hover:bg-emerald-200 transition cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="flex items-center gap-1 rounded-lg bg-blue-100/70 px-2.5 py-1 text-[11px] font-bold text-blue-900 hover:bg-blue-200 transition cursor-pointer"
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </button>
                    </div>
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
