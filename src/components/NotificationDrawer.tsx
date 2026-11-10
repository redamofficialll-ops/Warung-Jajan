import React from 'react';
import { NotificationItem } from '../types.ts';
import { Bell, CheckCheck, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface NotificationDrawerProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-theme-primary" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pemberitahuan Aktivitas</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-xs text-theme-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandai Dibaca</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-10 h-10 mx-auto stroke-1 mb-2 opacity-50" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Tidak ada notifikasi baru
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const isWarning = n.type === 'warning' || n.type === 'alert';
              const isSuccess = n.type === 'success';

              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-2xl border transition ${
                    !n.isRead
                      ? 'bg-theme-soft border-theme'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                      ) : isSuccess ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Info className="w-4 h-4 text-theme-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {n.title}
                        </h4>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-theme-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        {new Date(n.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
