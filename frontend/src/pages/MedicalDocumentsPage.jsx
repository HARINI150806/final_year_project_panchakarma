import React, { useEffect, useState } from 'react';
import { FileText, Upload, Eye, Download, Trash2, CheckCircle, AlertCircle, RefreshCw, Paperclip } from 'lucide-react';
import api from '../api';

export default function MedicalDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [documentType, setDocumentType] = useState('Blood Report');
  const [selectedFile, setSelectedFile] = useState(null);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/medical-documents/patient');
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to load medical documents:', err);
      setError('Unable to load medical documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Selected file size exceeds 10MB limit.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please choose a file to upload (PDF, JPG, PNG).');
      return;
    }

    setUploading(true);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', documentType);

      await api.post('/medical-documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMsg('Medical document uploaded successfully!');
      setSelectedFile(null);
      // Reset input file
      const fileInput = document.getElementById('document-file-input');
      if (fileInput) fileInput.value = '';

      fetchDocuments();
    } catch (err) {
      console.error('Failed to upload document:', err);
      setError(err.response?.data?.message || 'Failed to upload document. Please check file type and size.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this medical document?')) return;

    try {
      await api.delete(`/medical-documents/${documentId}`);
      setDocuments(documents.filter((d) => d.documentId !== documentId));
      setSuccessMsg('Document deleted successfully.');
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError('Failed to delete medical document.');
    }
  };

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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-[#1F4D3A] p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-800/60 px-3 py-1 text-xs font-semibold text-emerald-200">
              <Paperclip size={14} />
              <span>Health Records & Diagnostics</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl text-white">
              Medical Documents
            </h1>
            <p className="mt-1 max-w-xl text-sm text-emerald-100/80">
              Upload blood reports, X-rays, MRI scans, and prescriptions before consultation so your therapist can review them.
            </p>
          </div>
          <button
            onClick={fetchDocuments}
            className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md hover:bg-white/20 transition cursor-pointer self-start md:self-center"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Upload Form Card */}
      <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-[#193322] mb-1">
          Upload Medical Document
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Supported file formats: PDF, JPG, PNG, JPEG (Maximum file size: 10MB).
        </p>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Document Type Dropdown */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-semibold focus:border-[#1F4D3A] focus:bg-white focus:outline-none"
            >
              <option value="Blood Report">Blood Report</option>
              <option value="X-Ray">X-Ray</option>
              <option value="MRI Scan">MRI Scan</option>
              <option value="Prescription">Prescription</option>
              <option value="Lab Report">Lab Report</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* File Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Choose File [PDF / Image]
            </label>
            <input
              id="document-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E4EFE0] file:text-[#1F4D3A] hover:file:bg-emerald-200 cursor-pointer"
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#1F4D3A] p-3 text-xs font-bold text-white shadow-md hover:bg-[#183d2e] transition disabled:opacity-50 cursor-pointer"
            >
              <Upload size={16} />
              <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Documents List */}
      <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-bold text-[#193322] mb-4">
          Uploaded Medical Documents
        </h3>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <RefreshCw size={24} className="animate-spin text-emerald-700" />
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
            No medical documents uploaded yet. Upload your reports to share them with your therapist.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-[#edf5e7] text-xs uppercase tracking-wider text-[#163322]">
                <tr>
                  <th className="px-6 py-3 font-bold">Document</th>
                  <th className="px-6 py-3 font-bold">Document Type</th>
                  <th className="px-6 py-3 font-bold">Upload Date</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.documentId} className="hover:bg-emerald-50/40 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-emerald-700" />
                        <span>{doc.documentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {doc.documentType}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      {doc.uploadedDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        <CheckCircle size={12} />
                        <span>Uploaded</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(doc)}
                          title="View PDF/Image"
                          className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          title="Download Document"
                          className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 transition cursor-pointer"
                        >
                          <Download size={14} />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() => handleDelete(doc.documentId)}
                          title="Delete Document"
                          className="rounded-xl p-1.5 text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 size={16} />
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
    </div>
  );
}
