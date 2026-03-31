import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import EmptyState from '../../src/components/EmptyState';
import { Colors, FontSize, Spacing } from '../../src/constants/theme';
import { Activity } from '../../src/types';

type Filter = 'active' | 'archived';

const FREQ_LABELS: Record<string, string> = {
  daily: 'Her gün',
  weekly: 'Belirli günler',
};

export default function ManageScreen() {
  const { activities } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('active');

  const filteredActivities = useMemo(
    () => activities.filter(a => (filter === 'active' ? !a.archived : a.archived)),
    [activities, filter]
  );

  const renderItem = ({ item }: { item: Activity }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/edit', params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <View style={[styles.emojiBox, { backgroundColor: item.color + '20' }]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.freq}>{FREQ_LABELS[item.frequency]}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Aktiviteler</Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'active' && styles.filterBtnActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Aktif ({activities.filter(a => !a.archived).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'archived' && styles.filterBtnActive]}
          onPress={() => setFilter('archived')}
        >
          <Text style={[styles.filterText, filter === 'archived' && styles.filterTextActive]}>
            Arşiv ({activities.filter(a => a.archived).length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredActivities}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={filteredActivities.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            emoji={filter === 'active' ? '📋' : '📦'}
            title={filter === 'active' ? 'Aktivite yok' : 'Arşiv boş'}
            subtitle={
              filter === 'active'
                ? 'Yeni bir aktivite oluşturmak için "Bugün" sekmesindeki + butonunu kullan.'
                : 'Arşivlediğin aktiviteler burada görünecek.'
            }
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  freq: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
