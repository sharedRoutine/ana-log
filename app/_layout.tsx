import '../global.css';

import { Stack } from 'expo-router';
import { IntlProvider } from 'react-intl';
import deMessages from '../locales/de.json';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '~/db/db';
import migrations from '../drizzle/migrations';
import { useColorScheme } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text } from 'react-native';

const queryClient = new QueryClient();

export default function Layout() {
  const { success, error } = useMigrations(db, migrations);

  const { colorScheme } = useColorScheme();

  // TODO: Proper Error View with retry button
  if (!success) {
    return (
      <View>
        <Text>DB Error: {error?.message}</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
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
              name="procedure/create"
              options={{
                presentation: 'modal',
                headerShown: true,
                headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
                headerStyle: { backgroundColor: colorScheme === 'light' ? undefined : 'black' },
              }}
            />
            <Stack.Screen
              name="procedure/[procedureId]/edit"
              options={{
                presentation: 'modal',
                headerShown: true,
                headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
                headerStyle: { backgroundColor: colorScheme === 'light' ? undefined : 'black' },
              }}
            />
            <Stack.Screen
              name="filter/create"
              options={{
                presentation: 'modal',
                headerShown: true,
                headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
                headerStyle: { backgroundColor: colorScheme === 'light' ? undefined : 'black' },
              }}
            />
            <Stack.Screen
              name="filter/[filterId]/show"
              options={{
                presentation: 'modal',
                headerShown: true,
                headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
                headerStyle: { backgroundColor: colorScheme === 'light' ? undefined : 'black' },
              }}
            />
            <Stack.Screen
              name="filter/[filterId]/edit"
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
          </Stack>
        </IntlProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
