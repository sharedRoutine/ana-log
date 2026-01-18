import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

export const DATABASE_NAME = 'ana-log.db';

export const db = drizzle(
  openDatabaseSync(DATABASE_NAME, { enableChangeListener: true }),
);
