import { useEffect, useState, useCallback } from 'react';

export type ThemeId = string;

export type Theme = {
  id: string;
  label: string;
  bg: string;
  surface: string;
  surfaceRing: string;
  text: string;
  subtext: string;
  accent: string;
  accentText: string;
};

export const THEMES: Theme[] = [
  { id: 'sky', label: 'スカイ', bg: '#f0f9ff', surface: '#ffffff', surfaceRing: 'rgba(148,163,184,0.25)', text: '#0f172a', subtext: '#475569', accent: '#0891b2', accentText: '#ffffff' },
  { id: 'sunset', label: 'サンセット', bg: '#fff7ed', surface: '#ffffff', surfaceRing: 'rgba(251,146,60,0.2)', text: '#431407', subtext: '#9a3412', accent: '#ea580c', accentText: '#ffffff' },
  { id: 'forest', label: 'フォレスト', bg: '#f0fdf4', surface: '#ffffff', surfaceRing: 'rgba(34,197,94,0.2)', text: '#052e16', subtext: '#166534', accent: '#16a34a', accentText: '#ffffff' },
  { id: 'lavender', label: 'ラベンダー', bg: '#faf5ff', surface: '#ffffff', surfaceRing: 'rgba(168,85,247,0.2)', text: '#3b0764', subtext: '#6b21a8', accent: '#9333ea', accentText: '#ffffff' },
  { id: 'rose', label: 'ローズ', bg: '#fff1f2', surface: '#ffffff', surfaceRing: 'rgba(244,63,94,0.2)', text: '#4c0519', subtext: '#9f1239', accent: '#e11d48', accentText: '#ffffff' },
  { id: 'ocean', label: 'オーシャン', bg: '#ecfeff', surface: '#ffffff', surfaceRing: 'rgba(6,182,212,0.2)', text: '#083344', subtext: '#155e75', accent: '#06b6d4', accentText: '#ffffff' },
  { id: 'midnight', label: 'ミッドナイト', bg: '#0f172a', surface: '#1e293b', surfaceRing: 'rgba(99,102,241,0.3)', text: '#e2e8f0', subtext: '#94a3b8', accent: '#6366f1', accentText: '#ffffff' },
  { id: 'dark-gray', label: 'ダークグレー', bg: '#18181b', surface: '#27272a', surfaceRing: 'rgba(244,244,245,0.15)', text: '#f4f4f5', subtext: '#a1a1aa', accent: '#f59e0b', accentText: '#18181b' },
  { id: 'mocha', label: 'モカ', bg: '#1c1917', surface: '#292524', surfaceRing: 'rgba(214,211,209,0.15)', text: '#f5f5f4', subtext: '#a8a29e', accent: '#d97706', accentText: '#1c1917' },
  { id: 'mint', label: 'ミント', bg: '#f0fdfa', surface: '#ffffff', surfaceRing: 'rgba(20,184,166,0.2)', text: '#042f2e', subtext: '#115e59', accent: '#14b8a6', accentText: '#ffffff' },
  { id: 'lemon', label: 'レモン', bg: '#fefce8', surface: '#ffffff', surfaceRing: 'rgba(234,179,8,0.2)', text: '#422006', subtext: '#854d0e', accent: '#ca8a04', accentText: '#ffffff' },
  { id: 'grape', label: 'グレープ', bg: '#fdf4ff', surface: '#ffffff', surfaceRing: 'rgba(217,70,239,0.2)', text: '#4a044e', subtext: '#86198f', accent: '#d946ef', accentText: '#ffffff' },
  { id: 'coral', label: 'コーラル', bg: '#fff5f5', surface: '#ffffff', surfaceRing: 'rgba(239,68,68,0.15)', text: '#450a0a', subtext: '#991b1b', accent: '#f43f5e', accentText: '#ffffff' },
  { id: 'indigo-night', label: 'インディゴナイト', bg: '#1e1b4b', surface: '#312e81', surfaceRing: 'rgba(129,140,248,0.3)', text: '#e0e7ff', subtext: '#a5b4fc', accent: '#818cf8', accentText: '#1e1b4b' },
  { id: 'sakura', label: 'さくら', bg: '#fdf2f8', surface: '#ffffff', surfaceRing: 'rgba(236,72,153,0.15)', text: '#500724', subtext: '#9d174d', accent: '#ec4899', accentText: '#ffffff' },
  { id: 'olive', label: 'オリーブ', bg: '#f7fee7', surface: '#ffffff', surfaceRing: 'rgba(132,204,22,0.2)', text: '#1a2e05', subtext: '#3f6212', accent: '#65a30d', accentText: '#ffffff' },
];

const STORAGE_KEY = 'app-theme-id';

export function getStoredThemeId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'sky';
  } catch {
    return 'sky';
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.style.setProperty('--app-bg', theme.bg);
  root.style.setProperty('--app-surface', theme.surface);
  root.style.setProperty('--app-surface-ring', theme.surfaceRing);
  root.style.setProperty('--app-text', theme.text);
  root.style.setProperty('--app-subtext', theme.subtext);
  root.style.setProperty('--app-accent', theme.accent);
  root.style.setProperty('--app-accent-text', theme.accentText);
}

export function useTheme() {
  const [themeId, setThemeId] = useState<ThemeId>(getStoredThemeId);

  useEffect(() => {
    const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, themeId); } catch { /* ignore */ }
  }, [themeId]);

  const changeTheme = useCallback((id: ThemeId) => setThemeId(id), []);

  const currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;

  return { themeId, changeTheme, currentTheme };
}
