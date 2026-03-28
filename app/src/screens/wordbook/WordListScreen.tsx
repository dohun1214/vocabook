import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput,
  RefreshControl, SafeAreaView, ActivityIndicator, TextInput as RNTextInput,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import api from '../../services/api';
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
  const [showCamera, setShowCamera] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const autoPlay = useSettingsStore((s) => s.autoPlayTTS);

  const fetchWords = useCallback(async () => {
    try {
      const params: Record<string, string> = { sortBy: sort, order: 'desc' };
      if (search) params.search = search;
      if (filter === 'favorite') params.isFavorite = 'true';
      const { data } = await api.get(`/wordbooks/${wordbookId}/words`, { params });
      setWords(data.words);
    } catch {
      Alert.alert('오류', '단어를 불러오지 못했습니다');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [wordbookId, search, filter, sort]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  useEffect(() => {
    navigation.setOptions({ title: wordbookName });
  }, [wordbookName, navigation]);

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

  async function handleSaveWord() {
    if (!wordInput.trim() || !meaningInput.trim()) {
      return Alert.alert('오류', '단어와 뜻을 입력해주세요');
    }
    setSaving(true);
    try {
      const body = { word: wordInput.trim(), meaning: meaningInput.trim(), example: exampleInput.trim() || undefined };
      if (editTarget) {
        await api.put(`/words/${editTarget.id}`, body);
      } else {
        await api.post(`/wordbooks/${wordbookId}/words`, body);
      }
      setWordModal(false);
      fetchWords();
    } catch {
      Alert.alert('오류', '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(w: Word) {
    Alert.alert('단어 삭제', `"${w.word}"을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        try { await api.delete(`/words/${w.id}`); fetchWords(); }
        catch { Alert.alert('오류', '삭제에 실패했습니다'); }
      }},
    ]);
  }

  async function toggleFavorite(w: Word) {
    try {
      await api.patch(`/words/${w.id}/favorite`, { isFavorite: !w.isFavorite });
      setWords((prev) => prev.map((x) => x.id === w.id ? { ...x, isFavorite: !x.isFavorite } : x));
    } catch {}
  }

  async function handleScan() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다');
    }
    setShowCamera(true);
  }

  async function takePicture() {
    if (!cameraRef.current || scanLoading) return;
    setScanLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;
      setShowCamera(false);

      const result = await TextRecognition.recognize(photo.uri);
      const text = result.blocks.map((b) => b.text).join('\n');
      if (!text.trim()) return Alert.alert('인식 실패', '텍스트를 찾을 수 없습니다. 다시 시도해주세요.');

      const { data } = await api.post('/ocr/parse', { text });
      if (!data.words.length) return Alert.alert('단어 없음', '영어 단어를 찾을 수 없었습니다.');

      navigation.navigate('OcrResult', { wordbookId, parsedWords: data.words });
    } catch {
      Alert.alert('오류', 'OCR 처리에 실패했습니다');
    } finally {
      setScanLoading(false);
    }
  }

  function renderWord({ item }: { item: Word }) {
    return (
      <TouchableOpacity
        style={{
          backgroundColor: c.card,
          borderRadius: 14, padding: 16,
          marginHorizontal: 16, marginVertical: 5,
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
        }}
        onPress={() => speak(item.word)}
        onLongPress={() =>
          Alert.alert(item.word, '무엇을 하시겠어요?', [
            { text: '취소', style: 'cancel' },
            { text: '수정', onPress: () => openEdit(item) },
            { text: '삭제', style: 'destructive', onPress: () => handleDelete(item) },
          ])
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => toggleFavorite(item)} style={{ marginRight: 10 }}>
            <Text style={{ fontSize: 20, color: item.isFavorite ? '#f59e0b' : c.starEmpty }}>★</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.textPrimary }}>{item.word}</Text>
            {showMeaning && (
              <Text style={{ fontSize: 14, color: c.textTertiary, flexShrink: 1, marginLeft: 8, textAlign: 'right' }} numberOfLines={2}>
                {item.meaning}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      {/* Search bar */}
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

      {/* Filter & Sort row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 6 }}>
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
        </View>
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
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📝</Text>
              <Text style={{ color: c.textMuted, fontSize: 15, textAlign: 'center' }}>
                단어가 없습니다{'\n'}아래 버튼으로 추가해보세요
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom action buttons */}
      <View style={{ flexDirection: 'row', padding: 16, gap: 10, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border }}>
        <Button title="📷 OCR" variant="outline" onPress={handleScan} style={{ flex: 1, paddingVertical: 12 }} />
        <Button title="+ 단어 추가" onPress={openCreate} style={{ flex: 2, paddingVertical: 12 }} />
      </View>

      {/* Camera Modal */}
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

      {/* Add/Edit Word Modal */}
      <Modal visible={wordModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={{ flex: 1, backgroundColor: c.modalOverlay, justifyContent: 'flex-end' }}>
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
              />
              <TextInput
                value={meaningInput}
                onChangeText={setMeaningInput}
                placeholder="뜻 (한국어 또는 영어)"
                placeholderTextColor={c.placeholder}
                style={{ borderWidth: 1.5, borderColor: c.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 10, color: c.textPrimary, backgroundColor: c.inputBg }}
              />
              <TextInput
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
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
