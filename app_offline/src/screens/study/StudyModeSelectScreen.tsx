import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as db from '../../db/database';
import { useTheme } from '../../theme';
import { Word, RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'StudyModeSelect'>;

export default function StudyModeSelectScreen() {
  const navigation = useNavigation<Nav>();
  const { wordbookId, wordbookName } = useRoute<Route>().params;
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const c = useTheme();

  useEffect(() => {
    try {
      const data = db.getWords(wordbookId, { isMemorized: false });
      setWords(data);
    } catch {
      Alert.alert('오류', '단어를 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [wordbookId]);

  function startFlashcard() {
    if (words.length === 0) return Alert.alert('단어 없음', '암기할 단어가 없습니다');
    navigation.navigate('Flashcard', { words, mode: 'study' });
  }

  function startQuizMultiple() {
    if (words.length < 4) return Alert.alert('단어 부족', '객관식 퀴즈는 최소 4개 단어가 필요합니다');
    navigation.navigate('QuizMultiple', { words });
  }

  function startQuizShort() {
    if (words.length === 0) return Alert.alert('단어 없음', '암기할 단어가 없습니다');
    navigation.navigate('QuizShort', { words });
  }

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: c.background }} color="#6366f1" />;

  const modes = [
    { title: '플래시카드', desc: '카드를 뒤집으며 학습', color: c.flashcardBg, accent: '#6366f1', onPress: startFlashcard },
    { title: '객관식 퀴즈', desc: '4지선다로 뜻 맞추기', color: c.quizMultipleBg, accent: '#10b981', onPress: startQuizMultiple },
    { title: '주관식 퀴즈', desc: '직접 타이핑해서 맞추기', color: c.quizShortBg, accent: '#f59e0b', onPress: startQuizShort },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: c.textPrimary }}>{wordbookName}</Text>
        <Text style={{ fontSize: 14, color: c.textSecondary, marginTop: 4 }}>
          학습 모드를 선택해주세요.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode.title}
            onPress={mode.onPress}
            style={{
              backgroundColor: mode.color, borderRadius: 16, padding: 20,
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1.5, borderColor: mode.accent + '30',
            }}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: c.textPrimary }}>{mode.title}</Text>
              <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>{mode.desc}</Text>
            </View>
            <Text style={{ fontSize: 20, color: mode.accent }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
