import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RevealScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Reveal</ThemedText>
      <ThemedText style={styles.copy}>
        Tap into a single sign when you need a clear nudge.
      </ThemedText>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Sign of the moment</ThemedText>
        <ThemedText>“Trust the quiet yes before the loud no arrives.”</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  copy: {
    opacity: 0.8,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
    backgroundColor: 'rgba(120, 120, 120, 0.08)',
  },
});
