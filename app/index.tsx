import { Stack, useRouter } from 'expo-router';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
import { Plus, PlusCircle } from 'lucide-react-native';
import { PressableScale } from 'pressto';

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
            <PressableScale style={{ padding: 8 }} onPress={() => router.push('/procedure/create')}>
              <PlusCircle size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
            </PressableScale>
          ),
        }}
      />
      <SafeAreaView edges={['bottom']}>
        <View className="bg-white px-4 pt-4 dark:bg-black">
          <View className="mb-6 flex-row items-center gap-4">
            <Text className="text-[28px] font-semibold text-black dark:text-white">
              {intl.formatMessage({ id: 'home.my-filters' })}
            </Text>
            <View style={styles.countBadge}>
              <Text className="font-semibold text-[#8E8E93]">{filters.length}</Text>
            </View>
          </View>

          <PressableScale
            style={styles.createFilterCard}
            onPress={() => router.push('/filter/create')}>
            <View className="mb-4">
              <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text className="text-[16px] font-semibold text-white">
              {filters.length === 0
                ? intl.formatMessage({ id: 'home.create-first-filter' })
                : intl.formatMessage({ id: 'home.create-another-filter' })}
            </Text>
          </PressableScale>

          <View className="mb-8 flex-row flex-wrap gap-4">
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

          <View className="mb-6 flex-row items-center gap-4">
            <Text className="text-[28px] font-semibold text-black dark:text-white">
              {intl.formatMessage({ id: 'home.my-procedures' })}
            </Text>
            <View style={styles.countBadge}>
              <Text className="font-semibold text-[#8E8E93]">{procedures.length}</Text>
            </View>
          </View>
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
            ItemSeparatorComponent={() => <View className="h-4" />}
          />
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  createFilterCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  countBadge: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
});
