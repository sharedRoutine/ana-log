import { useColorScheme } from 'nativewind';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { colorScheme } = useColorScheme();
  const isLight = colorScheme === 'light';

  return (
    <View style={[styles.container, isLight && styles.containerLight]}>
      <ActivityIndicator size="large" color="#3B82F6" />
      {message && (
        <Text style={[styles.message, isLight && styles.messageLight]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  containerLight: {
    backgroundColor: '#F8FAFC',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  messageLight: {
    color: '#6B7280',
  },
});
