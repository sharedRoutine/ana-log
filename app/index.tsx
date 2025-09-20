import { Stack, useRouter } from 'expo-router';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
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
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <ScrollView className="flex-1 bg-white dark:bg-black">
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
      <SafeAreaView edges={['bottom']}>
        <View className="bg-white px-4 pt-4 dark:bg-black">
          <View className="mb-6 flex-row flex-wrap gap-4">
            <TouchableOpacity
              onPress={() => router.push('/create-filter')}
              className="h-24 w-[48%] justify-center rounded-xl bg-blue-500 p-3">
              <View className="items-center">
                <Ionicons name="add" size={24} color="white" />
                <Text className="mt-1 text-center text-xs font-medium text-white" numberOfLines={2}>
                  {intl.formatMessage({
                    id:
                      filters && filters.length > 0
                        ? 'home.create-another-filter'
                        : 'home.create-first-filter',
                  })}
                </Text>
              </View>
            </TouchableOpacity>

            {filters?.map((filter, index) => (
              <FilterCard
                key={filter.id}
                filter={filter}
                index={index + 1}
                conditionText={getConditionText(
                  filter.id,
                  filterConditions || [],
                  allFilterConditions || []
                )}
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
      </SafeAreaView>
    </ScrollView>
  );
}
