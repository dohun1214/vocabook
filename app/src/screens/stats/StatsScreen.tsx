import React from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { Stats } from '../../types';

export default function StatsScreen() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchStats = React.useCallback(async () => {
    try {
      const { data } = await api.get('/stats');
      setStats(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(React.useCallback(() => { fetchStats(); }, [fetchStats]));

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#6366f1" />;
  if (!stats) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor="#6366f1" />}
      >
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16 }}>학습 통계</Text>

        {/* Summary cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <StatCard icon="📚" label="전체 단어" value={stats.words.total.toString()} color="#eef2ff" />
          <StatCard icon="★" label="즐겨찾기" value={stats.words.favorite.toString()} color="#fef9c3" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <StatCard icon="📖" label="오늘 학습" value={stats.study.todayCount.toString()} color="#fff7ed" />
          <StatCard icon="🎯" label="정답률" value={`${stats.study.accuracy}%`} color="#fdf2f8" />
        </View>

        {/* Streak */}
        <View style={{
          backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12,
          flexDirection: 'row', alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        }}>
          <Text style={{ fontSize: 40, marginRight: 16 }}>🔥</Text>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#f97316' }}>{stats.study.streak}일</Text>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>연속 학습 중</Text>
          </View>
        </View>

        {/* Wordbook progress */}
        {stats.wordbooks.length > 0 && (
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 }}>단어장별 암기율</Text>
            {stats.wordbooks.map((wb) => (
              <View key={wb.id} style={{
                backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8,
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }} numberOfLines={1}>{wb.name}</Text>
                <Text style={{ fontSize: 13, color: '#6b7280' }}>{wb.wordCount}개</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: color, borderRadius: 16, padding: 16,
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: 28, marginBottom: 4 }}>{icon}</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827' }}>{value}</Text>
      <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</Text>
    </View>
  );
}
