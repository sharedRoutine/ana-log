import { requireOptionalNativeModule } from 'expo-modules-core';

type ICloudDriveModule = {
  getDocumentsUrlAsync(): Promise<string | null>;
  ensureDownloadedAsync(url: string): Promise<boolean>;
};

export default requireOptionalNativeModule<ICloudDriveModule>('ICloudDrive');
