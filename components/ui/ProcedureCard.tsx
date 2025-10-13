import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { itemTable } from '~/db/schema';

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
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/upsert-item?caseNumber=${encodeURIComponent(item.caseNumber)}`)}>
      <View className="mb-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-xl font-bold text-black dark:text-white">{item.caseNumber}</Text>
            <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          <View
            className="rounded-full px-2 py-1"
            style={{ backgroundColor: getDepartmentColor(item.department) }}>
            <Text className="text-xs font-medium text-white">
              {getTranslatedDepartment(item.department)}
            </Text>
          </View>
        </View>

        <Text className="mt-2 text-base text-black dark:text-white">{item.procedure}</Text>

        <View className="mt-2 flex-row flex-wrap gap-2">
          <View className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-700">
            <Text className="text-xs text-gray-700 dark:text-gray-300">ASA {item.asaScore}</Text>
          </View>
          <View className="rounded-full bg-blue-100 px-2 py-1 dark:bg-blue-900">
            <Text className="text-xs text-blue-700 dark:text-blue-300">
              {item.ageYears}y {item.ageMonths}m
            </Text>
          </View>
          <View className="rounded-full bg-green-100 px-2 py-1 dark:bg-green-900">
            <Text className="text-xs text-green-700 dark:text-green-300">
              {getTranslatedAirwayManagement(item.airwayManagement)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
