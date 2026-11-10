export type ProductCategory = 
  | 'Semua'
  | 'Makanan'
  | 'Minuman';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;        // Harga Jual
  hpp: number;          // Harga Pokok Penjualan (Modal)
  stock: number;        // Stok fisik
  minStock: number;     // Batas peringatan stok menipis
  unit: string;         // Porsi, Pcs, Bungkus, Cup
  barcode?: string;
  image?: string;
  description?: string;
  isFavorite?: boolean;
}

export interface CartItem {
  cartItemId: string; // Tambahkan unique id untuk setiap item di keranjang
  product: Product;
  quantity: number;
  note?: string;
  customPrice?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  totalSpent: number;
  transactionCount: number;
  note?: string;
  joinDate: string;
}

export type PaymentMethod = 'tunai' | 'qris' | 'transfer' | 'ewallet' | 'kasbon';

export interface Transaction {
  id: string;
  invoiceNo: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    hpp: number;
    subtotal: number;
    note?: string;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  cashPaid: number;
  change: number;
  createdAt: string; // ISO string
  status: 'lunas' | 'batal';
  isSynced: boolean;
}

export interface CashierUser {
  id: string;
  name: string;
  role: 'owner' | 'kasir';
  pin: string;
  avatarColor: string;
}

export type ThemePalette = 'amber' | 'emerald' | 'cyan' | 'purple' | 'coffee';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
  isRead: boolean;
}

export interface StoreSettings {
  storeName: string;
  slogan: string;
  address: string;
  phone: string;
  receiptFooter: string;
  paperSize: '58mm' | '80mm';
  autoPrint: boolean;
  enableSound: boolean;
  theme: ThemePalette;
  isDarkMode: boolean;
}

export interface ShiftClosing {
  id: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt: string;
  totalTransactions: number;
  totalOmzet: number;
  cashSales: number;
  qrisSales: number;
  transferSales: number;
  ewalletSales: number;
  kasbonSales: number;
  actualCashInDrawer: number;
  expectedCashInDrawer: number;
  cashDifference: number; // actual - expected
  grossProfit: number;
  note?: string;
}

