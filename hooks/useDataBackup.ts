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

const getDatabasePath = () => `${Paths.document}/SQLite/${DATABASE_NAME}`;

export function useDataBackup() {
  const intl = useIntl();

  return {
    exportDatabase: async () => {
      db.$client.execSync('PRAGMA wal_checkpoint(FULL)');
  
      const dbFile = new File(getDatabasePath());
      const backupPath = `${Paths.cache}/ana-log-backup-${Date.now()}.db`;
      const backupFile = new File(backupPath);
  
      dbFile.copy(backupFile);
  
      try {
        await Sharing.shareAsync(backupFile.uri, {
          mimeType: 'application/x-sqlite3',
          dialogTitle: intl.formatMessage({ id: 'home.export-data' }),
        });
      } finally {
        backupFile.delete();
      }
    },
    importDatabase: async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/x-sqlite3', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
    
      if (result.canceled) {
        return;
      }
    
      const importResult = await importDatabaseFromFile(result.assets[0].uri);
    
      if (!importResult.success) {
        Alert.alert(
          intl.formatMessage({ id: 'import.error.title' }),
          intl.formatMessage({ id: 'import.error.invalid-format' })
        );
        return;
      }
    
      Alert.alert(
        intl.formatMessage({ id: 'import.success.title' }),
        intl.formatMessage({ id: 'import.success.message' })
      );
    }
  }
}

async function importDatabaseFromFile(
  fileUri: string
): Promise<{ success: boolean; error?: string }> {
  const tempPath = `${Paths.cache}/restore-temp-${Date.now()}.db`;
  const tempFile = new File(tempPath);

  try {
    const sourceFile = new File(fileUri);
    sourceFile.copy(tempFile);

    const tempSqlite = openDatabaseSync(tempPath);
    const tempDb = drizzle(tempSqlite);
    migrate(tempDb, migrations);
    tempSqlite.closeSync();

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
    tempFile.delete();

    return { success: true };
  } catch (error) {
    db.$client.execSync('ROLLBACK');
    db.$client.execSync('DETACH DATABASE backup');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    tempFile.delete();
  }
}