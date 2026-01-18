import { Effect, Clock } from 'effect';
import { Paths } from 'expo-file-system';
import { DatabaseService } from './Database';
import { FileSystem } from './FileSystem';

export const prepareBackup = Effect.gen(function* () {
  const fs = yield* FileSystem;
  const now = yield* Clock.currentTimeMillis;
  const backupPath = `${fs.cachePath}/ana-log-backup-${now}.db`;
  return yield* Effect.acquireRelease(
    Effect.zipRight(
      fs.copyFile(fs.dbPath, backupPath),
      Effect.succeed(backupPath),
    ),
    (path) => fs.deleteFile(path).pipe(Effect.catchAll(() => Effect.void)),
  );
});

export const importFromUri = Effect.fnUntraced(function* (uri: string) {
  const fs = yield* FileSystem;
  const database = yield* DatabaseService;
  const now = yield* Clock.currentTimeMillis;
  const tempPath = Paths.join(fs.cachePath, `restore-temp-${now}.db`).replace(
    'file://',
    '',
  );
  yield* Effect.acquireUseRelease(
    fs.copyFile(uri, tempPath),
    () =>
      Effect.gen(function* () {
        yield* database.importFromBackup(tempPath);
      }),
    () => fs.deleteFile(tempPath).pipe(Effect.catchAll(() => Effect.void)),
  );
});
