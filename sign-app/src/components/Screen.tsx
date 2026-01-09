import React from 'react';
import { StyleProp, StyleSheet, useColorScheme, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTheme } from '@/src/lib/theme';

type ScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function Screen({ children, style }: ScreenProps) {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <SafeAreaView
      style={[
        styles.base,
        { backgroundColor: theme.colors.background, padding: theme.spacing.lg },
        style,
      ]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
