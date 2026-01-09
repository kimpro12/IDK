import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const DAILY_NOTIFICATION_ID_KEY = 'sign:dailyNotificationId';
const DAILY_NOTIFICATION_TIME_KEY = 'sign:dailyNotificationTime';

const isSupported = (): boolean => Platform.OS !== 'web';

export const requestPermissionsIfNeeded = async () => {
  if (!isSupported()) {
    return { status: 'unavailable' as const, granted: false };
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return { status: current.status, granted: true };
  }
  const requested = await Notifications.requestPermissionsAsync();
  return { status: requested.status, granted: requested.granted };
};

export const scheduleDaily = async (timeHHMM: string): Promise<string | null> => {
  if (!isSupported()) {
    return null;
  }
  const [hourString, minuteString] = timeHHMM.split(':');
  const hour = Number(hourString);
  const minute = Number(minuteString);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error('Invalid time format. Expected HH:MM.');
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily guidance is ready',
      body: 'Your daily sign is waiting for you.',
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
  await AsyncStorage.setItem(DAILY_NOTIFICATION_ID_KEY, id);
  await AsyncStorage.setItem(DAILY_NOTIFICATION_TIME_KEY, timeHHMM);
  return id;
};

export const cancelDaily = async (): Promise<void> => {
  if (!isSupported()) {
    return;
  }
  const id = await AsyncStorage.getItem(DAILY_NOTIFICATION_ID_KEY);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
  await AsyncStorage.removeItem(DAILY_NOTIFICATION_ID_KEY);
  await AsyncStorage.removeItem(DAILY_NOTIFICATION_TIME_KEY);
};

export const getStatus = async () => {
  if (!isSupported()) {
    return {
      supported: false,
      scheduledTime: null as string | null,
      permissionStatus: 'unavailable',
    };
  }
  const permissions = await Notifications.getPermissionsAsync();
  const scheduledTime = await AsyncStorage.getItem(DAILY_NOTIFICATION_TIME_KEY);
  return {
    supported: true,
    scheduledTime,
    permissionStatus: permissions.status,
  };
};
