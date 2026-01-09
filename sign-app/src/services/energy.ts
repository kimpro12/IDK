import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'sign:energy';
const MAX_ENERGY = 3;

type StoredEnergyState = {
  remaining: number;
  lastResetDateISO: string;
  isPremium: boolean;
};

export type EnergyState = StoredEnergyState;

const toLocalDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildDefaultState = (date: Date): EnergyState => ({
  remaining: MAX_ENERGY,
  lastResetDateISO: toLocalDateISO(date),
  isPremium: false,
});

const readState = async (date: Date): Promise<EnergyState> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const fallback = buildDefaultState(date);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as StoredEnergyState;
    if (
      typeof parsed.remaining === 'number' &&
      typeof parsed.lastResetDateISO === 'string' &&
      typeof parsed.isPremium === 'boolean'
    ) {
      return parsed;
    }
  } catch {
    // ignore invalid data and overwrite
  }

  const fallback = buildDefaultState(date);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
  return fallback;
};

const writeState = async (state: EnergyState): Promise<EnergyState> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
};

export const getEnergyState = async (): Promise<EnergyState> => {
  return readState(new Date());
};

export const resetIfNewDay = async (now: Date): Promise<EnergyState> => {
  const state = await readState(now);
  const todayISO = toLocalDateISO(now);
  if (state.lastResetDateISO !== todayISO) {
    const updated: EnergyState = {
      ...state,
      remaining: state.isPremium ? MAX_ENERGY : MAX_ENERGY,
      lastResetDateISO: todayISO,
    };
    return writeState(updated);
  }
  return state;
};

export const consumeEnergy = async (): Promise<EnergyState> => {
  const now = new Date();
  const state = await resetIfNewDay(now);
  if (state.isPremium) {
    return state;
  }
  if (state.remaining <= 0) {
    return state;
  }
  const updated = { ...state, remaining: state.remaining - 1 };
  return writeState(updated);
};

export const restoreOneEnergy = async (): Promise<EnergyState> => {
  const now = new Date();
  const state = await resetIfNewDay(now);
  if (state.isPremium) {
    return state;
  }
  const updated = { ...state, remaining: Math.min(MAX_ENERGY, state.remaining + 1) };
  return writeState(updated);
};
