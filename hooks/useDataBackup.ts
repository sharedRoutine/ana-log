import { useIntl } from 'react-intl';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import { DATABASE_NAME, db } from '~/db/db';
import migrations from '~/drizzle/migrations';
import { Alert } from 'react-native';
import { Clock, Effect } from 'effect';

const getDatabasePath = () => `${Paths.document}/SQLite/${DATABASE_NAME}`;

const prepareBackupFile = Effect.gen(function* () {
  const now = yield* Clock.currentTimeMillis;
  const dbFile = yield* Effect.sync(() => new File(getDatabasePath()));
  const backupPath = `${Paths.cache}/ana-log-backup-${now}.db`;
  const backupFile = yield* Effect.acquireRelease(
    Effect.sync(() => new File(backupPath)),
    (file) => Effect.sync(() => file.delete())
  );
  dbFile.copy(backupFile);
  return backupFile;
});

const importDatabase = Effect.fnUntraced(function* (fileUri: string) {
  const tempPath = `${Paths.cache}/restore-temp-${Date.now()}.db`;
  const tempFile = yield* Effect.acquireRelease(
    Effect.sync(() => new File(tempPath)),
    (file) => Effect.sync(() => file.delete())
  );
  const sourceFile = new File(fileUri);
  sourceFile.copy(tempFile);
  const tempSqlite = yield* Effect.acquireRelease(
    Effect.sync(() => openDatabaseSync(tempPath)),
    (sqlite) => Effect.sync(() => sqlite.closeSync())
  );
  const tempDb = drizzle(tempSqlite);
  yield* Effect.sync(() => migrate(tempDb, migrations));
  db.$client.execSync(`ATTACH DATABASE '${tempPath}' AS backup`);
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
});

export function useDataBackup() {
  const intl = useIntl();

  return {
    exportDatabase: async () => Effect.runPromise(
      Effect.gen(function* () {
        const backupFile = yield* prepareBackupFile;
        yield* Effect.promise(() => Sharing.shareAsync(backupFile.uri, {
          mimeType: 'application/x-sqlite3',
          dialogTitle: intl.formatMessage({ id: 'home.export-data' }),
        }));
      }).pipe(Effect.scoped)
    ),
    importDatabase: async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/x-sqlite3', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
    
      if (result.canceled) {
        return;
      }
    
      await Effect.runPromise(
        Effect.gen(function* () {
          yield* importDatabase(result.assets[0].uri);
          Alert.alert(
            intl.formatMessage({ id: 'import.success.title' }),
            intl.formatMessage({ id: 'import.success.message' })
          );
        }).pipe(Effect.scoped)
      );
      Alert.alert(
        intl.formatMessage({ id: 'import.success.title' }),
        intl.formatMessage({ id: 'import.success.message' })
      );
    }
  }
}
