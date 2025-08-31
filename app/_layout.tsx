import '../global.css';

import { Stack } from 'expo-router';
import { IntlProvider } from 'react-intl';
import deMessages from '../locales/de.json';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '~/db/db';
import migrations from '../drizzle/migrations';
import { useColorScheme } from 'nativewind';

export default function Layout() {
  const { success, error } = useMigrations(db, migrations);

  const { colorScheme } = useColorScheme();

  return (
    <IntlProvider locale="de" messages={deMessages}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
            headerStyle: { backgroundColor: colorScheme === 'light' ? undefined : 'black' },
          }}
        />
        <Stack.Screen
          name="upsert-item"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
            headerStyle: { backgroundColor: colorScheme === 'light' ? undefined : 'black' },
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
            headerStyle: { backgroundColor: colorScheme === 'light' ? undefined : 'black' },
          }}
        />
        <Stack.Screen
          name="create-filter"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
            headerStyle: { backgroundColor: colorScheme === 'light' ? undefined : 'black' },
          }}
        />
      </Stack>
    </IntlProvider>
  );
}
