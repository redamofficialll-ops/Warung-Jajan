import React, { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) return null;

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstallClick}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl bg-theme-gradient px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-theme transition active:scale-95"
      >
        <Download className="w-4 h-4" />
        <span>Install Aplikasi POS</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-md"
        >
          <Smartphone className="w-4 h-4 text-theme-primary" />
          <span>Install di iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pasang SnackPOS di iPhone / iPad
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                1. Buka browser Safari lalu tekan tombol <strong>Bagikan (Share)</strong> di bagian bawah.<br />
                2. Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-theme-primary bg-theme-primary-hover py-2.5 text-xs font-bold text-white shadow-sm shadow-theme transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
