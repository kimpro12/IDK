import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';

export default function SettingsScreen() {
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
        <Text style={styles.title}>Settings</Text>
        <MutedText>
          Personalize your ritual cadence, notifications, and preferred content packs.
        </MutedText>
      </View>
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Reminders</Text>
        <MutedText>Daily reminder: 8:00 AM</MutedText>
      </Card>
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Content</Text>
        <MutedText>Free pack enabled · Premium pack locked</MutedText>
      </Card>
    </Screen>
  );
}
