import { Effect, Layer } from 'effect';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import {
  backupToICloud,
  BackupKeyService,
  DatabaseService,
  FileSystem,
  ICloudDriveService,
} from '~/services/backup';

const AutoBackupLayer = Layer.mergeAll(
  FileSystem.Default,
  DatabaseService.Default,
  BackupKeyService.Default,
  ICloudDriveService.Default,
);

// Every time the app goes to the background, an encrypted snapshot is written
// to the app's iCloud Drive folder. Best-effort: failures are silent and the
// next backgrounding retries.
export function useAutoBackup() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'background') return;
      Effect.runPromise(
        backupToICloud.pipe(
          Effect.provide(AutoBackupLayer),
          Effect.catchAll(() => Effect.succeed(false)),
        ),
      ).catch(() => {});
    });
    return () => subscription.remove();
  }, []);
}
