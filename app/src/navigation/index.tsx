import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Image, StatusBar } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import WordbookListScreen from '../screens/wordbook/WordbookListScreen';
import WordListScreen from '../screens/wordbook/WordListScreen';
import OcrResultScreen from '../screens/wordbook/OcrResultScreen';
import FavoritesScreen from '../screens/wordbook/FavoritesScreen';

// Study Screens
import StudyModeSelectScreen from '../screens/study/StudyModeSelectScreen';
import FlashcardScreen from '../screens/study/FlashcardScreen';
import QuizMultipleScreen from '../screens/study/QuizMultipleScreen';
import QuizShortScreen from '../screens/study/QuizShortScreen';
import StudyResultScreen from '../screens/study/StudyResultScreen';
import TodayReviewScreen from '../screens/study/TodayReviewScreen';

// Other Screens
import SettingsScreen from '../screens/settings/SettingsScreen';

import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const c = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: c.border,
          backgroundColor: c.tabBar,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="WordbookList"
        component={WordbookListScreen}
        options={{ tabBarLabel: '단어장', tabBarIcon: ({ color }) => <Image source={require('../assets/words.png')} style={{ width: 22, height: 22, tintColor: color }} /> }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ tabBarLabel: '즐겨찾기', tabBarIcon: ({ color }) => <Image source={require('../assets/star.png')} style={{ width: 22, height: 22, tintColor: color }} /> }}
      />
      <Tab.Screen
        name="TodayReview"
        component={TodayReviewScreen}
        options={{ tabBarLabel: '오늘의 단어', tabBarIcon: ({ color }) => <Image source={require('../assets/review.png')} style={{ width: 22, height: 22, tintColor: color }} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: '설정', tabBarIcon: ({ color }) => <Image source={require('../assets/setting.png')} style={{ width: 22, height: 22, tintColor: color }} /> }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { loadSettings, isDarkMode } = useSettingsStore();
  const c = useTheme();

  useEffect(() => {
    loadSettings();
  }, []);

  const navTheme = isDarkMode
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: '#111827', card: '#1f2937', text: '#f9fafb', border: '#374151' } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#f9fafb', card: '#ffffff', text: '#111827', border: '#e5e7eb' } };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={c.background} />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen
                name="WordList"
                component={WordListScreen}
                options={{ headerShown: true, headerTitle: '' }}
              />
              <Stack.Screen
                name="OcrResult"
                component={OcrResultScreen}
                options={{ headerShown: true, headerTitle: 'OCR 결과 확인' }}
              />
              <Stack.Screen
                name="StudyModeSelect"
                component={StudyModeSelectScreen}
                options={{ headerShown: true, headerTitle: '학습 모드 선택' }}
              />
              <Stack.Screen name="Flashcard" component={FlashcardScreen} options={{ headerShown: true, headerTitle: '플래시카드' }} />
              <Stack.Screen name="QuizMultiple" component={QuizMultipleScreen} options={{ headerShown: true, headerTitle: '객관식 퀴즈' }} />
              <Stack.Screen name="QuizShort" component={QuizShortScreen} options={{ headerShown: true, headerTitle: '주관식 퀴즈' }} />
              <Stack.Screen name="StudyResult" component={StudyResultScreen} options={{ headerShown: true, headerTitle: '학습 결과' }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
