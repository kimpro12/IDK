import React from 'react';
import { FlatList, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';
import { findCardById } from '@/src/services/contentEngine';
import { listDraws, listFavorites } from '@/src/services/journalRepo';
import type { DrawRecord } from '@/src/services/journalRepo';

const PAGE_SIZE = 20;

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const modeLabel = (mode: string): string => {
  if (mode === 'spread3') {
    return '3-card';
  }
  if (mode === 'spread1' || mode === 'ritual') {
    return '1-card';
  }
  return mode;
};

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const router = useRouter();
  const [draws, setDraws] = React.useState<DrawRecord[]>([]);
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(new Set());
  const [searchText, setSearchText] = React.useState('');
  const [offset, setOffset] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFavorites = React.useCallback(async () => {
    const favorites = await listFavorites();
    setFavoriteIds(new Set(favorites.map((fav) => fav.id)));
  }, []);

  const loadPage = React.useCallback(
    async (nextOffset: number, query: string, reset: boolean) => {
      if (isLoading) {
        return;
      }
      setIsLoading(true);
      const page = await listDraws({
        limit: PAGE_SIZE,
        offset: nextOffset,
        searchText: query.trim() ? query.trim() : undefined,
      });
      setDraws((prev) => (reset ? page : [...prev, ...page]));
      setOffset(nextOffset + page.length);
      setHasMore(page.length === PAGE_SIZE);
      setIsLoading(false);
    },
    [isLoading]
  );

  React.useEffect(() => {
    void (async () => {
      await loadFavorites();
      await loadPage(0, '', true);
    })();
  }, [loadFavorites, loadPage]);

  React.useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      void loadPage(0, searchText, true);
    }, 300);
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [loadPage, searchText]);

  const handleEndReached = React.useCallback(() => {
    if (!hasMore || isLoading) {
      return;
    }
    void loadPage(offset, searchText, false);
  }, [hasMore, isLoading, loadPage, offset, searchText]);

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
          gap: theme.spacing.sm,
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
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          padding: theme.spacing.sm,
          color: theme.colors.text,
        },
        favorite: {
          color: theme.colors.primary,
          ...theme.typography.caption,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.section}>
        <Text style={styles.title}>Journal</Text>
        <MutedText>Capture rituals, spreads, and reflections. Sync later when you&apos;re ready.</MutedText>
        <TextInput
          style={styles.input}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search notes or card text"
          placeholderTextColor={theme.colors.mutedText}
        />
      </View>

      {draws.length === 0 && !isLoading ? (
        <MutedText style={styles.empty}>No draws yet. Complete a ritual to begin your history.</MutedText>
      ) : null}

      <FlatList
        contentContainerStyle={styles.list}
        data={draws}
        keyExtractor={(item) => item.id}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => {
          const card = item.cardIds[0] ? findCardById(item.cardIds[0]) : undefined;
          const snippet = card?.text ?? item.cardText ?? 'Sign drawn';
          return (
            <Card style={{ marginBottom: theme.spacing.md }}>
              <Text style={styles.subtitle} onPress={() => router.push(`/draw/${item.id}`)}>
                {snippet}
              </Text>
              {item.note ? <MutedText>{item.note}</MutedText> : null}
              <View style={styles.entryMeta}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{modeLabel(item.mode)}</Text>
                </View>
                {favoriteIds.has(item.id) ? (
                  <Text style={styles.favorite}>★</Text>
                ) : null}
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}
