import '../global.css';

import { Stack } from 'expo-router';
import { IntlProvider } from 'react-intl';
import deMessages from '../locales/de.json';

export default function Layout() {
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
