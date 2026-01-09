import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';

export default function SpreadScreen() {
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
        <Text style={styles.title}>Three-Card Spread</Text>
        <MutedText>Past, present, and possibility — draw three signs to map the moment.</MutedText>
      </View>
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Past</Text>
        <MutedText>Release the loop that already taught its lesson.</MutedText>
      </Card>
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Present</Text>
        <MutedText>Notice the small proof that you are supported.</MutedText>
      </Card>
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Possibility</Text>
        <MutedText>Say yes to the experiment that feels like freedom.</MutedText>
      </Card>
    </Screen>
  );
}
