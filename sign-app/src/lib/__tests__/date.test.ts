import { isYesterday, toLocalDateISO } from '@/src/lib/date';

describe('date utils', () => {
  it('formats local date ISO', () => {
    const date = new Date(2025, 0, 5);
    expect(toLocalDateISO(date)).toBe('2025-01-05');
  });

  it('detects yesterday correctly', () => {
    expect(isYesterday('2025-01-04', '2025-01-05')).toBe(true);
    expect(isYesterday('2025-01-03', '2025-01-05')).toBe(false);
  });
});
