import { db } from '~/db/db';
import { procedureTable } from '~/db/schema';
import { eq, desc } from 'drizzle-orm';

export type Procedure = typeof procedureTable.$inferSelect;
export type NewProcedure = typeof procedureTable.$inferInsert;

export const procedureKeys = {
  all: ['procedures'] as const,
  lists: () => [...procedureKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...procedureKeys.lists(), filters] as const,
  details: () => [...procedureKeys.all, 'detail'] as const,
  detail: (id: string) => [...procedureKeys.details(), id] as const,
};

export async function getAllProcedures() {
  return db.select().from(procedureTable).orderBy(desc(procedureTable.date));
}

export async function getProcedureById(caseNumber: string) {
  const results = await db.select().from(procedureTable).where(eq(procedureTable.caseNumber, caseNumber));
  return results[0] ?? null;
}

export async function createProcedure(procedure: NewProcedure) {
  const results = await db.insert(procedureTable).values(procedure).returning();
  return results[0];
}

export async function updateProcedure(caseNumber: string, updates: Partial<NewProcedure>) {
  const results = await db
    .update(procedureTable)
    .set(updates)
    .where(eq(procedureTable.caseNumber, caseNumber))
    .returning();
  return results[0];
}

export async function deleteProcedure(caseNumber: string) {
  await db.delete(procedureTable).where(eq(procedureTable.caseNumber, caseNumber));
}
