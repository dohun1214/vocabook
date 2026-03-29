import React, { useEffect } from 'react';
import {
  View, Text, Switch, TouchableOpacity, Alert, SafeAreaView, ScrollView,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '../../store/settingsStore';
import { useTheme } from '../../theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

async function scheduleReminder(time: string) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const [hour, minute] = time.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '단어장 학습 알림',
      body: '오늘의 단어 복습을 시작해보세요!',
    },
    trigger: { hour, minute, repeats: true } as any,
  });
}

export default function SettingsScreen() {
  const {
    isDarkMode, toggleDarkMode,
    autoPlayTTS, toggleAutoPlayTTS,
    quizCount, setQuizCount,
    reminderTime, setReminderTime,
    notifEnabled, setNotifEnabled,
  } = useSettingsStore();
  const c = useTheme();

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      if (status !== 'granted' && notifEnabled) {
        setNotifEnabled(false);
      } else if (status === 'granted' && notifEnabled) {
        Notifications.getScheduledNotificationsAsync().then((scheduled) => {
          if (scheduled.length === 0) {
            scheduleReminder(reminderTime);
          }
        });
      }
    });
  }, []);

  async function handleToggleNotif() {
    if (notifEnabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotifEnabled(false);
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotifEnabled(true);
        await scheduleReminder(reminderTime);
      } else {
        Alert.alert('권한 필요', '알림 권한을 허용해주세요.\n설정 앱에서 알림 권한을 켜주세요.');
      }
    }
  }

  function handleQuizCount() {
    Alert.prompt(
      '퀴즈 문제 수',
      '문제 수를 입력하세요. (1 ~ 100)',
      (input) => {
        if (!input) return;
        const num = parseInt(input, 10);
        if (isNaN(num) || num < 1) return Alert.alert('오류', '1 이상의 숫자를 입력해주세요');
        setQuizCount(Math.min(num, 100));
      },
      'plain-text',
      quizCount.toString(),
      'number-pad'
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: c.textPrimary, marginBottom: 20 }}>설정</Text>

        <SectionHeader title="화면" c={c} />
        <SettingRow
          c={c}
          label="다크모드"
          right={<Switch value={isDarkMode} onValueChange={toggleDarkMode} trackColor={{ false: c.switchTrackFalse, true: '#6366f1' }} thumbColor="#fff" />}
        />

        <SectionHeader title="학습" c={c} />
        <SettingRow
          c={c}
          label="자동 발음 재생"
          right={<Switch value={autoPlayTTS} onValueChange={toggleAutoPlayTTS} trackColor={{ false: c.switchTrackFalse, true: '#6366f1' }} thumbColor="#fff" />}
        />
        <SettingRow
          c={c}
          label="퀴즈 문제 수"
          right={
            <TouchableOpacity onPress={handleQuizCount}>
              <Text style={{ fontSize: 15, color: '#6366f1', fontWeight: '600' }}>{quizCount}개 ›</Text>
            </TouchableOpacity>
          }
        />

        <SectionHeader title="알림" c={c} />
        <SettingRow
          c={c}
          label="매일 학습 리마인더"
          right={<Switch value={notifEnabled} onValueChange={handleToggleNotif} trackColor={{ false: c.switchTrackFalse, true: '#6366f1' }} thumbColor="#fff" />}
        />
        {notifEnabled && (
          <SettingRow
            c={c}
            label="알림 시간"
            right={
              <TouchableOpacity onPress={() =>
                Alert.prompt(
                  '알림 시간',
                  'HH:MM 형식으로 입력하세요. (예: 08:30)',
                  async (input) => {
                    if (!input) return;
                    const match = input.match(/^(\d{1,2}):(\d{2})$/);
                    if (!match) return Alert.alert('오류', 'HH:MM 형식으로 입력해주세요');
                    const hour = parseInt(match[1], 10);
                    const minute = parseInt(match[2], 10);
                    if (hour > 23 || minute > 59) return Alert.alert('오류', '올바른 시간을 입력해주세요');
                    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                    setReminderTime(time);
                    await scheduleReminder(time);
                  },
                  'plain-text',
                  reminderTime
                )
              }>
                <Text style={{ fontSize: 15, color: '#6366f1', fontWeight: '600' }}>{reminderTime} ›</Text>
              </TouchableOpacity>
            }
          />
        )}

        <SectionHeader title="앱 정보" c={c} />
        <View style={{
          backgroundColor: c.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 2,
        }}>
          <Text style={{ fontSize: 15, color: c.textSecondary }}>데이터는 기기에 저장됩니다. (오프라인 모드)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, c }: { title: string; c: ReturnType<typeof useTheme> }) {
  return (
    <Text style={{ fontSize: 13, color: c.textMuted, fontWeight: '600', marginTop: 16, marginBottom: 6, paddingHorizontal: 4 }}>
      {title.toUpperCase()}
    </Text>
  );
}

function SettingRow({ label, right, c }: { label: string; right: React.ReactNode; c: ReturnType<typeof useTheme> }) {
  return (
    <View style={{
      backgroundColor: c.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2,
    }}>
      <Text style={{ fontSize: 15, color: c.textPrimary }}>{label}</Text>
      {right}
    </View>
  );
}
