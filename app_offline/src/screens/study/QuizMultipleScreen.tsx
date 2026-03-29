import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { speak } from '../../services/tts';
import { useTheme } from '../../theme';
import { Word, RootStackParamList } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'QuizMultiple'>;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildChoices(words: Word[], correct: Word): string[] {
  const others = shuffle(words.filter((w) => w.id !== correct.id)).slice(0, 3);
  return shuffle([correct, ...others]).map((w) => w.meaning);
}

export default function QuizMultipleScreen() {
  const navigation = useNavigation<Nav>();
  const { words } = useRoute<Route>().params;
  const quizCount = useSettingsStore((s) => s.quizCount);
  const autoPlay = useSettingsStore((s) => s.autoPlayTTS);
  const c = useTheme();

  const [quizWords] = useState(() => shuffle(words).slice(0, Math.min(quizCount, words.length)));

  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState(() => buildChoices(words, quizWords[0]));
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState<Word[]>([]);

  const currentWord = quizWords[index];

  useEffect(() => {
    if (autoPlay && quizWords[0]) {
      const timer = setTimeout(() => speak(quizWords[0].word), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSelect = useCallback(async (choice: string) => {
    if (selected !== null) return;
    setSelected(choice);

    const isCorrect = choice === currentWord.meaning;
    if (isCorrect) {
      setCorrect((c) => c + 1);
    } else {
      setIncorrect((i) => i + 1);
      setIncorrectWords((prev) => [...prev, currentWord]);
    }

    setTimeout(() => {
      const nextIndex = index + 1;
      if (nextIndex >= quizWords.length) {
        navigation.replace('StudyResult', {
          correct: correct + (isCorrect ? 1 : 0),
          incorrect: incorrect + (isCorrect ? 0 : 1),
          incorrectWords: isCorrect ? incorrectWords : [...incorrectWords, currentWord],
          mode: 'QUIZ_MULTIPLE',
        });
      } else {
        setIndex(nextIndex);
        setChoices(buildChoices(words, quizWords[nextIndex]));
        setSelected(null);
        if (autoPlay) speak(quizWords[nextIndex].word);
      }
    }, 800);
  }, [selected, currentWord, index, correct, incorrect, incorrectWords]);

  const progress = (index + 1) / quizWords.length;

  return (
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
          <View style={{ height: 4, width: `${progress * 100}%`, backgroundColor: '#10b981', borderRadius: 2 }} />
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{
          backgroundColor: c.card, borderRadius: 20, padding: 32,
          alignItems: 'center', marginBottom: 32,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
        }}>
          <Text style={{ fontSize: 13, color: c.textMuted, marginBottom: 8 }}>이 단어의 뜻은?</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: c.textPrimary, textAlign: 'center' }}>
            {currentWord.word}
          </Text>
          <TouchableOpacity onPress={() => speak(currentWord.word)} style={{ marginTop: 12, padding: 8 }}>
            <Image source={require('../../assets/speaker.png')} style={{ width: 28, height: 28 }} />
          </TouchableOpacity>
        </View>

        <View style={{ gap: 10 }}>
          {choices.map((choice, i) => {
            let bg = c.card;
            let border = c.border;
            if (selected !== null) {
              if (choice === currentWord.meaning) { bg = c.successBg; border = '#10b981'; }
              else if (choice === selected) { bg = c.dangerBg; border = '#ef4444'; }
            }
            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleSelect(choice)}
                style={{
                  backgroundColor: bg, borderWidth: 2, borderColor: border,
                  borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15, color: c.textPrimary, fontWeight: '500', textAlign: 'center' }}>
                  {choice}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
