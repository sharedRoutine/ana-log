import { Stack, useRouter } from 'expo-router';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIntl } from 'react-intl';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc, eq, count, and, or, like, gt, gte, lt, lte } from 'drizzle-orm';
import { FlashList } from '@shopify/flash-list';
import { Match } from 'effect';
import { db } from '~/db/db';
import { filterTable, itemTable, filterConditionTable } from '~/db/schema';
import { useColorScheme } from 'nativewind';
import { DEPARTMENT_OPTIONS } from '~/lib/options';

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

  const getDepartmentColor = (department: string) => {
    const colors: string[] = [
      '#EF4444',
      '#3B82F6',
      '#10B981',
      '#8B5CF6',
      '#F59E0B',
      '#DC2626',
      '#6B7280',
      '#EC4899',
      '#14B8A6',
      '#F97316',
      '#8B5CF6',
      '#06B6D4',
      '#84CC16',
      '#F59E0B',
      '#EF4444',
      '#6B7280',
    ];
    const index = DEPARTMENT_OPTIONS.indexOf(department as any);
    return colors[index] || '#6B7280';
  };

  const getTranslatedAirwayManagement = (airway: string) => {
    return intl.formatMessage({ id: `enum.airway-management.${airway}` });
  };

  const getTranslatedDepartment = (department: string) => {
    try {
      return intl.formatMessage({ id: `enum.department.${department}` });
    } catch {
      return department; // fallback to original if translation missing
    }
  };

  const getConditionCount = (filterId: number) => {
    const conditionData = filterConditions?.find((fc) => fc.filterId === filterId);
    return conditionData?.conditionCount || 0;
  };

  const getConditionText = (filterId: number) => {
    const count = getConditionCount(filterId);
    if (count === 1) {
      return intl.formatMessage({ id: 'filter.condition.single' });
    } else {
      return intl.formatMessage({ id: 'filter.condition.plural' }, { count });
    }
  };

  const buildWhereClause = (conditions: any[]) => {
    if (!conditions || conditions.length === 0) return undefined;

    const whereConditions = conditions
      .map((condition) => {
        const field = getTableField(condition.field);
        if (!field) return undefined;

        const value = Match.value(condition.type).pipe(
          Match.when('TEXT_CONDITION', () => condition.valueText),
          Match.when('NUMBER_CONDITION', () => condition.valueNumber),
          Match.when('BOOLEAN_CONDITION', () => condition.valueBoolean),
          Match.when('ENUM_CONDITION', () => condition.valueEnum),
          Match.orElse(() => null)
        );

        if (value == null) return undefined;

        return Match.value(condition.operator).pipe(
          Match.when('eq', () => eq(field, value)),
          Match.when('ct', () => like(field, `%${value}%`)),
          Match.when('gt', () => gt(field, value)),
          Match.when('gte', () => gte(field, value)),
          Match.when('lt', () => lt(field, value)),
          Match.when('lte', () => lte(field, value)),
          Match.when(null, () => eq(field, value)),
          Match.when(undefined, () => eq(field, value)),
          Match.orElse(() => undefined)
        );
      })
      .filter(Boolean);

    return whereConditions.length > 0 ? and(...whereConditions) : undefined;
  };

  const getTableField = (fieldName: string) => {
    return Match.value(fieldName).pipe(
      Match.when('department', () => itemTable.department),
      Match.when('asa-score', () => itemTable.asaScore),
      Match.when('airway-management', () => itemTable.airwayManagement),
      Match.when('case-number', () => itemTable.caseNumber),
      Match.when('procedure', () => itemTable.procedure),
      Match.when('outpatient', () => itemTable.outpatient),
      Match.when('age-years', () => itemTable.ageYears),
      Match.when('age-months', () => itemTable.ageMonths),
      Match.when('age', () => itemTable.ageYears),
      Match.when('date', () => itemTable.date),
      Match.when('specials', () => itemTable.specials),
      Match.when('local-anesthetics', () => itemTable.localAnesthetics),
      Match.orElse(() => undefined)
    );
  };

  const getMatchingProceduresCount = (filterId: number) => {
    if (!allFilterConditions) return 0;

    const conditions = allFilterConditions.filter((condition) => condition.filterId === filterId);
    if (conditions.length === 0) return -1;

    const whereClause = buildWhereClause(conditions);
    if (!whereClause) return 0;

    const [result] = db.select({ count: count() }).from(itemTable).where(whereClause).all();
    return result?.count || 0;
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'app.title' }),
          headerRight: () => (
            <View className="flex-row">
              <TouchableOpacity onPress={() => router.push('/settings')} className="mr-3">
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={colorScheme === 'light' ? '#000' : '#fff'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/add-item')} className="mr-2">
                <Ionicons name="add" size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <View className="bg-white px-4 pt-4 dark:bg-black">
        <TouchableOpacity
          onPress={() => router.push('/create-filter')}
          className="mb-4 rounded-lg border border-blue-300 bg-blue-100 p-3 dark:border-blue-700 dark:bg-blue-900">
          <View className="flex-row items-center justify-center">
            <Ionicons name="add" size={20} color="#3B82F6" />
            <Text className="ml-2 font-medium text-blue-600 dark:text-blue-300">
              {intl.formatMessage({ id: 'home.create-first-filter' })}
            </Text>
          </View>
        </TouchableOpacity>

        <View className="mb-6 flex-row flex-wrap gap-2">
          {filters.map((filter, index) => (
            <View
              key={filter.id}
              className="h-24 w-[48%] justify-between rounded-xl p-3"
              style={{
                backgroundColor: [
                  '#3B82F6',
                  '#EF4444',
                  '#10B981',
                  '#F59E0B',
                  '#8B5CF6',
                  '#EC4899',
                  '#06B6D4',
                  '#84CC16',
                ][index % 8],
              }}>
              <View className="flex-row items-start justify-between">
                <Text className="text-sm font-medium text-white" numberOfLines={1}>
                  {filter.name}
                </Text>
                <Text className="text-lg font-bold text-white">
                  {getMatchingProceduresCount(filter.id)}
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-1">
                <View className="rounded-full bg-white/20 px-2 py-0.5">
                  <Text className="text-xs text-white">{getConditionText(filter.id)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text className="mb-3 text-xl font-bold text-black dark:text-white">
          {intl.formatMessage({ id: 'home.my-procedures' }, { count: procedures?.length || 0 })}
        </Text>
      </View>

      <View className="flex-1 px-4">
        <FlashList
          data={procedures}
          renderItem={({ item }) => (
            <View className="mb-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-xl font-bold text-black dark:text-white">
                    {item.caseNumber}
                  </Text>
                  <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  className="rounded-full px-2 py-1"
                  style={{ backgroundColor: getDepartmentColor(item.department) }}>
                  <Text className="text-xs font-medium text-white">
                    {getTranslatedDepartment(item.department)}
                  </Text>
                </View>
              </View>

              <Text className="mt-2 text-base text-black dark:text-white">{item.procedure}</Text>

              <View className="mt-2 flex-row flex-wrap gap-2">
                <View className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-700">
                  <Text className="text-xs text-gray-700 dark:text-gray-300">
                    ASA {item.asaScore}
                  </Text>
                </View>
                <View className="rounded-full bg-blue-100 px-2 py-1 dark:bg-blue-900">
                  <Text className="text-xs text-blue-700 dark:text-blue-300">
                    {item.ageYears}y {item.ageMonths}m
                  </Text>
                </View>
                <View className="rounded-full bg-green-100 px-2 py-1 dark:bg-green-900">
                  <Text className="text-xs text-green-700 dark:text-green-300">
                    {getTranslatedAirwayManagement(item.airwayManagement)}
                  </Text>
                </View>
              </View>
            </View>
          )}
          getItemType={() => 'procedure'}
          keyExtractor={(item) => item.caseNumber}
        />
      </View>
    </View>
  );
}
