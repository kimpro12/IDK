import React from 'react';
import { StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import PrimaryButton from '@/src/components/PrimaryButton';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';
import { deterministicDailyPick, findCardById } from '@/src/services/contentEngine';
import { addDraw, listDraws } from '@/src/services/journalRepo';
import { getStatus, requestPermissionsIfNeeded, scheduleDaily, cancelDaily } from '@/src/services/notifications';
import type { MessageCard } from '@/src/types/content';

const DAILY_SEED_KEY = 'sign:dailySeed';
const DAILY_STREAK_KEY = 'sign:dailyStreak';
const DAILY_LAST_DATE_KEY = 'sign:dailyLastDate';

const toLocalDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isYesterday = (dateISO: string, todayISO: string): boolean => {
  const [year, month, day] = todayISO.split('-').map(Number);
  const today = new Date(year, month - 1, day);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return dateISO === toLocalDateISO(yesterday);
};

export default function DailyScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const [card, setCard] = React.useState<MessageCard | null>(null);
  const [streak, setStreak] = React.useState(0);
  const [notificationTime, setNotificationTime] = React.useState('20:00');
  const [notificationStatus, setNotificationStatus] = React.useState<'unknown' | string>('unknown');
  const [notificationSupported, setNotificationSupported] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      const todayISO = toLocalDateISO(new Date());
      let seed = await AsyncStorage.getItem(DAILY_SEED_KEY);
      if (!seed) {
        seed = `seed_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        await AsyncStorage.setItem(DAILY_SEED_KEY, seed);
      }

      const draws = await listDraws({ limit: 50 });
      const todayDraw = draws.find((draw) =>
        draw.isDaily && toLocalDateISO(new Date(draw.createdAt)) === todayISO
      );

      if (todayDraw) {
        const existingCard = todayDraw.cardIds[0] ? findCardById(todayDraw.cardIds[0]) : undefined;
        if (existingCard) {
          setCard(existingCard);
        }
      } else {
        const picked = deterministicDailyPick(todayISO, seed, ['free', 'love', 'career', 'finance']);
        if (picked) {
          setCard(picked);
          await addDraw({
            id: `draw_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            createdAt: Date.now(),
            mode: 'daily',
            cardIds: [picked.id],
            packIds: [picked.id.split('-')[0]],
            question: null,
            note: null,
            isDaily: true,
          });
        }
      }

      const lastDate = await AsyncStorage.getItem(DAILY_LAST_DATE_KEY);
      const storedStreak = Number(await AsyncStorage.getItem(DAILY_STREAK_KEY));
      let nextStreak = Number.isNaN(storedStreak) ? 0 : storedStreak;
      if (lastDate === todayISO) {
        // keep streak
      } else if (lastDate && isYesterday(lastDate, todayISO)) {
        nextStreak += 1;
      } else {
        nextStreak = 1;
      }
      await AsyncStorage.setItem(DAILY_LAST_DATE_KEY, todayISO);
      await AsyncStorage.setItem(DAILY_STREAK_KEY, `${nextStreak}`);
      setStreak(nextStreak);

      const status = await getStatus();
      setNotificationSupported(status.supported);
      setNotificationStatus(status.permissionStatus);
      if (status.scheduledTime) {
        setNotificationTime(status.scheduledTime);
      }
    })();
  }, []);

  const handleSchedule = React.useCallback(async () => {
    const permission = await requestPermissionsIfNeeded();
    setNotificationStatus(permission.status);
    if (!permission.granted) {
      return;
    }
    await scheduleDaily(notificationTime);
  }, [notificationTime]);

  const handleCancel = React.useCallback(async () => {
    await cancelDaily();
  }, []);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        title: {
          color: theme.colors.text,
          ...theme.typography.title,
        },
        subtitle: {
          color: theme.colors.text,
          ...theme.typography.subtitle,
        },
        section: {
          gap: theme.spacing.sm,
        },
        cardText: {
          color: theme.colors.text,
          ...theme.typography.body,
        },
        streak: {
          marginTop: theme.spacing.sm,
        },
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          padding: theme.spacing.sm,
          color: theme.colors.text,
        },
        buttonRow: {
          gap: theme.spacing.sm,
          marginTop: theme.spacing.sm,
        },
        unsupported: {
          marginTop: theme.spacing.sm,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.section}>
        <Text style={styles.title}>Daily Guidance</Text>
        <MutedText>Your daily card stays steady all day.</MutedText>
      </View>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Today&apos;s card</Text>
        <Text style={styles.cardText}>{card?.text ?? 'Pulling your daily guidance…'}</Text>
        <MutedText style={styles.streak}>Streak: {streak} days</MutedText>
      </Card>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Daily reminder</Text>
        {!notificationSupported ? (
          <MutedText style={styles.unsupported}>
            Notifications are only supported on device builds.
          </MutedText>
        ) : (
          <View style={styles.section}>
            <MutedText>Permission: {notificationStatus}</MutedText>
            <TextInput
              style={styles.input}
              value={notificationTime}
              onChangeText={setNotificationTime}
              placeholder="20:00"
              placeholderTextColor={theme.colors.mutedText}
            />
            <View style={styles.buttonRow}>
              <PrimaryButton title="Schedule daily" onPress={handleSchedule} />
              <PrimaryButton title="Cancel reminder" onPress={handleCancel} />
            </View>
          </View>
        )}
      </Card>
    </Screen>
  );
}
