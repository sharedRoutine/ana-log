import { Effect } from 'effect';
import ICloudDrive from '~/modules/icloud-drive';

export class ICloudDriveService extends Effect.Service<ICloudDriveService>()(
  'ICloudDrive',
  {
    sync: () => ({
      documentsUrl: Effect.tryPromise(async () =>
        ICloudDrive ? await ICloudDrive.getDocumentsUrlAsync() : null,
      ),
      ensureDownloaded: (url: string) =>
        Effect.tryPromise(async () =>
          ICloudDrive ? await ICloudDrive.ensureDownloadedAsync(url) : false,
        ),
    }),
    accessors: true,
  },
) {}
