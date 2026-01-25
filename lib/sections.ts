interface SectionableItem {
  procedure: { date: number };
}

export type SectionKey =
  | { type: 'this-week' }
  | { type: 'last-week' }
  | { type: 'month'; date: number };

export interface Section<T> {
  key: SectionKey;
  data: Array<T>;
}

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getSectionKey = (
  date: Date,
  thisWeekStart: Date,
  lastWeekStart: Date,
): SectionKey => {
  const itemTime = date.getTime();

  if (itemTime >= thisWeekStart.getTime()) {
    return { type: 'this-week' };
  }

  if (itemTime >= lastWeekStart.getTime()) {
    return { type: 'last-week' };
  }

  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  return { type: 'month', date: monthStart.getTime() };
};

const serializeKey = (key: SectionKey): string => {
  if (key.type === 'month') {
    return `month-${key.date}`;
  }
  return key.type;
};

export const groupIntoSections = <T extends SectionableItem>(
  items: Array<T>,
): Array<Section<T>> => {
  if (!items || items.length === 0) return [];

  const now = new Date();
  const thisWeekStart = getWeekStart(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const sectionMap = new Map<string, { key: SectionKey; data: Array<T> }>();
  const sectionOrder: Array<string> = [];

  for (const item of items) {
    const date = new Date(item.procedure.date);
    const key = getSectionKey(date, thisWeekStart, lastWeekStart);
    const serialized = serializeKey(key);

    if (!sectionMap.has(serialized)) {
      sectionMap.set(serialized, { key, data: [] });
      sectionOrder.push(serialized);
    }
    sectionMap.get(serialized)!.data.push(item);
  }

  return sectionOrder.map((serialized) => sectionMap.get(serialized)!);
};
