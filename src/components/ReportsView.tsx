import React, { useState, useMemo } from 'react';
import { ShiftClosing, StoreSettings, Transaction } from '../types.ts';
import { StorageService } from '../utils/storage.ts';
import { formatCurrency } from '../utils/bluetoothPrinter.ts';
import { exportDailyReportPDF } from '../utils/pdfExport.ts';
import { exportDailyReportExcel } from '../utils/excelExport.ts';
import { sound } from '../utils/audio.ts';
import { 
  BarChart3, 
  Calendar, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Percent, 
  Printer, 
  Search, 
  XCircle, 
  CheckCircle, 
  ArrowUpRight,
  FileSpreadsheet,
  Store,
  Clock,
  User,
  Banknote,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RotateCcw,
  Trash2
} from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  settings: StoreSettings;
  onOpenReceipt: (transaction: Transaction) => void;
  onVoidTransaction: (transactionId: string) => void;
  onClearAllTransactions: () => void;
  onNotify: (title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert') => void;
}

// Helpers for Date Formats
const formatDateToYYYYMMDD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatIndonesianDateStr = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const dateObj = new Date(year, month, day);
  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  settings,
  onOpenReceipt,
  onVoidTransaction,
  onClearAllTransactions,
  onNotify,
}) => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | '7days' | 'month' | 'customDate' | 'customRange' | 'all'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateToYYYYMMDD(new Date()));
  const [startDate, setStartDate] = useState<string>(() => formatDateToYYYYMMDD(new Date()));
  const [endDate, setEndDate] = useState<string>(() => formatDateToYYYYMMDD(new Date()));

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const [txToVoid, setTxToVoid] = useState<Transaction | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const shiftClosings = useMemo(() => StorageService.getShiftClosings(), []);

  // Filter transactions based on date or custom range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = formatDateToYYYYMMDD(now);

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = formatDateToYYYYMMDD(yesterday);

    return transactions.filter((t) => {
      const tDate = new Date(t.createdAt);
      const tDateStr = formatDateToYYYYMMDD(tDate);
      let matchDate = true;

      if (timeFilter === 'today') {
        matchDate = tDateStr === todayStr;
      } else if (timeFilter === 'yesterday') {
        matchDate = tDateStr === yesterdayStr;
      } else if (timeFilter === '7days') {
        const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
        matchDate = diffDays >= 0 && diffDays <= 7;
      } else if (timeFilter === 'month') {
        matchDate = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      } else if (timeFilter === 'customDate') {
        matchDate = tDateStr === selectedDate;
      } else if (timeFilter === 'customRange') {
        matchDate = tDateStr >= startDate && tDateStr <= endDate;
      }

      const matchSearch =
        t.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.customerName && t.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchDate && matchSearch;
    });
  }, [transactions, timeFilter, selectedDate, startDate, endDate, searchQuery]);

  // Date Stepper Handlers (< Prev Day, Next Day >)
  const handlePrevDay = () => {
    sound.playTap();
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() - 1);
    const newStr = formatDateToYYYYMMDD(d);
    setSelectedDate(newStr);
    setTimeFilter('customDate');
  };

  const handleNextDay = () => {
    sound.playTap();
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + 1);
    const newStr = formatDateToYYYYMMDD(d);
    setSelectedDate(newStr);
    setTimeFilter('customDate');
  };

  // Aggregate Metrics
  const validTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => t.status === 'lunas');
  }, [filteredTransactions]);

  const totalOmzet = validTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalTrxCount = validTransactions.length;
  
  let totalHpp = 0;
  validTransactions.forEach((t) => {
    t.items.forEach((item) => {
      totalHpp += (item.hpp || item.price * 0.6) * item.quantity;
    });
  });
  const grossProfit = totalOmzet - totalHpp;
  const avgBasket = totalTrxCount > 0 ? Math.round(totalOmzet / totalTrxCount) : 0;

  // Best Selling Snacks
  const bestSellers = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();
    validTransactions.forEach((t) => {
      t.items.forEach((it) => {
        const curr = map.get(it.productId) || { name: it.productName, quantity: 0, revenue: 0 };
        curr.quantity += it.quantity;
        curr.revenue += it.subtotal;
        map.set(it.productId, curr);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [validTransactions]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { tunai: 0, qris: 0, transfer: 0, ewallet: 0, kasbon: 0 };
    validTransactions.forEach((t) => {
      map[t.paymentMethod] = (map[t.paymentMethod] || 0) + t.totalAmount;
    });
    return map;
  }, [validTransactions]);

  // Monthly Sales Chart Data (Days 1 to 30)
  const chartDays = useMemo(() => {
    const daysMap = new Map<string, number>();
    // Group last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      daysMap.set(key, 0);
    }

    transactions.forEach((t) => {
      if (t.status === 'lunas') {
        const d = new Date(t.createdAt);
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        if (daysMap.has(key)) {
          daysMap.set(key, (daysMap.get(key) || 0) + t.totalAmount);
        }
      }
    });

    return Array.from(daysMap.entries()).map(([label, amount]) => ({ label, amount }));
  }, [transactions]);

  const maxChartAmount = Math.max(...chartDays.map((d) => d.amount), 50000);

  const getFilterLabel = () => {
    switch (timeFilter) {
      case 'today':
        return 'Hari Ini';
      case 'yesterday':
        return 'Kemarin';
      case '7days':
        return '7 Hari Terakhir';
      case 'month':
        return 'Bulan Ini';
      case 'customDate':
        return `Tanggal ${formatIndonesianDateStr(selectedDate)}`;
      case 'customRange':
        return `Rentang ${formatIndonesianDateStr(startDate)} s.d ${formatIndonesianDateStr(endDate)}`;
      default:
        return 'Semua Riwayat';
    }
  };

  const handleExportPDF = () => {
    sound.playTap();
    const label = getFilterLabel();
    exportDailyReportPDF(filteredTransactions, label, settings);
    onNotify('Ekspor PDF Sukses', `Laporan transaksi (${label}) telah diunduh.`, 'success');
  };

  const handleExportExcel = () => {
    sound.playTap();
    const label = getFilterLabel();
    exportDailyReportExcel(filteredTransactions, label, settings);
    onNotify('Ekspor Excel Sukses', `Laporan transaksi (${label}) telah diunduh dalam format Excel (.csv).`, 'success');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
      
      {/* Header & Date Range Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Laporan & Analisis Penjualan</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time pantau omzet, laba bersih modal, dan performa menu terlaris per tanggal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Pills */}
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-1">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: 'yesterday', label: 'Kemarin' },
              { id: '7days', label: '7 Hari' },
              { id: 'month', label: 'Bulan Ini' },
              { id: 'customDate', label: 'Pilih Tanggal' },
              { id: 'customRange', label: 'Rentang' },
              { id: 'all', label: 'Semua' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  sound.playTap();
                  setTimeFilter(f.id as any);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  timeFilter === f.id
                    ? 'bg-white dark:bg-slate-900 text-theme-primary shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {transactions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setIsClearModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Kosongkan Semua Riwayat Transaksi"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Kosongkan Riwayat</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              title="Ekspor Laporan ke Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ekspor Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theme-primary hover:opacity-90 text-white text-xs font-bold shadow-md shadow-theme transition active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kalender & Date Picker Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Quick Date Stepper (< Prev Day, Selected Date, Next Day >) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition"
            title="Lihat Tanggal Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 text-theme-primary" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-soft text-theme-primary border border-theme/30 font-bold text-xs">
            <CalendarDays className="w-4 h-4 shrink-0" />
            <span>{getFilterLabel()}</span>
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition"
            title="Lihat Tanggal Berikutnya"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="w-4 h-4 text-theme-primary" />
          </button>

          {timeFilter !== 'today' && (
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setTimeFilter('today');
                setSelectedDate(formatDateToYYYYMMDD(new Date()));
              }}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-theme-primary transition"
              title="Kembali ke Hari Ini"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: Interactive HTML5 Date Inputs (Single Date or Range Picker) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {timeFilter === 'customRange' ? (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 text-[11px] font-medium pl-1">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  sound.playTap();
                  setStartDate(e.target.value);
                }}
                className="bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-theme"
              />
              <span className="text-slate-500 text-[11px] font-medium">s.d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  sound.playTap();
                  setEndDate(e.target.value);
                }}
                className="bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-theme"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="text-slate-600 dark:text-slate-300 font-semibold text-[11px] flex items-center gap-1.5 pl-1 cursor-pointer">
                <Calendar className="w-4 h-4 text-theme-primary" />
                <span>Pilih Tanggal Spesifik:</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  sound.playTap();
                  setSelectedDate(e.target.value);
                  setTimeFilter('customDate');
                }}
                className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-theme cursor-pointer"
              />
            </div>
          )}
        </div>

      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Omzet Kotor</span>
            <DollarSign className="w-4 h-4 text-theme-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(totalOmzet)}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span>Penjualan lunas periode ini</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Laba Bersih (Profit)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {formatCurrency(grossProfit)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Omzet dikurangi HPP modal
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Jumlah Transaksi</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {totalTrxCount} <span className="text-xs font-normal text-slate-400">Struk</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Rata-rata order: {formatCurrency(avgBasket)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Margin Keuntungan</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 font-mono">
            {totalOmzet > 0 ? Math.round((grossProfit / totalOmzet) * 100) : 0}%
          </div>
          <div className="text-[10px] text-purple-600/80 font-medium mt-1">
            Efisiensi margin jualan sehat
          </div>
        </div>
      </div>

      {/* Visual Sales Chart & Top Selling Menu */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        
        {/* Left: Monthly Trend Bar Chart (7 Cols on Tablet, 8 Cols on Desktop) */}
        <div className="md:col-span-7 lg:col-span-8 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Tren Penjualan 14 Hari Terakhir
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Grafik omzet harian untuk melihat pola hari teramai
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-theme-primary">
              Puncak: {formatCurrency(maxChartAmount)}
            </span>
          </div>

          {/* SVG Interactive Bar Chart */}
          <div className="h-56 flex items-end justify-between gap-1.5 pt-6 pb-2 px-1 border-b border-slate-100 dark:border-slate-800">
            {chartDays.map((day, idx) => {
              const heightPct = Math.max(4, Math.round((day.amount / maxChartAmount) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20">
                    {day.label}: {formatCurrency(day.amount)}
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] rounded-t-lg bg-theme-gradient transition-all shadow-sm"
                  />

                  {/* Label */}
                  <span className="text-[9px] text-slate-400 mt-2 font-mono truncate w-full text-center">
                    {day.label.split('/')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Payment Method Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <span className="text-slate-500 font-semibold text-[11px]">Distribusi Bayar:</span>
            <span className="text-slate-700 dark:text-slate-300 font-mono">
              Tunai: <strong className="text-theme-primary">{formatCurrency(paymentBreakdown.tunai)}</strong>
            </span>
            <span>·</span>
            <span className="text-slate-700 dark:text-slate-300 font-mono">
              QRIS: <strong className="text-emerald-600">{formatCurrency(paymentBreakdown.qris)}</strong>
            </span>
            <span>·</span>
            <span className="text-slate-700 dark:text-slate-300 font-mono">
              Transfer: <strong>{formatCurrency(paymentBreakdown.transfer)}</strong>
            </span>
          </div>
        </div>

        {/* Right: Best Selling Snacks (5 Cols on Tablet, 4 Cols on Desktop) */}
        <div className="md:col-span-5 lg:col-span-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Menu Terlaris (Top 5)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Jajanan favorit dengan penjualan terbanyak
            </p>
          </div>

          <div className="space-y-3">
            {bestSellers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada data penjualan</p>
            ) : (
              bestSellers.map((item, idx) => {
                const maxQty = bestSellers[0].quantity || 1;
                const widthPct = Math.round((item.quantity / maxQty) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                        {idx + 1}. {item.name}
                      </span>
                      <span className="font-bold text-theme-primary font-mono">
                        {item.quantity} Terjual
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="bg-theme-gradient h-full rounded-full transition-all"
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Omzet menu ini</span>
                      <span>{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Real-time Transaction History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Riwayat Transaksi Real-time
            </h3>
            <p className="text-[11px] text-slate-500">
              Total {filteredTransactions.length} struk tercatat
            </p>
          </div>

          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no struk / kasir / member..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Kasir / Pelanggan</th>
                <th className="py-3 px-4">Item Pesanan</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4 font-mono">Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Belum Ada Data Penjualan
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Laporan transaksi masih kosong. Lakukan penjualan di kasir POS untuk mencatat transaksi.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const isVoid = trx.status === 'batal';
                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {trx.invoiceNo}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        <div>{new Date(trx.createdAt).toLocaleDateString('id-ID')}</div>
                        <div className="text-[10px]">{new Date(trx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-900 dark:text-white font-medium">{trx.cashierName}</div>
                        {trx.customerName && (
                          <div className="text-[10px] text-theme-primary font-semibold">
                            Member: {trx.customerName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                        {trx.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {trx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(trx.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isVoid
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {isVoid ? 'Dibatalkan' : 'Lunas'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              sound.playTap();
                              onOpenReceipt(trx);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-theme-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Cetak Ulang Struk"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {!isVoid && (
                            <button
                              type="button"
                              onClick={() => {
                                sound.playTap();
                                setTxToVoid(trx);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Batalkan / Void Transaksi"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Riwayat Tutup Kasir (Shift Closings History) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Riwayat Tutup Kasir (Rekap Selesai Berjualan)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Log penutupan terminal, rekonsiliasi kas laci, dan selisih uang
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {shiftClosings.length} Kali Tutup Shift
          </span>
        </div>

        {shiftClosings.length === 0 ? (
          <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Store className="w-8 h-8 mx-auto opacity-40 mb-1" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Belum ada riwayat tutup kasir
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tekan tombol "Tutup Kasir" di menu atas saat selesai shift berjualan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {shiftClosings.map((c) => {
              const isBalance = c.cashDifference === 0;
              const isOver = c.cashDifference > 0;
              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-theme-primary" />
                      <span>{c.cashierName}</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(c.closedAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(c.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(c.closedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{c.totalTransactions} Struk</span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between font-mono">
                    <span className="text-slate-500 text-[11px]">Total Omzet:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(c.totalOmzet)}</span>
                  </div>

                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Fisik Laci:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(c.actualCashInDrawer)}</span>
                  </div>

                  <div className={`p-1.5 rounded-lg flex items-center justify-between text-[11px] font-bold ${
                    isBalance
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : isOver
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}>
                    <span>{isBalance ? 'Kas Pas' : isOver ? 'Kas Lebih' : 'Kas Kurang'}</span>
                    <span className="font-mono">
                      {isBalance ? 'Rp 0' : isOver ? `+${formatCurrency(c.cashDifference)}` : formatCurrency(c.cashDifference)}
                    </span>
                  </div>

                  {c.note && (
                    <p className="text-[10px] text-slate-500 italic bg-white dark:bg-slate-900 p-1.5 rounded-md border border-slate-100 dark:border-slate-800">
                      "{c.note}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Dialog Konfirmasi Void Transaksi */}
      {txToVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 my-auto animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
              <XCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Batalkan Transaksi?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Batalkan transaksi <strong className="text-slate-900 dark:text-white">{txToVoid.invoiceNo}</strong>? Jumlah total senilai <strong className="font-mono text-slate-900 dark:text-white">{formatCurrency(txToVoid.totalAmount)}</strong> akan dibatalkan dan stok produk akan otomatis dikembalikan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTxToVoid(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playWarning();
                  onVoidTransaction(txToVoid.id);
                  onNotify('Transaksi Dibatalkan', `Transaksi ${txToVoid.invoiceNo} telah dibatalkan & stok dipulihkan.`, 'alert');
                  setTxToVoid(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition"
              >
                Ya, Batalkan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Kosongkan Semua Transaksi */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 my-auto animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Kosongkan Semua Riwayat?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Semua riwayat transaksi penjualan akan dihapus bersih (0 transaksi). Langkah ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playWarning();
                  onClearAllTransactions();
                  setIsClearModalOpen(false);
                  onNotify('Riwayat Dikosongkan', 'Semua data riwayat penjualan telah dibersihkan.', 'success');
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition"
              >
                Ya, Kosongkan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
