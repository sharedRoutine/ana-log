import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { itemTable } from '~/db/schema';
import { useIntl } from 'react-intl';
import { PressableScale } from 'pressto';

interface ProcedureCardProps {
  item: typeof itemTable.$inferSelect;
  getDepartmentColor: (department: string) => string;
  getTranslatedDepartment: (department: string) => string;
  getTranslatedAirwayManagement: (airway: string) => string;
}

export function ProcedureCard({
  item,
  getDepartmentColor,
  getTranslatedDepartment,
  getTranslatedAirwayManagement,
}: ProcedureCardProps) {
  const intl = useIntl();
  const router = useRouter();

  return (
    <PressableScale
      style={styles.entryCard}
      onPress={() => router.push(`/procedure/${item.caseNumber}/edit`)}>
      <View className="mb-4 flex-row items-center justify-between">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-white">{item.caseNumber}</Text>
          <Text className="text-sm font-medium text-gray-400">
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
          <Text className="text-white">{getTranslatedDepartment(item.department)}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <View style={[styles.tag, { backgroundColor: '#10B981' }]}>
          <Text className="text-white">{getTranslatedAirwayManagement(item.airwayManagement)}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: '#4A5568' }]}>
          <Text className="text-white">
            {intl.formatMessage({ id: 'home.asa-score' }, { score: item.asaScore })}
          </Text>
        </View>
        <View style={[styles.tag, { backgroundColor: '#3B82F6' }]}>
          <Text className="text-white">{`${item.ageYears} Jahre`}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  entryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
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
});
