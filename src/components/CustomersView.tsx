import React, { useState } from 'react';
import { Customer, StoreSettings } from '../types.ts';
import { formatCurrency } from '../utils/bluetoothPrinter.ts';
import { sound } from '../utils/audio.ts';
import { 
  Users, 
  Plus, 
  Search, 
  MessageSquare, 
  Award, 
  ShoppingBag, 
  Phone, 
  Edit, 
  Trash2, 
  X, 
  Sparkles 
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  settings: StoreSettings;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onNotify: (title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert') => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  settings,
  onSaveCustomer,
  onDeleteCustomer,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    points: 0,
    note: '',
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.note && c.note.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    sound.playTap();
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', points: 50, note: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    sound.playTap();
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      points: c.points,
      note: c.note || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    sound.playSuccess();
    const customerToSave: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      name: formData.name,
      phone: formData.phone,
      points: formData.points,
      totalSpent: editingCustomer ? editingCustomer.totalSpent : 0,
      transactionCount: editingCustomer ? editingCustomer.transactionCount : 0,
      note: formData.note,
      joinDate: editingCustomer ? editingCustomer.joinDate : new Date().toISOString().slice(0, 10),
    };

    onSaveCustomer(customerToSave);
    setIsModalOpen(false);
    onNotify('Member Tersimpan', `Data pelanggan "${customerToSave.name}" berhasil disimpan.`, 'success');
  };

  const handleSendPromoWA = (customer: Customer) => {
    sound.playTap();
    const cleanPhone = customer.phone.replace(/^0/, '62').replace(/\D/g, '');
    const msg = `Halo ${customer.name}!%0A` +
      `Kabar gembira dari *${settings.storeName}*! 🎉%0A` +
      `Kakak saat ini memiliki *${customer.points} Poin Loyalitas*.%0A` +
      `Tukarkan poin untuk potongan harga jajanan favorit kakak hari ini ya! Ditunggu kunjungannya :)`;

    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manajemen Pelanggan & Loyalitas Poin
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar member langganan, poin reward belanja, dan kirim pesan promo WhatsApp
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theme-gradient text-white text-xs font-bold shadow-md shadow-theme active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama pelanggan atau nomor WhatsApp..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-theme shadow-sm"
        />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          // Tier determination
          const tier = cust.points > 200 ? 'Gold VIP' : cust.points > 100 ? 'Silver Member' : 'Bronze Member';
          const tierColor =
            cust.points > 200
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
              : cust.points > 100
              ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300'
              : 'bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200';

          return (
            <div
              key={cust.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {cust.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{cust.phone || '-'}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierColor}`}>
                    {tier}
                  </span>
                </div>

                {cust.note && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 mt-2 italic">
                    "{cust.note}"
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400">Total Belanja</span>
                    <div className="font-bold font-mono text-slate-900 dark:text-white">
                      {formatCurrency(cust.totalSpent)}
                    </div>
                  </div>
                  <div className="bg-theme-soft p-2 rounded-xl text-theme-primary">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Poin Hadiah</span>
                    <div className="font-extrabold font-mono text-theme-primary flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>{cust.points} Poin</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleSendPromoWA(cust)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cust)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-theme-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setCustomerToDelete(cust);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Hapus Pelanggan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in zoom-in-95">
            <div className="px-6 py-4 bg-theme-gradient text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingCustomer ? 'Ubah Data Pelanggan' : 'Daftarkan Pelanggan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kak Dinda Kirana"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-theme"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. WhatsApp / HP
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Poin Loyalitas Awal
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Preferensi Selera
                </label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Contoh: Selalu minta bumbu basreng pedas daun jeruk dipisah..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-theme-primary bg-theme-primary-hover text-white text-xs font-bold shadow-md shadow-theme"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus Pelanggan */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 my-auto animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Data Pelanggan?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Apakah Anda yakin ingin menghapus pelanggan <strong className="text-slate-900 dark:text-white">{customerToDelete.name}</strong>? Riwayat poin dan data pelanggan akan terhapus.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playWarning();
                  onDeleteCustomer(customerToDelete.id);
                  onNotify('Pelanggan Dihapus', `Data pelanggan "${customerToDelete.name}" telah dihapus.`, 'info');
                  setCustomerToDelete(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
