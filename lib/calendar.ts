import { formatDateKey } from './date';

type MarkedDates = Record<
  string,
  {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
  }
>;

export const computeMarkedDates = (
  procedures: Array<{ procedure: { date: number } }>,
  selectedDate: string | null,
): MarkedDates => {
  const dates = procedures.reduce<MarkedDates>((acc, { procedure }) => {
    const key = formatDateKey(procedure.date);
    acc[key] = { marked: true, dotColor: '#34D399' };
    return acc;
  }, {});

  if (selectedDate) {
    dates[selectedDate] = {
      ...dates[selectedDate],
      selected: true,
      selectedColor: '#34D399',
    };
  }

  return dates;
};
