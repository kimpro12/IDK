import React from 'react';
import { StyleProp, StyleSheet, Text, TextProps, TextStyle, useColorScheme } from 'react-native';

import { getTheme } from '@/src/lib/theme';

type MutedTextProps = TextProps & {
  style?: StyleProp<TextStyle>;
};

export default function MutedText({ style, ...props }: MutedTextProps) {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return <Text {...props} style={[styles.base, { color: theme.colors.mutedText }, style]} />;
}

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
  },
});
