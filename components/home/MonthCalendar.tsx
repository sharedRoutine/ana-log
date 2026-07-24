import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { cn } from '~/lib/cn';
import { DateKey, fromDateKey, getTodayKey, monthMatrix } from '~/lib/date';

interface MonthCalendarProps {
  year: number;
  month: number;
  selectedDate: DateKey | null;
  markers: Map<DateKey, Array<string>>;
  onSelectDate: (day: DateKey) => void;
  onShiftMonth: (delta: number) => void;
  onToday: () => void;
}

export function MonthCalendar({
  year,
  month,
  selectedDate,
  markers,
  onSelectDate,
  onShiftMonth,
  onToday,
}: MonthCalendarProps) {
  const intl = useIntl();
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';

  const weeks = monthMatrix(year, month);
  const today = getTodayKey();

  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    intl.formatDate(new Date(2024, 0, i + 1), { weekday: 'short' }),
  );

  return (
    <View className="rounded-2xl bg-background-secondary-light p-3 dark:bg-background-secondary-dark">
      <View className="mb-3 flex-row items-center justify-between px-1">
        <Text className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
          {intl.formatDate(new Date(year, month, 1), {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <View className="flex-row items-center gap-1">
          <PressableScale
            onPress={onToday}
            accessibilityRole="button"
            accessibilityLabel={intl.formatMessage({ id: 'home.today' })}
          >
            <View className="rounded-full bg-background-primary-light px-3 py-1.5 dark:bg-background-primary-dark">
              <Text className="text-xs font-semibold text-accent">
                {intl.formatMessage({ id: 'home.today' })}
              </Text>
            </View>
          </PressableScale>
          <PressableScale onPress={() => onShiftMonth(-1)}>
            <View className="p-1.5">
              <ChevronLeft size={20} color={iconColor} />
            </View>
          </PressableScale>
          <PressableScale onPress={() => onShiftMonth(1)}>
            <View className="p-1.5">
              <ChevronRight size={20} color={iconColor} />
            </View>
          </PressableScale>
        </View>
      </View>

      <View className="mb-1 flex-row">
        <View className="w-7 items-center justify-center">
          <Text className="text-[9px] font-medium uppercase text-gray-400 dark:text-gray-600">
            {intl.formatMessage({ id: 'home.calendar-week' })}
          </Text>
        </View>
        {weekdayLabels.map((label) => (
          <View key={label} className="flex-1 items-center">
            <Text className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
              {label}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week.isoWeek} className="flex-row">
          <View className="w-7 items-center justify-center">
            <Text className="text-[10px] text-gray-400 dark:text-gray-600">
              {week.isoWeek}
            </Text>
          </View>
          {week.days.map((day, dayIndex) => {
            if (!day) {
              return <View key={`empty-${dayIndex}`} className="flex-1" />;
            }
            const isToday = day === today;
            const isSelected = day === selectedDate;
            const dayMarkers = markers.get(day);
            return (
              <Pressable
                key={day}
                className="min-h-[46px] flex-1 items-center pt-1"
                onPress={() => onSelectDate(day)}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={intl.formatDate(fromDateKey(day), {
                  day: 'numeric',
                  month: 'long',
                })}
              >
                <View
                  className={cn(
                    'h-8 w-8 items-center justify-center rounded-full',
                    isSelected && 'bg-accent',
                    !isSelected && isToday && 'border border-accent',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm',
                      isSelected
                        ? 'font-bold text-black'
                        : isToday
                          ? 'font-bold text-accent'
                          : 'text-text-primary-light dark:text-text-primary-dark',
                    )}
                  >
                    {fromDateKey(day).getDate()}
                  </Text>
                </View>
                <View className="mt-0.5 h-1.5 flex-row items-center gap-0.5">
                  {dayMarkers?.slice(0, 3).map((color, dotIndex) => (
                    <View
                      key={dotIndex}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
