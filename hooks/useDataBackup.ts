import { useQueryClient } from '@tanstack/react-query';
import { Effect, Either, Layer } from 'effect';
import { useIntl } from 'react-intl';
import { Alert } from 'react-native';
import {
  FileSystem,
  DatabaseService,
  BackupKeyService,
  ICloudDriveService,
  backupToICloud,
  restoreFromICloud,
} from '~/services/backup';

const LiveLayer = Layer.mergeAll(
  FileSystem.Default,
  DatabaseService.Default,
  BackupKeyService.Default,
  ICloudDriveService.Default,
);

export function useDataBackup() {
  const intl = useIntl();
  const queryClient = useQueryClient();

  return {
    backupToICloudNow: Effect.fnUntraced(
      function* () {
        const result = yield* backupToICloud.pipe(Effect.either);
        Either.match(result, {
          onLeft: (error) => {
            Alert.alert(
              intl.formatMessage({ id: 'icloud.backup.failed.title' }),
              error.message,
            );
          },
          onRight: (written) => {
            if (written) {
              Alert.alert(
                intl.formatMessage({ id: 'icloud.backup.success.title' }),
                intl.formatMessage({ id: 'icloud.backup.success.message' }),
              );
            } else {
              Alert.alert(
                intl.formatMessage({ id: 'icloud.unavailable.title' }),
                intl.formatMessage({ id: 'icloud.unavailable.message' }),
              );
            }
          },
        });
      },
      Effect.provide(LiveLayer),
      Effect.runPromise,
    ),
    restoreFromICloud: Effect.fnUntraced(
      function* () {
        const result = yield* restoreFromICloud.pipe(Effect.either);
        if (Either.isLeft(result)) {
          Alert.alert(
            intl.formatMessage({ id: 'import.failed.title' }),
            result.left.message,
          );
          return;
        }
        if (!result.right) {
          Alert.alert(
            intl.formatMessage({ id: 'icloud.restore.none.title' }),
            intl.formatMessage({ id: 'icloud.restore.none.message' }),
          );
          return;
        }
        yield* Effect.promise(() => queryClient.invalidateQueries());
        Alert.alert(
          intl.formatMessage({ id: 'import.success.title' }),
          intl.formatMessage({ id: 'import.success.message' }),
        );
      },
      Effect.provide(LiveLayer),
      Effect.runPromise,
    ),
  };
}
