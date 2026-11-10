import React, { useState } from 'react';
import { CashierUser } from '../types.ts';
import { sound } from '../utils/audio.ts';
import { ShieldCheck, UserCheck, Delete, ArrowRight, Lock } from 'lucide-react';

interface PinLoginModalProps {
  cashiers: CashierUser[];
  onLoginSuccess: (user: CashierUser) => void;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({ cashiers, onLoginSuccess }) => {
  const [selectedUser, setSelectedUser] = useState<CashierUser>(cashiers[0]);
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const handleKeyPress = (digit: string) => {
    sound.playTap();
    setErrorMsg('');
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === selectedUser.pin.length) {
        verifyPin(newPin, selectedUser);
      }
    }
  };

  const handleBackspace = () => {
    sound.playTap();
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    sound.playTap();
    setPin('');
    setErrorMsg('');
  };

  const verifyPin = (enteredPin: string, user: CashierUser) => {
    if (enteredPin === user.pin) {
      sound.playSuccess();
      onLoginSuccess(user);
    } else {
      sound.playWarning();
      setIsShaking(true);
      setErrorMsg('PIN yang Anda masukkan salah. Silakan coba lagi.');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 600);
    }
  };

  const handleQuickLogin = (user: CashierUser) => {
    sound.playSuccess();
    onLoginSuccess(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className={`w-full max-w-md my-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all ${isShaking ? 'animate-shake' : ''}`}>
        
        {/* Header */}
        <div className="bg-theme-gradient px-6 py-6 text-white text-center">
          <div className="mx-auto w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Kunci Akses Kasir (PIN)</h2>
          <p className="text-xs text-white/80 mt-1">Pilih profil kasir dan masukkan PIN untuk membuka terminal kasir</p>
        </div>

        <div className="p-6">
          {/* Cashier Selector Tabs */}
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 text-center">
            Pilih Petugas Kasir
          </label>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {cashiers.map((cashier) => {
              const isSelected = selectedUser.id === cashier.id;
              return (
                <button
                  key={cashier.id}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setSelectedUser(cashier);
                    setPin('');
                    setErrorMsg('');
                  }}
                  className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'border-theme bg-theme-soft shadow-sm ring-1 ring-theme'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-1.5 shadow-sm ${cashier.avatarColor}`}>
                    {cashier.name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate w-full">
                    {cashier.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {cashier.role}
                  </span>
                  {isSelected && (
                    <span className="mt-1 text-[10px] font-mono font-bold text-theme-primary">
                      PIN: {cashier.pin}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* PIN Dots Indicator */}
          <div className="flex justify-center items-center gap-3 mb-6">
            {Array.from({ length: selectedUser.pin.length }).map((_, idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  idx < pin.length
                    ? 'bg-theme-primary scale-110 shadow-md ring-4 ring-theme'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-500 text-center font-medium mb-4 animate-pulse">
              {errorMsg}
            </p>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xl hover:bg-theme-soft active:scale-95 transition-all shadow-sm"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium text-xs uppercase tracking-wider active:scale-95 transition-all"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xl hover:bg-theme-soft active:scale-95 transition-all shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-950/40 active:scale-95 transition-all"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Login Shortcut for Convenience */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={() => handleQuickLogin(selectedUser)}
              className="inline-flex items-center gap-1.5 text-xs text-theme-primary font-semibold hover:underline"
            >
              <UserCheck className="w-4 h-4" />
              <span>Masuk Langsung sebagai {selectedUser.name} (Bypass)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
