import { Effect, Clock } from 'effect';
import { Paths } from 'expo-file-system';
import { DatabaseService } from './Database';
import { FileSystem } from './FileSystem';
import { ICloudDriveService } from './ICloudDrive';
import { BackupKeyService } from './Keys';

export const ICLOUD_BACKUP_NAME = 'AnaLog-Backup.db';

// Snapshots the live database via VACUUM INTO (consistent even with WAL),
// then re-keys the copy from the device-only key to the iCloud-synced backup
// key so it can be restored on any of the user's devices.
export const prepareBackup = Effect.gen(function* () {
  const fs = yield* FileSystem;
  const database = yield* DatabaseService;
  const backupKeys = yield* BackupKeyService;
  const now = yield* Clock.currentTimeMillis;
  const name = `ana-log-backup-${now}.db`;
  const backupPath = Paths.join(fs.cachePath, name);
  return yield* Effect.acquireRelease(
    Effect.gen(function* () {
      yield* database.vacuumInto(backupPath);
      const backupKey = yield* backupKeys.getOrCreate;
      yield* database.rekeyBackup(
        name,
        fs.cachePath.replace('file://', ''),
        backupKey,
      );
      return backupPath;
    }),
    (path) => fs.deleteFile(path).pipe(Effect.catchAll(() => Effect.void)),
  );
});

export const importFromUri = Effect.fnUntraced(function* (uri: string) {
  const fs = yield* FileSystem;
  const database = yield* DatabaseService;
  const backupKeys = yield* BackupKeyService;
  const now = yield* Clock.currentTimeMillis;
  const tempPath = Paths.join(fs.cachePath, `restore-temp-${now}.db`).replace(
    'file://',
    '',
  );
  const backupKey = yield* backupKeys.get;
  yield* Effect.acquireUseRelease(
    fs.copyFile(uri, tempPath),
    () =>
      Effect.gen(function* () {
        yield* database.importFromBackup(tempPath, backupKey);
      }),
    () => fs.deleteFile(tempPath).pipe(Effect.catchAll(() => Effect.void)),
  );
});

// Writes the encrypted snapshot into the app's iCloud Drive folder — visible
// in Files under iCloud Drive > Ana|Log. Resolves to false when iCloud is
// unavailable (no account, disabled for the app). The new snapshot is staged
// next to the existing backup and only replaces it once fully written, so a
// failed upload never destroys the previous backup.
export const backupToICloud = Effect.gen(function* () {
  const fs = yield* FileSystem;
  const icloud = yield* ICloudDriveService;
  const documentsUrl = yield* icloud.documentsUrl;
  if (!documentsUrl) return false;
  const backupPath = yield* prepareBackup;
  const targetPath = Paths.join(documentsUrl, ICLOUD_BACKUP_NAME);
  const stagingPath = Paths.join(documentsUrl, `${ICLOUD_BACKUP_NAME}.staging`);
  yield* fs.deleteFile(stagingPath);
  yield* fs.copyFile(backupPath, stagingPath);
  yield* fs.deleteFile(targetPath);
  yield* fs.moveFile(stagingPath, targetPath);
  return true;
}).pipe(Effect.scoped);

export const restoreFromICloud = Effect.gen(function* () {
  const icloud = yield* ICloudDriveService;
  const documentsUrl = yield* icloud.documentsUrl;
  if (!documentsUrl) return false;
  const backupPath = Paths.join(documentsUrl, ICLOUD_BACKUP_NAME);
  const exists = yield* icloud.ensureDownloaded(backupPath);
  if (!exists) return false;
  yield* importFromUri(backupPath);
  return true;
});
