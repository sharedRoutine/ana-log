import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View, Text } from 'react-native';
import { procedureTable } from '~/db/schema';
import { useColors } from '~/hooks/useColors';
import { cn } from '~/lib/cn';

interface ProcedureCardProps {
  item: typeof procedureTable.$inferSelect;
  onPress?: () => void;
}

export function ProcedureCard({ item, onPress }: ProcedureCardProps) {
  const intl = useIntl();
  const { getDepartmentClass, getDepartmentTextClass } = useColors();

  const departmentLabel = intl.formatMessage({
    id: `enum.department.${item.department}`,
  });

  const accessibilityLabel = intl.formatMessage(
    { id: 'procedure.accessibility.card' },
    {
      caseNumber: item.caseNumber,
      date: intl.formatDate(item.date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      department: intl.formatMessage({
        id: `enum.department.${item.department}`,
      }),
      asa: item.asaScore,
    },
  );

  const metadata = [
    intl.formatMessage({
      id: `enum.airway-management.${item.airwayManagement}`,
    }),
    intl.formatMessage({ id: 'home.asa-score' }, { score: item.asaScore }),
    intl.formatMessage({ id: 'procedure.age-years' }, { years: item.ageYears }),
  ].join(' | ');

  return (
    <PressableScale
      className="flex-row items-center py-3"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint={intl.formatMessage({
        id: 'procedure.accessibility.hint',
      })}
    >
      <View className="flex-1 flex-row">
        <View
          className={cn(
            'w-1 self-stretch rounded-sm',
            getDepartmentClass(item.department),
          )}
        />

        <View className="flex-1 pl-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                {item.caseNumber}
              </Text>
              {item.emergency && (
                <View className="h-2 w-2 rounded-full bg-red-500" />
              )}
            </View>
            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {intl.formatDate(item.date, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <Text className="mt-0.5 text-sm">
            <Text className={getDepartmentTextClass(item.department)}>
              {departmentLabel}
            </Text>
            <Text className="text-text-secondary-light dark:text-text-secondary-dark">
              {' | '}
              {metadata}
            </Text>
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}
