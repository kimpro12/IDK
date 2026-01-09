export const toLocalDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isYesterday = (dateISO: string, todayISO: string): boolean => {
  const [year, month, day] = todayISO.split('-').map(Number);
  const today = new Date(year, month - 1, day);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return dateISO === toLocalDateISO(yesterday);
};
