import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View, Text } from 'react-native';
import { ACCENT } from '~/components/ui/Form';
import { db } from '~/db/db';
import { filterConditionTable, filterTable } from '~/db/schema';
import { useFilterMatchCounts } from '~/hooks/useFilterLogic';
import { FilterCard } from '../ui/FilterCard';

export default function FilterGrid() {
  const router = useRouter();
  const intl = useIntl();

  const { data: filters } = useLiveQuery(db.select().from(filterTable));

  const { data: allFilterConditions } = useLiveQuery(
    db.select().from(filterConditionTable),
  );

  const filterMatchCounts = useFilterMatchCounts(filters, allFilterConditions);

  return (
    <View className="flex-row flex-wrap justify-between gap-2">
      <PressableScale
        className="h-24 w-[48%]"
        onPress={() => router.push('/filter/create')}
      >
        <View className="h-full w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-black/20 dark:border-white/20">
          <Plus size={22} color={ACCENT} strokeWidth={2.5} />
          <Text
            className="px-2 text-center text-[13px] font-medium text-text-primary-light dark:text-text-primary-dark"
            numberOfLines={2}
          >
            {filters.length === 0
              ? intl.formatMessage({ id: 'home.create-first-filter' })
              : intl.formatMessage({ id: 'home.create-another-filter' })}
          </Text>
        </View>
      </PressableScale>
      {filters?.map((filter) => (
        <FilterCard
          key={filter.id}
          filter={filter}
          matchingCount={filterMatchCounts.get(filter.id) ?? 0}
          onPress={() => router.push(`/filter/${filter.id}/show`)}
        />
      ))}
    </View>
  );
}
