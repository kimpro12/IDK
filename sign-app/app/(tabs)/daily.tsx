import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';

export default function DailyScreen() {
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
        <Text style={styles.title}>Daily Guidance</Text>
        <MutedText>
          A focused prompt, a sign of the day, and a gentle reminder to slow down.
        </MutedText>
      </View>
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Today&apos;s prompt</Text>
        <MutedText>Where can you soften, without losing your edge?</MutedText>
      </Card>
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Energy note</Text>
        <MutedText>Lead with calm confidence. Let small wins stack.</MutedText>
      </Card>
    </Screen>
  );
}
