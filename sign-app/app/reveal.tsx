import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';

export default function RevealScreen() {
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
        <Text style={styles.title}>Reveal</Text>
        <MutedText>Tap into a single sign when you need a clear nudge.</MutedText>
      </View>
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Sign of the moment</Text>
        <MutedText>“Trust the quiet yes before the loud no arrives.”</MutedText>
      </Card>
    </Screen>
  );
}
