import { PlatformColor, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { ChevronLeftCircle, Edit } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useQuery } from '@tanstack/react-query';
import { db } from '~/db/db';
import { filterConditionTable, filterTable, medicalCaseTable, procedureTable } from '~/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { useFilterLogic } from '~/hooks/useFilterLogic';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { FlashList } from '@shopify/flash-list';
import { ProcedureCard } from '~/components/ui/ProcedureCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gauge, Host } from '@expo/ui/swift-ui';

export default function ShowFilter() {
  const intl = useIntl();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const { filterId: filterIdParam } = useLocalSearchParams<{ filterId: string }>();
  const filterId = parseInt(filterIdParam, 10);

  const { buildWhereClause, stringifyCondition } = useFilterLogic();

  const { data: filters, isPending: isFilterPending } = useQuery({
    queryKey: ['filter', filterId],
    queryFn: () => db.select().from(filterTable).where(eq(filterTable.id, filterId)),
  });

  const { data: conditions, isPending: isConditionsPending } = useQuery({
    queryKey: ['filter', filterId, 'conditions'],
    queryFn: () =>
      db.select().from(filterConditionTable).where(eq(filterConditionTable.filterId, filterId)),
  });

  const whereClause =
    isConditionsPending || isFilterPending
      ? sql`1 = 0`
      : buildWhereClause(conditions || [], filters?.[0]?.combinator ?? 'AND');

  const { data: procedures } = useLiveQuery(
    db.select().from(procedureTable).innerJoin(medicalCaseTable, eq(procedureTable.caseNumber, medicalCaseTable.caseNumber)).where(whereClause).orderBy(desc(procedureTable.date)),
    [whereClause]
  );

  if (!whereClause) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>No valid conditions for filter {filterId}.</Text>
      </View>
    );
  }

  if (isFilterPending || isConditionsPending) {
    // TODO: Proper Loading Screen
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!filters || filters.length === 0) {
    // TODO: Proper Empty Screen
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>No filter found for {filterId}.</Text>
      </View>
    );
  }

  if (!conditions) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>No conditions found for filter {filterId}.</Text>
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
              }}>
              <ChevronLeftCircle size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
            </PressableScale>
          ),
          headerRight: () => (
            <PressableScale
              style={{ paddingHorizontal: 8 }}
              onPress={async () => {
                router.push(`/filter/${filterId}/edit`);
              }}>
              <Edit size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
            </PressableScale>
          ),
        }}
      />
      <SafeAreaView edges={['bottom']} className="flex-1 bg-white dark:bg-black">
        {filters[0].goal ? (
          <View className="px-4 pt-6">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-3xl font-bold text-black dark:text-white">
                {intl.formatMessage({ id: 'filter.goal' })}
              </Text>
              <Host matchContents>
                <Gauge
                  max={{ value: filters[0].goal, label: `${filters[0].goal}` }}
                  min={{ value: 0, label: '0' }}
                  current={{
                    value: procedures.length,
                    label: `${procedures.length}`,
                  }}
                  color={[
                    PlatformColor('systemRed'),
                    PlatformColor('systemOrange'),
                    PlatformColor('systemYellow'),
                    PlatformColor('systemGreen'),
                  ]}
                  type="circular"
                />
              </Host>
            </View>
          </View>
        ) : null}
        <View className="flex-row flex-wrap px-4 py-4">
          <Text className="text-gray-600 dark:text-gray-300">
            {conditions.map((condition) => stringifyCondition(condition)).join(', ')}
          </Text>
        </View>
        <View className="flex-1 px-4 pt-4">
          <FlashList
            data={procedures}
            renderItem={({ item: { procedure } }) => (
              <ProcedureCard
                item={procedure}
                onPress={() => router.push(`/procedure/${procedure.id}/show`)}
              />
            )}
            getItemType={() => 'procedure'}
            keyExtractor={(item) => item.procedure.id.toString()}
            ItemSeparatorComponent={() => <View className="h-4" />}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
