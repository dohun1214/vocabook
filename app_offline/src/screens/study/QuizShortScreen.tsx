import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Image, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { speak } from '../../services/tts';
import { useTheme } from '../../theme';
import { Word, RootStackParamList } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'QuizShort'>;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function QuizShortScreen() {
  const navigation = useNavigation<Nav>();
  const { words } = useRoute<Route>().params;
  const quizCount = useSettingsStore((s) => s.quizCount);
  const autoPlay = useSettingsStore((s) => s.autoPlayTTS);
  const c = useTheme();

  const [quizWords] = useState(() => shuffle(words).slice(0, Math.min(quizCount, words.length)));

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState<Word[]>([]);
  const inputRef = useRef<TextInput>(null);

  const currentWord = quizWords[index];

  useEffect(() => {
    if (autoPlay && currentWord) {
      const delay = index === 0 ? 500 : 0;
      const timer = setTimeout(() => speak(currentWord.word), delay);
      return () => clearTimeout(timer);
    }
  }, [index]);

  async function handleSubmit() {
    if (!answer.trim() || submitted) return;

    const userAnswer = answer.trim().toLowerCase();
    const correctAnswer = currentWord.meaning.toLowerCase();
    const correct_ = correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer.split(',')[0].trim());

    setSubmitted(true);
    setIsCorrect(correct_);

    if (correct_) setCorrect((c) => c + 1);
    else { setIncorrect((i) => i + 1); setIncorrectWords((prev) => [...prev, currentWord]); }
  }

  function handleSkip() {
    setIncorrect((i) => i + 1);
    setIncorrectWords((prev) => [...prev, currentWord]);
    setSubmitted(true);
    setIsCorrect(false);
  }

  function handleNext() {
    const nextIndex = index + 1;
    if (nextIndex >= quizWords.length) {
      navigation.replace('StudyResult', {
        correct,
        incorrect,
        incorrectWords,
        mode: 'QUIZ_SHORT',
      });
    } else {
      setIndex(nextIndex);
      setAnswer('');
      setSubmitted(false);
      setIsCorrect(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const progress = (index + 1) / quizWords.length;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 13, color: c.textSecondary }}>{index + 1} / {quizWords.length}</Text>
            <Text style={{ fontSize: 13, color: c.textSecondary }}>
            <Text style={{ color: '#10b981', fontWeight: '700' }}>O </Text>
            <Text>{correct}  </Text>
            <Text style={{ color: '#ef4444', fontWeight: '700' }}>X </Text>
            <Text>{incorrect}</Text>
          </Text>
          </View>
          <View style={{ height: 4, backgroundColor: c.border, borderRadius: 2 }}>
            <View style={{ height: 4, width: `${progress * 100}%`, backgroundColor: '#f59e0b', borderRadius: 2 }} />
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{
            backgroundColor: c.card, borderRadius: 20, padding: 32,
            alignItems: 'center', marginBottom: 32,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
          }}>
            <Text style={{ fontSize: 13, color: c.textMuted, marginBottom: 8 }}>이 단어의 뜻을 입력하세요.</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: c.textPrimary }}>{currentWord.word}</Text>
            <TouchableOpacity onPress={() => speak(currentWord.word)} style={{ marginTop: 12, padding: 8 }}>
              <Image source={require('../../assets/speaker.png')} style={{ width: 28, height: 28 }} />
            </TouchableOpacity>
          </View>

          <TextInput
            ref={inputRef}
            value={answer}
            onChangeText={setAnswer}
            placeholder="뜻을 입력하세요."
            placeholderTextColor={c.placeholder}
            style={{
              backgroundColor: c.card, borderWidth: 2,
              borderColor: submitted ? (isCorrect ? '#10b981' : '#ef4444') : c.border,
              borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16,
              fontSize: 16, marginBottom: 12, color: c.textPrimary,
            }}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
            editable={!submitted}
          />

          {submitted && (
            <View style={{
              backgroundColor: isCorrect ? c.successBg : c.dangerBg,
              borderRadius: 12, padding: 14, marginBottom: 16,
            }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: isCorrect ? '#10b981' : '#ef4444', marginBottom: 4 }}>
                {isCorrect ? '정답!' : '오답'}
              </Text>
              {!isCorrect && (
                <Text style={{ fontSize: 14, color: c.textPrimary }}>
                  정답: <Text style={{ fontWeight: '700' }}>{currentWord.meaning}</Text>
                </Text>
              )}
            </View>
          )}

          {!submitted ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={handleSkip}
                style={{ flex: 1, backgroundColor: c.secondary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ color: c.textSecondary, fontSize: 16, fontWeight: '700' }}>모르겠어요</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                style={{ flex: 1, backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>확인</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleNext}
              style={{ backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>다음 →</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
