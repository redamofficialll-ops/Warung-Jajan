import React from 'react';
import { CashierUser, NotificationItem, StoreSettings } from '../types.ts';
import { sound } from '../utils/audio.ts';
import { 
  ShoppingBag, 
  Package, 
  BarChart3, 
  Users, 
  Settings, 
  Lock, 
  Moon, 
  Sun, 
  Bell,
  Store 
} from 'lucide-react';

export type ActiveTab = 'pos' | 'inventory' | 'reports' | 'customers' | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: CashierUser | null;
  onLockScreen: () => void;
  onOpenShiftClosing: () => void;
  settings: StoreSettings;
  onToggleTheme: () => void;
  unreadNotifsCount: number;
  onToggleNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLockScreen,
  onOpenShiftClosing,
  settings,
  onToggleTheme,
  unreadNotifsCount,
  onToggleNotifications,
}) => {
  const navItems: { id: ActiveTab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'pos', label: 'Kasir POS', shortLabel: 'Kasir', icon: <ShoppingBag className="w-4 h-4 shrink-0" /> },
    { id: 'inventory', label: 'Stok Barang', shortLabel: 'Stok', icon: <Package className="w-4 h-4 shrink-0" /> },
    { id: 'reports', label: 'Laporan & Omset', shortLabel: 'Laporan', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
    { id: 'customers', label: 'Pelanggan', shortLabel: 'Member', icon: <Users className="w-4 h-4 shrink-0" /> },
    { id: 'settings', label: 'Pengaturan', shortLabel: 'Pengaturan', icon: <Settings className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-theme-gradient flex items-center justify-center text-white shadow-md shadow-theme shrink-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
              Snack<span className="text-theme-primary">POS</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[100px] sm:max-w-[140px]">
              {settings.storeName}
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/50">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  sound.playTap();
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-theme-primary shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span className="hidden xl:inline">{item.label}</span>
                <span className="inline xl:hidden">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          

          {/* Notifications Trigger */}
          <button
            type="button"
            onClick={onToggleNotifications}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Pemberitahuan aktivitas"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Ganti Mode Gelap / Terang"
          >
            {settings.isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Cashier Badge & Lock Button */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {currentUser.role}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenShiftClosing}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold active:scale-95 shrink-0"
                title="Tutup Kasir & Rekap Penjualan Shift Selesai"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tutup Kasir</span>
              </button>

              <button
                type="button"
                onClick={onLockScreen}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-medium shrink-0"
                title="Kunci Kasir (Keluar ke layar PIN)"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Kunci</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-1.5 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                sound.playTap();
                setActiveTab(item.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-theme-primary text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
