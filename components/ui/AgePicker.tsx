import { useColorScheme } from 'nativewind';
import { useIntl } from 'react-intl';
import { Text, TextInput, View } from 'react-native';

type AgePickerProps = {
  years: number;
  months: number;
  onYearsChange: (years: number) => void;
  onMonthsChange: (months: number) => void;
  maxYears?: number;
  maxMonths?: number;
};

const clamp = (text: string, max: number) => {
  const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
  if (isNaN(parsed)) return 0;
  return Math.min(max, Math.max(0, parsed));
};

const AgeInput = ({
  value,
  max,
  unit,
  onChange,
}: {
  value: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) => {
  const { colorScheme } = useColorScheme();
  return (
    <View className="h-11 flex-1 flex-row items-center justify-between rounded-xl bg-black/5 px-3 dark:bg-white/10">
      <TextInput
        defaultValue={String(value)}
        onChangeText={(text) => onChange(clamp(text, max))}
        keyboardType="number-pad"
        maxLength={2}
        placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
        className="min-w-[40px] py-0 text-[18px] font-semibold tabular-nums text-text-primary-light dark:text-text-primary-dark"
      />
      <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
        {unit}
      </Text>
    </View>
  );
};

export function AgePicker({
  years,
  months,
  onYearsChange,
  onMonthsChange,
  maxYears = 99,
  maxMonths = 11,
}: AgePickerProps) {
  const intl = useIntl();

  return (
    <View className="px-4 py-3">
      <Text className="mb-2 text-base text-text-primary-light dark:text-text-primary-dark">
        {intl.formatMessage({ id: 'procedure.form.patient-age' })}
      </Text>
      <View className="flex-row gap-3">
        <AgeInput
          value={years}
          max={maxYears}
          unit={intl.formatMessage({ id: 'procedure.form.years' })}
          onChange={onYearsChange}
        />
        <AgeInput
          value={months}
          max={maxMonths}
          unit={intl.formatMessage({ id: 'procedure.form.months' })}
          onChange={onMonthsChange}
        />
      </View>
    </View>
  );
}
