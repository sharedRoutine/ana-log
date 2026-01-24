import { Calendar, LocaleConfig, type DateData } from 'react-native-calendars';
import { useColorScheme, View } from 'react-native';

LocaleConfig.locales['de'] = {
  monthNames: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
  ],
  dayNames: [
    'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'
  ],
  dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  today: 'Heute'
};

LocaleConfig.defaultLocale = 'de';

interface CalendarViewProps {
  markedDates: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }>;
  selectedDate: string | null;
  onDayPress: (date: DateData) => void;
}

export const CalendarView = ({ markedDates, selectedDate, onDayPress }: CalendarViewProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    textSectionTitleColor: isDark ? '#9CA3AF' : '#374151',
    dayTextColor: isDark ? '#FFFFFF' : '#000000',
    todayTextColor: '#34D399',
    selectedDayBackgroundColor: '#34D399',
    selectedDayTextColor: '#FFFFFF',
    dotColor: '#34D399',
    selectedDotColor: '#FFFFFF',
    arrowColor: '#34D399',
    monthTextColor: isDark ? '#FFFFFF' : '#000000',
    textDisabledColor: isDark ? '#4B5563' : '#D1D5DB',
  };

  return (
    <View className="mb-4 overflow-hidden rounded-2xl bg-background-secondary-light dark:bg-background-secondary-dark">
      <Calendar
        theme={theme}
        markedDates={markedDates}
        onDayPress={onDayPress}
        current={selectedDate ?? undefined}
        enableSwipeMonths
      />
    </View>
  );
};
