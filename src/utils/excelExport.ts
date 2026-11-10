import { Product, StoreSettings, Transaction } from '../types.ts';

export function exportDailyReportExcel(
  transactions: Transaction[],
  dateLabel: string,
  settings: StoreSettings
) {
  const storeTitle = settings.storeName || 'SnackPOS Pro';
  const downloadDate = new Date().toLocaleString('id-ID');

  // Metadata headers
  const metaRows = [
    [`"LAPORAN PENJUALAN - ${storeTitle.toUpperCase()}"`],
    [`"Periode: ${dateLabel}"`],
    [`"Diekspor Pada: ${downloadDate}"`],
    [''] // empty line
  ];

  const headers = [
    'Tanggal & Waktu',
    'No Invoice',
    'Kasir',
    'Pelanggan',
    'Detail Pesanan',
    'Total Bayar (Rp)',
    'Estimasi Modal HPP (Rp)',
    'Estimasi Laba Bersih (Rp)',
    'Metode Bayar',
    'Status'
  ];

  let sumOmzet = 0;
  let sumHpp = 0;

  const rows = transactions.map((t) => {
    let tHpp = 0;
    t.items.forEach((item) => {
      tHpp += (item.hpp || item.price * 0.6) * item.quantity;
    });

    if (t.status === 'lunas') {
      sumOmzet += t.totalAmount;
      sumHpp += tHpp;
    }

    const tProfit = t.status === 'lunas' ? (t.totalAmount - tHpp) : 0;
    const itemsFormatted = t.items.map((i) => `${i.productName} (${i.quantity}x)`).join('; ');

    return [
      `"${new Date(t.createdAt).toLocaleString('id-ID')}"`,
      `"${t.invoiceNo}"`,
      `"${t.cashierName}"`,
      `"${t.customerName || 'Umum'}"`,
      `"${itemsFormatted.replace(/"/g, '""')}"`,
      t.totalAmount,
      Math.round(tHpp),
      Math.round(tProfit),
      `"${t.paymentMethod.toUpperCase()}"`,
      `"${t.status.toUpperCase()}"`
    ];
  });

  const sumProfit = sumOmzet - sumHpp;

  // Summary Row at bottom
  const summaryRows = [
    [''],
    [
      '"TOTAL KESELURUHAN (LUNAS)"',
      '""',
      '""',
      '""',
      `"${transactions.filter(t => t.status === 'lunas').length} Transaksi"`,
      sumOmzet,
      Math.round(sumHpp),
      Math.round(sumProfit),
      '""',
      '""'
    ]
  ];

  const csvContent = [
    ...metaRows.map(r => r.join(',')),
    headers.join(','),
    ...rows.map(r => r.join(',')),
    ...summaryRows.map(r => r.join(','))
  ].join('\n');

  // \ufeff ensures Excel opens UTF-8 Indonesian text with proper accents/characters
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Penjualan_${storeTitle.replace(/\s+/g, '_')}_${dateLabel.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportInventoryExcel(products: Product[], settings: StoreSettings) {
  const storeTitle = settings.storeName || 'SnackPOS Pro';
  const downloadDate = new Date().toLocaleString('id-ID');

  const metaRows = [
    [`"LAPORAN STOK PRODUK & INVENTORY - ${storeTitle.toUpperCase()}"`],
    [`"Diekspor Pada: ${downloadDate}"`],
    ['']
  ];

  const headers = [
    'Nama Menu Jajanan',
    'Kategori',
    'Harga Modal HPP (Rp)',
    'Harga Jual (Rp)',
    'Margin Laba (Rp)',
    'Stok Fisik',
    'Satuan',
    'Batas Min Stok',
    'Total Nilai Modal (Rp)',
    'Potensi Omzet (Rp)',
    'Status Stok'
  ];

  let sumStock = 0;
  let sumNilaiModal = 0;
  let sumPotensiOmzet = 0;

  const rows = products.map((p) => {
    const margin = p.price - p.hpp;
    const totalModal = p.hpp * p.stock;
    const totalOmzet = p.price * p.stock;
    const isLow = p.stock <= p.minStock;

    sumStock += p.stock;
    sumNilaiModal += totalModal;
    sumPotensiOmzet += totalOmzet;

    return [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.hpp,
      p.price,
      margin,
      p.stock,
      `"${p.unit}"`,
      p.minStock,
      totalModal,
      totalOmzet,
      `"${isLow ? 'MENIPIS' : 'AMAN'}"`
    ];
  });

  const summaryRows = [
    [''],
    [
      '"TOTAL INVENTORY"',
      `"${products.length} Jenis Produk"`,
      '""',
      '""',
      '""',
      '""',
      sumStock,
      '""',
      '""',
      sumNilaiModal,
      sumPotensiOmzet,
      '""'
    ]
  ];

  const csvContent = [
    ...metaRows.map(r => r.join(',')),
    headers.join(','),
    ...rows.map(r => r.join(',')),
    ...summaryRows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Stok_${storeTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
