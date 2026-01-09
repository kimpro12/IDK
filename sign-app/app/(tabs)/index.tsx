import React from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import PrimaryButton from '@/src/components/PrimaryButton';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';
import { pickForIntent } from '@/src/services/contentEngine';
import { addDraw } from '@/src/services/journalRepo';
import { consumeEnergy, restoreOneEnergy, resetIfNewDay } from '@/src/services/energy';
import type { EnergyState } from '@/src/services/energy';
import type { PackId } from '@/src/types/content';

const HOLD_DURATION_MS = 3000;
const HAPTIC_INTERVAL_MS = 300;
const SETTINGS_KEY = 'sign:settings';

type SettingsState = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};

const defaultSettings: SettingsState = {
  soundEnabled: true,
  hapticsEnabled: true,
};

type Particle = {
  id: string;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
};

export default function RitualScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const router = useRouter();
  const [energyState, setEnergyState] = React.useState<EnergyState | null>(null);
  const [settings, setSettings] = React.useState<SettingsState>(defaultSettings);
  const [isHolding, setIsHolding] = React.useState(false);
  const [spreadMode, setSpreadMode] = React.useState<'1' | '3'>('3');

  const progress = React.useRef(new Animated.Value(0)).current;
  const holdTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = React.useRef<Audio.Sound | null>(null);
  const hasTriggeredRef = React.useRef(false);

  const particles = React.useMemo<Particle[]>(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        id: `particle-${index}`,
        size: 6 + (index % 3) * 4,
        x: 18 + index * 34,
        y: 110 + (index % 4) * 58,
        duration: 3600 + index * 400,
        delay: index * 250,
      })),
    []
  );

  const particleAnimations = React.useMemo(
    () => particles.map(() => new Animated.Value(0)),
    [particles]
  );

  React.useEffect(() => {
    particleAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: particles[index].duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: particles[index].duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        { delay: particles[index].delay }
      ).start();
    });
  }, [particleAnimations, particles]);

  React.useEffect(() => {
    void (async () => {
      const state = await resetIfNewDay(new Date());
      setEnergyState(state);
      const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        try {
          const parsed = JSON.parse(storedSettings) as Partial<SettingsState>;
          setSettings({
            soundEnabled: parsed.soundEnabled ?? defaultSettings.soundEnabled,
            hapticsEnabled: parsed.hapticsEnabled ?? defaultSettings.hapticsEnabled,
          });
        } catch {
          setSettings(defaultSettings);
        }
      }
    })();
  }, []);

  const remaining = energyState?.remaining ?? 3;
  const isPremium = energyState?.isPremium ?? false;
  const isBlocked = !isPremium && remaining <= 0;

  const playAmbient = React.useCallback(async () => {
    if (!settings.soundEnabled) {
      return;
    }
    try {
      const sound = new Audio.Sound();
      const asset = require('@/src/assets/sfx/ambient.mp3');
      await sound.loadAsync(asset, { isLooping: true, volume: 0.4 });
      await sound.playAsync();
      soundRef.current = sound;
    } catch {
      // Missing or invalid audio should not block the ritual flow.
    }
  }, [settings.soundEnabled]);

  const startHaptics = React.useCallback(() => {
    if (!settings.hapticsEnabled) {
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hapticIntervalRef.current = setInterval(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, HAPTIC_INTERVAL_MS);
  }, [settings.hapticsEnabled]);

  const stopHaptics = React.useCallback(() => {
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
  }, []);

  const stopRitual = React.useCallback(async (resetTrigger = true) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    stopHaptics();
    setIsHolding(false);
    if (resetTrigger) {
      hasTriggeredRef.current = false;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    try {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
    } catch {
      // ignore audio cleanup errors
    }
    soundRef.current = null;
  }, [progress, stopHaptics]);

  const completeHold = React.useCallback(async () => {
    if (hasTriggeredRef.current) {
      return;
    }
    hasTriggeredRef.current = true;
    await stopRitual(false);

    const card = pickForIntent({});
    if (!card) {
      return;
    }

    const updated = await consumeEnergy();
    setEnergyState(updated);

    const packId = card.id.split('-')[0] as PackId;
    const drawId = `draw_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    await addDraw({
      id: drawId,
      createdAt: Date.now(),
      mode: 'ritual',
      cardIds: [card.id],
      packIds: [packId],
      question: null,
      note: null,
      isDaily: false,
    });

    router.push({
      pathname: '/reveal',
      params: { drawId },
    });
  }, [router, stopRitual]);

  const handlePressIn = React.useCallback(() => {
    if (isBlocked || isHolding || hasTriggeredRef.current) {
      return;
    }
    setIsHolding(true);
    hasTriggeredRef.current = false;
    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    startHaptics();
    void playAmbient();
    holdTimeoutRef.current = setTimeout(() => {
      void completeHold();
    }, HOLD_DURATION_MS);
  }, [completeHold, isBlocked, isHolding, playAmbient, progress, startHaptics]);

  const handlePressOut = React.useCallback(() => {
    if (hasTriggeredRef.current) {
      return;
    }
    void stopRitual(true);
  }, [stopRitual]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        void stopRitual(true);
      };
    }, [stopRitual])
  );

  const handleRestore = React.useCallback(async () => {
    const updated = await restoreOneEnergy();
    setEnergyState(updated);
  }, []);

  const handleOpenSpread = React.useCallback(() => {
    router.push({
      pathname: '/spread',
      params: { mode: spreadMode },
    });
  }, [router, spreadMode]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        background: {
          backgroundColor: theme.colors.ritualBackground,
        },
        title: {
          color: theme.colors.text,
          ...theme.typography.title,
        },
        subtitle: {
          color: theme.colors.mutedText,
          ...theme.typography.body,
        },
        sectionTitle: {
          color: theme.colors.text,
          ...theme.typography.subtitle,
        },
        cardStack: {
          gap: theme.spacing.md,
        },
        buttonRow: {
          gap: theme.spacing.sm,
        },
        modeSwitch: {
          flexDirection: 'row',
          gap: theme.spacing.sm,
          marginTop: theme.spacing.sm,
        },
        modeButton: {
          flex: 1,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: 'center',
        },
        modeButtonActive: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        modeButtonText: {
          color: theme.colors.text,
          ...theme.typography.body,
        },
        energyRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        energyValue: {
          color: theme.colors.text,
          ...theme.typography.subtitle,
        },
        ritualArea: {
          marginTop: theme.spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
          height: 280,
        },
        circle: {
          width: 170,
          height: 170,
          borderRadius: 85,
          backgroundColor: theme.colors.ritualGlow,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: theme.colors.ritualGlow,
          shadowOpacity: 0.6,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        },
        holdText: {
          color: theme.colors.text,
          ...theme.typography.subtitle,
        },
        particle: {
          position: 'absolute',
          backgroundColor: theme.colors.particle,
          borderRadius: 999,
        },
      }),
    [theme]
  );

  const glowScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.2],
  });

  return (
    <Screen style={styles.background}>
      <View style={styles.cardStack}>
        <Text style={styles.title}>Ritual</Text>
        <MutedText style={styles.subtitle}>
          Press and hold to draw your sign. Release anytime to reset.
        </MutedText>
      </View>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <View style={styles.energyRow}>
          <Text style={styles.sectionTitle}>Energy</Text>
          <Text style={styles.energyValue}>{isPremium ? '∞' : remaining}</Text>
        </View>
        <MutedText>
          {isPremium ? 'Premium is unlimited.' : '3 free draws reset daily.'}
        </MutedText>
        {isBlocked ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            <PrimaryButton title="Watch ad to restore 1" onPress={handleRestore} />
          </View>
        ) : null}
      </Card>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.sectionTitle}>Spread mode</Text>
        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeButton, spreadMode === '1' ? styles.modeButtonActive : null]}
            onPress={() => setSpreadMode('1')}>
            <Text style={styles.modeButtonText}>1-card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, spreadMode === '3' ? styles.modeButtonActive : null]}
            onPress={() => setSpreadMode('3')}>
            <Text style={styles.modeButtonText}>3-card</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.buttonRow, { marginTop: theme.spacing.sm }]}>
          <PrimaryButton title="Open the spread" onPress={handleOpenSpread} disabled={isBlocked} />
        </View>
      </Card>

      <View style={styles.ritualArea}>
        {particles.map((particle, index) => {
          const floatAnim = particleAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, -18],
          });
          return (
            <Animated.View
              key={particle.id}
              style={[
                styles.particle,
                {
                  width: particle.size,
                  height: particle.size,
                  left: particle.x,
                  top: particle.y,
                  transform: [{ translateY: floatAnim }],
                  opacity: isHolding ? 0.8 : 0.4,
                },
              ]}
            />
          );
        })}

        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <Animated.View style={[styles.circle, { transform: [{ scale: glowScale }] }]}>
            <Text style={styles.holdText}>{isHolding ? 'Holding…' : 'Hold 3s'}</Text>
          </Animated.View>
        </Pressable>
      </View>
    </Screen>
  );
}
