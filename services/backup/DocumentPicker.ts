import { Effect } from 'effect'
import * as DocumentPicker from 'expo-document-picker'

export class DocumentPickerService extends Effect.Service<DocumentPickerService>()('DocumentPicker', {
  sync: () => ({
    pick: Effect.async<string, 'cancelled'>((resume) => {
      DocumentPicker.getDocumentAsync({
        type: ['application/x-sqlite3', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
      }).then((result) => {
        if (result.canceled) resume(Effect.fail('cancelled' as const))
        else resume(Effect.succeed(result.assets[0].uri))
      })
    }),
  }),
  accessors: true,
}) {}
