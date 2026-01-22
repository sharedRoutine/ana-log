import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background-secondary p-6">
      <ActivityIndicator size="large" color="#3B82F6" />
      {message && (
        <Text className="mt-4 text-center text-base text-foreground-secondary">
          {message}
        </Text>
      )}
    </View>
  );
}
