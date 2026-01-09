import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
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
        <Text style={styles.title}>Journal</Text>
        <MutedText>Capture rituals, spreads, and reflections. Sync later when you&apos;re ready.</MutedText>
      </View>
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Latest entry</Text>
        <MutedText>“I felt the shift when I named the boundary.”</MutedText>
      </Card>
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Next action</Text>
        <MutedText>Start a new journal entry after your next ritual.</MutedText>
      </Card>
    </Screen>
  );
}
