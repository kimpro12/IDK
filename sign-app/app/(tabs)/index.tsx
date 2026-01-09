import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import PrimaryButton from '@/src/components/PrimaryButton';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';

export default function RitualScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const router = useRouter();
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
        <Text style={styles.sectionTitle}>Quick flow</Text>
        <MutedText>1. Breathe for 60 seconds.</MutedText>
        <MutedText>2. Pull a three-card spread.</MutedText>
        <MutedText>3. Name the energy you want to amplify.</MutedText>
      </Card>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.sectionTitle}>Next</Text>
        <View style={[styles.buttonRow, { marginTop: theme.spacing.sm }]}> 
          <PrimaryButton title="Open the spread" onPress={() => router.push('/spread')} />
          <PrimaryButton title="Reveal a sign" onPress={() => router.push('/reveal')} />
        </View>
      </Card>
    </Screen>
  );
}
