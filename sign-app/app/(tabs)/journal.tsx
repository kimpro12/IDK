import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function JournalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Journal</ThemedText>
      <ThemedText style={styles.copy}>
        Capture rituals, spreads, and reflections. Sync later when you&apos;re ready.
      </ThemedText>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Latest entry</ThemedText>
        <ThemedText>“I felt the shift when I named the boundary.”</ThemedText>
      </ThemedView>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Next action</ThemedText>
        <ThemedText>Start a new journal entry after your next ritual.</ThemedText>
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
