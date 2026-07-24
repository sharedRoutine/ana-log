import DateTimePicker from '@react-native-community/datetimepicker';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View, Text, useColorScheme } from 'react-native';
import { cn } from '~/lib/cn';

export type DateRangePreset = 'all' | '30d' | '3m' | '12m' | 'custom';

export interface DateRangeValue {
  preset: DateRangePreset;
  customStart: number;
  customEnd: number;
}

const PRESETS: Array<DateRangePreset> = ['all', '30d', '3m', '12m', 'custom'];

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

export const initialDateRange = (): DateRangeValue => {
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  return {
    preset: 'all',
    customStart: startOfDay(start),
    customEnd: endOfDay(new Date()),
  };
};

export const resolveDateRange = (
  value: DateRangeValue,
): { start: number; end: number } | null => {
  if (value.preset === 'all') return null;
  if (value.preset === 'custom') {
    return {
      start: startOfDay(new Date(value.customStart)),
      end: endOfDay(new Date(value.customEnd)),
    };
  }
  const start = new Date();
  if (value.preset === '30d') start.setDate(start.getDate() - 30);
  if (value.preset === '3m') start.setMonth(start.getMonth() - 3);
  if (value.preset === '12m') start.setMonth(start.getMonth() - 12);
  return { start: startOfDay(start), end: endOfDay(new Date()) };
};

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const intl = useIntl();
  const colorScheme = useColorScheme();

  return (
    <View>
      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const isActive = value.preset === preset;
          return (
            <PressableScale
              key={preset}
              onPress={() => onChange({ ...value, preset })}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View
                className={cn(
                  'rounded-full px-3 py-1.5',
                  isActive
                    ? 'bg-accent'
                    : 'bg-background-secondary-light dark:bg-background-secondary-dark',
                )}
              >
                <Text
                  className={cn(
                    'text-xs',
                    isActive
                      ? 'font-semibold text-black'
                      : 'text-text-secondary-light dark:text-text-secondary-dark',
                  )}
                >
                  {intl.formatMessage({ id: `range.${preset}` })}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
      {value.preset === 'custom' && (
        <View className="mt-3 flex-row items-center gap-4">
          <View className="flex-1 flex-row items-center justify-between">
            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {intl.formatMessage({ id: 'range.from' })}
            </Text>
            <DateTimePicker
              value={new Date(value.customStart)}
              mode="date"
              display="compact"
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
              maximumDate={new Date(value.customEnd)}
              onChange={(_, date) => {
                if (date) onChange({ ...value, customStart: date.getTime() });
              }}
            />
          </View>
          <View className="flex-1 flex-row items-center justify-between">
            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {intl.formatMessage({ id: 'range.to' })}
            </Text>
            <DateTimePicker
              value={new Date(value.customEnd)}
              mode="date"
              display="compact"
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
              minimumDate={new Date(value.customStart)}
              maximumDate={new Date()}
              onChange={(_, date) => {
                if (date) onChange({ ...value, customEnd: date.getTime() });
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
