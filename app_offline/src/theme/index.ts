import { useSettingsStore } from '../store/settingsStore';

export const lightColors = {
  background: '#f9fafb',
  card: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textTertiary: '#4b5563',
  border: '#e5e7eb',
  inputBorder: '#d1d5db',
  inputBg: '#ffffff',
  placeholder: '#9ca3af',
  tabBar: '#ffffff',
  switchTrackFalse: '#d1d5db',
  modalOverlay: 'rgba(0,0,0,0.4)',
  chipBg: '#e5e7eb',
  chipText: '#6b7280',
  secondary: '#f3f4f6',
  secondaryText: '#374151',
  successBg: '#d1fae5',
  dangerBg: '#fee2e2',
  accentBg: '#eef2ff',
  accentBgSubtle: '#a5b4fc',
  starEmpty: '#d1d5db',
  flashcardBg: '#eef2ff',
  quizMultipleBg: '#f0fdf4',
  quizShortBg: '#fff7ed',
  accent: '#6366f1',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  star: '#f59e0b',
};

export const darkColors = {
  background: '#111827',
  card: '#1f2937',
  textPrimary: '#f9fafb',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  textTertiary: '#9ca3af',
  border: '#374151',
  inputBorder: '#4b5563',
  inputBg: '#1f2937',
  placeholder: '#6b7280',
  tabBar: '#1f2937',
  switchTrackFalse: '#4b5563',
  modalOverlay: 'rgba(0,0,0,0.7)',
  chipBg: '#374151',
  chipText: '#9ca3af',
  secondary: '#374151',
  secondaryText: '#e5e7eb',
  successBg: '#022c22',
  dangerBg: '#2d0505',
  accentBg: '#1e2238',
  accentBgSubtle: '#4338ca',
  starEmpty: '#4b5563',
  flashcardBg: '#1e2238',
  quizMultipleBg: '#0c2318',
  quizShortBg: '#231b0d',
  accent: '#6366f1',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  star: '#f59e0b',
};

export type Colors = typeof lightColors;

export function useTheme(): Colors {
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  return isDarkMode ? darkColors : lightColors;
}
