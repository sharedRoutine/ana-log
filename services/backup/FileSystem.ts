import { Effect } from 'effect';
import { File, Paths } from 'expo-file-system';
import { defaultDatabaseDirectory } from 'expo-sqlite';
import { DATABASE_NAME } from '~/db/db';

export class FileSystem extends Effect.Service<FileSystem>()('FileSystem', {
  sync: () => ({
    dbPath: `${defaultDatabaseDirectory}/${DATABASE_NAME}`,
    cachePath: Paths.cache.uri,
    copyFile: (from: string, to: string) => Effect.sync(() => new File(from).copy(new File(to))),
    deleteFile: (path: string) => Effect.sync(() => new File(path).delete()),
  }),
  accessors: true,
}) {}
