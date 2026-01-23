import { Siren } from 'lucide-react-native';
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
  const { getDepartmentClass } = useColors();

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

  return (
    <PressableScale
      className="rounded-[20px] bg-background-secondary-light dark:bg-background-secondary-dark p-5"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint={intl.formatMessage({
        id: 'procedure.accessibility.hint',
      })}
    >
      <View className="mb-4 flex-row items-center justify-between">
        <View className="gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {item.caseNumber}
            </Text>
            {item.emergency && (
              <View className="mb-0.5">
                <Siren size={22} color="#34D399" />
              </View>
            )}
          </View>
          <Text className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
            {intl.formatDate(item.date, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View
          className={'rounded-full px-3 py-1 bg-background-secondary-dark'}
        >
          <Text className="text-white">
            {intl.formatMessage({ id: `enum.department.${item.department}` })}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <View className="rounded-xl bg-accent px-3.5 py-2">
          <Text className="text-white">
            {intl.formatMessage({
              id: `enum.airway-management.${item.airwayManagement}`,
            })}
          </Text>
        </View>
        <View className="rounded-xl bg-accent px-3.5 py-2">
          <Text className="text-white">
            {intl.formatMessage(
              { id: 'home.asa-score' },
              {
                score: item.asaScore,
              },
            )}
          </Text>
        </View>
        <View className="rounded-xl bg-accent px-3.5 py-2">
          <Text className="text-white">
            {intl.formatMessage(
              { id: 'procedure.age-years' },
              {
                years: item.ageYears,
              },
            )}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}
