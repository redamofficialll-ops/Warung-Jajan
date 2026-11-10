import React, { useState, useMemo } from 'react';
import { CartItem, CashierUser, Customer, PaymentMethod, Product, StoreSettings, Transaction } from '../types.ts';
import { formatCurrency } from '../utils/bluetoothPrinter.ts';
import { sound } from '../utils/audio.ts';
import confetti from 'canvas-confetti';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  ShoppingBag, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Wallet, 
  Receipt, 
  CheckCircle2, 
  Tag, 
  Sparkles,
  Edit3,
  Coins,
  X
} from 'lucide-react';

interface PosViewProps {
  products: Product[];
  customers: Customer[];
  currentUser: CashierUser;
  settings: StoreSettings;
  onCompleteSale: (transaction: Transaction) => void;
  onOpenReceipt: (transaction: Transaction) => void;
  onNotify: (title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert') => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  customers,
  currentUser,
  settings,
  onCompleteSale,
  onOpenReceipt,
  onNotify,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountType, setDiscountType] = useState<number>(0); // Flat discount in Rp
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [isEditingNoteId, setIsEditingNoteId] = useState<string | null>(null);
  const [itemNoteText, setItemNoteText] = useState<string>('');
  const [isEditingPriceId, setIsEditingPriceId] = useState<string | null>(null);
  const [itemPriceText, setItemPriceText] = useState<string>('');
  const [editingPriceItem, setEditingPriceItem] = useState<CartItem | null>(null);
  const [modalPriceInput, setModalPriceInput] = useState<string>('');

  const categories = [
    'Semua',
    'Makanan',
    'Minuman',
  ];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.customPrice !== undefined ? item.customPrice : item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [cart]);

  const discountAmount = Math.min(subtotal, discountType);
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const changeAmount = paymentMethod === 'tunai' ? Math.max(0, cashPaid - totalAmount) : 0;

  // Add Product to Cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      sound.playWarning();
      onNotify('Stok Habis!', `Produk "${product.name}" sedang habis stoknya.`, 'warning');
      return;
    }

    sound.playAddToCart();
    const newCartItemId = `${product.id}-${Date.now()}`;
    const newItem: CartItem = {
      product,
      quantity: 1,
      customPrice: 0,
      cartItemId: newCartItemId,
    };

    setCart((prev) => [...prev, newItem]);
    
    // Automatically trigger custom price input modal
    setEditingPriceItem(newItem);
    setModalPriceInput('');
  };

  const handleOpenPriceModal = (item: CartItem) => {
    sound.playTap();
    setEditingPriceItem(item);
    const effectivePrice = item.customPrice !== undefined ? item.customPrice : item.product.price;
    setModalPriceInput(effectivePrice === 0 ? '' : String(effectivePrice));
  };

  const handleSaveModalPrice = (overrideValue?: number) => {
    if (!editingPriceItem) return;
    sound.playTap();
    const val = overrideValue !== undefined ? overrideValue : Number(modalPriceInput.replace(/[^0-9]/g, ''));
    const finalPrice = isNaN(val) || val < 0 ? 0 : val;

    setCart((prev) =>
      prev.map((it) =>
        it.cartItemId === editingPriceItem.cartItemId ? { ...it, customPrice: finalPrice } : it
      )
    );

    onNotify(
      'Harga Diatur!',
      `Harga "${editingPriceItem.product.name}" diatur ke ${formatCurrency(finalPrice)}.`,
      'success'
    );
    setEditingPriceItem(null);
    setModalPriceInput('');
  };

  // Update item quantity
  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    sound.playTap();
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              sound.playWarning();
              onNotify('Batas Stok!', `Maksimal stok tersedia: ${item.product.stock}.`, 'warning');
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    sound.playTap();
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleSaveItemNote = (cartItemId: string) => {
    sound.playTap();
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, note: itemNoteText } : item
      )
    );
    setIsEditingNoteId(null);
    setItemNoteText('');
  };

  // Checkout Open
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    sound.playTap();
    setCashPaid(totalAmount); // Default to exact amount
    setIsCheckoutOpen(true);
  };

  // Complete Payment & Save Transaction
  const handleConfirmPayment = () => {
    if (paymentMethod === 'tunai' && cashPaid < totalAmount) {
      sound.playWarning();
      onNotify('Uang Kurang!', 'Jumlah uang tunai yang dibayarkan kurang dari total belanja.', 'warning');
      return;
    }

    sound.playKaching();

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {}

    const invoiceNo = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTransaction: Transaction = {
      id: `trx-${Date.now()}`,
      invoiceNo,
      cashierName: currentUser.name,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      items: cart.map((c) => {
        const effectivePrice = c.customPrice !== undefined ? c.customPrice : c.product.price;
        return {
          productId: c.product.id,
          productName: c.product.name,
          quantity: c.quantity,
          price: effectivePrice,
          hpp: c.product.hpp,
          subtotal: effectivePrice * c.quantity,
          note: c.note,
        };
      }),
      subtotal,
      discount: discountAmount,
      tax: 0,
      totalAmount,
      paymentMethod,
      cashPaid: paymentMethod === 'tunai' ? cashPaid : totalAmount,
      change: changeAmount,
      createdAt: new Date().toISOString(),
      status: 'lunas',
      isSynced: false,
    };

    onCompleteSale(newTransaction);
    setIsCheckoutOpen(false);
    setCart([]);
    setSelectedCustomer(null);
    setDiscountType(0);

    onNotify('Transaksi Berhasil!', `Penjualan ${invoiceNo} sebesar ${formatCurrency(totalAmount)} telah tercatat.`, 'success');

    // Automatically open thermal receipt for immediate print or preview
    onOpenReceipt(newTransaction);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 md:gap-4 lg:gap-6 items-start">
        
        {/* Left Column: Product Catalog & Search (7 Cols on Tablet, 8 Cols on Desktop) */}
        <div className="md:col-span-7 lg:col-span-7 xl:col-span-8 space-y-3.5 md:space-y-4">
          
          {/* Top Bar: Search Menu Jajanan */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari jajanan (Cireng, Es Kopi, Risol, Seblak...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-theme shadow-sm"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-theme-primary text-white shadow-sm shadow-theme'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock <= product.minStock && product.stock > 0;
              const isOutOfStock = product.stock <= 0;
              const inCartCount = cart.find((i) => i.product.id === product.id)?.quantity || 0;

              return (
                <div
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between select-none touch-manipulation ${
                    isOutOfStock
                      ? 'opacity-60 border-slate-200 dark:border-slate-800 pointer-events-none'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-theme hover:shadow-md active:scale-[0.98]'
                  }`}
                >
                  <div>
                    {/* Badge Category & Favorite Indicator */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {product.category.split('&')[0]}
                      </span>
                      {product.isFavorite && (
                        <Sparkles className="w-3.5 h-3.5 text-theme-primary shrink-0" />
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  {/* Price, Stock & Add Button */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between gap-2">
                    <div>
                      {/* Price hidden as requested */}
                      <div className="text-xs sm:text-sm font-extrabold text-theme-primary font-mono hidden">
                        {formatCurrency(product.price)}
                      </div>
                      <div className="text-[10px] mt-0.5">
                        {isOutOfStock ? (
                          <span className="text-rose-500 font-semibold">Habis</span>
                        ) : isLowStock ? (
                          <span className="text-theme-primary font-medium">Sisa {product.stock} {product.unit}</span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">Stok {product.stock} {product.unit}</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Add Pill */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                      inCartCount > 0
                        ? 'bg-theme-primary text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-theme-primary group-hover:text-white'
                    }`}>
                      {inCartCount > 0 ? inCartCount : <Plus className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tidak ada jajanan ditemukan
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Coba kata kunci lain atau pilih kategori Semua.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Active Cart / Keranjang (5 Cols on Tablet, 4-5 Cols on Desktop) */}
        <div className="md:col-span-5 lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[calc(100vh-5.5rem)] sticky top-18 md:top-20 overflow-hidden">
          
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-theme-soft text-theme-primary flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Keranjang Kasir</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {cart.length} menu dipilih
                </p>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setCart([]);
                }}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Customer Selection Bar */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {selectedCustomer ? (
                <div className="truncate">
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {selectedCustomer.name}
                  </span>
                  <span className="text-[10px] text-theme-primary ml-1.5 font-medium">
                    ({selectedCustomer.points} Poin)
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Pelanggan Umum</span>
              )}
            </div>

            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                sound.playTap();
                const found = customers.find((c) => c.id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:border-theme max-w-[140px]"
            >
              <option value="">+ Pilih Member</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingBag className="w-12 h-12 stroke-1 mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Keranjang masih kosong
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik menu jajanan di sebelah kiri untuk menambah ke pesanan.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const effectivePrice = item.customPrice !== undefined ? item.customPrice : item.product.price;

                return (
                  <div
                    key={item.cartItemId}
                    className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {item.product.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPriceModal(item)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-all shadow-xs border ${
                              effectivePrice === 0
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                : 'bg-theme-soft text-theme-primary border-theme/30 hover:border-theme'
                            }`}
                            title="Klik untuk ubah harga sesuai permintaan pembeli"
                          >
                            <span>{effectivePrice === 0 ? 'Input Harga (Rp 0)' : formatCurrency(effectivePrice)}</span>
                            <Edit3 className="w-3 h-3 opacity-80" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-slate-900 dark:text-white font-mono shrink-0">
                        {formatCurrency(effectivePrice * item.quantity)}
                      </div>
                    </div>

                    {/* Edit Price Input */}
                    {isEditingPriceId === item.cartItemId && (
                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="number"
                          min="0"
                          value={itemPriceText}
                          onChange={(e) => setItemPriceText(e.target.value)}
                          placeholder="Harga baru (Rp)..."
                          className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-theme bg-white dark:bg-slate-900 font-mono focus:outline-none text-slate-900 dark:text-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            sound.playTap();
                            const val = Number(itemPriceText);
                            setCart((prev) =>
                              prev.map((it) =>
                                it.cartItemId === item.cartItemId
                                  ? { ...it, customPrice: isNaN(val) ? 0 : val }
                                  : it
                              )
                            );
                            setIsEditingPriceId(null);
                          }}
                          className="px-2.5 py-1.5 bg-theme-primary text-white rounded-lg text-[10px] font-bold shadow-xs"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playTap();
                            setCart((prev) =>
                              prev.map((it) =>
                                it.cartItemId === item.cartItemId ? { ...it, customPrice: 0 } : it
                              )
                            );
                            setIsEditingPriceId(null);
                          }}
                          className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-semibold"
                          title="Kosongkan harga (Rp 0)"
                        >
                          Rp 0
                        </button>
                      </div>
                    )}

                    {/* Quantity Stepper & Note Toggle */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.cartItemId, -1)}
                          className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.cartItemId, 1)}
                          className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingNoteId(item.cartItemId);
                            setItemNoteText(item.note || '');
                          }}
                          className="text-[10px] text-slate-500 hover:text-theme-primary flex items-center gap-1"
                          title="Catatan pesanan"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{item.note ? 'Ubah Catatan' : '+ Catatan'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.cartItemId)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Display Note */}
                    {item.note && isEditingNoteId !== item.cartItemId && (
                      <div className="text-[10px] bg-theme-soft text-theme-soft px-2 py-0.5 rounded-md italic">
                        "{item.note}"
                      </div>
                    )}

                    {/* Edit Note Input */}
                    {isEditingNoteId === item.cartItemId && (
                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          value={itemNoteText}
                          onChange={(e) => setItemNoteText(e.target.value)}
                          placeholder="Contoh: Bumbu pedas dipisah..."
                          className="flex-1 text-[11px] px-2 py-1 rounded-md border border-theme bg-white dark:bg-slate-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveItemNote(item.cartItemId)}
                          className="px-2 py-1 bg-theme-primary text-white rounded-md text-[10px] font-semibold"
                        >
                          Simpan
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

          </div>

          {/* Cart Footer & Checkout Action */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 space-y-3">
            
            {/* Quick Discount Buttons */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Diskon
              </span>
              <div className="flex gap-1">
                {[0, 2000, 5000].map((disc) => (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setDiscountType(disc);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                      discountType === disc
                        ? 'bg-theme-primary text-white shadow-sm'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {disc === 0 ? '0' : `-${formatCurrency(disc)}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-500 font-semibold">
                  <span>Diskon Promo</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Total Bayar</span>
                <span className="font-mono text-base text-theme-primary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Main Checkout Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                cart.length === 0
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-theme-gradient text-white active:scale-95 shadow-theme'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Bayar {formatCurrency(totalAmount)}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Mobile Floating Cart Summary (Only below md breakpoint when cart has items) */}
      {cart.length > 0 && (
        <div className="md:hidden fixed bottom-16 left-3 right-3 z-30 bg-slate-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-2 border border-slate-700 dark:border-slate-200">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-7 h-7 rounded-lg bg-theme-primary text-white flex items-center justify-center font-bold">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
            <div>
              <div className="font-semibold text-[11px] leading-tight text-slate-300 dark:text-slate-600">Pesanan Aktif</div>
              <div className="font-mono font-extrabold text-sm text-theme-primary">{formatCurrency(totalAmount)}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setIsCheckoutOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-theme-gradient text-white text-xs font-bold shadow-md shadow-theme active:scale-95 transition flex items-center gap-1.5"
          >
            <Banknote className="w-4 h-4" />
            <span>Bayar</span>
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-theme-gradient text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Penyelesaian Pembayaran</h3>
                <p className="text-xs text-white/80">Pilih metode bayar & hitung uang kembalian</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/80 uppercase">Total Tagihan</span>
                <div className="text-lg font-extrabold font-mono">{formatCurrency(totalAmount)}</div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'tunai', label: 'Tunai', icon: <Banknote className="w-4 h-4" /> },
                    { id: 'qris', label: 'QRIS', icon: <QrCode className="w-4 h-4" /> },
                    { id: 'transfer', label: 'Transfer', icon: <CreditCard className="w-4 h-4" /> },
                    { id: 'ewallet', label: 'E-Wallet', icon: <Wallet className="w-4 h-4" /> },
                    { id: 'kasbon', label: 'Kasbon', icon: <Receipt className="w-4 h-4" /> },
                  ].map((m) => {
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setPaymentMethod(m.id as PaymentMethod);
                        }}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition ${
                          isSelected
                            ? 'border-theme bg-theme-soft text-theme-primary font-bold shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {m.icon}
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Calculation UI (if Tunai selected) */}
              {paymentMethod === 'tunai' && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Uang Diterima:</span>
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                      {formatCurrency(cashPaid)}
                    </span>
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { label: 'Uang Pas', val: totalAmount },
                      { label: '10.000', val: 10000 },
                      { label: '20.000', val: 20000 },
                      { label: '50.000', val: 50000 },
                      { label: '100.000', val: 100000 },
                    ].map((btn, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setCashPaid(btn.val);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                          cashPaid === btn.val
                            ? 'bg-theme-primary text-white border-transparent shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Change Indicator */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Kembalian:</span>
                    <span className={`font-mono text-base font-extrabold ${
                      cashPaid < totalAmount ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {cashPaid < totalAmount
                        ? `Kurang ${formatCurrency(totalAmount - cashPaid)}`
                        : formatCurrency(changeAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* QRIS Display (if QRIS selected) */}
              {paymentMethod === 'qris' && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                    <QrCode className="w-28 h-28 text-slate-900" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Scan QRIS via BCA, GoPay, OVO, ShopeePay, Dana
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Total: <span className="font-bold text-theme-primary">{formatCurrency(totalAmount)}</span> (NMID: ID1029384756)
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Batal / Kembali
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={paymentMethod === 'tunai' && cashPaid < totalAmount}
                  className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition ${
                    paymentMethod === 'tunai' && cashPaid < totalAmount
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Pembayaran</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Modal Input Harga Sesuai Keinginan Pembeli */}
      {editingPriceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-theme-gradient text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Input Harga Pembeli</h3>
                  <p className="text-[11px] text-white/80 line-clamp-1">{editingPriceItem.product.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPriceItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Masukkan Nominal Sesuai Kesepakatan Pembeli:
                </span>
                
                <div className="relative max-w-xs mx-auto mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={modalPriceInput}
                    onChange={(e) => setModalPriceInput(e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-theme text-2xl font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-theme/20 text-center shadow-inner"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveModalPrice();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Preset Nominal Buttons */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">
                  Pilihan Cepat Nominal Jajanan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Rp 5.000', val: 5000 },
                    { label: 'Rp 10.000', val: 10000 },
                    { label: 'Rp 12.000', val: 12000 },
                    { label: 'Rp 15.000', val: 15000 },
                    { label: 'Rp 20.000', val: 20000 },
                    { label: 'Rp 25.000', val: 25000 },
                    { label: 'Rp 50.000', val: 50000 },
                    { label: 'Gratis (Rp 0)', val: 0 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setModalPriceInput(String(preset.val));
                      }}
                      className="py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono hover:bg-theme-soft hover:border-theme hover:text-theme-primary transition active:scale-95"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPriceItem(null)}
                  className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveModalPrice()}
                  className="py-3 rounded-xl bg-theme-gradient text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-theme shadow-md active:scale-95 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Harga</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
