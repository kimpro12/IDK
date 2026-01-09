import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RitualScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Ritual</ThemedText>
      <ThemedText style={styles.subtitle}>Set your intention, draw your signs, and ground.</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Quick flow</ThemedText>
        <ThemedText>1. Breathe for 60 seconds.</ThemedText>
        <ThemedText>2. Pull a three-card spread.</ThemedText>
        <ThemedText>3. Name the energy you want to amplify.</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Next</ThemedText>
        <Link href="/spread" style={styles.link}>
          <ThemedText type="link">Open the spread</ThemedText>
        </Link>
        <Link href="/reveal" style={styles.link}>
          <ThemedText type="link">Reveal a sign</ThemedText>
        </Link>
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
  subtitle: {
    opacity: 0.8,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
    backgroundColor: 'rgba(120, 120, 120, 0.08)',
  },
  link: {
    marginTop: 8,
  },
});
