import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { useApp } from '../../src/context/AppContext';
import { getDateString, getStreakCount, isActivityScheduledForDate } from '../../src/storage/storage';
import { Colors, FontSize, Spacing } from '../../src/constants/theme';
import EmptyState from '../../src/components/EmptyState';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MONTHS_TR_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

type ViewMode = 'weekly' | 'monthly';

export default function StatsScreen() {
  const { activities, completions } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  const activeActivities = activities.filter(a => !a.archived);

  const chartData = useMemo(() => {
    const today = new Date();
    const days = viewMode === 'weekly' ? 7 : 30;
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getDateString(d);

      const scheduled = activeActivities.filter(a => isActivityScheduledForDate(a, dateStr));
      const completed = scheduled.filter(a =>
        completions.some(c => c.activityId === a.id && c.date === dateStr && c.completed)
      );

      const rate = scheduled.length > 0 ? Math.round((completed.length / scheduled.length) * 100) : 0;
      data.push(rate);

      if (viewMode === 'weekly') {
        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        labels.push(dayNames[d.getDay()]);
      } else {
        labels.push(i % 5 === 0 ? `${d.getDate()}` : '');
      }
    }

    return { labels, datasets: [{ data }] };
  }, [activeActivities, completions, viewMode]);

  const streaks = useMemo(() => {
    return activeActivities.map(a => ({
      activity: a,
      streak: getStreakCount(a.id, completions, a),
    })).sort((a, b) => b.streak - a.streak);
  }, [activeActivities, completions]);

  // Heatmap: last 12 weeks (84 days)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const days: { date: string; rate: number; dayOfWeek: number }[] = [];

    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getDateString(d);

      const scheduled = activeActivities.filter(a => isActivityScheduledForDate(a, dateStr));
      const completed = scheduled.filter(a =>
        completions.some(c => c.activityId === a.id && c.date === dateStr && c.completed)
      );

      const rate = scheduled.length > 0 ? completed.length / scheduled.length : -1;
      days.push({ date: dateStr, rate, dayOfWeek: d.getDay() });
    }

    return days;
  }, [activeActivities, completions]);

  const getHeatColor = (rate: number): string => {
    if (rate < 0) return Colors.border;
    if (rate === 0) return '#FEE2E2';
    if (rate < 0.5) return '#FDE68A';
    if (rate < 1) return '#BBF7D0';
    return '#4ADE80';
  };

  if (activeActivities.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>İstatistikler</Text>
        </View>
        <EmptyState
          emoji="📊"
          title="Henüz veri yok"
          subtitle="Aktivite oluşturup tamamlamaya başladığında burada istatistiklerin görünecek."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>İstatistikler</Text>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'weekly' && styles.toggleBtnActive]}
            onPress={() => setViewMode('weekly')}
          >
            <Text style={[styles.toggleText, viewMode === 'weekly' && styles.toggleTextActive]}>
              Haftalık
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleBtnActive]}
            onPress={() => setViewMode('monthly')}
          >
            <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>
              Aylık
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Tamamlanma Oranı (%)</Text>
          <BarChart
            data={chartData}
            width={SCREEN_WIDTH - 64}
            height={200}
            yAxisSuffix="%"
            yAxisLabel=""
            fromZero
            chartConfig={{
              backgroundColor: Colors.surface,
              backgroundGradientFrom: Colors.surface,
              backgroundGradientTo: Colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
              labelColor: () => Colors.textSecondary,
              barPercentage: viewMode === 'weekly' ? 0.6 : 0.3,
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: Colors.border,
              },
            }}
            style={styles.chart}
          />
        </View>

        {/* Streak Section */}
        <View style={styles.streakCard}>
          <Text style={styles.cardTitle}>Seri Sayaçları 🔥</Text>
          {streaks.map(({ activity, streak }) => (
            <View key={activity.id} style={styles.streakRow}>
              <View style={styles.streakLeft}>
                <Text style={styles.streakEmoji}>{activity.emoji}</Text>
                <Text style={styles.streakName} numberOfLines={1}>{activity.name}</Text>
              </View>
              <View style={[styles.streakBadge, { backgroundColor: activity.color + '20' }]}>
                <Text style={[styles.streakCount, { color: activity.color }]}>
                  {streak} gün
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Heatmap */}
        <View style={styles.heatmapCard}>
          <Text style={styles.cardTitle}>Son 12 Hafta</Text>
          <View style={styles.heatmapGrid}>
            {Array.from({ length: 7 }, (_, row) => (
              <View key={row} style={styles.heatmapRow}>
                {heatmapData
                  .filter((_, idx) => {
                    const firstDayOffset = heatmapData[0]?.dayOfWeek ?? 0;
                    return ((idx + firstDayOffset) % 7) === row;
                  })
                  .slice(0, 12)
                  .map((day, col) => (
                    <View
                      key={col}
                      style={[styles.heatmapCell, { backgroundColor: getHeatColor(day.rate) }]}
                    />
                  ))}
              </View>
            ))}
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={styles.legendLabel}>Az</Text>
            {['#FEE2E2', '#FDE68A', '#BBF7D0', '#4ADE80'].map(c => (
              <View key={c} style={[styles.legendCell, { backgroundColor: c }]} />
            ))}
            <Text style={styles.legendLabel}>Çok</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFF',
  },
  chartCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  streakCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  streakEmoji: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  streakName: {
    fontSize: FontSize.sm,
    color: Colors.text,
    flex: 1,
  },
  streakBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  streakCount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  heatmapCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heatmapGrid: {
    gap: 3,
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: 3,
  },
  heatmapCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
    maxWidth: 24,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: 4,
  },
  legendCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginHorizontal: 4,
  },
});
