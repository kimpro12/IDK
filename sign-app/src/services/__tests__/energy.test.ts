import AsyncStorage from '@react-native-async-storage/async-storage';

import { getEnergyState, resetIfNewDay } from '@/src/services/energy';

const toLocalDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
  };
});

describe('energy service', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('provides defaults on first run', async () => {
    const state = await getEnergyState();
    expect(state.remaining).toBe(3);
    expect(state.isPremium).toBe(false);
    expect(state.lastResetDateISO).toBe(toLocalDateISO(new Date()));
  });

  it('resets when the date changes', async () => {
    const yesterday = new Date('2025-02-01T08:00:00');
    const today = new Date('2025-02-02T08:00:00');

    await AsyncStorage.setItem(
      'sign:energy',
      JSON.stringify({ remaining: 0, lastResetDateISO: toLocalDateISO(yesterday), isPremium: false })
    );

    const updated = await resetIfNewDay(today);

    expect(updated.remaining).toBe(3);
    expect(updated.lastResetDateISO).toBe(toLocalDateISO(today));
  });
});
