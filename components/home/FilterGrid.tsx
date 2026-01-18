import { count } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View, Text, StyleSheet } from 'react-native';
import { db } from '~/db/db';
import { filterConditionTable, filterTable } from '~/db/schema';
import { useFilterLogic, useFilterMatchCounts } from '~/hooks/useFilterLogic';
import { FilterCard } from '../ui/FilterCard';

export default function FilterGrid() {
  const router = useRouter();
  const intl = useIntl();

  const { data: filters } = useLiveQuery(db.select().from(filterTable));
  const { data: filterConditions } = useLiveQuery(
    db
      .select({
        filterId: filterConditionTable.filterId,
        conditionCount: count(),
      })
      .from(filterConditionTable)
      .groupBy(filterConditionTable.filterId),
  );

  const { data: allFilterConditions } = useLiveQuery(
    db.select().from(filterConditionTable),
  );

  const filterMatchCounts = useFilterMatchCounts(filters, allFilterConditions);

  const { colorScheme } = useColorScheme();
  const { getConditionText } = useFilterLogic();

  return (
    <>
      <View className="mb-6 flex-row items-center gap-4">
        <Text className="text-[28px] font-semibold text-black dark:text-white">
          {intl.formatMessage({ id: 'home.my-filters' })}
        </Text>
        <View
          style={[
            styles.countBadge,
            colorScheme === 'light'
              ? styles.countBadgeLight
              : styles.countBadgeDark,
          ]}
        >
          <Text
            style={{
              fontWeight: '600',
              color: colorScheme === 'light' ? '#6B7280' : '#8E8E93',
            }}
          >
            {filters.length}
          </Text>
        </View>
      </View>

      <View className="mb-8 flex-row flex-wrap gap-4">
        <PressableScale
          style={styles.createFilterCard}
          onPress={() => router.push('/filter/create')}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
          <Text
            className="mt-2 text-center text-[13px] font-semibold text-white"
            numberOfLines={2}
          >
            {filters.length === 0
              ? intl.formatMessage({ id: 'home.create-first-filter' })
              : intl.formatMessage({ id: 'home.create-another-filter' })}
          </Text>
        </PressableScale>
        {filters?.map((filter) => (
          <FilterCard
            key={filter.id}
            filter={filter}
            conditionText={getConditionText(
              filter.id,
              filterConditions,
              allFilterConditions,
            )}
            matchingCount={filterMatchCounts.get(filter.id) ?? 0}
            onPress={() => router.push(`/filter/${filter.id}/show`)}
          />
        ))}
      </View>
    </>
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
