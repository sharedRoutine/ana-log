import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View, Text } from 'react-native';

interface FilterCardProps {
  filter: {
    id: number;
    name: string;
  };
  conditionText: string;
  matchingCount: number;
  onPress?: () => void;
}

export function FilterCard({
  filter,
  conditionText,
  matchingCount,
  onPress,
}: FilterCardProps) {
  const intl = useIntl();
  const hasGlassEffect = isLiquidGlassAvailable();

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
      className="h-24 w-[47%]"
    >
      <GlassView
        glassEffectStyle="regular"
        className="h-full w-full justify-between rounded-2xl border border-card-border p-3"
        style={!hasGlassEffect && { backgroundColor: 'rgba(255,255,255,0.85)' }}
      >
        <View className="flex-row items-center justify-between">
          <Text
            className="w-2/3 text-sm font-medium text-foreground"
            numberOfLines={2}
          >
            {filter.name}
          </Text>
          <Text
            className="w-1/3 text-right text-lg font-bold text-foreground"
            numberOfLines={1}
          >
            {matchingCount}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-1">
          <View className="rounded-full bg-border px-2 py-1">
            <Text className="text-xs text-foreground-secondary">
              {conditionText}
            </Text>
          </View>
        </View>
      </GlassView>
    </PressableScale>
  );
}
