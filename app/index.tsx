import { Stack, useRouter } from 'expo-router';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIntl } from 'react-intl';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc, count } from 'drizzle-orm';
import { FlashList } from '@shopify/flash-list';
import { db } from '~/db/db';
import { filterTable, itemTable, filterConditionTable } from '~/db/schema';
import { useColorScheme } from 'nativewind';
import { FilterCard } from '~/components/ui/FilterCard';
import { ProcedureCard } from '~/components/ui/ProcedureCard';
import { useColors } from '~/hooks/useColors';
import { useFilterLogic } from '~/hooks/useFilterLogic';

export default function Home() {
  const router = useRouter();
  const intl = useIntl();
  const { data: procedures } = useLiveQuery(
    db.select().from(itemTable).orderBy(desc(itemTable.date))
  );
  const { data: filters } = useLiveQuery(db.select().from(filterTable));
  const { data: filterConditions } = useLiveQuery(
    db
      .select({
        filterId: filterConditionTable.filterId,
        conditionCount: count(),
      })
      .from(filterConditionTable)
      .groupBy(filterConditionTable.filterId)
  );

  const { data: allFilterConditions } = useLiveQuery(db.select().from(filterConditionTable));

  const { colorScheme } = useColorScheme();
  const { getDepartmentColor } = useColors();
  const { getMatchingProceduresCount, getConditionText } = useFilterLogic();

  const getTranslatedAirwayManagement = (airway: string) => {
    return intl.formatMessage({ id: `enum.airway-management.${airway}` });
  };

  const getTranslatedDepartment = (department: string) => {
    try {
      return intl.formatMessage({ id: `enum.department.${department}` });
    } catch {
      return department; // fallback to original if translation missing
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'app.title' }),
          headerRight: () => (
            <View className="flex-row">
              <TouchableOpacity onPress={() => router.push('/settings')} className="mr-3">
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={colorScheme === 'light' ? '#000' : '#fff'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/upsert-item')} className="mr-2">
                <Ionicons name="add" size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <View className="bg-white px-4 pt-4 dark:bg-black">
        <TouchableOpacity
          onPress={() => router.push('/create-filter')}
          className="mb-4 rounded-lg border border-blue-300 bg-blue-100 p-3 dark:border-blue-700 dark:bg-blue-900">
          <View className="flex-row items-center justify-center">
            <Ionicons name="add" size={20} color="#3B82F6" />
            <Text className="ml-2 font-medium text-blue-600 dark:text-blue-300">
              {intl.formatMessage({ id: 'home.create-first-filter' })}
            </Text>
          </View>
        </TouchableOpacity>

        <View className="mb-6 flex-row flex-wrap gap-2">
          {filters?.map((filter, index) => (
            <FilterCard
              key={filter.id}
              filter={filter}
              index={index}
              conditionText={getConditionText(filter.id, filterConditions || [])}
              matchingCount={getMatchingProceduresCount(filter.id, allFilterConditions || [])}
            />
          ))}
        </View>

        <Text className="mb-3 text-xl font-bold text-black dark:text-white">
          {intl.formatMessage({ id: 'home.my-procedures' }, { count: procedures?.length || 0 })}
        </Text>
      </View>

      <View className="flex-1 px-4">
        <FlashList
          data={procedures}
          renderItem={({ item }) => (
            <ProcedureCard
              item={item}
              getDepartmentColor={getDepartmentColor}
              getTranslatedDepartment={getTranslatedDepartment}
              getTranslatedAirwayManagement={getTranslatedAirwayManagement}
            />
          )}
          getItemType={() => 'procedure'}
          keyExtractor={(item) => item.caseNumber}
        />
      </View>
    </View>
  );
}
