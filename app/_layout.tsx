import '../global.css';

import { Stack } from 'expo-router';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { IntlProvider } from 'react-intl';
import deMessages from '../locales/de.json';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '~/db/db';
import migrations from '../drizzle/migrations';
import { useColorScheme } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useMemo, useState, useCallback } from 'react';
import { ErrorBoundary } from '~/components/layout/ErrorBoundary';
import { PressableScale } from 'pressto';
import { Duration } from 'effect';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Duration.toMillis('1 minute'),
      retry: 3,
    },
  },
});

const getHeaderOptions = (
  colorScheme: 'light' | 'dark' | undefined
): NativeStackNavigationOptions => ({
  headerShown: true,
  headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
  headerStyle: { backgroundColor: colorScheme === 'light' ? undefined : 'black' },
});

const getModalOptions = (
  colorScheme: 'light' | 'dark' | undefined
): NativeStackNavigationOptions => ({
  ...getHeaderOptions(colorScheme),
  presentation: 'modal',
});

function MigrationErrorScreen({
  error,
  onRetry,
}: {
  error: Error | undefined;
  onRetry: () => void;
}) {
  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <Text style={styles.errorTitle}>Datenbank-Fehler</Text>
        <Text style={styles.errorMessage}>
          Die Datenbank konnte nicht initialisiert werden. Bitte starte die App neu.
        </Text>
        {error && <Text style={styles.errorDetails}>{error.message}</Text>}
        <PressableScale style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Erneut versuchen</Text>
        </PressableScale>
      </View>
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Datenbank wird initialisiert...</Text>
    </View>
  );
}

export default function Layout() {
  const [retryKey, setRetryKey] = useState(0);
  const { success, error } = useMigrations(db, migrations);
  const { colorScheme } = useColorScheme();

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  const headerOptions = useMemo(() => getHeaderOptions(colorScheme), [colorScheme]);
  const modalOptions = useMemo(() => getModalOptions(colorScheme), [colorScheme]);

  if (!success && !error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LoadingScreen />
      </GestureHandlerRootView>
    );
  }

  if (!success && error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MigrationErrorScreen error={error} onRetry={handleRetry} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <IntlProvider locale="de" messages={deMessages}>
            <Stack key={retryKey}>
              <Stack.Screen name="index" options={headerOptions} />
              <Stack.Screen name="procedure/create" options={modalOptions} />
              <Stack.Screen name="procedure/[procedureId]/edit" options={modalOptions} />
              <Stack.Screen name="procedure/[procedureId]/show" options={modalOptions} />
              <Stack.Screen name="filter/create" options={modalOptions} />
              <Stack.Screen name="filter/[filterId]/show" options={modalOptions} />
              <Stack.Screen name="filter/[filterId]/edit" options={modalOptions} />
              <Stack.Screen name="settings" options={modalOptions} />
            </Stack>
          </IntlProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  errorDetails: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
});
