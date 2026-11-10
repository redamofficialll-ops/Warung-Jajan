import { jsPDF } from 'jspdf';
import { Product, StoreSettings, Transaction } from '../types.ts';
import { formatCurrency } from './bluetoothPrinter.ts';

export function exportDailyReportPDF(
  transactions: Transaction[],
  dateLabel: string,
  settings: StoreSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(249, 115, 22); // Orange / Amber
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(settings.storeName.toUpperCase(), 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`LAPORAN PENJUALAN HARIAN · ${dateLabel}`, 14, 19);

  doc.text(`Dibuat: ${new Date().toLocaleString('id-ID')}`, pageWidth - 14, 19, { align: 'right' });

  // Summary Cards
  const totalOmzet = transactions.reduce((acc, t) => acc + (t.status === 'lunas' ? t.totalAmount : 0), 0);
  const totalTrx = transactions.filter((t) => t.status === 'lunas').length;
  
  // Calculate total HPP and gross profit
  let totalHpp = 0;
  transactions.forEach((t) => {
    if (t.status === 'lunas') {
      t.items.forEach((item) => {
        totalHpp += (item.hpp || item.price * 0.6) * item.quantity;
      });
    }
  });
  const grossProfit = totalOmzet - totalHpp;
  const avgBasket = totalTrx > 0 ? Math.round(totalOmzet / totalTrx) : 0;

  let y = 36;
  const cardWidth = (pageWidth - 28 - 9) / 4;

  const drawCard = (x: number, title: string, value: string, sub: string, color: [number, number, number]) => {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardWidth, 22, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(title, x + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(value, x + 4, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(sub, x + 4, y + 18);
  };

  drawCard(14, 'TOTAL OMZET', formatCurrency(totalOmzet), 'Penjualan kotor', [234, 88, 12]);
  drawCard(14 + cardWidth + 3, 'TOTAL TRANSAKSI', `${totalTrx} Trx`, 'Struk tercetak', [15, 23, 42]);
  drawCard(14 + (cardWidth + 3) * 2, 'ESTIMASI LABA', formatCurrency(grossProfit), 'Omzet - Modal HPP', [22, 163, 74]);
  drawCard(14 + (cardWidth + 3) * 3, 'RATA-RATA ORDER', formatCurrency(avgBasket), 'Per pelanggan', [2, 132, 199]);

  y += 30;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  doc.text('NO. TRX', 18, y + 5.5);
  doc.text('WAKTU', 52, y + 5.5);
  doc.text('KASIR / PELANGGAN', 80, y + 5.5);
  doc.text('ITEM', 125, y + 5.5);
  doc.text('METODE', 155, y + 5.5);
  doc.text('TOTAL', pageWidth - 18, y + 5.5, { align: 'right' });

  y += 9;

  // Table Body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  transactions.forEach((trx, idx) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(14, y - 1, pageWidth - 28, 7, 'F');
    }

    const timeStr = new Date(trx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const customerInfo = trx.customerName ? `${trx.cashierName} · ${trx.customerName}` : trx.cashierName;
    const itemsSummary = trx.items.map((it) => `${it.productName} (${it.quantity})`).join(', ');
    const truncatedItems = itemsSummary.length > 22 ? itemsSummary.substring(0, 20) + '...' : itemsSummary;

    doc.setTextColor(trx.status === 'batal' ? 239 : 30, trx.status === 'batal' ? 68 : 41, trx.status === 'batal' ? 68 : 59);
    doc.text(trx.invoiceNo, 18, y + 4);
    doc.text(timeStr, 52, y + 4);
    doc.text(customerInfo, 80, y + 4);
    doc.text(truncatedItems, 125, y + 4);
    doc.text(trx.paymentMethod.toUpperCase(), 155, y + 4);
    doc.text(formatCurrency(trx.totalAmount), pageWidth - 18, y + 4, { align: 'right' });

    y += 7.5;
  });

  // Footer Note
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`${settings.storeName} · ${settings.address} · Telp: ${settings.phone}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  doc.save(`Laporan_Harian_${dateLabel.replace(/\s+/g, '_')}.pdf`);
}

export function exportInventoryPDF(products: Product[], settings: StoreSettings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(16, 185, 129); // Emerald
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(settings.storeName.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`LAPORAN STOK BARANG & ESTIMASI NILAI INVENTORY`, 14, 18);
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - 14, 18, { align: 'right' });

  // Summary stats
  const totalItems = products.length;
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalNilaiModal = products.reduce((acc, p) => acc + p.hpp * p.stock, 0);
  const totalNilaiJual = products.reduce((acc, p) => acc + p.price * p.stock, 0);

  let y = 32;
  const colW = (pageWidth - 28 - 9) / 4;

  const miniCard = (x: number, title: string, val: string) => {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, colW, 16, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(title, x + 3, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(val, x + 3, y + 12);
  };

  miniCard(14, 'TOTAL VARIAN', `${totalItems} Jenis`);
  miniCard(14 + colW + 3, 'TOTAL FISIK STOK', `${totalStockCount} Pcs`);
  miniCard(14 + (colW + 3) * 2, 'NILAI MODAL (HPP)', formatCurrency(totalNilaiModal));
  miniCard(14 + (colW + 3) * 3, 'POTENSI OMZET', formatCurrency(totalNilaiJual));

  y += 24;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.text('KODE / NAMA PRODUK', 18, y + 5.5);
  doc.text('KATEGORI', 80, y + 5.5);
  doc.text('HPP (MODAL)', 115, y + 5.5);
  doc.text('HARGA JUAL', 145, y + 5.5);
  doc.text('STOK FISIK', pageWidth - 18, y + 5.5, { align: 'right' });

  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  products.forEach((prod, idx) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(14, y - 1, pageWidth - 28, 7, 'F');
    }

    const isLow = prod.stock <= prod.minStock;
    doc.setTextColor(isLow ? 220 : 30, isLow ? 38 : 41, isLow ? 38 : 59);

    doc.text(prod.name, 18, y + 4);
    doc.setTextColor(100, 116, 139);
    doc.text(prod.category, 80, y + 4);
    doc.text(formatCurrency(prod.hpp), 115, y + 4);
    doc.text(formatCurrency(prod.price), 145, y + 4);

    doc.setFont('helvetica', isLow ? 'bold' : 'normal');
    doc.setTextColor(isLow ? 220 : 15, isLow ? 38 : 23, isLow ? 38 : 42);
    doc.text(`${prod.stock} ${prod.unit} ${isLow ? '(Menipis!)' : ''}`, pageWidth - 18, y + 4, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 7;
  });

  doc.save(`Laporan_Stok_Barang_${new Date().toISOString().slice(0, 10)}.pdf`);
}
