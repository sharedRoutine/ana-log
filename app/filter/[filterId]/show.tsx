import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { desc, eq, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeftCircle, Edit } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ACCENT, contrastText } from '~/components/ui/Form';
import { ProcedureCard } from '~/components/ui/ProcedureCard';
import { db } from '~/db/db';
import {
  filterConditionTable,
  filterTable,
  medicalCaseTable,
  procedureTable,
} from '~/db/schema';
import { useFilterLogic } from '~/hooks/useFilterLogic';

const Goal = ({ current, goal }: { current: number; goal: number }) => {
  const intl = useIntl();
  const progress = goal > 0 ? Math.min(1, current / goal) : 0;
  const isComplete = current >= goal;

  return (
    <View className="rounded-2xl border border-black/5 bg-background-secondary-light p-4 dark:border-white/5 dark:bg-background-secondary-dark">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
          {intl.formatMessage({ id: 'filter.goal' })}
        </Text>
        {isComplete && (
          <View
            className="h-6 w-6 items-center justify-center rounded-full"
            style={{ backgroundColor: ACCENT }}
          >
            <Check size={14} color={contrastText(ACCENT)} strokeWidth={3} />
          </View>
        )}
      </View>
      <View className="mt-2 flex-row items-end gap-1.5">
        <Text className="text-4xl font-bold tabular-nums text-text-primary-light dark:text-text-primary-dark">
          {current}
        </Text>
        <Text className="pb-1 text-base font-medium tabular-nums text-text-secondary-light dark:text-text-secondary-dark">
          / {goal}
        </Text>
      </View>
      <View className="mt-3 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <View
          className="h-full rounded-full"
          style={{ width: `${progress * 100}%`, backgroundColor: ACCENT }}
        />
      </View>
    </View>
  );
};

export default function ShowFilter() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const { filterId: filterIdParam } = useLocalSearchParams<{
    filterId: string;
  }>();
  const filterId = parseInt(filterIdParam, 10);

  const { buildWhereClause, stringifyCondition } = useFilterLogic();

  const { data: filters, isPending: isFilterPending } = useQuery({
    queryKey: ['filter', filterId],
    queryFn: () =>
      db.select().from(filterTable).where(eq(filterTable.id, filterId)),
  });

  const { data: conditions, isPending: isConditionsPending } = useQuery({
    queryKey: ['filter', filterId, 'conditions'],
    queryFn: () =>
      db
        .select()
        .from(filterConditionTable)
        .where(eq(filterConditionTable.filterId, filterId)),
  });

  const whereClause =
    isConditionsPending || isFilterPending
      ? sql`1 = 0`
      : buildWhereClause(conditions || [], filters?.[0]?.combinator ?? 'AND');

  const { data: procedures } = useLiveQuery(
    db
      .select()
      .from(procedureTable)
      .innerJoin(
        medicalCaseTable,
        eq(procedureTable.caseNumber, medicalCaseTable.caseNumber),
      )
      .where(whereClause)
      .orderBy(desc(procedureTable.date)),
    [whereClause],
  );

  const intl = useIntl();

  if (!whereClause) {
    return (
      <View className="flex-1 items-center justify-center bg-background-primary-light dark:bg-background-primary-dark">
        <Text className="text-black dark:text-white">
          {intl.formatMessage({ id: 'filter.error.no-valid-conditions' })}
        </Text>
      </View>
    );
  }

  if (isFilterPending || isConditionsPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background-primary-light dark:bg-background-primary-dark">
        <Text className="text-black dark:text-white">
          {intl.formatMessage({ id: 'common.loading' })}
        </Text>
      </View>
    );
  }

  if (!filters || filters.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background-primary-light dark:bg-background-primary-dark">
        <Text className="text-black dark:text-white">
          {intl.formatMessage({ id: 'filter.error.not-found' })}
        </Text>
      </View>
    );
  }

  if (!conditions) {
    return (
      <View className="flex-1 items-center justify-center bg-background-primary-light dark:bg-background-primary-dark">
        <Text className="text-black dark:text-white">
          {intl.formatMessage({ id: 'filter.error.no-conditions' })}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: filters[0].name,
          presentation: 'modal',
          headerLeft: () => (
            <PressableScale
              style={{ paddingHorizontal: 8 }}
              onPress={async () => {
                router.back();
              }}
            >
              <ChevronLeftCircle
                size={24}
                color={colorScheme === 'light' ? '#000' : '#fff'}
              />
            </PressableScale>
          ),
          headerRight: () => (
            <PressableScale
              style={{ paddingHorizontal: 8 }}
              onPress={async () => {
                router.push(`/filter/${filterId}/edit`);
              }}
            >
              <Edit
                size={24}
                color={colorScheme === 'light' ? '#000' : '#fff'}
              />
            </PressableScale>
          ),
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        className="flex-1 bg-background-primary-light dark:bg-background-primary-dark"
      >
        <View className="flex-1 px-4 pt-4">
          <FlashList
            contentInsetAdjustmentBehavior="automatic"
            data={procedures}
            renderItem={({ item: { procedure } }) => (
              <ProcedureCard
                item={procedure}
                onPress={() => router.push(`/procedure/${procedure.id}/show`)}
              />
            )}
            ListHeaderComponent={() => (
              <View className="mb-6">
                {filters[0].goal ? (
                  <Goal current={procedures.length} goal={filters[0].goal} />
                ) : null}
                <View className="flex-row flex-wrap px-1 py-3">
                  <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {conditions
                      .map((condition) => stringifyCondition(condition))
                      .join(', ')}
                  </Text>
                </View>
              </View>
            )}
            getItemType={() => 'procedure'}
            keyExtractor={(item) => item.procedure.id.toString()}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
