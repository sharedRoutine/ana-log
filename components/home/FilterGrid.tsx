import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { ChevronDown, Plus } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { db } from '~/db/db';
import { filterConditionTable, filterTable } from '~/db/schema';
import { useFilterMatchCounts } from '~/hooks/useFilterLogic';
import { FilterCard } from '../ui/FilterCard';

export default function FilterGrid() {
  const router = useRouter();
  const intl = useIntl();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const rotation = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
    rotation.value = withTiming(isCollapsed ? 0 : -180, { duration: 200 });
  };

  const { data: filters } = useLiveQuery(db.select().from(filterTable));

  const { data: allFilterConditions } = useLiveQuery(
    db.select().from(filterConditionTable),
  );

  const filterMatchCounts = useFilterMatchCounts(filters, allFilterConditions);

  return (
    <>
      <PressableScale
        onPress={toggleCollapsed}
        className="mb-6 flex-row items-center gap-4"
      >
        <Text className="text-[28px] font-semibold text-text-primary-light dark:text-text-primary-dark">
          {intl.formatMessage({ id: 'home.my-filters' })}
        </Text>
        <View className="flex-1">
          <Animated.View style={chevronStyle} className="w-6">
            <ChevronDown size={24} className="color-text-primary-light dark:color-text-primary-dark" />
          </Animated.View>
        </View>
        <View className="rounded-xl bg-background-secondary-dark px-3 py-1">
          <Text className="font-semibold text-white">
            {filters.length}
          </Text>
        </View>
      </PressableScale>

      {!isCollapsed && (
        <View className="mb-8 flex-row flex-wrap gap-4">
          <PressableScale
            className="h-24 w-[48%]"
            onPress={() => router.push('/filter/create')}
          >
            <GlassView
              glassEffectStyle="regular"
              tintColor="#EF4444"
              className="h-full w-full items-center justify-center rounded-2xl p-3"
              style={!isLiquidGlassAvailable() && { backgroundColor: '#EF4444' }}
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
      )}
    </>
  );
}
