import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';
import { loadPack, pickWeighted } from '@/src/services/contentEngine';
import { addDraw } from '@/src/services/journalRepo';
import type { MessageCard, PackId } from '@/src/types/content';

const pickUniqueCards = (count: number): MessageCard[] => {
  const allCards = (['free', 'love', 'career', 'finance'] as PackId[])
    .flatMap((packId) => loadPack(packId));
  const pool = [...allCards];
  const selected: MessageCard[] = [];
  while (pool.length > 0 && selected.length < count) {
    const card = pickWeighted(pool);
    if (!card) {
      break;
    }
    selected.push(card);
    const index = pool.findIndex((item) => item.id === card.id);
    if (index >= 0) {
      pool.splice(index, 1);
    }
  }
  return selected;
};

export default function SpreadScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const params = useLocalSearchParams();
  const mode = params.mode === '1' ? '1' : '3';
  const labels = mode === '1' ? ['Card'] : ['Past', 'Present', 'Next'];

  const [cards, setCards] = React.useState<MessageCard[]>([]);
  const [revealed, setRevealed] = React.useState<boolean[]>([]);
  const [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(() => {
    const selection = pickUniqueCards(mode === '1' ? 1 : 3);
    setCards(selection);
    setRevealed(Array.from({ length: selection.length }, () => false));
    setIsSaved(false);
  }, [mode]);

  React.useEffect(() => {
    const allRevealed = revealed.length > 0 && revealed.every(Boolean);
    if (!allRevealed || isSaved || cards.length === 0) {
      return;
    }
    void (async () => {
      const drawId = `draw_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const packIds = Array.from(
        new Set(cards.map((card) => card.id.split('-')[0]))
      ) as PackId[];
      await addDraw({
        id: drawId,
        createdAt: Date.now(),
        mode: mode === '1' ? 'spread1' : 'spread3',
        cardIds: cards.map((card) => card.id),
        packIds,
        cardText: cards.map((card) => card.text).join(' | '),
        question: null,
        note: null,
        isDaily: false,
      });
      setIsSaved(true);
    })();
  }, [cards, isSaved, mode, revealed]);

  const handleReveal = React.useCallback(
    (index: number) => {
      if (revealed[index]) {
        return;
      }
      if (index > 0 && !revealed[index - 1]) {
        return;
      }
      setRevealed((prev) => prev.map((value, idx) => (idx === index ? true : value)));
    },
    [revealed]
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        title: {
          color: theme.colors.text,
          ...theme.typography.title,
        },
        subtitle: {
          color: theme.colors.mutedText,
          ...theme.typography.body,
        },
        section: {
          gap: theme.spacing.sm,
        },
        cardRow: {
          gap: theme.spacing.md,
          marginTop: theme.spacing.lg,
        },
        cardLabel: {
          color: theme.colors.text,
          ...theme.typography.subtitle,
        },
        cardText: {
          color: theme.colors.text,
          ...theme.typography.body,
        },
        cardHint: {
          color: theme.colors.mutedText,
          ...theme.typography.caption,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.section}>
        <Text style={styles.title}>{mode === '1' ? 'One-card draw' : 'Three-card spread'}</Text>
        <MutedText>
          Tap each card in order to reveal your message.
        </MutedText>
      </View>

      <View style={styles.cardRow}>
        {labels.map((label, index) => {
          const card = cards[index];
          const isRevealed = revealed[index];
          return (
            <Card key={label}>
              <Text style={styles.cardLabel}>{label}</Text>
              <Pressable onPress={() => handleReveal(index)} disabled={!card}>
                {isRevealed && card ? (
                  <Text style={styles.cardText}>{card.text}</Text>
                ) : (
                  <Text style={styles.cardHint}>Tap to reveal</Text>
                )}
              </Pressable>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
