import { Stack, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Alert } from 'react-native';
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
import { useFilterLogic, useFilterMatchCounts } from '~/hooks/useFilterLogic';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, PlusCircle, Settings } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { Button, ContextMenu, Host } from '@expo/ui/swift-ui';
import { exportData, importData } from '~/services/dataExport';

interface ListHeaderProps {
  filters: Array<typeof filterTable.$inferSelect>;
  filterConditions: Array<{ filterId: number; conditionCount: number }>;
  allFilterConditions: Array<typeof filterConditionTable.$inferSelect>;
  filterMatchCounts: Map<number, number>;
  proceduresCount: number;
  getConditionText: (
    filterId: number,
    conditionCounts: Array<{ filterId: number; conditionCount: number }>,
    conditions: Array<typeof filterConditionTable.$inferSelect>
  ) => string;
  onCreateFilter: () => void;
  onFilterPress: (filterId: number) => void;
}

const ListHeader = ({
  filters,
  filterConditions,
  allFilterConditions,
  filterMatchCounts,
  proceduresCount,
  getConditionText,
  onCreateFilter,
  onFilterPress,
}: ListHeaderProps) => {
  const intl = useIntl();

  return (
    <View className="bg-white px-4 pt-4 dark:bg-black">
      <View className="mb-6 flex-row items-center gap-4">
        <Text className="text-[28px] font-semibold text-black dark:text-white">
          {intl.formatMessage({ id: 'home.my-filters' })}
        </Text>
        <View style={styles.countBadge}>
          <Text className="font-semibold text-[#8E8E93]">{filters.length}</Text>
        </View>
      </View>

      <PressableScale style={styles.createFilterCard} onPress={onCreateFilter}>
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
        {filters?.map((filter) => (
          <FilterCard
            key={filter.id}
            filter={filter}
            conditionText={getConditionText(filter.id, filterConditions, allFilterConditions)}
            matchingCount={filterMatchCounts.get(filter.id) ?? 0}
            onPress={() => onFilterPress(filter.id)}
          />
        ))}
      </View>

      <View className="mb-6 flex-row items-center gap-4">
        <Text className="text-[28px] font-semibold text-black dark:text-white">
          {intl.formatMessage({ id: 'home.my-procedures' })}
        </Text>
        <View style={styles.countBadge}>
          <Text className="font-semibold text-[#8E8E93]">{proceduresCount}</Text>
        </View>
      </View>
    </View>
  );
};

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
  const { getConditionText } = useFilterLogic();
  const filterMatchCounts = useFilterMatchCounts(filters, allFilterConditions);

  const { getDepartmentColor } = useColors();

  const getTranslatedAirwayManagement = (airway: string) => {
    return intl.formatMessage({ id: `enum.airway-management.${airway}` });
  };

  const getTranslatedDepartment = (department: string) => {
    return intl.formatMessage({ id: `enum.department.${department}` });
  };

  const renderItem = ({ item }: { item: typeof itemTable.$inferSelect }) => (
    <ProcedureCard
      item={item}
      onPress={() => router.push(`/procedure/${item.caseNumber}/show`)}
      getDepartmentColor={getDepartmentColor}
      getTranslatedDepartment={getTranslatedDepartment}
      getTranslatedAirwayManagement={getTranslatedAirwayManagement}
    />
  );

  const handleCreateFilter = () => router.push('/filter/create');
  const handleFilterPress = (filterId: number) => router.push(`/filter/${filterId}/show`);

  const handleImportError = () => {
    Alert.alert(
      intl.formatMessage({ id: 'import.error.title' }),
      intl.formatMessage({ id: 'import.error.invalid-format' })
    );
  };

  const handleImportComplete = ({
    proceduresCount,
    filtersCount,
  }: {
    proceduresCount: number;
    filtersCount: number;
  }) => {
    Alert.alert(
      intl.formatMessage({ id: 'import.success.title' }),
      intl.formatMessage(
        { id: 'import.success.message' },
        { procedures: proceduresCount, filters: filtersCount }
      )
    );
  };

  const handleImport = () => {
    importData({ onError: handleImportError, onComplete: handleImportComplete });
  };

  const renderListHeader = () => (
    <ListHeader
      filters={filters}
      filterConditions={filterConditions || []}
      allFilterConditions={allFilterConditions || []}
      filterMatchCounts={filterMatchCounts}
      proceduresCount={procedures.length}
      getConditionText={getConditionText}
      onCreateFilter={handleCreateFilter}
      onFilterPress={handleFilterPress}
    />
  );

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-white dark:bg-black">
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'app.title' }),
          headerLeft: () => (
            <View className="px-2">
              <Host matchContents>
                <ContextMenu>
                  <ContextMenu.Items>
                    <Button
                      variant="bordered"
                      systemImage="square.and.arrow.up"
                      onPress={() => exportData(filters, allFilterConditions, procedures, intl)}>
                      {intl.formatMessage({ id: 'home.export-data' })}
                    </Button>
                    <Button systemImage="square.and.arrow.down" onPress={() => handleImport()}>
                      {intl.formatMessage({ id: 'home.import-data' })}
                    </Button>
                  </ContextMenu.Items>
                  <ContextMenu.Trigger>
                    <Settings size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
                  </ContextMenu.Trigger>
                </ContextMenu>
              </Host>
            </View>
          ),
          headerRight: () => (
            <PressableScale
              style={{ paddingHorizontal: 8 }}
              onPress={() => router.push('/procedure/create')}>
              <PlusCircle size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
            </PressableScale>
          ),
        }}
      />
      <FlashList
        data={procedures}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        keyExtractor={(item) => item.caseNumber}
        ItemSeparatorComponent={() => <View className="h-4" />}
      />
    </SafeAreaView>
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
