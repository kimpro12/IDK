import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import Card from '@/src/components/Card';
import MutedText from '@/src/components/MutedText';
import PrimaryButton from '@/src/components/PrimaryButton';
import Screen from '@/src/components/Screen';
import { getTheme } from '@/src/lib/theme';
import { findCardById } from '@/src/services/contentEngine';
import { getDraw, listFavorites, toggleFavorite, updateDrawNote } from '@/src/services/journalRepo';
import { getEnergyState, resetIfNewDay } from '@/src/services/energy';

export default function RevealScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const router = useRouter();
  const params = useLocalSearchParams();
  const drawId = typeof params.drawId === 'string' ? params.drawId : null;

  const [note, setNote] = React.useState('');
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [cardText, setCardText] = React.useState('Your sign awaits.');
  const [packLabel, setPackLabel] = React.useState('');
  const [toneLabel, setToneLabel] = React.useState('');
  const [energyRemaining, setEnergyRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    void (async () => {
      if (!drawId) {
        return;
      }
      const draw = await getDraw(drawId);
      if (draw) {
        setNote(draw.note ?? '');
        const card = draw.cardIds[0] ? findCardById(draw.cardIds[0]) : undefined;
        if (card) {
          setCardText(card.text);
          setToneLabel(card.tone);
        }
        setPackLabel(draw.packIds[0] ?? '');
      }
      const favorites = await listFavorites();
      setIsFavorite(favorites.some((fav) => fav.id === drawId));
      await resetIfNewDay(new Date());
      const energy = await getEnergyState();
      setEnergyRemaining(energy.remaining);
    })();
  }, [drawId]);

  const handleToggleFavorite = React.useCallback(async () => {
    if (!drawId) {
      return;
    }
    const updated = await toggleFavorite(drawId);
    setIsFavorite(updated);
  }, [drawId]);

  const handleSaveNote = React.useCallback(async () => {
    if (!drawId) {
      return;
    }
    await updateDrawNote(drawId, note.trim() ? note.trim() : null);
    setIsModalVisible(false);
  }, [drawId, note]);

  const handleDrawAgain = React.useCallback(() => {
    router.push('/');
  }, [router]);

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
          gap: theme.spacing.sm,
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
        buttonRow: {
          marginTop: theme.spacing.lg,
          gap: theme.spacing.sm,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          padding: theme.spacing.lg,
        },
        modalCard: {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          padding: theme.spacing.sm,
          color: theme.colors.text,
          minHeight: 120,
        },
        modalActions: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: theme.spacing.sm,
        },
        linkButton: {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        },
        linkText: {
          color: theme.colors.primary,
          ...theme.typography.body,
        },
        energyNote: {
          marginTop: theme.spacing.sm,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.section}>
        <Text style={styles.title}>Reveal</Text>
        <MutedText>Your sign is ready. Breathe in, then read.</MutedText>
      </View>
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.subtitle}>Sign of the moment</Text>
        <MutedText>{cardText}</MutedText>
        <View style={styles.badgeRow}>
          {packLabel ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{packLabel.toUpperCase()}</Text>
            </View>
          ) : null}
          {toneLabel ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{toneLabel}</Text>
            </View>
          ) : null}
        </View>
      </Card>

      <View style={styles.buttonRow}>
        <PrimaryButton title="Save note" onPress={() => setIsModalVisible(true)} />
        <PrimaryButton title={isFavorite ? 'Unfavorite' : 'Favorite'} onPress={handleToggleFavorite} />
        <PrimaryButton title="Draw again" onPress={handleDrawAgain} />
        {energyRemaining !== null && energyRemaining <= 0 ? (
          <MutedText style={styles.energyNote}>
            Energy is empty. Draw again will return you to the ritual with draws disabled.
          </MutedText>
        ) : null}
      </View>

      <Modal transparent animationType="fade" visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.subtitle}>Journal note</Text>
            <TextInput
              style={styles.input}
              placeholder="Write a short reflection..."
              placeholderTextColor={theme.colors.mutedText}
              value={note}
              onChangeText={setNote}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.linkButton}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
              <PrimaryButton title="Save note" onPress={handleSaveNote} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
