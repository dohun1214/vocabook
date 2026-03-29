import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput,
  RefreshControl, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as db from '../../db/database';
import { speak } from '../../services/tts';
import { useTheme } from '../../theme';
import { Wordbook, Word, RootStackParamList } from '../../types';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type SortType = 'recent' | 'name';

interface SearchResult extends Word {
  wordbookName: string;
  wordbookId: number;
}

export default function WordbookListScreen() {
  const navigation = useNavigation<Nav>();
  const c = useTheme();
  const [wordbooks, setWordbooks] = useState<Wordbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState<SortType>('recent');
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Wordbook | null>(null);
  const [inputName, setInputName] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchWordbooks = useCallback(() => {
    try {
      const data = db.getWordbooks();
      setWordbooks(data);
    } catch {
      Alert.alert('오류', '단어장을 불러오지 못했습니다');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchWordbooks(); }, [fetchWordbooks]));

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = db.searchAllWords(text.trim());
      setSearchResults(results);
    } catch {}
    finally {
      setSearching(false);
    }
  }, []);

  const sortedWordbooks = [...wordbooks].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  function openCreate() {
    setEditTarget(null);
    setInputName('');
    setModalVisible(true);
  }

  function openEdit(wb: Wordbook) {
    setEditTarget(wb);
    setInputName(wb.name);
    setModalVisible(true);
  }

  function handleSave() {
    if (!inputName.trim()) return Alert.alert('오류', '단어장 이름을 입력해주세요');
    setSaving(true);
    try {
      if (editTarget) {
        db.updateWordbook(editTarget.id, inputName.trim());
      } else {
        db.createWordbook(inputName.trim());
      }
      setModalVisible(false);
      fetchWordbooks();
    } catch {
      Alert.alert('오류', '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(wb: Wordbook) {
    Alert.alert(
      '단어장 삭제',
      `"${wb.name}" 단어장을 삭제하면 모든 단어도 함께 삭제됩니다. 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: () => {
            try {
              db.deleteWordbook(wb.id);
              fetchWordbooks();
            } catch {
              Alert.alert('오류', '삭제에 실패했습니다');
            }
          },
        },
      ]
    );
  }

  function renderItem({ item }: { item: Wordbook }) {
    return (
      <TouchableOpacity
        style={{
          backgroundColor: c.card, borderRadius: 16, padding: 20,
          marginHorizontal: 16, marginVertical: 6,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        }}
        onPress={() => navigation.navigate('WordList', { wordbookId: item.id, wordbookName: item.name })}
        onLongPress={() =>
          Alert.alert(item.name, '무엇을 하시겠어요?', [
            { text: '취소', style: 'cancel' },
            { text: '수정', onPress: () => openEdit(item) },
            { text: '삭제', style: 'destructive', onPress: () => handleDelete(item) },
          ])
        }
      >
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: c.textPrimary, marginBottom: 4 }}>{item.name}</Text>
          <Text style={{ fontSize: 13, color: c.textSecondary }}>{item.wordCount}개 단어</Text>
        </View>

        <TouchableOpacity
          style={{
            marginTop: 12, paddingVertical: 8, backgroundColor: c.accentBg,
            borderRadius: 8, alignItems: 'center',
          }}
          onPress={() => navigation.navigate('StudyModeSelect', { wordbookId: item.id, wordbookName: item.name })}
        >
          <Text style={{ color: '#6366f1', fontWeight: '600', fontSize: 14 }}>학습 시작 →</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  function renderSearchResult({ item }: { item: SearchResult }) {
    return (
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
          <Text style={{ fontSize: 14, color: c.textTertiary, flexShrink: 1, marginLeft: 8, textAlign: 'right' }} numberOfLines={2}>
            {item.meaning}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: c.accentBgSubtle, marginTop: 6 }}>{item.wordbookName}</Text>
      </TouchableOpacity>
    );
  }

  const isSearching = search.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16,
      }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: c.textPrimary }}>내 단어장</Text>
        <TouchableOpacity
          onPress={openCreate}
          style={{ backgroundColor: '#6366f1', borderRadius: 12, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 26 }}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="전체 단어장에서 검색..."
          placeholderTextColor={c.placeholder}
          style={{
            backgroundColor: c.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
            fontSize: 15, borderWidth: 1, borderColor: c.border, color: c.textPrimary,
          }}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {isSearching ? (
        searching ? (
          <ActivityIndicator style={{ flex: 1 }} color="#6366f1" />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSearchResult}
            ListHeaderComponent={
              <Text style={{ fontSize: 13, color: c.textSecondary, paddingHorizontal: 16, marginBottom: 6 }}>
                검색 결과 {searchResults.length}개
              </Text>
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 50 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
                <Text style={{ color: c.textMuted, fontSize: 15, textAlign: 'center' }}>
                  검색 결과가 없습니다.
                </Text>
              </View>
            }
          />
        )
      ) : (
        <>
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 }}>
            {(['recent', 'name'] as SortType[]).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSort(s)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: sort === s ? '#6366f1' : c.chipBg,
                }}
              >
                <Text style={{ fontSize: 13, color: sort === s ? '#fff' : c.chipText, fontWeight: '500' }}>
                  {s === 'recent' ? '최근순' : '이름순'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator style={{ flex: 1 }} color="#6366f1" />
          ) : (
            <FlatList
              data={sortedWordbooks}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWordbooks(); }} tintColor="#6366f1" />}
              ListEmptyComponent={
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 }}>
                  <Image source={require('../../../assets/book.png')} style={{ width: 48, height: 48, marginBottom: 16 }} resizeMode="contain" />
                  <Text style={{ fontSize: 16, color: c.textMuted, textAlign: 'center' }}>
                    단어장이 없습니다.{'\n'}+ 버튼을 눌러 첫 단어장을 만들어보세요.
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={{ flex: 1, backgroundColor: c.modalOverlay, justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: c.textPrimary, marginBottom: 16 }}>
                {editTarget ? '단어장 수정' : '새 단어장 만들기'}
              </Text>
              <TextInput
                value={inputName}
                onChangeText={setInputName}
                placeholder="단어장 이름을 입력하세요."
                placeholderTextColor={c.placeholder}
                style={{
                  borderWidth: 1.5, borderColor: c.inputBorder, borderRadius: 10,
                  paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16,
                  color: c.textPrimary, backgroundColor: c.inputBg,
                }}
                autoFocus
                maxLength={100}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="취소" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
                <Button title={editTarget ? '수정' : '만들기'} onPress={handleSave} loading={saving} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
