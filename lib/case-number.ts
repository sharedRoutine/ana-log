export const parseCaseNumber = (raw: string) => {
  const value = raw.trim();
  if (!/^\d+(?:[\s-]\d+)*$/.test(value)) {
    return null;
  }
  return value.replace(/[\s-]/g, '');
};
