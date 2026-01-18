import { Match } from 'effect';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeftCircle, Save } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import FilterForm from '~/components/ui/FilterForm';
import { db } from '~/db/db';
import { filterConditionTable, filterTable } from '~/db/schema';
import { Filter, FilterCondition } from '~/lib/condition';

export default function CreateFilter() {
  const intl = useIntl();

  const router = useRouter();
  const { colorScheme } = useColorScheme();

  return (
    <FilterForm
      filter={Filter.make({
        name: '',
        conditions: [] as Array<typeof FilterCondition.Type>,
      })}
      hasGoal={false}
      onSubmit={async (value) => {
        await db.transaction(async (tx) => {
          const [f] = await tx
            .insert(filterTable)
            .values({
              name: value.name,
              goal: value.hasGoal ? value.goal : null,
              combinator: value.combinator,
            })
            .returning({ id: filterTable.id });

          for (const condition of value.conditions) {
            await Match.value(condition).pipe(
              Match.tag('TEXT_CONDITION', (textCondition) =>
                tx
                  .insert(filterConditionTable)
                  .values({
                    filterId: f.id,
                    type: 'TEXT_CONDITION',
                    field: textCondition.field,
                    operator: textCondition.operator,
                    valueText: textCondition.value,
                  })
                  .execute(),
              ),
              Match.tag('NUMBER_CONDITION', (numberCondition) =>
                tx
                  .insert(filterConditionTable)
                  .values({
                    filterId: f.id,
                    type: 'NUMBER_CONDITION',
                    field: numberCondition.field,
                    operator: numberCondition.operator,
                    valueNumber: numberCondition.value,
                  })
                  .execute(),
              ),
              Match.tag('BOOLEAN_CONDITION', (booleanCondition) =>
                tx
                  .insert(filterConditionTable)
                  .values({
                    filterId: f.id,
                    type: 'BOOLEAN_CONDITION',
                    field: booleanCondition.field,
                    valueBoolean: booleanCondition.value,
                  })
                  .execute(),
              ),
              Match.tag('ENUM_CONDITION', (enumCondition) =>
                tx
                  .insert(filterConditionTable)
                  .values({
                    filterId: f.id,
                    type: 'ENUM_CONDITION',
                    field: enumCondition.field,
                    valueEnum: enumCondition.value,
                  })
                  .execute(),
              ),
              Match.exhaustive,
            );
          }
          router.back();
        });
      }}
    >
      {({ canSubmit, dismiss, save }) => (
        <Stack.Screen
          options={{
            title: intl.formatMessage({ id: 'create-filter.title' }),
            presentation: 'modal',
            headerLeft: () => (
              <PressableScale
                style={{ paddingHorizontal: 8 }}
                onPress={() => {
                  dismiss();
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
                style={{ paddingHorizontal: 8, opacity: canSubmit ? 1 : 0.5 }}
                onPress={() => {
                  if (!canSubmit) return;
                  save();
                }}
              >
                <Save size={24} color="#3B82F6" />
              </PressableScale>
            ),
          }}
        />
      )}
    </FilterForm>
  );
}
