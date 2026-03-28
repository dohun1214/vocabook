import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, SafeAreaView, TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import api from '../../services/api';
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
  const c = useTheme();

  function toggleSelect(index: number) {
    setWords((prev) => prev.map((w, i) => i === index ? { ...w, selected: !w.selected } : w));
  }

  function toggleAll() {
    const allSelected = words.every((w) => w.selected);
    setWords((prev) => prev.map((w) => ({ ...w, selected: !allSelected })));
  }

  function updateWord(index: number, field: keyof Omit<ParsedWord, 'selected'>, value: string) {
    setWords((prev) => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
  }

  async function handleSave() {
    const selected = words.filter((w) => w.selected);
    if (!selected.length) return Alert.alert('선택 없음', '저장할 단어를 선택해주세요');
    setSaving(true);
    try {
      await api.post(`/wordbooks/${wordbookId}/words/bulk`, {
        words: selected.map(({ word, meaning, example }) => ({ word, meaning, example: example || undefined })),
      });
      Alert.alert('저장 완료', `${selected.length}개 단어를 저장했습니다`, [
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
          <View style={{
            backgroundColor: c.card, borderRadius: 12, padding: 14,
            marginHorizontal: 16, marginVertical: 5, flexDirection: 'row',
            opacity: item.selected ? 1 : 0.5,
          }}>
            <TouchableOpacity onPress={() => toggleSelect(index)} style={{ marginRight: 12, paddingTop: 2 }}>
              <Text style={{ fontSize: 22 }}>{item.selected ? '✅' : '⬜'}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, gap: 6 }}>
              <TextInput
                value={item.word}
                onChangeText={(t) => updateWord(index, 'word', t)}
                style={{ fontSize: 16, fontWeight: '700', color: c.textPrimary, padding: 0 }}
                selectTextOnFocus
              />
              <TextInput
                value={item.meaning}
                onChangeText={(t) => updateWord(index, 'meaning', t)}
                style={{ fontSize: 14, color: c.textTertiary, padding: 0 }}
                selectTextOnFocus
              />
              <TextInput
                value={item.example}
                onChangeText={(t) => updateWord(index, 'example', t)}
                style={{ fontSize: 13, color: c.textMuted, padding: 0, fontStyle: 'italic' }}
                placeholder="예문"
                placeholderTextColor={c.placeholder}
                selectTextOnFocus
                multiline
              />
            </View>
          </View>
        )}
      />

      <View style={{ padding: 16, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border }}>
        <Button
          title={`${selectedCount}개 단어 저장하기`}
          onPress={handleSave}
          loading={saving}
          disabled={selectedCount === 0}
        />
      </View>
    </SafeAreaView>
  );
}
