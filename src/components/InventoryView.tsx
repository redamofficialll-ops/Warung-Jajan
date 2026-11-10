import React, { useState, useMemo } from 'react';
import { Product, ProductCategory, StoreSettings } from '../types.ts';
import { formatCurrency } from '../utils/bluetoothPrinter.ts';
import { exportInventoryPDF } from '../utils/pdfExport.ts';
import { exportInventoryExcel } from '../utils/excelExport.ts';
import { sound } from '../utils/audio.ts';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Download, 
  FileText, 
  TrendingUp, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Check, 
  X 
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  settings: StoreSettings;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onQuickRestock: (productId: string, addQty: number) => void;
  onNotify: (title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert') => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  settings,
  onSaveProduct,
  onDeleteProduct,
  onQuickRestock,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('Semua');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    category: 'Makanan',
    price: 15000,
    hpp: 8000,
    stock: 20,
    minStock: 5,
    unit: 'Porsi',
    barcode: '',
    description: '',
    isFavorite: false,
  });

  const categories: ProductCategory[] = [
    'Makanan',
    'Minuman',
  ];

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCat === 'Semua' || p.category === selectedCat;
      const matchLow = !showLowStockOnly || p.stock <= p.minStock;
      return matchSearch && matchCat && matchLow;
    });
  }, [products, searchQuery, selectedCat, showLowStockOnly]);

  // Inventory Totals
  const totalStockItems = products.reduce((sum, p) => sum + p.stock, 0);
  const totalNilaiModal = products.reduce((sum, p) => sum + p.hpp * p.stock, 0);
  const totalPotensiOmzet = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const handleOpenAddModal = () => {
    sound.playTap();
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Makanan',
      price: 15000,
      hpp: 8000,
      stock: 25,
      minStock: 5,
      unit: 'Porsi',
      barcode: `899${Math.floor(1000 + Math.random() * 9000)}`,
      description: '',
      isFavorite: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    sound.playTap();
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      price: p.price,
      hpp: p.hpp,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      barcode: p.barcode || '',
      description: p.description || '',
      isFavorite: p.isFavorite || false,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    sound.playSuccess();
    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      ...formData,
    };

    onSaveProduct(productToSave);
    setIsModalOpen(false);
    onNotify(
      'Stok Diperbarui',
      `Produk "${productToSave.name}" berhasil ${editingProduct ? 'diperbarui' : 'ditambahkan'}.`,
      'success'
    );
  };

  const handleConfirmRestock = () => {
    if (!restockProductId || restockQty <= 0) return;
    sound.playSuccess();
    onQuickRestock(restockProductId, restockQty);
    setRestockProductId(null);
    onNotify('Restock Berhasil', `Tambah stok +${restockQty} unit berhasil disimpan.`, 'success');
  };

  const handleExportCSV = () => {
    sound.playTap();
    exportInventoryExcel(products, settings);
    onNotify('Ekspor Sukses', 'Daftar stok berhasil diekspor ke format Excel (.CSV).', 'info');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
      
      {/* Top Banner & Stats Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Kelola Stok & Inventori Jajanan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor sisa barang, harga modal (HPP), keuntungan, dan restock cepat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={() => exportInventoryPDF(products, settings)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Cetak PDF</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theme-gradient text-white text-xs font-bold shadow-md shadow-theme active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jajanan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Menu Varian</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {products.length} <span className="text-xs font-normal text-slate-400">Varian</span>
          </div>
          <span className="text-[10px] text-slate-400">{totalStockItems} unit fisik total</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nilai Modal (HPP)</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(totalNilaiModal)}
          </div>
          <span className="text-[10px] text-slate-400">Total uang modal tertanam</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Potensi Omzet</span>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {formatCurrency(totalPotensiOmzet)}
          </div>
          <span className="text-[10px] text-emerald-600/80 font-medium">
            Margin laba {totalPotensiOmzet > 0 ? Math.round(((totalPotensiOmzet - totalNilaiModal) / totalPotensiOmzet) * 100) : 0}%
          </span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm transition ${
          lowStockCount > 0
            ? 'bg-theme-soft border-theme'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-theme-primary">Stok Menipis</span>
            {lowStockCount > 0 && <AlertTriangle className="w-4 h-4 text-theme-primary animate-pulse" />}
          </div>
          <div className="text-xl font-extrabold text-theme-primary mt-1 font-mono">
            {lowStockCount} <span className="text-xs font-normal">Perlu Restock</span>
          </div>
          <button
            type="button"
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className="text-[10px] font-semibold text-theme-primary hover:underline mt-0.5"
          >
            {showLowStockOnly ? 'Tampilkan Semua' : 'Filter Stok Menipis'}
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama menu jajanan..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:border-theme"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['Semua', ...categories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCat === cat
                  ? 'bg-theme-primary text-white font-semibold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Menu Jajanan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 font-mono">Modal (HPP)</th>
                <th className="py-3 px-4 font-mono">Harga Jual</th>
                <th className="py-3 px-4 font-mono">Margin Laba</th>
                <th className="py-3 px-4 text-center">Sisa Stok</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= p.minStock;
                const marginRp = p.price - p.hpp;
                const marginPct = p.price > 0 ? Math.round((marginRp / p.price) * 100) : 0;

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isLow ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {p.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {formatCurrency(p.hpp)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(marginRp)} ({marginPct}%)
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                        p.stock === 0
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : isLow
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                      }`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playTap();
                            setRestockProductId(p.id);
                            setRestockQty(10);
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold hover:bg-emerald-100 transition"
                          title="Tambah Stok Masuk"
                        >
                          + Restock
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1 rounded-lg text-slate-500 hover:text-theme-primary hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            sound.playTap();
                            setProductToDelete(p);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Hapus Menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in zoom-in-95">
            <div className="px-6 py-4 bg-theme-gradient text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingProduct ? 'Ubah Data Jajanan' : 'Tambah Menu Jajanan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Menu Jajanan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Pisang Keju Cokelat Lumer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-theme"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Porsi / Pcs / Cup"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Modal / HPP (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.hpp}
                    onChange={(e) => setFormData({ ...formData, hpp: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Jual Kasir (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Profit Margin Preview Card */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs flex justify-between items-center text-emerald-800 dark:text-emerald-300">
                <span>Estimasi Margin Bersih:</span>
                <span className="font-bold font-mono">
                  +{formatCurrency(formData.price - formData.hpp)} ({formData.price > 0 ? Math.round(((formData.price - formData.hpp) / formData.price) * 100) : 0}%)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stok Saat Ini
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Peringatan Minimum Stok
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-theme-primary text-white text-xs font-bold shadow-md shadow-theme"
                >
                  Simpan Jajanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Restock Modal */}
      {restockProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <RefreshCw className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Restock Cepat Barang Masuk</h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Pilih jumlah stok yang baru masuk dari dapur / supplier:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 20, 50, 100].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setRestockQty(qty)}
                  className={`py-2 rounded-xl text-xs font-bold font-mono border transition ${
                    restockQty === qty
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  +{qty}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestockProductId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
              >
                Tambah +{restockQty}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus Produk Jajanan */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 my-auto animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Menu Jajanan?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong className="text-slate-900 dark:text-white">"{productToDelete.name}"</strong> dari katalog inventori?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playWarning();
                  onDeleteProduct(productToDelete.id);
                  onNotify('Produk Dihapus', `Menu "${productToDelete.name}" telah dihapus dari katalog.`, 'info');
                  setProductToDelete(null);
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
