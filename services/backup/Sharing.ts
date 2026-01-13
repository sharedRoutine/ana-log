import { Effect } from 'effect'
import * as Sharing from 'expo-sharing'

export class SharingService extends Effect.Service<SharingService>()('Sharing', {
  sync: () => ({
    share: (uri: string, options: { mimeType: string; dialogTitle: string }) =>
      Effect.promise(() => Sharing.shareAsync(uri, options)),
  }),
  accessors: true,
}) {}
