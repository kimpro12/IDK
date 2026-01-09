import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import PrimaryButton from '@/src/components/PrimaryButton';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';
import { consumeEnergy, restoreOneEnergy, resetIfNewDay } from '@/src/services/energy';
import type { EnergyState } from '@/src/services/energy';

export default function RitualScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const router = useRouter();
  const [energyState, setEnergyState] = React.useState<EnergyState | null>(null);

  React.useEffect(() => {
    void (async () => {
      const state = await resetIfNewDay(new Date());
      setEnergyState(state);
    })();
  }, []);

  const remaining = energyState?.remaining ?? 3;
  const isPremium = energyState?.isPremium ?? false;
  const isBlocked = !isPremium && remaining <= 0;

  const handleNavigate = React.useCallback(
    async (path: '/spread' | '/reveal') => {
      if (isBlocked) {
        return;
      }
      const updated = await consumeEnergy();
      setEnergyState(updated);
      router.push(path);
    },
    [isBlocked, router]
  );

  const handleRestore = React.useCallback(async () => {
    const updated = await restoreOneEnergy();
    setEnergyState(updated);
  }, []);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
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
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.cardStack}>
        <Text style={styles.title}>Ritual</Text>
        <MutedText style={styles.subtitle}>
          Set your intention, draw your signs, and ground.
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
        <Text style={styles.sectionTitle}>Quick flow</Text>
        <MutedText>1. Breathe for 60 seconds.</MutedText>
        <MutedText>2. Pull a three-card spread.</MutedText>
        <MutedText>3. Name the energy you want to amplify.</MutedText>
      </Card>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.sectionTitle}>Next</Text>
        <View style={[styles.buttonRow, { marginTop: theme.spacing.sm }]}>
          <PrimaryButton
            title="Open the spread"
            onPress={() => handleNavigate('/spread')}
            disabled={isBlocked}
          />
          <PrimaryButton
            title="Reveal a sign"
            onPress={() => handleNavigate('/reveal')}
            disabled={isBlocked}
          />
        </View>
      </Card>
    </Screen>
  );
}
