export type DateKey = string;

const pad = (value: number) => String(value).padStart(2, '0');

export const toDateKey = (date: Date): DateKey =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getTodayKey = (): DateKey => toDateKey(new Date());

export const formatDateKey = (epochMs: number): DateKey =>
  toDateKey(new Date(epochMs));

export const fromDateKey = (key: DateKey): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export interface MonthWeek {
  isoWeek: number;
  days: Array<DateKey | null>;
}

const isoWeekNumber = (date: Date): number => {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  target.setUTCDate(target.getUTCDate() - ((target.getUTCDay() + 6) % 7) + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3,
  );
  return (
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )
  );
};

export const monthMatrix = (year: number, month: number): Array<MonthWeek> => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: Array<MonthWeek> = [];
  let current: Array<DateKey | null> = [];

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  for (let i = 0; i < firstWeekday; i++) current.push(null);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    current.push(toDateKey(date));
    if (current.length === 7) {
      weeks.push({ isoWeek: isoWeekNumber(date), days: current });
      current = [];
    }
  }

  if (current.length > 0) {
    while (current.length < 7) current.push(null);
    weeks.push({
      isoWeek: isoWeekNumber(new Date(year, month, daysInMonth)),
      days: current,
    });
  }

  return weeks;
};
