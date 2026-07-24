import { HeartPulse, Check } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View, Text } from 'react-native';
import { ACCENT, contrastText } from './Form';

interface FilterCardProps {
  filter: {
    id: number;
    name: string;
    goal: number | null;
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
  const isComplete = filter.goal !== null && matchingCount >= filter.goal;
  const progress =
    filter.goal !== null && filter.goal > 0
      ? Math.min(1, matchingCount / filter.goal)
      : null;

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
      <View className="h-full w-full justify-between rounded-2xl border border-black/5 bg-background-secondary-light p-3 dark:border-white/5 dark:bg-background-secondary-dark">
        <View className="flex-row items-center justify-between">
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{
              backgroundColor: isComplete ? ACCENT : `${ACCENT}26`,
            }}
          >
            {isComplete ? (
              <Check size={16} color={contrastText(ACCENT)} strokeWidth={3} />
            ) : (
              <HeartPulse size={16} color={ACCENT} />
            )}
          </View>
          <Text className="text-right text-2xl font-bold tabular-nums text-text-primary-light dark:text-text-primary-dark">
            {matchingCount}
          </Text>
        </View>
        <View className="gap-1.5">
          <Text
            className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark"
            numberOfLines={1}
          >
            {filter.name}
          </Text>
          {progress !== null && (
            <View className="h-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <View
                className="h-full rounded-full"
                style={{ width: `${progress * 100}%`, backgroundColor: ACCENT }}
              />
            </View>
          )}
        </View>
      </View>
    </PressableScale>
  );
}
