import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  isDarkMode: boolean;
  autoPlayTTS: boolean;
  quizCount: number;
  reminderTime: string;
  notifEnabled: boolean;

  toggleDarkMode: () => void;
  toggleAutoPlayTTS: () => void;
  setQuizCount: (count: number) => void;
  setReminderTime: (time: string) => void;
  setNotifEnabled: (enabled: boolean) => void;
  loadSettings: () => Promise<void>;
}

const STORAGE_KEY = 'app_settings';

function save(state: Partial<SettingsState>) {
  AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
    const prev = stored ? JSON.parse(stored) : {};
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...state }));
  });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isDarkMode: false,
  autoPlayTTS: true,
  quizCount: 10,
  reminderTime: '09:00',
  notifEnabled: false,

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          isDarkMode: parsed.isDarkMode ?? false,
          autoPlayTTS: parsed.autoPlayTTS ?? true,
          quizCount: parsed.quizCount ?? 10,
          reminderTime: parsed.reminderTime ?? '09:00',
          notifEnabled: parsed.notifEnabled ?? false,
        });
      }
    } catch {}
  },

  toggleDarkMode: () => {
    const next = !get().isDarkMode;
    set({ isDarkMode: next });
    save({ isDarkMode: next });
  },

  toggleAutoPlayTTS: () => {
    const next = !get().autoPlayTTS;
    set({ autoPlayTTS: next });
    save({ autoPlayTTS: next });
  },

  setQuizCount: (count) => {
    set({ quizCount: count });
    save({ quizCount: count });
  },

  setReminderTime: (time) => {
    set({ reminderTime: time });
    save({ reminderTime: time });
  },

  setNotifEnabled: (enabled) => {
    set({ notifEnabled: enabled });
    save({ notifEnabled: enabled });
  },
}));
