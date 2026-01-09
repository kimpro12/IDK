import React from 'react';
import { FlatList, StyleSheet, Text, useColorScheme, View } from 'react-native';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';
import { findCardById } from '@/src/services/contentEngine';
import { listDraws, listFavorites } from '@/src/services/journalRepo';
import type { DrawRecord } from '@/src/services/journalRepo';

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const [draws, setDraws] = React.useState<DrawRecord[] | null>(null);
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    void (async () => {
      const [drawList, favorites] = await Promise.all([listDraws(), listFavorites()]);
      setDraws(drawList);
      setFavoriteIds(new Set(favorites.map((fav) => fav.id)));
    })();
  }, []);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        title: {
          color: theme.colors.text,
          ...theme.typography.title,
        },
        subtitle: {
          color: theme.colors.text,
          ...theme.typography.subtitle,
        },
        section: {
          gap: theme.spacing.sm,
        },
        list: {
          marginTop: theme.spacing.lg,
        },
        entryMeta: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: theme.spacing.sm,
        },
        badge: {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.border,
        },
        badgeText: {
          color: theme.colors.text,
          ...theme.typography.caption,
        },
        empty: {
          marginTop: theme.spacing.lg,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.section}>
        <Text style={styles.title}>Journal</Text>
        <MutedText>Capture rituals, spreads, and reflections. Sync later when you&apos;re ready.</MutedText>
      </View>

      {draws && draws.length === 0 ? (
        <MutedText style={styles.empty}>No draws yet. Complete a ritual to begin your history.</MutedText>
      ) : null}

      <FlatList
        contentContainerStyle={styles.list}
        data={draws ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const card = item.cardIds[0] ? findCardById(item.cardIds[0]) : undefined;
          return (
            <Card style={{ marginBottom: theme.spacing.md }}>
              <Text style={styles.subtitle}>{card?.text ?? 'Sign drawn'}</Text>
              {item.note ? <MutedText>{item.note}</MutedText> : null}
              <View style={styles.entryMeta}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.packIds[0]?.toUpperCase() ?? 'PACK'}</Text>
                </View>
                {favoriteIds.has(item.id) ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Favorite</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}
