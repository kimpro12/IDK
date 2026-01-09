import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DailyScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Daily Guidance</ThemedText>
      <ThemedText style={styles.copy}>
        A focused prompt, a sign of the day, and a gentle reminder to slow down.
      </ThemedText>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Today&apos;s prompt</ThemedText>
        <ThemedText>Where can you soften, without losing your edge?</ThemedText>
      </ThemedView>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Energy note</ThemedText>
        <ThemedText>Lead with calm confidence. Let small wins stack.</ThemedText>
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
