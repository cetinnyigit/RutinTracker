import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Activity } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return true;
}

export async function scheduleActivityReminder(activity: Activity): Promise<string | null> {
  if (!activity.reminderTime) return null;

  // Cancel existing notifications for this activity
  await cancelActivityReminder(activity.id);

  const [hours, minutes] = activity.reminderTime.split(':').map(Number);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${activity.emoji} ${activity.name}`,
      body: `Bugün "${activity.name}" aktiviteni tamamlamayı unutma!`,
      data: { activityId: activity.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });

  return identifier;
}

export async function cancelActivityReminder(activityId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.activityId === activityId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}
