import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput,
  RefreshControl, SafeAreaView, ActivityIndicator, TextInput as RNTextInput,
  KeyboardAvoidingView, Platform, Switch, TouchableWithoutFeedback, Animated, Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import * as db from '../../db/database';
import { speak } from '../../services/tts';
import { useTheme } from '../../theme';
import { Word, RootStackParamList } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'WordList'>;

export default function WordListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { wordbookId, wordbookName } = route.params;
  const c = useTheme();

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorite'>('all');
  const [sort, setSort] = useState<'createdAt' | 'word'>('createdAt');
  const [wordModal, setWordModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Word | null>(null);
  const [wordInput, setWordInput] = useState('');
  const [meaningInput, setMeaningInput] = useState('');
  const [exampleInput, setExampleInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [showMeaning, setShowMeaning] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showCamera, setShowCamera] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const meaningInputRef = useRef<RNTextInput>(null);
  const exampleInputRef = useRef<RNTextInput>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const autoPlay = useSettingsStore((s) => s.autoPlayTTS);

  const fetchWords = useCallback(() => {
    try {
      const data = db.getWords(wordbookId, {
        search: search || undefined,
        isFavorite: filter === 'favorite' ? true : undefined,
        sortBy: sort,
      });
      setWords(data);
    } catch {
      Alert.alert('오류', '단어를 불러오지 못했습니다');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [wordbookId, search, filter, sort]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchWords);
    return unsubscribe;
  }, [navigation, fetchWords]);

  useEffect(() => {
    navigation.setOptions({ title: wordbookName });
  }, [wordbookName, navigation]);

  function enterSelectMode() {
    setSelectMode(true);
    setSelectedIds(new Set());
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === words.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(words.map((w) => w.id)));
    }
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    Alert.alert('단어 삭제', `선택한 ${selectedIds.size}개의 단어를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => {
        try {
          selectedIds.forEach((id) => db.deleteWord(id));
          exitSelectMode();
          fetchWords();
        } catch {
          Alert.alert('오류', '삭제에 실패했습니다');
        }
      }},
    ]);
  }

  function openCreate() {
    setEditTarget(null);
    setWordInput(''); setMeaningInput(''); setExampleInput('');
    setWordModal(true);
  }

  function openEdit(w: Word) {
    setEditTarget(w);
    setWordInput(w.word); setMeaningInput(w.meaning); setExampleInput(w.example || '');
    setWordModal(true);
  }

  function handleSaveWord() {
    if (!wordInput.trim() || !meaningInput.trim()) {
      return Alert.alert('오류', '단어와 뜻을 입력해주세요');
    }
    setSaving(true);
    try {
      if (editTarget) {
        db.updateWord(editTarget.id, wordInput.trim(), meaningInput.trim(), exampleInput.trim() || undefined);
      } else {
        db.createWord(wordbookId, wordInput.trim(), meaningInput.trim(), exampleInput.trim() || undefined);
      }
      setWordModal(false);
      fetchWords();
    } catch {
      Alert.alert('오류', '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(w: Word) {
    Alert.alert('단어 삭제', `"${w.word}"을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => {
        try { db.deleteWord(w.id); fetchWords(); }
        catch { Alert.alert('오류', '삭제에 실패했습니다'); }
      }},
    ]);
  }

  function toggleFavorite(w: Word) {
    try {
      db.setFavorite(w.id, !w.isFavorite);
      setWords((prev) => prev.map((x) => x.id === w.id ? { ...x, isFavorite: !x.isFavorite } : x));
    } catch {}
  }

  async function handleScan() {
    Alert.alert('사진으로 단어 추가', '방법을 선택해주세요.', [
      { text: '취소', style: 'cancel' },
      { text: '갤러리에서 선택', onPress: handlePickFromGallery },
      { text: '카메라로 촬영', onPress: handleOpenCamera },
    ]);
  }

  async function handleOpenCamera() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다');
    }
    setShowCamera(true);
  }

  async function handlePickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    setScanLoading(true);
    try {
      await checkNetworkAndProcess(result.assets[0].base64);
    } finally {
      setScanLoading(false);
    }
  }

  async function checkNetworkAndProcess(base64: string) {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert('인터넷 연결 필요', 'OCR 기능은 인터넷 연결이 필요합니다.\n와이파이 또는 모바일 데이터를 켜주세요.');
      return;
    }
    await processImageWithGemini(base64);
  }

  async function processImageWithGemini(base64: string) {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64 } },
              { text: `You are an English vocabulary extractor.
Look at this image and extract all English vocabulary words with their Korean meanings and example sentences.
Return ONLY a valid JSON array. No markdown, no code fences, no explanation.
Each item must have exactly these fields: "word" (English word), "meaning" (Korean meaning), "example" (example sentence, can be empty string).
If no vocabulary words are found, return [].
JSON:` },
            ],
          }],
        }),
      }
    );
    const json = await response.json();
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    if (!raw) throw new Error(`Gemini 응답 없음: ${JSON.stringify(json)}`);
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsedWords = JSON.parse(cleaned);
    if (!parsedWords.length) { Alert.alert('단어 없음', '영어 단어를 찾을 수 없었습니다.'); return; }
    navigation.navigate('OcrResult', { wordbookId, parsedWords });
  }

  async function takePicture() {
    if (!cameraRef.current || scanLoading) return;
    setScanLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
      if (!photo?.base64) return;
      setShowCamera(false);
      await checkNetworkAndProcess(photo.base64);
    } catch (e: any) {
      Alert.alert('오류', String(e?.message ?? 'OCR 처리에 실패했습니다'));
    } finally {
      setScanLoading(false);
    }
  }

  function renderWord({ item }: { item: Word }) {
    return (
      <WordItem
        item={item}
        showMeaning={showMeaning}
        c={c}
        onToggleFavorite={toggleFavorite}
        onEdit={openEdit}
        onDelete={handleDelete}
        selectMode={selectMode}
        isSelected={selectedIds.has(item.id)}
        onSelect={toggleSelect}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="단어 검색..."
          placeholderTextColor={c.placeholder}
          style={{
            backgroundColor: c.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
            fontSize: 15, borderWidth: 1, borderColor: c.border, color: c.textPrimary,
          }}
          returnKeyType="search"
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 6 }}>
        {selectMode ? (
          <>
            <TouchableOpacity onPress={toggleSelectAll}
              style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: selectedIds.size === words.length ? '#6366f1' : c.chipBg }}>
              <Text style={{ fontSize: 13, color: selectedIds.size === words.length ? '#fff' : c.chipText, fontWeight: '500' }}>
                전체 선택
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 13, color: c.textSecondary }}>{selectedIds.size}개 선택됨</Text>
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              {(['all', 'favorite'] as const).map((f) => (
                <TouchableOpacity key={f} onPress={() => setFilter(f)}
                  style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: filter === f ? '#6366f1' : c.chipBg }}>
                  <Text style={{ fontSize: 13, color: filter === f ? '#fff' : c.chipText, fontWeight: '500' }}>
                    {f === 'all' ? '전체' : '즐겨찾기'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: c.textSecondary, marginRight: -8 }}>뜻 보기</Text>
              <Switch
                value={showMeaning}
                onValueChange={setShowMeaning}
                trackColor={{ false: c.switchTrackFalse, true: '#6366f1' }}
                thumbColor="#fff"
                style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
              />
              <TouchableOpacity onPress={() => setSort(sort === 'createdAt' ? 'word' : 'createdAt')}
                style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, backgroundColor: c.chipBg }}>
                <Text style={{ fontSize: 12, color: c.chipText, fontWeight: '500' }}>
                  {sort === 'createdAt' ? '최근순' : '이름순'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={enterSelectMode}
                style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, backgroundColor: c.chipBg }}>
                <Text style={{ fontSize: 12, color: c.chipText, fontWeight: '500' }}>선택</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#6366f1" />
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderWord}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWords(); }} tintColor="#6366f1" />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 130 }}>
              <Image source={require('../../../assets/cloud.png')} style={{ width: 48, height: 48, marginBottom: 12 }} resizeMode="contain" />
              <Text style={{ color: c.textMuted, fontSize: 15, textAlign: 'center' }}>
                단어가 없습니다.{'\n'}아래 버튼으로 추가해보세요.
              </Text>
            </View>
          }
        />
      )}

      <View style={{ flexDirection: 'row', padding: 16, gap: 10, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border }}>
        {selectMode ? (
          <>
            <Button title="취소" variant="secondary" onPress={exitSelectMode} style={{ flex: 1, paddingVertical: 12 }} />
            <Button
              title={selectedIds.size > 0 ? `삭제 (${selectedIds.size}개)` : '삭제'}
              onPress={handleBulkDelete}
              style={{ flex: 2, paddingVertical: 12, backgroundColor: selectedIds.size > 0 ? '#ef4444' : undefined }}
            />
          </>
        ) : (
          <>
            <Button title="사진으로 추가" variant="outline" onPress={handleScan} style={{ flex: 1, paddingVertical: 12 }} loading={scanLoading} />
            <Button title="+ 단어 추가" onPress={openCreate} style={{ flex: 2, paddingVertical: 12 }} />
          </>
        )}
      </View>

      <Modal visible={showCamera} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
            <View style={{ flex: 1, justifyContent: 'flex-end', padding: 24 }}>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
                <Button title="취소" variant="secondary" onPress={() => setShowCamera(false)} style={{ flex: 1 }} />
                <Button title={scanLoading ? '처리 중...' : '📷 촬영'} onPress={takePicture} loading={scanLoading} style={{ flex: 1 }} />
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>

      <Modal visible={wordModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={() => setWordModal(false)}>
          <View style={{ flex: 1, backgroundColor: c.modalOverlay, justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: c.textPrimary }}>
                {editTarget ? '단어 수정' : '단어 추가'}
              </Text>
              <TextInput
                value={wordInput}
                onChangeText={setWordInput}
                placeholder="영어 단어"
                placeholderTextColor={c.placeholder}
                style={{ borderWidth: 1.5, borderColor: c.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 10, color: c.textPrimary, backgroundColor: c.inputBg }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => meaningInputRef.current?.focus()}
                blurOnSubmit={false}
              />
              <TextInput
                ref={meaningInputRef}
                value={meaningInput}
                onChangeText={setMeaningInput}
                placeholder="뜻 (한국어 또는 영어)"
                placeholderTextColor={c.placeholder}
                style={{ borderWidth: 1.5, borderColor: c.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 10, color: c.textPrimary, backgroundColor: c.inputBg }}
                returnKeyType="next"
                onSubmitEditing={() => exampleInputRef.current?.focus()}
                blurOnSubmit={false}
              />
              <TextInput
                ref={exampleInputRef}
                value={exampleInput}
                onChangeText={setExampleInput}
                placeholder="예문 (선택사항)"
                placeholderTextColor={c.placeholder}
                style={{ borderWidth: 1.5, borderColor: c.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16, color: c.textPrimary, backgroundColor: c.inputBg }}
                multiline
                numberOfLines={2}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="취소" variant="secondary" onPress={() => setWordModal(false)} style={{ flex: 1 }} />
                <Button title={editTarget ? '수정' : '추가'} onPress={handleSaveWord} loading={saving} style={{ flex: 1 }} />
              </View>
            </View>
            </TouchableWithoutFeedback>
          </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

type WordItemProps = {
  item: Word;
  showMeaning: boolean;
  c: ReturnType<typeof useTheme>;
  onToggleFavorite: (w: Word) => void;
  onEdit: (w: Word) => void;
  onDelete: (w: Word) => void;
  selectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
};

function WordItem({ item, showMeaning, c, onToggleFavorite, onEdit, onDelete, selectMode, isSelected, onSelect }: WordItemProps) {
  const [revealed, setRevealed] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const wordOpacity = useRef(new Animated.Value(1)).current;
  const meaningOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showMeaning) {
      wordOpacity.setValue(1);
      meaningOpacity.setValue(0);
      setShowContent(false);
      setRevealed(false);
    }
  }, [showMeaning]);

  function handlePress() {
    if (showMeaning) {
      speak(item.word);
      return;
    }
    if (!revealed) {
      speak(item.word);
      setRevealed(true);
      setShowContent(true);
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(meaningOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      setRevealed(false);
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(meaningOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => setShowContent(false));
    }
  }

  return (
    <TouchableOpacity
      style={{
        backgroundColor: isSelected ? '#ede9fe' : revealed ? '#ede9fe' : c.card,
        borderRadius: 14, padding: 16,
        marginHorizontal: 16, marginVertical: 5,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
        borderWidth: isSelected ? 1.5 : 0,
        borderColor: isSelected ? '#6366f1' : 'transparent',
      }}
      onPress={selectMode ? () => onSelect?.(item.id) : handlePress}
      onLongPress={selectMode ? undefined : () =>
        Alert.alert(item.word, '무엇을 하시겠어요?', [
          { text: '취소', style: 'cancel' },
          { text: '수정', onPress: () => onEdit(item) },
          { text: '삭제', style: 'destructive', onPress: () => onDelete(item) },
        ])
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {selectMode ? (
          <View style={{
            width: 22, height: 22, borderRadius: 11, marginRight: 10,
            borderWidth: 2, borderColor: isSelected ? '#6366f1' : c.border,
            backgroundColor: isSelected ? '#6366f1' : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {isSelected && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text>}
          </View>
        ) : (
          <TouchableOpacity onPress={() => onToggleFavorite(item)} style={{ marginRight: 10 }}>
            <Text style={{ fontSize: 20, color: item.isFavorite ? '#f59e0b' : c.starEmpty }}>★</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, height: 22, justifyContent: 'center' }}>
          <Animated.Text
            style={{ position: 'absolute', fontSize: 16, fontWeight: '700', color: c.textPrimary, opacity: wordOpacity }}
            numberOfLines={1}
          >
            {item.word}
          </Animated.Text>
          {showMeaning && (
            <Text style={{ position: 'absolute', right: 0, fontSize: 14, color: c.textTertiary, maxWidth: '60%', textAlign: 'right' }} numberOfLines={2}>
              {item.meaning}
            </Text>
          )}
          {!showMeaning && showContent && (
            <Animated.Text
              style={{ position: 'absolute', fontSize: 14, fontWeight: '600', color: '#6366f1', opacity: meaningOpacity }}
              numberOfLines={2}
            >
              {item.meaning}
            </Animated.Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
