import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { ChevronLeftCircle, Save, FilterX } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import FilterForm from '~/components/ui/FilterForm';
import { db } from '~/db/db';
import { Match } from 'effect';
import { filterConditionTable, filterTable } from '~/db/schema';
import { Filter } from '~/lib/condition';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { convertConditions } from '~/db/conversions';
import { LoadingScreen } from '~/components/layout/LoadingScreen';
import { EmptyState } from '~/components/layout/EmptyState';

export default function EditFilter() {
  const intl = useIntl();
  const { colorScheme } = useColorScheme();

  const router = useRouter();
  const queryClient = useQueryClient();

  const { filterId: filterIdParam } = useLocalSearchParams<{ filterId: string }>();
  const filterId = parseInt(filterIdParam, 10);

  const { data, isPending } = useQuery({
    queryKey: ['filter', filterId],
    queryFn: () => db.select().from(filterTable).where(eq(filterTable.id, filterId)),
  });

  const { data: conditions, isPending: isConditionsPending } = useQuery({
    queryKey: ['filter', filterId, 'conditions'],
    queryFn: () =>
      db.select().from(filterConditionTable).where(eq(filterConditionTable.filterId, filterId)),
  });

  if (isPending || isConditionsPending) {
    return <LoadingScreen />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={FilterX}
        title={intl.formatMessage({ id: 'filter.not-found.title' })}
        message={intl.formatMessage({ id: 'filter.not-found.message' })}
        actionLabel={intl.formatMessage({ id: 'common.go-back' })}
        onAction={() => router.back()}
      />
    );
  }

  return (
    <FilterForm
      filter={Filter.make({
        name: data[0].name,
        goal: data[0].goal ?? undefined,
        conditions: convertConditions(conditions || []),
      })}
      hasGoal={data[0].goal !== null}
      isEditing={true}
      onDelete={async () => {
        await db.transaction(async (tx) => {
          await tx.delete(filterTable).where(eq(filterTable.id, filterId));
          await tx.delete(filterConditionTable).where(eq(filterConditionTable.filterId, filterId));
        });
        await queryClient.invalidateQueries({ queryKey: ['filter', filterId] });
        router.dismissAll();
      }}
      onSubmit={async (value) => {
        await db.transaction(async (tx) => {
          await tx
            .update(filterTable)
            .set({ name: value.name, goal: value.goal })
            .where(eq(filterTable.id, filterId));
          await tx.delete(filterConditionTable).where(eq(filterConditionTable.filterId, filterId));

          for (const condition of value.conditions) {
            await Match.value(condition).pipe(
              Match.tag('TEXT_CONDITION', (textCondition) =>
                tx
                  .insert(filterConditionTable)
                  .values({
                    filterId,
                    type: 'TEXT_CONDITION',
                    field: textCondition.field,
                    operator: textCondition.operator,
                    valueText: textCondition.value,
                  })
                  .execute()
              ),
              Match.tag('NUMBER_CONDITION', (numberCondition) =>
                tx
                  .insert(filterConditionTable)
                  .values({
                    filterId,
                    type: 'NUMBER_CONDITION',
                    field: numberCondition.field,
                    operator: numberCondition.operator,
                    valueNumber: numberCondition.value,
                  })
                  .execute()
              ),
              Match.tag('BOOLEAN_CONDITION', (booleanCondition) =>
                tx
                  .insert(filterConditionTable)
                  .values({
                    filterId,
                    type: 'BOOLEAN_CONDITION',
                    field: booleanCondition.field,
                    valueBoolean: booleanCondition.value,
                  })
                  .execute()
              ),
              Match.tag('ENUM_CONDITION', (enumCondition) =>
                tx
                  .insert(filterConditionTable)
                  .values({
                    filterId,
                    type: 'ENUM_CONDITION',
                    field: enumCondition.field,
                    valueEnum: enumCondition.value,
                  })
                  .execute()
              ),
              Match.exhaustive
            );
          }
        });
        await queryClient.invalidateQueries({ queryKey: ['filter', filterId] });
        router.back();
      }}>
      {({ dismiss, canSubmit, save }) => (
        <Stack.Screen
          options={{
            title: intl.formatMessage({ id: 'edit-filter.title' }),
            presentation: 'modal',
            headerLeft: () => (
              <PressableScale style={{ paddingHorizontal: 8 }} onPress={dismiss}>
                <ChevronLeftCircle size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
              </PressableScale>
            ),
            headerRight: () => (
              <PressableScale
                style={{ paddingHorizontal: 8, opacity: canSubmit ? 1 : 0.5 }}
                onPress={() => {
                  if (!canSubmit) return;
                  save();
                }}>
                <Save size={24} color="#3B82F6" />
              </PressableScale>
            ),
          }}
        />
      )}
    </FilterForm>
  );
}
