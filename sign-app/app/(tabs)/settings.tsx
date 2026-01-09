import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>
      <ThemedText style={styles.copy}>
        Personalize your ritual cadence, notifications, and preferred content packs.
      </ThemedText>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Reminders</ThemedText>
        <ThemedText>Daily reminder: 8:00 AM</ThemedText>
      </ThemedView>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Content</ThemedText>
        <ThemedText>Free pack enabled · Premium pack locked</ThemedText>
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
