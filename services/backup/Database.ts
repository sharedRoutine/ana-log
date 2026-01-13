import { Effect } from 'effect';
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '~/db/db';
import migrations from '~/drizzle/migrations';

export class DatabaseService extends Effect.Service<DatabaseService>()('Database', {
  sync: () => ({
    migrateFile: (path: string) =>
      Effect.acquireUseRelease(
        Effect.sync(() => openDatabaseSync(path)),
        (sqlite) => Effect.promise(() => migrate(drizzle(sqlite), migrations)),
        (sqlite) => Effect.sync(() => sqlite.closeSync())
      ),
    importFromBackup: (backupPath: string) =>
      Effect.sync(() => {
        db.$client.execSync(`ATTACH DATABASE '${backupPath}' AS backup`);
        db.$client.execSync(`
          BEGIN TRANSACTION;
          DELETE FROM item_special;
          DELETE FROM filter_condition;
          DELETE FROM item;
          DELETE FROM filter;
          INSERT INTO item SELECT * FROM backup.item;
          INSERT INTO filter SELECT * FROM backup.filter;
          INSERT INTO item_special SELECT * FROM backup.item_special;
          INSERT INTO filter_condition SELECT * FROM backup.filter_condition;
          COMMIT;
        `);
        db.$client.execSync('DETACH DATABASE backup');
      }),
  }),
  accessors: true,
}) {}
