import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, SafeAreaView, Animated, Dimensions, Image,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { speak } from '../../services/tts';
import { useTheme } from '../../theme';
import { Word, RootStackParamList } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import * as db from '../../db/database';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Flashcard'>;

const { width } = Dimensions.get('window');

export default function FlashcardScreen() {
  const navigation = useNavigation<Nav>();
  const { words: initialWords, mode } = useRoute<Route>().params;
  const autoPlay = useSettingsStore((s) => s.autoPlayTTS);
  const c = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState<Word[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(
    () => new Set(initialWords.filter((w) => w.isFavorite).map((w) => w.id))
  );

  const flipAnim = useRef(new Animated.Value(0)).current;

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const currentWord = initialWords[currentIndex];
  const isFavorite = favorites.has(currentWord?.id);

  useEffect(() => {
    if (currentWord && autoPlay && !isFlipped) {
      const delay = currentIndex === 0 ? 500 : 0;
      const timer = setTimeout(() => speak(currentWord.word), delay);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentWord]);

  function flip() {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, { toValue, useNativeDriver: true, tension: 50 }).start();
    setIsFlipped(!isFlipped);
  }

  function toggleFavorite() {
    const next = !isFavorite;
    db.setFavorite(currentWord.id, next);
    setFavorites((prev) => {
      const next2 = new Set(prev);
      if (next) next2.add(currentWord.id);
      else next2.delete(currentWord.id);
      return next2;
    });
  }

  async function handleResult(knew: boolean) {
    const word = currentWord;
    const newCorrect = correct + (knew ? 1 : 0);
    const newIncorrect = incorrect + (knew ? 0 : 1);
    const newIncorrectWords = knew ? incorrectWords : [...incorrectWords, word];

    if (knew) setCorrect(newCorrect);
    else { setIncorrect(newIncorrect); setIncorrectWords(newIncorrectWords); }

    flipAnim.setValue(0);
    setIsFlipped(false);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= initialWords.length) {
      navigation.replace('StudyResult', {
        correct: newCorrect,
        incorrect: newIncorrect,
        incorrectWords: newIncorrectWords,
        mode: 'FLASHCARD',
      });
    } else {
      setCurrentIndex(nextIndex);
    }
  }

  if (!currentWord) return null;

  const progress = currentIndex / initialWords.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      {/* Progress */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 13, color: c.textSecondary }}>{currentIndex + 1} / {initialWords.length}</Text>
          <Text style={{ fontSize: 13, color: c.textSecondary }}>
            <Text style={{ color: '#10b981', fontWeight: '700' }}>O </Text>
            <Text>{correct}  </Text>
            <Text style={{ color: '#ef4444', fontWeight: '700' }}>X </Text>
            <Text>{incorrect}</Text>
          </Text>
        </View>
        <View style={{ height: 4, backgroundColor: c.border, borderRadius: 2 }}>
          <View style={{ height: 4, width: `${progress * 100}%`, backgroundColor: '#6366f1', borderRadius: 2 }} />
        </View>
      </View>

      {/* Card */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
        <View style={{ width: width - 32, height: 260 }}>
          {/* 카드 뒤집기 */}
          <TouchableOpacity onPress={flip} activeOpacity={0.95} style={{ width: '100%', height: '100%' }}>
            {/* Front */}
            <Animated.View style={{
              backgroundColor: c.card, borderRadius: 24, padding: 32, height: 260,
              justifyContent: 'center', alignItems: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
              backfaceVisibility: 'hidden',
              transform: [{ rotateY: frontInterpolate }],
              position: 'absolute', width: '100%',
            }}>
              <Text style={{ fontSize: 13, color: c.textMuted, position: 'absolute', top: 80 }}>탭하여 뒤집기</Text>
              <Text style={{ fontSize: 32, fontWeight: '800', color: c.textPrimary, textAlign: 'center' }}>
                {currentWord.word}
              </Text>
            </Animated.View>

            {/* Back */}
            <Animated.View style={{
              backgroundColor: '#6366f1', borderRadius: 24, padding: 32, height: 260,
              justifyContent: 'center', alignItems: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
              backfaceVisibility: 'hidden',
              transform: [{ rotateY: backInterpolate }],
              position: 'absolute', width: '100%',
            }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center' }}>
                {currentWord.meaning}
              </Text>
              {currentWord.example ? (
                <Text style={{ fontSize: 14, color: '#c7d2fe', textAlign: 'center', fontStyle: 'italic', position: 'absolute', bottom: 24, paddingHorizontal: 16 }}>
                  {currentWord.example}
                </Text>
              ) : null}
            </Animated.View>
          </TouchableOpacity>

          {/* 별 버튼 - 앞뒤 모두 표시 */}
          <View
            pointerEvents="box-none"
            style={{ position: 'absolute', top: 0, right: 0, width: 64, height: 64, justifyContent: 'center', alignItems: 'center' }}
          >
            <TouchableOpacity onPress={toggleFavorite} style={{ padding: 16 }}>
              <Text style={{ fontSize: 24, color: isFavorite ? '#f59e0b' : isFlipped ? 'rgba(255,255,255,0.5)' : c.starEmpty }}>★</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Speaker button */}
        <TouchableOpacity
          onPress={() => speak(currentWord.word)}
          style={{ marginTop: 48, padding: 16 }}
        >
          <Image source={require('../../assets/speaker.png')} style={{ width: 52, height: 52, tintColor: isFlipped ? '#6366f1' : undefined }} />
        </TouchableOpacity>
      </View>

      {/* Result buttons */}
      <View style={{ flexDirection: 'row', padding: 16, gap: 12, opacity: isFlipped ? 1 : 0 }}>
        <TouchableOpacity
          onPress={() => isFlipped && handleResult(true)}
          style={{ flex: 1, backgroundColor: c.successBg, borderRadius: 16, paddingVertical: 24, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#10b981' }}>알았어요</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => isFlipped && handleResult(false)}
          style={{ flex: 1, backgroundColor: c.dangerBg, borderRadius: 16, paddingVertical: 24, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#ef4444' }}>몰랐어요</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
