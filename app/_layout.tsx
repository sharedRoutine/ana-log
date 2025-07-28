import '../global.css';

import { Stack } from 'expo-router';
import { IntlProvider } from 'react-intl';
import deMessages from '../locales/de.json';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '~/db/db';
import migrations from '../drizzle/migrations';

export default function Layout() {
  const { success, error } = useMigrations(db, migrations);

  return (
    <IntlProvider locale="de" messages={deMessages}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: true }} />
        <Stack.Screen
          name="add-item"
          options={{
            presentation: 'modal',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="create-filter"
          options={{
            presentation: 'modal',
            headerShown: true,
          }}
        />
      </Stack>
    </IntlProvider>
  );
}
