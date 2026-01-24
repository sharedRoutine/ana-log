export const getTodayKey = () => new Date().toISOString().split('T')[0];

export const formatDateKey = (epochMs: number) =>
  new Date(epochMs).toISOString().split('T')[0];
