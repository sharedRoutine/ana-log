import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View, Text } from 'react-native';
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
    <View className="flex-row flex-wrap gap-4">
      <PressableScale
        className="h-24 w-[48%]"
        onPress={() => router.push('/filter/create')}
      >
        <GlassView
          glassEffectStyle="regular"
          tintColor="#34D399"
          className="h-full w-full items-center justify-center rounded-2xl p-3"
          style={!isLiquidGlassAvailable() && { backgroundColor: '#34D399' }}
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
        </GlassView>
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
