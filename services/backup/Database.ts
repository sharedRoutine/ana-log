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
  procedureSpecialTable,
  procedureTable,
} from '~/db/schema';

export class DatabaseService extends Effect.Service<DatabaseService>()('Database', {
  sync: () => ({
    importFromBackup: (backupPath: string) =>
      Effect.acquireUseRelease(
        Effect.promise(async () => {
          const dbName = backupPath.split('/').pop() ?? 'backup.db';
          const directory = Paths.dirname(backupPath);
          const backupDb = drizzle(openDatabaseSync(dbName, {}, directory));
          await migrate(backupDb, migrations);
          return backupDb;
        }),
        (backupDb) =>
          Effect.promise(async () => {
            const procedures = await backupDb.select().from(procedureTable);
            const filters = await backupDb.select().from(filterTable);
            const procedureSpecials = await backupDb.select().from(procedureSpecialTable);
            const filterConditions = await backupDb.select().from(filterConditionTable);
            return db.transaction(async (tx) => {
              await tx.delete(procedureSpecialTable);
              await tx.delete(filterConditionTable);
              await tx.delete(procedureTable);
              await tx.delete(filterTable);
              if (procedures.length > 0) {
                await tx.insert(procedureTable).values(procedures);
              }
              if (filters.length > 0) {
                await tx.insert(filterTable).values(filters);
              }
              if (procedureSpecials.length > 0) {
                await tx.insert(procedureSpecialTable).values(procedureSpecials);
              }
              if (filterConditions.length > 0) {
                await tx.insert(filterConditionTable).values(filterConditions);
              }
            });
          }),
        (backupDb) => Effect.sync(() => backupDb.$client.closeSync())
      ),
  }),
  accessors: true,
}) {}
