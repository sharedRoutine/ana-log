import { useColorScheme } from 'nativewind';

interface ScreenHeaderOptions {
  title?: string;
  presentation?: 'modal' | 'card';
  headerShown?: boolean;
  headerLeft?: () => React.JSX.Element;
  headerRight?: () => React.JSX.Element;
}

export function useScreenHeaderOptions(): {
  headerTitleStyle: { color: string };
  headerStyle: { backgroundColor: string | undefined };
} {
  const { colorScheme } = useColorScheme();
  
  return {
    headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
    headerStyle: { backgroundColor: colorScheme === 'light' ? undefined : 'black' },
  };
}

export function createScreenOptions(options: ScreenHeaderOptions) {
  return (colorScheme: 'light' | 'dark') => ({
    ...options,
    headerTitleStyle: { color: colorScheme === 'light' ? '#000' : '#fff' },
    headerStyle: { backgroundColor: colorScheme === 'light' ? undefined : 'black' },
  });
}