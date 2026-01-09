import React from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';
import { getEnergyState } from '@/src/services/energy';
import { cancelDaily, getStatus, requestPermissionsIfNeeded, scheduleDaily } from '@/src/services/notifications';

const SETTINGS_KEY = 'sign:settings';

type SettingsState = {
  soundEnabled: boolean;
  soundVolume: number;
  hapticsEnabled: boolean;
  dailyNotificationEnabled: boolean;
  dailyNotificationTime: string;
};

const defaultSettings: SettingsState = {
  soundEnabled: true,
  soundVolume: 0.4,
  hapticsEnabled: true,
  dailyNotificationEnabled: false,
  dailyNotificationTime: '20:00',
};

type PackRow = {
  id: string;
  label: string;
  isPremium: boolean;
};

const packs: PackRow[] = [
  { id: 'free', label: 'Free', isPremium: false },
  { id: 'love', label: 'Love', isPremium: true },
  { id: 'career', label: 'Career', isPremium: true },
  { id: 'finance', label: 'Finance', isPremium: true },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const router = useRouter();
  const [settings, setSettings] = React.useState<SettingsState>(defaultSettings);
  const [isPremium, setIsPremium] = React.useState(false);
  const [notificationsSupported, setNotificationsSupported] = React.useState(true);
  const [notificationStatus, setNotificationStatus] = React.useState('unknown');
  const [sliderWidth, setSliderWidth] = React.useState(0);

  React.useEffect(() => {
    void (async () => {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<SettingsState>;
          setSettings({
            soundEnabled: parsed.soundEnabled ?? defaultSettings.soundEnabled,
            soundVolume: parsed.soundVolume ?? defaultSettings.soundVolume,
            hapticsEnabled: parsed.hapticsEnabled ?? defaultSettings.hapticsEnabled,
            dailyNotificationEnabled:
              parsed.dailyNotificationEnabled ?? defaultSettings.dailyNotificationEnabled,
            dailyNotificationTime:
              parsed.dailyNotificationTime ?? defaultSettings.dailyNotificationTime,
          });
        } catch {
          setSettings(defaultSettings);
        }
      }
      const energy = await getEnergyState();
      setIsPremium(energy.isPremium);
      const status = await getStatus();
      setNotificationsSupported(status.supported);
      setNotificationStatus(status.permissionStatus);
      if (status.scheduledTime) {
        setSettings((prev) => ({ ...prev, dailyNotificationTime: status.scheduledTime }));
      }
    })();
  }, []);

  const persistSettings = React.useCallback(async (next: SettingsState) => {
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, []);

  const handleToggleSound = React.useCallback(
    async (value: boolean) => {
      await persistSettings({ ...settings, soundEnabled: value });
    },
    [persistSettings, settings]
  );

  const handleToggleHaptics = React.useCallback(
    async (value: boolean) => {
      await persistSettings({ ...settings, hapticsEnabled: value });
    },
    [persistSettings, settings]
  );

  const handleToggleDaily = React.useCallback(
    async (value: boolean) => {
      if (!notificationsSupported) {
        return;
      }
      if (value) {
        const permission = await requestPermissionsIfNeeded();
        setNotificationStatus(permission.status);
        if (!permission.granted) {
          return;
        }
        await scheduleDaily(settings.dailyNotificationTime);
      } else {
        await cancelDaily();
      }
      await persistSettings({ ...settings, dailyNotificationEnabled: value });
    },
    [notificationsSupported, persistSettings, settings]
  );

  const handleTimeChange = React.useCallback(async (time: string) => {
    await persistSettings({ ...settings, dailyNotificationTime: time });
    if (settings.dailyNotificationEnabled) {
      await scheduleDaily(time);
    }
  }, [persistSettings, settings]);

  const handleSliderPress = React.useCallback(
    async (locationX: number) => {
      if (sliderWidth <= 0) {
        return;
      }
      const ratio = Math.min(1, Math.max(0, locationX / sliderWidth));
      const volume = Number(ratio.toFixed(2));
      await persistSettings({ ...settings, soundVolume: volume });
    },
    [persistSettings, settings, sliderWidth]
  );

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
        row: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          color: theme.colors.text,
          alignSelf: 'flex-start',
        },
        sliderTrack: {
          height: 6,
          borderRadius: 999,
          backgroundColor: theme.colors.border,
          marginTop: theme.spacing.sm,
          overflow: 'hidden',
        },
        sliderFill: {
          height: 6,
          borderRadius: 999,
          backgroundColor: theme.colors.primary,
        },
        badgeRow: {
          flexDirection: 'row',
          gap: theme.spacing.sm,
          flexWrap: 'wrap',
        },
        badge: {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.border,
        },
        badgeText: {
          color: theme.colors.text,
          ...theme.typography.caption,
        },
        locked: {
          color: theme.colors.mutedText,
          ...theme.typography.caption,
        },
        link: {
          color: theme.colors.primary,
          ...theme.typography.body,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.section}>
        <Text style={styles.title}>Settings</Text>
        <MutedText>Personalize your ritual cadence and content packs.</MutedText>
      </View>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Haptics</Text>
        <View style={styles.row}>
          <MutedText>Enable haptics</MutedText>
          <Switch value={settings.hapticsEnabled} onValueChange={handleToggleHaptics} />
        </View>
      </Card>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Sound</Text>
        <View style={styles.row}>
          <MutedText>Enable sound</MutedText>
          <Switch value={settings.soundEnabled} onValueChange={handleToggleSound} />
        </View>
        <MutedText>Volume: {Math.round(settings.soundVolume * 100)}%</MutedText>
        <Pressable
          onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
          onPress={(event) => handleSliderPress(event.nativeEvent.locationX)}
          style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${settings.soundVolume * 100}%` }]} />
        </Pressable>
      </Card>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Daily notifications</Text>
        {!notificationsSupported ? (
          <MutedText>Notifications are only supported on device builds.</MutedText>
        ) : (
          <View style={styles.section}>
            <MutedText>Permission: {notificationStatus}</MutedText>
            <View style={styles.row}>
              <MutedText>Enable daily reminder</MutedText>
              <Switch value={settings.dailyNotificationEnabled} onValueChange={handleToggleDaily} />
            </View>
            <TextInput
              style={styles.input}
              value={settings.dailyNotificationTime}
              onChangeText={handleTimeChange}
              placeholder="20:00"
              placeholderTextColor={theme.colors.mutedText}
            />
            <MutedText>Enter time as HH:MM.</MutedText>
          </View>
        )}
      </Card>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Content packs</Text>
        <View style={styles.badgeRow}>
          {packs.map((pack) => {
            const locked = pack.isPremium && !isPremium;
            return (
              <View key={pack.id} style={styles.badge}>
                <Text style={styles.badgeText}>{pack.label}</Text>
                {locked ? <Text style={styles.locked}>Locked</Text> : null}
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Legal</Text>
        <View style={styles.section}>
          <Pressable onPress={() => router.push('/about')}>
            <Text style={styles.link}>About</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/privacy')}>
            <Text style={styles.link}>Privacy</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/disclaimer')}>
            <Text style={styles.link}>Disclaimer</Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}
