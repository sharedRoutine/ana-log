import { Effect } from 'effect';
import { Paths } from 'expo-file-system/next';
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '~/db/db';
import migrations from '~/drizzle/migrations';
import {
  filterConditionTable,
  filterTable,
  medicalCaseTable,
  procedureSpecialTable,
  procedureTable,
} from '~/db/schema';

export class DatabaseService extends Effect.Service<DatabaseService>()('Database', {
  sync: () => ({
    importFromBackup: (backupPath: string) =>
      Effect.acquireUseRelease(
        Effect.tryPromise(async () => {
          const dbName = backupPath.split('/').pop() ?? 'backup.db';
          const directory = Paths.dirname(backupPath);
          const backupDb = drizzle(openDatabaseSync(dbName, {}, directory));
          await migrate(backupDb, migrations);
          return backupDb;
        }),
        (backupDb) =>
          Effect.tryPromise(async () => {
            const medicalCases = await backupDb.select().from(medicalCaseTable);
            const procedures = await backupDb.select().from(procedureTable);
            const filters = await backupDb.select().from(filterTable);
            const procedureSpecials = await backupDb.select().from(procedureSpecialTable);
            const filterConditions = await backupDb.select().from(filterConditionTable);
            return db.transaction(async (tx) => {
              if (medicalCases.length > 0) {
                await tx.insert(medicalCaseTable).values(medicalCases).onConflictDoNothing();
              }
              if (procedures.length > 0) {
                await tx.insert(procedureTable).values(procedures).onConflictDoNothing();
              }
              if (filters.length > 0) {
                await tx.insert(filterTable).values(filters).onConflictDoNothing();
              }
              if (procedureSpecials.length > 0) {
                await tx.insert(procedureSpecialTable).values(procedureSpecials).onConflictDoNothing();
              }
              if (filterConditions.length > 0) {
                await tx.insert(filterConditionTable).values(filterConditions).onConflictDoNothing();
              }
            });
          }),
        (backupDb) => Effect.sync(() => backupDb.$client.closeSync())
      ),
  }),
  accessors: true,
}) { }
