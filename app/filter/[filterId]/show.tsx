import { PlatformColor, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { ChevronLeftCircle } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useQuery } from '@tanstack/react-query';
import { db } from '~/db/db';
import { filterConditionTable, filterTable, itemTable } from '~/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { useFilterLogic } from '~/hooks/useFilterLogic';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { FlashList } from '@shopify/flash-list';
import { ProcedureCard } from '~/components/ui/ProcedureCard';
import { useColors } from '~/hooks/useColors';
import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gauge, Host } from '@expo/ui/swift-ui';

export default function ShowFilter() {
  const intl = useIntl();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const { filterId: filterIdParam } = useLocalSearchParams<{ filterId: string }>();
  const filterId = parseInt(filterIdParam, 10);

  const { getDepartmentColor } = useColors();

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

  const whereClause = useMemo(
    () => (isConditionsPending ? sql`1 = 0` : buildWhereClause(conditions || [])),
    [isConditionsPending, conditions, buildWhereClause]
  );

  const { data: procedures } = useLiveQuery(
    db.select().from(itemTable).where(whereClause).orderBy(desc(itemTable.date)),
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
        }}
      />
      <SafeAreaView edges={['bottom']} className="flex-1 bg-white dark:bg-black">
        {filters[0].goal ? (
          <View className="px-4 pt-6">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-3xl font-bold text-white">Ziel</Text>
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
          <Text className="text-white">
            {conditions.map((condition) => stringifyCondition(condition)).join(', ')}
          </Text>
        </View>
        <View className="flex-1 px-4 pt-4">
          <FlashList
            data={procedures}
            renderItem={({ item }) => (
              <ProcedureCard
                item={item}
                getDepartmentColor={getDepartmentColor}
                getTranslatedDepartment={(department) =>
                  intl.formatMessage({ id: `enum.department.${department}` })
                }
                getTranslatedAirwayManagement={(airwayManagement) =>
                  intl.formatMessage({ id: `enum.airway-management.${airwayManagement}` })
                }
              />
            )}
            getItemType={() => 'procedure'}
            keyExtractor={(item) => item.caseNumber}
            ItemSeparatorComponent={() => <View className="h-4" />}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
