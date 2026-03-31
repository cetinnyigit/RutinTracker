import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/context/AppContext';
import { Colors, FontSize, Spacing, ActivityColors, ActivityEmojis } from '../src/constants/theme';
import { scheduleActivityReminder, cancelActivityReminder, requestPermissions } from '../src/storage/notifications';
import { Activity } from '../src/types';

const WEEK_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const WEEK_DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

export default function EditScreen() {
  const { activities, updateActivity, deleteActivity } = useApp();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const activity = activities.find(a => a.id === id);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [color, setColor] = useState(ActivityColors[0]);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState('09');
  const [reminderMinute, setReminderMinute] = useState('00');

  useEffect(() => {
    if (activity) {
      setName(activity.name);
      setEmoji(activity.emoji);
      setColor(activity.color);
      setFrequency(activity.frequency);
      setWeekDays(activity.weekDays ?? [1, 2, 3, 4, 5]);
      if (activity.reminderTime) {
        setReminderEnabled(true);
        const [h, m] = activity.reminderTime.split(':');
        setReminderHour(h);
        setReminderMinute(m);
      }
    }
  }, [activity]);

  if (!activity) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 20 }}>Aktivite bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  const toggleWeekDay = (day: number) => {
    setWeekDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen bir aktivite adı girin.');
      return;
    }

    const reminderTime = reminderEnabled
      ? `${reminderHour.padStart(2, '0')}:${reminderMinute.padStart(2, '0')}`
      : undefined;

    const updated: Activity = {
      ...activity,
      name: name.trim(),
      emoji,
      color,
      frequency,
      weekDays: frequency === 'weekly' ? weekDays : undefined,
      reminderTime,
    };

    if (reminderEnabled) {
      const granted = await requestPermissions();
      if (granted) {
        await scheduleActivityReminder(updated);
      }
    } else {
      await cancelActivityReminder(activity.id);
    }

    await updateActivity(updated);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Aktiviteyi Sil',
      `"${activity.name}" aktivitesini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await cancelActivityReminder(activity.id);
            await deleteActivity(activity.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleArchive = async () => {
    const updated: Activity = { ...activity, archived: !activity.archived };
    if (updated.archived) {
      await cancelActivityReminder(activity.id);
    }
    await updateActivity(updated);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Düzenle</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveBtn}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Aktivite Adı</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          maxLength={50}
        />

        <Text style={styles.sectionTitle}>Emoji</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {ActivityEmojis.map(e => (
            <TouchableOpacity
              key={e}
              style={[styles.emojiBtn, emoji === e && styles.emojiBtnSelected]}
              onPress={() => setEmoji(e)}
            >
              <Text style={styles.emojiText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Renk</Text>
        <View style={styles.colorRow}>
          {ActivityColors.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.colorBtn, { backgroundColor: c }, color === c && styles.colorBtnSelected]}
              onPress={() => setColor(c)}
            >
              {color === c && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Tekrar Sıklığı</Text>
        <View style={styles.freqRow}>
          <TouchableOpacity
            style={[styles.freqBtn, frequency === 'daily' && styles.freqBtnActive]}
            onPress={() => setFrequency('daily')}
          >
            <Text style={[styles.freqText, frequency === 'daily' && styles.freqTextActive]}>
              Her Gün
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.freqBtn, frequency === 'weekly' && styles.freqBtnActive]}
            onPress={() => setFrequency('weekly')}
          >
            <Text style={[styles.freqText, frequency === 'weekly' && styles.freqTextActive]}>
              Belirli Günler
            </Text>
          </TouchableOpacity>
        </View>

        {frequency === 'weekly' && (
          <View style={styles.weekDayRow}>
            {WEEK_DAYS.map((label, i) => (
              <TouchableOpacity
                key={label}
                style={[
                  styles.weekDayBtn,
                  weekDays.includes(WEEK_DAY_VALUES[i]) && { backgroundColor: color },
                ]}
                onPress={() => toggleWeekDay(WEEK_DAY_VALUES[i])}
              >
                <Text style={[
                  styles.weekDayText,
                  weekDays.includes(WEEK_DAY_VALUES[i]) && styles.weekDayTextActive,
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Hatırlatıcı</Text>
        <TouchableOpacity
          style={styles.reminderToggle}
          onPress={() => setReminderEnabled(!reminderEnabled)}
        >
          <Text style={styles.reminderLabel}>Hatırlatıcı Ayarla</Text>
          <Ionicons
            name={reminderEnabled ? 'toggle' : 'toggle-outline'}
            size={36}
            color={reminderEnabled ? Colors.primary : Colors.disabled}
          />
        </TouchableOpacity>

        {reminderEnabled && (
          <View style={styles.timeRow}>
            <TextInput
              style={styles.timeInput}
              value={reminderHour}
              onChangeText={(text) => {
                const num = text.replace(/[^0-9]/g, '');
                if (num.length <= 2 && Number(num) <= 23) setReminderHour(num);
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.timeSeparator}>:</Text>
            <TextInput
              style={styles.timeInput}
              value={reminderMinute}
              onChangeText={(text) => {
                const num = text.replace(/[^0-9]/g, '');
                if (num.length <= 2 && Number(num) <= 59) setReminderMinute(num);
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.archiveBtn} onPress={handleArchive}>
            <Ionicons
              name={activity.archived ? 'arrow-undo-outline' : 'archive-outline'}
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.archiveBtnText}>
              {activity.archived ? 'Arşivden Çıkar' : 'Arşivle'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            <Text style={styles.deleteBtnText}>Sil</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  saveBtn: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  emojiText: {
    fontSize: 24,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorBtnSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  freqRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freqBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  freqText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  freqTextActive: {
    color: '#FFF',
  },
  weekDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  weekDayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekDayText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  weekDayTextActive: {
    color: '#FFF',
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reminderLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  timeInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    width: 70,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeSeparator: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  archiveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
  },
  archiveBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.danger + '15',
  },
  deleteBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.danger,
  },
});
