/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CashierUser, 
  Customer, 
  NotificationItem, 
  Product, 
  ShiftClosing, 
  StoreSettings, 
  Transaction 
} from './types.ts';
import { StorageService } from './utils/storage.ts';
import { sound } from './utils/audio.ts';
import { applyThemeToDOM } from './utils/theme.ts';
import { Header, ActiveTab } from './components/Header.tsx';
import { PosView } from './components/PosView.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { CustomersView } from './components/CustomersView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { PinLoginModal } from './components/PinLoginModal.tsx';
import { ThermalReceiptModal } from './components/ThermalReceiptModal.tsx';
import { ShiftClosingModal } from './components/ShiftClosingModal.tsx';
import { NotificationDrawer } from './components/NotificationDrawer.tsx';
import { PWAInstallButton } from './components/PWAInstallButton.tsx';

export default function App() {
  // App State
  const [currentUser, setCurrentUser] = useState<CashierUser | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cashiers, setCashiers] = useState<CashierUser[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(StorageService.getSettings());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  // Modals & UI Triggers
  const [activeReceiptTx, setActiveReceiptTx] = useState<Transaction | null>(null);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState<boolean>(false);
  const [isShiftClosingOpen, setIsShiftClosingOpen] = useState<boolean>(false);

  // Initialize Data
  useEffect(() => {
    const loadedProducts = StorageService.getProducts();
    const loadedTransactions = StorageService.getTransactions();
    const loadedCustomers = StorageService.getCustomers();
    const loadedCashiers = StorageService.getCashiers();
    const loadedSettings = StorageService.getSettings();
    const loadedNotifs = StorageService.getNotifications();
    const loadedUser = StorageService.getCurrentUser() || loadedCashiers[0];

    setProducts(loadedProducts);
    setTransactions(loadedTransactions);
    setCustomers(loadedCustomers);
    setCashiers(loadedCashiers);
    setSettings(loadedSettings);
    setNotifications(loadedNotifs);
    setCurrentUser(loadedUser);

    sound.setEnabled(loadedSettings.enableSound);

    // Apply theme & dark mode
    applyThemeToDOM(loadedSettings.theme, loadedSettings.isDarkMode);
    if (loadedSettings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Theme Toggler
  const handleToggleTheme = () => {
    sound.playTap();
    const updatedDark = !settings.isDarkMode;
    const updatedSettings = { ...settings, isDarkMode: updatedDark };
    setSettings(updatedSettings);
    StorageService.saveSettings(updatedSettings);
    applyThemeToDOM(settings.theme, updatedDark);

    if (updatedDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Add Notification Helper
  const handleNotify = (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'alert' = 'info'
  ) => {
    const newNotif = StorageService.addNotification({ title, message, type });
    setNotifications(StorageService.getNotifications());
  };

  // Complete a Sale
  const handleCompleteSale = (newTx: Transaction) => {
    StorageService.saveTransaction(newTx);
    setTransactions(StorageService.getTransactions());
    setProducts(StorageService.getProducts());
    setCustomers(StorageService.getCustomers());

    // Check for low stock warnings
    const updatedProducts = StorageService.getProducts();
    newTx.items.forEach((item) => {
      const p = updatedProducts.find((prod) => prod.id === item.productId);
      if (p && p.stock <= p.minStock && p.stock > 0) {
        handleNotify(
          'Stok Menipis!',
          `Menu "${p.name}" tersisa ${p.stock} ${p.unit}. Segera siapkan restock.`,
          'warning'
        );
      }
    });
  };

  // Void a transaction
  const handleVoidTransaction = (id: string) => {
    StorageService.updateTransactionStatus(id, 'batal');
    setTransactions(StorageService.getTransactions());
    setProducts(StorageService.getProducts());
  };

  // Clear all transactions
  const handleClearAllTransactions = () => {
    const emptyList = StorageService.clearAllTransactions();
    setTransactions(emptyList);
  };

  // Save Product
  const handleSaveProduct = (prod: Product) => {
    const list = products.filter((p) => p.id !== prod.id);
    list.unshift(prod);
    setProducts(list);
    StorageService.saveProducts(list);
  };

  const handleDeleteProduct = (id: string) => {
    sound.playWarning();
    const list = products.filter((p) => p.id !== id);
    setProducts(list);
    StorageService.saveProducts(list);
    handleNotify('Produk Dihapus', 'Menu jajanan telah dihapus dari inventori.', 'info');
  };

  // Update single product price
  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    const list = products.map((p) => (p.id === productId ? { ...p, price: newPrice } : p));
    setProducts(list);
    StorageService.saveProducts(list);
  };

  // Reset all product prices to 0 (open price)
  const handleResetAllPrices = () => {
    const list = products.map((p) => ({ ...p, price: 0 }));
    setProducts(list);
    StorageService.saveProducts(list);
    handleNotify('Semua Harga Dikosongkan', 'Semua jajanan disetel ke Harga Bebas (Rp 0). Anda dapat menentukan harga sesuai keinginan pembeli.', 'info');
  };

  const handleQuickRestock = (id: string, addQty: number) => {
    const list = products.map((p) =>
      p.id === id ? { ...p, stock: p.stock + addQty } : p
    );
    setProducts(list);
    StorageService.saveProducts(list);
  };

  // Save Customer
  const handleSaveCustomer = (cust: Customer) => {
    const list = customers.filter((c) => c.id !== cust.id);
    list.unshift(cust);
    setCustomers(list);
    StorageService.saveCustomers(list);
  };

  const handleDeleteCustomer = (id: string) => {
    sound.playWarning();
    const list = customers.filter((c) => c.id !== id);
    setCustomers(list);
    StorageService.saveCustomers(list);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    applyThemeToDOM(newSettings.theme, newSettings.isDarkMode);
    sound.setEnabled(newSettings.enableSound);
  };

  const handleSaveCashiers = (newCashiers: CashierUser[]) => {
    setCashiers(newCashiers);
    StorageService.saveCashiers(newCashiers);

    // If current logged in user was modified or deleted, update state
    if (currentUser) {
      const match = newCashiers.find((c) => c.id === currentUser.id);
      if (match) {
        setCurrentUser(match);
        StorageService.setCurrentUser(match);
      } else if (newCashiers.length > 0) {
        setCurrentUser(newCashiers[0]);
        StorageService.setCurrentUser(newCashiers[0]);
      } else {
        setCurrentUser(null);
        StorageService.setCurrentUser(null);
      }
    }
  };
  


  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLockScreen={() => {
          sound.playTap();
          setCurrentUser(null);
          StorageService.setCurrentUser(null);
        }}
        onOpenShiftClosing={() => {
          sound.playTap();
          setIsShiftClosingOpen(true);
        }}
        settings={settings}
        onToggleTheme={handleToggleTheme}
        unreadNotifsCount={unreadNotifsCount}
        onToggleNotifications={() => setIsNotifDrawerOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16 md:pb-6">
        {currentUser ? (
          <>
            {activeTab === 'pos' && (
              <PosView
                products={products}
                customers={customers}
                currentUser={currentUser}
                settings={settings}
                onCompleteSale={handleCompleteSale}
                onOpenReceipt={(tx) => setActiveReceiptTx(tx)}
                onNotify={handleNotify}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                products={products}
                settings={settings}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onQuickRestock={handleQuickRestock}
                onNotify={handleNotify}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                transactions={transactions}
                settings={settings}
                onOpenReceipt={(tx) => setActiveReceiptTx(tx)}
                onVoidTransaction={handleVoidTransaction}
                onClearAllTransactions={handleClearAllTransactions}
                onNotify={handleNotify}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                customers={customers}
                settings={settings}
                onSaveCustomer={handleSaveCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onNotify={handleNotify}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                cashiers={cashiers}
                onSaveSettings={handleSaveSettings}
                onSaveCashiers={handleSaveCashiers}
                onNotify={handleNotify}
              />
            )}
          </>
        ) : null}
      </main>

      {/* PIN Login Screen if locked */}
      {!currentUser && (
        <PinLoginModal
          cashiers={cashiers.length > 0 ? cashiers : StorageService.getCashiers()}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            StorageService.setCurrentUser(user);
            handleNotify('Login Berhasil', `Selamat bertugas, ${user.name}!`, 'success');
          }}
        />
      )}

      {/* Thermal Receipt Modal */}
      {activeReceiptTx && (
        <ThermalReceiptModal
          transaction={activeReceiptTx}
          settings={settings}
          onClose={() => setActiveReceiptTx(null)}
        />
      )}

      {/* Shift Closing (Tutup Kasir Selesai Berjualan) Modal */}
      {isShiftClosingOpen && currentUser && (
        <ShiftClosingModal
          isOpen={isShiftClosingOpen}
          onClose={() => setIsShiftClosingOpen(false)}
          currentUser={currentUser}
          settings={settings}
          transactions={transactions}
          onConfirmCloseShift={() => {
            setIsShiftClosingOpen(false);
            setCurrentUser(null);
            StorageService.setCurrentUser(null);
          }}
          onNotify={handleNotify}
        />
      )}

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        notifications={notifications}
        onClose={() => setIsNotifDrawerOpen(false)}
        onMarkAllRead={() => {
          sound.playTap();
          StorageService.markAllNotificationsRead();
          setNotifications(StorageService.getNotifications());
        }}
      />

      {/* PWA Install Button */}
      <PWAInstallButton />

    </div>
  );
}
