import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../types';
import { Colors, FontSize, Spacing } from '../constants/theme';

interface ActivityItemProps {
  activity: Activity;
  isCompleted: boolean;
  onToggle: () => void;
}

export default function ActivityItem({ activity, isCompleted, onToggle }: ActivityItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isCompleted && styles.completedContainer]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.emojiContainer, { backgroundColor: activity.color + '20' }]}>
        <Text style={styles.emoji}>{activity.emoji}</Text>
      </View>
      <Text style={[styles.name, isCompleted && styles.completedName]}>
        {activity.name}
      </Text>
      <View style={[styles.checkbox, isCompleted && { backgroundColor: activity.color, borderColor: activity.color }]}>
        {isCompleted && <Ionicons name="checkmark" size={16} color="#FFF" />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  completedContainer: {
    opacity: 0.7,
  },
  emojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  emoji: {
    fontSize: 20,
  },
  name: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  completedName: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
