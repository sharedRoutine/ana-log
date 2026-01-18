import { useIntl } from 'react-intl';
import { Alert } from 'react-native';
import { Effect, Either, Layer, Option } from 'effect';
import {
  FileSystem,
  SharingService,
  DocumentPickerService,
  DatabaseService,
  prepareBackup,
  importFromUri,
} from '~/services/backup';

const LiveLayer = Layer.mergeAll(
  FileSystem.Default,
  SharingService.Default,
  DocumentPickerService.Default,
  DatabaseService.Default
);

export function useDataBackup() {
  const intl = useIntl();

  return {
    exportDatabase: Effect.fnUntraced(
      function* () {
        const sharing = yield* SharingService;
        const backupPath = yield* prepareBackup;
        yield* sharing.share(backupPath, {
          mimeType: 'application/x-sqlite3',
          dialogTitle: intl.formatMessage({ id: 'home.export-data' }),
        });
      },
      Effect.provide(LiveLayer),
      Effect.scoped,
      Effect.runPromise
    ),
    importDatabase: Effect.fnUntraced(
      function* () {
        const picker = yield* DocumentPickerService;
        const uri = yield* picker.pick.pipe(Effect.option);
        if (Option.isNone(uri)) {
          return;
        }
        const result = yield* importFromUri(uri.value).pipe(Effect.either);
        Either.match(result, {
          onLeft: (error) => {
            Alert.alert(
              intl.formatMessage({ id: 'import.failed.title' }),
              error.message,
            );
          },
          onRight: () => {
            Alert.alert(
              intl.formatMessage({ id: 'import.success.title' }),
              intl.formatMessage({ id: 'import.success.message' })
            );
          },
        });
      },
      Effect.provide(LiveLayer),
      Effect.runPromise
    ),
  };
}
