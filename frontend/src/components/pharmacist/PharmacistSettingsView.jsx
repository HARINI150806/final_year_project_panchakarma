import { useState } from 'react';
import { Settings, User, Bell, Building, ShieldCheck, Lock, LogOut, Check } from 'lucide-react';

export default function PharmacistSettingsView({ auth, onLogout }) {
  const [activeSection, setActiveSection] = useState('PROFILE');

  const [notificationToggles, setNotificationToggles] = useState({
    lowStockAlerts: true,
    expiryReminders: true,
    newPrescriptionAlerts: true,
    dispensingConfirmations: true,
    orderStatusUpdates: false
  });

  const [pharmacyInfo, setPharmacyInfo] = useState({
    name: auth?.pharmacyName || 'Panchakarma Central Pharmacy',
    license: auth?.licenseNo || '',
    phone: auth?.phone || '',
    email: auth?.email || '',
    address: auth?.address || ''
  });

  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const toggleNotif = (key) => {
    setNotificationToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    setPasswordSuccess('Password updated successfully!');
    setTimeout(() => {
      setPasswordSuccess('');
      setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 2000);
  };

  return (
    <div className="space-y-6 motion-fade-in-up">
      <div className="panel-frost rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl p-5 shadow-xs space-y-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-forest flex items-center gap-2">
          <Settings size={22} className="text-[#355c39]" /> Pharmacist Settings &amp; Preferences
        </h2>
        <p className="font-body text-xs text-forest/65 font-medium mt-0.5">
          Manage your pharmacist profile, pharmacy license details, low stock email alerts, and security credentials.
        </p>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 mt-5 border-b border-sand/40 pb-3 overflow-x-auto">
          {[
            { id: 'PROFILE', label: 'Pharmacist Profile', icon: User },
            { id: 'PHARMACY', label: 'Pharmacy License & Info', icon: Building },
            { id: 'NOTIFICATIONS', label: 'Alert Preferences', icon: Bell },
            { id: 'SECURITY', label: 'Security & Password', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-display text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] text-white shadow-xs'
                    : 'bg-white/80 border border-[#cfe0c2] text-forest hover:bg-white'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. PROFILE SECTION */}
      {activeSection === 'PROFILE' && (
        <div className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
            <div className="h-16 w-16 rounded-full bg-[#1F4D3A] text-amber-200 font-extrabold text-xl flex items-center justify-center border-2 border-emerald-600 shadow-xs">
              {auth?.fullName ? auth.fullName.split(' ').map(n=>n[0]).join('').slice(0,2) : 'PH'}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#162e21]">{auth?.fullName || 'Pharmacist'}</h3>
              <p className="text-xs text-[#1F4D3A] font-semibold">Pharmacist • Panchakarma Care</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E4EFE0] text-[#1F4D3A] border border-emerald-200">
                ROLE: PHARMACIST
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            <div>
              <label className="block text-gray-500 font-bold mb-1">Full Name</label>
              <input
                type="text"
                readOnly
                value={auth?.fullName || 'Pharmacist'}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-900 outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-bold mb-1">Email Address</label>
              <input
                type="email"
                readOnly
                value={auth?.email || 'N/A'}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-900 outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-bold mb-1">Assigned Branch / Center</label>
              <input
                type="text"
                readOnly
                value={auth?.branch || 'Main Care Center'}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-900 outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-bold mb-1">Role Type</label>
              <input
                type="text"
                readOnly
                value={auth?.role || 'PHARMACIST'}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-900 outline-none font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. NOTIFICATIONS SECTION */}
      {activeSection === 'NOTIFICATIONS' && (
        <div className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-[#162e21]">In-App & Email Notifications</h3>
          <p className="text-xs text-gray-500 font-medium">Configure when you receive alerts for inventory replenishment and prescription events.</p>

          <div className="divide-y divide-gray-100">
            {[
              { key: 'lowStockAlerts', title: 'Low Stock Threshold Alerts', desc: 'Receive automated notifications when medicine units drop below min threshold.' },
              { key: 'expiryReminders', title: 'Expiry Warnings (30 days prior)', desc: 'Get early warnings for batches nearing expiration.' },
              { key: 'newPrescriptionAlerts', title: 'New Doctor Prescription Dispatches', desc: 'Instant alerts when doctors prescribe formulations to active patients.' },
              { key: 'dispensingConfirmations', title: 'Dispense Confirmations', desc: 'Receive confirmation receipts when stock is deducted.' }
            ].map((item) => (
              <div key={item.key} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-xs text-[#162e21]">{item.title}</h4>
                  <p className="text-[11px] text-gray-500 font-medium">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotif(item.key)}
                  className={`w-12 h-6 rounded-full transition p-1 cursor-pointer ${
                    notificationToggles[item.key] ? 'bg-[#1F4D3A]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`h-4 w-4 rounded-full bg-white transition transform ${
                    notificationToggles[item.key] ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PHARMACY INFORMATION SECTION */}
      {activeSection === 'PHARMACY' && (
        <div className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-[#162e21]">Pharmacy Unit Profile</h3>
          <p className="text-xs text-gray-500 font-medium">Official details of the pharmacy dispensary unit.</p>

          <div className="space-y-3 text-xs font-medium">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Dispensary Unit Name</label>
              <input
                type="text"
                value={pharmacyInfo.name}
                onChange={(e) => setPharmacyInfo({ ...pharmacyInfo, name: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900 outline-none focus:border-[#1F4D3A]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Drug License Number</label>
                <input
                  type="text"
                  value={pharmacyInfo.license}
                  onChange={(e) => setPharmacyInfo({ ...pharmacyInfo, license: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900 outline-none focus:border-[#1F4D3A]"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1">Direct Helpline Phone</label>
                <input
                  type="text"
                  value={pharmacyInfo.phone}
                  onChange={(e) => setPharmacyInfo({ ...pharmacyInfo, phone: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900 outline-none focus:border-[#1F4D3A]"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Physical Address</label>
              <textarea
                rows={2}
                value={pharmacyInfo.address}
                onChange={(e) => setPharmacyInfo({ ...pharmacyInfo, address: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900 outline-none focus:border-[#1F4D3A]"
              />
            </div>

            <button
              type="button"
              onClick={() => alert('Pharmacy details updated!')}
              className="px-5 py-2.5 rounded-2xl bg-[#1F4D3A] text-white font-bold hover:bg-[#163a2c] shadow-xs transition cursor-pointer active:scale-95"
            >
              Save Pharmacy Profile
            </button>
          </div>
        </div>
      )}

      {/* 4. SECURITY & PASSWORD SECTION */}
      {activeSection === 'SECURITY' && (
        <div className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-6 shadow-xs space-y-4 max-w-xl">
          <h3 className="font-extrabold text-base text-[#162e21]">Security Credentials</h3>
          <p className="text-xs text-gray-500 font-medium">Update your account password for secure access.</p>

          {passwordSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-950 text-xs font-bold flex items-center gap-2">
              <Check size={16} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs font-medium">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Current Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordState.currentPassword}
                onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900 outline-none focus:border-[#1F4D3A]"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordState.newPassword}
                onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900 outline-none focus:border-[#1F4D3A]"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordState.confirmPassword}
                onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 p-3 text-gray-900 outline-none focus:border-[#1F4D3A]"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-[#1F4D3A] text-white font-bold hover:bg-[#163a2c] shadow-xs transition cursor-pointer active:scale-95"
            >
              Update Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
