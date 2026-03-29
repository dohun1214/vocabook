import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { useSettingsStore } from './src/store/settingsStore';
import { initDB } from './src/db/database';
import Navigation from './src/navigation';

export default function App() {
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDB();
    loadSettings().then(() => setDbReady(true));
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Navigation />
    </GestureHandlerRootView>
  );
}
