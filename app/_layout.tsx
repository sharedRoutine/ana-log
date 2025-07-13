import '../global.css';

import { Stack } from 'expo-router';
import { IntlProvider } from 'react-intl';
import { useEffect } from 'react';
import deMessages from '../locales/de.json';
import { runMigrations } from '../db';

export default function Layout() {
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await runMigrations();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    
    initializeDatabase();
  }, []);

  return (
    <IntlProvider locale="de" messages={deMessages}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: true }} />
        <Stack.Screen 
          name="add-item" 
          options={{ 
            presentation: 'modal',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            presentation: 'modal',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="create-filter" 
          options={{ 
            presentation: 'modal',
            headerShown: true
          }} 
        />
      </Stack>
    </IntlProvider>
  );
}
