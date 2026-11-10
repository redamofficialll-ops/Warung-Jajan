import { ThemePalette } from '../types.ts';

export interface ThemeClasses {
  id: ThemePalette;
  name: string;
  desc: string;
  previewColor: string; // for color circle preview
  // Tailwind class strings
  bgPrimary: string;
  bgHover: string;
  bgGradient: string;
  textPrimary: string;
  textDark: string;
  borderPrimary: string;
  bgSoft: string;
  textSoft: string;
  ring: string;
  shadow: string;
  // Raw Hex
  hexPrimary: string;
  hexAccent: string;
  hexSoftBg: string;
}

export const THEME_CONFIGS: Record<ThemePalette, ThemeClasses> = {
  amber: {
    id: 'amber',
    name: 'Street Food Amber',
    desc: 'Hangat & menggugah selera camilan',
    previewColor: '#f59e0b',
    bgPrimary: 'bg-amber-500',
    bgHover: 'hover:bg-amber-600',
    bgGradient: 'bg-gradient-to-r from-amber-500 to-orange-600',
    textPrimary: 'text-amber-600 dark:text-amber-400',
    textDark: 'text-amber-800 dark:text-amber-200',
    borderPrimary: 'border-amber-500',
    bgSoft: 'bg-amber-50 dark:bg-amber-950/40',
    textSoft: 'text-amber-700 dark:text-amber-300',
    ring: 'focus:ring-amber-500 ring-amber-500/20',
    shadow: 'shadow-orange-500/20',
    hexPrimary: '#f59e0b',
    hexAccent: '#ea580c',
    hexSoftBg: 'rgba(245, 158, 11, 0.12)',
  },
  emerald: {
    id: 'emerald',
    name: 'Matcha Green',
    desc: 'Segar & tenang khas kafe modern',
    previewColor: '#10b981',
    bgPrimary: 'bg-emerald-600',
    bgHover: 'hover:bg-emerald-700',
    bgGradient: 'bg-gradient-to-r from-emerald-600 to-teal-700',
    textPrimary: 'text-emerald-600 dark:text-emerald-400',
    textDark: 'text-emerald-800 dark:text-emerald-200',
    borderPrimary: 'border-emerald-500',
    bgSoft: 'bg-emerald-50 dark:bg-emerald-950/40',
    textSoft: 'text-emerald-700 dark:text-emerald-300',
    ring: 'focus:ring-emerald-500 ring-emerald-500/20',
    shadow: 'shadow-emerald-600/20',
    hexPrimary: '#10b981',
    hexAccent: '#059669',
    hexSoftBg: 'rgba(16, 185, 129, 0.12)',
  },
  cyan: {
    id: 'cyan',
    name: 'Cyber Neon POS',
    desc: 'Kontras tinggi, modern & futuristik',
    previewColor: '#06b6d4',
    bgPrimary: 'bg-cyan-500',
    bgHover: 'hover:bg-cyan-600',
    bgGradient: 'bg-gradient-to-r from-cyan-500 to-blue-600',
    textPrimary: 'text-cyan-600 dark:text-cyan-400',
    textDark: 'text-cyan-800 dark:text-cyan-200',
    borderPrimary: 'border-cyan-500',
    bgSoft: 'bg-cyan-50 dark:bg-cyan-950/40',
    textSoft: 'text-cyan-700 dark:text-cyan-300',
    ring: 'focus:ring-cyan-500 ring-cyan-500/20',
    shadow: 'shadow-cyan-500/20',
    hexPrimary: '#06b6d4',
    hexAccent: '#0284c7',
    hexSoftBg: 'rgba(6, 182, 212, 0.12)',
  },
  purple: {
    id: 'purple',
    name: 'Berry Grape',
    desc: 'Elegan & eksklusif',
    previewColor: '#a855f7',
    bgPrimary: 'bg-purple-600',
    bgHover: 'hover:bg-purple-700',
    bgGradient: 'bg-gradient-to-r from-purple-600 to-indigo-700',
    textPrimary: 'text-purple-600 dark:text-purple-400',
    textDark: 'text-purple-800 dark:text-purple-200',
    borderPrimary: 'border-purple-500',
    bgSoft: 'bg-purple-50 dark:bg-purple-950/40',
    textSoft: 'text-purple-700 dark:text-purple-300',
    ring: 'focus:ring-purple-500 ring-purple-500/20',
    shadow: 'shadow-purple-600/20',
    hexPrimary: '#a855f7',
    hexAccent: '#7c3aed',
    hexSoftBg: 'rgba(168, 85, 247, 0.12)',
  },
  coffee: {
    id: 'coffee',
    name: 'Kopi & Cokelat',
    desc: 'Earthy, rustic & otentik',
    previewColor: '#92400e',
    bgPrimary: 'bg-amber-800',
    bgHover: 'hover:bg-amber-900',
    bgGradient: 'bg-gradient-to-r from-amber-800 to-stone-900',
    textPrimary: 'text-amber-800 dark:text-amber-300',
    textDark: 'text-amber-950 dark:text-amber-100',
    borderPrimary: 'border-amber-800',
    bgSoft: 'bg-amber-100/60 dark:bg-amber-950/40',
    textSoft: 'text-amber-900 dark:text-amber-200',
    ring: 'focus:ring-amber-800 ring-amber-800/20',
    shadow: 'shadow-amber-900/20',
    hexPrimary: '#92400e',
    hexAccent: '#78350f',
    hexSoftBg: 'rgba(146, 64, 14, 0.14)',
  },
};

export function getThemeClasses(theme: ThemePalette): ThemeClasses {
  return THEME_CONFIGS[theme] || THEME_CONFIGS.amber;
}

export function applyThemeToDOM(theme: ThemePalette, isDarkMode: boolean) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;
  const cfg = THEME_CONFIGS[theme] || THEME_CONFIGS.amber;

  root.setAttribute('data-theme', theme);
  if (body) {
    body.setAttribute('data-theme', theme);
  }

  // Set standard CSS variables directly on root
  root.style.setProperty('--theme-primary', cfg.hexPrimary);
  root.style.setProperty('--theme-primary-hover', cfg.hexAccent);
  root.style.setProperty('--theme-accent', cfg.hexAccent);
  root.style.setProperty('--theme-soft-bg', cfg.hexSoftBg);
  root.style.setProperty('--theme-border', cfg.hexPrimary);
  root.style.setProperty('--theme-ring', cfg.hexSoftBg);
  root.style.setProperty(
    '--theme-soft-text',
    isDarkMode ? cfg.hexPrimary : cfg.hexAccent
  );

  // Dispatch custom event for any listener that needs manual sync
  try {
    window.dispatchEvent(new CustomEvent('snackpos-theme-changed', { detail: { theme, isDarkMode, cfg } }));
  } catch (_) {}
}

