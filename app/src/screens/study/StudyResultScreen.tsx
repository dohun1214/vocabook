import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { RootStackParamList } from '../../types';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'StudyResult'>;

export default function StudyResultScreen() {
  const navigation = useNavigation<Nav>();
  const { correct, incorrect, incorrectWords, mode } = useRoute<Route>().params;
  const c = useTheme();
  const total = correct + incorrect;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const modeLabel = mode === 'FLASHCARD' ? '플래시카드' : mode === 'QUIZ_MULTIPLE' ? '객관식 퀴즈' : '주관식 퀴즈';

  function retryIncorrect() {
    if (!incorrectWords.length) return;
    if (mode === 'FLASHCARD') {
      navigation.replace('Flashcard', { words: incorrectWords, mode: 'study' });
    } else if (mode === 'QUIZ_MULTIPLE') {
      if (incorrectWords.length < 4) {
        navigation.replace('QuizShort', { words: incorrectWords });
      } else {
        navigation.replace('QuizMultiple', { words: incorrectWords });
      }
    } else {
      navigation.replace('QuizShort', { words: incorrectWords });
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: c.textPrimary }}>학습 완료!</Text>
          <Text style={{ fontSize: 14, color: c.textSecondary, marginTop: 4 }}>{modeLabel}</Text>
        </View>

        {/* Score card */}
        <View style={{
          backgroundColor: c.card, borderRadius: 20, padding: 24, marginBottom: 20,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 36, fontWeight: '800', color: '#6366f1' }}>{accuracy}%</Text>
              <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: 4 }}>정답률</Text>
            </View>
            <View style={{ width: 1, backgroundColor: c.border }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 36, fontWeight: '800', color: '#10b981' }}>{correct}</Text>
              <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: 4 }}>맞음</Text>
            </View>
            <View style={{ width: 1, backgroundColor: c.border }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 36, fontWeight: '800', color: '#ef4444' }}>{incorrect}</Text>
              <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: 4 }}>틀림</Text>
            </View>
          </View>
        </View>

        {/* Incorrect words */}
        {incorrectWords.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 12 }}>
              틀린 단어 ({incorrectWords.length}개)
            </Text>
            {incorrectWords.map((w, i) => (
              <View key={`${w.id}-${i}`} style={{
                backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 8,
                borderLeftWidth: 4, borderLeftColor: '#ef4444',
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: c.textPrimary }}>{w.word}</Text>
                <Text style={{ fontSize: 14, color: c.textSecondary, flexShrink: 1, marginLeft: 8, textAlign: 'right' }} numberOfLines={2}>{w.meaning}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={{ gap: 10 }}>
          {incorrectWords.length > 0 && (
            <Button title="틀린 단어 다시 풀기" onPress={retryIncorrect} variant="outline" />
          )}
          <Button title="홈으로 돌아가기" onPress={() => navigation.navigate('Main')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
