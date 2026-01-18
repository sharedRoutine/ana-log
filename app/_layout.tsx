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
import { SpecialsPickerProvider } from '~/contexts/SpecialsPickerContext';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
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
  colorScheme,
}: {
  error: Error | undefined;
  onRetry: () => void;
  colorScheme: 'light' | 'dark' | undefined;
}) {
  const isLight = colorScheme === 'light';
  return (
    <View style={[styles.errorContainer, isLight && styles.errorContainerLight]}>
      <View style={styles.errorContent}>
        <Text style={[styles.errorTitle, isLight && styles.errorTitleLight]}>Datenbank-Fehler</Text>
        <Text style={[styles.errorMessage, isLight && styles.errorMessageLight]}>
          Die Datenbank konnte nicht initialisiert werden. Bitte starte die App neu.
        </Text>
        {error && (
          <Text style={[styles.errorDetails, isLight && styles.errorDetailsLight]}>
            {error.message}
          </Text>
        )}
        <PressableScale style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Erneut versuchen</Text>
        </PressableScale>
      </View>
    </View>
  );
}

function LoadingScreen({ colorScheme }: { colorScheme: 'light' | 'dark' | undefined }) {
  const isLight = colorScheme === 'light';
  return (
    <View style={[styles.loadingContainer, isLight && styles.loadingContainerLight]}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={[styles.loadingText, isLight && styles.loadingTextLight]}>
        Datenbank wird initialisiert...
      </Text>
    </View>
  );
}

export default function Layout() {
  const [retryKey, setRetryKey] = useState(0);
  const { success, error } = useMigrations(db, migrations);
  const { colorScheme } = useColorScheme();

  const handleRetry = () => {
    setRetryKey((k) => k + 1);
  };

  const headerOptions = getHeaderOptions(colorScheme);
  const modalOptions = getModalOptions(colorScheme);

  if (!success && !error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LoadingScreen colorScheme={colorScheme} />
      </GestureHandlerRootView>
    );
  }

  if (!success && error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MigrationErrorScreen error={error} onRetry={handleRetry} colorScheme={colorScheme} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <IntlProvider locale="de" messages={deMessages}>
            <SpecialsPickerProvider>
              <Stack key={retryKey}>
                <Stack.Screen name="index" options={headerOptions} />
                <Stack.Screen name="procedure/create" options={modalOptions} />
                <Stack.Screen name="procedure/[procedureId]/edit" options={modalOptions} />
                <Stack.Screen name="procedure/[procedureId]/show" options={modalOptions} />
                <Stack.Screen name="procedure/specials-picker" options={headerOptions} />
                <Stack.Screen name="filter/create" options={modalOptions} />
                <Stack.Screen name="filter/[filterId]/show" options={modalOptions} />
                <Stack.Screen name="filter/[filterId]/edit" options={modalOptions} />
              </Stack>
            </SpecialsPickerProvider>
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
  errorContainerLight: {
    backgroundColor: '#F8FAFC',
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
  errorTitleLight: {
    color: '#1F2937',
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  errorMessageLight: {
    color: '#6B7280',
  },
  errorDetails: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  errorDetailsLight: {
    color: '#9CA3AF',
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
  loadingContainerLight: {
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  loadingTextLight: {
    color: '#6B7280',
  },
});
