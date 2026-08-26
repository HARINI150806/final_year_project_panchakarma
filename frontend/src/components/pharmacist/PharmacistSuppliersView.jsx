import { useState, useEffect } from 'react';
import { Truck, Phone, Mail, MapPin, Plus, Package, ExternalLink, X } from 'lucide-react';
import api from '../../api';

export default function PharmacistSuppliersView() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    supplierName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('Error fetching suppliers', err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/suppliers', newSupplier);
      setSuppliers([...suppliers, res.data]);
      setAddModalOpen(false);
      setNewSupplier({ supplierName: '', contactPerson: '', phone: '', email: '', address: '' });
    } catch (err) {
      alert('Error creating supplier record.');
    }
  };

  return (
    <div className="space-y-6 motion-fade-in-up">
      {/* Header Bar */}
      <div className="panel-frost rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-forest flex items-center gap-2">
            <Truck size={22} className="text-[#355c39]" /> Ayurvedic Suppliers &amp; Vendors
          </h2>
          <p className="font-body text-xs text-forest/65 font-medium mt-0.5">
            Registered Ayurvedic pharmaceutical vendors, contacts, and purchase order tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition duration-200 hover:-translate-y-0.5 cursor-pointer shrink-0"
        >
          <Plus size={14} /> + Register New Supplier
        </button>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400 font-medium">Loading registered suppliers...</div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-12 text-center text-gray-400 space-y-2">
          <Truck size={36} className="mx-auto text-gray-300" />
          <h3 className="font-bold text-gray-700 text-base">No Suppliers Registered</h3>
          <p className="text-xs text-gray-400">Click "Add New Supplier" to register Ayurvedic medicine vendors.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="rounded-3xl border border-emerald-900/10 bg-white/90 backdrop-blur-md p-5 shadow-xs hover:shadow-md transition space-y-3.5"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-emerald-900/50 uppercase tracking-wider">
                    Supplier ID #{s.id}
                  </span>
                  <h3 className="font-extrabold text-base text-[#162e21]">{s.supplierName}</h3>
                  <p className="text-xs text-gray-500 font-medium">Contact: <span className="font-bold text-gray-800">{s.contactPerson || 'Sales Desk'}</span></p>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#E4EFE0] text-[#1F4D3A]">
                  <Truck size={18} />
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-gray-100 py-3 text-xs text-gray-600 font-medium">
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-[#1F4D3A]" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-[#1F4D3A]" />
                    <span>{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#1F4D3A] shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-semibold pt-1">
                <span className="text-gray-500">Orders Logged: <strong className="text-gray-800">{s.totalOrders || 0}</strong></span>
                {s.pendingOrders > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                    {s.pendingOrders} Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-emerald-900/15">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck size={20} className="text-[#1F4D3A]" />
                <h3 className="font-extrabold text-base text-[#162e21]">Register New Supplier</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dabur Ayurvedic Ltd."
                  value={newSupplier.supplierName}
                  onChange={(e) => setNewSupplier({ ...newSupplier, supplierName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1F4D3A] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Contact Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Patel"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1F4D3A] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="9821098210"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1F4D3A] font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="orders@supplier.com"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1F4D3A] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Office / Warehouse Address</label>
                <textarea
                  rows={2}
                  placeholder="Enter full address..."
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1F4D3A] font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1F4D3A] text-white text-xs font-bold hover:bg-[#163a2c] shadow-xs transition cursor-pointer active:scale-95"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
