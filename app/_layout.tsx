import '../global.css';
import '../lib/nativewind-interop';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Duration } from 'effect';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { PressableScale } from 'pressto';
import { ComponentProps, useState } from 'react';
import { IntlProvider, useIntl } from 'react-intl';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppLock } from '~/components/layout/AppLock';
import { ErrorBoundary } from '~/components/layout/ErrorBoundary';
import { SpecialsPickerProvider } from '~/contexts/SpecialsPickerContext';
import { db } from '~/db/db';
import { useAutoBackup } from '~/hooks/useAutoBackup';
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

const darkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#34D399',
    background: '#0B0F17',
    card: '#0B0F17',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.1)',
  },
};

const lightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#34D399',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    border: 'rgba(0, 0, 0, 0.1)',
  },
};

type StackScreenOptions = Extract<
  NonNullable<ComponentProps<typeof Stack.Screen>['options']>,
  object
>;

const getHeaderOptions = (
  colorScheme: 'light' | 'dark' | undefined,
): StackScreenOptions => ({
  headerShown: true,
  headerLargeTitle: true,
  headerShadowVisible: false,
  headerTintColor: '#34D399',
  headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
  headerLargeTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
});

const getModalOptions = (
  colorScheme: 'light' | 'dark' | undefined,
): StackScreenOptions => ({
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
  useAutoBackup();

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
              <AppLock>
                <ThemeProvider
                  value={colorScheme === 'dark' ? darkNavTheme : lightNavTheme}
                >
                  <Stack key={retryKey}>
                    <Stack.Screen name="index" options={headerOptions} />
                    <Stack.Screen
                      name="procedure/create"
                      options={modalOptions}
                    />
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
                </ThemeProvider>
              </AppLock>
            </SpecialsPickerProvider>
          </IntlProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
