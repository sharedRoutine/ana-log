import '../global.css';
import '../lib/nativewind-interop';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Duration } from 'effect';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { PressableScale } from 'pressto';
import { useState } from 'react';
import { IntlProvider, useIntl } from 'react-intl';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DataBackup from '~/components/home/DataBackup';
import { ErrorBoundary } from '~/components/layout/ErrorBoundary';
import { SpecialsPickerProvider } from '~/contexts/SpecialsPickerContext';
import { db } from '~/db/db';
import migrations from '../drizzle/migrations';
import deMessages from '../locales/de.json';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Duration.toMillis('1 minute'),
      retry: 3,
    },
  },
});

const getHeaderOptions = (
  colorScheme: 'light' | 'dark' | undefined,
): NativeStackNavigationOptions => ({
  headerShown: true,
  headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
  headerStyle: {
    backgroundColor: colorScheme === 'light' ? undefined : 'black',
  },
});

const getModalOptions = (
  colorScheme: 'light' | 'dark' | undefined,
): NativeStackNavigationOptions => ({
  ...getHeaderOptions(colorScheme),
  presentation: 'modal',
});

function MigrationErrorContent({
  error,
  onRetry,
}: {
  error: Error | undefined;
  onRetry: () => void;
}) {
  const intl = useIntl();
  return (
    <View className="flex-1 items-center justify-center bg-background-secondary p-6">
      <View className="max-w-[320px] items-center">
        <Text className="mb-3 text-center text-2xl font-bold text-foreground">
          {intl.formatMessage({ id: 'layout.database-error.title' })}
        </Text>
        <Text className="mb-4 text-center text-base leading-[22px] text-foreground-secondary">
          {intl.formatMessage({ id: 'layout.database-error.message' })}
        </Text>
        {error && (
          <Text className="mb-6 text-center font-mono text-xs text-foreground-tertiary">
            {error.message}
          </Text>
        )}
        <PressableScale
          className="rounded-xl bg-accent px-6 py-3"
          onPress={onRetry}
        >
          <Text className="text-base font-semibold text-white">
            {intl.formatMessage({ id: 'common.retry' })}
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

function MigrationErrorScreen({
  error,
  onRetry,
}: {
  error: Error | undefined;
  onRetry: () => void;
}) {
  return (
    <IntlProvider locale="de" messages={deMessages}>
      <MigrationErrorContent error={error} onRetry={onRetry} />
    </IntlProvider>
  );
}

function LayoutLoadingContent() {
  const intl = useIntl();
  return (
    <View className="flex-1 items-center justify-center bg-background-secondary">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="mt-4 text-base text-foreground-secondary">
        {intl.formatMessage({ id: 'layout.database-initializing' })}
      </Text>
    </View>
  );
}

function LayoutLoadingScreen() {
  return (
    <IntlProvider locale="de" messages={deMessages}>
      <LayoutLoadingContent />
    </IntlProvider>
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
      <GestureHandlerRootView className="flex-1">
        <LayoutLoadingScreen />
      </GestureHandlerRootView>
    );
  }

  if (!success && error) {
    return (
      <GestureHandlerRootView className="flex-1">
        <MigrationErrorScreen error={error} onRetry={handleRetry} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <IntlProvider locale="de" messages={deMessages}>
            <SpecialsPickerProvider>
              <Stack key={retryKey}>
                <Stack.Screen
                  name="index"
                  options={headerOptions}
                />
                <Stack.Screen name="procedure/create" options={modalOptions} />
                <Stack.Screen
                  name="procedure/[procedureId]/edit"
                  options={modalOptions}
                />
                <Stack.Screen
                  name="procedure/[procedureId]/show"
                  options={modalOptions}
                />
                <Stack.Screen
                  name="procedure/specials-picker"
                  options={headerOptions}
                />
                <Stack.Screen name="filters" options={modalOptions} />
                <Stack.Screen name="filter/create" options={modalOptions} />
                <Stack.Screen
                  name="filter/[filterId]/show"
                  options={modalOptions}
                />
                <Stack.Screen
                  name="filter/[filterId]/edit"
                  options={modalOptions}
                />
              </Stack>
            </SpecialsPickerProvider>
          </IntlProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
