import { eq } from 'drizzle-orm';
import { Match } from 'effect';
import type { FilterCondition } from '~/lib/condition';
import { db } from '~/db/db';
import { filterTable, filterConditionTable } from '~/db/schema';

export type Filter = typeof filterTable.$inferSelect;
export type FilterConditionRecord = typeof filterConditionTable.$inferSelect;
export type NewFilter = typeof filterTable.$inferInsert;
export type NewFilterCondition = typeof filterConditionTable.$inferInsert;

export const filterKeys = {
  all: ['filters'] as const,
  lists: () => [...filterKeys.all, 'list'] as const,
  details: () => [...filterKeys.all, 'detail'] as const,
  detail: (id: number) => [...filterKeys.details(), id] as const,
  conditions: (filterId: number) =>
    [...filterKeys.detail(filterId), 'conditions'] as const,
};

export async function getAllFilters() {
  return db.select().from(filterTable);
}

export async function getFilterById(id: number) {
  const results = await db
    .select()
    .from(filterTable)
    .where(eq(filterTable.id, id));
  return results[0] ?? null;
}

export async function getFilterConditions(filterId: number) {
  return db
    .select()
    .from(filterConditionTable)
    .where(eq(filterConditionTable.filterId, filterId));
}

export async function createFilter(
  filter: Omit<NewFilter, 'id' | 'createdAt' | 'updatedAt'>,
  conditions: Array<typeof FilterCondition.Type>,
) {
  return db.transaction(async (tx) => {
    const [createdFilter] = await tx
      .insert(filterTable)
      .values({ name: filter.name, goal: filter.goal })
      .returning({ id: filterTable.id });

    await insertFilterConditions(tx, createdFilter.id, conditions);

    return createdFilter;
  });
}

export async function updateFilter(
  filterId: number,
  filter: Partial<Omit<NewFilter, 'id' | 'createdAt'>>,
  conditions: Array<typeof FilterCondition.Type>,
) {
  return db.transaction(async (tx) => {
    await tx
      .update(filterTable)
      .set({ ...filter, updatedAt: Date.now() })
      .where(eq(filterTable.id, filterId));

    await tx
      .delete(filterConditionTable)
      .where(eq(filterConditionTable.filterId, filterId));
    await insertFilterConditions(tx, filterId, conditions);
  });
}

export async function deleteFilter(filterId: number) {
  await db.transaction(async (tx) => {
    await tx.delete(filterTable).where(eq(filterTable.id, filterId));
  });
}

export async function insertFilterConditions(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  filterId: number,
  conditions: Array<typeof FilterCondition.Type>,
) {
  for (const condition of conditions) {
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
          .execute(),
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
          .execute(),
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
          .execute(),
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
          .execute(),
      ),
      Match.exhaustive,
    );
  }
}
