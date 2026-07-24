import { drizzle } from 'drizzle-orm/expo-sqlite';
import { getRandomBytes } from 'expo-crypto';
import { File } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import {
  defaultDatabaseDirectory,
  deleteDatabaseSync,
  openDatabaseSync,
  SQLiteDatabase,
} from 'expo-sqlite';

export const DATABASE_NAME = 'ana-log.db';

const DB_KEY_ID = 'analog.db.key.v1';

// The raw SQLCipher key lives exclusively in the Keychain, scoped to this
// device (never synced to iCloud) and only readable while the device is
// unlocked. Backups are re-keyed to a separate iCloud-synced key.
const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const toHexKey = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const keyPragma = (key: string) => `PRAGMA key = "x'${key}'";`;

export function getDatabaseKey(): string {
  const existing = SecureStore.getItem(DB_KEY_ID, KEYCHAIN_OPTIONS);
  if (existing) return existing;
  const key = toHexKey(getRandomBytes(32));
  SecureStore.setItem(DB_KEY_ID, key, KEYCHAIN_OPTIONS);
  return key;
}

export const canRead = (client: SQLiteDatabase) => {
  try {
    client.getFirstSync('SELECT count(*) FROM sqlite_master');
    return true;
  } catch {
    return false;
  }
};

// Pre-encryption installs have a plaintext database. SQLCipher's official
// upgrade path: export the plaintext content into a new keyed database,
// then swap the files.
const migratePlaintextToEncrypted = (key: string) => {
  const encryptedName = 'ana-log.encrypting.db';
  const encryptedPath = `${defaultDatabaseDirectory}/${encryptedName}`;

  try {
    deleteDatabaseSync(encryptedName);
  } catch {}

  const plain = openDatabaseSync(DATABASE_NAME);
  try {
    plain.execSync('PRAGMA wal_checkpoint(TRUNCATE);');
    plain.execSync(
      `ATTACH DATABASE '${encryptedPath}' AS encrypted KEY "x'${key}'";`,
    );
    plain.execSync(`SELECT sqlcipher_export('encrypted');`);
    plain.execSync('DETACH DATABASE encrypted;');
  } finally {
    plain.closeSync();
  }

  deleteDatabaseSync(DATABASE_NAME);
  new File(encryptedPath).move(
    new File(`${defaultDatabaseDirectory}/${DATABASE_NAME}`),
  );
};

const openEncryptedDatabase = () => {
  const key = getDatabaseKey();
  let client = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
  client.execSync(keyPragma(key));
  if (!canRead(client)) {
    client.closeSync();
    migratePlaintextToEncrypted(key);
    client = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
    client.execSync(keyPragma(key));
    client.getFirstSync('SELECT count(*) FROM sqlite_master');
  }
  return client;
};

export const db = drizzle(openEncryptedDatabase());
