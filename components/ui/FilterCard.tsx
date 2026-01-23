import { GlassView } from 'expo-glass-effect';
import { HeartPulse } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View, Text } from 'react-native';

interface FilterCardProps {
  filter: {
    id: number;
    name: string;
  };
  matchingCount: number;
  onPress?: () => void;
}

export function FilterCard({
  filter,
  matchingCount,
  onPress,
}: FilterCardProps) {
  const intl = useIntl();

  return (
    <PressableScale
      onPress={onPress}
      key={filter.id}
      accessibilityLabel={intl.formatMessage(
        { id: 'filter.accessibility.card' },
        { name: filter.name, count: matchingCount },
      )}
      accessibilityRole="button"
      accessibilityHint={intl.formatMessage({
        id: 'filter.accessibility.hint',
      })}
      className="h-24 w-[48%]"
    >
      <GlassView
        glassEffectStyle="regular"
        className="h-full w-full justify-between rounded-2xl p-3 bg-background-secondary-light dark:bg-background-secondary-dark"
      >
        <View className="flex-row items-center justify-between">
          <HeartPulse
            size={24}
            color="#34D399"
          />
          <Text
            className="text-right text-3xl font-bold text-text-primary-light dark:text-text-primary-dark"
            numberOfLines={1}
          >
            {matchingCount}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text
            className="w-full text-sm font-medium text-text-primary-light dark:text-text-primary-dark"
            numberOfLines={2}
          >
            {filter.name}
          </Text>
        </View>
      </GlassView>
    </PressableScale>
  );
}
