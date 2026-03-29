import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, SafeAreaView, TextInput, Modal,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as db from '../../db/database';
import { useTheme } from '../../theme';
import { RootStackParamList } from '../../types';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'OcrResult'>;

interface ParsedWord { word: string; meaning: string; example: string; selected: boolean }

export default function OcrResultScreen() {
  const navigation = useNavigation<Nav>();
  const { wordbookId, parsedWords } = useRoute<Route>().params;
  const [words, setWords] = useState<ParsedWord[]>(parsedWords.map((w) => ({ ...w, selected: true })));
  const [saving, setSaving] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  const [editExample, setEditExample] = useState('');
  const c = useTheme();

  function toggleSelect(index: number) {
    setWords((prev) => prev.map((w, i) => i === index ? { ...w, selected: !w.selected } : w));
  }

  function toggleAll() {
    const allSelected = words.every((w) => w.selected);
    setWords((prev) => prev.map((w) => ({ ...w, selected: !allSelected })));
  }

  function openEdit(index: number) {
    const w = words[index];
    setEditIndex(index);
    setEditWord(w.word);
    setEditMeaning(w.meaning);
    setEditExample(w.example);
  }

  function saveEdit() {
    if (!editWord.trim() || !editMeaning.trim()) return;
    setWords((prev) => prev.map((w, i) =>
      i === editIndex ? { ...w, word: editWord.trim(), meaning: editMeaning.trim(), example: editExample.trim() } : w
    ));
    setEditIndex(null);
  }

  function handleSave() {
    const selected = words.filter((w) => w.selected);
    if (!selected.length) return Alert.alert('선택 없음', '저장할 단어를 선택해주세요');
    setSaving(true);
    try {
      db.createWords(
        wordbookId,
        selected.map(({ word, meaning, example }) => ({ word, meaning, example: example || undefined }))
      );
      Alert.alert('저장 완료', `${selected.length}개 단어를 저장했습니다.`, [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('오류', '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = words.filter((w) => w.selected).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
        <Text style={{ fontSize: 15, color: c.textSecondary }}>
          {selectedCount}/{words.length}개 선택됨
        </Text>
        <TouchableOpacity onPress={toggleAll}>
          <Text style={{ color: '#6366f1', fontWeight: '600', fontSize: 14 }}>
            {words.every((w) => w.selected) ? '전체 해제' : '전체 선택'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={words}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => toggleSelect(index)}
            onLongPress={() => openEdit(index)}
            style={{
              backgroundColor: item.selected ? c.card : c.secondary,
              borderRadius: 12, padding: 14,
              marginHorizontal: 16, marginVertical: 5,
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1.5,
              borderColor: item.selected ? '#6366f1' : 'transparent',
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>
              {item.selected ? '✅' : '⬜'}
            </Text>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: c.textPrimary }}>{item.word}</Text>
              <Text style={{ fontSize: 14, color: c.textTertiary }}>{item.meaning}</Text>
              {item.example ? (
                <Text style={{ fontSize: 13, color: c.textMuted, fontStyle: 'italic' }}>{item.example}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <Text style={{ textAlign: 'center', color: c.textMuted, fontSize: 12, marginTop: 8, marginBottom: 4 }}>
            꾹 누르면 수정할 수 있어요
          </Text>
        }
      />

      <View style={{ padding: 16, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border }}>
        <Button
          title={`${selectedCount}개 단어 저장하기`}
          onPress={handleSave}
          loading={saving}
          disabled={selectedCount === 0}
        />
      </View>

      {/* Edit Modal */}
      <Modal visible={editIndex !== null} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={() => setEditIndex(null)}>
          <View style={{ flex: 1, backgroundColor: c.modalOverlay, justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: c.textPrimary, marginBottom: 16 }}>단어 수정</Text>
              <TextInput
                value={editWord}
                onChangeText={setEditWord}
                placeholder="영어 단어"
                placeholderTextColor={c.placeholder}
                style={{ borderWidth: 1.5, borderColor: c.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 10, color: c.textPrimary, backgroundColor: c.inputBg }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                value={editMeaning}
                onChangeText={setEditMeaning}
                placeholder="뜻"
                placeholderTextColor={c.placeholder}
                style={{ borderWidth: 1.5, borderColor: c.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 10, color: c.textPrimary, backgroundColor: c.inputBg }}
              />
              <TextInput
                value={editExample}
                onChangeText={setEditExample}
                placeholder="예문 (선택사항)"
                placeholderTextColor={c.placeholder}
                style={{ borderWidth: 1.5, borderColor: c.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16, color: c.textPrimary, backgroundColor: c.inputBg }}
                multiline
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="취소" variant="secondary" onPress={() => setEditIndex(null)} style={{ flex: 1 }} />
                <Button title="수정" onPress={saveEdit} style={{ flex: 1 }} />
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
