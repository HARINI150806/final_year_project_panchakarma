import React, { useState } from 'react';
import { CreditCard, Smartphone, Building2, Wallet, ShieldCheck, Lock, CheckCircle2, AlertCircle, X, QrCode, ArrowRight, Zap, RefreshCw } from 'lucide-react';

export default function PaymentCheckoutModal({ isOpen, onClose, orderData, onPaymentSubmit, isProcessing }) {
  const [activeTab, setActiveTab] = useState('UPI'); // 'UPI', 'CARD', 'NETBANKING', 'WALLET'
  
  // UPI Form State
  const [upiApp, setUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('');
  
  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  
  // Net Banking State
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Wallet State
  const [selectedWallet, setSelectedWallet] = useState('MOBIKWIK');

  const [formError, setFormError] = useState('');
  const [simulatedProcessing, setSimulatedProcessing] = useState(false);

  if (!isOpen) return null;

  function formatCardNumber(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  }

  function formatExpiry(value) {
    const clear = value.replace(/[^0-9]/g, '');
    if (clear.length >= 2) {
      return clear.substring(0, 2) + '/' + clear.substring(2, 4);
    }
    return clear;
  }

  function getCardType(number) {
    const clean = number.replace(/\s/g, '');
    if (/^4/.test(clean)) return { name: 'VISA', bg: 'bg-blue-600', text: 'text-white' };
    if (/^5[1-5]/.test(clean)) return { name: 'MASTERCARD', bg: 'bg-red-600', text: 'text-white' };
    if (/^6[0-9]/.test(clean) || /^35[0-9]/.test(clean)) return { name: 'RUPAY', bg: 'bg-emerald-700', text: 'text-white' };
    return null;
  }

  function handlePayClick(e) {
    e.preventDefault();
    setFormError('');

    let methodDetails = {};

    if (activeTab === 'UPI') {
      if (!upiId && !upiApp) {
        setFormError('Please enter a valid UPI ID (e.g. 9876543210@paytm) or select a UPI app.');
        return;
      }
      methodDetails = {
        paymentMethod: 'UPI',
        upiApp,
        upiId: upiId || `${upiApp}_user@upi`,
        razorpay_payment_id: `pay_rzp_${Date.now()}`
      };
    } else if (activeTab === 'CARD') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        setFormError('Please enter a valid 16-digit Credit or Debit Card number.');
        return;
      }
      if (cardExpiry.length < 5) {
        setFormError('Please enter a valid card expiry date (MM/YY).');
        return;
      }
      if (cardCvv.length < 3) {
        setFormError('Please enter a 3-digit CVV / CVC security code.');
        return;
      }
      methodDetails = {
        paymentMethod: 'CARD',
        cardLast4: cleanNum.slice(-4),
        cardName: cardName || 'Valued Cardholder',
        razorpay_payment_id: `pay_rzp_card_${Date.now()}`
      };
    } else if (activeTab === 'NETBANKING') {
      methodDetails = {
        paymentMethod: 'NETBANKING',
        bankName: selectedBank,
        razorpay_payment_id: `pay_rzp_nb_${Date.now()}`
      };
    } else if (activeTab === 'WALLET') {
      methodDetails = {
        paymentMethod: 'WALLET',
        walletName: selectedWallet,
        razorpay_payment_id: `pay_rzp_wallet_${Date.now()}`
      };
    }

    setSimulatedProcessing(true);
    setTimeout(() => {
      setSimulatedProcessing(false);
      onPaymentSubmit(methodDetails);
    }, 1500);
  }

  const cardBrand = getCardType(cardNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        
        {/* Razorpay Authentic Header */}
        <div className="bg-[#0c2340] px-6 py-5 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-400/30 text-blue-400">
              <Zap size={24} className="fill-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">Razorpay</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  Secured Checkout
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">Panchakarma Care Center</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing || simulatedProcessing}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount & Order Details Banner */}
        <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Order Amount</span>
            <p className="text-xs font-semibold text-slate-800">Clinical Consultation Fee</p>
          </div>
          <div className="text-right">
            <span className="font-extrabold text-2xl text-[#0c2340]">₹500.00</span>
            <span className="block text-[10px] font-bold text-blue-600">Razorpay Test Gateway</span>
          </div>
        </div>

        {/* Form Error Notice */}
        {formError && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Razorpay Navigation Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {[
              { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
              { id: 'CARD', label: 'Card', icon: CreditCard },
              { id: 'NETBANKING', label: 'NetBanking', icon: Building2 },
              { id: 'WALLET', label: 'Wallets', icon: Wallet },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveTab(tab.id); setFormError(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#0c2340] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <IconComponent size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: UPI / QR CODE */}
          {activeTab === 'UPI' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200 shrink-0">
                  <QrCode size={38} className="text-[#0c2340]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900">Scan & Pay via Razorpay QR</p>
                    <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Instant</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">Use GPay, PhonePe, Paytm, or BHIM scanner on your phone to complete ₹500 payment.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Or Select Instant UPI App</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'gpay', label: 'Google Pay', icon: '🌐' },
                    { id: 'phonepe', label: 'PhonePe', icon: '🟣' },
                    { id: 'paytm', label: 'Paytm', icon: '🔷' },
                    { id: 'bhim', label: 'BHIM UPI', icon: '🇮🇳' },
                  ].map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => { setUpiApp(app.id); setUpiId(`${app.id}_patient@upi`); }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition cursor-pointer ${
                        upiApp === app.id
                          ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-950'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-lg">{app.icon}</span>
                      <span className="text-[10px] mt-1 font-bold">{app.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Enter VPA / UPI ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. 9876543210@paytm or user@okaxis"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    VERIFIED
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREDIT / DEBIT CARD */}
          {activeTab === 'CARD' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Card Number</label>
                  {cardBrand && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${cardBrand.bg} ${cardBrand.text}`}>
                      {cardBrand.name}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4532 •••• •••• 1198"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono tracking-wider focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <div className="absolute right-3 top-2.5 flex items-center gap-1">
                    <span className="text-[9px] font-bold text-blue-900 bg-blue-100 px-1 py-0.5 rounded">VISA</span>
                    <span className="text-[9px] font-bold text-rose-900 bg-rose-100 px-1 py-0.5 rounded">MC</span>
                    <span className="text-[9px] font-bold text-emerald-900 bg-emerald-100 px-1 py-0.5 rounded">RuPay</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="08/28"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono text-center focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="•••"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono text-center focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Name on card"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Save card securely as per RBI guidelines</span>
              </label>
            </div>
          )}

          {/* TAB 3: NET BANKING */}
          {activeTab === 'NETBANKING' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-slate-700 block">Select Popular Indian Bank</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'HDFC', label: 'HDFC Bank', code: '🏦 HDFC' },
                  { id: 'SBI', label: 'State Bank of India', code: '🏛️ SBI' },
                  { id: 'ICICI', label: 'ICICI Bank', code: '💳 ICICI' },
                  { id: 'AXIS', label: 'Axis Bank', code: '🅰️ AXIS' },
                  { id: 'KOTAK', label: 'Kotak Mahindra', code: '🔴 KOTAK' },
                  { id: 'PNB', label: 'Punjab National', code: '🇮🇳 PNB' },
                ].map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => setSelectedBank(bank.id)}
                    className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex items-center gap-2.5 ${
                      selectedBank === bank.id
                        ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base">{bank.code.split(' ')[0]}</span>
                    <div>
                      <p className="text-xs font-bold">{bank.label}</p>
                      <p className="text-[10px] text-slate-500">Internet Banking</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: WALLETS */}
          {activeTab === 'WALLET' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-slate-700 block">Select Digital Wallet</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'MOBIKWIK', label: 'MobiKwik', code: '👛 MobiKwik' },
                  { id: 'FREECHARGE', label: 'Freecharge', code: '⚡ Freecharge' },
                  { id: 'AIRTEL', label: 'Airtel Money', code: '🔴 Airtel Money' },
                  { id: 'LAZYPAY', label: 'LazyPay', code: '📦 LazyPay' },
                ].map((wallet) => (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => setSelectedWallet(wallet.id)}
                    className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex items-center gap-2.5 ${
                      selectedWallet === wallet.id
                        ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base">{wallet.code.split(' ')[0]}</span>
                    <div>
                      <p className="text-xs font-bold">{wallet.label}</p>
                      <p className="text-[10px] text-slate-500">Wallet Payment</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Razorpay Action Button */}
          <button
            type="button"
            onClick={handlePayClick}
            disabled={isProcessing || simulatedProcessing}
            className="w-full rounded-xl bg-[#0c2340] hover:bg-[#15345c] py-3.5 px-4 font-bold text-white text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isProcessing || simulatedProcessing ? (
              <>
                <RefreshCw size={16} className="animate-spin text-blue-400" />
                <span>Authorizing ₹500.00 with Razorpay...</span>
              </>
            ) : (
              <>
                <Lock size={16} className="text-blue-400" />
                <span>Pay ₹500.00 via Razorpay</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <CheckCircle2 size={12} className="text-blue-600" />
              Secured by Razorpay • 256-Bit SSL
            </span>
            <span className="font-mono">PCI-DSS Level 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
