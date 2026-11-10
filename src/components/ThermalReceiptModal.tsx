import React, { useState } from 'react';
import { StoreSettings, Transaction } from '../types.ts';
import { formatCurrency, btPrinter, generateEscPosCommands } from '../utils/bluetoothPrinter.ts';
import { sound } from '../utils/audio.ts';
import { Printer, Smartphone, MessageSquare, Check, X, QrCode } from 'lucide-react';

interface ThermalReceiptModalProps {
  transaction: Transaction;
  settings: StoreSettings;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  transaction,
  settings,
  onClose,
}) => {
  const [printStatus, setPrintStatus] = useState<string>('');
  const [isPrintingBt, setIsPrintingBt] = useState<boolean>(false);

  const handlePrintBluetooth = async () => {
    sound.playTap();
    setIsPrintingBt(true);
    setPrintStatus('Menghubungkan ke printer Bluetooth...');

    try {
      const conn = await btPrinter.connect();
      if (!conn.success) {
        setPrintStatus(conn.message);
        setIsPrintingBt(false);
        return;
      }

      setPrintStatus('Mengirim data struk ke ' + conn.name + '...');

      const escPosBytes = generateEscPosCommands(
        settings.storeName,
        settings.address,
        settings.phone,
        transaction.invoiceNo,
        transaction.cashierName,
        transaction.customerName,
        new Date(transaction.createdAt).toLocaleString('id-ID'),
        transaction.items,
        transaction.subtotal,
        transaction.discount,
        transaction.totalAmount,
        transaction.paymentMethod,
        transaction.cashPaid,
        transaction.change,
        settings.receiptFooter
      );

      const res = await btPrinter.printData(escPosBytes);
      setPrintStatus(res.message);
      sound.playSuccess();
    } catch (err: any) {
      setPrintStatus('Gagal mencetak Bluetooth: ' + err.message);
    } finally {
      setIsPrintingBt(false);
    }
  };

  const handleBrowserPrint = () => {
    sound.playTap();
    window.print();
  };

  const handleSendWhatsApp = () => {
    sound.playTap();
    const itemsText = transaction.items
      .map((i) => `- ${i.productName} (${i.quantity}x) = ${formatCurrency(i.subtotal)}`)
      .join('%0A');

    const msg = `*STRUK PEMBELIAN ${settings.storeName.toUpperCase()}*%0A` +
      `No. Trx: ${transaction.invoiceNo}%0A` +
      `Waktu: ${new Date(transaction.createdAt).toLocaleString('id-ID')}%0A` +
      `Kasir: ${transaction.cashierName}%0A` +
      (transaction.customerName ? `Pelanggan: ${transaction.customerName}%0A` : '') +
      `--------------------------------%0A` +
      itemsText + `%0A` +
      `--------------------------------%0A` +
      `Subtotal: ${formatCurrency(transaction.subtotal)}%0A` +
      (transaction.discount > 0 ? `Diskon: -${formatCurrency(transaction.discount)}%0A` : '') +
      `*TOTAL: ${formatCurrency(transaction.totalAmount)}*%0A` +
      `Bayar: ${formatCurrency(transaction.cashPaid)} (${transaction.paymentMethod.toUpperCase()})%0A` +
      `Kembali: ${formatCurrency(transaction.change)}%0A%0A` +
      `${settings.receiptFooter}`;

    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-theme-primary" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Struk Transaksi</h3>
          </div>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realistic Thermal Receipt Paper Simulation */}
        <div className="p-5 bg-slate-200/70 dark:bg-slate-950 flex justify-center">
          <div 
            id="thermal-receipt-print-area"
            className="w-full max-w-[290px] bg-white text-slate-900 p-4 rounded-sm shadow-md font-mono text-xs leading-relaxed border-t-4 border-theme relative"
          >
            {/* Store Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              <h4 className="font-extrabold text-sm tracking-tight">{settings.storeName}</h4>
              <p className="text-[10px] text-slate-600 mt-0.5">{settings.address}</p>
              <p className="text-[10px] text-slate-600">Telp: {settings.phone}</p>
            </div>

            {/* Metadata */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>No: {transaction.invoiceNo}</span>
                <span>{new Date(transaction.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir: {transaction.cashierName}</span>
                <span>{new Date(transaction.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
              {transaction.customerName && (
                <div>Pelanggan: <span className="font-semibold">{transaction.customerName}</span></div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-1.5">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="font-medium text-slate-800">{item.productName}</div>
                  <div className="flex justify-between text-slate-600">
                    <span>{item.quantity} x {formatCurrency(item.price)}</span>
                    <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-0.5 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon</span>
                  <span>-{formatCurrency(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                <span>TOTAL</span>
                <span>{formatCurrency(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 text-[10px]">
                <span>Bayar ({transaction.paymentMethod.toUpperCase()})</span>
                <span>{formatCurrency(transaction.cashPaid)}</span>
              </div>
              {transaction.change > 0 && (
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>Kembalian</span>
                  <span>{formatCurrency(transaction.change)}</span>
                </div>
              )}
            </div>

            {/* Thermal Footer */}
            <div className="pt-3 text-center text-[10px] text-slate-500">
              <p className="italic">{settings.receiptFooter}</p>
              <p className="text-[9px] font-mono tracking-wider mt-2 text-slate-400">
                {transaction.invoiceNo}
              </p>
            </div>
          </div>
        </div>

        {/* Bluetooth Status Message */}
        {printStatus && (
          <div className="px-5 py-2 text-xs text-center font-medium bg-theme-soft text-theme-primary border-t border-theme">
            {printStatus}
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 space-y-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrintBluetooth}
              disabled={isPrintingBt}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-theme-primary bg-theme-primary-hover text-white font-semibold text-xs transition shadow-sm shadow-theme"
            >
              <Smartphone className="w-4 h-4" />
              <span>Cetak Bluetooth</span>
            </button>
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Kirim Struk via WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
          >
            Selesai & Lanjut Transaksi Baru
          </button>
        </div>

      </div>
    </div>
  );
};
