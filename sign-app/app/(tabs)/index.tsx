import React from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
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
const HAPTIC_INTERVAL_MS = 600;
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

  const progress = React.useRef(new Animated.Value(0)).current;
  const holdTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticInterval = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const didComplete = React.useRef(false);
  const soundRef = React.useRef<Audio.Sound | null>(null);
  const soundReady = React.useRef(false);

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

  React.useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const sound = new Audio.Sound();
        const asset = require('@/src/assets/sfx/ambient.mp3');
        await sound.loadAsync(asset, { isLooping: true, volume: 0.4 });
        if (mounted) {
          soundRef.current = sound;
          soundReady.current = true;
        } else {
          await sound.unloadAsync();
        }
      } catch {
        soundReady.current = false;
      }
    })();

    return () => {
      mounted = false;
      void soundRef.current?.unloadAsync();
      soundRef.current = null;
      soundReady.current = false;
    };
  }, []);

  const remaining = energyState?.remaining ?? 3;
  const isPremium = energyState?.isPremium ?? false;
  const isBlocked = !isPremium && remaining <= 0;

  const playAmbient = React.useCallback(async () => {
    if (!settings.soundEnabled || !soundRef.current || !soundReady.current) {
      return;
    }
    await soundRef.current.replayAsync();
  }, [settings.soundEnabled]);

  const stopAmbient = React.useCallback(async () => {
    if (!soundRef.current) {
      return;
    }
    await soundRef.current.stopAsync();
  }, []);

  const startHaptics = React.useCallback(() => {
    if (!settings.hapticsEnabled) {
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hapticInterval.current = setInterval(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, HAPTIC_INTERVAL_MS);
  }, [settings.hapticsEnabled]);

  const stopHaptics = React.useCallback(() => {
    if (hapticInterval.current) {
      clearInterval(hapticInterval.current);
      hapticInterval.current = null;
    }
  }, []);

  const resetHold = React.useCallback(async () => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }
    stopHaptics();
    await stopAmbient();
    setIsHolding(false);
    didComplete.current = false;
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress, stopAmbient, stopHaptics]);

  const completeHold = React.useCallback(async () => {
    if (didComplete.current) {
      return;
    }
    didComplete.current = true;
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }
    stopHaptics();
    await stopAmbient();
    setIsHolding(false);

    const card = pickForIntent({});
    if (!card) {
      await resetHold();
      return;
    }

    const updated = await consumeEnergy();
    setEnergyState(updated);

    const packId = card.id.split('-')[0] as PackId;
    await addDraw({
      id: `draw_${Date.now()}_${Math.random().toString(16).slice(2)}`,
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
      params: { cardId: card.id, text: card.text },
    });
  }, [resetHold, router, stopAmbient, stopHaptics]);

  const handlePressIn = React.useCallback(() => {
    if (isBlocked || isHolding) {
      return;
    }
    setIsHolding(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    startHaptics();
    void playAmbient();
    holdTimeout.current = setTimeout(() => {
      void completeHold();
    }, HOLD_DURATION_MS);
  }, [completeHold, isBlocked, isHolding, playAmbient, progress, startHaptics]);

  const handlePressOut = React.useCallback(() => {
    if (didComplete.current) {
      return;
    }
    void resetHold();
  }, [resetHold]);

  React.useEffect(() => {
    return () => {
      void resetHold();
    };
  }, [resetHold]);

  const handleRestore = React.useCallback(async () => {
    const updated = await restoreOneEnergy();
    setEnergyState(updated);
  }, []);

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
