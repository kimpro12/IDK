import { deterministicDailyPick, pickWeighted } from '@/src/services/contentEngine';
import type { MessageCard, PackId } from '@/src/types/content';

const mulberry32 = (seed: number) => {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

describe('contentEngine', () => {
  it('respects weight bias in weighted selection', () => {
    const cards: MessageCard[] = [
      { id: 'low', text: 'Low weight', category: 'clarity', tone: 'neutral', weight: 1 },
      { id: 'high', text: 'High weight', category: 'clarity', tone: 'neutral', weight: 6 },
    ];

    const rng = mulberry32(42);
    let lowCount = 0;
    let highCount = 0;

    for (let i = 0; i < 1000; i += 1) {
      const pick = pickWeighted(cards, rng);
      if (pick?.id === 'low') {
        lowCount += 1;
      } else if (pick?.id === 'high') {
        highCount += 1;
      }
    }

    expect(highCount).toBeGreaterThan(lowCount * 3);
  });

  it('returns stable deterministicDailyPick for same date and seed', () => {
    const allowedPackIds: PackId[] = ['free', 'love'];
    const firstPick = deterministicDailyPick('2025-01-20', 'user-123', allowedPackIds);
    const secondPick = deterministicDailyPick('2025-01-20', 'user-123', allowedPackIds);

    expect(firstPick?.id).toEqual(secondPick?.id);
  });
});
