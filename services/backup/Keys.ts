import { Effect } from 'effect';
import { getRandomBytes } from 'expo-crypto';
import * as Keychain from 'react-native-keychain';
import { toHexKey } from '~/db/db';

const BACKUP_KEY_SERVICE = 'me.jnsh.analog.backupkey';

// The backup key is generated once and stored in the iCloud Keychain
// (kSecAttrSynchronizable): end-to-end encrypted by Apple, synced across the
// user's devices, and it survives device loss — no password to remember.
// The primary database key stays device-only; only this backup key syncs.
export class BackupKeyService extends Effect.Service<BackupKeyService>()(
  'BackupKey',
  {
    sync: () => ({
      get: Effect.tryPromise(async () => {
        const credentials = await Keychain.getGenericPassword({
          service: BACKUP_KEY_SERVICE,
          cloudSync: true,
        }).catch(() => false as const);
        return credentials ? credentials.password : null;
      }),
      getOrCreate: Effect.tryPromise(async () => {
        const credentials = await Keychain.getGenericPassword({
          service: BACKUP_KEY_SERVICE,
          cloudSync: true,
        }).catch(() => false as const);
        if (credentials) return credentials.password;
        const key = toHexKey(getRandomBytes(32));
        await Keychain.setGenericPassword('analog-backup', key, {
          service: BACKUP_KEY_SERVICE,
          cloudSync: true,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        });
        return key;
      }),
    }),
    accessors: true,
  },
) {}
