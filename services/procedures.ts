import { db } from '~/db/db';
import { itemTable } from '~/db/schema';
import { eq, desc } from 'drizzle-orm';

export type Procedure = typeof itemTable.$inferSelect;
export type NewProcedure = typeof itemTable.$inferInsert;

export const procedureKeys = {
  all: ['procedures'] as const,
  lists: () => [...procedureKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...procedureKeys.lists(), filters] as const,
  details: () => [...procedureKeys.all, 'detail'] as const,
  detail: (id: string) => [...procedureKeys.details(), id] as const,
};

export async function getAllProcedures() {
  return db.select().from(itemTable).orderBy(desc(itemTable.date));
}

export async function getProcedureById(caseNumber: string) {
  const results = await db.select().from(itemTable).where(eq(itemTable.caseNumber, caseNumber));
  return results[0] ?? null;
}

export async function createProcedure(procedure: NewProcedure) {
  const results = await db.insert(itemTable).values(procedure).returning();
  return results[0];
}

export async function updateProcedure(caseNumber: string, updates: Partial<NewProcedure>) {
  const results = await db
    .update(itemTable)
    .set(updates)
    .where(eq(itemTable.caseNumber, caseNumber))
    .returning();
  return results[0];
}

export async function deleteProcedure(caseNumber: string) {
  await db.delete(itemTable).where(eq(itemTable.caseNumber, caseNumber));
}
