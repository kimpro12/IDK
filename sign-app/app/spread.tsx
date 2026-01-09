import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SpreadScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Three-Card Spread</ThemedText>
      <ThemedText style={styles.copy}>
        Past, present, and possibility — draw three signs to map the moment.
      </ThemedText>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Past</ThemedText>
        <ThemedText>Release the loop that already taught its lesson.</ThemedText>
      </ThemedView>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Present</ThemedText>
        <ThemedText>Notice the small proof that you are supported.</ThemedText>
      </ThemedView>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Possibility</ThemedText>
        <ThemedText>Say yes to the experiment that feels like freedom.</ThemedText>
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
