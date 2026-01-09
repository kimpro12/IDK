import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';
import { findCardById } from '@/src/services/contentEngine';
import { getDraw, listFavorites } from '@/src/services/journalRepo';
import type { DrawRecord } from '@/src/services/journalRepo';

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function DrawDetailScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const params = useLocalSearchParams();
  const drawId = typeof params.id === 'string' ? params.id : null;

  const [draw, setDraw] = React.useState<DrawRecord | null>(null);
  const [isFavorite, setIsFavorite] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      if (!drawId) {
        return;
      }
      const record = await getDraw(drawId);
      setDraw(record);
      const favorites = await listFavorites();
      setIsFavorite(favorites.some((fav) => fav.id === drawId));
    })();
  }, [drawId]);

  const card = draw?.cardIds[0] ? findCardById(draw.cardIds[0]) : undefined;

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
        badgeRow: {
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
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.section}>
        <Text style={styles.title}>Draw detail</Text>
        <MutedText>{draw ? formatDate(draw.createdAt) : 'Loading...'}</MutedText>
      </View>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Message</Text>
        <MutedText>{card?.text ?? draw?.cardText ?? 'No message found.'}</MutedText>
        {draw?.note ? <MutedText>{draw.note}</MutedText> : null}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{draw?.mode ?? 'draw'}</Text>
          </View>
          {isFavorite ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Favorite</Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}
