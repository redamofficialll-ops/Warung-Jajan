import React, { useState, useMemo } from 'react';
import { CashierUser, ShiftClosing, StoreSettings, Transaction } from '../types.ts';
import { formatCurrency, btPrinter } from '../utils/bluetoothPrinter.ts';
import { StorageService } from '../utils/storage.ts';
import { sound } from '../utils/audio.ts';
import { 
  Store, 
  X, 
  Clock, 
  User, 
  Banknote, 
  QrCode, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Printer, 
  MessageSquare, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Receipt,
  FileText
} from 'lucide-react';

interface ShiftClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CashierUser;
  settings: StoreSettings;
  transactions: Transaction[];
  onConfirmCloseShift: (closing: ShiftClosing) => void;
  onNotify: (title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert') => void;
}

export const ShiftClosingModal: React.FC<ShiftClosingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  transactions,
  onConfirmCloseShift,
  onNotify,
}) => {
  const [shiftStartTime] = useState<string>(() => StorageService.getCurrentShiftStart());
  const closedAtTime = useMemo(() => new Date().toISOString(), []);

  // Filter transactions for current shift
  const shiftTransactions = useMemo(() => {
    const shiftDate = new Date(shiftStartTime);
    const valid = transactions.filter((t) => {
      const tDate = new Date(t.createdAt);
      return t.status === 'lunas' && tDate >= shiftDate;
    });

    // If no transactions found strictly after shiftDate, take all valid transactions from today
    if (valid.length === 0) {
      const todayStr = new Date().toDateString();
      return transactions.filter(
        (t) => t.status === 'lunas' && new Date(t.createdAt).toDateString() === todayStr
      );
    }
    return valid;
  }, [transactions, shiftStartTime]);

  // Payment Breakdown
  const {
    cashSales,
    qrisSales,
    transferSales,
    ewalletSales,
    kasbonSales,
    totalOmzet,
    totalHpp,
  } = useMemo(() => {
    let cash = 0;
    let qris = 0;
    let transfer = 0;
    let ewallet = 0;
    let kasbon = 0;
    let omzet = 0;
    let hpp = 0;

    shiftTransactions.forEach((t) => {
      omzet += t.totalAmount;
      if (t.paymentMethod === 'tunai') cash += t.totalAmount;
      else if (t.paymentMethod === 'qris') qris += t.totalAmount;
      else if (t.paymentMethod === 'transfer') transfer += t.totalAmount;
      else if (t.paymentMethod === 'ewallet') ewallet += t.totalAmount;
      else if (t.paymentMethod === 'kasbon') kasbon += t.totalAmount;

      t.items.forEach((item) => {
        hpp += (item.hpp || item.price * 0.6) * item.quantity;
      });
    });

    return {
      cashSales: cash,
      qrisSales: qris,
      transferSales: transfer,
      ewalletSales: ewallet,
      kasbonSales: kasbon,
      totalOmzet: omzet,
      totalHpp: hpp,
    };
  }, [shiftTransactions]);

  const grossProfit = totalOmzet - totalHpp;
  const expectedCash = cashSales;

  // Actual Cash in Drawer Input State
  const [actualCashInput, setActualCashInput] = useState<number>(expectedCash);
  const [cashierNote, setCashierNote] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printStatus, setPrintStatus] = useState<string>('');

  const cashDifference = actualCashInput - expectedCash;

  if (!isOpen) return null;

  // Handle WhatsApp Share to Store Owner
  const handleShareWhatsApp = () => {
    sound.playTap();
    const diffStatus =
      cashDifference === 0
        ? 'PAS (Sesuai Rp 0)'
        : cashDifference > 0
        ? `LEBIH (+${formatCurrency(cashDifference)})`
        : `KURANG (${formatCurrency(cashDifference)})`;

    const msg =
      `*REKAP LAPORAN TUTUP KASIR - ${settings.storeName.toUpperCase()}*%0A` +
      `Waktu Tutup: ${new Date().toLocaleString('id-ID')}%0A` +
      `Kasir Bertugas: ${currentUser.name} (${currentUser.role.toUpperCase()})%0A` +
      `--------------------------------%0A` +
      `*Ringkasan Penjualan:*%0A` +
      `Total Struk Lunas: ${shiftTransactions.length} transaksi%0A` +
      `Total Omzet: *${formatCurrency(totalOmzet)}*%0A` +
      `Estimasi Laba Bersih: ${formatCurrency(grossProfit)}%0A%0A` +
      `*Rincian Pembayaran:*%0A` +
      `• Uang Tunai (Cash): ${formatCurrency(cashSales)}%0A` +
      `• QRIS Digital: ${formatCurrency(qrisSales)}%0A` +
      `• Transfer Bank: ${formatCurrency(transferSales)}%0A` +
      (ewalletSales > 0 ? `• E-Wallet: ${formatCurrency(ewalletSales)}%0A` : '') +
      (kasbonSales > 0 ? `• Kasbon: ${formatCurrency(kasbonSales)}%0A` : '') +
      `--------------------------------%0A` +
      `*Rekonsiliasi Kas Laci:*%0A` +
      `• Target Kas Masuk: ${formatCurrency(expectedCash)}%0A` +
      `• Uang Fisik di Laci: *${formatCurrency(actualCashInput)}*%0A` +
      `• Status Selisih: *${diffStatus}*%0A` +
      (cashierNote.trim() ? `• Catatan: ${encodeURIComponent(cashierNote.trim())}%0A` : '') +
      `--------------------------------%0A` +
      `Terminal kasir telah ditutup dan dikunci aman.`;

    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  // Handle Print Shift Closing Thermal Receipt
  const handlePrintReceipt = async () => {
    sound.playTap();
    setIsPrinting(true);
    setPrintStatus('Menghubungkan printer...');

    try {
      const conn = await btPrinter.connect();
      if (!conn.success) {
        setPrintStatus(conn.message);
        setIsPrinting(false);
        // Fallback to browser print dialog
        window.print();
        return;
      }

      setPrintStatus('Mencetak struk rekap tutup kasir...');
      const encoder = new TextEncoder();
      const LF = '\x0a';
      const ESC = '\x1b';
      const GS = '\x1d';

      let printText =
        `${ESC}@` + // Initialize
        `${ESC}a\x01` + // Center align
        `${settings.storeName}${LF}` +
        `LAPORAN TUTUP KASIR${LF}` +
        `--------------------------------${LF}` +
        `${ESC}a\x00` + // Left align
        `Waktu Buka  : ${new Date(shiftStartTime).toLocaleTimeString('id-ID')}${LF}` +
        `Waktu Tutup : ${new Date().toLocaleTimeString('id-ID')}${LF}` +
        `Tanggal     : ${new Date().toLocaleDateString('id-ID')}${LF}` +
        `Kasir       : ${currentUser.name}${LF}` +
        `--------------------------------${LF}` +
        `Total Struk : ${shiftTransactions.length} transaksi${LF}` +
        `Total Omzet : ${formatCurrency(totalOmzet)}${LF}` +
        `Laba Bersih : ${formatCurrency(grossProfit)}${LF}` +
        `--------------------------------${LF}` +
        `Kas Tunai   : ${formatCurrency(cashSales)}${LF}` +
        `QRIS        : ${formatCurrency(qrisSales)}${LF}` +
        `Transfer    : ${formatCurrency(transferSales)}${LF}` +
        `--------------------------------${LF}` +
        `Target Kas  : ${formatCurrency(expectedCash)}${LF}` +
        `Fisik Laci  : ${formatCurrency(actualCashInput)}${LF}` +
        `Selisih     : ${cashDifference === 0 ? 'PAS (Rp 0)' : formatCurrency(cashDifference)}${LF}` +
        (cashierNote ? `Catatan: ${cashierNote}${LF}` : '') +
        `${ESC}a\x01` + // Center align
        `--------------------------------${LF}` +
        `Kasir Resmi Ditutup${LF}` +
        `Terima kasih atas kerja kerasnya!${LF}${LF}${LF}` +
        `${GS}V\x41\x00`; // Cut paper

      const bytes = encoder.encode(printText);
      const res = await btPrinter.printData(bytes);
      setPrintStatus(res.message);
      sound.playSuccess();
    } catch {
      setPrintStatus('Membuka dialog cetak sistem...');
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  // Confirm Closing & Lock Screen
  const handleConfirmClose = () => {
    sound.playSuccess();

    const closingRecord: ShiftClosing = {
      id: `closing-${Date.now()}`,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      openedAt: shiftStartTime,
      closedAt: closedAtTime,
      totalTransactions: shiftTransactions.length,
      totalOmzet,
      cashSales,
      qrisSales,
      transferSales,
      ewalletSales,
      kasbonSales,
      actualCashInDrawer: actualCashInput,
      expectedCashInDrawer: expectedCash,
      cashDifference,
      grossProfit,
      note: cashierNote.trim() || undefined,
    };

    StorageService.saveShiftClosing(closingRecord);
    onNotify(
      'Kasir Berhasil Ditutup',
      `Shift penjualan telah direkap (Total Omzet: ${formatCurrency(totalOmzet)}). Terminal kasir otomatis dikunci.`,
      'success'
    );

    onConfirmCloseShift(closingRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold shadow-inner shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold leading-tight">Tutup Kasir (Selesai Berjualan)</h3>
              <p className="text-xs text-white/80">Rekap penjualan shift & hitung uang laci sebelum pulang</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[calc(88vh-8rem)] overflow-y-auto">
          
          {/* Shift Metadata Banner */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-theme-primary shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">Kasir:</span>
              <strong className="text-slate-900 dark:text-white font-semibold">
                {currentUser.name} ({currentUser.role.toUpperCase()})
              </strong>
            </div>

            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {new Date(shiftStartTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                {' — '}
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* 3 Metric Summary Boxes */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                Total Struk
              </span>
              <div className="text-base sm:text-lg font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">
                {shiftTransactions.length}
              </div>
              <span className="text-[9px] text-slate-400">Transaksi Lunas</span>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                Total Omzet
              </span>
              <div className="text-base sm:text-lg font-mono font-extrabold text-theme-primary mt-0.5">
                {formatCurrency(totalOmzet)}
              </div>
              <span className="text-[9px] text-slate-400">Penjualan Kotor</span>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                Laba Bersih
              </span>
              <div className="text-base sm:text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(grossProfit)}
              </div>
              <span className="text-[9px] text-slate-400">Omzet - Modal</span>
            </div>
          </div>

          {/* Payment Method Breakdown List */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-theme-primary" />
              <span>Rincian Pembayaran Masuk:</span>
            </span>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <Banknote className="w-4 h-4 text-theme-primary" />
                  <span>Uang Tunai (Harus ada di laci kasir)</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(cashSales)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>QRIS (Masuk ke rekening/aplikasi)</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(qrisSales)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span>Transfer Bank & E-Wallet</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(transferSales + ewalletSales)}
                </span>
              </div>
            </div>
          </div>

          {/* Cash Drawer Reconciliation Section */}
          <div className="p-4 rounded-2xl border-2 border-dashed border-theme bg-theme-soft space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-theme-primary" />
                  <span>Hitung Uang Fisik di Laci Kasir:</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Hitung seluruh lembar uang tunai di laci untuk pencocokan
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                Target: {formatCurrency(expectedCash)}
              </span>
            </div>

            {/* Cash Input */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-600 dark:text-slate-400 font-mono">Rp</span>
              <input
                type="number"
                min="0"
                value={actualCashInput || ''}
                onChange={(e) => setActualCashInput(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-theme bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-base font-extrabold focus:outline-none shadow-xs"
              />
            </div>

            {/* Quick Helper Cash Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setActualCashInput(expectedCash);
                }}
                className="px-2.5 py-1 rounded-lg bg-theme-primary text-white text-[11px] font-bold shadow-xs transition active:scale-95"
              >
                Uang Pas ({formatCurrency(expectedCash)})
              </button>
              {[10000, 20000, 50000, 100000].map((addVal) => (
                <button
                  key={addVal}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setActualCashInput((prev) => prev + addVal);
                  }}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold hover:border-theme transition"
                >
                  +{formatCurrency(addVal)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setActualCashInput(0);
                }}
                className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium"
              >
                Reset Rp 0
              </button>
            </div>

            {/* Reconciliation Difference Badge */}
            <div className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition-all ${
              cashDifference === 0
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
                : cashDifference > 0
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300'
            }`}>
              <div className="flex items-center gap-1.5">
                {cashDifference === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>
                  {cashDifference === 0
                    ? 'Kas Seimbang (Uang laci pas sesuai struk penjualan)'
                    : cashDifference > 0
                    ? 'Kas Lebih (Ada kelebihan uang di laci kasir)'
                    : 'Kas Kurang (Uang fisik di laci kurang dari struk)'}
                </span>
              </div>
              <span className="font-mono text-sm">
                {cashDifference > 0 ? `+${formatCurrency(cashDifference)}` : formatCurrency(cashDifference)}
              </span>
            </div>
          </div>

          {/* Cashier Notes Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Penutupan Kasir (Opsional):
            </label>
            <input
              type="text"
              value={cashierNote}
              onChange={(e) => setCashierNote(e.target.value)}
              placeholder="Contoh: Sisa modal receh Rp 50.000 ditinggal di laci..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-theme"
            />
          </div>

          {/* Print Status Feedback */}
          {printStatus && (
            <div className="p-2 text-center text-xs font-mono font-medium rounded-lg bg-theme-soft text-theme-primary">
              {printStatus}
            </div>
          )}

        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintReceipt}
              disabled={isPrinting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-theme transition shadow-xs"
              title="Cetak struk rekap ke printer thermal bluetooth"
            >
              <Printer className="w-4 h-4 text-theme-primary" />
              <span>Cetak Struk</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition shadow-xs"
              title="Kirim laporan rekap shift ke WhatsApp pemilik"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Kirim WA</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleConfirmClose}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-500/20 active:scale-95 transition"
            >
              <Lock className="w-4 h-4" />
              <span>Konfirmasi Tutup Kasir</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
