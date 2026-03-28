import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { speak } from '../../services/tts';
import { useTheme } from '../../theme';
import { Word } from '../../types';

interface FavoriteWord extends Word {
  wordbookName: string;
}

export default function FavoritesScreen() {
  const [words, setWords] = useState<FavoriteWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMeaning, setShowMeaning] = useState(true);
  const c = useTheme();

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  async function loadFavorites() {
    try {
      const { data: wbData } = await api.get('/wordbooks');
      const wordbooks: { id: number; name: string }[] = wbData.wordbooks;

      const results: FavoriteWord[] = [];
      await Promise.all(
        wordbooks.map(async (wb) => {
          try {
            const { data } = await api.get(`/wordbooks/${wb.id}/words`, {
              params: { isFavorite: 'true' },
            });
            results.push(...data.words.map((w: Word) => ({ ...w, wordbookName: wb.name })));
          } catch {}
        })
      );

      results.sort((a, b) => a.word.localeCompare(b.word));
      setWords(results);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function toggleFavorite(id: number, current: boolean) {
    try {
      await api.patch(`/words/${id}/favorite`, { isFavorite: !current });
      setWords((prev) => prev.map((w) => w.id === id ? { ...w, isFavorite: !current } : w));
    } catch {}
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <ActivityIndicator style={{ flex: 1 }} color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: c.textPrimary }}>즐겨찾기</Text>
          <Text style={{ fontSize: 14, color: c.textSecondary, marginTop: 4 }}>전체 {words.length}개 단어</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 12, color: c.textSecondary }}>뜻 보기</Text>
          <Switch
            value={showMeaning}
            onValueChange={setShowMeaning}
            trackColor={{ false: c.switchTrackFalse, true: '#6366f1' }}
            thumbColor="#fff"
            style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
          />
        </View>
      </View>

      <FlatList
        data={words}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadFavorites(); }}
            tintColor="#6366f1"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: c.card, borderRadius: 14, padding: 16,
              marginHorizontal: 16, marginVertical: 5,
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
            }}
            onPress={() => speak(item.word)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => toggleFavorite(item.id, item.isFavorite)} style={{ marginRight: 10 }}>
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
            <Text style={{ fontSize: 11, color: c.accentBgSubtle, marginTop: 6, marginLeft: 30 }}>{item.wordbookName}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>★</Text>
            <Text style={{ fontSize: 16, color: c.textMuted, textAlign: 'center' }}>
              즐겨찾기한 단어가 없습니다{'\n'}단어장에서 ★를 눌러 추가해보세요
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
