import { View, Text, StyleSheet } from 'react-native';
import { procedureTable } from '~/db/schema';
import { useIntl } from 'react-intl';
import { PressableScale } from 'pressto';
import { useColorScheme } from 'nativewind';
import { Siren } from 'lucide-react-native';
import { useColors } from '~/hooks/useColors';

interface ProcedureCardProps {
  item: typeof procedureTable.$inferSelect;
  onPress?: () => void;
}

export function ProcedureCard({ item, onPress }: ProcedureCardProps) {
  const intl = useIntl();
  const { colorScheme } = useColorScheme();

  const { getDepartmentColor } = useColors();

  const isLight = colorScheme === 'light';

  const accessibilityLabel = intl.formatMessage(
    { id: 'procedure.accessibility.card' },
    {
      caseNumber: item.caseNumber,
      date: intl.formatDate(item.date, { year: 'numeric', month: 'long', day: 'numeric' }),
      department: intl.formatMessage({ id: `enum.department.${item.department}` }),
      asa: item.asaScore,
    }
  );

  return (
    <PressableScale
      style={[styles.entryCard, isLight ? styles.entryCardLight : styles.entryCardDark]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint={intl.formatMessage({ id: 'procedure.accessibility.hint' })}>
      <View className="mb-4 flex-row items-center justify-between">
        <View className="gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-bold" style={{ color: isLight ? '#1F2937' : '#FFFFFF' }}>
              {item.caseNumber}
            </Text>
            {item.emergency && (
              <View style={{ marginBottom: 2 }}>
                <Siren size={22} color="#EF4444" />
              </View>
            )}
          </View>
          <Text className="text-sm font-medium" style={{ color: isLight ? '#6B7280' : '#9CA3AF' }}>
            {intl.formatDate(item.date, { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: getDepartmentColor(item.department),
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 9999,
          }}>
          <Text className="text-white">
            {intl.formatMessage({ id: `enum.department.${item.department}` })}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <View style={[styles.tag, { backgroundColor: '#10B981' }]}>
          <Text className="text-white">
            {intl.formatMessage({ id: `enum.airway-management.${item.airwayManagement}` })}
          </Text>
        </View>
        <View style={[styles.tag, isLight ? styles.asaTagLight : styles.asaTagDark]}>
          <Text style={{ color: isLight ? '#4B5563' : '#FFFFFF' }}>
            {intl.formatMessage({ id: 'home.asa-score' }, { score: item.asaScore })}
          </Text>
        </View>
        <View style={[styles.tag, { backgroundColor: '#3B82F6' }]}>
          <Text className="text-white">
            {intl.formatMessage({ id: 'procedure.age-years' }, { years: item.ageYears })}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  entryCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  entryCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  entryCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  asaTagLight: {
    backgroundColor: '#E5E7EB',
  },
  asaTagDark: {
    backgroundColor: '#4A5568',
  },
});
