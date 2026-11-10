import React, { useState, useEffect } from 'react';
import { CashierUser, StoreSettings, ThemePalette } from '../types.ts';
import { btPrinter } from '../utils/bluetoothPrinter.ts';
import { sound } from '../utils/audio.ts';
import { exportDailyReportExcel, exportInventoryExcel } from '../utils/excelExport.ts';
import { exportDailyReportPDF, exportInventoryPDF } from '../utils/pdfExport.ts';
import { StorageService } from '../utils/storage.ts';
import { 
  THEME_CONFIGS, 
  applyThemeToDOM, 
  getThemeClasses 
} from '../utils/theme.ts';
import { 
  Store, 
  Printer, 
  Palette, 
  KeyRound, 
  Bell, 
  Smartphone, 
  Save, 
  Check, 
  Volume2,
  VolumeX,
  Plus,
  Sparkles,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Download,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  Shield,
  Cloud,
  Database
} from 'lucide-react';

interface SettingsViewProps {
  settings: StoreSettings;
  cashiers: CashierUser[];
  onSaveSettings: (settings: StoreSettings) => void;
  onSaveCashiers: (cashiers: CashierUser[]) => void;
  onNotify: (title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  cashiers,
  onSaveSettings,
  onSaveCashiers,
  onNotify,
}) => {
  const [localSettings, setLocalSettings] = useState<StoreSettings>({ ...settings });
  const [localCashiers, setLocalCashiers] = useState<CashierUser[]>([...cashiers]);
  const [btStatus, setBtStatus] = useState<string>('');
  const [isConnectingBt, setIsConnectingBt] = useState<boolean>(false);
  
  // New Cashier Form State
  const [newCashierName, setNewCashierName] = useState<string>('');
  const [newCashierPin, setNewCashierPin] = useState<string>('');
  const [newCashierRole, setNewCashierRole] = useState<'owner' | 'kasir'>('kasir');
  const [showNewPin, setShowNewPin] = useState<boolean>(false);
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  // Edit Cashier Modal State
  const [editingCashier, setEditingCashier] = useState<CashierUser | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPin, setEditPin] = useState<string>('');
  const [editRole, setEditRole] = useState<'owner' | 'kasir'>('kasir');
  const [editColor, setEditColor] = useState<string>('bg-indigo-600');
  const [showEditPin, setShowEditPin] = useState<boolean>(false);

  // In-App Confirm Delete Cashier Modal State (replaces blocked window.confirm)
  const [cashierToDelete, setCashierToDelete] = useState<CashierUser | null>(null);

  // Keep localSettings & localCashiers in sync if parent props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    setLocalCashiers(cashiers);
  }, [cashiers]);

  const themeList = Object.values(THEME_CONFIGS);
  const currentTheme = getThemeClasses(localSettings.theme);

  const handleSelectTheme = (paletteId: ThemePalette) => {
    sound.playTap();
    const updatedSettings: StoreSettings = { ...localSettings, theme: paletteId };
    setLocalSettings(updatedSettings);
    // Apply DOM variables immediately
    applyThemeToDOM(paletteId, updatedSettings.isDarkMode);
    // Persist immediately to Storage & App State
    onSaveSettings(updatedSettings);
    onNotify(
      'Tema Berhasil Diganti!',
      `Aksen aplikasi langsung berganti ke warna "${THEME_CONFIGS[paletteId].name}".`,
      'success'
    );
  };

  const handleSaveAll = () => {
    sound.playSuccess();
    applyThemeToDOM(localSettings.theme, localSettings.isDarkMode);
    onSaveSettings(localSettings);
    onSaveCashiers(localCashiers);
    onNotify('Pengaturan Tersimpan', 'Semua konfigurasi toko & tema berhasil diperbarui.', 'success');
  };

  const handleConnectBt = async () => {
    sound.playTap();
    setIsConnectingBt(true);
    setBtStatus('Mencari perangkat Bluetooth Thermal...');
    const res = await btPrinter.connect();
    setBtStatus(res.message);
    setIsConnectingBt(false);
    if (res.success) {
      sound.playSuccess();
      onNotify('Printer Terhubung', res.message, 'success');
    }
  };

  const handleRequestPushPermission = async () => {
    sound.playTap();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        sound.playSuccess();
        new Notification('Notifikasi SnackPOS Pro Aktif', {
          body: 'Anda akan menerima pengingat stok menipis dan konfirmasi transaksi otomatis.',
          icon: '/icon.svg',
        });
        onNotify('Izin Diberikan', 'Notifikasi push browser berhasil diaktifkan.', 'success');
      } else {
        onNotify('Izin Ditolak', 'Izin notifikasi browser belum diberikan.', 'warning');
      }
    }
  };

  const handleExportSalesExcel = () => {
    sound.playTap();
    const transactions = StorageService.getTransactions();
    exportDailyReportExcel(transactions, 'Semua_Data', localSettings);
    onNotify('Ekspor Excel Berhasil', `${transactions.length} transaksi penjualan berhasil diunduh dalam file Excel (.CSV).`, 'success');
  };

  const handleExportSalesPDF = () => {
    sound.playTap();
    const transactions = StorageService.getTransactions();
    exportDailyReportPDF(transactions, 'Semua Data Penjualan', localSettings);
    onNotify('Ekspor PDF Berhasil', 'Dokumen laporan penjualan PDF siap dicetak/disimpan.', 'success');
  };

  const handleExportInventoryExcel = () => {
    sound.playTap();
    const products = StorageService.getProducts();
    exportInventoryExcel(products, localSettings);
    onNotify('Ekspor Stok Excel Berhasil', `${products.length} item produk berhasil diekspor ke format Excel (.CSV).`, 'success');
  };

  const handleExportInventoryPDF = () => {
    sound.playTap();
    const products = StorageService.getProducts();
    exportInventoryPDF(products, localSettings);
    onNotify('Ekspor Stok PDF Berhasil', 'Dokumen stok dan nilai aset inventory siap dicetak/disimpan.', 'success');
  };

  // Toggle Visibility for individual cashier PIN in cards
  const handleTogglePinVisibility = (id: string) => {
    sound.playTap();
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Open Edit Cashier Modal
  const handleOpenEditCashier = (cashier: CashierUser) => {
    sound.playTap();
    setEditingCashier(cashier);
    setEditName(cashier.name);
    setEditPin(cashier.pin);
    setEditRole(cashier.role);
    setEditColor(cashier.avatarColor || 'bg-indigo-600');
    setShowEditPin(false);
  };

  // Save Edited Cashier
  const handleSaveEditCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCashier || !editName.trim() || !editPin.trim()) return;

    sound.playSuccess();
    const updated = localCashiers.map((c) =>
      c.id === editingCashier.id
        ? {
            ...c,
            name: editName.trim(),
            pin: editPin.trim(),
            role: editRole,
            avatarColor: editColor,
          }
        : c
    );

    setLocalCashiers(updated);
    onSaveCashiers(updated);
    setEditingCashier(null);
    onNotify(
      'Akun Kasir Diperbarui',
      `Data akun "${editName.trim()}" (${editRole.toUpperCase()}) berhasil disimpan.`,
      'success'
    );
  };

  // Request Delete Cashier: Opens In-App Modal Dialog
  const handleRequestDeleteCashier = (cashier: CashierUser) => {
    sound.playTap();
    if (localCashiers.length <= 1) {
      sound.playWarning();
      onNotify(
        'Tidak Dapat Dihapus',
        'Minimal harus ada 1 akun kasir/owner agar sistem kasir tetap bisa diakses.',
        'warning'
      );
      return;
    }
    setCashierToDelete(cashier);
  };

  // Confirm and Execute Cashier Deletion
  const handleConfirmDeleteCashier = () => {
    if (!cashierToDelete) return;
    sound.playWarning();
    const updated = localCashiers.filter((c) => c.id !== cashierToDelete.id);
    setLocalCashiers(updated);
    onSaveCashiers(updated);
    onNotify(
      'Kasir Dihapus',
      `Akun kasir "${cashierToDelete.name}" telah berhasil dihapus.`,
      'info'
    );
    setCashierToDelete(null);
  };

  // Add New Cashier
  const handleAddCashier = () => {
    if (!newCashierName.trim() || !newCashierPin.trim()) {
      sound.playWarning();
      onNotify('Form Belum Lengkap', 'Mohon isi nama petugas dan 4 digit PIN.', 'warning');
      return;
    }

    sound.playSuccess();
    const colorPalette = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-purple-600',
      'bg-rose-600',
      'bg-amber-600',
    ];
    const avatarColor = colorPalette[localCashiers.length % colorPalette.length];

    const newUser: CashierUser = {
      id: `usr-${Date.now()}`,
      name: newCashierName.trim(),
      role: newCashierRole,
      pin: newCashierPin.trim(),
      avatarColor,
    };

    const updated = [...localCashiers, newUser];
    setLocalCashiers(updated);
    onSaveCashiers(updated);
    setNewCashierName('');
    setNewCashierPin('');
    setNewCashierRole('kasir');
    setShowNewPin(false);
    onNotify('Kasir Ditambahkan', `Petugas kasir "${newUser.name}" (${newUser.role.toUpperCase()}) berhasil dibuat.`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pengaturan Aplikasi & Personalisasi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kustomisasi tema warna, info struk kasir, Bluetooth printer, dan PIN keamanan
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-theme-gradient text-white text-xs font-bold shadow-md shadow-theme active:scale-95 transition"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Store Profile */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-theme-primary font-bold text-sm">
            <Store className="w-4 h-4" />
            <span>Profil Toko & Struk</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Nama Toko / Kedai
              </label>
              <input
                type="text"
                value={localSettings.storeName}
                onChange={(e) => setLocalSettings({ ...localSettings, storeName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Slogan / Deskripsi
              </label>
              <input
                type="text"
                value={localSettings.slogan}
                onChange={(e) => setLocalSettings({ ...localSettings, slogan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Alamat Toko
              </label>
              <input
                type="text"
                value={localSettings.address}
                onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Nomor WhatsApp Toko
              </label>
              <input
                type="text"
                value={localSettings.phone}
                onChange={(e) => setLocalSettings({ ...localSettings, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Pesan Kaki Struk (Receipt Footer)
              </label>
              <textarea
                rows={2}
                value={localSettings.receiptFooter}
                onChange={(e) => setLocalSettings({ ...localSettings, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Theme Customization (Instant Live Switch!) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-theme-primary font-bold text-sm">
              <Palette className="w-4 h-4" />
              <span>Kustomisasi Tema & Tampilan</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              Live Preview
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                PILIHAN PALET WARNA AKSEN
              </label>
              <span className="text-[11px] font-bold text-theme-primary">
                Aktif: {currentTheme.name}
              </span>
            </div>

            {/* Live Accent Bar Demonstration */}
            <div 
              className="p-3 rounded-xl border flex items-center justify-between text-xs transition-all duration-200"
              style={{ 
                backgroundColor: currentTheme.hexSoftBg, 
                borderColor: currentTheme.hexPrimary 
              }}
            >
              <div className="flex items-center gap-2.5">
                <span 
                  className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
                  style={{ backgroundColor: currentTheme.hexPrimary }}
                />
                <div>
                  <span className="font-extrabold text-xs block leading-tight" style={{ color: currentTheme.hexPrimary }}>
                    Aksen Aktif: {currentTheme.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Semua tombol & indikator POS langsung berganti
                  </span>
                </div>
              </div>
              <span 
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white shadow-sm shrink-0"
                style={{ backgroundColor: currentTheme.hexPrimary }}
              >
                Aktif
              </span>
            </div>

            {/* Interactive Theme Palette Cards */}
            <div className="space-y-2">
              {themeList.map((t) => {
                const isSelected = localSettings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTheme(t.id)}
                    style={{
                      borderColor: isSelected ? t.hexPrimary : undefined,
                      backgroundColor: isSelected ? t.hexSoftBg : undefined,
                      boxShadow: isSelected
                        ? `0 0 0 2px ${t.hexPrimary}40, 0 4px 12px ${t.hexPrimary}15`
                        : undefined,
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 font-semibold'
                        : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-8 h-8 rounded-xl shadow-sm shrink-0 flex items-center justify-center text-white font-bold transition-transform"
                        style={{ backgroundColor: t.previewColor }}
                      >
                        {isSelected ? (
                          <Sparkles className="w-4 h-4 text-white drop-shadow" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-white/70" />
                        )}
                      </div>
                      <div>
                        <div
                          className="text-xs font-bold leading-tight"
                          style={{ color: isSelected ? t.hexPrimary : undefined }}
                        >
                          {t.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t.desc}
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: t.previewColor }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sound Toggle */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                {localSettings.enableSound ? (
                  <Volume2 className="w-4 h-4 text-theme-primary" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span>Efek Suara Tombol & Kaching</span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.enableSound}
                style={{ accentColor: currentTheme.hexPrimary }}
                onChange={(e) => {
                  sound.setEnabled(e.target.checked);
                  const updated = { ...localSettings, enableSound: e.target.checked };
                  setLocalSettings(updated);
                  onSaveSettings(updated);
                }}
                className="w-4 h-4 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Bluetooth Printer & Hardware */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-theme-primary font-bold text-sm">
            <Printer className="w-4 h-4" />
            <span>Printer Thermal Struk (Bluetooth)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Ukuran Kertas Thermal:</span>
              <div className="flex gap-1.5">
                {(['58mm', '80mm'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      const updated = { ...localSettings, paperSize: size };
                      setLocalSettings(updated);
                      onSaveSettings(updated);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      localSettings.paperSize === size
                        ? 'bg-theme-primary text-white border-transparent shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleConnectBt}
                disabled={isConnectingBt}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isConnectingBt ? 'Mencari Bluetooth...' : 'Hubungkan Printer Bluetooth'}</span>
              </button>
              {btStatus && (
                <p className="text-[11px] text-center text-theme-primary mt-2 font-medium">
                  {btStatus}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Push Notifications & Reminders */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-theme-primary font-bold text-sm">
            <Bell className="w-4 h-4" />
            <span>Notifikasi Push & Pengingat Otomatis</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Dapatkan alert langsung ketika stok menipis, penjualan selesai, atau reminder tutup kasir.
          </p>

          <button
            type="button"
            onClick={handleRequestPushPermission}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-theme-primary text-white font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition"
          >
            <Bell className="w-4 h-4" />
            <span>Aktifkan Notifikasi Push Browser</span>
          </button>
        </div>

        {/* Section 5: PIN & Cashier Security */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-theme-primary font-bold text-sm">
                <KeyRound className="w-4 h-4" />
                <span>Kelola Akun Kasir & PIN Akses</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Ubah profil, peran, PIN masuk, atau hapus petugas kasir yang sudah tidak bertugas
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl w-fit">
              {localCashiers.length} Kasir Terdaftar
            </span>
          </div>

          {/* Cashier Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {localCashiers.map((cashier, idx) => {
              const isPinVisible = !!visiblePins[cashier.id];
              const isOwner = cashier.role === 'owner';

              return (
                <div
                  key={cashier.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-3 text-xs flex flex-col justify-between hover:border-theme/40 transition"
                >
                  <div>
                    {/* Header: Avatar, Name, Role, & Action Buttons */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0 ${
                            cashier.avatarColor || 'bg-indigo-600'
                          }`}
                        >
                          {cashier.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate text-xs leading-tight">
                            {cashier.name}
                          </h4>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                              isOwner
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {cashier.role}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons: Ubah & Hapus */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCashier(cashier)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-theme-primary hover:bg-white dark:hover:bg-slate-700 shadow-xs transition"
                          title="Ubah Nama, Peran & PIN Kasir"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDeleteCashier(cashier)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Hapus Akun Kasir Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* PIN Input & Visibility Toggle */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>PIN Akses Masuk:</span>
                        <span className="text-[9px] text-slate-400">
                          {isPinVisible ? 'Terlihat' : 'Tersamar'}
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type={isPinVisible ? 'text' : 'password'}
                          maxLength={6}
                          value={cashier.pin}
                          onChange={(e) => {
                            const updated = [...localCashiers];
                            updated[idx].pin = e.target.value;
                            setLocalCashiers(updated);
                            onSaveCashiers(updated);
                          }}
                          className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold tracking-widest text-center focus:outline-none focus:border-theme shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleTogglePinVisibility(cashier.id)}
                          className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title={isPinVisible ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                        >
                          {isPinVisible ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>ID: {cashier.id.slice(0, 10)}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCashier(cashier)}
                      className="text-theme-primary hover:underline font-semibold"
                    >
                      Edit Profil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Cashier Form */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Plus className="w-4 h-4 text-theme-primary" />
              <span>Daftarkan Akun Kasir Baru</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-5">
                <label className="text-[11px] text-slate-500 block mb-1">Nama Petugas Kasir:</label>
                <input
                  type="text"
                  value={newCashierName}
                  onChange={(e) => setNewCashierName(e.target.value)}
                  placeholder="Contoh: Rian Pratama"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-theme"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] text-slate-500 block mb-1">Peran / Role:</label>
                <select
                  value={newCashierRole}
                  onChange={(e) => setNewCashierRole(e.target.value as 'owner' | 'kasir')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-theme"
                >
                  <option value="kasir">Kasir</option>
                  <option value="owner">Owner (Pemilik)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-500 block mb-1">PIN (4 Digit):</label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    maxLength={4}
                    value={newCashierPin}
                    onChange={(e) => setNewCashierPin(e.target.value)}
                    placeholder="1234"
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-center tracking-widest focus:outline-none focus:border-theme"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleAddCashier}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Ekspor & Unduh Data Penjualan (Excel & PDF) */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-theme-primary font-bold text-sm">
              <Download className="w-4 h-4" />
              <span>Ekspor & Unduh Data Penjualan (Excel & PDF)</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full w-fit">
              100% Mandiri Offline / Lokal
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Aplikasi bekerja secara mandiri dan menyimpan data transaksi di perangkat Anda tanpa perlu terhubung ke spreadsheet eksternal. Anda dapat mengunduh seluruh rekap transaksi, omzet, dan laporan stok ke format Excel (.csv) atau PDF kapan saja untuk pembukuan akurat.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Sales Export Box */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Data Transaksi & Penjualan
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {StorageService.getTransactions().length} Struk Tersimpan
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Rekap lengkap tanggal, nomor invoice, kasir, pelanggan, detail item belanja, laba modal, dan metode bayar.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportSalesExcel}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Ekspor Excel (.csv)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportSalesPDF}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ekspor PDF</span>
                </button>
              </div>
            </div>

            {/* Inventory Export Box */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Data Stok & Nilai Modal Barang
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {StorageService.getProducts().length} Varian Menu
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Daftar semua menu jajanan, stok fisik tersisa, harga modal HPP, harga jual, dan estimasi potensi omzet.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportInventoryExcel}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Ekspor Stok Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportInventoryPDF}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ekspor Stok PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Edit Cashier */}
      {editingCashier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-theme-gradient text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                <h3 className="font-bold text-sm">Ubah Data Akun Kasir</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCashier(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditCashier} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nama Petugas Kasir *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-theme font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Peran / Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'owner' | 'kasir')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-theme"
                  >
                    <option value="kasir">Kasir</option>
                    <option value="owner">Owner (Pemilik)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    PIN Masuk (4-6 Digit) *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showEditPin ? 'text' : 'password'}
                      required
                      maxLength={6}
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value)}
                      placeholder="1234"
                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center focus:outline-none focus:border-theme"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPin(!showEditPin)}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showEditPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                  Warna Avatar Profil:
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Amber', cls: 'bg-amber-600' },
                    { label: 'Blue', cls: 'bg-blue-600' },
                    { label: 'Emerald', cls: 'bg-emerald-600' },
                    { label: 'Purple', cls: 'bg-purple-600' },
                    { label: 'Rose', cls: 'bg-rose-600' },
                    { label: 'Indigo', cls: 'bg-indigo-600' },
                  ].map((color) => {
                    const isPicked = editColor === color.cls;
                    return (
                      <button
                        key={color.cls}
                        type="button"
                        onClick={() => setEditColor(color.cls)}
                        className={`w-7 h-7 rounded-xl ${color.cls} flex items-center justify-center text-white transition ${
                          isPicked ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={color.label}
                      >
                        {isPicked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = editingCashier;
                    setEditingCashier(null);
                    handleRequestDeleteCashier(toDelete);
                  }}
                  className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Akun</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCashier(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-theme-primary bg-theme-primary-hover text-white font-bold shadow-md shadow-theme"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus Kasir (Tanpa window.confirm yang terblokir) */}
      {cashierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 my-auto animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Akun Kasir?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <strong className="text-slate-900 dark:text-white">{cashierToDelete.name}</strong> ({cashierToDelete.role.toUpperCase()})? Tindakan ini permanen dan kasir ini tidak dapat lagi masuk ke sistem POS.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCashierToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCashier}
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
