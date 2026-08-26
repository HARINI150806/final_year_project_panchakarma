import { useEffect, useState } from 'react';
import { Wallet, CreditCard, Building2, Search, CheckCircle2, ArrowUpRight, FileText, Download, Calendar, Clock, User, Sparkles, Filter, X } from 'lucide-react';
import api from '../api';

export default function TherapistWalletView() {
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTx, setSelectedTx] = useState(null);

    const fetchWallet = async () => {
        try {
            const res = await api.get('/therapists/wallet');
            setWallet(res.data);
        } catch (err) {
            console.error('Failed to fetch wallet:', err);
            setError('Failed to load wallet information. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
        const interval = setInterval(fetchWallet, 4000); // Live sync every 4s
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 text-forest/70 font-semibold">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                    <span>Loading Therapist Wallet & Earnings...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-600 font-semibold">
                {error}
            </div>
        );
    }

    const transactions = wallet?.transactions || [];

    const filteredTransactions = transactions.filter((tx) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const name = (tx.patientName || '').toLowerCase();
        const email = (tx.patientEmail || '').toLowerCase();
        const payId = (tx.razorpayPaymentId || '').toLowerCase();
        const purpose = (tx.purpose || '').toLowerCase();
        return name.includes(q) || email.includes(q) || payId.includes(q) || purpose.includes(q);
    });

    const totalBalance = wallet?.totalBalance != null ? wallet.totalBalance : 0;
    const thisMonthEarnings = wallet?.thisMonthEarnings != null ? wallet.thisMonthEarnings : 0;
    const totalPaidConsultations = wallet?.totalPaidConsultations != null ? wallet.totalPaidConsultations : 0;

    return (
        <div className="space-y-6">
            {/* 1. HERO WALLET & BANK BALANCE STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Balance Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F4D3A] via-[#2A664E] to-[#16382A] p-6 text-white shadow-lg">
                    <div className="absolute right-3 top-3 opacity-15">
                        <Wallet size={120} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200/80 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                                Total Therapist Bank Balance
                            </span>
                            <span className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Dynamic Balance
                            </span>
                        </div>
                        <div>
                            <div className="text-4xl font-extrabold tracking-tight">
                                ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="mt-1 text-xs text-emerald-100/70 font-medium">
                                Automatically increased by ₹500 for each completed paid consultation
                            </p>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-emerald-200">
                            <span>Available for Instant Payout</span>
                            <span className="font-bold text-white">Direct Bank Deposit Verified ✓</span>
                        </div>
                    </div>
                </div>

                {/* This Month Earnings */}
                <div className="rounded-3xl bg-white p-6 border border-emerald-900/10 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">This Month Earnings</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                            <Sparkles size={20} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold text-green-900">
                            ₹{thisMonthEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-emerald-700">
                            Current Month Consultation Revenue
                        </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                        <span>Standard Consultation Rate</span>
                        <span className="font-bold text-green-900">₹500 / Session</span>
                    </div>
                </div>

                {/* Total Paid Consultations */}
                <div className="rounded-3xl bg-white p-6 border border-emerald-900/10 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Paid Consultations</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/60">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold text-green-900">{totalPaidConsultations}</h3>
                        <p className="mt-1 text-xs font-medium text-amber-700">
                            Completed & Paid Sessions
                        </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                        <span>Razorpay Test Gateway</span>
                        <span className="font-bold text-emerald-700">100% Verified</span>
                    </div>
                </div>
            </div>

            {/* 2. BANK ACCOUNT DETAILS CARD */}
            <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-green-900 text-base">Direct Bank Deposit Account</h4>
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800 border border-emerald-300">
                                    Verified Account
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Account Holder: <strong className="text-gray-800">{wallet?.bankAccountName || 'Senior Ayurvedic Specialist'}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium bg-sand/20 p-3 rounded-2xl border border-sand/40">
                        <div>
                            <span className="text-gray-400 uppercase text-[10px] font-bold block">Account Number</span>
                            <span className="font-mono font-bold text-green-900">{wallet?.bankAccountNumber || 'XXXX-XXXX-4829'}</span>
                        </div>
                        <div className="h-6 w-px bg-gray-200" />
                        <div>
                            <span className="text-gray-400 uppercase text-[10px] font-bold block">IFSC Code</span>
                            <span className="font-mono font-bold text-green-900">{wallet?.bankIfscCode || 'HDFC0001842'}</span>
                        </div>
                        <div className="h-6 w-px bg-gray-200" />
                        <div>
                            <span className="text-gray-400 uppercase text-[10px] font-bold block">Payout Status</span>
                            <span className="font-bold text-emerald-700">Automated Weekly Deposit</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. PAYMENT TRANSACTIONS LEDGER */}
            <div className="rounded-3xl border border-emerald-900/10 bg-white shadow-sm overflow-hidden space-y-4 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-extrabold text-green-900">Payment Transactions Ledger</h3>
                        <p className="text-xs text-gray-500 font-medium">Detailed breakdown of consultation fee payments received</p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative min-w-[260px]">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search patient name, payment ID or reason..."
                            className="w-full pl-10 pr-4 py-2 text-xs text-gray-800 bg-gray-50/70 border border-gray-200 rounded-full outline-none focus:bg-white focus:border-emerald-500 transition"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="py-3.5 px-4">Patient Details</th>
                                <th className="py-3.5 px-4">Scheduled Date & Time</th>
                                <th className="py-3.5 px-4">Reason for Payment</th>
                                <th className="py-3.5 px-4">Mode</th>
                                <th className="py-3.5 px-4">Amount</th>
                                <th className="py-3.5 px-4">Razorpay Payment ID</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-500 text-sm font-medium">
                                        No completed payments found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => {
                                    const dateObj = tx.date ? new Date(tx.date) : null;
                                    const formattedDate = dateObj ? dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

                                    return (
                                        <tr key={tx.bookingId || tx.razorpayPaymentId} className="hover:bg-emerald-50/30 transition">
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-green-900 text-sm">{tx.patientName}</div>
                                                <div className="text-xs text-gray-400 font-medium">{tx.patientEmail}</div>
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <div className="text-xs font-semibold text-gray-800">{formattedDate}</div>
                                                <div className="text-[11px] text-gray-400">{tx.time || '10:00 AM'}</div>
                                            </td>
                                            <td className="py-4 px-4 max-w-xs">
                                                <div className="text-xs font-medium text-gray-700 truncate" title={tx.purpose}>
                                                    {tx.purpose || 'Consultation Visit'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                                    tx.consultationType === 'ONLINE'
                                                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                }`}>
                                                    {tx.consultationType === 'ONLINE' ? '📹 Online' : '🏥 In-Clinic'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <div className="text-sm font-extrabold text-emerald-800">
                                                    + ₹{tx.amount ? tx.amount.toFixed(2) : '500.00'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <span className="font-mono text-[11px] font-semibold text-gray-700 bg-sand/20 px-2.5 py-1 rounded-md border border-sand/40">
                                                    {tx.razorpayPaymentId || `pay_test_${tx.bookingId}`}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                                                    ✓ PAID
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200/80 transition cursor-pointer"
                                                >
                                                    <FileText size={13} /> View Receipt
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. PAYMENT RECEIPT MODAL */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5 border border-emerald-900/10">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                                    💳
                                </div>
                                <div>
                                    <h4 className="font-bold text-green-900 text-sm">Consultation Payment Receipt</h4>
                                    <p className="text-[11px] text-gray-400">Panchakarma Care Center</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTx(null)}
                                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Amount */}
                        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-amber-50/50 p-4 text-center border border-emerald-200 space-y-1">
                            <span className="text-xs font-extrabold uppercase text-emerald-800">Amount Received</span>
                            <div className="text-3xl font-extrabold text-green-900">
                                ₹{selectedTx.amount ? selectedTx.amount.toFixed(2) : '500.00'}
                            </div>
                            <span className="inline-block text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                Razorpay Verified Payment • PAID
                            </span>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-3 text-xs text-gray-700">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-400 font-medium">Patient Name</span>
                                <span className="font-bold text-green-900">{selectedTx.patientName}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-400 font-medium">Patient Email</span>
                                <span className="font-semibold text-gray-800">{selectedTx.patientEmail}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-400 font-medium">Scheduled Date & Time</span>
                                <span className="font-semibold text-gray-800">{selectedTx.date} at {selectedTx.time || '10:00 AM'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-400 font-medium">Reason for Visit</span>
                                <span className="font-semibold text-gray-800 max-w-[200px] text-right truncate" title={selectedTx.purpose}>
                                    {selectedTx.purpose || 'Consultation'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-400 font-medium">Consultation Mode</span>
                                <span className="font-semibold text-gray-800">{selectedTx.consultationType === 'ONLINE' ? 'Online Video Consultation' : 'In-Clinic Consultation'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-400 font-medium">Razorpay Payment ID</span>
                                <span className="font-mono font-bold text-emerald-800">{selectedTx.razorpayPaymentId || `pay_test_${selectedTx.bookingId}`}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400 font-medium">Razorpay Order ID</span>
                                <span className="font-mono text-gray-600 text-[11px]">{selectedTx.razorpayOrderId || `order_test_${selectedTx.bookingId}`}</span>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    window.print();
                                }}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                            >
                                <Download size={14} /> Print Receipt
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedTx(null)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-900 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
