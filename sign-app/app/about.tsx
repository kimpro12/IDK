import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import Screen from '@/src/components/Screen';
import MutedText from '@/src/components/MutedText';
import { getTheme } from '@/src/lib/theme';

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        title: {
          color: theme.colors.text,
          ...theme.typography.title,
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
        <Text style={styles.title}>About</Text>
        <MutedText>
          Sign is a ritual-first guidance app for daily reflection and gentle intention setting.
        </MutedText>
      </View>
    </Screen>
  );
}
