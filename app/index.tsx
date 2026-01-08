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
import { Plus, Settings } from 'lucide-react-native';
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
  onCreateProcedure: () => void;
  onFilterPress: (filterId: number) => void;
  isLight: boolean;
}

const ListHeader = ({
  filters,
  filterConditions,
  allFilterConditions,
  filterMatchCounts,
  proceduresCount,
  getConditionText,
  onCreateFilter,
  onCreateProcedure,
  onFilterPress,
  isLight,
}: ListHeaderProps) => {
  const intl = useIntl();

  return (
    <View className="bg-white px-4 pt-4 dark:bg-black">
      <View className="mb-6 flex-row items-center gap-4">
        <Text className="text-[28px] font-semibold text-black dark:text-white">
          {intl.formatMessage({ id: 'home.my-filters' })}
        </Text>
        <View style={[styles.countBadge, isLight ? styles.countBadgeLight : styles.countBadgeDark]}>
          <Text style={{ fontWeight: '600', color: isLight ? '#6B7280' : '#8E8E93' }}>
            {filters.length}
          </Text>
        </View>
      </View>

      <View className="mb-8 flex-row flex-wrap gap-4">
        <PressableScale style={styles.createFilterCard} onPress={onCreateFilter}>
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="mt-2 text-center text-[13px] font-semibold text-white" numberOfLines={2}>
            {filters.length === 0
              ? intl.formatMessage({ id: 'home.create-first-filter' })
              : intl.formatMessage({ id: 'home.create-another-filter' })}
          </Text>
        </PressableScale>
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
        <View style={[styles.countBadge, isLight ? styles.countBadgeLight : styles.countBadgeDark]}>
          <Text style={{ fontWeight: '600', color: isLight ? '#6B7280' : '#8E8E93' }}>
            {proceduresCount}
          </Text>
        </View>
      </View>

      <PressableScale style={styles.createProcedureCard} onPress={onCreateProcedure}>
        <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
        <Text className="ml-2 text-[14px] font-semibold text-white">
          {intl.formatMessage({ id: 'home.add-procedure' })}
        </Text>
      </PressableScale>
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

  const isLight = colorScheme === 'light';

  const handleCreateProcedure = () => router.push('/procedure/create');

  const renderListHeader = () => (
    <ListHeader
      filters={filters}
      filterConditions={filterConditions || []}
      allFilterConditions={allFilterConditions || []}
      filterMatchCounts={filterMatchCounts}
      proceduresCount={procedures.length}
      getConditionText={getConditionText}
      onCreateFilter={handleCreateFilter}
      onCreateProcedure={handleCreateProcedure}
      onFilterPress={handleFilterPress}
      isLight={isLight}
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
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 96,
    width: '47%',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createProcedureCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  countBadgeLight: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  countBadgeDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
});
