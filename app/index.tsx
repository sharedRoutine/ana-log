import { Stack, useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
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
import { useDataBackup } from '~/hooks/useDataBackup';

interface ListHeaderProps {
  filters: Array<typeof filterTable.$inferSelect>;
  filterConditions: Array<{ filterId: number; conditionCount: number }>;
  allFilterConditions: Array<typeof filterConditionTable.$inferSelect>;
  filterMatchCounts: Map<number, number>;
  proceduresCount: number;
}

const ListHeader = ({
  filters,
  filterConditions,
  allFilterConditions,
  filterMatchCounts,
  proceduresCount,
}: ListHeaderProps) => {
  const router = useRouter();
  const intl = useIntl();
  const { colorScheme } = useColorScheme();
  const { getConditionText } = useFilterLogic();

  return (
    <View className="bg-white px-4 pt-4 dark:bg-black">
      <View className="mb-6 flex-row items-center gap-4">
        <Text className="text-[28px] font-semibold text-black dark:text-white">
          {intl.formatMessage({ id: 'home.my-filters' })}
        </Text>
        <View
          style={[
            styles.countBadge,
            colorScheme === 'light' ? styles.countBadgeLight : styles.countBadgeDark,
          ]}>
          <Text
            style={{ fontWeight: '600', color: colorScheme === 'light' ? '#6B7280' : '#8E8E93' }}>
            {filters.length}
          </Text>
        </View>
      </View>

      <View className="mb-8 flex-row flex-wrap gap-4">
        <PressableScale
          style={styles.createFilterCard}
          onPress={() => router.push('/filter/create')}>
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
            onPress={() => router.push(`/filter/${filter.id}/show`)}
          />
        ))}
      </View>

      <View className="mb-6 flex-row items-center gap-4">
        <Text className="text-[28px] font-semibold text-black dark:text-white">
          {intl.formatMessage({ id: 'home.my-procedures' })}
        </Text>
        <View
          style={[
            styles.countBadge,
            colorScheme === 'light' ? styles.countBadgeLight : styles.countBadgeDark,
          ]}>
          <Text
            style={{ fontWeight: '600', color: colorScheme === 'light' ? '#6B7280' : '#8E8E93' }}>
            {proceduresCount}
          </Text>
        </View>
      </View>

      <PressableScale
        style={styles.createProcedureCard}
        onPress={() => router.push('/procedure/create')}>
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
  const filterMatchCounts = useFilterMatchCounts(filters, allFilterConditions);

  const { getDepartmentColor } = useColors();

  const { exportDatabase, importDatabase } = useDataBackup();

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

  const renderListHeader = () => (
    <ListHeader
      filters={filters}
      filterConditions={filterConditions || []}
      allFilterConditions={allFilterConditions || []}
      filterMatchCounts={filterMatchCounts}
      proceduresCount={procedures.length}
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
                      onPress={async () => {
                        await exportDatabase();
                      }}>
                      {intl.formatMessage({ id: 'home.export-data' })}
                    </Button>
                    <Button
                      systemImage="square.and.arrow.down"
                      onPress={async () => {
                        await importDatabase();
                      }}>
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
