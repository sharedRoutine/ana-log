import { LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { PressableScale } from 'pressto';
import { View, Text } from 'react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colorScheme } = useColorScheme();

  return (
    <View className="flex-1 items-center justify-center bg-background-secondary p-8">
      {Icon && (
        <View className="mb-4 opacity-60">
          <Icon
            size={48}
            color={colorScheme === 'light' ? '#6B7280' : '#8E8E93'}
          />
        </View>
      )}
      <Text className="mb-2 text-center text-xl font-semibold text-foreground">
        {title}
      </Text>
      <Text className="mb-6 text-center text-base leading-[22px] text-foreground-secondary">
        {message}
      </Text>
      {actionLabel && onAction && (
        <PressableScale
          className="rounded-xl bg-accent px-6 py-3"
          onPress={onAction}
        >
          <Text className="text-base font-semibold text-white">
            {actionLabel}
          </Text>
        </PressableScale>
      )}
    </View>
  );
}
