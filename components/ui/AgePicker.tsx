import { HStack, Picker, Text, VStack } from '@expo/ui/swift-ui';
import { frame, padding } from '@expo/ui/swift-ui/modifiers';
import { useIntl } from 'react-intl';

type AgePickerProps = {
  years: number;
  months: number;
  onYearsChange: (years: number) => void;
  onMonthsChange: (months: number) => void;
  maxYears?: number;
  maxMonths?: number;
};

const generateOptions = (max: number): Array<string> =>
  Array.from({ length: max + 1 }, (_, i) => String(i));

export function AgePicker({
  years,
  months,
  onYearsChange,
  onMonthsChange,
  maxYears = 99,
  maxMonths = 11,
}: AgePickerProps) {
  const intl = useIntl();

  const yearsOptions = generateOptions(maxYears);
  const monthsOptions = generateOptions(maxMonths);

  return (
    <VStack>
      <Text size={13} color="#8E8E93" modifiers={[padding({ bottom: 4 })]}>
        {intl.formatMessage({ id: 'procedure.form.patient-age' })}
      </Text>
      <HStack>
        <VStack modifiers={[frame({ alignment: 'center' })]}>
          <Picker
            variant="wheel"
            options={yearsOptions}
            selectedIndex={years}
            onOptionSelected={({ nativeEvent: { index } }) => {
              onYearsChange(index);
            }}
          />
          <Text size={12} color="#8E8E93" modifiers={[padding({ top: 4 })]}>
            {intl.formatMessage({ id: 'procedure.form.years' })}
          </Text>
        </VStack>
        <VStack modifiers={[frame({ alignment: 'center' })]}>
          <Picker
            variant="wheel"
            options={monthsOptions}
            selectedIndex={months}
            onOptionSelected={({ nativeEvent: { index } }) => {
              onMonthsChange(index);
            }}
          />
          <Text size={12} color="#8E8E93" modifiers={[padding({ top: 4 })]}>
            {intl.formatMessage({ id: 'procedure.form.months' })}
          </Text>
        </VStack>
      </HStack>
    </VStack>
  );
}
