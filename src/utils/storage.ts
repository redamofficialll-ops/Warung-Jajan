import { CashierUser, Customer, NotificationItem, Product, ShiftClosing, StoreSettings, Transaction } from '../types.ts';

const STORAGE_KEYS = {
  PRODUCTS: 'snackpos_products_v5',
  TRANSACTIONS: 'snackpos_transactions_v6',
  CUSTOMERS: 'snackpos_customers_v1',
  CASHIERS: 'snackpos_cashiers_v1',
  SETTINGS: 'snackpos_settings_v3',
  NOTIFICATIONS: 'snackpos_notifications_v1',
  CURRENT_USER: 'snackpos_current_user_v1',
  OFFLINE_QUEUE: 'snackpos_offline_queue_v1',
  SHIFT_CLOSINGS: 'snackpos_shift_closings_v1',
  CURRENT_SHIFT_START: 'snackpos_current_shift_start_v1',
};

// Initial Snack Products (Open Price / Sesuai Keinginan Pembeli)
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Basreng Chili Oil',
    category: 'Makanan',
    price: 0,
    hpp: 8000,
    stock: 50,
    minStock: 10,
    unit: 'Bungkus',
    barcode: '8991001',
    description: 'Baso goreng dengan bumbu chili oil pedas gurih nagih.',
    isFavorite: true,
  },
  {
    id: 'prod-2',
    name: 'Otak Otak',
    category: 'Makanan',
    price: 0,
    hpp: 5000,
    stock: 40,
    minStock: 10,
    unit: 'Porsi',
    barcode: '8991002',
    description: 'Otak-otak ikan goreng disajikan dengan bumbu tabur atau saus.',
    isFavorite: true,
  },
  {
    id: 'prod-3',
    name: 'Sosis Goreng',
    category: 'Makanan',
    price: 0,
    hpp: 6000,
    stock: 30,
    minStock: 5,
    unit: 'Pcs',
    barcode: '8991003',
    description: 'Sosis sapi/ayam berkualitas digoreng mekar.',
    isFavorite: true,
  },
  {
    id: 'prod-4',
    name: 'Indomie',
    category: 'Makanan',
    price: 0,
    hpp: 4000,
    stock: 100,
    minStock: 20,
    unit: 'Porsi',
    barcode: '8991004',
    description: 'Indomie goreng/kuah dengan pilihan topping telur dan sayur.',
  },
  {
    id: 'prod-5',
    name: 'Mie Jebew',
    category: 'Makanan',
    price: 0,
    hpp: 9000,
    stock: 25,
    minStock: 5,
    unit: 'Porsi',
    barcode: '8991005',
    description: 'Mie pedas level dengan bumbu rahasia jebew.',
    isFavorite: true,
  },
  {
    id: 'prod-6',
    name: 'Keju Aroma',
    category: 'Makanan',
    price: 0,
    hpp: 7000,
    stock: 35,
    minStock: 8,
    unit: 'Porsi',
    barcode: '8991006',
    description: 'Kulit lumpia isi keju manis gurih digoreng renyah.',
  },
  {
    id: 'prod-7',
    name: 'Cilok Kuah',
    category: 'Makanan',
    price: 0,
    hpp: 6000,
    stock: 40,
    minStock: 10,
    unit: 'Porsi',
    barcode: '8991007',
    description: 'Cilok kenyal dengan kuah kaldu pedas hangat.',
  },
  {
    id: 'prod-8',
    name: 'Es Teh Manis',
    category: 'Minuman',
    price: 0,
    hpp: 2000,
    stock: 100,
    minStock: 10,
    unit: 'Cup',
    barcode: '8991008',
    description: 'Minuman teh segar dingin.',
  },
  {
    id: 'prod-9',
    name: 'Es Kopi Susu',
    category: 'Minuman',
    price: 0,
    hpp: 6000,
    stock: 50,
    minStock: 10,
    unit: 'Cup',
    barcode: '8991009',
    description: 'Kopi susu gula aren kekinian.',
  },
  {
    id: 'prod-10',
    name: 'Aneka tea jus',
    category: 'Minuman',
    price: 0,
    hpp: 3000,
    stock: 50,
    minStock: 10,
    unit: 'Cup',
    barcode: '8991010',
    description: 'Varian teh buah segar.',
  },
  {
    id: 'prod-11',
    name: 'Milo',
    category: 'Minuman',
    price: 0,
    hpp: 5000,
    stock: 40,
    minStock: 10,
    unit: 'Cup',
    barcode: '8991011',
    description: 'Minuman cokelat energi.',
  },
  {
    id: 'prod-12',
    name: 'Matcha',
    category: 'Minuman',
    price: 0,
    hpp: 6000,
    stock: 30,
    minStock: 10,
    unit: 'Cup',
    barcode: '8991012',
    description: 'Teh hijau jepang yang creamy.',
  },
  {
    id: 'prod-13',
    name: 'Teh Tarik',
    category: 'Minuman',
    price: 0,
    hpp: 5000,
    stock: 30,
    minStock: 10,
    unit: 'Cup',
    barcode: '8991013',
    description: 'Teh susu dengan busa melimpah.',
  },
  {
    id: 'prod-14',
    name: 'Good Day',
    category: 'Minuman',
    price: 0,
    hpp: 4000,
    stock: 40,
    minStock: 10,
    unit: 'Cup',
    barcode: '8991014',
    description: 'Kopi instan aneka rasa (Dingin).',
  },
  {
    id: 'prod-15',
    name: 'Good Day Hot',
    category: 'Minuman',
    price: 0,
    hpp: 4000,
    stock: 40,
    minStock: 10,
    unit: 'Cup',
    barcode: '8991015',
    description: 'Kopi instan aneka rasa (Panas).',
  },
];

// Preloaded Cashiers
export const INITIAL_CASHIERS: CashierUser[] = [
  {
    id: 'usr-owner',
    name: 'Mas Dimas (Owner)',
    role: 'owner',
    pin: '9999',
    avatarColor: 'bg-amber-600',
  },
  {
    id: 'usr-kasir-1',
    name: 'Budi Santoso',
    role: 'kasir',
    pin: '1234',
    avatarColor: 'bg-blue-600',
  },
  {
    id: 'usr-kasir-2',
    name: 'Siti Rahma',
    role: 'kasir',
    pin: '5678',
    avatarColor: 'bg-emerald-600',
  },
];

// Preloaded Customers
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Kak Dinda Kirana',
    phone: '081234567890',
    points: 140,
    totalSpent: 285000,
    transactionCount: 8,
    note: 'Langganan setia seblak pedas level 5 & pisang keju.',
    joinDate: '2026-08-14',
  },
  {
    id: 'cust-2',
    name: 'Mas Reza Fahlevi',
    phone: '085711223344',
    points: 80,
    totalSpent: 165000,
    transactionCount: 5,
    note: 'Suka pesan Basreng & Es Kopi Susu tiap sore.',
    joinDate: '2026-09-02',
  },
  {
    id: 'cust-3',
    name: 'Bu Rina Wijaya',
    phone: '081988776655',
    points: 210,
    totalSpent: 420000,
    transactionCount: 12,
    note: 'Sering pesan risol mayo beef untuk acara arisan.',
    joinDate: '2026-07-20',
  },
];

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'JAJANAN SULTAN & KULINER',
  slogan: 'Spesialis Camilan Hangat & Minuman Segar Kekinian',
  address: 'Jl. Boulevard Kuliner No. 88, Food Court Lt. 1',
  phone: '0812-9988-7766',
  receiptFooter: 'Terima kasih atas kunjungannya! Selamat menikmati camilannya ya kak :)',
  paperSize: '58mm',
  autoPrint: false,
  enableSound: true,
  theme: 'amber',
  isDarkMode: false,
};

export const StorageService = {
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        return INITIAL_PRODUCTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts(products: Product[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  clearAllTransactions(): Transaction[] {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    return [];
  },

  saveTransactions(transactions: Transaction[]) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  saveTransaction(trx: Transaction) {
    const list = this.getTransactions();
    list.unshift(trx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));

    // Deduct stock in products
    const products = this.getProducts();
    trx.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    });
    this.saveProducts(products);

    // Update customer stats if linked
    if (trx.customerId) {
      const customers = this.getCustomers();
      const cust = customers.find((c) => c.id === trx.customerId);
      if (cust) {
        cust.totalSpent += trx.totalAmount;
        cust.transactionCount += 1;
        // 1 point per Rp 10.000 spent
        cust.points += Math.floor(trx.totalAmount / 10000);
        this.saveCustomers(customers);
      }
    }

    // Queue for cloud sync if offline or enabled
    this.queueSync(trx);
  },

  updateTransactionStatus(id: string, status: 'lunas' | 'batal') {
    const list = this.getTransactions();
    const target = list.find((t) => t.id === id);
    if (target && target.status !== status) {
      target.status = status;
      // If voided, restore stock
      if (status === 'batal') {
        const products = this.getProducts();
        target.items.forEach((item) => {
          const prod = products.find((p) => p.id === item.productId);
          if (prod) {
            prod.stock += item.quantity;
          }
        });
        this.saveProducts(products);
      }
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
    }
  },

  getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
        return INITIAL_CUSTOMERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  saveCustomers(customers: Customer[]) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getCashiers(): CashierUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CASHIERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CASHIERS, JSON.stringify(INITIAL_CASHIERS));
        return INITIAL_CASHIERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CASHIERS;
    }
  },

  saveCashiers(cashiers: CashierUser[]) {
    localStorage.setItem(STORAGE_KEYS.CASHIERS, JSON.stringify(cashiers));
  },

  getSettings(): StoreSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: StoreSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getCurrentUser(): CashierUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: CashierUser | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // Notification Queue
  getNotifications(): NotificationItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!data) {
        const initialNotifs: NotificationItem[] = [
          {
            id: 'n-1',
            title: 'Sistem POS Siap Digunakan',
            message: 'Mode offline aktif. Semua transaksi otomatis tersimpan di memori perangkat.',
            type: 'info',
            timestamp: new Date().toISOString(),
            isRead: false,
          },
          {
            id: 'n-2',
            title: 'Peringatan Stok Menipis!',
            message: 'Basreng Pedas Daun Jeruk tersisa 4 bungkus (di bawah batas minimal 8 bungkus).',
            type: 'warning',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            isRead: false,
          },
        ];
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initialNotifs));
        return initialNotifs;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) {
    const list = this.getNotifications();
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    list.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list.slice(0, 30)));

    // Request native browser notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(item.title, {
          body: item.message,
          icon: '/pwa-192x192.png',
        });
      } catch {}
    }

    return newNotif;
  },

  markAllNotificationsRead() {
    const list = this.getNotifications();
    list.forEach((n) => (n.isRead = true));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  },

  // Offline Sync Queue
  getOfflineQueue(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  queueSync(trx: Transaction) {
    const queue = this.getOfflineQueue();
    queue.push(trx);
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },

  clearOfflineQueue() {
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  },

  // Shift Closings & Shift Tracking
  getCurrentShiftStart(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SHIFT_START);
      if (stored) return stored;
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Default to start of today
      const startOfDay = now.toISOString();
      localStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT_START, startOfDay);
      return startOfDay;
    } catch {
      return new Date().toISOString();
    }
  },

  setCurrentShiftStart(isoString: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT_START, isoString);
    } catch {}
  },

  getShiftClosings(): ShiftClosing[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHIFT_CLOSINGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveShiftClosing(closing: ShiftClosing) {
    try {
      const list = this.getShiftClosings();
      list.unshift(closing);
      localStorage.setItem(STORAGE_KEYS.SHIFT_CLOSINGS, JSON.stringify(list));
      // Reset next shift start time to now
      localStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT_START, new Date().toISOString());
    } catch {}
  },
};
