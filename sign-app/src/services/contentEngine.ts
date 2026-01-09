import type { Category, MessageCard, PackId, Tone } from '@/src/types/content';

import careerPackData from '@/src/data/packs/career.json';
import financePackData from '@/src/data/packs/finance.json';
import freePackData from '@/src/data/packs/free.json';
import lovePackData from '@/src/data/packs/love.json';

type Rng = () => number;

type IntentPickOptions = {
  intent?: Category;
  tone?: Tone;
  packIds?: PackId[];
};

const freePack = freePackData as MessageCard[];
const lovePack = lovePackData as MessageCard[];
const careerPack = careerPackData as MessageCard[];
const financePack = financePackData as MessageCard[];

const packMap: Record<PackId, MessageCard[]> = {
  free: freePack,
  love: lovePack,
  career: careerPack,
  finance: financePack,
};

const defaultPackIds: PackId[] = Object.keys(packMap) as PackId[];

export const loadPack = (packId: PackId): MessageCard[] => packMap[packId];

export const pickWeighted = (cards: MessageCard[], rng: Rng = Math.random): MessageCard | undefined => {
  if (cards.length === 0) {
    return undefined;
  }

  const totalWeight = cards.reduce((sum, card) => sum + (card.weight ?? 1), 0);
  if (totalWeight <= 0) {
    return cards[0];
  }

  let threshold = rng() * totalWeight;
  for (const card of cards) {
    threshold -= card.weight ?? 1;
    if (threshold <= 0) {
      return card;
    }
  }
  return cards[cards.length - 1];
};

export const pickForIntent = ({ intent, tone, packIds }: IntentPickOptions): MessageCard | undefined => {
  const availableIds = packIds && packIds.length > 0 ? packIds : defaultPackIds;
  const cards = availableIds.flatMap((id) => loadPack(id));
  const filtered = cards.filter((card) =>
    (!intent || card.category === intent) && (!tone || card.tone === tone)
  );
  return pickWeighted(filtered);
};

const hashSeed = (input: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number): Rng => {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const deterministicDailyPick = (
  dateISO: string,
  userSeed: string,
  allowedPackIds: PackId[]
): MessageCard | undefined => {
  const normalizedPacks = allowedPackIds.length > 0 ? [...allowedPackIds].sort() : defaultPackIds;
  const seedInput = `${dateISO}|${userSeed}|${normalizedPacks.join(',')}`;
  const rng = mulberry32(hashSeed(seedInput));
  const cards = normalizedPacks.flatMap((id) => loadPack(id));
  return pickWeighted(cards, rng);
};

export const findCardById = (cardId: string): MessageCard | undefined => {
  for (const packId of defaultPackIds) {
    const found = packMap[packId].find((card) => card.id === cardId);
    if (found) {
      return found;
    }
  }
  return undefined;
};
