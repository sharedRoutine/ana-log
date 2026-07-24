import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { Effect } from 'effect';
import { Paths } from 'expo-file-system';
import { openDatabaseSync } from 'expo-sqlite';
import { canRead, db, getDatabaseKey, keyPragma } from '~/db/db';
import {
  filterConditionTable,
  filterTable,
  medicalCaseTable,
  procedureSpecialTable,
  procedureTable,
} from '~/db/schema';
import migrations from '~/drizzle/migrations';

export class DatabaseService extends Effect.Service<DatabaseService>()(
  'Database',
  {
    sync: () => ({
      vacuumInto: (path: string) =>
        Effect.try(() => {
          db.$client.execSync(`VACUUM INTO '${path.replace('file://', '')}'`);
        }),
      rekeyBackup: (name: string, directory: string, backupKey: string) =>
        Effect.try(() => {
          const client = openDatabaseSync(
            name,
            { useNewConnection: true },
            directory,
          );
          try {
            client.execSync(keyPragma(getDatabaseKey()));
            client.execSync(`PRAGMA rekey = "x'${backupKey}'";`);
          } finally {
            client.closeSync();
          }
        }),
      importFromBackup: (backupPath: string, backupKey: string | null) =>
        Effect.acquireUseRelease(
          Effect.tryPromise(async () => {
            const dbName = backupPath.split('/').pop() ?? 'backup.db';
            const directory = Paths.dirname(backupPath);
            const open = () =>
              openDatabaseSync(dbName, { useNewConnection: true }, directory);
            let client = open();
            if (backupKey) {
              client.execSync(keyPragma(backupKey));
              if (!canRead(client)) {
                // Legacy backups from pre-encryption builds are plaintext.
                client.closeSync();
                client = open();
              }
            }
            const backupDb = drizzle(client);
            await migrate(backupDb, migrations);
            return backupDb;
          }),
          (backupDb) =>
            Effect.tryPromise(async () => {
              const medicalCases = await backupDb
                .select()
                .from(medicalCaseTable);
              const procedures = await backupDb.select().from(procedureTable);
              const filters = await backupDb.select().from(filterTable);
              const procedureSpecials = await backupDb
                .select()
                .from(procedureSpecialTable);
              const filterConditions = await backupDb
                .select()
                .from(filterConditionTable);
              return db.transaction(async (tx) => {
                if (medicalCases.length > 0) {
                  await tx
                    .insert(medicalCaseTable)
                    .values(medicalCases)
                    .onConflictDoNothing();
                }
                if (procedures.length > 0) {
                  await tx
                    .insert(procedureTable)
                    .values(procedures)
                    .onConflictDoNothing();
                }
                if (filters.length > 0) {
                  await tx
                    .insert(filterTable)
                    .values(filters)
                    .onConflictDoNothing();
                }
                if (procedureSpecials.length > 0) {
                  await tx
                    .insert(procedureSpecialTable)
                    .values(procedureSpecials)
                    .onConflictDoNothing();
                }
                if (filterConditions.length > 0) {
                  await tx
                    .insert(filterConditionTable)
                    .values(filterConditions)
                    .onConflictDoNothing();
                }
              });
            }),
          (backupDb) => Effect.sync(() => backupDb.$client.closeSync()),
        ),
    }),
    accessors: true,
  },
) {}
