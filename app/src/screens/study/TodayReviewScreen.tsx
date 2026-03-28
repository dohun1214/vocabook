import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, FlatList, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { speak } from '../../services/tts';
import { useTheme } from '../../theme';
import { Word, RootStackParamList } from '../../types';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DAILY_REVIEW_KEY = '@daily_review';

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = ((s * 1664525) + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function TodayReviewScreen() {
  const navigation = useNavigation<Nav>();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const c = useTheme();

  useFocusEffect(
    React.useCallback(() => {
      loadDailyWords();
    }, [])
  );

  async function loadDailyWords() {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);

    try {
      const { data: wbData } = await api.get('/wordbooks');
      const allWords: Word[] = [];
      await Promise.all(
        wbData.wordbooks.map(async (wb: { id: number }) => {
          try {
            const { data } = await api.get(`/wordbooks/${wb.id}/words`);
            allWords.push(...data.words);
          } catch {}
        })
      );

      let dailyIds: number[] | null = null;
      try {
        const cached = await AsyncStorage.getItem(DAILY_REVIEW_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.date === today && parsed.wordIds?.length > 0) {
            dailyIds = parsed.wordIds;
          }
        }
      } catch {}

      if (dailyIds) {
        const wordMap = new Map(allWords.map((w) => [w.id, w]));
        const daily = dailyIds.map((id) => wordMap.get(id)).filter(Boolean) as Word[];
        if (daily.length > 0) {
          setWords(daily);
          setLoading(false);
          return;
        }
      }

      const seed = parseInt(today.replace(/-/g, ''), 10);
      const shuffled = seededShuffle(allWords, seed);
      const daily = shuffled.slice(0, Math.min(20, shuffled.length));
      if (daily.length > 0) {
        await AsyncStorage.setItem(DAILY_REVIEW_KEY, JSON.stringify({ date: today, wordIds: daily.map((w) => w.id) }));
      }
      setWords(daily);
    } catch {}

    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <ActivityIndicator style={{ flex: 1 }} color="#6366f1" />
      </SafeAreaView>
    );
  }

  if (words.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>📭</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: c.textPrimary }}>단어가 없어요</Text>
        <Text style={{ fontSize: 14, color: c.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
          단어장에 단어를 추가하면{'\n'}매일 20개씩 랜덤으로 출제돼요.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: c.textPrimary }}>오늘의 단어</Text>
          <Text style={{ fontSize: 14, color: c.textSecondary, marginTop: 4 }}>
            오늘 외울 단어 {words.length}개 · 내일 새 목록으로 바뀌어요
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 12, color: c.textSecondary }}>뜻 보기</Text>
          <Switch
            value={showMeaning}
            onValueChange={setShowMeaning}
            trackColor={{ false: c.switchTrackFalse, true: '#6366f1' }}
            thumbColor="#fff"
            style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
          />
        </View>
      </View>

      <FlatList
        data={words}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: c.card, borderRadius: 14, padding: 16,
              marginHorizontal: 16, marginVertical: 5,
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
            }}
            onPress={() => speak(item.word)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: c.textPrimary }}>{item.word}</Text>
              {showMeaning && (
                <Text style={{ fontSize: 14, color: c.textTertiary, flexShrink: 1, marginLeft: 8, textAlign: 'right' }} numberOfLines={2}>
                  {item.meaning}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border }}>
        <Button
          title="플래시카드로 학습 시작"
          onPress={() => navigation.navigate('Flashcard', { words, mode: 'review' })}
        />
      </View>
    </SafeAreaView>
  );
}
