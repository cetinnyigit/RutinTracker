import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { isActivityScheduledForDate, getDateString } from '../../src/storage/storage';
import ActivityItem from '../../src/components/ActivityItem';
import ProgressBar from '../../src/components/ProgressBar';
import EmptyState from '../../src/components/EmptyState';
import { Colors, FontSize, Spacing } from '../../src/constants/theme';

const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export default function TodayScreen() {
  const { activities, completions, loading, toggleCompletion } = useApp();
  const router = useRouter();
  const today = new Date();
  const todayStr = getDateString(today);

  const todayActivities = useMemo(
    () => activities.filter(a => isActivityScheduledForDate(a, todayStr)),
    [activities, todayStr]
  );

  const completionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    completions.forEach(c => {
      if (c.date === todayStr) map.set(c.activityId, c.completed);
    });
    return map;
  }, [completions, todayStr]);

  const completedCount = todayActivities.filter(a => completionMap.get(a.id)).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const greeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Günaydın! ☀️';
    if (hour < 18) return 'İyi günler! 👋';
    return 'İyi akşamlar! 🌙';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting()}</Text>
        <Text style={styles.date}>
          {today.getDate()} {MONTHS_TR[today.getMonth()]} {today.getFullYear()}, {DAYS_TR[today.getDay()]}
        </Text>
      </View>

      {todayActivities.length > 0 && (
        <ProgressBar completed={completedCount} total={todayActivities.length} />
      )}

      <FlatList
        data={todayActivities}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ActivityItem
            activity={item}
            isCompleted={completionMap.get(item.id) ?? false}
            onToggle={() => toggleCompletion(item.id, todayStr)}
          />
        )}
        contentContainerStyle={todayActivities.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            emoji="🎯"
            title="Henüz aktivite yok"
            subtitle="Sağ alttaki + butonuna tıklayarak ilk aktiviteni oluştur!"
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  date: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
