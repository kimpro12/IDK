import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';

export default function RevealScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const params = useLocalSearchParams();
  const cardText = typeof params.text === 'string' ? params.text : 'Your sign awaits.';
  const cardId = typeof params.cardId === 'string' ? params.cardId : null;

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
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.section}>
        <Text style={styles.title}>Reveal</Text>
        <MutedText>Tap into a single sign when you need a clear nudge.</MutedText>
      </View>
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Sign of the moment</Text>
        <MutedText>{cardText}</MutedText>
        {cardId ? <MutedText>Card: {cardId}</MutedText> : null}
      </Card>
    </Screen>
  );
}
