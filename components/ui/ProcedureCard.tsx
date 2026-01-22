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
      className="rounded-[20px] border border-card-border bg-card p-5 shadow-card"
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
            <Text className="text-2xl font-bold text-foreground">
              {item.caseNumber}
            </Text>
            {item.emergency && (
              <View className="mb-0.5">
                <Siren size={22} color="#EF4444" />
              </View>
            )}
          </View>
          <Text className="text-sm font-medium text-foreground-secondary">
            {intl.formatDate(item.date, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View
          className={cn(
            'rounded-full px-3 py-1',
            getDepartmentClass(item.department),
          )}
        >
          <Text className="text-white">
            {intl.formatMessage({ id: `enum.department.${item.department}` })}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <View className="rounded-xl bg-success px-3.5 py-2">
          <Text className="text-white">
            {intl.formatMessage({
              id: `enum.airway-management.${item.airwayManagement}`,
            })}
          </Text>
        </View>
        <View className="rounded-xl bg-border-secondary px-3.5 py-2">
          <Text className="text-foreground-secondary">
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
