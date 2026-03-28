import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from './src/store/authStore';
import { useSettingsStore } from './src/store/settingsStore';
import Navigation from './src/navigation';

export default function App() {
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    loadStoredAuth();
    loadSettings();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Navigation />
    </GestureHandlerRootView>
  );
}
